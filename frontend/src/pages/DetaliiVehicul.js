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
  const [showIstoricModal, setShowIstoricModal] = useState(false);
  const [showDistributieModal, setShowDistributieModal] = useState(false);
  const [showLichidFranaModal, setShowLichidFranaModal] = useState(false);

  const [nouKilometraj, setNouKilometraj] = useState('');
  const [formUlei, setFormUlei] = useState({ data: '', kilometraj: '', cost: '' });
  const [formDistributie, setFormDistributie] = useState({ data: '', kilometraj: '', cost: '' });
  const [formLichidFrana, setFormLichidFrana] = useState({ data: '', cost: '' });
  const [formDoc, setFormDoc] = useState({ dataITP: '', dataRCA: '', dataRovinieta: '', obtinereITP: '', obtinereRCA: '', obtinereRovinieta: '', costITP: '', costRCA: '', costRovinieta: '' });
  const [formDocCustom, setFormDocCustom] = useState({ nume: '', dataExpirare: '', cost: '' });
  const [editDocCustomId, setEditDocCustomId] = useState(null);

  const [istoric, setIstoric] = useState([]);
  const [editIstoricId, setEditIstoricId] = useState(null);
  const FORM_ISTORIC_GOL = { tip: '', data: '', kilometraj: '', descriere: '', cost: '', service: '' };
  const SUGESTII_TIP = ['Revizie', 'Schimb ulei', 'Anvelope', 'Frâne', 'Distribuție', 'Reparație', 'ITP', 'Altele'];
  const [formIstoric, setFormIstoric] = useState(FORM_ISTORIC_GOL);

  const fetchVehicul = useCallback(async () => {
    try {
      const res = await api.get(`/vehicles/${id}`);
      setVehicul(res.data);
    } catch {
      toast.error('Eroare la încărcarea vehiculului');
      navigate('/vehicule');
    }
  }, [id, navigate]);

  const fetchIstoric = useCallback(async () => {
    try {
      const res = await api.get(`/maintenance/vehicul/${id}`);
      setIstoric(res.data);
    } catch { setIstoric([]); }
  }, [id]);

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
      await Promise.all([fetchVehicul(), fetchRecomandari(), fetchIstoric()]);
      setLoading(false);
    };
    init();
  }, [fetchVehicul, fetchRecomandari, fetchIstoric]);

  const handleSalveazaIstoric = async (e) => {
    e.preventDefault();
    if (!formIstoric.tip || !formIstoric.data || !formIstoric.kilometraj) {
      toast.error('Completează tipul, data și kilometrajul'); return;
    }
    try {
      const payload = {
        tip: formIstoric.tip,
        data: formIstoric.data,
        kilometraj: Number(formIstoric.kilometraj),
        descriere: formIstoric.descriere || undefined,
        cost: formIstoric.cost ? Number(formIstoric.cost) : undefined,
        service: formIstoric.service || undefined,
      };
      if (editIstoricId) {
        await api.put(`/maintenance/${editIstoricId}`, payload);
        toast.success('Intrare actualizată!');
      } else {
        await api.post(`/maintenance/vehicul/${id}`, payload);
        toast.success('Intrare adăugată!');
      }
      setShowIstoricModal(false); setFormIstoric(FORM_ISTORIC_GOL); setEditIstoricId(null);
      await fetchIstoric();
    } catch { toast.error('Eroare la salvare'); }
  };

  const handleStergeIstoric = async (intrareId) => {
    try {
      await api.delete(`/maintenance/${intrareId}`);
      toast.success('Intrare ștearsă');
      await fetchIstoric();
    } catch { toast.error('Eroare la ștergere'); }
  };

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
      await api.post(`/maintenance/vehicul/${id}`, {
        tip: 'Schimb ulei',
        data: formUlei.data,
        kilometraj: Number(formUlei.kilometraj),
        cost: formUlei.cost ? Number(formUlei.cost) : undefined,
      });
      await api.post(`/reminders/genereaza/${id}`);
      toast.success('Schimb ulei salvat!');
      setShowUleiModal(false); setFormUlei({ data: '', kilometraj: '', cost: '' });
      await fetchVehicul(); await fetchRecomandari(); await fetchIstoric();
    } catch { toast.error('Eroare la salvare'); }
  };

  const handleSalveazaDistributie = async (e) => {
    e.preventDefault();
    if (!formDistributie.data || !formDistributie.kilometraj) { toast.error('Completează data și kilometrajul'); return; }
    try {
      await api.put(`/vehicles/${id}`, { ...vehicul, ultimaDistributie: { data: formDistributie.data, kilometraj: Number(formDistributie.kilometraj) } });
      await api.post(`/maintenance/vehicul/${id}`, {
        tip: 'Distribuție', data: formDistributie.data,
        kilometraj: Number(formDistributie.kilometraj),
        cost: formDistributie.cost ? Number(formDistributie.cost) : undefined,
      });
      await api.post(`/reminders/genereaza/${id}`);
      toast.success('Distribuție salvată!');
      setShowDistributieModal(false); setFormDistributie({ data: '', kilometraj: '', cost: '' });
      await fetchVehicul(); await fetchRecomandari(); await fetchIstoric();
    } catch { toast.error('Eroare la salvare'); }
  };

  const handleSalveazaLichidFrana = async (e) => {
    e.preventDefault();
    if (!formLichidFrana.data) { toast.error('Completează data'); return; }
    try {
      await api.put(`/vehicles/${id}`, { ...vehicul, ultimulLichidFrana: { data: formLichidFrana.data } });
      await api.post(`/maintenance/vehicul/${id}`, {
        tip: 'Lichid frână', data: formLichidFrana.data,
        kilometraj: vehicul.kilometrajCurent || 0,
        cost: formLichidFrana.cost ? Number(formLichidFrana.cost) : undefined,
      });
      await api.post(`/reminders/genereaza/${id}`);
      toast.success('Lichid frână salvat!');
      setShowLichidFranaModal(false); setFormLichidFrana({ data: '', cost: '' });
      await fetchVehicul(); await fetchRecomandari(); await fetchIstoric();
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
      const azi = new Date().toISOString().split('T')[0];
      const loguriDoc = [
        formDoc.costITP && { tip: 'ITP', data: formDoc.obtinereITP || azi, cost: Number(formDoc.costITP) },
        formDoc.costRCA && { tip: 'RCA', data: formDoc.obtinereRCA || azi, cost: Number(formDoc.costRCA) },
        formDoc.costRovinieta && { tip: 'Rovinietă', data: formDoc.obtinereRovinieta || azi, cost: Number(formDoc.costRovinieta) },
      ].filter(Boolean);
      await Promise.all(loguriDoc.map(l => api.post(`/maintenance/vehicul/${id}`, { ...l, categorie: 'document' })));
      if (loguriDoc.length) await fetchIstoric();
      toast.success('Documente actualizate!');
      setShowDocModal(false);
      setFormDoc({ dataITP: '', dataRCA: '', dataRovinieta: '', obtinereITP: '', obtinereRCA: '', obtinereRovinieta: '', costITP: '', costRCA: '', costRovinieta: '' });
      await fetchVehicul();
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
      if (formDocCustom.cost && !editDocCustomId) {
        const azi = new Date().toISOString().split('T')[0];
        await api.post(`/maintenance/vehicul/${id}`, {
          tip: formDocCustom.nume.trim(), categorie: 'document',
          data: azi, cost: Number(formDocCustom.cost)
        });
        await fetchIstoric();
      }
      toast.success(editDocCustomId ? 'Document actualizat!' : 'Document adăugat!');
      setShowDocCustomModal(false); setFormDocCustom({ nume: '', dataExpirare: '', cost: '' }); setEditDocCustomId(null);
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

        {/* DOCUMENTE */}
        <section style={s.sectiune}>
          <div style={s.sectLabel}>DOCUMENTE</div>
          <div style={s.card}>
            <div style={s.cardHeader}>
              <span style={s.cardHeaderTitlu}>ITP · RCA · ROVINIETĂ</span>
              <button onClick={() => { setFormDoc({ dataITP: toDateInput(vehicul.dataITP), dataRCA: toDateInput(vehicul.dataRCA), dataRovinieta: toDateInput(vehicul.dataRovinieta), obtinereITP: '', obtinereRCA: '', obtinereRovinieta: '', costITP: '', costRCA: '', costRovinieta: '' }); setShowDocModal(true); }} style={s.editBtn}>
                EDITEAZĂ
              </button>
            </div>
            {[
              { label: 'ITP', st: stITP, data: vehicul.dataITP },
              { label: 'RCA', st: stRCA, data: vehicul.dataRCA },
              { label: 'Rovinietă', st: stRov, data: vehicul.dataRovinieta },
            ].map((doc, i) => (
              <div key={doc.label}>
                {i > 0 && <div style={s.rowDiv} />}
                <div style={s.row}>
                  <span style={s.rowLabel}>{doc.label}</span>
                  <div style={s.rowRight}>
                    <span style={s.rowVal}>{formateazaData(doc.data)}</span>
                    {doc.data && <span style={{ ...s.pill, backgroundColor: `${doc.st.culoare}22`, color: doc.st.culoare }}>{doc.st.text}</span>}
                  </div>
                </div>
              </div>
            ))}
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
                      <button onClick={() => { setEditDocCustomId(doc._id); setFormDocCustom({ nume: doc.nume, dataExpirare: toDateInput(doc.dataExpirare) }); setShowDocCustomModal(true); }} style={s.editRowBtn}>✎</button>
                      <button onClick={() => handleStergeDocCustom(doc._id)} style={s.delBtn}>✕</button>
                    </div>
                  </div>
                </div>
              );
            })}
            <div style={s.rowDiv} />
            <button onClick={() => { setFormDocCustom({ nume: '', dataExpirare: '' }); setShowDocCustomModal(true); }} style={s.addRowBtn}>
              + Adaugă document
            </button>
          </div>
        </section>

        {/* MENTENANȚĂ */}
        <section style={s.sectiune}>
          <div style={s.sectLabel}>MENTENANȚĂ</div>
          <div style={s.card}>

            {/* Rând ulei — status + actualizare */}
            {(() => {
              const u = vehicul.ultimulSchimbUlei;
              let uleiColor = '#475569', uleiText = null;
              if (u?.data) {
                const dataUrmatoare = new Date(u.data);
                dataUrmatoare.setFullYear(dataUrmatoare.getFullYear() + 1);
                const depasitKm = (vehicul.kilometrajCurent || 0) > 0 && (u.kilometraj || 0) > 0 && ((vehicul.kilometrajCurent - u.kilometraj) >= 10000);
                const zile = depasitKm ? -1 : Math.ceil((dataUrmatoare - new Date()) / (1000 * 60 * 60 * 24));
                uleiColor = zile < 0 ? '#ff4d4d' : zile <= 30 ? '#fbbf24' : '#22d3a5';
                uleiText = zile < 0 ? 'Depășit' : zile <= 30 ? `${zile}z` : 'La zi';
              }
              return (
                <div style={s.row}>
                  <div>
                    <span style={s.rowLabel}>🛢 Schimb ulei</span>
                    {u?.data
                      ? <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#475569' }}>
                          {formateazaData(u.data)} · {u.kilometraj?.toLocaleString('ro-RO')} km
                          {specificatii?.ulei ? ` · ${specificatii.ulei.tip}` : ''}
                        </p>
                      : <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#334155' }}>Neînregistrat</p>
                    }
                  </div>
                  <div style={s.rowRight}>
                    {uleiText && <span style={{ ...s.pill, backgroundColor: `${uleiColor}22`, color: uleiColor }}>{uleiText}</span>}
                    <button onClick={() => { setFormUlei({ data: toDateInput(u?.data), kilometraj: u?.kilometraj || '', cost: '' }); setShowUleiModal(true); }} style={s.editBtn}>
                      {u?.data ? '✎' : 'ADAUGĂ'}
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Distribuție — doar dacă spec are interval */}
            {specificatii?.intervalDistributie > 0 && (() => {
              const u = vehicul.ultimaDistributie;
              let distColor = '#475569', distText = null;
              if (u?.data) {
                const intervalLuni = specificatii.intervalDistributieLuni || 60;
                const dataUrm = new Date(u.data);
                dataUrm.setMonth(dataUrm.getMonth() + intervalLuni);
                const depasitKm = (vehicul.kilometrajCurent || 0) > 0 && (u.kilometraj || 0) > 0 &&
                  ((vehicul.kilometrajCurent - u.kilometraj) >= specificatii.intervalDistributie);
                const zile = depasitKm ? -1 : Math.ceil((dataUrm - new Date()) / (1000 * 60 * 60 * 24));
                distColor = zile < 0 ? '#ff4d4d' : zile <= 60 ? '#fbbf24' : '#22d3a5';
                distText = zile < 0 ? 'Depășit' : zile <= 60 ? `${zile}z` : 'La zi';
              }
              return (
                <>
                  <div style={s.rowDiv} />
                  <div style={s.row}>
                    <div>
                      <span style={s.rowLabel}>⚙️ Distribuție</span>
                      {u?.data
                        ? <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#475569' }}>
                            {formateazaData(u.data)} · {u.kilometraj?.toLocaleString('ro-RO')} km
                          </p>
                        : <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#334155' }}>Neînregistrat</p>
                      }
                    </div>
                    <div style={s.rowRight}>
                      {distText && <span style={{ ...s.pill, backgroundColor: `${distColor}22`, color: distColor }}>{distText}</span>}
                      <button onClick={() => { setFormDistributie({ data: toDateInput(u?.data), kilometraj: u?.kilometraj || '', cost: '' }); setShowDistributieModal(true); }} style={s.editBtn}>
                        {u?.data ? '✎' : 'ADAUGĂ'}
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}

            {/* Lichid frână — doar dacă spec are interval */}
            {specificatii?.intervalLichidFrana > 0 && (() => {
              const u = vehicul.ultimulLichidFrana;
              let lichidColor = '#475569', lichidText = null;
              if (u?.data) {
                const dataUrm = new Date(u.data);
                dataUrm.setMonth(dataUrm.getMonth() + specificatii.intervalLichidFrana);
                const zile = Math.ceil((dataUrm - new Date()) / (1000 * 60 * 60 * 24));
                lichidColor = zile < 0 ? '#ff4d4d' : zile <= 60 ? '#fbbf24' : '#22d3a5';
                lichidText = zile < 0 ? 'Depășit' : zile <= 60 ? `${zile}z` : 'La zi';
              }
              return (
                <>
                  <div style={s.rowDiv} />
                  <div style={s.row}>
                    <div>
                      <span style={s.rowLabel}>🔧 Lichid frână</span>
                      {u?.data
                        ? <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#475569' }}>
                            {formateazaData(u.data)} · interval {specificatii.intervalLichidFrana} luni
                          </p>
                        : <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#334155' }}>Neînregistrat</p>
                      }
                    </div>
                    <div style={s.rowRight}>
                      {lichidText && <span style={{ ...s.pill, backgroundColor: `${lichidColor}22`, color: lichidColor }}>{lichidText}</span>}
                      <button onClick={() => { setFormLichidFrana({ data: toDateInput(u?.data), cost: '' }); setShowLichidFranaModal(true); }} style={s.editBtn}>
                        {u?.data ? '✎' : 'ADAUGĂ'}
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}

            {/* Separator + titlu istoric */}
            <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.05)', margin: '0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px' }}>
              <span style={{ fontSize: '10px', fontWeight: '700', color: '#334155', letterSpacing: '1.5px' }}>INTERVENȚII</span>
              <button onClick={() => { setFormIstoric(FORM_ISTORIC_GOL); setEditIstoricId(null); setShowIstoricModal(true); }} style={s.editBtn}>+ ADAUGĂ</button>
            </div>

            {/* Lista intervenții */}
            {istoric.length === 0 ? (
              <div style={{ ...s.emptyRow, paddingTop: '8px' }}>
                <span style={s.emptyText}>Nicio intervenție înregistrată.</span>
              </div>
            ) : (
              istoric.map((intr, i) => (
                <div key={intr._id}>
                  <div style={s.rowDiv} />
                  <div style={{ ...s.row, alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', fontWeight: '800', padding: '2px 8px', borderRadius: '20px', backgroundColor: 'rgba(0,229,255,0.1)', color: '#00e5ff' }}>{intr.tip}</span>
                        <span style={{ fontSize: '11px', color: '#475569' }}>
                          {new Date(intr.data).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        {intr.cost != null && <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '700' }}>{intr.cost.toLocaleString('ro-RO')} lei</span>}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>{intr.kilometraj?.toLocaleString('ro-RO')} km</span>
                        {intr.service && <span style={{ fontSize: '11px', color: '#64748b' }}>📍 {intr.service}</span>}
                      </div>
                      {intr.descriere && <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#94a3b8', lineHeight: '1.4' }}>{intr.descriere}</p>}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <button onClick={() => { setFormIstoric({ tip: intr.tip, data: intr.data?.split('T')[0], kilometraj: intr.kilometraj, descriere: intr.descriere || '', cost: intr.cost ?? '', service: intr.service || '' }); setEditIstoricId(intr._id); setShowIstoricModal(true); }} style={s.editRowBtn}>✎</button>
                      <button onClick={() => handleStergeIstoric(intr._id)} style={s.delBtn}>✕</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* SPECIFICATII TEHNICE */}
        {specificatii && (
          <section style={s.sectiune}>
            <div style={s.sectLabel}>SPECIFICAȚII TEHNICE</div>
            <div style={s.card}>
              {[
                specificatii.ulei?.tip && { label: 'Ulei recomandat', val: `${specificatii.ulei.tip} · ${specificatii.ulei.cantitate}L`, cyan: true },
                specificatii.ulei?.intervalKm && { label: 'Interval ulei', val: `${specificatii.ulei.intervalKm.toLocaleString()} km / ${specificatii.ulei.intervalLuni} luni` },
                specificatii.anvelope?.fata && { label: 'Anvelope față', val: specificatii.anvelope.fata },
                specificatii.anvelope?.spate && { label: 'Anvelope spate', val: specificatii.anvelope.spate },
                specificatii.intervalDistributie > 0 && {
                  label: 'Distribuție',
                  val: specificatii.intervalDistributieLuni > 0
                    ? `${specificatii.intervalDistributie.toLocaleString()} km sau ${specificatii.intervalDistributieLuni} luni`
                    : `${specificatii.intervalDistributie.toLocaleString()} km`
                },
                specificatii.intervalLichidFrana && { label: 'Lichid frână', val: `La ${specificatii.intervalLichidFrana} luni` },
                specificatii.filtreSchimb?.filtruUlei && { label: 'Filtru ulei', val: specificatii.filtreSchimb.filtruUlei, code: true },
                specificatii.filtreSchimb?.filtruAer && { label: 'Filtru aer', val: specificatii.filtreSchimb.filtruAer, code: true },
                specificatii.filtreSchimb?.filtryCombustibil && { label: 'Filtru combustibil', val: specificatii.filtreSchimb.filtryCombustibil, code: true },
              ].filter(Boolean).map((item, i, arr) => (
                <div key={item.label}>
                  {i > 0 && <div style={s.rowDiv} />}
                  <div style={s.row}>
                    <span style={s.rowLabel}>{item.label}</span>
                    {item.code
                      ? <span style={s.filtruCode}>{item.val}</span>
                      : <span style={{ ...s.rowVal, ...(item.cyan ? { color: '#00e5ff' } : {}) }}>{item.val}</span>
                    }
                  </div>
                </div>
              ))}
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
              <label style={s.mLabel}>Data schimbului *</label>
              <input type="date" style={{ ...s.mInput, colorScheme: 'dark' }} value={formUlei.data} onChange={e => setFormUlei({ ...formUlei, data: e.target.value })} required />
              <label style={s.mLabel}>Kilometraj la schimb *</label>
              <input type="number" style={s.mInput} value={formUlei.kilometraj} onChange={e => setFormUlei({ ...formUlei, kilometraj: e.target.value })} placeholder="ex: 85000" required />
              <label style={s.mLabel}>Cost (lei, opțional)</label>
              <input type="number" style={s.mInput} value={formUlei.cost} onChange={e => setFormUlei({ ...formUlei, cost: e.target.value })} placeholder="ex: 280" />
              {specificatii?.ulei && (
                <div style={s.infoBox}>
                  <p style={s.infoText}>Tip ulei: <strong>{specificatii.ulei.tip}</strong> · Cantitate: <strong>{specificatii.ulei.cantitate} L</strong> · Interval: <strong>{specificatii.ulei.intervalKm?.toLocaleString()} km</strong></p>
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
              {[
                { key: 'ITP', labelObt: 'Data ITP', labelExp: 'Expiră', obtKey: 'obtinereITP', expKey: 'dataITP', costKey: 'costITP' },
                { key: 'RCA', labelObt: 'Data RCA', labelExp: 'Expiră', obtKey: 'obtinereRCA', expKey: 'dataRCA', costKey: 'costRCA' },
                { key: 'ROVINIETĂ', labelObt: 'Data Rovinietă', labelExp: 'Expiră', obtKey: 'obtinereRovinieta', expKey: 'dataRovinieta', costKey: 'costRovinieta' },
              ].map(doc => (
                <div key={doc.key} style={s.docGrup}>
                  <p style={s.docGrupLabel}>{doc.key}</p>
                  <div style={s.docGrupRow}>
                    <div style={{ flex: 1 }}>
                      <label style={s.mLabel}>{doc.labelObt}</label>
                      <input type="date" style={{ ...s.mInput, colorScheme: 'dark' }}
                        value={formDoc[doc.obtKey]}
                        onChange={e => {
                          const val = e.target.value;
                          setFormDoc(f => {
                            const upd = { ...f, [doc.obtKey]: val };
                            if (val) {
                              const exp = new Date(val);
                              exp.setFullYear(exp.getFullYear() + 1);
                              upd[doc.expKey] = exp.toISOString().split('T')[0];
                            }
                            return upd;
                          });
                        }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={s.mLabel}>{doc.labelExp}</label>
                      <input type="date" style={{ ...s.mInput, colorScheme: 'dark' }}
                        value={formDoc[doc.expKey]}
                        onChange={e => setFormDoc(f => ({ ...f, [doc.expKey]: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={s.mLabel}>Cost (lei)</label>
                    <input type="number" style={s.mInput}
                      value={formDoc[doc.costKey]}
                      onChange={e => setFormDoc(f => ({ ...f, [doc.costKey]: e.target.value }))}
                      placeholder="0" />
                  </div>
                </div>
              ))}
              <button type="submit" style={s.saveBtn}>SALVEAZĂ</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DOCUMENT CUSTOM */}
      {showDocCustomModal && (
        <div style={s.overlay} onClick={() => { setShowDocCustomModal(false); setEditDocCustomId(null); setFormDocCustom({ nume: '', dataExpirare: '', cost: '' }); }}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h3 style={s.modalTitlu}>{editDocCustomId ? 'EDITEAZĂ DOCUMENT' : 'DOCUMENT NOU'}</h3>
              <button onClick={() => { setShowDocCustomModal(false); setEditDocCustomId(null); setFormDocCustom({ nume: '', dataExpirare: '', cost: '' }); }} style={s.closeBtn}>✕</button>
            </div>
            <form onSubmit={handleAdaugaDocCustom} style={s.modalForm}>
              <label style={s.mLabel}>Nume document</label>
              <input style={s.mInput} value={formDocCustom.nume} onChange={e => setFormDocCustom(f => ({ ...f, nume: e.target.value }))}
                placeholder="ex: CASCO, Garanție, Card service" required autoFocus />
              <label style={s.mLabel}>Data expirare (opțional)</label>
              <input type="date" style={{ ...s.mInput, colorScheme: 'dark' }} value={formDocCustom.dataExpirare}
                onChange={e => setFormDocCustom(f => ({ ...f, dataExpirare: e.target.value }))} />
              {!editDocCustomId && (
                <>
                  <label style={s.mLabel}>Cost (lei, opțional)</label>
                  <input type="number" style={s.mInput} value={formDocCustom.cost}
                    onChange={e => setFormDocCustom(f => ({ ...f, cost: e.target.value }))} placeholder="ex: 500" />
                </>
              )}
              <button type="submit" style={s.saveBtn}>SALVEAZĂ</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ISTORIC MENTENANȚĂ */}
      {showIstoricModal && (
        <div style={s.overlay} onClick={() => { setShowIstoricModal(false); setEditIstoricId(null); setFormIstoric(FORM_ISTORIC_GOL); }}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h3 style={s.modalTitlu}>{editIstoricId ? 'EDITEAZĂ INTERVENȚIE' : 'INTERVENȚIE NOUĂ'}</h3>
              <button onClick={() => { setShowIstoricModal(false); setEditIstoricId(null); setFormIstoric(FORM_ISTORIC_GOL); }} style={s.closeBtn}>✕</button>
            </div>
            <form onSubmit={handleSalveazaIstoric} style={s.modalForm}>
              <label style={s.mLabel}>Tip intervenție *</label>
              <input
                style={s.mInput} list="sugestii-tip" value={formIstoric.tip}
                onChange={e => setFormIstoric(f => ({ ...f, tip: e.target.value }))}
                placeholder="ex: Schimb ulei, Revizie..." required autoFocus
              />
              <datalist id="sugestii-tip">
                {SUGESTII_TIP.map(t => <option key={t} value={t} />)}
              </datalist>
              <label style={s.mLabel}>Data *</label>
              <input type="date" style={{ ...s.mInput, colorScheme: 'dark' }} value={formIstoric.data} onChange={e => setFormIstoric(f => ({ ...f, data: e.target.value }))} required />
              <label style={s.mLabel}>Kilometraj *</label>
              <input type="number" style={s.mInput} value={formIstoric.kilometraj} onChange={e => setFormIstoric(f => ({ ...f, kilometraj: e.target.value }))} placeholder="ex: 85000" required />
              <label style={s.mLabel}>Service / Atelier (opțional)</label>
              <input style={s.mInput} value={formIstoric.service} onChange={e => setFormIstoric(f => ({ ...f, service: e.target.value }))} placeholder="ex: AutoService Cluj" />
              <label style={s.mLabel}>Cost (lei, opțional)</label>
              <input type="number" style={s.mInput} value={formIstoric.cost} onChange={e => setFormIstoric(f => ({ ...f, cost: e.target.value }))} placeholder="ex: 350" />
              <label style={s.mLabel}>Descriere (opțional)</label>
              <textarea style={{ ...s.mInput, resize: 'vertical', minHeight: '72px' }} value={formIstoric.descriere} onChange={e => setFormIstoric(f => ({ ...f, descriere: e.target.value }))} placeholder="Detalii despre intervenție..." />
              <button type="submit" style={s.saveBtn}>SALVEAZĂ</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DISTRIBUȚIE */}
      {showDistributieModal && (
        <div style={s.overlay} onClick={() => setShowDistributieModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h3 style={s.modalTitlu}>DISTRIBUȚIE</h3>
              <button onClick={() => setShowDistributieModal(false)} style={s.closeBtn}>✕</button>
            </div>
            <form onSubmit={handleSalveazaDistributie} style={s.modalForm}>
              <label style={s.mLabel}>Data schimbului *</label>
              <input type="date" style={{ ...s.mInput, colorScheme: 'dark' }} value={formDistributie.data} onChange={e => setFormDistributie(f => ({ ...f, data: e.target.value }))} required />
              <label style={s.mLabel}>Kilometraj la schimb *</label>
              <input type="number" style={s.mInput} value={formDistributie.kilometraj} onChange={e => setFormDistributie(f => ({ ...f, kilometraj: e.target.value }))} placeholder="ex: 100000" required />
              <label style={s.mLabel}>Cost (lei, opțional)</label>
              <input type="number" style={s.mInput} value={formDistributie.cost} onChange={e => setFormDistributie(f => ({ ...f, cost: e.target.value }))} placeholder="ex: 1200" />
              {specificatii?.intervalDistributie > 0 && (
                <div style={s.infoBox}>
                  <p style={s.infoText}>
                    Interval recomandat: <strong>{specificatii.intervalDistributie.toLocaleString()} km</strong>
                    {specificatii.intervalDistributieLuni > 0 && <> sau <strong>{specificatii.intervalDistributieLuni} luni</strong></>}
                  </p>
                </div>
              )}
              <button type="submit" style={s.saveBtn}>SALVEAZĂ</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL LICHID FRÂNĂ */}
      {showLichidFranaModal && (
        <div style={s.overlay} onClick={() => setShowLichidFranaModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h3 style={s.modalTitlu}>LICHID FRÂNĂ</h3>
              <button onClick={() => setShowLichidFranaModal(false)} style={s.closeBtn}>✕</button>
            </div>
            <form onSubmit={handleSalveazaLichidFrana} style={s.modalForm}>
              <label style={s.mLabel}>Data schimbului *</label>
              <input type="date" style={{ ...s.mInput, colorScheme: 'dark' }} value={formLichidFrana.data} onChange={e => setFormLichidFrana(f => ({ ...f, data: e.target.value }))} required />
              <label style={s.mLabel}>Cost (lei, opțional)</label>
              <input type="number" style={s.mInput} value={formLichidFrana.cost} onChange={e => setFormLichidFrana(f => ({ ...f, cost: e.target.value }))} placeholder="ex: 80" />
              {specificatii?.intervalLichidFrana > 0 && (
                <div style={s.infoBox}>
                  <p style={s.infoText}>Interval recomandat: <strong>la {specificatii.intervalLichidFrana} luni</strong></p>
                </div>
              )}
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

  // Doc grup (în modal documente fixe)
  docGrup: { display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  docGrupLabel: { margin: 0, fontSize: '0.6rem', fontWeight: '800', color: '#00e5ff', letterSpacing: '1.5px' },
  docGrupRow: { display: 'flex', gap: '10px', alignItems: 'flex-end' },
};

export default DetaliiVehicul;
