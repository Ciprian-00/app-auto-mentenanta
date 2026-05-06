import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const getSalut = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Bună dimineața';
  if (h < 18) return 'Bună ziua';
  return 'Bună seara';
};

const getStatusDoc = (ds) => {
  if (!ds) return null;
  const zile = Math.ceil((new Date(ds) - new Date()) / (1000 * 60 * 60 * 24));
  return { zile, color: zile < 0 ? '#ff4d4d' : zile <= 30 ? '#f59e0b' : '#10b981' };
};

const getDocDots = (v) => {
  const docs = [
    { label: 'ITP', data: v.dataITP },
    { label: 'RCA', data: v.dataRCA },
    { label: 'ROV', data: v.dataRovinieta },
    ...(v.documenteCustom || []).filter(d => d.dataExpirare).map(d => ({ label: d.nume, data: d.dataExpirare }))
  ].filter(d => d.data);

  if (docs.length === 0) return [];

  return docs.map(d => {
    const st = getStatusDoc(d.data);
    const color = st ? st.color : '#10b981';
    const sub = st
      ? (st.zile < 0 ? 'EXPIRAT' : st.zile <= 30 ? `${st.zile}z` : null)
      : null;
    return { label: d.label, color, sub };
  });
};

const Dashboard = ({ refreshKey, onRemindereUpdate }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [vehicule, setVehicule] = useState([]);
  const [remindere, setRemindere] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDate = useCallback(async () => {
    try {
      setLoading(true);
      const [resV, resR] = await Promise.all([api.get('/vehicles'), api.get('/reminders')]);
      setVehicule(resV.data);
      setRemindere(resR.data);
      const urgente = resR.data.filter(r => r.status === 'expirat' || r.status === 'urgent').length;
      onRemindereUpdate?.(urgente);
    } catch {
      toast.error('Eroare la încărcarea datelor');
    } finally {
      setLoading(false);
    }
  }, [onRemindereUpdate]);

  useEffect(() => { fetchDate(); }, [fetchDate, refreshKey]);

  const remindereProblema = remindere.filter(r => r.status === 'expirat' || r.status === 'urgent');
  const remindereOk = remindere.filter(r => r.status === 'ok');
  const remindereExpirate = remindere.filter(r => r.status === 'expirat');

  if (loading) return (
    <div style={s.loadingWrap}>
      <div style={s.spinner} />
      <p style={s.loadingText}>SE INIȚIALIZEAZĂ...</p>
    </div>
  );

  const getBannerConfig = () => {
    if (remindereExpirate.length > 0) return {
      bg: 'linear-gradient(135deg, rgba(255,77,77,0.14) 0%, rgba(255,77,77,0.04) 100%)',
      border: 'rgba(255,77,77,0.35)', accent: '#ff4d4d',
      icon: '🚨',
      titlu: `${remindereExpirate.length} document${remindereExpirate.length > 1 ? 'e expirate' : ' expirat'}`,
      sub: 'Actualizează imediat pentru a evita amenzi',
    };
    if (remindereProblema.length > 0) return {
      bg: 'linear-gradient(135deg, rgba(245,158,11,0.14) 0%, rgba(245,158,11,0.04) 100%)',
      border: 'rgba(245,158,11,0.35)', accent: '#f59e0b',
      icon: '⚠️',
      titlu: `${remindereProblema.length} document${remindereProblema.length > 1 ? 'e expiră' : ' expiră'} curând`,
      sub: 'Mai puțin de 30 de zile până la expirare',
    };
    return {
      bg: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(16,185,129,0.03) 100%)',
      border: 'rgba(16,185,129,0.3)', accent: '#10b981',
      icon: '✅',
      titlu: 'Toate documentele sunt în regulă',
      sub: 'Nu ai nicio alertă activă',
    };
  };

  const banner = getBannerConfig();

  return (
    <div style={s.pagina}>

      {/* HEADER */}
      <div style={s.header}>
        <div>
          <p style={s.salut}>{getSalut()},</p>
          <h2 style={s.numeUser}>{user?.nume || 'Utilizator'}</h2>
        </div>
        <button onClick={logout} style={s.logoutBtn} title="Deconectare">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>

      <main style={s.main}>

        {/* BANNER STATUS */}
        <div style={{ ...s.banner, background: banner.bg, borderColor: banner.border }}>
          <div style={{ ...s.bannerAccent, backgroundColor: banner.accent }} />
          <span style={s.bannerIcon}>{banner.icon}</span>
          <div style={s.bannerText}>
            <p style={{ ...s.bannerTitlu, color: banner.accent }}>{banner.titlu}</p>
            <p style={s.bannerSub}>{banner.sub}</p>
          </div>
          {remindereProblema.length > 0 && (
            <button onClick={() => navigate('/notificari')} style={{ ...s.bannerBtn, borderColor: banner.border, color: banner.accent }}>
              VEZI →
            </button>
          )}
        </div>

        {/* STATS ROW */}
        <div style={s.statsCard}>
          {[
            { label: 'MAȘINI', val: vehicule.length, color: '#00e5ff' },
            { label: 'ALERTE', val: remindereProblema.length, color: remindereProblema.length > 0 ? '#f59e0b' : '#10b981' },
            { label: 'LA ZI', val: remindereOk.length, color: '#10b981' },
          ].map((st, i) => (
            <div key={st.label} style={{ ...s.statItem, borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              <span style={{ ...s.statVal, color: st.color }}>{st.val}</span>
              <span style={s.statLbl}>{st.label}</span>
            </div>
          ))}
        </div>

        {/* NECESITĂ ATENȚIE */}
        {remindereProblema.length > 0 && (
          <section style={s.sectiune}>
            <div style={s.sectionHead}>
              <h3 style={s.sectionTitle}>NECESITĂ ATENȚIE</h3>
              <button onClick={() => navigate('/notificari')} style={s.veziBtn}>VEZI TOATE →</button>
            </div>
            <div style={s.listCard}>
              {remindereProblema.slice(0, 4).map((r, i) => {
                const expirat = r.status === 'expirat';
                const color = expirat ? '#ff4d4d' : '#f59e0b';
                return (
                  <div key={r._id}>
                    {i > 0 && <div style={s.listDiv} />}
                    <div style={s.listRow} onClick={() => r.vehicul && navigate(`/vehicule/${r.vehicul._id}`)}>
                      <span style={{ ...s.listDot, backgroundColor: color, boxShadow: expirat ? `0 0 7px ${color}` : 'none' }} />
                      <div style={s.listRowBody}>
                        <p style={s.listTip}>{r.tip}</p>
                        {r.vehicul && (
                          <p style={s.listVehicul}>
                            {r.vehicul.marca} {r.vehicul.model}
                            {r.vehicul.numarInmatriculare ? ` · ${r.vehicul.numarInmatriculare}` : ''}
                          </p>
                        )}
                      </div>
                      <span style={{ ...s.listTag, background: expirat ? 'rgba(255,77,77,0.12)' : 'rgba(245,158,11,0.12)', color }}>
                        {expirat ? 'EXPIRAT' : `${r.zileRamase} ZILE`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* MAȘINILE MELE */}
        <section style={s.sectiune}>
          <div style={s.sectionHead}>
            <h3 style={s.sectionTitle}>MAȘINILE MELE</h3>
            <button onClick={() => navigate('/vehicule')} style={s.veziBtn}>VEZI TOATE →</button>
          </div>

          {vehicule.length === 0 ? (
            <div style={s.golCard}>
              <p style={{ fontSize: '2rem' }}>🚗</p>
              <p style={s.golTitlu}>Nicio mașină adăugată</p>
              <p style={s.golSub}>Adaugă prima ta mașină pentru a începe monitorizarea</p>
              <button onClick={() => navigate('/vehicule')} style={s.golBtn}>+ ADAUGĂ MAȘINĂ</button>
            </div>
          ) : (
            <div style={s.listCard}>
              {vehicule.slice(0, 3).map((v, i) => {
                const dots = getDocDots(v);
                const accentColor = dots.some(d => d.color === '#ff4d4d') ? '#ff4d4d'
                  : dots.some(d => d.color === '#f59e0b') ? '#f59e0b'
                  : '#10b981';

                return (
                  <div key={v._id}>
                    {i > 0 && <div style={s.listDiv} />}
                    <div style={s.vehiculRow} onClick={() => navigate(`/vehicule/${v._id}`)}>
                      <div style={{ ...s.vehiculAccent, backgroundColor: accentColor }} />
                      <div style={s.vehiculBody}>
                        <div style={s.vehiculTop}>
                          <p style={s.vehiculNume}>{v.marca} {v.model}</p>
                          {v.numarInmatriculare && (
                            <div style={s.placuta}>
                              <span style={s.placutaRo}>RO</span>
                              <span style={s.placutaNr}>{v.numarInmatriculare}</span>
                            </div>
                          )}
                        </div>
                        <p style={s.vehiculSub}>{v.an}{v.motor ? ` · ${v.motor}` : ''}</p>
                        {dots.length > 0 && (
                          <div style={s.dotsRow}>
                            {dots.map((d, di) => (
                              <div key={di} style={s.dotItem}>
                                <span style={{ ...s.dotCircle, backgroundColor: d.color, boxShadow: d.color !== '#10b981' ? `0 0 6px ${d.color}60` : 'none' }} />
                                <span style={{ ...s.dotLabel, color: d.sub ? d.color : '#64748b' }}>
                                  {d.label}{d.sub ? ` ${d.sub}` : ''}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                  </div>
                );
              })}
              {vehicule.length > 3 && (
                <>
                  <div style={s.listDiv} />
                  <button onClick={() => navigate('/vehicule')} style={s.maiMulteBtn}>
                    + {vehicule.length - 3} mașin{vehicule.length - 3 === 1 ? 'ă' : 'i'} în plus
                  </button>
                </>
              )}
            </div>
          )}
        </section>


      </main>
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
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#0b0e14', gap: '14px',
  },
  spinner: {
    width: '36px', height: '36px',
    border: '3px solid rgba(0,229,255,0.15)', borderTop: '3px solid #00e5ff',
    borderRadius: '50%', animation: 'spin 0.8s linear infinite',
  },
  loadingText: { color: '#00e5ff', fontSize: '11px', letterSpacing: '2px', fontWeight: '700', margin: 0 },

  // HEADER
  header: {
    padding: '20px 18px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    position: 'sticky', top: 0, zIndex: 40,
    backgroundColor: 'rgba(11,14,20,0.95)', backdropFilter: 'blur(16px)',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  salut: { margin: '0 0 2px 0', color: '#475569', fontSize: '12px', fontWeight: '500' },
  numeUser: { margin: 0, color: '#fff', fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px' },
  logoutBtn: {
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '10px', padding: '9px 10px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },

  main: { padding: '16px', display: 'flex', flexDirection: 'column', gap: '18px' },

  // BANNER
  banner: {
    borderRadius: '16px', border: '1px solid',
    padding: '16px', display: 'flex', alignItems: 'center', gap: '12px',
    position: 'relative', overflow: 'hidden',
  },
  bannerAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px' },
  bannerIcon: { fontSize: '1.4rem', flexShrink: 0 },
  bannerText: { flex: 1 },
  bannerTitlu: { margin: '0 0 2px 0', fontWeight: '800', fontSize: '14px' },
  bannerSub: { margin: 0, color: '#64748b', fontSize: '12px' },
  bannerBtn: {
    background: 'none', border: '1px solid', borderRadius: '8px',
    padding: '6px 12px', fontSize: '10px', fontWeight: '800',
    letterSpacing: '0.5px', cursor: 'pointer', flexShrink: 0,
    fontFamily: '"Inter", sans-serif',
  },

  // STATS
  statsCard: {
    backgroundColor: '#12151e', border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '16px', display: 'flex', overflow: 'hidden',
  },
  statItem: { flex: 1, padding: '18px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' },
  statVal: { fontSize: '28px', fontWeight: '900', lineHeight: 1, letterSpacing: '-1px' },
  statLbl: { fontSize: '9px', color: '#475569', fontWeight: '800', letterSpacing: '1.5px' },

  // SECTIUNE
  sectiune: {},
  sectionHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  sectionTitle: { margin: 0, fontSize: '9px', fontWeight: '800', color: '#475569', letterSpacing: '2px' },
  veziBtn: {
    background: 'none', border: 'none', color: '#00e5ff',
    fontSize: '9px', fontWeight: '800', letterSpacing: '0.5px', cursor: 'pointer',
  },

  // LIST CARD (comun pentru alerte + mașini)
  listCard: {
    backgroundColor: '#12151e', border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '16px', overflow: 'hidden',
  },
  listDiv: { height: '1px', backgroundColor: 'rgba(255,255,255,0.04)', margin: '0 16px' },

  // LISTA ALERTE — rânduri
  listRow: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '13px 16px', cursor: 'pointer',
  },
  listDot: { width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0 },
  listRowBody: { flex: 1, minWidth: 0 },
  listTip: { margin: '0 0 2px 0', fontWeight: '700', fontSize: '14px', color: '#f1f5f9' },
  listVehicul: { margin: 0, fontSize: '11px', color: '#475569', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  listTag: { fontSize: '9px', fontWeight: '800', padding: '4px 9px', borderRadius: '20px', letterSpacing: '0.5px', flexShrink: 0, whiteSpace: 'nowrap' },

  // VEHICUL ROW
  vehiculRow: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '14px 16px', cursor: 'pointer', position: 'relative',
  },
  vehiculAccent: { width: '3px', height: '100%', position: 'absolute', left: 0, top: 0, bottom: 0 },
  vehiculBody: { flex: 1, minWidth: 0, paddingLeft: '4px' },
  vehiculTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '3px' },
  vehiculNume: { margin: 0, fontWeight: '700', fontSize: '15px', color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  vehiculSub: { margin: '0 0 8px 0', fontSize: '11px', color: '#475569', fontWeight: '500' },
  placuta: { display: 'inline-flex', alignItems: 'center', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', flexShrink: 0 },
  placutaRo: { background: '#003399', color: '#fff', fontSize: '7px', fontWeight: '900', padding: '2px 4px' },
  placutaNr: { background: '#fff', color: '#000', fontSize: '10px', fontWeight: '900', padding: '2px 7px', letterSpacing: '1.5px' },
  dotsRow: { display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '1px' },
  dotItem: { display: 'flex', alignItems: 'center', gap: '5px' },
  dotCircle: { width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0 },
  dotLabel: { fontSize: '10px', fontWeight: '600', letterSpacing: '0.2px' },

  // GOL
  golCard: {
    backgroundColor: '#12151e', border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '16px', padding: '36px 20px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textAlign: 'center',
  },
  golTitlu: { margin: 0, fontSize: '16px', fontWeight: '800', color: '#f1f5f9' },
  golSub: { margin: 0, fontSize: '13px', color: '#475569', lineHeight: '1.5' },
  golBtn: {
    marginTop: '8px', backgroundColor: '#00e5ff', border: 'none', color: '#001f24',
    borderRadius: '10px', padding: '12px 24px', fontSize: '11px',
    fontWeight: '800', letterSpacing: '1px', cursor: 'pointer', fontFamily: '"Inter", sans-serif',
  },
  maiMulteBtn: {
    display: 'block', width: '100%', background: 'none', border: 'none',
    color: '#475569', padding: '13px 16px', fontSize: '12px', fontWeight: '700',
    cursor: 'pointer', textAlign: 'center', fontFamily: '"Inter", sans-serif',
  },

};

export default Dashboard;
