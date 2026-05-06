import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Dashboard = ({ refreshKey, onRemindereUpdate }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [vehicule, setVehicule] = useState([]);
  const [remindere, setRemindere] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDate = useCallback(async () => {
    try {
      setLoading(true);
      const [resVehicule, resRemindere] = await Promise.all([
        api.get('/vehicles'),
        api.get('/reminders')
      ]);

      setVehicule(resVehicule.data);
      setRemindere(resRemindere.data);

      // Numara urgent + expirat pentru badge BottomNav
      const urgente = resRemindere.data.filter(
        r => r.status === 'expirat' || r.status === 'urgent'
      ).length;
      onRemindereUpdate?.(urgente);
    } catch {
      toast.error('Eroare la încărcarea datelor');
    } finally {
      setLoading(false);
    }
  }, [onRemindereUpdate]);

  useEffect(() => {
    fetchDate();
  }, [fetchDate, refreshKey]);

  // Calcule corecte bazate pe statusul din backend
  const remindereExpirate = remindere.filter(r => r.status === 'expirat');
  const remindereProblema = remindere.filter(r => r.status === 'expirat' || r.status === 'urgent');
  const remindereOk = remindere.filter(r => r.status === 'ok');

  const getStatusDoc = (dataString) => {
    if (!dataString) return { culoare: '#334155', zile: null };
    const zile = Math.ceil((new Date(dataString) - new Date()) / (1000 * 60 * 60 * 24));
    if (zile < 0) return { culoare: '#ff4d4d', zile };
    if (zile <= 30) return { culoare: '#f59e0b', zile };
    return { culoare: '#10b981', zile };
  };

  const getReminderColors = (status) => {
    if (status === 'expirat') return { border: '#ff4d4d', tagBg: 'rgba(255,77,77,0.12)', tagText: '#ff4d4d' };
    if (status === 'urgent') return { border: '#f59e0b', tagBg: 'rgba(245,158,11,0.12)', tagText: '#f59e0b' };
    return { border: '#10b981', tagBg: 'rgba(16,185,129,0.12)', tagText: '#10b981' };
  };

  if (loading) {
    return (
      <div style={s.loadingWrap}>
        <div style={s.spinner} />
        <p style={s.loadingText}>SE INIȚIALIZEAZĂ...</p>
      </div>
    );
  }

  return (
    <div style={s.pagina}>

      {/* HEADER */}
      <div style={s.header}>
        <div>
          <p style={s.salut}>Bună ziua,</p>
          <h2 style={s.numeUser}>{user?.nume || 'Utilizator'}</h2>
        </div>
        <button onClick={logout} style={s.logoutBtn} title="Deconectare">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>

      <main style={s.main}>

        {/* STATS 2x2 */}
        <div style={s.statsGrid}>
          {[
            {
              label: 'MAȘINI',
              val: vehicule.length,
              culoare: '#00e5ff',
              iconPath: <><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></>
            },
            {
              label: 'ALERTE',
              val: remindereProblema.length,
              culoare: remindereProblema.length > 0 ? '#f59e0b' : '#10b981',
              iconPath: <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>
            },
            {
              label: 'EXPIRATE',
              val: remindereExpirate.length,
              culoare: remindereExpirate.length > 0 ? '#ff4d4d' : '#10b981',
              iconPath: <><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></>
            },
            {
              label: 'LA ZI',
              val: remindereOk.length,
              culoare: '#10b981',
              iconPath: <polyline points="20 6 9 17 4 12"/>
            },
          ].map((st, i) => (
            <div key={i} style={{ ...s.statCard, borderTop: `2px solid ${st.culoare}` }}>
              <div style={{ ...s.statIconWrap, background: `${st.culoare}18` }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={st.culoare} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {st.iconPath}
                </svg>
              </div>
              <span style={{ ...s.statVal, color: st.culoare }}>{st.val}</span>
              <span style={s.statLbl}>{st.label}</span>
            </div>
          ))}
        </div>

        {/* REMINDERE URGENTE */}
        {remindereProblema.length > 0 && (
          <section style={s.sectiune}>
            <div style={s.sectionHead}>
              <h3 style={s.sectionTitle}>NECESITĂ ATENȚIE</h3>
              <button onClick={() => navigate('/notificari')} style={s.veziToateBtn}>
                VEZI TOATE →
              </button>
            </div>
            <div style={s.lista}>
              {remindereProblema.slice(0, 5).map(r => {
                const c = getReminderColors(r.status);
                return (
                  <div key={r._id} style={{ ...s.reminderCard, borderLeft: `3px solid ${c.border}` }}>
                    <div style={s.reminderTop}>
                      <span style={{ ...s.dot, backgroundColor: c.border, boxShadow: `0 0 6px ${c.border}` }} />
                      <span style={s.reminderTip}>{r.tip}</span>
                      <span style={{ ...s.tag, background: c.tagBg, color: c.tagText }}>
                        {r.status === 'expirat' ? 'EXPIRAT' : `${r.zileRamase} ZILE`}
                      </span>
                    </div>
                    {r.mesaj && <p style={s.reminderMsg}>{r.mesaj}</p>}
                    {r.vehicul && (
                      <p style={s.reminderVehicul}>
                        {r.vehicul.marca} {r.vehicul.model}
                        {r.vehicul.numarInmatriculare ? ` · ${r.vehicul.numarInmatriculare}` : ''}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* MASINILE MELE */}
        <section style={s.sectiune}>
          <div style={s.sectionHead}>
            <h3 style={s.sectionTitle}>MAȘINILE MELE</h3>
            <button onClick={() => navigate('/vehicule')} style={s.veziToateBtn}>
              VEZI TOATE →
            </button>
          </div>

          {vehicule.length === 0 ? (
            <div style={s.golCard}>
              <img src="/icons/icon-192.png" alt="logo" style={{ width: '48px', height: '48px', borderRadius: '14px', opacity: 0.4 }} />
              <p style={s.golText}>Nu ai nicio mașină adăugată.</p>
            </div>
          ) : (
            <div style={s.lista}>
              {vehicule.slice(0, 3).map(v => {
                const stITP = getStatusDoc(v.dataITP);
                const stRCA = getStatusDoc(v.dataRCA);
                const stRov = getStatusDoc(v.dataRovinieta);
                const culoare = [stITP, stRCA, stRov].some(st => st.culoare === '#ff4d4d')
                  ? '#ff4d4d'
                  : [stITP, stRCA, stRov].some(st => st.culoare === '#f59e0b')
                    ? '#f59e0b'
                    : '#10b981';

                return (
                  <div key={v._id} style={s.vehiculCard} onClick={() => navigate(`/vehicule/${v._id}`)}>
                    <span style={{ ...s.dot, backgroundColor: culoare, boxShadow: `0 0 7px ${culoare}`, flexShrink: 0, width: '9px', height: '9px' }} />
                    <div style={s.vehiculInfo}>
                      <p style={s.vehiculNume}>{v.marca} {v.model}</p>
                      <p style={s.vehiculSub}>{v.an}{v.motor ? ` · ${v.motor}` : ''}</p>
                      {v.numarInmatriculare && (
                        <div style={s.placuta}>
                          <span style={s.placutaRo}>RO</span>
                          <span style={s.placutaNr}>{v.numarInmatriculare}</span>
                        </div>
                      )}
                    </div>
                    <div style={s.docsMini}>
                      {[
                        { lbl: 'ITP', st: stITP },
                        { lbl: 'RCA', st: stRCA },
                        { lbl: 'ROV', st: stRov },
                      ].map(({ lbl, st }) => (
                        <div key={lbl} style={s.docBox}>
                          <span style={s.docLbl}>{lbl}</span>
                          <span style={{ ...s.docDot, backgroundColor: st.culoare }} />
                        </div>
                      ))}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                  </div>
                );
              })}

              {vehicule.length > 3 && (
                <button onClick={() => navigate('/vehicule')} style={s.maiMulteBtn}>
                  + {vehicule.length - 3} mașini în plus
                </button>
              )}
            </div>
          )}
        </section>

        {/* DOCUMENTE VALABILE */}
        {remindereOk.length > 0 && (
          <section style={{ ...s.sectiune, marginBottom: '2rem' }}>
            <div style={s.sectionHead}>
              <h3 style={s.sectionTitle}>DOCUMENTE VALABILE</h3>
              <button onClick={() => navigate('/notificari')} style={s.veziToateBtn}>
                VEZI TOATE →
              </button>
            </div>
            <div style={s.lista}>
              {remindereOk.slice(0, 4).map(r => {
                const c = getReminderColors(r.status);
                return (
                  <div key={r._id} style={{ ...s.reminderCard, borderLeft: `3px solid ${c.border}` }}>
                    <div style={s.reminderTop}>
                      <span style={{ ...s.dot, backgroundColor: c.border }} />
                      <span style={s.reminderTip}>{r.tip}</span>
                      <span style={{ ...s.tag, background: c.tagBg, color: c.tagText }}>
                        {r.zileRamase} ZILE
                      </span>
                    </div>
                    {r.vehicul && (
                      <p style={s.reminderVehicul}>{r.vehicul.marca} {r.vehicul.model}</p>
                    )}
                  </div>
                );
              })}
            </div>
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
  salut: {
    margin: '0 0 2px 0',
    color: '#64748b',
    fontSize: '11px',
    letterSpacing: '0.3px',
  },
  numeUser: {
    margin: 0,
    color: '#fff',
    fontSize: '20px',
    fontWeight: '800',
    letterSpacing: '-0.3px',
  },
  logoutBtn: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px',
    padding: '9px 10px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  main: {
    padding: '16px 16px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
  },
  statCard: {
    backgroundColor: '#12151e',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '14px',
    padding: '14px 12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '6px',
  },
  statIconWrap: {
    width: '32px',
    height: '32px',
    borderRadius: '9px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statVal: {
    fontSize: '26px',
    fontWeight: '800',
    lineHeight: 1,
    letterSpacing: '-0.5px',
  },
  statLbl: {
    fontSize: '9px',
    color: '#475569',
    fontWeight: '700',
    letterSpacing: '1px',
  },
  sectiune: {},
  sectionHead: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  sectionTitle: {
    margin: 0,
    fontSize: '9px',
    fontWeight: '800',
    color: '#475569',
    letterSpacing: '2px',
  },
  veziToateBtn: {
    background: 'none',
    border: 'none',
    color: '#00e5ff',
    fontSize: '9px',
    fontWeight: '800',
    letterSpacing: '0.5px',
    cursor: 'pointer',
  },
  lista: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  reminderCard: {
    backgroundColor: '#12151e',
    borderRadius: '10px',
    padding: '12px 14px',
    border: '1px solid rgba(255,255,255,0.04)',
  },
  reminderTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '4px',
  },
  dot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  reminderTip: {
    fontWeight: '700',
    fontSize: '13px',
    color: '#f1f5f9',
    flex: 1,
  },
  tag: {
    fontSize: '9px',
    fontWeight: '800',
    padding: '3px 8px',
    borderRadius: '20px',
    letterSpacing: '0.5px',
  },
  reminderMsg: {
    margin: '2px 0 3px',
    fontSize: '12px',
    color: '#94a3b8',
    lineHeight: '1.4',
  },
  reminderVehicul: {
    margin: 0,
    fontSize: '11px',
    color: '#475569',
    fontWeight: '600',
  },
  vehiculCard: {
    backgroundColor: '#12151e',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '12px',
    padding: '13px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer',
  },
  vehiculInfo: {
    flex: 1,
    minWidth: 0,
  },
  vehiculNume: {
    margin: '0 0 2px',
    fontWeight: '700',
    fontSize: '14px',
    color: '#f1f5f9',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  vehiculSub: {
    margin: 0,
    fontSize: '11px',
    color: '#64748b',
    fontWeight: '500',
  },
  placuta: {
    display: 'inline-flex',
    alignItems: 'center',
    border: '1.5px solid rgba(255,255,255,0.1)',
    borderRadius: '4px',
    overflow: 'hidden',
    marginTop: '5px',
  },
  placutaRo: {
    background: '#003399',
    color: '#fff',
    fontSize: '7px',
    fontWeight: '900',
    padding: '2px 4px',
  },
  placutaNr: {
    background: '#fff',
    color: '#000',
    fontSize: '10px',
    fontWeight: '900',
    padding: '2px 7px',
    letterSpacing: '1.5px',
  },
  docsMini: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexShrink: 0,
  },
  docBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '3px',
  },
  docLbl: {
    fontSize: '7px',
    color: '#475569',
    fontWeight: '700',
    letterSpacing: '0.3px',
  },
  docDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
  },
  golCard: {
    backgroundColor: '#12151e',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '12px',
    padding: '28px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    textAlign: 'center',
  },
  golText: {
    color: '#475569',
    margin: 0,
    fontSize: '13px',
  },
  maiMulteBtn: {
    backgroundColor: 'rgba(0,229,255,0.06)',
    border: '1px solid rgba(0,229,255,0.12)',
    color: '#00e5ff',
    borderRadius: '10px',
    padding: '12px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    letterSpacing: '0.3px',
    fontFamily: '"Inter", sans-serif',
  },
};

export default Dashboard;