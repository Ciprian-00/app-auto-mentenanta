import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

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

const INTERVALE = ['6L', '1A', 'TOT'];
const CATEGORII = ['TOATE', 'SERVICE', 'DOC'];

const Dashboard = ({ refreshKey, onRemindereUpdate }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [vehicule, setVehicule] = useState([]);
  const [remindere, setRemindere] = useState([]);
  const [cheltuieli, setCheltuieli] = useState([]);
  const [intervalGrafic, setIntervalGrafic] = useState('1A');
  const [categorieGrafic, setCategorieGrafic] = useState('TOATE');
  const [loading, setLoading] = useState(true);

  const fetchDate = useCallback(async () => {
    try {
      setLoading(true);
      const [resV, resR] = await Promise.all([api.get('/vehicles'), api.get('/reminders')]);
      setVehicule(resV.data);
      setRemindere(resR.data);
      const urgente = resR.data.filter(r => r.status === 'expirat' || r.status === 'urgent').length;
      onRemindereUpdate?.(urgente);

      // Fetch maintenance logs pentru toate vehiculele
      const logs = await Promise.all(resV.data.map(v => api.get(`/maintenance/vehicul/${v._id}`).then(r => r.data).catch(() => [])));
      setCheltuieli(logs.flat().filter(l => l.cost > 0));
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

  const getDateGrafic = () => {
    const acum = new Date();
    const limitaInceput = new Date(acum);
    if (intervalGrafic === '6L') limitaInceput.setMonth(acum.getMonth() - 6);
    else if (intervalGrafic === '1A') limitaInceput.setFullYear(acum.getFullYear() - 1);
    else limitaInceput.setFullYear(2000);

    const filtrate = cheltuieli.filter(l => {
      if (new Date(l.data) < limitaInceput) return false;
      if (categorieGrafic === 'SERVICE') return l.categorie !== 'document';
      if (categorieGrafic === 'DOC') return l.categorie === 'document';
      return true;
    });
    if (filtrate.length === 0) return [];

    // Grupare pe lună
    const map = {};
    filtrate.forEach(l => {
      const d = new Date(l.data);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map[key] = (map[key] || 0) + (l.cost || 0);
    });

    // Completează lunile lipsă cu 0
    const result = [];
    const cursor = new Date(limitaInceput.getFullYear(), limitaInceput.getMonth(), 1);
    const sfarsit = new Date(acum.getFullYear(), acum.getMonth(), 1);
    while (cursor <= sfarsit) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
      const luna = cursor.toLocaleDateString('ro-RO', { month: 'short', year: intervalGrafic === 'TOT' ? '2-digit' : undefined });
      result.push({ luna, cost: map[key] || 0 });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return result;
  };

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
                        {v.ultimulSchimbUlei?.data && (() => {
                          const dataSchimb = new Date(v.ultimulSchimbUlei.data);
                          const dataUrmatoare = new Date(dataSchimb);
                          dataUrmatoare.setFullYear(dataUrmatoare.getFullYear() + 1);
                          const kmLaSchimb = v.ultimulSchimbUlei.kilometraj || 0;
                          const kmCurent = v.kilometrajCurent || 0;
                          const depasitKm = kmCurent > 0 && kmLaSchimb > 0 && (kmCurent - kmLaSchimb) >= 10000;
                          const zile = depasitKm ? -1 : Math.ceil((dataUrmatoare - new Date()) / (1000 * 60 * 60 * 24));
                          const color = zile < 0 ? '#ff4d4d' : zile <= 30 ? '#f59e0b' : '#10b981';
                          const sub = zile < 0 ? 'DEPĂȘIT' : zile <= 30 ? `${zile}z` : null;
                          return (
                            <div style={{ ...s.dotItem, marginTop: '6px' }}>
                              <span style={{ ...s.dotCircle, backgroundColor: color, boxShadow: color !== '#10b981' ? `0 0 6px ${color}60` : 'none' }} />
                              <span style={{ ...s.dotLabel, color: sub ? color : '#64748b' }}>
                                Ulei · {dataSchimb.toLocaleDateString('ro-RO', { month: 'short', year: 'numeric' })}
                                {v.ultimulSchimbUlei.kilometraj ? ` · ${Number(v.ultimulSchimbUlei.kilometraj).toLocaleString('ro-RO')} km` : ''}
                                {sub ? ` · ${sub}` : ''}
                              </span>
                            </div>
                          );
                        })()}
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

        {/* CHELTUIELI SERVICE */}
        {cheltuieli.length > 0 && (() => {
          const cheltuieliFiltrate = categorieGrafic === 'SERVICE'
            ? cheltuieli.filter(l => l.categorie !== 'document')
            : categorieGrafic === 'DOC'
            ? cheltuieli.filter(l => l.categorie === 'document')
            : cheltuieli;
          const dataGrafic = getDateGrafic();
          const total = cheltuieliFiltrate.reduce((s, l) => s + (l.cost || 0), 0);
          return (
            <section style={s.sectiune}>
              <div style={s.sectionHead}>
                <h3 style={s.sectionTitle}>CHELTUIELI</h3>
                <div style={s.intervalRow}>
                  {INTERVALE.map(iv => (
                    <button key={iv} onClick={() => setIntervalGrafic(iv)}
                      style={{ ...s.intervalBtn, ...(intervalGrafic === iv ? s.intervalBtnActiv : {}) }}>
                      {iv}
                    </button>
                  ))}
                </div>
              </div>
              <div style={s.categorieRow}>
                {CATEGORII.map(cat => (
                  <button key={cat} onClick={() => setCategorieGrafic(cat)}
                    style={{ ...s.categorieBtn, ...(categorieGrafic === cat ? s.categorieBtnActiv : {}) }}>
                    {cat === 'TOATE' ? 'Toate' : cat === 'SERVICE' ? 'Service' : 'Documente'}
                  </button>
                ))}
              </div>
              <div style={s.graficCard}>
                <div style={s.graficHeader}>
                  <div>
                    <p style={s.graficTotal}>{total.toLocaleString('ro-RO')} lei</p>
                    <p style={s.graficSub}>total înregistrat</p>
                  </div>
                  <p style={s.graficNrIntrari}>{cheltuieliFiltrate.length} intrări</p>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={dataGrafic} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradCost" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00e5ff" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#00e5ff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="luna" tick={{ fill: '#334155', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: '#334155', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v === 0 ? '' : v.toLocaleString('ro-RO')} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0d1017', border: '1px solid rgba(0,229,255,0.15)', borderRadius: '12px', fontSize: '13px', padding: '10px 14px' }}
                      labelStyle={{ color: '#64748b', fontWeight: 700, marginBottom: '4px', fontSize: '11px' }}
                      itemStyle={{ color: '#00e5ff', fontWeight: 800 }}
                      formatter={v => v > 0 ? [`${v.toLocaleString('ro-RO')} lei`, ''] : null}
                      cursor={{ stroke: 'rgba(0,229,255,0.15)', strokeWidth: 1 }}
                    />
                    <Area type="monotone" dataKey="cost" stroke="#00e5ff" strokeWidth={2} fill="url(#gradCost)" dot={false} activeDot={{ r: 5, fill: '#00e5ff', stroke: '#0b0e14', strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>
          );
        })()}

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

  // GRAFIC CHELTUIELI
  graficCard: {
    backgroundColor: '#12151e', border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '16px', overflow: 'hidden', padding: '16px 16px 10px',
  },
  graficHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' },
  graficTotal: { margin: 0, fontSize: '22px', fontWeight: '900', color: '#00e5ff', letterSpacing: '-0.5px' },
  graficSub: { margin: '2px 0 0', fontSize: '10px', color: '#475569', fontWeight: '600' },
  graficNrIntrari: { margin: 0, fontSize: '11px', color: '#334155', fontWeight: '700' },
  intervalRow: { display: 'flex', gap: '4px' },
  intervalBtn: {
    background: 'none', border: 'none', outline: 'none',
    color: '#334155', borderRadius: '8px', padding: '4px 10px',
    fontSize: '10px', fontWeight: '800', cursor: 'pointer', letterSpacing: '0.5px',
    fontFamily: '"Inter", sans-serif',
  },
  intervalBtnActiv: {
    backgroundColor: 'rgba(0,229,255,0.12)', color: '#00e5ff',
  },

  // Filtre categorie grafic
  categorieRow: { display: 'flex', gap: '6px', marginBottom: '12px' },
  categorieBtn: {
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
    color: '#475569', borderRadius: '20px', padding: '5px 12px',
    fontSize: '10px', fontWeight: '700', cursor: 'pointer', letterSpacing: '0.3px',
    fontFamily: '"Inter", sans-serif', outline: 'none',
  },
  categorieBtnActiv: {
    backgroundColor: 'rgba(0,229,255,0.12)', borderColor: 'rgba(0,229,255,0.3)', color: '#00e5ff',
  },
};

export default Dashboard;
