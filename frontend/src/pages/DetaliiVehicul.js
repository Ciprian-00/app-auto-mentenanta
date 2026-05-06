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
  const [showDocCustomModal, setShowDocCustomModal] = useState(false);

  const [nouKilometraj, setNouKilometraj] = useState('');
  const [formUlei, setFormUlei] = useState({ data: '', kilometraj: '' });
  const [formDoc, setFormDoc] = useState({ dataITP: '', dataRCA: '', dataRovinieta: '' });
  const [formDocCustom, setFormDocCustom] = useState({ nume: '', dataExpirare: '' });
  const [editDocCustomId, setEditDocCustomId] = useState(null);

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
    if (!nouKilometraj || Number(nouKilometraj) < 0) { toast.error('Introdu un kilometraj valid'); return; }
    try {
      await api.put(`/vehicles/${id}/kilometraj`, { kilometrajCurent: Number(nouKilometraj) });
      toast.success('Kilometraj actualizat!');
      setShowKmModal(false); setNouKilometraj('');
      await fetchVehicul(); await fetchRecomandari();
    } catch { toast.error('Eroare la actualizare'); }
  };

  const handleSalveazaUlei = async (e) => {
    e.preventDefault();
    if (!formUlei.data || !formUlei.kilometraj) { toast.error('Completează data și kilometrajul'); return; }
    try {
      await api.put(`/vehicles/${id}`, { ...vehicul, ultimulSchimbUlei: { data: formUlei.data, kilometraj: Number(formUlei.kilometraj) } });
      toast.success('Schimb ulei salvat!');
      setShowUleiModal(false); setFormUlei({ data: '', kilometraj: '' });
      await fetchVehicul(); await fetchRecomandari();
    } catch { toast.error('Eroare la salvare'); }
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
      await api.post(`/reminders/genereaza/${id}`);
      toast.success('Documente actualizate!');
      setShowDocModal(false); await fetchVehicul();
    } catch { toast.error('Eroare la salvare'); }
  };

  const handleAdaugaDocCustom = async (e) => {
    e.preventDefault();
    if (!formDocCustom.nume.trim()) { toast.error('Introdu un nume pentru document'); return; }
    try {
      let docsActualizate;
      if (editDocCustomId) {
        docsActualizate = (vehicul.documenteCustom || []).map(d =>
          d._id === editDocCustomId
            ? { ...d, nume: formDocCustom.nume.trim(), dataExpirare: formDocCustom.dataExpirare || null }
            : d
        );
      } else {
        docsActualizate = [...(vehicul.documenteCustom || []), { nume: formDocCustom.nume.trim(), dataExpirare: formDocCustom.dataExpirare || null }];
      }
      await api.put(`/vehicles/${id}`, { ...vehicul, documenteCustom: docsActualizate });
      await api.post(`/reminders/genereaza/${id}`);
      toast.success(editDocCustomId ? 'Document actualizat!' : 'Document adăugat!');
      setShowDocCustomModal(false); setFormDocCustom({ nume: '', dataExpirare: '' }); setEditDocCustomId(null);
      await fetchVehicul();
    } catch { toast.error('Eroare la salvare'); }
  };

  const handleStergeDocCustom = async (docId) => {
    try {
      const docs = (vehicul.documenteCustom || []).filter(d => d._id !== docId);
      await api.put(`/vehicles/${id}`, { ...vehicul, documenteCustom: docs });
      await api.post(`/reminders/genereaza/${id}`);
      toast.success('Document șters!'); await fetchVehicul();
    } catch { toast.error('Eroare la ștergere'); }
  };

  const formateazaData = (ds) => {
    if (!ds) return 'Nespecificat';
    return new Date(ds).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  const toDateInput = (ds) => { try { return new Date(ds).toISOString().split('T')[0]; } catch { return ''; } };

  const getStatusDoc = (ds) => {
    if (!ds) return { culoare: '#475569', text: '—', zile: null };
    const zile = Math.ceil((new Date(ds) - new Date()) / (1000 * 60 * 60 * 24));
    if (zile < 0) return { culoare: '#ff4d4d', text: 'Expirat', zile };
    if (zile <= 30) return { culoare: '#fbbf24', text: `${zile}z`, zile };
    return { culoare: '#22d3a5', text: `${zile}z`, zile };
  };

  if (loading) return (
    <div style={s.loadingWrap}>
      <div style={s.loadingSpinner} />
      <p style={{ color: '#00e5ff', letterSpacing: '2px', fontSize: '0.85rem', marginTop: '1rem' }}>SE INIȚIALIZEAZĂ...</p>
    </div>
  );

  if (!vehicul) return null;

  const stITP = getStatusDoc(vehicul.dataITP);
  const stRCA = getStatusDoc(vehicul.dataRCA);
  const stRov = getStatusDoc(vehicul.dataRovinieta);
  const recUrgente = recomandari.filter(r => r.urgent);
  const recNormale = recomandari.filter(r => !r.urgent);

  return (
    <div style={s.pagina}>

      {/* NAVBAR */}
      <nav style={s.navbar}>
        <button onClick={() => navigate(-1)} style={s.backBtn}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
          <span style={s.backText}>ÎNAPOI</span>
        </button>
        <span style={s.navMarca}>{vehicul.marca?.toUpperCase()}</span>
        <div style={{ width: '70px' }} />
      </nav>

      {/* HERO */}
      <div style={s.hero}>
        <div style={s.heroWatermark}>{vehicul.marca?.toUpperCase()}</div>
        <div style={s.heroContent}>

          <div style={s.heroTop}>
            <div>
              <p style={s.heroNume}>{vehicul.marca} <span style={{ color: '#00e5ff' }}>{vehicul.model}</span></p>
              <p style={s.heroMeta}>{vehicul.an} · {vehicul.motor}</p>
            </div>
            {vehicul.numarInmatriculare && (
              <div style={s.placuta}>
                <span style={s.placutaRo}>RO</span>
                <span style={s.placutaNr}>{vehicul.numarInmatriculare}</span>
              </div>
            )}
          </div>

          <div style={s.heroKmRow}>
            <div>
              <p style={s.heroKmLabel}>KILOMETRAJ CURENT</p>
              <p style={s.heroKm}>{vehicul.kilometrajCurent?.toLocaleString('ro-RO') || '0'} <span style={s.heroKmUnit}>km</span></p>
            </div>
            <button onClick={() => { setNouKilometraj(vehicul.kilometrajCurent || ''); setShowKmModal(true); }} style={s.kmBtn}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              ACTUALIZEAZĂ
            </button>
          </div>

        </div>
      </div>

      {/* BODY */}
      <div style={s.body}>

        {/* ALERTE SERVICE */}
        {(recomandari.length > 0 || loadingRec) && (
          <section style={s.sectiune}>
            <div style={s.sectLabel}>
              RECOMANDĂRI SERVICE
              {loadingRec && <span style={s.loadingTag}> · Se calculează...</span>}
            </div>
            <div style={s.card}>
              {recUrgente.map((r, i) => (
                <div key={i}>
                  {i > 0 && <div style={s.rowDiv} />}
                  <div style={{ ...s.recRow, borderLeft: '3px solid #ff4d4d' }}>
                    <div style={s.recRowLeft}>
                      <span style={{ ...s.recTip, color: '#ff4d4d' }}>{r.tip}</span>
                      <p style={s.recMesaj}>{r.mesaj}</p>
                      {r.detalii && <p style={s.recDetalii}>{r.detalii}</p>}
                    </div>
                    <span style={s.urgentTag}>URGENT</span>
                  </div>
                </div>
              ))}
              {recUrgente.length > 0 && recNormale.length > 0 && <div style={s.rowDiv} />}
              {recNormale.map((r, i) => (
                <div key={i}>
                  {i > 0 && <div style={s.rowDiv} />}
                  <div style={{ ...s.recRow, borderLeft: '3px solid #fbbf24' }}>
                    <div style={s.recRowLeft}>
                      <span style={{ ...s.recTip, color: '#fbbf24' }}>{r.tip}</span>
                      <p style={s.recMesaj}>{r.mesaj}</p>
                      {r.detalii && <p style={s.recDetalii}>{r.detalii}</p>}
                    </div>
                    <span style={s.atentieTag}>ATENȚIE</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* DOCUMENTE — card unificat */}
        <section style={s.sectiune}>
          <div style={s.sectLabel}>DOCUMENTE</div>
          <div style={s.card}>

            {/* Header cu buton editare */}
            <div style={s.cardHeader}>
              <span style={s.cardHeaderTitlu}>ITP · RCA · ROVINIETĂ</span>
              <button onClick={() => { setFormDoc({ dataITP: toDateInput(vehicul.dataITP), dataRCA: toDateInput(vehicul.dataRCA), dataRovinieta: toDateInput(vehicul.dataRovinieta) }); setShowDocModal(true); }} style={s.editBtn}>
                EDITEAZĂ
              </button>
            </div>

            {/* ITP */}
            <div style={s.row}>
              <span style={s.rowLabel}>ITP</span>
              <div style={s.rowRight}>
                <span style={s.rowVal}>{formateazaData(vehicul.dataITP)}</span>
                {vehicul.dataITP && <span style={{ ...s.pill, backgroundColor: `${stITP.culoare}22`, color: stITP.culoare }}>{stITP.text}</span>}
              </div>
            </div>
            <div style={s.rowDiv} />

            {/* RCA */}
            <div style={s.row}>
              <span style={s.rowLabel}>RCA</span>
              <div style={s.rowRight}>
                <span style={s.rowVal}>{formateazaData(vehicul.dataRCA)}</span>
                {vehicul.dataRCA && <span style={{ ...s.pill, backgroundColor: `${stRCA.culoare}22`, color: stRCA.culoare }}>{stRCA.text}</span>}
              </div>
            </div>
            <div style={s.rowDiv} />

            {/* ROVINIETA */}
            <div style={s.row}>
              <span style={s.rowLabel}>Rovinietă</span>
              <div style={s.rowRight}>
                <span style={s.rowVal}>{formateazaData(vehicul.dataRovinieta)}</span>
                {vehicul.dataRovinieta && <span style={{ ...s.pill, backgroundColor: `${stRov.culoare}22`, color: stRov.culoare }}>{stRov.text}</span>}
              </div>
            </div>

            {/* Documente custom */}
            {(vehicul.documenteCustom || []).map(doc => {
              const st = getStatusDoc(doc.dataExpirare);
              return (
                <div key={doc._id}>
                  <div style={s.rowDiv} />
                  <div style={s.row}>
                    <span style={s.rowLabel}>{doc.nume}</span>
                    <div style={s.rowRight}>
                      <span style={s.rowVal}>{doc.dataExpirare ? formateazaData(doc.dataExpirare) : '—'}</span>
                      {doc.dataExpirare && <span style={{ ...s.pill, backgroundColor: `${st.culoare}22`, color: st.culoare }}>{st.text}</span>}
                      <button onClick={() => { setEditDocCustomId(doc._id); setFormDocCustom({ nume: doc.nume, dataExpirare: toDateInput(doc.dataExpirare) }); setShowDocCustomModal(true); }} style={s.editRowBtn} title="Editează">✎</button>
                      <button onClick={() => handleStergeDocCustom(doc._id)} style={s.delBtn} title="Șterge">✕</button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Adaugă document */}
            <div style={s.rowDiv} />
            <button onClick={() => { setFormDocCustom({ nume: '', dataExpirare: '' }); setShowDocCustomModal(true); }} style={s.addRowBtn}>
              + Adaugă document
            </button>

          </div>
        </section>

        {/* SCHIMB ULEI */}
        <section style={s.sectiune}>
          <div style={s.sectLabel}>SCHIMB ULEI</div>
          <div style={s.card}>
            <div style={s.cardHeader}>
              <span style={s.cardHeaderTitlu}>ULTIMUL SCHIMB ÎNREGISTRAT</span>
              <button onClick={() => { setFormUlei({ data: toDateInput(vehicul?.ultimulSchimbUlei?.data), kilometraj: vehicul?.ultimulSchimbUlei?.kilometraj || '' }); setShowUleiModal(true); }} style={s.editBtn}>
                {vehicul.ultimulSchimbUlei?.data ? 'ACTUALIZEAZĂ' : 'ADAUGĂ'}
              </button>
            </div>

            {vehicul.ultimulSchimbUlei?.data ? (
              <>
                <div style={s.row}>
                  <span style={s.rowLabel}>Data schimb</span>
                  <span style={s.rowVal}>{formateazaData(vehicul.ultimulSchimbUlei.data)}</span>
                </div>
                <div style={s.rowDiv} />
                <div style={s.row}>
                  <span style={s.rowLabel}>Kilometraj la schimb</span>
                  <span style={s.rowVal}>{vehicul.ultimulSchimbUlei.kilometraj?.toLocaleString('ro-RO')} km</span>
                </div>
                {specificatii?.ulei && (
                  <>
                    <div style={s.rowDiv} />
                    <div style={s.row}>
                      <span style={s.rowLabel}>Tip ulei recomandat</span>
                      <span style={{ ...s.rowVal, color: '#00e5ff' }}>{specificatii.ulei.tip}</span>
                    </div>
                    <div style={s.rowDiv} />
                    <div style={s.row}>
                      <span style={s.rowLabel}>Cantitate</span>
                      <span style={s.rowVal}>{specificatii.ulei.cantitate} L</span>
                    </div>
                    <div style={s.rowDiv} />
                    <div style={s.row}>
                      <span style={s.rowLabel}>Interval recomandat</span>
                      <span style={s.rowVal}>{specificatii.ulei.intervalKm?.toLocaleString()} km / {specificatii.ulei.intervalLuni} luni</span>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div style={s.emptyRow}>
                <span style={s.emptyText}>Nu ai înregistrat niciun schimb de ulei.</span>
              </div>
            )}
          </div>
        </section>

        {/* SPECIFICATII TEHNICE */}
        {specificatii && (
          <section style={s.sectiune}>
            <div style={s.sectLabel}>SPECIFICAȚII TEHNICE</div>
            <div style={s.card}>

              {specificatii.anvelope?.fata && (
                <>
                  <div style={s.row}>
                    <span style={s.rowLabel}>Anvelope față</span>
                    <span style={s.rowVal}>{specificatii.anvelope.fata}</span>
                  </div>
                  <div style={s.rowDiv} />
                </>
              )}
              {specificatii.anvelope?.spate && (
                <>
                  <div style={s.row}>
                    <span style={s.rowLabel}>Anvelope spate</span>
                    <span style={s.rowVal}>{specificatii.anvelope.spate}</span>
                  </div>
                  <div style={s.rowDiv} />
                </>
              )}
              {specificatii.intervalDistributie > 0 && (
                <>
                  <div style={s.row}>
                    <span style={s.rowLabel}>Distribuție</span>
                    <span style={s.rowVal}>{specificatii.intervalDistributie?.toLocaleString()} km</span>
                  </div>
                  <div style={s.rowDiv} />
                </>
              )}
              {specificatii.intervalLichidFrana && (
                <>
                  <div style={s.row}>
                    <span style={s.rowLabel}>Lichid frână</span>
                    <span style={s.rowVal}>La {specificatii.intervalLichidFrana} luni</span>
                  </div>
                  <div style={s.rowDiv} />
                </>
              )}

              {/* Filtre */}
              {specificatii.filtreSchimb && (
                <>
                  {specificatii.filtreSchimb.filtruUlei && (
                    <>
                      <div style={s.row}>
                        <span style={s.rowLabel}>Filtru ulei</span>
                        <span style={s.filtruCode}>{specificatii.filtreSchimb.filtruUlei}</span>
                      </div>
                      <div style={s.rowDiv} />
                    </>
                  )}
                  {specificatii.filtreSchimb.filtruAer && (
                    <>
                      <div style={s.row}>
                        <span style={s.rowLabel}>Filtru aer</span>
                        <span style={s.filtruCode}>{specificatii.filtreSchimb.filtruAer}</span>
                      </div>
                      <div style={s.rowDiv} />
                    </>
                  )}
                  {specificatii.filtreSchimb.filtryCombustibil && (
                    <>
                      <div style={s.row}>
                        <span style={s.rowLabel}>Filtru combustibil</span>
                        <span style={s.filtruCode}>{specificatii.filtreSchimb.filtryCombustibil}</span>
                      </div>
                      <div style={s.rowDiv} />
                    </>
                  )}
                </>
              )}

              {/* Ulei */}
              {specificatii.ulei?.tip && (
                <div style={s.row}>
                  <span style={s.rowLabel}>Ulei recomandat</span>
                  <span style={{ ...s.rowVal, color: '#00e5ff' }}>{specificatii.ulei.tip} · {specificatii.ulei.cantitate}L</span>
                </div>
              )}

            </div>
          </section>
        )}

        {/* IDENTIFICARE */}
        <section style={{ ...s.sectiune, marginBottom: '3rem' }}>
          <div style={s.sectLabel}>IDENTIFICARE</div>
          <div style={s.card}>
            <div style={s.row}>
              <span style={s.rowLabel}>Serie șasiu (VIN)</span>
              <span style={{ ...s.rowVal, fontFamily: 'monospace', fontSize: '0.8rem', color: vehicul.vin ? '#fff' : '#475569' }}>
                {vehicul.vin || 'Nespecificat'}
              </span>
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
              <input type="number" style={s.mInput} value={nouKilometraj} onChange={e => setNouKilometraj(e.target.value)}
                placeholder={`Curent: ${vehicul.kilometrajCurent?.toLocaleString()} km`}
                min={vehicul.kilometrajCurent || 0} required autoFocus />
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
              <input type="date" style={{ ...s.mInput, colorScheme: 'dark' }} value={formUlei.data} onChange={e => setFormUlei({ ...formUlei, data: e.target.value })} required />
              <label style={s.mLabel}>Kilometraj la schimb</label>
              <input type="number" style={s.mInput} value={formUlei.kilometraj} onChange={e => setFormUlei({ ...formUlei, kilometraj: e.target.value })} placeholder="ex: 85000" required />
              {specificatii?.ulei && (
                <div style={s.infoBox}>
                  <p style={s.infoText}>Tip ulei: <strong>{specificatii.ulei.tip}</strong> · Cantitate: <strong>{specificatii.ulei.cantitate} L</strong></p>
                </div>
              )}
              <button type="submit" style={s.saveBtn}>SALVEAZĂ</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DOCUMENTE FIXE */}
      {showDocModal && (
        <div style={s.overlay} onClick={() => setShowDocModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h3 style={s.modalTitlu}>ACTUALIZEAZĂ DOCUMENTE</h3>
              <button onClick={() => setShowDocModal(false)} style={s.closeBtn}>✕</button>
            </div>
            <form onSubmit={handleSalveazaDoc} style={s.modalForm}>
              <label style={s.mLabel}>Expirare ITP</label>
              <input type="date" style={{ ...s.mInput, colorScheme: 'dark' }} value={formDoc.dataITP} onChange={e => setFormDoc({ ...formDoc, dataITP: e.target.value })} />
              <label style={s.mLabel}>Expirare RCA</label>
              <input type="date" style={{ ...s.mInput, colorScheme: 'dark' }} value={formDoc.dataRCA} onChange={e => setFormDoc({ ...formDoc, dataRCA: e.target.value })} />
              <label style={s.mLabel}>Expirare Rovinietă</label>
              <input type="date" style={{ ...s.mInput, colorScheme: 'dark' }} value={formDoc.dataRovinieta} onChange={e => setFormDoc({ ...formDoc, dataRovinieta: e.target.value })} />
              <button type="submit" style={s.saveBtn}>SALVEAZĂ</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DOCUMENT CUSTOM */}
      {showDocCustomModal && (
        <div style={s.overlay} onClick={() => { setShowDocCustomModal(false); setEditDocCustomId(null); setFormDocCustom({ nume: '', dataExpirare: '' }); }}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h3 style={s.modalTitlu}>{editDocCustomId ? 'EDITEAZĂ DOCUMENT' : 'DOCUMENT NOU'}</h3>
              <button onClick={() => { setShowDocCustomModal(false); setEditDocCustomId(null); setFormDocCustom({ nume: '', dataExpirare: '' }); }} style={s.closeBtn}>✕</button>
            </div>
            <form onSubmit={handleAdaugaDocCustom} style={s.modalForm}>
              <label style={s.mLabel}>Nume document</label>
              <input style={s.mInput} value={formDocCustom.nume} onChange={e => setFormDocCustom(f => ({ ...f, nume: e.target.value }))}
                placeholder="ex: CASCO, Garanție, Card service" required autoFocus />
              <label style={s.mLabel}>Data expirare (opțional)</label>
              <input type="date" style={{ ...s.mInput, colorScheme: 'dark' }} value={formDocCustom.dataExpirare}
                onChange={e => setFormDocCustom(f => ({ ...f, dataExpirare: e.target.value }))} />
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
    backgroundColor: '#0b0e14', color: '#fff', minHeight: '100vh',
    fontFamily: '"Inter", sans-serif',
    paddingBottom: 'calc(80px + env(safe-area-inset-bottom))',
  },
  loadingWrap: {
    minHeight: '100vh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#0b0e14',
  },
  loadingSpinner: {
    width: '40px', height: '40px',
    border: '3px solid rgba(0,229,255,0.2)', borderTop: '3px solid #00e5ff',
    borderRadius: '50%', animation: 'spin 0.8s linear infinite',
  },

  // NAVBAR
  navbar: {
    position: 'sticky', top: 0, zIndex: 40,
    backgroundColor: 'rgba(11,14,20,0.9)', backdropFilter: 'blur(16px)',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  backBtn: { background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', padding: '4px' },
  backText: { fontSize: '0.72rem', fontWeight: '700', letterSpacing: '1px', color: '#64748b' },
  navMarca: { fontSize: '0.72rem', fontWeight: '800', letterSpacing: '2.5px', color: '#00e5ff' },

  // HERO
  hero: {
    position: 'relative',
    background: 'linear-gradient(160deg, #0d1626 0%, #080b12 100%)',
    padding: '24px 20px 28px',
    overflow: 'hidden',
    borderBottom: '1px solid rgba(0,229,255,0.08)',
  },
  heroWatermark: {
    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
    fontSize: '6rem', fontWeight: '900', color: 'rgba(255,255,255,0.02)',
    letterSpacing: '8px', userSelect: 'none', whiteSpace: 'nowrap', pointerEvents: 'none',
  },
  heroContent: { position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '20px' },

  heroTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' },
  heroNume: { fontSize: '1.5rem', fontWeight: '800', margin: '0 0 4px 0', letterSpacing: '-0.3px', lineHeight: 1.2 },
  heroMeta: { fontSize: '0.68rem', color: '#64748b', margin: 0, letterSpacing: '1px', fontWeight: '600' },

  placuta: { display: 'inline-flex', alignItems: 'center', border: '2px solid rgba(255,255,255,0.15)', borderRadius: '5px', overflow: 'hidden', flexShrink: 0 },
  placutaRo: { background: '#003399', color: '#fff', fontSize: '0.55rem', fontWeight: '900', padding: '5px 6px', letterSpacing: '0.5px' },
  placutaNr: { background: '#fff', color: '#000', fontSize: '0.85rem', fontWeight: '900', padding: '5px 10px', letterSpacing: '2px' },

  heroKmRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '12px', padding: '16px 18px',
  },
  heroKmLabel: { fontSize: '0.58rem', color: '#64748b', fontWeight: '700', letterSpacing: '1.5px', margin: '0 0 6px 0' },
  heroKm: { fontSize: '2.4rem', fontWeight: '900', margin: 0, letterSpacing: '-1px', color: '#fff' },
  heroKmUnit: { fontSize: '1rem', color: '#64748b', fontWeight: '500' },
  kmBtn: {
    display: 'flex', alignItems: 'center', gap: '6px',
    background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.3)',
    color: '#00e5ff', borderRadius: '8px', padding: '9px 14px',
    fontSize: '0.65rem', fontWeight: '800', letterSpacing: '1px', cursor: 'pointer', whiteSpace: 'nowrap',
  },

  // BODY
  body: { padding: '20px', display: 'flex', flexDirection: 'column', gap: '0' },
  sectiune: { marginBottom: '24px' },
  sectLabel: { fontSize: '0.6rem', color: '#64748b', fontWeight: '800', letterSpacing: '2px', marginBottom: '10px', paddingLeft: '2px' },
  loadingTag: { color: '#475569', fontStyle: 'italic', fontWeight: '400' },

  // CARD — contenitor comun
  card: {
    backgroundColor: '#13161f', borderRadius: '14px',
    border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden',
  },
  cardHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  cardHeaderTitlu: { fontSize: '0.6rem', color: '#64748b', fontWeight: '800', letterSpacing: '1.5px' },
  editBtn: {
    background: 'none', border: '1px solid rgba(0,229,255,0.25)',
    color: '#00e5ff', fontSize: '0.6rem', fontWeight: '700',
    letterSpacing: '1px', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer',
  },

  // ROW — rând în card
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 16px', minHeight: '46px' },
  rowDiv: { height: '1px', backgroundColor: 'rgba(255,255,255,0.04)', margin: '0 16px' },
  rowLabel: { fontSize: '0.875rem', color: '#94a3b8' },
  rowRight: { display: 'flex', alignItems: 'center', gap: '8px' },
  rowVal: { fontSize: '0.875rem', fontWeight: '600', color: '#fff', textAlign: 'right' },

  // Status pill
  pill: { fontSize: '0.62rem', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', letterSpacing: '0.5px', whiteSpace: 'nowrap' },

  // Edit / Delete buttons pe rând custom
  editRowBtn: { background: 'none', border: 'none', color: '#64748b', fontSize: '0.85rem', cursor: 'pointer', padding: '2px 4px', lineHeight: 1 },
  delBtn: { background: 'none', border: 'none', color: '#475569', fontSize: '0.7rem', cursor: 'pointer', padding: '2px 4px', lineHeight: 1 },

  // Add row button
  addRowBtn: {
    display: 'block', width: '100%', background: 'none', border: 'none',
    color: '#00e5ff', fontSize: '0.82rem', fontWeight: '600',
    padding: '13px 16px', cursor: 'pointer', textAlign: 'left',
    letterSpacing: '0.3px',
  },

  // Empty row
  emptyRow: { padding: '20px 16px' },
  emptyText: { margin: 0, fontSize: '0.85rem', color: '#475569' },

  // Recomandari
  recRow: { padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' },
  recRowLeft: { flex: 1 },
  recTip: { fontSize: '0.68rem', fontWeight: '800', letterSpacing: '1px', display: 'block', marginBottom: '5px' },
  recMesaj: { margin: '0 0 4px 0', fontSize: '0.83rem', color: '#e2e8f0', lineHeight: 1.4 },
  recDetalii: { margin: 0, fontSize: '0.74rem', color: '#64748b' },
  urgentTag: { background: 'rgba(255,77,77,0.15)', color: '#ff4d4d', fontSize: '0.58rem', fontWeight: '700', padding: '3px 8px', borderRadius: '20px', letterSpacing: '1px', whiteSpace: 'nowrap', flexShrink: 0 },
  atentieTag: { background: 'rgba(251,191,36,0.15)', color: '#fbbf24', fontSize: '0.58rem', fontWeight: '700', padding: '3px 8px', borderRadius: '20px', letterSpacing: '1px', whiteSpace: 'nowrap', flexShrink: 0 },

  // Filtre cod
  filtruCode: { fontSize: '0.82rem', fontWeight: '700', color: '#00e5ff', fontFamily: 'monospace', background: 'rgba(0,229,255,0.08)', padding: '3px 10px', borderRadius: '5px' },

  // MODALS
  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  modal: { background: 'linear-gradient(180deg, #13161f 0%, #0b0e14 100%)', width: '100%', maxWidth: '420px', padding: '24px', borderRadius: '15px', border: '1px solid rgba(0,229,255,0.2)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  modalTitlu: { margin: 0, fontSize: '0.85rem', fontWeight: '800', color: '#00e5ff', letterSpacing: '1.5px' },
  closeBtn: { background: 'none', border: 'none', color: '#64748b', fontSize: '1.2rem', cursor: 'pointer', lineHeight: 1 },
  modalForm: { display: 'flex', flexDirection: 'column', gap: '14px' },
  mLabel: { fontSize: '0.68rem', fontWeight: '700', color: '#64748b', letterSpacing: '1px', marginBottom: '-8px' },
  mInput: { backgroundColor: '#0b0e14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '12px 14px', color: '#fff', fontSize: '0.95rem', outline: 'none', width: '100%', boxSizing: 'border-box' },
  infoBox: { backgroundColor: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.12)', borderRadius: '8px', padding: '11px 14px' },
  infoText: { margin: 0, fontSize: '0.8rem', color: '#94a3b8' },
  saveBtn: { backgroundColor: '#00e5ff', color: '#001f24', border: 'none', borderRadius: '8px', padding: '14px', fontSize: '0.8rem', fontWeight: '800', letterSpacing: '1px', cursor: 'pointer', marginTop: '4px', width: '100%' },
};

export default DetaliiVehicul;
