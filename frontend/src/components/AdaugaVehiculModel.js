import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';

const MARCI = ['Audi', 'BMW', 'Dacia', 'Ford', 'Mercedes-Benz', 'Renault', 'Skoda', 'Toyota', 'Volkswagen'];
const ANUL_MAX = new Date().getFullYear() + 1;
const ANI = Array.from({ length: ANUL_MAX - 1990 + 1 }, (_, i) => ANUL_MAX - i);

const FORM_GOL = {
  marca: '', model: '', an: '', motor: '', vin: '',
  numarInmatriculare: '', kilometrajCurent: '',
  obtinereITP: '', dataITP: '',
  obtinereRCA: '', dataRCA: '',
  obtinereRovinieta: '', dataRovinieta: '',
  costITP: '', costRCA: '', costRovinieta: '',
  ultimulSchimbUleiData: '', ultimulSchimbUleiKilometraj: '', costUlei: '',
};

const toNullableDate = (v) => (typeof v === 'string' && v.trim() === '' ? null : v);

const AdaugaVehiculModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState(FORM_GOL);
  const [modele, setModele] = useState([]);
  const [motorizari, setMotorizari] = useState([]);
  const [loadingModele, setLoadingModele] = useState(false);
  const [loadingMot, setLoadingMot] = useState(false);
  const [salvare, setSalvare] = useState(false);

  // Încarcă modelele când se schimbă marca
  useEffect(() => {
    if (!form.marca) { setModele([]); setMotorizari([]); return; }
    setLoadingModele(true);
    api.get(`/specs/modele?marca=${encodeURIComponent(form.marca)}`)
      .then(r => setModele(r.data))
      .catch(() => setModele([]))
      .finally(() => setLoadingModele(false));
  }, [form.marca]);

  // Încarcă motorizările când se schimbă marca + model + an
  useEffect(() => {
    if (!form.marca || !form.model || !form.an) { setMotorizari([]); return; }
    setLoadingMot(true);
    api.get(`/specs/motorizari?marca=${encodeURIComponent(form.marca)}&model=${encodeURIComponent(form.model)}&an=${form.an}`)
      .then(r => setMotorizari(r.data))
      .catch(() => setMotorizari([]))
      .finally(() => setLoadingMot(false));
  }, [form.marca, form.model, form.an]);

  // Actualizează formularul. Marca resetează tot, model/an resetează motorul,
  // iar '__batch' permite setarea mai multor câmpuri deodată (data + expirare).
  const set = (camp, val) => {
    if (camp === 'marca') setForm({ ...FORM_GOL, marca: val });
    else if (camp === 'model') setForm(f => ({ ...f, model: val, motor: '' }));
    else if (camp === 'an') setForm(f => ({ ...f, an: val, motor: '' }));
    else if (camp === '__batch') setForm(f => ({ ...f, ...val }));
    else setForm(f => ({ ...f, [camp]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.marca || !form.model || !form.an || !form.motor) {
      toast.error('Completează: marcă, model, an și motorizare');
      return;
    }
    setSalvare(true);
    try {
      const payload = {
        marca: form.marca, model: form.model,
        an: Number(form.an), motor: form.motor,
        numarInmatriculare: form.numarInmatriculare,
        kilometrajCurent: Number(form.kilometrajCurent) || 0,
        dataITP: toNullableDate(form.dataITP),
        dataRCA: toNullableDate(form.dataRCA),
        dataRovinieta: toNullableDate(form.dataRovinieta),
        ultimulSchimbUlei: {
          data: toNullableDate(form.ultimulSchimbUleiData),
          kilometraj: Number(form.ultimulSchimbUleiKilometraj) || null,
        },
      };
      if (form.vin?.trim()) payload.vin = form.vin.trim();

      const res = await api.post('/vehicles', payload);
      const vehicleId = res?.data?._id;
      if (!vehicleId) throw new Error('Backend nu a returnat _id pentru vehiculul creat.');

      await api.post(`/reminders/genereaza/${vehicleId}`);

      // Costurile introduse devin intrări de cheltuieli
      const azi = new Date().toISOString().split('T')[0];
      const loguriInitiale = [
        form.costITP && { tip: 'ITP', categorie: 'document', data: form.obtinereITP || azi, cost: Number(form.costITP) },
        form.costRCA && { tip: 'RCA', categorie: 'document', data: form.obtinereRCA || azi, cost: Number(form.costRCA) },
        form.costRovinieta && { tip: 'Rovinietă', categorie: 'document', data: form.obtinereRovinieta || azi, cost: Number(form.costRovinieta) },
        form.costUlei && form.ultimulSchimbUleiData && { tip: 'Schimb ulei', categorie: 'service', data: form.ultimulSchimbUleiData, kilometraj: Number(form.ultimulSchimbUleiKilometraj) || 0, cost: Number(form.costUlei) },
      ].filter(Boolean);
      if (loguriInitiale.length) {
        await Promise.all(loguriInitiale.map(l => api.post(`/maintenance/vehicul/${vehicleId}`, l)));
      }

      toast.success('Mașina a fost adăugată!');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.mesaj || err.message || 'Eroare la adăugare');
    } finally {
      setSalvare(false);
    }
  };

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>

        <div style={s.stickyTop}>
          <div style={s.header}>
            <h3 style={s.titlu}>ADAUGĂ MAȘINĂ</h3>
            <button onClick={onClose} style={s.closeBtn}>✕</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={s.form}>

          <div style={s.row}>
            <div style={s.field}>
              <label style={s.label}>MARCĂ</label>
              <select value={form.marca} onChange={e => set('marca', e.target.value)} style={s.input} required>
                <option value="">Alege marca</option>
                {MARCI.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div style={s.field}>
              <label style={s.label}>MODEL</label>
              <select value={form.model} onChange={e => set('model', e.target.value)} style={s.input} required disabled={!form.marca || loadingModele}>
                <option value="">{loadingModele ? 'Se încarcă...' : !form.marca ? 'Alege mai întâi marca' : 'Alege modelul'}</option>
                {modele.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div style={s.row}>
            <div style={s.field}>
              <label style={s.label}>AN FABRICAȚIE</label>
              <select value={form.an} onChange={e => set('an', e.target.value)} style={s.input} required disabled={!form.model}>
                <option value="">{!form.model ? 'Alege mai întâi modelul' : 'Alege anul'}</option>
                {ANI.map(an => <option key={an} value={an}>{an}</option>)}
              </select>
            </div>
            <div style={s.field}>
              <label style={s.label}>MOTORIZARE</label>
              <select value={form.motor} onChange={e => set('motor', e.target.value)} style={s.input} required disabled={!form.an || loadingMot}>
                <option value="">{loadingMot ? 'Se încarcă...' : !form.an ? 'Alege mai întâi anul' : motorizari.length === 0 ? 'Nicio motorizare găsită' : 'Alege motorizarea'}</option>
                {motorizari.map((m, i) => <option key={i} value={m.motor}>{m.motor} · {m.tipCombustibil}</option>)}
              </select>
            </div>
          </div>

          <div style={s.row}>
            <div style={s.field}>
              <label style={s.label}>NR. ÎNMATRICULARE</label>
              <input value={form.numarInmatriculare} onChange={e => set('numarInmatriculare', e.target.value)} placeholder="SV 01 ABC" style={s.input} />
            </div>
            <div style={s.field}>
              <label style={s.label}>KILOMETRAJ</label>
              <input type="number" value={form.kilometrajCurent} onChange={e => set('kilometrajCurent', e.target.value)} placeholder="85000" style={s.input} />
            </div>
          </div>

          <div style={s.field}>
            <label style={s.label}>SERIE ȘASIU (VIN)</label>
            <input value={form.vin} maxLength={17} onChange={e => set('vin', e.target.value)} placeholder="17 caractere" style={s.input} />
          </div>

          <div style={s.divider}>DOCUMENTE</div>

          {[
            { doc: 'ITP', obtKey: 'obtinereITP', expKey: 'dataITP', costKey: 'costITP', costPlaceholder: 'ex: 200' },
            { doc: 'RCA', obtKey: 'obtinereRCA', expKey: 'dataRCA', costKey: 'costRCA', costPlaceholder: 'ex: 800' },
            { doc: 'ROVINIETĂ', obtKey: 'obtinereRovinieta', expKey: 'dataRovinieta', costKey: 'costRovinieta', costPlaceholder: 'ex: 28' },
          ].map(d => (
            <div key={d.doc} style={s.docGrup}>
              <p style={s.docGrupLabel}>{d.doc}</p>
              <div style={s.row}>
                <div style={s.field}>
                  <label style={s.label}>DATA {d.doc}</label>
                  <input type="date" value={form[d.obtKey]} style={s.dateInput}
                    onChange={e => {
                      // Expirarea se completează automat la +1 an de la data obținerii
                      const val = e.target.value;
                      const upd = { [d.obtKey]: val };
                      if (val) {
                        const exp = new Date(val);
                        exp.setFullYear(exp.getFullYear() + 1);
                        upd[d.expKey] = exp.toISOString().split('T')[0];
                      }
                      set('__batch', upd);
                    }} />
                </div>
                <div style={s.field}>
                  <label style={s.label}>EXPIRĂ</label>
                  <input type="date" value={form[d.expKey]} style={s.dateInput} onChange={e => set(d.expKey, e.target.value)} />
                </div>
              </div>
              <div style={s.field}>
                <label style={s.label}>COST {d.doc} (lei)</label>
                <input type="number" value={form[d.costKey]} style={s.input} onChange={e => set(d.costKey, e.target.value)} placeholder={d.costPlaceholder} />
              </div>
            </div>
          ))}

          <div style={s.divider}>ULTIMUL SCHIMB ULEI</div>

          <div style={s.row}>
            <div style={s.field}>
              <label style={s.label}>DATA SCHIMB</label>
              <input type="date" value={form.ultimulSchimbUleiData} onChange={e => set('ultimulSchimbUleiData', e.target.value)} style={s.dateInput} />
            </div>
            <div style={s.field}>
              <label style={s.label}>KM LA SCHIMB</label>
              <input type="number" value={form.ultimulSchimbUleiKilometraj} onChange={e => set('ultimulSchimbUleiKilometraj', e.target.value)} placeholder="ex: 85000" style={s.input} />
            </div>
          </div>

          <div style={s.field}>
            <label style={s.label}>COST ULEI (lei, opțional)</label>
            <input type="number" value={form.costUlei} onChange={e => set('costUlei', e.target.value)} placeholder="ex: 280" style={s.input} />
          </div>

          <button type="submit" style={s.saveBtn} disabled={salvare}>
            {salvare ? 'SE SALVEAZĂ...' : 'SALVEAZĂ MAȘINA'}
          </button>
        </form>
      </div>
    </div>
  );
};

const s = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: 'calc(20px + env(safe-area-inset-top)) 20px calc(20px + env(safe-area-inset-bottom))' },
  modal: { background: 'linear-gradient(180deg, var(--surface) 0%, var(--bg) 100%)', width: '100%', maxWidth: '500px', padding: '24px', borderRadius: '15px', border: '1px solid rgba(0,229,255,0.25)', maxHeight: 'calc(85vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))', overflowY: 'auto' },
  stickyTop: { position: 'sticky', top: 0, zIndex: 1, background: 'linear-gradient(180deg, var(--surface) 80%, transparent 100%)', paddingBottom: '12px', marginBottom: '4px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' },
  titlu: { margin: 0, fontSize: '0.8rem', fontWeight: '800', color: 'var(--accent)', letterSpacing: '1.5px', fontFamily: '"Inter", sans-serif' },
  closeBtn: { background: 'var(--border)', border: '1px solid var(--border-strong)', color: 'var(--text-muted)', fontSize: '14px', borderRadius: '8px', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  row: { display: 'flex', gap: '10px' },
  field: { flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' },
  label: { fontSize: '9px', color: 'var(--accent)', fontWeight: '800', letterSpacing: '1px', fontFamily: '"Inter", sans-serif' },
  input: { backgroundColor: 'var(--bg)', border: '1px solid var(--border)', padding: '11px 10px', borderRadius: '8px', color: 'var(--text)', outline: 'none', fontSize: '14px', width: '100%', boxSizing: 'border-box', fontFamily: '"Inter", sans-serif' },
  dateInput: { backgroundColor: 'var(--bg)', border: '1px solid var(--border)', padding: '11px 10px', borderRadius: '8px', color: 'var(--text)', outline: 'none', fontSize: '14px', colorScheme: 'dark', width: '100%', boxSizing: 'border-box', fontFamily: '"Inter", sans-serif' },
  divider: { textAlign: 'center', fontSize: '9px', color: 'var(--accent)', margin: '4px 0', letterSpacing: '2px', fontWeight: '800', fontFamily: '"Inter", sans-serif' },
  docGrup: { display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '12px', borderBottom: '1px solid var(--border-soft)' },
  docGrupLabel: { margin: 0, fontSize: '9px', fontWeight: '800', color: 'var(--accent)', letterSpacing: '1.5px', fontFamily: '"Inter", sans-serif' },
  saveBtn: { backgroundColor: 'var(--accent)', color: 'var(--accent-ink)', padding: '14px', border: 'none', borderRadius: '10px', fontWeight: '800', fontSize: '13px', letterSpacing: '1px', cursor: 'pointer', marginTop: '6px', width: '100%', fontFamily: '"Inter", sans-serif' },
};

export default AdaugaVehiculModal;
