import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';

const MARCI = ['Audi', 'BMW', 'Dacia', 'Ford', 'Mercedes-Benz', 'Renault', 'Skoda', 'Toyota', 'Volkswagen'];
const ANI = Array.from({ length: 2027 - 1960 }, (_, i) => 2027 - i);

// Normalizează combustibilul la același format ca seed-ul
const normCombustibil = (val) => {
  if (!val) return '';
  const t = val.toLowerCase();
  if (t.includes('motorin') || t.includes('diesel')) return 'diesel';
  if (t.includes('benzin') || t.includes('gasoline') || t.includes('petrol')) return 'benzina';
  if (t.includes('electric')) return 'electric';
  if (t.includes('hibrid') || t.includes('hybrid')) return 'hibrid';
  if (t.includes('gpl') || t.includes('lpg')) return 'gpl';
  if (t.includes('gnc') || t.includes('cng')) return 'gnc';
  return t;
};

// Extrage cilindree aproximativă din string-ul motorului (ex: "2.0 TDI 140" → 2000)
const ccDinMotor = (motor) => {
  const m = motor?.match(/^(\d+)\.(\d)/);
  if (!m) return null;
  return parseInt(m[1]) * 1000 + parseInt(m[2]) * 100;
};

const Scanner = () => {
  const navigate = useNavigate();
  const inputRef = useRef();
  const ocrRef = useRef(null); // date brute OCR — ref ca să evit stale closures

  const [etapa, setEtapa] = useState('upload');
  const [imagine, setImagine] = useState(null);
  const [preview, setPreview] = useState(null);
  const [ocrExtra, setOcrExtra] = useState(null);

  const formGol = {
    marca: '', model: '', an: '', motor: '',
    vin: '', numarInmatriculare: '', kilometrajCurent: '',
    dataITP: '', dataRCA: '', dataRovinieta: '',
    ultimulSchimbUleiData: '', ultimulSchimbUleiKilometraj: ''
  };
  const [form, setForm] = useState(formGol);
  const [modele, setModele] = useState([]);
  const [motorizari, setMotorizari] = useState([]);
  const [loadingModele, setLoadingModele] = useState(false);
  const [loadingMotorizari, setLoadingMotorizari] = useState(false);
  const [salvand, setSalvand] = useState(false);

  // ── Fetch modele + auto-selectează model din OCR (case-insensitiv) ─────────
  useEffect(() => {
    if (!form.marca) { setModele([]); setMotorizari([]); return; }
    setLoadingModele(true);
    api.get(`/specs/modele?marca=${encodeURIComponent(form.marca)}`)
      .then(r => {
        setModele(r.data);
        const ocrModel = ocrRef.current?.model;
        if (ocrModel) {
          const match = r.data.find(m => m.toLowerCase() === ocrModel.toLowerCase());
          if (match) setForm(f => ({ ...f, model: match, motor: '' }));
        }
      })
      .catch(() => setModele([]))
      .finally(() => setLoadingModele(false));
  }, [form.marca]);

  // ── Fetch motorizări + auto-selectează pe baza combustibil + cilindree ─────
  useEffect(() => {
    if (!form.marca || !form.model || !form.an) { setMotorizari([]); return; }
    setLoadingMotorizari(true);
    api.get(`/specs/motorizari?marca=${encodeURIComponent(form.marca)}&model=${encodeURIComponent(form.model)}&an=${form.an}`)
      .then(r => {
        setMotorizari(r.data);
        const ocr = ocrRef.current;
        if (!ocr || r.data.length === 0) return;

        const combustNorm = normCombustibil(ocr.combustibil);
        const cilindree = ocr.cilindree;

        // Filtrează după combustibil
        let candidati = combustNorm
          ? r.data.filter(m => normCombustibil(m.tipCombustibil) === combustNorm)
          : r.data;

        if (candidati.length === 0) candidati = r.data;

        // Dacă avem cilindree, alege cel mai apropiat ca displacement
        if (cilindree && candidati.length > 0) {
          const cuDiff = candidati
            .map(m => ({ motor: m.motor, diff: Math.abs((ccDinMotor(m.motor) ?? 9999) - cilindree) }))
            .sort((a, b) => a.diff - b.diff);

          // Auto-selectează dacă cel mai bun e sub 200cc distanță
          if (cuDiff[0].diff <= 200) {
            setForm(f => ({ ...f, motor: cuDiff[0].motor }));
          }
        } else if (candidati.length === 1) {
          setForm(f => ({ ...f, motor: candidati[0].motor }));
        }
      })
      .catch(() => setMotorizari([]))
      .finally(() => setLoadingMotorizari(false));
  }, [form.marca, form.model, form.an]);

  const handleFisier = (fisier) => {
    if (!fisier || !fisier.type.startsWith('image/')) return;
    setImagine(fisier);
    setPreview(URL.createObjectURL(fisier));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFisier(e.dataTransfer.files[0]);
  };

  const handleAnalizeaza = async () => {
    setEtapa('loading');
    try {
      const fd = new FormData();
      fd.append('imagine', imagine);
      const { data } = await api.post('/ocr/proceseaza', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const d = data.dateExtrase || {};

      // Salvează datele brute în ref — folosit de useEffect-uri
      ocrRef.current = d;

      setOcrExtra({
        combustibil: d.combustibil || null,
        cilindree: d.cilindree || null,
      });

      // Pre-completează formularul cu ce s-a extras
      // model = '' intenționat — va fi setat de useEffect după ce modele se încarcă
      setForm({
        marca: MARCI.includes(d.marca) ? d.marca : '',
        model: '',
        an: d.an ? String(d.an) : '',
        motor: '',
        vin: d.vin || '',
        numarInmatriculare: d.numarInmatriculare || '',
        kilometrajCurent: '',
        dataITP: d.dataITP ? isoToDate(d.dataITP) : '',
        dataRCA: d.dataRCA ? isoToDate(d.dataRCA) : '',
        dataRovinieta: '',
        ultimulSchimbUleiData: '',
        ultimulSchimbUleiKilometraj: ''
      });

      setEtapa('form');
    } catch (err) {
      toast.error(err.response?.data?.mesaj || 'Eroare la procesare imagine');
      setEtapa('upload');
    }
  };

  const handleSalveaza = async (e) => {
    e.preventDefault();
    if (!form.marca || !form.model || !form.an || !form.motor) {
      toast.error('Marca, modelul, anul și motorizarea sunt obligatorii');
      return;
    }
    setSalvand(true);
    try {
      const payload = {
        marca: form.marca, model: form.model,
        an: Number(form.an), motor: form.motor,
        numarInmatriculare: form.numarInmatriculare || undefined,
        kilometrajCurent: Number(form.kilometrajCurent) || 0,
        dataITP: form.dataITP || null,
        dataRCA: form.dataRCA || null,
        dataRovinieta: form.dataRovinieta || null,
        ultimulSchimbUlei: {
          data: form.ultimulSchimbUleiData || null,
          kilometraj: Number(form.ultimulSchimbUleiKilometraj) || null
        }
      };
      if (form.vin?.trim()) payload.vin = form.vin.trim();

      const res = await api.post('/vehicles', payload);
      await api.post(`/reminders/genereaza/${res.data._id}`);
      toast.success('Vehicul creat cu succes!');
      navigate('/vehicule');
    } catch (err) {
      toast.error(err.response?.data?.mesaj || 'Eroare la salvare');
    } finally {
      setSalvand(false);
    }
  };

  const reset = () => {
    setEtapa('upload');
    setImagine(null);
    setPreview(null);
    setForm(formGol);
    setOcrExtra(null);
    ocrRef.current = null;
    setModele([]);
    setMotorizari([]);
  };

  const setF = (key, val) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div style={s.pagina}>
      <nav style={s.navbar}>
        <div style={s.navLeft}>
          <button onClick={() => navigate(-1)} style={s.backBtn}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <span style={s.navTitlu}>{etapa === 'form' ? 'Verifică datele' : 'Scanner OCR'}</span>
        </div>
        {etapa !== 'loading' && etapa !== 'upload' && (
          <button onClick={reset} style={s.resetBtn}>RESCANEAZĂ</button>
        )}
      </nav>

      <main style={s.main}>

        {/* ── UPLOAD ─────────────────────────────────────────── */}
        {etapa === 'upload' && (
          <>
            <div
              style={{ ...s.dropZone, ...(preview ? s.dropZoneActive : {}) }}
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => !preview && inputRef.current.click()}
            >
              {preview
                ? <img src={preview} alt="preview" style={s.previewImg} />
                : (
                  <div style={s.dropContent}>
                    <div style={s.scanIcon}>
                      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" />
                        <path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                        <line x1="3" y1="12" x2="21" y2="12" />
                      </svg>
                    </div>
                    <p style={s.dropTitlu}>Scanează certificatul de înmatriculare</p>
                    <p style={s.dropSub}>Fotografia față — câmpurile A, D.1, D.3, E, B, P.3 vizibile</p>
                  </div>
                )
              }
            </div>

            <input ref={inputRef} type="file" accept="image/*" capture="environment"
              style={{ display: 'none' }} onChange={e => handleFisier(e.target.files[0])} />

            <div style={s.butoaneUpload}>
              <button style={s.btnSecundar} onClick={() => inputRef.current.click()}>
                <IconUpload /> Fișier
              </button>
              <button style={s.btnSecundar} onClick={() => {
                inputRef.current.removeAttribute('capture');
                inputRef.current.click();
                setTimeout(() => inputRef.current.setAttribute('capture', 'environment'), 500);
              }}>
                <IconCamera /> Cameră
              </button>
            </div>

            <div style={s.legenda}>
              <p style={s.legendaTitlu}>CÂMPURI EXTRASE AUTOMAT</p>
              <div style={s.legendaGrid}>
                {[
                  ['A', 'Nr. înmatriculare'], ['B', 'An fabricație'],
                  ['D.1', 'Marcă'], ['D.3', 'Model (denumire comercială)'],
                  ['E', 'VIN (serie șasiu)'], ['P.1', 'Cilindree cm³'],
                  ['P.2', 'Putere kW'], ['P.3', 'Combustibil'],
                ].map(([cod, desc]) => (
                  <div key={cod} style={s.legendaItem}>
                    <span style={s.legendaCod}>{cod}</span>
                    <span style={s.legendaDesc}>{desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {imagine && (
              <button style={s.btnPrincipal} onClick={handleAnalizeaza}>
                ANALIZEAZĂ DOCUMENTUL
              </button>
            )}
          </>
        )}

        {/* ── LOADING ────────────────────────────────────────── */}
        {etapa === 'loading' && (
          <div style={s.loadingBox}>
            {preview && <img src={preview} alt="" style={{ ...s.previewImg, opacity: 0.35, borderRadius: '10px', marginBottom: '16px' }} />}
            <div style={s.spinner} />
            <p style={s.loadingTitlu}>Procesare OCR</p>
            <p style={s.loadingText}>Extrag datele din document... poate dura 15–30 secunde</p>
          </div>
        )}

        {/* ── FORMULAR ───────────────────────────────────────── */}
        {etapa === 'form' && (
          <form onSubmit={handleSalveaza} style={s.form}>

            <div style={s.infoBanner}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>Verifică datele extrase și completează câmpurile lipsă</span>
            </div>

            <div style={s.sectiune}>IDENTIFICARE VEHICUL</div>

            <div style={s.formRow}>
              <div style={s.field}>
                <label style={s.label}>MARCĂ *</label>
                <select style={s.input} value={form.marca} required
                  onChange={e => setForm(f => ({ ...f, marca: e.target.value, model: '', motor: '' }))}>
                  <option value="">Alege marca</option>
                  {MARCI.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div style={s.field}>
                <label style={s.label}>MODEL *</label>
                <select style={s.input} value={form.model} required
                  disabled={!form.marca || loadingModele}
                  onChange={e => setForm(f => ({ ...f, model: e.target.value, motor: '' }))}>
                  <option value="">{loadingModele ? 'Se încarcă...' : !form.marca ? 'Alege marca' : 'Alege modelul'}</option>
                  {modele.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <div style={s.formRow}>
              <div style={s.field}>
                <label style={s.label}>AN FABRICAȚIE *</label>
                <select style={s.input} value={form.an} required disabled={!form.model}
                  onChange={e => setForm(f => ({ ...f, an: e.target.value, motor: '' }))}>
                  <option value="">{!form.model ? 'Alege modelul' : 'Alege anul'}</option>
                  {ANI.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div style={s.field}>
                <label style={s.label}>
                  MOTORIZARE *
                  {ocrExtra?.combustibil && (
                    <span style={s.hintMotor}> · {ocrExtra.combustibil}{ocrExtra.cilindree ? `, ${ocrExtra.cilindree}cm³` : ''}</span>
                  )}
                </label>
                <select style={s.input} value={form.motor} required
                  disabled={!form.an || loadingMotorizari}
                  onChange={e => setF('motor', e.target.value)}>
                  <option value="">
                    {loadingMotorizari ? 'Se încarcă...' : !form.an ? 'Alege anul' : motorizari.length === 0 ? 'Nicio motorizare' : 'Alege motorizarea'}
                  </option>
                  {motorizari.map((m, i) => (
                    <option key={i} value={m.motor}>{m.motor} ({m.tipCombustibil})</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={s.formRow}>
              <div style={s.field}>
                <label style={s.label}>NR. ÎNMATRICULARE</label>
                <input style={s.input} value={form.numarInmatriculare}
                  onChange={e => setF('numarInmatriculare', e.target.value)} placeholder="ex: SV 62 CPY" />
              </div>
              <div style={s.field}>
                <label style={s.label}>KILOMETRAJ CURENT</label>
                <input type="number" style={s.input} value={form.kilometrajCurent}
                  onChange={e => setF('kilometrajCurent', e.target.value)} placeholder="ex: 120000" />
              </div>
            </div>

            <div style={s.field}>
              <label style={s.label}>SERIE ȘASIU (VIN)</label>
              <input style={s.input} value={form.vin} maxLength={17}
                onChange={e => setF('vin', e.target.value)} placeholder="17 caractere" />
            </div>

            <div style={s.sectiune}>DOCUMENTE & EXPIRĂRI</div>

            <div style={s.formRow}>
              <div style={s.field}>
                <label style={s.label}>EXPIRARE ITP</label>
                <input type="date" style={s.dateInput} value={form.dataITP}
                  onChange={e => setF('dataITP', e.target.value)} />
              </div>
              <div style={s.field}>
                <label style={s.label}>EXPIRARE RCA</label>
                <input type="date" style={s.dateInput} value={form.dataRCA}
                  onChange={e => setF('dataRCA', e.target.value)} />
              </div>
            </div>

            <div style={s.field}>
              <label style={s.label}>EXPIRARE ROVINIETĂ</label>
              <input type="date" style={s.dateInput} value={form.dataRovinieta}
                onChange={e => setF('dataRovinieta', e.target.value)} />
            </div>

            <div style={s.sectiune}>ULTIMUL SCHIMB ULEI</div>

            <div style={s.formRow}>
              <div style={s.field}>
                <label style={s.label}>DATA SCHIMB</label>
                <input type="date" style={s.dateInput} value={form.ultimulSchimbUleiData}
                  onChange={e => setF('ultimulSchimbUleiData', e.target.value)} />
              </div>
              <div style={s.field}>
                <label style={s.label}>KM LA SCHIMB</label>
                <input type="number" style={s.input} value={form.ultimulSchimbUleiKilometraj}
                  onChange={e => setF('ultimulSchimbUleiKilometraj', e.target.value)} />
              </div>
            </div>

            <button type="submit" style={{ ...s.btnPrincipal, opacity: salvand ? 0.7 : 1 }} disabled={salvand}>
              {salvand ? 'SE SALVEAZĂ...' : 'CREEAZĂ VEHICUL'}
            </button>

          </form>
        )}

      </main>
    </div>
  );
};

// ─── Componente mici ──────────────────────────────────────────────────────────

const IconUpload = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const IconCamera = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isoToDate = (val) => {
  try { return new Date(val).toISOString().split('T')[0]; } catch { return ''; }
};

// ─── Stiluri ──────────────────────────────────────────────────────────────────

const s = {
  pagina: {
    backgroundColor: '#0b0e14', color: '#fff', minHeight: '100vh',
    fontFamily: '"Inter", sans-serif',
    paddingBottom: 'calc(80px + env(safe-area-inset-bottom))',
    paddingTop: '80px',
  },
  navbar: {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40,
    backgroundColor: 'rgba(11,14,20,0.85)', backdropFilter: 'blur(16px)',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  navLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  backBtn: { background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' },
  navTitlu: { fontSize: '1rem', fontWeight: '800', letterSpacing: '1px' },
  resetBtn: {
    background: 'none', border: '1px solid rgba(255,255,255,0.12)',
    color: '#94a3b8', padding: '7px 14px', borderRadius: '8px',
    fontSize: '0.7rem', fontWeight: '700', letterSpacing: '1px', cursor: 'pointer',
  },
  main: { padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' },
  dropZone: {
    border: '2px dashed rgba(0,229,255,0.2)', borderRadius: '14px',
    backgroundColor: '#13161f', minHeight: '220px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', overflow: 'hidden',
  },
  dropZoneActive: { border: '2px solid rgba(0,229,255,0.5)', cursor: 'default' },
  dropContent: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '2rem' },
  scanIcon: {
    width: '80px', height: '80px', border: '1px solid rgba(0,229,255,0.15)',
    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,229,255,0.05)',
  },
  dropTitlu: { color: '#fff', fontWeight: '700', fontSize: '0.9rem', margin: 0, textAlign: 'center' },
  dropSub: { color: '#64748b', fontSize: '0.75rem', margin: 0, textAlign: 'center', lineHeight: 1.6 },
  previewImg: { width: '100%', maxHeight: '300px', objectFit: 'contain' },
  butoaneUpload: { display: 'flex', gap: '12px' },
  btnSecundar: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    backgroundColor: '#13161f', border: '1px solid rgba(255,255,255,0.08)',
    color: '#94a3b8', padding: '13px', borderRadius: '10px',
    fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer',
  },
  btnPrincipal: {
    width: '100%', backgroundColor: '#00e5ff', color: '#001f24',
    padding: '15px', border: 'none', borderRadius: '10px',
    fontWeight: '800', fontSize: '0.85rem', letterSpacing: '1px',
    cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,229,255,0.25)',
  },
  legenda: {
    backgroundColor: '#13161f', border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '12px', padding: '16px',
  },
  legendaTitlu: { fontSize: '0.6rem', color: '#64748b', fontWeight: '800', letterSpacing: '1.5px', marginBottom: '12px' },
  legendaGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' },
  legendaItem: { display: 'flex', alignItems: 'center', gap: '8px' },
  legendaCod: {
    backgroundColor: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)',
    color: '#00e5ff', fontSize: '0.65rem', fontWeight: '800',
    padding: '2px 7px', borderRadius: '5px', minWidth: '30px', textAlign: 'center',
  },
  legendaDesc: { color: '#94a3b8', fontSize: '0.72rem' },
  loadingBox: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
    padding: '3rem 2rem', backgroundColor: '#13161f', borderRadius: '14px',
    border: '1px solid rgba(255,255,255,0.05)',
  },
  spinner: {
    width: '40px', height: '40px',
    border: '3px solid rgba(0,229,255,0.15)', borderTop: '3px solid #00e5ff',
    borderRadius: '50%', animation: 'spin 0.9s linear infinite',
  },
  loadingTitlu: { color: '#fff', fontWeight: '800', fontSize: '0.9rem', margin: 0, letterSpacing: '1px' },
  loadingText: { color: '#64748b', fontSize: '0.78rem', margin: 0, textAlign: 'center' },
  form: { display: 'flex', flexDirection: 'column', gap: '14px' },
  infoBanner: {
    display: 'flex', alignItems: 'center', gap: '10px',
    backgroundColor: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.15)',
    borderRadius: '10px', padding: '12px 14px',
    fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.5,
  },
  sectiune: { fontSize: '0.62rem', color: '#00e5ff', fontWeight: '800', letterSpacing: '2px', paddingTop: '4px' },
  formRow: { display: 'flex', gap: '12px' },
  field: { flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' },
  label: { fontSize: '0.63rem', color: '#00e5ff', fontWeight: '800', letterSpacing: '1px' },
  hintMotor: { color: '#64748b', fontWeight: '600', letterSpacing: '0', textTransform: 'none' },
  input: {
    backgroundColor: '#0b0e14', border: '1px solid rgba(255,255,255,0.08)',
    padding: '11px 13px', borderRadius: '8px', color: '#fff',
    outline: 'none', fontSize: '0.875rem', width: '100%', boxSizing: 'border-box',
  },
  dateInput: {
    backgroundColor: '#0b0e14', border: '1px solid rgba(255,255,255,0.08)',
    padding: '11px 13px', borderRadius: '8px', color: '#fff',
    outline: 'none', fontSize: '0.875rem', colorScheme: 'dark',
    width: '100%', boxSizing: 'border-box',
  },
};

export default Scanner;
