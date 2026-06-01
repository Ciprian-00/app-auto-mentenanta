import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import CarWatermark from '../components/CarWatermark';
import AlegeMetoda from '../components/AlegeMetoda';
import AdaugaVehiculModal from '../components/AdaugaVehiculModel';

const MARCI = ['Audi', 'BMW', 'Dacia', 'Ford', 'Mercedes-Benz', 'Renault', 'Skoda', 'Toyota', 'Volkswagen'];
const ANI = Array.from({ length: 2027 - 1960 + 1 }, (_, i) => 2027 - i);
const ZI_MS = 1000 * 60 * 60 * 24;

const FORM_GOL = {
  marca: '', model: '', an: '', motor: '', vin: '',
  numarInmatriculare: '', kilometrajCurent: '',
  dataITP: '', dataRCA: '', dataRovinieta: '',
  ultimulSchimbUleiData: '', ultimulSchimbUleiKilometraj: '',
};

const zileRamase = (data) => Math.ceil((new Date(data) - new Date()) / ZI_MS);

const formateazaData = (data) => {
  if (!data) return 'N/A';
  return new Date(data).toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// Calculează starea generală a mașinii din documentul care expiră cel mai repede
const getStatusMasina = (vehicul) => {
  const acte = [
    { nume: 'ITP', data: vehicul.dataITP },
    { nume: 'RCA', data: vehicul.dataRCA },
    { nume: 'ROVINIETA', data: vehicul.dataRovinieta },
    ...(vehicul.documenteCustom || []).filter(d => d.dataExpirare).map(d => ({ nume: d.nume, data: d.dataExpirare })),
  ].filter(act => act.data);

  if (acte.length === 0) return { textBadge: 'DATE INCOMPLETE', mesajStare: 'ADAUGĂ ACTE', culoare: 'var(--text-dim)' };

  for (const act of acte) {
    const zile = zileRamase(act.data);
    if (zile < 0) return { textBadge: 'ACȚIUNE NECESARĂ', mesajStare: `${act.nume} EXPIRAT!`, culoare: '#ff4d4d' };
    if (zile <= 30) return { textBadge: 'NECESITĂ ATENȚIE', mesajStare: `${act.nume} expiră în ${zile} zile`, culoare: '#fbbf24' };
  }
  return { textBadge: 'DOCUMENTE OK', mesajStare: 'OPTIM', culoare: '#22d3a5' };
};

const Vehicule = () => {
  const navigate = useNavigate();
  const [vehicule, setVehicule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  const [modeleDisponibile, setModeleDisponibile] = useState([]);
  const [motorizariDisponibile, setMotorizariDisponibile] = useState([]);
  const [loadingModele, setLoadingModele] = useState(false);
  const [loadingMotorizari, setLoadingMotorizari] = useState(false);

  const [formVehicul, setFormVehicul] = useState(FORM_GOL);
  const [showChoice, setShowChoice] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const set = (key, val) => setFormVehicul(f => ({ ...f, [key]: val }));

  useEffect(() => {
    document.body.style.margin = '0';
    document.body.style.backgroundColor = 'var(--bg)';
    fetchVehicule();
  }, []);

  // Încarcă modelele disponibile pentru marca aleasă
  useEffect(() => {
    if (!formVehicul.marca) { setModeleDisponibile([]); setMotorizariDisponibile([]); return; }
    setLoadingModele(true);
    api.get(`/specs/modele?marca=${encodeURIComponent(formVehicul.marca)}`)
      .then(res => setModeleDisponibile(res.data))
      .catch(() => setModeleDisponibile([]))
      .finally(() => setLoadingModele(false));
  }, [formVehicul.marca]);

  // Încarcă motorizările pentru marca + model + an
  useEffect(() => {
    if (!formVehicul.marca || !formVehicul.model || !formVehicul.an) { setMotorizariDisponibile([]); return; }
    setLoadingMotorizari(true);
    api.get(`/specs/motorizari?marca=${encodeURIComponent(formVehicul.marca)}&model=${encodeURIComponent(formVehicul.model)}&an=${formVehicul.an}`)
      .then(res => setMotorizariDisponibile(res.data))
      .catch(() => setMotorizariDisponibile([]))
      .finally(() => setLoadingMotorizari(false));
  }, [formVehicul.marca, formVehicul.model, formVehicul.an]);

  const fetchVehicule = async () => {
    try {
      setLoading(true);
      const res = await api.get('/vehicles');
      setVehicule(res.data);
    } catch {
      toast.error('Eroare la încărcare date');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (e, vehicul) => {
    e.stopPropagation();
    setCurrentId(vehicul._id);
    setFormVehicul({
      ...FORM_GOL,
      marca: vehicul.marca || '',
      model: vehicul.model || '',
      an: vehicul.an || '',
      motor: vehicul.motor || '',
      vin: vehicul.vin || '',
      numarInmatriculare: vehicul.numarInmatriculare || '',
      kilometrajCurent: vehicul.kilometrajCurent || '',
      dataITP: vehicul.dataITP ? vehicul.dataITP.split('T')[0] : '',
      dataRCA: vehicul.dataRCA ? vehicul.dataRCA.split('T')[0] : '',
      dataRovinieta: vehicul.dataRovinieta ? vehicul.dataRovinieta.split('T')[0] : '',
      ultimulSchimbUleiData: vehicul.ultimulSchimbUlei?.data ? vehicul.ultimulSchimbUlei.data.split('T')[0] : '',
      ultimulSchimbUleiKilometraj: vehicul.ultimulSchimbUlei?.kilometraj || '',
    });
    setShowModal(true);
  };

  // Salvează modificările unei mașini existente (adăugarea se face în AdaugaVehiculModal)
  const handleSave = async (e) => {
    e.preventDefault();
    if (!formVehicul.marca || !formVehicul.model || !formVehicul.an || !formVehicul.motor) {
      toast.error('Marca, modelul, anul și motorizarea sunt obligatorii');
      return;
    }

    const payload = {
      marca: formVehicul.marca,
      model: formVehicul.model,
      an: Number(formVehicul.an),
      motor: formVehicul.motor,
      numarInmatriculare: formVehicul.numarInmatriculare,
      kilometrajCurent: Number(formVehicul.kilometrajCurent) || 0,
      dataITP: formVehicul.dataITP || null,
      dataRCA: formVehicul.dataRCA || null,
      dataRovinieta: formVehicul.dataRovinieta || null,
      ultimulSchimbUlei: {
        data: formVehicul.ultimulSchimbUleiData || null,
        kilometraj: Number(formVehicul.ultimulSchimbUleiKilometraj) || null,
      },
    };
    if (formVehicul.vin?.trim()) payload.vin = formVehicul.vin.trim();

    try {
      await api.put(`/vehicles/${currentId}`, payload);
      toast.success('Informații actualizate!');
      setShowModal(false);
      fetchVehicule();
    } catch (error) {
      toast.error(error.response?.data?.mesaj || 'Eroare la salvare. Verifică datele introduse.');
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Confirmă ștergerea vehiculului din garaj.')) return;
    try {
      await api.delete(`/vehicles/${id}`);
      toast.success('Vehicul șters.');
      fetchVehicule();
    } catch {
      toast.error('Eroare la ștergere');
    }
  };

  if (loading) {
    return (
      <div style={s.loadingWrap}>
        <div style={s.loadingSpinner} />
        <p style={{ color: 'var(--accent)', letterSpacing: '2px', fontSize: '0.85rem', marginTop: '1rem' }}>INIȚIALIZARE SISTEM...</p>
      </div>
    );
  }

  return (
    <div style={s.pagina}>

      <nav style={s.navbar}>
        <div style={s.navLeft}>
          <button onClick={() => navigate(-1)} style={s.backBtn}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <span style={s.navTitlu}>Digital Garage</span>
        </div>
        <button onClick={() => setShowChoice(true)} style={s.addBtn}>+ ADAUGĂ</button>
      </nav>

      <main style={s.main}>

        {vehicule.length === 0 && (
          <div style={s.golContainer}>
            <span style={{ fontSize: '3rem' }}>🚗</span>
            <p style={s.golText}>Nu ai adăugat nicio mașină.</p>
            <button onClick={() => setShowChoice(true)} style={s.addBtn}>+ Adaugă prima mașină</button>
          </div>
        )}

        {vehicule.map(v => {
          const status = getStatusMasina(v);
          return (
            <div key={v._id} style={s.card} onClick={() => navigate(`/vehicule/${v._id}`)}>

              <div style={s.cardHeader}>
                <CarWatermark style={{ left: '50%', top: '52%', transform: 'translate(-50%, -50%)', height: '118px', opacity: 0.4 }} />

                <div style={s.statusBadge}>
                  <span style={{ ...s.statusDot, backgroundColor: status.culoare, boxShadow: `0 0 7px ${status.culoare}` }} />
                  {status.textBadge}
                </div>

                <div style={s.actiuni}>
                  <button onClick={(e) => openEditModal(e, v)} style={s.iconBtn} title="Editează">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button onClick={(e) => handleDelete(e, v._id)} style={{ ...s.iconBtn, color: '#ff4d4d' }} title="Șterge">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>

              </div>

              <div style={s.cardBody}>
                <div style={s.numeRow}>
                  <div style={{ minWidth: 0 }}>
                    <h3 style={s.carNume}>{v.marca} {v.model}</h3>
                    <p style={s.carSub}>An {v.an} · {v.motor || 'Specificații N/A'}</p>
                  </div>
                  {v.numarInmatriculare && (
                    <div style={s.placuta}>
                      <span style={s.placutaRo}>RO</span>
                      <span style={s.placutaNr}>{v.numarInmatriculare}</span>
                    </div>
                  )}
                </div>

                <div style={s.statsRow}>
                  <div style={s.statBox}>
                    <span style={s.statLabel}>ODOMETER</span>
                    <span style={s.statVal}>{v.kilometrajCurent?.toLocaleString() || 0}<span style={s.statUnit}> km</span></span>
                  </div>
                  <div style={s.statBox}>
                    <span style={s.statLabel}>STARE SISTEM</span>
                    <span style={{ ...s.statVal, color: status.culoare, fontSize: '0.9rem' }}>{status.mesajStare}</span>
                  </div>
                </div>

                <div style={s.docsRow}>
                  {[
                    { label: 'ITP', data: v.dataITP },
                    { label: 'RCA', data: v.dataRCA },
                    { label: 'ROVINIETĂ', data: v.dataRovinieta },
                  ].map(({ label, data }) => {
                    const zile = data ? zileRamase(data) : null;
                    const culoare = zile === null ? 'var(--text-dim)' : zile < 0 ? '#ff4d4d' : zile <= 30 ? '#fbbf24' : 'var(--text-muted)';
                    return (
                      <div key={label} style={s.docItem}>
                        <span style={s.docLabel}>{label}</span>
                        <span style={{ ...s.docVal, color: culoare }}>{formateazaData(data)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </main>

      {showChoice && (
        <AlegeMetoda
          onScanner={() => { setShowChoice(false); navigate('/scanner'); }}
          onManual={() => { setShowChoice(false); setShowAdd(true); }}
          onClose={() => setShowChoice(false)}
        />
      )}

      {showAdd && (
        <AdaugaVehiculModal
          onClose={() => setShowAdd(false)}
          onSuccess={() => { setShowAdd(false); fetchVehicule(); }}
        />
      )}

      {showModal && (
        <div style={s.overlay} onClick={() => setShowModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h2 style={s.modalTitlu}>EDITARE VEHICUL</h2>
              <button onClick={() => setShowModal(false)} style={s.closeBtn}>✕</button>
            </div>

            <form onSubmit={handleSave} style={s.form}>

              <div style={s.formRow}>
                <div style={s.field}>
                  <label style={s.label}>MARCĂ</label>
                  <select style={s.input} value={formVehicul.marca} required
                    onChange={e => setFormVehicul(f => ({ ...f, marca: e.target.value, model: '', motor: '' }))}>
                    <option value="">Alege marca</option>
                    {MARCI.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div style={s.field}>
                  <label style={s.label}>MODEL</label>
                  <select style={s.input} value={formVehicul.model} required disabled={!formVehicul.marca || loadingModele}
                    onChange={e => setFormVehicul(f => ({ ...f, model: e.target.value, motor: '' }))}>
                    <option value="">{loadingModele ? 'Se încarcă...' : !formVehicul.marca ? 'Alege mai întâi marca' : 'Alege modelul'}</option>
                    {modeleDisponibile.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              <div style={s.formRow}>
                <div style={s.field}>
                  <label style={s.label}>AN FABRICAȚIE</label>
                  <select style={s.input} value={formVehicul.an} required disabled={!formVehicul.model}
                    onChange={e => setFormVehicul(f => ({ ...f, an: e.target.value, motor: '' }))}>
                    <option value="">{!formVehicul.model ? 'Alege mai întâi modelul' : 'Alege anul'}</option>
                    {ANI.map(an => <option key={an} value={an}>{an}</option>)}
                  </select>
                </div>
                <div style={s.field}>
                  <label style={s.label}>MOTORIZARE</label>
                  <select style={s.input} value={formVehicul.motor} required disabled={!formVehicul.an || loadingMotorizari}
                    onChange={e => set('motor', e.target.value)}>
                    <option value="">
                      {loadingMotorizari ? 'Se încarcă...' : !formVehicul.an ? 'Alege mai întâi anul' : motorizariDisponibile.length === 0 ? 'Nicio motorizare găsită' : 'Alege motorizarea'}
                    </option>
                    {motorizariDisponibile.map((m, i) => <option key={i} value={m.motor}>{m.motor} ({m.tipCombustibil})</option>)}
                  </select>
                </div>
              </div>

              <div style={s.formRow}>
                <div style={s.field}>
                  <label style={s.label}>NR. ÎNMATRICULARE</label>
                  <input style={s.input} value={formVehicul.numarInmatriculare} onChange={e => set('numarInmatriculare', e.target.value)} placeholder="ex: SV 01 ABC" />
                </div>
                <div style={s.field}>
                  <label style={s.label}>KILOMETRAJ CURENT</label>
                  <input type="number" style={s.input} value={formVehicul.kilometrajCurent} onChange={e => set('kilometrajCurent', e.target.value)} placeholder="ex: 85000" />
                </div>
              </div>

              <div style={s.field}>
                <label style={s.label}>SERIE ȘASIU (VIN)</label>
                <input style={s.input} placeholder="17 caractere" value={formVehicul.vin} onChange={e => set('vin', e.target.value)} />
              </div>

              <div style={s.divider}>DOCUMENTE</div>

              <div style={s.formRow}>
                <div style={s.field}>
                  <label style={s.label}>DATA ITP</label>
                  <input type="date" style={s.dateInput} value={formVehicul.dataITP} onChange={e => set('dataITP', e.target.value)} />
                </div>
                <div style={s.field}>
                  <label style={s.label}>DATA RCA</label>
                  <input type="date" style={s.dateInput} value={formVehicul.dataRCA} onChange={e => set('dataRCA', e.target.value)} />
                </div>
              </div>
              <div style={s.field}>
                <label style={s.label}>DATA ROVINIETĂ</label>
                <input type="date" style={s.dateInput} value={formVehicul.dataRovinieta} onChange={e => set('dataRovinieta', e.target.value)} />
              </div>

              <div style={s.divider}>ULTIMUL SCHIMB ULEI</div>

              <div style={s.formRow}>
                <div style={s.field}>
                  <label style={s.label}>DATA SCHIMB</label>
                  <input type="date" style={s.dateInput} value={formVehicul.ultimulSchimbUleiData} onChange={e => set('ultimulSchimbUleiData', e.target.value)} />
                </div>
                <div style={s.field}>
                  <label style={s.label}>KM LA SCHIMB</label>
                  <input type="number" style={s.input} value={formVehicul.ultimulSchimbUleiKilometraj} onChange={e => set('ultimulSchimbUleiKilometraj', e.target.value)} />
                </div>
              </div>

              <button type="submit" style={s.saveBtn}>ACTUALIZEAZĂ DATELE</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const s = {
  pagina: { backgroundColor: 'var(--bg)', color: 'var(--text)', minHeight: '100vh', fontFamily: '"Inter", sans-serif', paddingBottom: 'calc(80px + env(safe-area-inset-bottom))', paddingTop: '80px' },
  loadingWrap: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg)' },
  loadingSpinner: { width: '40px', height: '40px', border: '3px solid rgba(0,229,255,0.2)', borderTop: '3px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },

  navbar: { position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40, backgroundColor: 'var(--nav-bg)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border-soft)', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  navLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  backBtn: { background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' },
  navTitlu: { fontSize: '1rem', fontWeight: '800', letterSpacing: '1px', color: 'var(--text)' },
  addBtn: { backgroundColor: 'var(--accent)', color: 'var(--accent-ink)', padding: '9px 16px', borderRadius: '8px', fontWeight: '800', fontSize: '0.75rem', letterSpacing: '1px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,229,255,0.2)' },

  main: { padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' },
  golContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '4rem 1rem', textAlign: 'center' },
  golText: { color: 'var(--text-dim)', margin: 0, fontSize: '0.9rem' },

  card: { backgroundColor: 'var(--surface)', border: '1px solid var(--border-soft)', borderRadius: '14px', overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' },
  cardHeader: { position: 'relative', height: '160px', background: 'var(--hero-grad)', display: 'flex', alignItems: 'flex-end', padding: '14px', overflow: 'hidden' },
  brandWatermark: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '4.5rem', fontWeight: '900', color: 'var(--watermark)', letterSpacing: '6px', userSelect: 'none', whiteSpace: 'nowrap', pointerEvents: 'none' },
  statusBadge: { position: 'absolute', top: '14px', left: '14px', backgroundColor: 'rgba(0,0,0,0.55)', border: '1px solid var(--border)', color: '#fff', padding: '5px 11px', borderRadius: '20px', fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px', backdropFilter: 'blur(6px)', zIndex: 3 },
  statusDot: { width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0 },
  actiuni: { position: 'absolute', top: '14px', right: '14px', display: 'flex', gap: '8px', zIndex: 3 },
  iconBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.55)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', backdropFilter: 'blur(6px)', padding: 0, boxSizing: 'border-box', lineHeight: 0 },
  placuta: { display: 'inline-flex', alignItems: 'center', border: '2px solid var(--border-strong)', borderRadius: '5px', overflow: 'hidden', flexShrink: 0, alignSelf: 'flex-start' },
  placutaRo: { background: '#003399', color: '#fff', fontSize: '0.55rem', fontWeight: '900', padding: '4px 6px', letterSpacing: '0.5px' },
  placutaNr: { background: '#fff', color: '#000', fontSize: '0.85rem', fontWeight: '900', padding: '4px 10px', letterSpacing: '2px' },

  cardBody: { padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px', backgroundColor: 'var(--surface)' },
  numeRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' },
  carNume: { fontSize: '1.15rem', fontWeight: '800', margin: '0 0 4px 0', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  carSub: { fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1.5px', margin: 0, fontWeight: '700' },
  statsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  statBox: { backgroundColor: 'var(--surface-3)', border: '1px solid var(--border-soft)', padding: '11px 12px', borderRadius: '9px', display: 'flex', flexDirection: 'column', gap: '4px' },
  statLabel: { fontSize: '0.6rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' },
  statVal: { fontSize: '1rem', fontWeight: '800', color: 'var(--text)' },
  statUnit: { fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '400', textTransform: 'uppercase' },
  docsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', paddingTop: '14px', borderTop: '1px solid var(--border-soft)' },
  docItem: { display: 'flex', flexDirection: 'column', gap: '3px' },
  docLabel: { fontSize: '0.58rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' },
  docVal: { fontSize: '0.75rem', fontWeight: '700' },

  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(10px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'calc(20px + env(safe-area-inset-top)) 20px calc(20px + env(safe-area-inset-bottom))' },
  modal: { background: 'linear-gradient(180deg, var(--surface) 0%, var(--bg) 100%)', width: '100%', maxWidth: '500px', padding: '24px', borderRadius: '15px', border: '1px solid rgba(0,229,255,0.25)', maxHeight: 'calc(85vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))', overflowY: 'auto' },
  modalHeader: { position: 'sticky', top: 0, zIndex: 1, background: 'linear-gradient(180deg, var(--surface) 80%, transparent 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', marginBottom: '4px' },
  modalTitlu: { fontSize: '0.85rem', fontWeight: '800', color: 'var(--accent)', letterSpacing: '1.5px', margin: 0 },
  closeBtn: { background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.3rem', cursor: 'pointer', lineHeight: 1 },
  form: { display: 'flex', flexDirection: 'column', gap: '14px' },
  formRow: { display: 'flex', gap: '14px' },
  field: { flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' },
  label: { fontSize: '0.65rem', color: 'var(--accent)', fontWeight: '800', letterSpacing: '1px' },
  input: { backgroundColor: 'var(--bg)', border: '1px solid var(--border)', padding: '11px 13px', borderRadius: '8px', color: 'var(--text)', outline: 'none', fontSize: '0.875rem', width: '100%', boxSizing: 'border-box' },
  dateInput: { backgroundColor: 'var(--bg)', border: '1px solid var(--border)', padding: '11px 13px', borderRadius: '8px', color: 'var(--text)', outline: 'none', fontSize: '0.875rem', colorScheme: 'dark', width: '100%', boxSizing: 'border-box' },
  divider: { textAlign: 'center', fontSize: '0.6rem', color: 'var(--accent)', margin: '8px 0 2px 0', letterSpacing: '2px', fontWeight: '800' },
  docGrup: { display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '12px', borderBottom: '1px solid var(--border-soft)' },
  docGrupLabel: { margin: 0, fontSize: '0.6rem', fontWeight: '800', color: 'var(--accent)', letterSpacing: '1.5px' },
  saveBtn: { backgroundColor: 'var(--accent)', color: 'var(--accent-ink)', padding: '14px', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '0.8rem', letterSpacing: '1px', cursor: 'pointer', marginTop: '6px', width: '100%' },
};

export default Vehicule;
