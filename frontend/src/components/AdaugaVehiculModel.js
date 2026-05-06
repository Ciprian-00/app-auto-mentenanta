import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';

const MARCI = ['Audi', 'BMW', 'Dacia', 'Ford', 'Mercedes-Benz', 'Renault', 'Skoda', 'Toyota', 'Volkswagen'];

const ANI = (() => {
  const lista = [];
  for (let an = new Date().getFullYear() + 1; an >= 1990; an--) lista.push(an);
  return lista;
})();

const FORM_GOL = {
  marca: '', model: '', an: '', motor: '',
  numarInmatriculare: '', kilometrajCurent: '',
  dataITP: '', dataRCA: '', dataRovinieta: '',
  ultimulSchimbUleiData: '', ultimulSchimbUleiKilometraj: ''
};

const AdaugaVehiculModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState(FORM_GOL);
  const [modele, setModele] = useState([]);
  const [motorizari, setMotorizari] = useState([]);
  const [loadingModele, setLoadingModele] = useState(false);
  const [loadingMot, setLoadingMot] = useState(false);
  const [salvare, setSalvare] = useState(false);

  // Fetch modele cand se schimba marca
  useEffect(() => {
    if (!form.marca) { setModele([]); setMotorizari([]); return; }
    setLoadingModele(true);
    api.get(`/specs/modele?marca=${encodeURIComponent(form.marca)}`)
      .then(r => setModele(r.data))
      .catch(() => setModele([]))
      .finally(() => setLoadingModele(false));
  }, [form.marca]);

  // Fetch motorizari cand se schimba marca + model + an
  useEffect(() => {
    if (!form.marca || !form.model || !form.an) { setMotorizari([]); return; }
    setLoadingMot(true);
    api.get(`/specs/motorizari?marca=${encodeURIComponent(form.marca)}&model=${encodeURIComponent(form.model)}&an=${form.an}`)
      .then(r => setMotorizari(r.data))
      .catch(() => setMotorizari([]))
      .finally(() => setLoadingMot(false));
  }, [form.marca, form.model, form.an]);

  const set = (camp, val) => {
    if (camp === 'marca') {
      setForm({ ...FORM_GOL, marca: val });
    } else if (camp === 'model') {
      setForm(f => ({ ...f, model: val, motor: '' }));
    } else if (camp === 'an') {
      setForm(f => ({ ...f, an: val, motor: '' }));
    } else {
      setForm(f => ({ ...f, [camp]: val }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.marca || !form.model || !form.an || !form.motor) {
      toast.error('Completează: marcă, model, an și motorizare');
      return;
    }

    const toNullableDate = (v) => (typeof v === 'string' && v.trim() === '' ? null : v);

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
          kilometraj: Number(form.ultimulSchimbUleiKilometraj) || null
        }
      };

      const res = await api.post('/vehicles', payload);

      const vehicleId = res?.data?._id;
      if (!vehicleId) {
        throw new Error('Backend nu a returnat _id pentru vehiculul creat.');
      }

      await api.post(`/reminders/genereaza/${vehicleId}`);
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
          <div style={s.handle} />
          <div style={s.header}>
            <h3 style={s.titlu}>ADAUGĂ MAȘINĂ</h3>
            <button onClick={onClose} style={s.closeBtn}>✕</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={s.form}>

          {/* RAND 1: Marca + Model */}
          <div style={s.row}>
            <div style={s.field}>
              <label style={s.label}>MARCĂ</label>
              <select value={form.marca} onChange={e => set('marca', e.target.value)} style={s.input} required>
                <option value="">Alege</option>
                {MARCI.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div style={s.field}>
              <label style={s.label}>MODEL</label>
              <select
                value={form.model}
                onChange={e => set('model', e.target.value)}
                style={s.input}
                required
                disabled={!form.marca || loadingModele}
              >
                <option value="">
                  {loadingModele ? 'Se încarcă...' : !form.marca ? 'Alege marca' : modele.length === 0 ? 'N/A' : 'Alege'}
                </option>
                {modele.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* RAND 2: An + Motor */}
          <div style={s.row}>
            <div style={s.field}>
              <label style={s.label}>AN FABRICAȚIE</label>
              <select
                value={form.an}
                onChange={e => set('an', e.target.value)}
                style={s.input}
                required
                disabled={!form.model}
              >
                <option value="">{!form.model ? 'Alege modelul' : 'Alege'}</option>
                {ANI.map(an => <option key={an} value={an}>{an}</option>)}
              </select>
            </div>
            <div style={s.field}>
              <label style={s.label}>MOTORIZARE</label>
              <select
                value={form.motor}
                onChange={e => set('motor', e.target.value)}
                style={s.input}
                required
                disabled={!form.an || loadingMot}
              >
                <option value="">
                  {loadingMot ? 'Se încarcă...' : !form.an ? 'Alege anul' : motorizari.length === 0 ? 'Nicio motorizare' : 'Alege'}
                </option>
                {motorizari.map((m, i) => (
                  <option key={i} value={m.motor}>{m.motor} · {m.tipCombustibil}</option>
                ))}
              </select>
            </div>
          </div>

          {/* RAND 3: Nr + Km */}
          <div style={s.row}>
            <div style={s.field}>
              <label style={s.label}>NR. ÎNMATRICULARE</label>
              <input
                value={form.numarInmatriculare}
                onChange={e => set('numarInmatriculare', e.target.value)}
                placeholder="SV 01 ABC"
                style={s.input}
              />
            </div>
            <div style={s.field}>
              <label style={s.label}>KILOMETRAJ</label>
              <input
                type="number"
                value={form.kilometrajCurent}
                onChange={e => set('kilometrajCurent', e.target.value)}
                placeholder="85000"
                style={s.input}
              />
            </div>
          </div>

          <div style={s.divider}>EXPIRĂRI DOCUMENTE</div>

          <div style={s.row}>
            <div style={s.field}>
              <label style={s.label}>DATA ITP</label>
              <input type="date" value={form.dataITP} onChange={e => set('dataITP', e.target.value)} style={s.dateInput} />
            </div>
            <div style={s.field}>
              <label style={s.label}>DATA RCA</label>
              <input type="date" value={form.dataRCA} onChange={e => set('dataRCA', e.target.value)} style={s.dateInput} />
            </div>
          </div>

          <div style={s.field}>
            <label style={s.label}>DATA ROVINIETĂ</label>
            <input type="date" value={form.dataRovinieta} onChange={e => set('dataRovinieta', e.target.value)} style={s.dateInput} />
          </div>

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

          <button type="submit" style={s.saveBtn} disabled={salvare}>
            {salvare ? 'SE SALVEAZĂ...' : 'SALVEAZĂ MAȘINA'}
          </button>
        </form>
      </div>
    </div>
  );
};

