import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';

const DetaliiVehicul = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [vehicul, setVehicul] = useState(null);
  const [recomandari, setRecomandari] = useState([]);
  const [specificatii, setSpecificatii] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingRec, setLoadingRec] = useState(false);

  const [showKmModal, setShowKmModal] = useState(false);
  const [showUleiModal, setShowUleiModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);

  const [nouKilometraj, setNouKilometraj] = useState('');
  const [formUlei, setFormUlei] = useState({ data: '', kilometraj: '' });
  const [formDoc, setFormDoc] = useState({ dataITP: '', dataRCA: '', dataRovinieta: '' });

  const fetchVehicul = useCallback(async () => {
    try {
      const res = await api.get(`/vehicles/${id}`);
      setVehicul(res.data);
    } catch {
      toast.error('Eroare la încărcarea vehiculului');
      navigate('/vehicule');
    }
  }, [id, navigate]);

  const fetchRecomandari = useCallback(async () => {
    setLoadingRec(true);
    try {
      const res = await api.get(`/vehicles/${id}/recomandari`);
      setRecomandari(res.data.recomandari || []);
      setSpecificatii(res.data.specificatii || null);
    } catch {
      setRecomandari([]);
    } finally {
      setLoadingRec(false);
    }
  }, [id]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchVehicul(), fetchRecomandari()]);
      setLoading(false);
    };
    init();
  }, [fetchVehicul, fetchRecomandari]);

  const handleActualizeazaKm = async (e) => {
    e.preventDefault();
    if (!nouKilometraj || Number(nouKilometraj) < 0) {
      toast.error('Introdu un kilometraj valid');
      return;
    }
    try {
      await api.put(`/vehicles/${id}/kilometraj`, { kilometrajCurent: Number(nouKilometraj) });
      toast.success('Kilometraj actualizat!');
      setShowKmModal(false);
      setNouKilometraj('');
      await fetchVehicul();
      await fetchRecomandari();
    } catch {
      toast.error('Eroare la actualizare');
    }
  };

  const handleSalveazaUlei = async (e) => {
    e.preventDefault();
    if (!formUlei.data || !formUlei.kilometraj) {
      toast.error('Completează data și kilometrajul');
      return;
    }
    try {
      await api.put(`/vehicles/${id}`, {
        ...vehicul,
        ultimulSchimbUlei: {
          data: formUlei.data,
          kilometraj: Number(formUlei.kilometraj)
        }
      });
      toast.success('Schimb ulei salvat!');
      setShowUleiModal(false);
      setFormUlei({ data: '', kilometraj: '' });
      await fetchVehicul();
      await fetchRecomandari();
    } catch {
      toast.error('Eroare la salvare');
    }
  };

  const handleSalveazaDoc = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/vehicles/${id}`, {
        ...vehicul,
        dataITP: formDoc.dataITP || vehicul.dataITP,
        dataRCA: formDoc.dataRCA || vehicul.dataRCA,
        dataRovinieta: formDoc.dataRovinieta || vehicul.dataRovinieta
      });
      toast.success('Documente actualizate!');
      setShowDocModal(false);
      await fetchVehicul();
    } catch {
      toast.error('Eroare la salvare');
    }
  };

  const formateazaData = (dataString) => {
    if (!dataString) return 'Nespecificat';
    return new Date(dataString).toLocaleDateString('ro-RO', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
  };

  const formateazaDataScurt = (dataString) => {
    if (!dataString) return null;
    return new Date(dataString).toISOString().split('T')[0];
  };

  const getStatusDoc = (dataString) => {
    if (!dataString) return { culoare: '#64748b', text: 'Nespecificat', zile: null };
    const zile = Math.ceil((new Date(dataString) - new Date()) / (1000 * 60 * 60 * 24));
    if (zile < 0) return { culoare: '#ff4d4d', text: 'Expirat', zile };
    if (zile <= 30) return { culoare: '#fbbf24', text: `${zile} zile`, zile };
    return { culoare: '#22d3a5', text: `${zile} zile`, zile };
  };

  const deschideDocModal = () => {
    setFormDoc({
      dataITP: formateazaDataScurt(vehicul?.dataITP) || '',
      dataRCA: formateazaDataScurt(vehicul?.dataRCA) || '',
      dataRovinieta: formateazaDataScurt(vehicul?.dataRovinieta) || ''
    });
    setShowDocModal(true);
  };

  if (loading) {
    return (
      <div style={s.loadingWrap}>
        <div style={s.loadingSpinner} />
        <p style={{ color: '#00e5ff', letterSpacing: '2px', fontSize: '0.85rem', marginTop: '1rem' }}>
          SE INIȚIALIZEAZĂ...
        </p>
      </div>
    );
  }

  if (!vehicul) return null;

  const statusITP = getStatusDoc(vehicul.dataITP);
  const statusRCA = getStatusDoc(vehicul.dataRCA);
  const statusRov = getStatusDoc(vehicul.dataRovinieta);

  const recUrgente = recomandari.filter(r => r.urgent);
  const recNormale = recomandari.filter(r => !r.urgent);

  return (
    <div style={s.pagina}>

      {/* NAVBAR */}
      <nav style={s.navbar}>
        <button onClick={() => navigate(-1)} style={s.backBtn}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span style={s.backText}>ÎNAPOI</span>
        </button>
        <div style={s.navCenter}>
          <span style={s.navMarca}>{vehicul.marca}</span>
        </div>
        <div style={{ width: '80px' }} />
      </nav>

      {/* HERO */}
      <div style={s.hero}>
        <div style={s.heroWatermark}>{vehicul.marca?.toUpperCase()}</div>

        <div style={s.heroContent}>
          <h1 style={s.heroTitlu}>
            {vehicul.marca} <span style={{ color: '#00e5ff' }}>{vehicul.model}</span>
          </h1>
          <p style={s.heroSubtitlu}>{vehicul.model?.toUpperCase()}</p>

          {vehicul.numarInmatriculare && (
            <div style={s.placuta}>
              <span style={s.placutaRo}>RO</span>
              <span style={s.placutaNr}>{vehicul.numarInmatriculare}</span>
            </div>
          )}

          <div style={s.heroStats}>
            <div style={s.heroStat}>
              <span style={s.heroStatLabel}>KILOMETRAJ</span>
              <span style={s.heroStatVal}>{vehicul.kilometrajCurent?.toLocaleString() || 0} <span style={s.heroStatUnit}>km</span></span>
            </div>
            <div style={s.heroStatDivider} />
            <div style={s.heroStat}>
              <span style={s.heroStatLabel}>AN FABRICAȚIE</span>
              <span style={s.heroStatVal}>{vehicul.an}</span>
            </div>
            <div style={s.heroStatDivider} />
            <div style={s.heroStat}>
              <span style={s.heroStatLabel}>MOTORIZARE</span>
              <span style={s.heroStatVal}>{vehicul.motor}</span>
            </div>
          </div>

          <button onClick={() => { setNouKilometraj(vehicul.kilometrajCurent || ''); setShowKmModal(true); }} style={s.kmBtn}>
            ACTUALIZEAZĂ KILOMETRAJ
          </button>
        </div>
      </div>

      {/* BODY */}
      <div style={s.body}>

        {/* STATUS DOCUMENTE */}
        <section style={s.sectiune}>
          <div style={s.sectiuneHeader}>
            <h2 style={s.sectiuneTitlu}>STATUS DOCUMENTE</h2>
            <button onClick={deschideDocModal} style={s.editBtn}>EDITEAZĂ</button>
          </div>

          <div style={s.docGrid}>
            {[
              { label: 'ITP', data: vehicul.dataITP, status: statusITP },
              { label: 'RCA', data: vehicul.dataRCA, status: statusRCA },
              { label: 'ROVINIETĂ', data: vehicul.dataRovinieta, status: statusRov }
            ].map(({ label, data, status }) => (
              <div key={label} style={{ ...s.docCard, borderTop: `3px solid ${status.culoare}` }}>
                <div style={s.docCardHeader}>
                  <span style={s.docLabel}>{label}</span>
                  <span style={{ ...s.docStatus, color: status.culoare }}>{status.text}</span>
                </div>
                <p style={s.docData}>{formateazaData(data)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* RECOMANDARI SERVICE */}
        <section style={s.sectiune}>
          <div style={s.sectiuneHeader}>
            <h2 style={s.sectiuneTitlu}>RECOMANDĂRI SERVICE</h2>
            {loadingRec && <span style={s.loadingTag}>Se calculează...</span>}
          </div>

          {recomandari.length === 0 && !loadingRec && (
            <div style={s.emptyCard}>
              <span style={{ fontSize: '2rem' }}>✅</span>
              <p style={s.emptyText}>
                {specificatii
                  ? 'Nu există recomandări active. Vehiculul este la zi.'
                  : 'Nu am specificații pentru acest vehicul în baza de date.'}
              </p>
            </div>
          )}

          {recUrgente.length > 0 && (
            <div style={s.recGrup}>
              {recUrgente.map((r, i) => (
                <div key={i} style={{ ...s.recCard, borderLeft: '4px solid #ff4d4d', backgroundColor: 'rgba(255,77,77,0.06)' }}>
                  <div style={s.recCardHeader}>
                    <span style={{ ...s.recTip, color: '#ff4d4d' }}>{r.tip.toUpperCase()}</span>
                    <span style={s.recUrgentTag}>URGENT</span>
                  </div>
                  <p style={s.recMesaj}>{r.mesaj}</p>
                  {r.detalii && <p style={s.recDetalii}>{r.detalii}</p>}
                </div>
              ))}
            </div>
          )}

          {recNormale.length > 0 && (
            <div style={s.recGrup}>
              {recNormale.map((r, i) => (
                <div key={i} style={{ ...s.recCard, borderLeft: '4px solid #fbbf24', backgroundColor: 'rgba(251,191,36,0.05)' }}>
                  <div style={s.recCardHeader}>
                    <span style={{ ...s.recTip, color: '#fbbf24' }}>{r.tip.toUpperCase()}</span>
                    <span style={s.recAtentieTag}>ATENȚIE</span>
                  </div>
                  <p style={s.recMesaj}>{r.mesaj}</p>
                  {r.detalii && <p style={s.recDetalii}>{r.detalii}</p>}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ULTIMUL SCHIMB ULEI */}
        <section style={s.sectiune}>
          <div style={s.sectiuneHeader}>
            <h2 style={s.sectiuneTitlu}>ULTIMUL SCHIMB ULEI</h2>
            <button onClick={() => {
              setFormUlei({
                data: formateazaDataScurt(vehicul?.ultimulSchimbUlei?.data) || '',
                kilometraj: vehicul?.ultimulSchimbUlei?.kilometraj || ''
              });
              setShowUleiModal(true);
            }} style={s.editBtn}>
              {vehicul.ultimulSchimbUlei?.data ? 'ACTUALIZEAZĂ' : 'ADAUGĂ'}
            </button>
          </div>

          {vehicul.ultimulSchimbUlei?.data ? (
            <div style={s.uleiCard}>
              <div style={s.uleiRow}>
                <span style={s.uleiLabel}>Data</span>
                <span style={s.uleiVal}>{formateazaData(vehicul.ultimulSchimbUlei.data)}</span>
              </div>
              <div style={s.uleiDivider} />
              <div style={s.uleiRow}>
                <span style={s.uleiLabel}>Kilometraj</span>
                <span style={s.uleiVal}>{vehicul.ultimulSchimbUlei.kilometraj?.toLocaleString()} <span style={{ fontSize: '0.8rem', color: '#64748b' }}>km</span></span>
              </div>
              {specificatii?.ulei && (
                <>
                  <div style={s.uleiDivider} />
                  <div style={s.uleiRow}>
                    <span style={s.uleiLabel}>Tip ulei recomandat</span>
                    <span style={s.uleiVal}>{specificatii.ulei.tip}</span>
                  </div>
                  <div style={s.uleiDivider} />
                  <div style={s.uleiRow}>
                    <span style={s.uleiLabel}>Cantitate</span>
                    <span style={s.uleiVal}>{specificatii.ulei.cantitate} L</span>
                  </div>
                  <div style={s.uleiDivider} />
                  <div style={s.uleiRow}>
                    <span style={s.uleiLabel}>Interval recomandat</span>
                    <span style={s.uleiVal}>{specificatii.ulei.intervalKm?.toLocaleString()} km / {specificatii.ulei.intervalLuni} luni</span>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div style={s.emptyCard}>
              <span style={{ fontSize: '2rem' }}>🛢️</span>
              <p style={s.emptyText}>Nu ai înregistrat niciun schimb de ulei.</p>
              <button onClick={() => setShowUleiModal(true)} style={{ ...s.editBtn, marginTop: '0.5rem' }}>
                + ADAUGĂ
              </button>
            </div>
          )}
        </section>

        {/* SPECIFICATII TEHNICE */}
        {specificatii && (
          <section style={{ ...s.sectiune, marginBottom: '2rem' }}>
            <h2 style={s.sectiuneTitlu}>SPECIFICAȚII TEHNICE</h2>

            <div style={s.specGrid}>
              {specificatii.anvelope?.fata && (
                <div style={s.specCard}>
                  <span style={s.specIcon}>🔄</span>
                  <span style={s.specLabel}>ANVELOPE FAȚĂ</span>
                  <span style={s.specVal}>{specificatii.anvelope.fata}</span>
                </div>
              )}
              {specificatii.anvelope?.spate && (
                <div style={s.specCard}>
                  <span style={s.specIcon}>🔄</span>
                  <span style={s.specLabel}>ANVELOPE SPATE</span>
                  <span style={s.specVal}>{specificatii.anvelope.spate}</span>
                </div>
              )}
              {specificatii.intervalDistributie > 0 && (
                <div style={s.specCard}>
                  <span style={s.specIcon}>⚙️</span>
                  <span style={s.specLabel}>DISTRIBUȚIE</span>
                  <span style={s.specVal}>{specificatii.intervalDistributie?.toLocaleString()} km</span>
                </div>
              )}
              {specificatii.intervalLichidFrana && (
                <div style={s.specCard}>
                  <span style={s.specIcon}>🛑</span>
                  <span style={s.specLabel}>LICHID FRÂNĂ</span>
                  <span style={s.specVal}>La {specificatii.intervalLichidFrana} luni</span>
                </div>
              )}
            </div>

            {/* Filtre */}
            {specificatii.filtreSchimb && (
              <div style={s.filtreCard}>
                <p style={s.filtreTitle}>CODURI FILTRE</p>
                <div style={s.filtreGrid}>
                  {specificatii.filtreSchimb.filtruUlei && (
                    <div style={s.filtruItem}>
                      <span style={s.filtruLabel}>Ulei</span>
                      <span style={s.filtruCode}>{specificatii.filtreSchimb.filtruUlei}</span>
                    </div>
                  )}
                  {specificatii.filtreSchimb.filtruAer && (
                    <div style={s.filtruItem}>
                      <span style={s.filtruLabel}>Aer</span>
                      <span style={s.filtruCode}>{specificatii.filtreSchimb.filtruAer}</span>
                    </div>
                  )}
                  {specificatii.filtreSchimb.filtryCombustibil && (
                    <div style={s.filtruItem}>
                      <span style={s.filtruLabel}>Combustibil</span>
                      <span style={s.filtruCode}>{specificatii.filtreSchimb.filtryCombustibil}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        )}

        {/* IDENTIFICARE */}
        <section style={{ ...s.sectiune, marginBottom: '3rem' }}>
          <h2 style={s.sectiuneTitlu}>IDENTIFICARE</h2>
          <div style={s.idCard}>
            <div style={s.idRow}>
              <span style={s.idLabel}>SERIE ȘASIU (VIN)</span>
              <span style={s.idVal}>{vehicul.vin || 'NESPECIFICAT'}</span>
            </div>
          </div>
        </section>

      </div>

      {/* MODAL KILOMETRAJ */}
      {showKmModal && (
        <div style={s.overlay} onClick={() => setShowKmModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h3 style={s.modalTitlu}>ACTUALIZEAZĂ KILOMETRAJ</h3>
              <button onClick={() => setShowKmModal(false)} style={s.closeBtn}>✕</button>
            </div>
            <form onSubmit={handleActualizeazaKm} style={s.modalForm}>
              <label style={s.mLabel}>Kilometraj curent (km)</label>
              <input
                type="number"
                style={s.mInput}
                value={nouKilometraj}
                onChange={e => setNouKilometraj(e.target.value)}
                placeholder={`Curent: ${vehicul.kilometrajCurent?.toLocaleString()} km`}
                min={vehicul.kilometrajCurent || 0}
                required
                autoFocus
              />
              <button type="submit" style={s.saveBtn}>SALVEAZĂ</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ULEI */}
      {showUleiModal && (
        <div style={s.overlay} onClick={() => setShowUleiModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h3 style={s.modalTitlu}>SCHIMB ULEI</h3>
              <button onClick={() => setShowUleiModal(false)} style={s.closeBtn}>✕</button>
            </div>
            <form onSubmit={handleSalveazaUlei} style={s.modalForm}>
              <label style={s.mLabel}>Data schimbului</label>
              <input
                type="date"
                style={{ ...s.mInput, colorScheme: 'dark' }}
                value={formUlei.data}
                onChange={e => setFormUlei({ ...formUlei, data: e.target.value })}
                required
              />
              <label style={s.mLabel}>Kilometraj la schimb</label>
              <input
                type="number"
                style={s.mInput}
                value={formUlei.kilometraj}
                onChange={e => setFormUlei({ ...formUlei, kilometraj: e.target.value })}
                placeholder="ex: 85000"
                required
              />
              {specificatii?.ulei && (
                <div style={s.infoBox}>
                  <p style={s.infoText}>Tip ulei recomandat: <strong>{specificatii.ulei.tip}</strong></p>
                  <p style={s.infoText}>Cantitate: <strong>{specificatii.ulei.cantitate} L</strong></p>
                </div>
              )}
              <button type="submit" style={s.saveBtn}>SALVEAZĂ</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DOCUMENTE */}
      {showDocModal && (
        <div style={s.overlay} onClick={() => setShowDocModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h3 style={s.modalTitlu}>ACTUALIZEAZĂ DOCUMENTE</h3>
              <button onClick={() => setShowDocModal(false)} style={s.closeBtn}>✕</button>
            </div>
            <form onSubmit={handleSalveazaDoc} style={s.modalForm}>
              <label style={s.mLabel}>Data expirare ITP</label>
              <input type="date" style={{ ...s.mInput, colorScheme: 'dark' }} value={formDoc.dataITP} onChange={e => setFormDoc({ ...formDoc, dataITP: e.target.value })} />
              <label style={s.mLabel}>Data expirare RCA</label>
              <input type="date" style={{ ...s.mInput, colorScheme: 'dark' }} value={formDoc.dataRCA} onChange={e => setFormDoc({ ...formDoc, dataRCA: e.target.value })} />
              <label style={s.mLabel}>Data expirare Rovinietă</label>
              <input type="date" style={{ ...s.mInput, colorScheme: 'dark' }} value={formDoc.dataRovinieta} onChange={e => setFormDoc({ ...formDoc, dataRovinieta: e.target.value })} />
              <button type="submit" style={s.saveBtn}>SALVEAZĂ</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

const s = {
  pagina: {
    backgroundColor: '#0b0e14',
    color: '#fff',
    minHeight: '100vh',
    fontFamily: '"Inter", sans-serif',
    paddingBottom: 'calc(80px + env(safe-area-inset-bottom))',
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

  // NAVBAR
  navbar: {
    position: 'sticky',
    top: 0,
    zIndex: 40,
    backgroundColor: 'rgba(11,14,20,0.85)',
    backdropFilter: 'blur(16px)',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    padding: '14px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '4px',
  },
  backText: {
    fontSize: '0.75rem',
    fontWeight: '700',
    letterSpacing: '1px',
    color: '#94a3b8',
  },
  navCenter: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  navMarca: {
    fontSize: '0.75rem',
    fontWeight: '700',
    letterSpacing: '2px',
    color: '#00e5ff',
  },

  // HERO
  hero: {
    position: 'relative',
    background: 'linear-gradient(180deg, #0f1524 0%, #080b12 100%)',
    padding: '30px 20px 35px',
    overflow: 'hidden',
    borderBottom: '1px solid rgba(0,229,255,0.1)',
  },
  heroWatermark: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: '5.5rem',
    fontWeight: '900',
    color: 'rgba(255,255,255,0.025)',
    letterSpacing: '6px',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
  },
  heroContent: {
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '12px',
  },
  heroTitlu: {
    fontSize: '1.8rem',
    fontWeight: '800',
    margin: 0,
    letterSpacing: '-0.5px',
  },
  heroSubtitlu: {
    fontSize: '0.7rem',
    color: '#64748b',
    letterSpacing: '3px',
    margin: 0,
  },
  placuta: {
    display: 'inline-flex',
    alignItems: 'center',
    border: '2px solid rgba(255,255,255,0.15)',
    borderRadius: '6px',
    overflow: 'hidden',
    marginTop: '4px',
  },
  placutaRo: {
    background: '#003399',
    color: '#fff',
    fontSize: '0.6rem',
    fontWeight: '900',
    padding: '6px 8px',
    letterSpacing: '0.5px',
  },
  placutaNr: {
    background: '#fff',
    color: '#000',
    fontSize: '1rem',
    fontWeight: '900',
    padding: '6px 14px',
    letterSpacing: '2px',
  },
  heroStats: {
    display: 'flex',
    alignItems: 'center',
    gap: '0',
    backgroundColor: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '12px',
    padding: '14px 8px',
    width: '100%',
    marginTop: '8px',
  },
  heroStat: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  heroStatLabel: {
    fontSize: '0.6rem',
    color: '#64748b',
    letterSpacing: '1px',
    fontWeight: '700',
  },
  heroStatVal: {
    fontSize: '1rem',
    fontWeight: '800',
    color: '#fff',
  },
  heroStatUnit: {
    fontSize: '0.65rem',
    color: '#94a3b8',
    fontWeight: '400',
  },
  heroStatDivider: {
    width: '1px',
    height: '30px',
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  kmBtn: {
    backgroundColor: '#00e5ff',
    color: '#001f24',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 24px',
    fontSize: '0.75rem',
    fontWeight: '800',
    letterSpacing: '1px',
    cursor: 'pointer',
    marginTop: '4px',
    width: '100%',
  },

  // BODY
  body: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
  },
  sectiune: {
    marginBottom: '28px',
  },
  sectiuneHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  sectiuneTitlu: {
    fontSize: '0.7rem',
    fontWeight: '700',
    color: '#00e5ff',
    letterSpacing: '2px',
    margin: 0,
  },
  loadingTag: {
    fontSize: '0.65rem',
    color: '#64748b',
    fontStyle: 'italic',
  },
  editBtn: {
    background: 'rgba(0,229,255,0.1)',
    border: '1px solid rgba(0,229,255,0.3)',
    color: '#00e5ff',
    fontSize: '0.65rem',
    fontWeight: '700',
    letterSpacing: '1px',
    padding: '5px 10px',
    borderRadius: '6px',
    cursor: 'pointer',
  },

  // DOCUMENTE
  docGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
  },
  docCard: {
    backgroundColor: '#13161f',
    borderRadius: '10px',
    padding: '14px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  docCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  docLabel: {
    fontSize: '0.65rem',
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: '1px',
  },
  docStatus: {
    fontSize: '0.65rem',
    fontWeight: '700',
  },
  docData: {
    fontSize: '0.8rem',
    fontWeight: '700',
    color: '#fff',
    margin: 0,
    lineHeight: '1.2',
  },

  // RECOMANDARI
  recGrup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '10px',
  },
  recCard: {
    borderRadius: '10px',
    padding: '14px 16px',
  },
  recCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  recTip: {
    fontSize: '0.7rem',
    fontWeight: '800',
    letterSpacing: '1px',
  },
  recUrgentTag: {
    background: 'rgba(255,77,77,0.2)',
    color: '#ff4d4d',
    fontSize: '0.6rem',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '20px',
    letterSpacing: '1px',
  },
  recAtentieTag: {
    background: 'rgba(251,191,36,0.2)',
    color: '#fbbf24',
    fontSize: '0.6rem',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '20px',
    letterSpacing: '1px',
  },
  recMesaj: {
    margin: '0 0 6px 0',
    fontSize: '0.85rem',
    color: '#e2e8f0',
    lineHeight: '1.4',
  },
  recDetalii: {
    margin: 0,
    fontSize: '0.75rem',
    color: '#64748b',
  },

  // EMPTY
  emptyCard: {
    backgroundColor: '#13161f',
    borderRadius: '10px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    textAlign: 'center',
  },
  emptyText: {
    margin: 0,
    fontSize: '0.85rem',
    color: '#64748b',
  },

  // ULEI
  uleiCard: {
    backgroundColor: '#13161f',
    borderRadius: '10px',
    overflow: 'hidden',
  },
  uleiRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px',
  },
  uleiDivider: {
    height: '1px',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  uleiLabel: {
    fontSize: '0.8rem',
    color: '#94a3b8',
  },
  uleiVal: {
    fontSize: '0.9rem',
    fontWeight: '700',
    color: '#fff',
  },

  // SPECIFICATII
  specGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
    marginBottom: '12px',
  },
  specCard: {
    backgroundColor: '#13161f',
    borderRadius: '10px',
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  specIcon: {
    fontSize: '1.2rem',
  },
  specLabel: {
    fontSize: '0.6rem',
    color: '#64748b',
    letterSpacing: '1px',
    fontWeight: '700',
  },
  specVal: {
    fontSize: '0.9rem',
    fontWeight: '700',
    color: '#fff',
  },
  filtreCard: {
    backgroundColor: '#13161f',
    borderRadius: '10px',
    padding: '14px 16px',
  },
  filtreTitle: {
    fontSize: '0.65rem',
    color: '#00e5ff',
    fontWeight: '700',
    letterSpacing: '2px',
    margin: '0 0 12px 0',
  },
  filtreGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  filtruItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filtruLabel: {
    fontSize: '0.8rem',
    color: '#94a3b8',
  },
  filtruCode: {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: '#00e5ff',
    fontFamily: 'monospace',
    background: 'rgba(0,229,255,0.08)',
    padding: '3px 10px',
    borderRadius: '5px',
  },

  // IDENTIFICARE
  idCard: {
    backgroundColor: '#13161f',
    borderRadius: '10px',
    overflow: 'hidden',
  },
  idRow: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  idLabel: {
    fontSize: '0.6rem',
    color: '#64748b',
    letterSpacing: '1.5px',
    fontWeight: '700',
  },
  idVal: {
    fontSize: '0.95rem',
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'monospace',
    letterSpacing: '1px',
  },

  // MODALS
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    backdropFilter: 'blur(8px)',
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  modal: {
    background: 'linear-gradient(180deg, #13161f 0%, #0b0e14 100%)',
    width: '100%',
    maxWidth: '420px',
    padding: '24px',
    borderRadius: '15px',
    border: '1px solid rgba(0,229,255,0.25)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  modalTitlu: {
    margin: 0,
    fontSize: '0.85rem',
    fontWeight: '800',
    color: '#00e5ff',
    letterSpacing: '1.5px',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: '1.3rem',
    cursor: 'pointer',
    lineHeight: 1,
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  mLabel: {
    fontSize: '0.7rem',
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: '1px',
    marginBottom: '-8px',
  },
  mInput: {
    backgroundColor: '#0b0e14',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    padding: '12px 14px',
    color: '#fff',
    fontSize: '0.95rem',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  infoBox: {
    backgroundColor: 'rgba(0,229,255,0.06)',
    border: '1px solid rgba(0,229,255,0.15)',
    borderRadius: '8px',
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  infoText: {
    margin: 0,
    fontSize: '0.8rem',
    color: '#94a3b8',
  },
  saveBtn: {
    backgroundColor: '#00e5ff',
    color: '#001f24',
    border: 'none',
    borderRadius: '8px',
    padding: '14px',
    fontSize: '0.8rem',
    fontWeight: '800',
    letterSpacing: '1px',
    cursor: 'pointer',
    marginTop: '4px',
    width: '100%',
  },
};

export default DetaliiVehicul;