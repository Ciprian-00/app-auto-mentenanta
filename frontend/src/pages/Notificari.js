import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';

const TABS = [
  { key: 'toate', label: 'TOATE' },
  { key: 'expirate', label: 'EXPIRATE' },
  { key: 'atentie', label: 'ATENȚIE' },
  { key: 'valabile', label: 'VALABILE' },
];

const TIP_TO_FIELD = {
  ITP: 'dataITP',
  RCA: 'dataRCA',
  Rovinieta: 'dataRovinieta',
};

const PRIORITATE = { expirat: 0, urgent: 1, ok: 2 };

const sorteazaDupaPrioritate = (lista) =>
  [...lista].sort((a, b) => PRIORITATE[a.status] - PRIORITATE[b.status]);

const Notificari = ({ onRemindereUpdate }) => {
  const navigate = useNavigate();
  const [remindere, setRemindere] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabActiv, setTabActiv] = useState('toate');

  const [editModal, setEditModal] = useState(null);
  const [dataNoua, setDataNoua] = useState('');
  const [salvare, setSalvare] = useState(false);

  const fetchRemindere = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/reminders');
      setRemindere(sorteazaDupaPrioritate(res.data));
      const urgente = res.data.filter(r => r.status === 'expirat' || r.status === 'urgent').length;
      onRemindereUpdate?.(urgente);
    } catch {
      toast.error('Eroare la încărcarea notificărilor');
    } finally {
      setLoading(false);
    }
  }, [onRemindereUpdate]);

  useEffect(() => {
    fetchRemindere();
  }, [fetchRemindere]);

  const deschideEditModal = (r) => {
    const dataActuala = r.dataExpirare
      ? new Date(r.dataExpirare).toISOString().split('T')[0]
      : '';
    setDataNoua(dataActuala);
    setEditModal(r);
  };

  const handleSalveazaData = async () => {
    if (!dataNoua) { toast.error('Selectează o dată validă'); return; }
    if (!editModal?.vehicul?._id) { toast.error('Vehiculul nu a fost găsit'); return; }

    setSalvare(true);
    try {
      const vehiculId = editModal.vehicul._id;
      const campVehicul = TIP_TO_FIELD[editModal.tip];

      if (campVehicul) {
        // Document fix (ITP / RCA / Rovinieta)
        await api.put(`/vehicles/${vehiculId}`, { [campVehicul]: dataNoua });
      } else {
        // Document custom — actualizează în array-ul documenteCustom
        const { data: vehicul } = await api.get(`/vehicles/${vehiculId}`);
        const docsActualizate = (vehicul.documenteCustom || []).map(d =>
          d.nume === editModal.tip ? { ...d, dataExpirare: dataNoua } : d
        );
        await api.put(`/vehicles/${vehiculId}`, { ...vehicul, documenteCustom: docsActualizate });
      }

      await api.post(`/reminders/genereaza/${vehiculId}`);
      toast.success('Data actualizată!');
      setEditModal(null);
      await fetchRemindere();
    } catch {
      toast.error('Eroare la actualizarea datei');
    } finally {
      setSalvare(false);
    }
  };

  const getColors = (status) => {
    if (status === 'expirat') return { border: '#ff4d4d', tagBg: 'rgba(255,77,77,0.12)', tagText: '#ff4d4d', dot: '#ff4d4d', glow: true };
    if (status === 'urgent') return { border: '#f59e0b', tagBg: 'rgba(245,158,11,0.12)', tagText: '#f59e0b', dot: '#f59e0b', glow: false };
    return { border: '#10b981', tagBg: 'rgba(16,185,129,0.12)', tagText: '#10b981', dot: '#10b981', glow: false };
  };

  const getStatusText = (r) => r.status === 'expirat' ? 'EXPIRAT' : `${r.zileRamase} ZILE`;

  const expirate = remindere.filter(r => r.status === 'expirat');
  const atentie = remindere.filter(r => r.status === 'urgent');
  const valabile = remindere.filter(r => r.status === 'ok');

  const getListaActiva = () => {
    if (tabActiv === 'expirate') return expirate;
    if (tabActiv === 'atentie') return atentie;
    if (tabActiv === 'valabile') return valabile;
    return remindere;
  };

  const getTabCount = (key) => {
    if (key === 'toate') return remindere.length;
    if (key === 'expirate') return expirate.length;
    if (key === 'atentie') return atentie.length;
    if (key === 'valabile') return valabile.length;
    return 0;
  };

  const renderCard = (r) => {
    const c = getColors(r.status);
    const areEditare = true;
    return (
      <div key={r._id} style={{ ...s.card, borderLeft: `3px solid ${c.border}` }}>
        <div style={s.cardTop}>
          <div style={s.cardLeft}>
            <span style={{ ...s.dot, backgroundColor: c.dot, boxShadow: c.glow ? `0 0 7px ${c.dot}` : 'none' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={s.cardTipRow}>
                <p style={s.cardTip}>{r.tip}</p>
                <span style={s.cardTipBadge}>{r.tip}</span>
              </div>
              {r.vehicul && (
                <p style={s.cardVehicul}>
                  {r.vehicul.marca} {r.vehicul.model}
                  {r.vehicul.numarInmatriculare ? ` · ${r.vehicul.numarInmatriculare}` : ''}
                </p>
              )}
            </div>
          </div>
          <span style={{ ...s.tag, background: c.tagBg, color: c.tagText }}>{getStatusText(r)}</span>
        </div>
        {r.mesaj && <p style={s.cardMesaj}>{r.mesaj}</p>}
        <p style={s.cardData}>
          Data: {new Date(r.dataExpirare).toLocaleDateString('ro-RO', { day: '2-digit', month: 'long', year: 'numeric' })}
        </p>
        <div style={s.cardActiuni}>
          {r.vehicul && (
            <button onClick={() => navigate(`/vehicule/${r.vehicul._id}`)} style={s.btnVezi}>VEZI MAȘINA</button>
          )}
          {areEditare && (
            <button onClick={() => deschideEditModal(r)} style={s.btnEdit}>✏ EDITEAZĂ</button>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={s.loadingWrap}>
        <div style={s.spinner} />
        <p style={s.loadingText}>SE ÎNCARCĂ NOTIFICĂRILE...</p>
      </div>
    );
  }

  const listaActiva = getListaActiva();

  return (
    <div style={s.pagina}>
      <div style={s.header}>
        <div>
          <p style={s.headerSub}>SISTEM MONITORIZARE</p>
          <h2 style={s.headerTitlu}>Notificări</h2>
        </div>
        <div style={s.headerStats}>
          {expirate.length > 0 && (
            <span style={{ ...s.headerBadge, background: 'rgba(255,77,77,0.15)', color: '#ff4d4d' }}>
              {expirate.length} expirate
            </span>
          )}
          {atentie.length > 0 && (
            <span style={{ ...s.headerBadge, background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
              {atentie.length} atenție
            </span>
          )}
        </div>
      </div>

      <div style={s.tabsWrap}>
        {TABS.map(tab => {
          const activ = tabActiv === tab.key;
          const count = getTabCount(tab.key);
          return (
            <button key={tab.key} onClick={() => setTabActiv(tab.key)}
              style={{ ...s.tab, ...(activ ? s.tabActiv : {}) }}>
              {tab.label}
              <span style={{ ...s.tabCount, background: activ ? 'rgba(0,229,255,0.15)' : 'rgba(255,255,255,0.05)', color: activ ? '#00e5ff' : '#475569' }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <main style={s.main}>
        {listaActiva.length === 0 ? (
          <div style={s.golCard}>
            <span style={{ fontSize: '2.5rem' }}>{tabActiv === 'valabile' ? '✅' : '🔔'}</span>
            <p style={s.golTitlu}>{tabActiv === 'valabile' ? 'Niciun document valabil' : 'Nicio notificare în această categorie'}</p>
            <p style={s.golText}>{tabActiv === 'valabile' ? 'Adaugă date pentru documentele mașinilor tale.' : 'Totul este în regulă pentru categoria selectată.'}</p>
          </div>
        ) : (
          listaActiva.map(r => renderCard(r))
        )}
      </main>

      {editModal && (
        <div style={s.overlay} onClick={() => setEditModal(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <div>
                <p style={s.modalSub}>ACTUALIZEAZĂ DOCUMENT</p>
                <h3 style={s.modalTitlu}>{editModal.tip} · {editModal.vehicul?.marca} {editModal.vehicul?.model}</h3>
              </div>
              <button onClick={() => setEditModal(null)} style={s.closeBtn}>✕</button>
            </div>
            <p style={s.modalDesc}>Introdu noua dată de expirare. Notificarea se va recalcula automat.</p>
            <div style={s.fieldWrap}>
              <label style={s.fieldLabel}>NOUĂ DATĂ EXPIRARE</label>
              <input type="date" value={dataNoua} onChange={e => setDataNoua(e.target.value)} style={s.dateInput} min={new Date().toISOString().split('T')[0]} />
            </div>
            <div style={s.modalActiuni}>
              <button onClick={() => setEditModal(null)} style={s.btnAnuleaza}>ANULEAZĂ</button>
              <button onClick={handleSalveazaData} style={s.btnSalveaza} disabled={salvare}>
                {salvare ? 'SE SALVEAZĂ...' : 'SALVEAZĂ DATA'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const s = {
  pagina: { backgroundColor: '#0b0e14', color: '#fff', minHeight: '100vh', fontFamily: '"Inter", sans-serif', paddingBottom: 'calc(90px + env(safe-area-inset-bottom))' },
  loadingWrap: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0b0e14', gap: '14px' },
  spinner: { width: '36px', height: '36px', border: '3px solid rgba(0,229,255,0.15)', borderTop: '3px solid #00e5ff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  loadingText: { color: '#00e5ff', fontSize: '11px', letterSpacing: '2px', fontWeight: '700', margin: 0 },
  header: { padding: '20px 18px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'rgba(11,14,20,0.97)', position: 'sticky', top: 0, zIndex: 40, backdropFilter: 'blur(16px)' },
  headerSub: { margin: '0 0 2px 0', color: '#64748b', fontSize: '9px', letterSpacing: '2px', fontWeight: '700' },
  headerTitlu: { margin: 0, color: '#fff', fontSize: '20px', fontWeight: '800', letterSpacing: '-0.3px' },
  headerStats: { display: 'flex', gap: '6px' },
  headerBadge: { fontSize: '10px', fontWeight: '700', padding: '5px 10px', borderRadius: '20px', letterSpacing: '0.3px' },
  tabsWrap: { display: 'flex', gap: '6px', padding: '12px 16px', overflowX: 'auto', borderBottom: '1px solid rgba(255,255,255,0.05)', scrollbarWidth: 'none' },
  tab: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#64748b', borderRadius: '20px', padding: '7px 12px', fontSize: '10px', fontWeight: '800', letterSpacing: '0.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', fontFamily: '"Inter", sans-serif', flexShrink: 0 },
  tabActiv: { background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.25)', color: '#00e5ff' },
  tabCount: { fontSize: '9px', fontWeight: '800', padding: '2px 6px', borderRadius: '10px', minWidth: '18px', textAlign: 'center' },
  main: { padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' },
  golCard: { backgroundColor: '#12151e', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', textAlign: 'center', marginTop: '20px' },
  golTitlu: { margin: 0, fontSize: '16px', fontWeight: '800', color: '#f1f5f9' },
  golText: { margin: 0, fontSize: '13px', color: '#475569', lineHeight: '1.5' },
  card: { backgroundColor: '#12151e', borderRadius: '12px', padding: '14px', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', gap: '8px' },
  cardTop: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' },
  cardLeft: { display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1, minWidth: 0 },
  dot: { width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, marginTop: '4px' },
  cardTipRow: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' },
  cardTip: { margin: 0, fontWeight: '700', fontSize: '14px', color: '#f1f5f9' },
  cardTipBadge: { fontSize: '8px', fontWeight: '800', color: '#475569', backgroundColor: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '6px', letterSpacing: '0.5px' },
  cardVehicul: { margin: 0, fontSize: '11px', color: '#64748b', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  tag: { fontSize: '9px', fontWeight: '800', padding: '4px 9px', borderRadius: '20px', letterSpacing: '0.5px', flexShrink: 0, whiteSpace: 'nowrap' },
  cardMesaj: { margin: 0, fontSize: '12px', color: '#94a3b8', lineHeight: '1.5' },
  cardData: { margin: 0, fontSize: '11px', color: '#475569', fontWeight: '600' },
  cardActiuni: { display: 'flex', gap: '8px', marginTop: '2px' },
  btnVezi: { flex: 1, backgroundColor: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.18)', color: '#00e5ff', borderRadius: '8px', padding: '9px', fontSize: '10px', fontWeight: '800', letterSpacing: '0.5px', cursor: 'pointer', fontFamily: '"Inter", sans-serif' },
  btnEdit: { backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b', borderRadius: '8px', padding: '9px 14px', fontSize: '10px', fontWeight: '800', letterSpacing: '0.5px', cursor: 'pointer', fontFamily: '"Inter", sans-serif', whiteSpace: 'nowrap' },
  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' },
  modal: { background: 'linear-gradient(180deg, #13161f 0%, #0b0e14 100%)', width: '100%', maxWidth: '500px', padding: '24px 20px', borderRadius: '20px 20px 0 0', border: '1px solid rgba(0,229,255,0.15)', borderBottom: 'none' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' },
  modalSub: { margin: '0 0 4px 0', fontSize: '9px', color: '#00e5ff', fontWeight: '800', letterSpacing: '2px' },
  modalTitlu: { margin: 0, fontSize: '16px', fontWeight: '800', color: '#f1f5f9' },
  closeBtn: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: '"Inter", sans-serif' },
  modalDesc: { margin: '0 0 16px 0', fontSize: '13px', color: '#64748b', lineHeight: '1.5' },
  fieldWrap: { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' },
  fieldLabel: { fontSize: '9px', color: '#00e5ff', fontWeight: '800', letterSpacing: '1.5px' },
  dateInput: { backgroundColor: '#0b0e14', border: '1px solid rgba(0,229,255,0.2)', padding: '13px 14px', borderRadius: '10px', color: '#fff', fontSize: '15px', fontWeight: '600', fontFamily: '"Inter", sans-serif', colorScheme: 'dark', width: '100%', boxSizing: 'border-box' },
  modalActiuni: { display: 'flex', gap: '10px' },
  btnAnuleaza: { flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b', borderRadius: '10px', padding: '13px', fontSize: '11px', fontWeight: '800', letterSpacing: '0.5px', cursor: 'pointer', fontFamily: '"Inter", sans-serif' },
  btnSalveaza: { flex: 2, backgroundColor: '#00e5ff', border: 'none', color: '#001f24', borderRadius: '10px', padding: '13px', fontSize: '11px', fontWeight: '800', letterSpacing: '0.5px', cursor: 'pointer', fontFamily: '"Inter", sans-serif' },
};

export default Notificari;