const s = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.85)',
    backdropFilter: 'blur(12px)',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    zIndex: 500,
  },
  modal: {
    background: 'linear-gradient(180deg, #13161f 0%, #0b0e14 100%)',
    width: '100%',
    maxWidth: '600px',
    padding: '12px 20px calc(24px + env(safe-area-inset-bottom))',
    borderRadius: '20px 20px 0 0',
    border: '1px solid rgba(0,229,255,0.15)',
    borderBottom: 'none',
    maxHeight: 'calc(90vh - env(safe-area-inset-top))',
    overflowY: 'auto',
  },
  stickyTop: {
    position: 'sticky',
    top: 0,
    zIndex: 1,
    background: 'linear-gradient(180deg, #13161f 80%, transparent 100%)',
    paddingTop: '4px',
    paddingBottom: '4px',
    marginBottom: '8px',
  },
  handle: {
    width: '40px',
    height: '4px',
    background: 'rgba(255,255,255,0.15)',
    borderRadius: '2px',
    margin: '0 auto 14px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  titlu: {
    margin: 0,
    fontSize: '0.8rem',
    fontWeight: '800',
    color: '#00e5ff',
    letterSpacing: '1.5px',
    fontFamily: '"Inter", sans-serif',
  },
  closeBtn: {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#94a3b8',
    fontSize: '14px',
    borderRadius: '8px',
    width: '30px',
    height: '30px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  row: {
    display: 'flex',
    gap: '10px',
  },
  field: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  label: {
    fontSize: '9px',
    color: '#00e5ff',
    fontWeight: '800',
    letterSpacing: '1px',
    fontFamily: '"Inter", sans-serif',
  },
  input: {
    backgroundColor: '#0b0e14',
    border: '1px solid rgba(255,255,255,0.08)',
    padding: '11px 10px',
    borderRadius: '8px',
    color: '#fff',
    outline: 'none',
    fontSize: '14px',
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: '"Inter", sans-serif',
  },
  dateInput: {
    backgroundColor: '#0b0e14',
    border: '1px solid rgba(255,255,255,0.08)',
    padding: '11px 10px',
    borderRadius: '8px',
    color: '#fff',
    outline: 'none',
    fontSize: '14px',
    colorScheme: 'dark',
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: '"Inter", sans-serif',
  },
  divider: {
    textAlign: 'center',
    fontSize: '9px',
    color: '#00e5ff',
    margin: '4px 0',
    letterSpacing: '2px',
    fontWeight: '800',
    fontFamily: '"Inter", sans-serif',
  },
  saveBtn: {
    backgroundColor: '#00e5ff',
    color: '#001f24',
    padding: '14px',
    border: 'none',
    borderRadius: '10px',
    fontWeight: '800',
    fontSize: '13px',
    letterSpacing: '1px',
    cursor: 'pointer',
    marginTop: '6px',
    width: '100%',
    fontFamily: '"Inter", sans-serif',
  },
};

export default AdaugaVehiculModal;
