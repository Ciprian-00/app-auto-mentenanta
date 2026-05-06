import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';

const MARCI = ['Audi', 'BMW', 'Dacia', 'Mercedes-Benz', 'Renault', 'Volkswagen'];

const ANI = (() => {
  const lista = [];
  for (let an = 2027; an >= 1960; an--) {
    lista.push(an);
  }
  return lista;
})();

const Vehicule = () => {
  const navigate = useNavigate();
  const [vehicule, setVehicule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  const [modeleDisponibile, setModeleDisponibile] = useState([]);
  const [motorizariDisponibile, setMotorizariDisponibile] = useState([]);
  const [loadingModele, setLoadingModele] = useState(false);
  const [loadingMotorizari, setLoadingMotorizari] = useState(false);

  const initialFormState = {
    marca: '', model: '', an: '', motor: '', vin: '',
    numarInmatriculare: '', kilometrajCurent: '',
    dataITP: '', dataRCA: '', dataRovinieta: '',
    ultimulSchimbUleiData: '', ultimulSchimbUleiKilometraj: ''
  };

  const [formVehicul, setFormVehicul] = useState(initialFormState);

  useEffect(() => {
    document.body.style.margin = '0';
    document.body.style.backgroundColor = '#0b0e14';
    fetchVehicule();
  }, []);

  useEffect(() => {
    if (!formVehicul.marca) {
      setModeleDisponibile([]);
      setMotorizariDisponibile([]);
      return;
    }
    const fetchModele = async () => {
      setLoadingModele(true);
      try {
        const res = await api.get(`/specs/modele?marca=${encodeURIComponent(formVehicul.marca)}`);
        setModeleDisponibile(res.data);
      } catch {
        setModeleDisponibile([]);
      } finally {
        setLoadingModele(false);
      }
    };
    fetchModele();
  }, [formVehicul.marca]);

  useEffect(() => {
    if (!formVehicul.marca || !formVehicul.model || !formVehicul.an) {
      setMotorizariDisponibile([]);
      return;
    }
    const fetchMotorizari = async () => {
      setLoadingMotorizari(true);
      try {
        const res = await api.get(
          `/specs/motorizari?marca=${encodeURIComponent(formVehicul.marca)}&model=${encodeURIComponent(formVehicul.model)}&an=${formVehicul.an}`
        );
        setMotorizariDisponibile(res.data);
      } catch {
        setMotorizariDisponibile([]);
      } finally {
        setLoadingMotorizari(false);
      }
    };
    fetchMotorizari();
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

  const openAddModal = () => {
    setIsEditing(false);
    setFormVehicul(initialFormState);
    setModeleDisponibile([]);
    setMotorizariDisponibile([]);
    setShowModal(true);
  };

  const openEditModal = (e, vehicul) => {
    e.stopPropagation();
    setIsEditing(true);
    setCurrentId(vehicul._id);
    setFormVehicul({
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
      ultimulSchimbUleiKilometraj: vehicul.ultimulSchimbUlei?.kilometraj || ''
    });
    setShowModal(true);
  };

  const handleMarcaChange = (marca) => {
    setFormVehicul({ ...formVehicul, marca, model: '', motor: '' });
  };

  const handleModelChange = (model) => {
    setFormVehicul({ ...formVehicul, model, motor: '' });
  };

  const handleAnChange = (an) => {
    setFormVehicul({ ...formVehicul, an, motor: '' });
  };

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
        kilometraj: Number(formVehicul.ultimulSchimbUleiKilometraj) || null
      }
    };

    if (formVehicul.vin && formVehicul.vin.trim() !== '') {
      payload.vin = formVehicul.vin.trim();
    }

    try {
      if (isEditing) {
        await api.put(`/vehicles/${currentId}`, payload);
        toast.success('Informații actualizate!');
      } else {
        const res = await api.post('/vehicles', payload);
        await api.post(`/reminders/genereaza/${res.data._id}`);
        toast.success('Mașina a fost adăugată!');
      }
      setShowModal(false);
      fetchVehicule();
    } catch (error) {
      toast.error(error.response?.data?.mesaj || 'Eroare la salvare. Verifică datele introduse.');
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm('Confirmă ștergerea vehiculului din garaj.')) {
      try {
        await api.delete(`/vehicles/${id}`);
        toast.success('Vehicul șters.');
        fetchVehicule();
      } catch {
        toast.error('Eroare la ștergere');
      }
    }
  };

  const formateazaData = (dataString) => {
    if (!dataString) return 'N/A';
    return new Date(dataString).toLocaleDateString('ro-RO', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  const getStatusMasina = (vehicul) => {
    const acum = new Date();
    const zileAvertizare = 30;

    const acte = [
      { nume: 'ITP', data: vehicul.dataITP },
      { nume: 'RCA', data: vehicul.dataRCA },
      { nume: 'ROVINIETA', data: vehicul.dataRovinieta }
    ].filter(act => act.data);

    if (acte.length === 0) return { textBadge: 'DATE INCOMPLETE', mesajStare: 'ADAUGĂ ACTE', culoare: '#64748b' };

    for (let act of acte) {
      const diferentaZile = Math.ceil((new Date(act.data) - acum) / (1000 * 60 * 60 * 24));
      if (diferentaZile < 0) {
        return { textBadge: 'ACȚIUNE NECESARĂ', mesajStare: `${act.nume} EXPIRAT!`, culoare: '#ff4d4d' };
      } else if (diferentaZile <= zileAvertizare) {
        return { textBadge: 'NECESITĂ ATENȚIE', mesajStare: `${act.nume} expiră în ${diferentaZile} zile`, culoare: '#fbbf24' };
      }
    }

    return { textBadge: 'DOCUMENTE OK', mesajStare: 'OPTIM', culoare: '#22d3a5' };
  };

  if (loading) {
    return (
      <div style={s.loadingWrap}>
        <div style={s.loadingSpinner} />
        <p style={{ color: '#00e5ff', letterSpacing: '2px', fontSize: '0.85rem', marginTop: '1rem' }}>
          INIȚIALIZARE SISTEM...
        </p>
      </div>
    );
  }

  return (
    <div style={s.pagina}>

      {/* NAVBAR — identic cu DetaliiVehicul */}
      <nav style={s.navbar}>
        <div style={s.navLeft}>
          <button onClick={() => navigate(-1)} style={s.backBtn}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <span style={s.navTitlu}>Digital Garage</span>
        </div>
        <button onClick={openAddModal} style={s.addBtn}>
          + ADAUGĂ
        </button>
      </nav>

      {/* LISTA VEHICULE */}
      <main style={s.main}>

        {vehicule.length === 0 && (
          <div style={s.golContainer}>
            <span style={{ fontSize: '3rem' }}>🚗</span>
            <p style={s.golText}>Nu ai adăugat nicio mașină.</p>
            <button onClick={openAddModal} style={s.addBtn}>+ Adaugă prima mașină</button>
          </div>
        )}

        {vehicule.map(v => {
          const status = getStatusMasina(v);
          return (
            <div key={v._id} style={s.card} onClick={() => navigate(`/vehicule/${v._id}`)}>

              {/* CARD HEADER */}
              <div style={s.cardHeader}>
                <div style={s.brandWatermark}>{v.marca ? v.marca.toUpperCase() : 'AUTO'}</div>

                {/* Badge status */}
                <div style={s.statusBadge}>
                  <span style={{ ...s.statusDot, backgroundColor: status.culoare, boxShadow: `0 0 7px ${status.culoare}` }} />
                  {status.textBadge}
                </div>

                {/* Butoane editare / stergere */}
                <div style={s.actiuni}>
                  <button
                    onClick={(e) => openEditModal(e, v)}
                    style={s.iconBtn}
                    title="Editează"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, v._id)}
                    style={{ ...s.iconBtn, color: '#ff4d4d' }}
                    title="Șterge"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>

                {/* Numar inmatriculare — stilizat ca placuta */}
                {v.numarInmatriculare && (
                  <div style={s.placuta}>
                    <span style={s.placutaRo}>RO</span>
                    <span style={s.placutaNr}>{v.numarInmatriculare}</span>
                  </div>
                )}
              </div>

              {/* CARD BODY */}
              <div style={s.cardBody}>

                <div>
                  <h3 style={s.carNume}>{v.marca} {v.model}</h3>
                  <p style={s.carSub}>An {v.an} · {v.motor || 'Specificații N/A'}</p>
                </div>

                {/* Stats: kilometraj + stare */}
                <div style={s.statsRow}>
                  <div style={s.statBox}>
                    <span style={s.statLabel}>ODOMETER</span>
                    <span style={s.statVal}>
                      {v.kilometrajCurent?.toLocaleString() || 0}
                      <span style={s.statUnit}> km</span>
                    </span>
                  </div>
                  <div style={s.statBox}>
                    <span style={s.statLabel}>STARE SISTEM</span>
                    <span style={{ ...s.statVal, color: status.culoare, fontSize: '0.9rem' }}>
                      {status.mesajStare}
                    </span>
                  </div>
                </div>

                {/* Documente */}
                <div style={s.docsRow}>
                  {[
                    { label: 'ITP', data: v.dataITP },
                    { label: 'RCA', data: v.dataRCA },
                    { label: 'ROVINIETĂ', data: v.dataRovinieta }
                  ].map(({ label, data }) => {
                    const zile = data ? Math.ceil((new Date(data) - new Date()) / (1000 * 60 * 60 * 24)) : null;
                    const culoare = zile === null ? '#64748b' : zile < 0 ? '#ff4d4d' : zile <= 30 ? '#fbbf24' : '#94a3b8';
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

      {/* MODAL ADAUGA / EDITEAZA */}
      {showModal && (
        <div style={s.overlay} onClick={() => setShowModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h2 style={s.modalTitlu}>
                {isEditing ? 'EDITARE VEHICUL' : 'ADAUGĂ VEHICUL NOU'}
              </h2>
              <button onClick={() => setShowModal(false)} style={s.closeBtn}>✕</button>
            </div>

            <form onSubmit={handleSave} style={s.form}>

              <div style={s.formRow}>
                <div style={s.field}>
                  <label style={s.label}>MARCĂ</label>
                  <select style={s.input} value={formVehicul.marca} onChange={e => handleMarcaChange(e.target.value)} required>
                    <option value="">Alege marca</option>
                    {MARCI.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div style={s.field}>
                  <label style={s.label}>MODEL</label>
                  <select style={s.input} value={formVehicul.model} onChange={e => handleModelChange(e.target.value)} required disabled={!formVehicul.marca || loadingModele}>
                    <option value="">{loadingModele ? 'Se încarcă...' : !formVehicul.marca ? 'Alege mai întâi marca' : 'Alege modelul'}</option>
                    {modeleDisponibile.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              <div style={s.formRow}>
                <div style={s.field}>
                  <label style={s.label}>AN FABRICAȚIE</label>
                  <select style={s.input} value={formVehicul.an} onChange={e => handleAnChange(e.target.value)} required disabled={!formVehicul.model}>
                    <option value="">{!formVehicul.model ? 'Alege mai întâi modelul' : 'Alege anul'}</option>
                    {ANI.map(an => <option key={an} value={an}>{an}</option>)}
                  </select>
                </div>
                <div style={s.field}>
                  <label style={s.label}>MOTORIZARE</label>
                  <select style={s.input} value={formVehicul.motor} onChange={e => setFormVehicul({ ...formVehicul, motor: e.target.value })} required disabled={!formVehicul.an || loadingMotorizari}>
                    <option value="">
                      {loadingMotorizari ? 'Se încarcă...' : !formVehicul.an ? 'Alege mai întâi anul' : motorizariDisponibile.length === 0 ? 'Nicio motorizare găsită' : 'Alege motorizarea'}
                    </option>
                    {motorizariDisponibile.map((m, i) => (
                      <option key={i} value={m.motor}>{m.motor} ({m.tipCombustibil})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={s.formRow}>
                <div style={s.field}>
                  <label style={s.label}>NR. ÎNMATRICULARE</label>
                  <input style={s.input} value={formVehicul.numarInmatriculare} onChange={e => setFormVehicul({ ...formVehicul, numarInmatriculare: e.target.value })} placeholder="ex: SV 01 ABC" />
                </div>
                <div style={s.field}>
                  <label style={s.label}>KILOMETRAJ CURENT</label>
                  <input type="number" style={s.input} value={formVehicul.kilometrajCurent} onChange={e => setFormVehicul({ ...formVehicul, kilometrajCurent: e.target.value })} placeholder="ex: 85000" />
                </div>
              </div>

              <div style={s.field}>
                <label style={s.label}>SERIE ȘASIU (VIN)</label>
                <input style={s.input} placeholder="17 caractere" value={formVehicul.vin} onChange={e => setFormVehicul({ ...formVehicul, vin: e.target.value })} />
              </div>

              <div style={s.divider}>DOCUMENTE & EXPIRĂRI</div>

              <div style={s.formRow}>
                <div style={s.field}>
                  <label style={s.label}>DATA ITP</label>
                  <input type="date" style={s.dateInput} value={formVehicul.dataITP} onChange={e => setFormVehicul({ ...formVehicul, dataITP: e.target.value })} />
                </div>
                <div style={s.field}>
                  <label style={s.label}>DATA RCA</label>
                  <input type="date" style={s.dateInput} value={formVehicul.dataRCA} onChange={e => setFormVehicul({ ...formVehicul, dataRCA: e.target.value })} />
                </div>
              </div>

              <div style={s.field}>
                <label style={s.label}>DATA ROVINIETĂ</label>
                <input type="date" style={s.dateInput} value={formVehicul.dataRovinieta} onChange={e => setFormVehicul({ ...formVehicul, dataRovinieta: e.target.value })} />
              </div>

              <div style={s.divider}>ULTIMUL SCHIMB ULEI</div>

              <div style={s.formRow}>
                <div style={s.field}>
                  <label style={s.label}>DATA SCHIMB</label>
                  <input type="date" style={s.dateInput} value={formVehicul.ultimulSchimbUleiData} onChange={e => setFormVehicul({ ...formVehicul, ultimulSchimbUleiData: e.target.value })} />
                </div>
                <div style={s.field}>
                  <label style={s.label}>KM LA SCHIMB</label>
                  <input type="number" style={s.input} value={formVehicul.ultimulSchimbUleiKilometraj} onChange={e => setFormVehicul({ ...formVehicul, ultimulSchimbUleiKilometraj: e.target.value })} />
                </div>
              </div>

              <button type="submit" style={s.saveBtn}>
                {isEditing ? 'ACTUALIZEAZĂ DATELE' : 'SALVEAZĂ VEHICUL'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const s = {
  // PAGE
  pagina: {
    backgroundColor: '#0b0e14',
    color: '#fff',
    minHeight: '100vh',
    fontFamily: '"Inter", sans-serif',
    paddingBottom: 'calc(80px + env(safe-area-inset-bottom))',
    paddingTop: '80px',
  },
  loadingWrap: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0b0e14',
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(0,229,255,0.2)',
    borderTop: '3px solid #00e5ff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },

  // NAVBAR — identic cu DetaliiVehicul
  navbar: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 40,
    backgroundColor: 'rgba(11,14,20,0.85)',
    backdropFilter: 'blur(16px)',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    padding: '14px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px',
  },
  navTitlu: {
    fontSize: '1rem',
    fontWeight: '800',
    letterSpacing: '1px',
    color: '#fff',
  },
  addBtn: {
    backgroundColor: '#00e5ff',
    color: '#001f24',
    padding: '9px 16px',
    borderRadius: '8px',
    fontWeight: '800',
    fontSize: '0.75rem',
    letterSpacing: '1px',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(0,229,255,0.2)',
  },

  // MAIN
  main: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  golContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    padding: '4rem 1rem',
    textAlign: 'center',
  },
  golText: {
    color: '#64748b',
    margin: 0,
    fontSize: '0.9rem',
  },

  // CARD
  card: {
    backgroundColor: '#13161f',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '14px',
    overflow: 'hidden',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
  },

  // CARD HEADER
  cardHeader: {
    position: 'relative',
    height: '160px',
    background: 'linear-gradient(180deg, #0f1524 0%, #080b12 100%)',
    display: 'flex',
    alignItems: 'flex-end',
    padding: '14px',
    overflow: 'hidden',
  },
  brandWatermark: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: '4.5rem',
    fontWeight: '900',
    color: 'rgba(255,255,255,0.03)',
    letterSpacing: '6px',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
  },
  statusBadge: {
    position: 'absolute',
    top: '14px',
    left: '14px',
    backgroundColor: 'rgba(0,0,0,0.55)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#fff',
    padding: '5px 11px',
    borderRadius: '20px',
    fontSize: '9px',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backdropFilter: 'blur(6px)',
    zIndex: 3,
  },
  statusDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  actiuni: {
    position: 'absolute',
    top: '14px',
    right: '14px',
    display: 'flex',
    gap: '8px',
    zIndex: 3,
  },
  iconBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#fff',
    borderRadius: '8px',
    width: '32px',
    height: '32px',
    cursor: 'pointer',
    backdropFilter: 'blur(6px)',
    padding: 0,
    boxSizing: 'border-box',
    lineHeight: 0,
  },

  // Placuta inmatriculare — identica cu DetaliiVehicul
  placuta: {
    position: 'absolute',
    bottom: '14px',
    left: '14px',
    display: 'inline-flex',
    alignItems: 'center',
    border: '2px solid rgba(255,255,255,0.12)',
    borderRadius: '5px',
    overflow: 'hidden',
    zIndex: 3,
  },
  placutaRo: {
    background: '#003399',
    color: '#fff',
    fontSize: '0.55rem',
    fontWeight: '900',
    padding: '4px 6px',
    letterSpacing: '0.5px',
  },
  placutaNr: {
    background: '#fff',
    color: '#000',
    fontSize: '0.85rem',
    fontWeight: '900',
    padding: '4px 10px',
    letterSpacing: '2px',
  },

  // CARD BODY
  cardBody: {
    padding: '18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    backgroundColor: '#13161f',
  },
  carNume: {
    fontSize: '1.15rem',
    fontWeight: '800',
    margin: '0 0 4px 0',
    color: '#fff',
  },
  carSub: {
    fontSize: '0.65rem',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    margin: 0,
    fontWeight: '700',
  },

  // Stats row
  statsRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
  },
  statBox: {
    backgroundColor: '#1a1d27',
    border: '1px solid rgba(255,255,255,0.04)',
    padding: '11px 12px',
    borderRadius: '9px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  statLabel: {
    fontSize: '0.6rem',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    fontWeight: '700',
  },
  statVal: {
    fontSize: '1rem',
    fontWeight: '800',
    color: '#fff',
  },
  statUnit: {
    fontSize: '0.65rem',
    color: '#94a3b8',
    fontWeight: '400',
    textTransform: 'uppercase',
  },

  // Documente row
  docsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
    paddingTop: '14px',
    borderTop: '1px solid rgba(255,255,255,0.05)',
  },
  docItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  docLabel: {
    fontSize: '0.58rem',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    fontWeight: '700',
  },
  docVal: {
    fontSize: '0.75rem',
    fontWeight: '700',
  },

  // MODAL
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.82)',
    backdropFilter: 'blur(10px)',
    zIndex: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'calc(20px + env(safe-area-inset-top)) 20px calc(20px + env(safe-area-inset-bottom))',
  },
  modal: {
    background: 'linear-gradient(180deg, #13161f 0%, #0b0e14 100%)',
    width: '100%',
    maxWidth: '500px',
    padding: '24px',
    borderRadius: '15px',
    border: '1px solid rgba(0,229,255,0.25)',
    maxHeight: 'calc(85vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
    overflowY: 'auto',
  },
  modalHeader: {
    position: 'sticky',
    top: 0,
    zIndex: 1,
    background: 'linear-gradient(180deg, #13161f 80%, transparent 100%)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '16px',
    marginBottom: '4px',
  },
  modalTitlu: {
    fontSize: '0.85rem',
    fontWeight: '800',
    color: '#00e5ff',
    letterSpacing: '1.5px',
    margin: 0,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: '1.3rem',
    cursor: 'pointer',
    lineHeight: 1,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  formRow: {
    display: 'flex',
    gap: '14px',
  },
  field: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  label: {
    fontSize: '0.65rem',
    color: '#00e5ff',
    fontWeight: '800',
    letterSpacing: '1px',
  },
  input: {
    backgroundColor: '#0b0e14',
    border: '1px solid rgba(255,255,255,0.08)',
    padding: '11px 13px',
    borderRadius: '8px',
    color: '#fff',
    outline: 'none',
    fontSize: '0.875rem',
    width: '100%',
    boxSizing: 'border-box',
  },
  dateInput: {
    backgroundColor: '#0b0e14',
    border: '1px solid rgba(255,255,255,0.08)',
    padding: '11px 13px',
    borderRadius: '8px',
    color: '#fff',
    outline: 'none',
    fontSize: '0.875rem',
    colorScheme: 'dark',
    width: '100%',
    boxSizing: 'border-box',
  },
  divider: {
    textAlign: 'center',
    fontSize: '0.6rem',
    color: '#00e5ff',
    margin: '8px 0 2px 0',
    letterSpacing: '2px',
    fontWeight: '800',
  },
  saveBtn: {
    backgroundColor: '#00e5ff',
    color: '#001f24',
    padding: '14px',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '800',
    fontSize: '0.8rem',
    letterSpacing: '1px',
    cursor: 'pointer',
    marginTop: '6px',
    width: '100%',
  },
};

export default Vehicule;