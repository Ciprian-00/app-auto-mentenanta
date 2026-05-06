import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';

const Alerte = ({ onRemindereUpdate }) => {
  const navigate = useNavigate();
  const [remindere, setRemindere] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stergere, setStergere] = useState(null);

  const fetchRemindere = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/reminders');
      const remindereActive = res.data.filter(r => r.dismissed !== true);
      setRemindere(remindereActive);
      const urgente = remindereActive.filter(r => r.status !== 'ok').length;
      onRemindereUpdate?.(urgente);
    } catch {
      toast.error('Eroare la încărcarea alertelor');
    } finally {
      setLoading(false);
    }
  }, [onRemindereUpdate]);

  useEffect(() => {
    fetchRemindere();
  }, [fetchRemindere]);

  const handleDezactiveaza = async (id) => {
    setStergere(id);
    try {
      await api.put(`/reminders/${id}/dismiss`);
      const updatedRemindere = remindere.filter(r => r._id !== id);
      setRemindere(updatedRemindere);
      const urgente = updatedRemindere.filter(r => r.status !== 'ok').length;
      onRemindereUpdate?.(urgente);
      toast.success('Notificare ascunsa');
    } catch {
      toast.error('Eroare la ascunderea notificarii');
    } finally {
      setStergere(null);
    }
  };

  const getColors = (status) => {
    if (status === 'expirat') return { border: '#ff4d4d', tagBg: 'rgba(255,77,77,0.12)', tagText: '#ff4d4d', dot: '#ff4d4d' };
    if (status === 'urgent') return { border: '#f59e0b', tagBg: 'rgba(245,158,11,0.12)', tagText: '#f59e0b', dot: '#f59e0b' };
    return { border: '#10b981', tagBg: 'rgba(16,185,129,0.12)', tagText: '#10b981', dot: '#10b981' };
  };

  const getStatusText = (r) => {
    if (r.status === 'expirat') return 'EXPIRAT';
    if (r.status === 'urgent') return `${r.zileRamase} ZILE`;
    return `${r.zileRamase} ZILE`;
  };

  const expirate = remindere.filter(r => r.status === 'expirat');
  const urgente = remindere.filter(r => r.status === 'urgent');
  const ok = remindere.filter(r => r.status === 'ok');

  if (loading) {
    return (
      <div style={s.loadingWrap}>
        <div style={s.spinner} />
        <p style={s.loadingText}>SE ÎNCARCĂ ALERTELE...</p>
      </div>
    );
  }

  return (
    <div style={s.pagina}>
      <div style={s.header}>
        <div>
          <p style={s.headerSub}>SISTEM MONITORIZARE</p>
          <h2 style={s.headerTitlu}>Alerte</h2>
        </div>
        <div style={s.headerStats}>
          <span style={{ ...s.headerBadge, background: expirate.length > 0 ? 'rgba(255,77,77,0.15)' : 'rgba(255,255,255,0.05)', color: expirate.length > 0 ? '#ff4d4d' : '#64748b' }}>
            {expirate.length} expirate
          </span>
          <span style={{ ...s.headerBadge, background: urgente.length > 0 ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.05)', color: urgente.length > 0 ? '#f59e0b' : '#64748b' }}>
            {urgente.length} urgente
          </span>
        </div>
      </div>

      <main style={s.main}>

        {remindere.length === 0 && (
          <div style={s.golCard}>
            <span style={{ fontSize: '2.5rem' }}>✅</span>
            <p style={s.golTitlu}>Totul este în regulă</p>
            <p style={s.golText}>Nu ai alerte active. Toate documentele sunt la zi.</p>
          </div>
        )}

        {expirate.length > 0 && (
          <section style={s.sectiune}>
            <p style={s.sectiuneTitlu}>EXPIRATE</p>
            {expirate.map(r => {
              const c = getColors(r.status);
              return (
                <div key={r._id} style={{ ...s.card, borderLeft: `3px solid ${c.border}` }}>
                  <div style={s.cardTop}>
                    <div style={s.cardLeft}>
                      <span style={{ ...s.dot, backgroundColor: c.dot, boxShadow: `0 0 6px ${c.dot}` }} />
                      <div>
                        <p style={s.cardTip}>{r.tip}</p>
                        {r.vehicul && (
                          <p style={s.cardVehicul}>
                            {r.vehicul.marca} {r.vehicul.model}
                            {r.vehicul.numarInmatriculare ? ` · ${r.vehicul.numarInmatriculare}` : ''}
                          </p>
                        )}
                      </div>
                    </div>
                    <div style={s.cardRight}>
                      <span style={{ ...s.tag, background: c.tagBg, color: c.tagText }}>
                        {getStatusText(r)}
                      </span>
                    </div>
                  </div>
                  {r.mesaj && <p style={s.cardMesaj}>{r.mesaj}</p>}
                  <div style={s.cardActiuni}>
                    {r.vehicul && (
                      <button
                        onClick={() => navigate(`/vehicule/${r.vehicul._id}`)}
                        style={s.btnVezi}
                      >
                        VEZI MAȘINA
                      </button>
                    )}
                    <button
                      onClick={() => handleDezactiveaza(r._id)}
                      style={s.btnSterge}
                      disabled={stergere === r._id}
                    >
                      {stergere === r._id ? '...' : 'ȘTERGE'}
                    </button>
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {urgente.length > 0 && (
          <section style={s.sectiune}>
            <p style={s.sectiuneTitlu}>URGENTE</p>
            {urgente.map(r => {
              const c = getColors(r.status);
              return (
                <div key={r._id} style={{ ...s.card, borderLeft: `3px solid ${c.border}` }}>
                  <div style={s.cardTop}>
                    <div style={s.cardLeft}>
                      <span style={{ ...s.dot, backgroundColor: c.dot }} />
                      <div>
                        <p style={s.cardTip}>{r.tip}</p>
                        {r.vehicul && (
                          <p style={s.cardVehicul}>
                            {r.vehicul.marca} {r.vehicul.model}
                            {r.vehicul.numarInmatriculare ? ` · ${r.vehicul.numarInmatriculare}` : ''}
                          </p>
                        )}
                      </div>
                    </div>
                    <div style={s.cardRight}>
                      <span style={{ ...s.tag, background: c.tagBg, color: c.tagText }}>
                        {getStatusText(r)}
                      </span>
                    </div>
                  </div>
                  {r.mesaj && <p style={s.cardMesaj}>{r.mesaj}</p>}
                  <div style={s.cardActiuni}>
                    {r.vehicul && (
                      <button
                        onClick={() => navigate(`/vehicule/${r.vehicul._id}`)}
                        style={s.btnVezi}
                      >
                        VEZI MAȘINA
                      </button>
                    )}
                    <button
                      onClick={() => handleDezactiveaza(r._id)}
                      style={s.btnSterge}
                      disabled={stergere === r._id}
                    >
                      {stergere === r._id ? '...' : 'ȘTERGE'}
                    </button>
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {ok.length > 0 && (
          <section style={{ ...s.sectiune, marginBottom: '2rem' }}>
            <p style={s.sectiuneTitlu}>VALABILE</p>
            {ok.map(r => {
              const c = getColors(r.status);
              return (
                <div key={r._id} style={{ ...s.card, borderLeft: `3px solid ${c.border}` }}>
                  <div style={s.cardTop}>
                    <div style={s.cardLeft}>
                      <span style={{ ...s.dot, backgroundColor: c.dot }} />
                      <div>
                        <p style={s.cardTip}>{r.tip}</p>
                        {r.vehicul && (
                          <p style={s.cardVehicul}>
                            {r.vehicul.marca} {r.vehicul.model}
                            {r.vehicul.numarInmatriculare ? ` · ${r.vehicul.numarInmatriculare}` : ''}
                          </p>
                        )}
                      </div>
                    </div>
                    <div style={s.cardRight}>
                      <span style={{ ...s.tag, background: c.tagBg, color: c.tagText }}>
                        {getStatusText(r)}
                      </span>
                    </div>
                  </div>
                  {r.mesaj && <p style={s.cardMesaj}>{r.mesaj}</p>}
                  <div style={s.cardActiuni}>
                    {r.vehicul && (
                      <button
                        onClick={() => navigate(`/vehicule/${r.vehicul._id}`)}
                        style={s.btnVezi}
                      >
                        VEZI MAȘINA
                      </button>
                    )}
                    <button
                      onClick={() => handleDezactiveaza(r._id)}
                      style={s.btnSterge}
                      disabled={stergere === r._id}
                    >
                      {stergere === r._id ? '...' : 'ȘTERGE'}
                    </button>
                  </div>
                </div>
              );
            })}
          </section>
        )}

      </main>
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
    gap: '14px',
  },
  spinner: {
    width: '36px',
    height: '36px',
    border: '3px solid rgba(0,229,255,0.15)',
    borderTop: '3px solid #00e5ff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    color: '#00e5ff',
    fontSize: '11px',
    letterSpacing: '2px',
    fontWeight: '700',
    margin: 0,
  },
  header: {
    padding: '20px 18px 14px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(11,14,20,0.97)',
    position: 'sticky',
    top: 0,
    zIndex: 40,
    backdropFilter: 'blur(16px)',
  },
  headerSub: {
    margin: '0 0 2px 0',
    color: '#64748b',
    fontSize: '9px',
    letterSpacing: '2px',
    fontWeight: '700',
  },
  headerTitlu: {
    margin: 0,
    color: '#fff',
    fontSize: '20px',
    fontWeight: '800',
    letterSpacing: '-0.3px',
  },
  headerStats: {
    display: 'flex',
    gap: '6px',
  },
  headerBadge: {
    fontSize: '10px',
    fontWeight: '700',
    padding: '5px 10px',
    borderRadius: '20px',
    letterSpacing: '0.3px',
  },
  main: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  golCard: {
    backgroundColor: '#12151e',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '14px',
    padding: '40px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    textAlign: 'center',
    marginTop: '20px',
  },
  golTitlu: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '800',
    color: '#f1f5f9',
  },
  golText: {
    margin: 0,
    fontSize: '13px',
    color: '#475569',
    lineHeight: '1.5',
  },
  sectiune: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '8px',
  },
  sectiuneTitlu: {
    margin: '0 0 4px 0',
    fontSize: '9px',
    fontWeight: '800',
    color: '#475569',
    letterSpacing: '2px',
  },
  card: {
    backgroundColor: '#12151e',
    borderRadius: '10px',
    padding: '14px',
    border: '1px solid rgba(255,255,255,0.04)',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  cardTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
  },
  cardLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flex: 1,
    minWidth: 0,
  },
  cardRight: {
    flexShrink: 0,
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  cardTip: {
    margin: 0,
    fontWeight: '700',
    fontSize: '14px',
    color: '#f1f5f9',
  },
  cardVehicul: {
    margin: '2px 0 0',
    fontSize: '11px',
    color: '#64748b',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  tag: {
    fontSize: '9px',
    fontWeight: '800',
    padding: '4px 9px',
    borderRadius: '20px',
    letterSpacing: '0.5px',
  },
  cardMesaj: {
    margin: 0,
    fontSize: '12px',
    color: '#94a3b8',
    lineHeight: '1.5',
  },
  cardActiuni: {
    display: 'flex',
    gap: '8px',
  },
  btnVezi: {
    flex: 1,
    backgroundColor: 'rgba(0,229,255,0.08)',
    border: '1px solid rgba(0,229,255,0.2)',
    color: '#00e5ff',
    borderRadius: '7px',
    padding: '9px',
    fontSize: '10px',
    fontWeight: '800',
    letterSpacing: '0.5px',
    cursor: 'pointer',
    fontFamily: '"Inter", sans-serif',
  },
  btnSterge: {
    backgroundColor: 'rgba(255,77,77,0.08)',
    border: '1px solid rgba(255,77,77,0.2)',
    color: '#ff4d4d',
    borderRadius: '7px',
    padding: '9px 14px',
    fontSize: '10px',
    fontWeight: '800',
    letterSpacing: '0.5px',
    cursor: 'pointer',
    fontFamily: '"Inter", sans-serif',
  },
};

export default Alerte;