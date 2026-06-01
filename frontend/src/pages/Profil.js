import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { aboneazaPush, dezaboneazaPush, testPush, verificaAcum, pushSuportat } from '../services/push';
import api from '../services/api';

const EMAIL_SUPORT = 'ciprian.ciobanu@student.usv.ro';
const PRAGURI = [7, 14, 30, 60];

// Inițialele din nume pentru avatar (ex: "Ciprian Ciobanu" → "CC")
const initiale = (nume) => {
  if (!nume) return '?';
  return nume.trim().split(/\s+/).slice(0, 2).map(c => c[0].toUpperCase()).join('');
};

// Conținutul paginilor informative (deschise în modal)
const INFO = {
  despre: {
    titlu: 'Despre aplicație',
    text: 'Aplicație de monitorizare a întreținerii auto: documente (ITP, RCA, Rovinietă), schimburi de ulei, distribuție și lichid de frână, cu alerte înainte de expirare și scanare OCR a certificatului de înmatriculare. Proiect de licență.',
  },
  termeni: {
    titlu: 'Termeni și condiții',
    text: 'Aplicația este oferită „ca atare", în scop personal și educațional. Utilizatorul este responsabil pentru corectitudinea datelor introduse. Alertele au rol informativ și nu înlocuiesc verificarea documentelor oficiale.',
  },
  confidentialitate: {
    titlu: 'Confidențialitate',
    text: 'Datele tale (cont și mașini) sunt stocate doar pentru funcționarea aplicației și nu sunt partajate cu terți. Poți edita sau șterge oricând datele, inclusiv contul, din această pagină.',
  },
};

const Profil = () => {
  const navigate = useNavigate();
  const { logout, updateUser } = useAuth();
  const { tema, setTema } = useTheme();

  const [profil, setProfil] = useState(null);
  const [nrMasini, setNrMasini] = useState(0);
  const [loading, setLoading] = useState(true);

  const [formCont, setFormCont] = useState({ nume: '', email: '', telefon: '' });
  const [formParola, setFormParola] = useState({ parolaCurenta: '', parolaNoua: '', confirma: '' });
  const [prag, setPrag] = useState(30);
  const [notificari, setNotificari] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [savingCont, setSavingCont] = useState(false);
  const [savingParola, setSavingParola] = useState(false);
  const [infoModal, setInfoModal] = useState(null);
  const [editCont, setEditCont] = useState(false);
  const [editParola, setEditParola] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const [resP, resV] = await Promise.all([api.get('/auth/profil'), api.get('/vehicles')]);
        setProfil(resP.data);
        setFormCont({ nume: resP.data.nume || '', email: resP.data.email || '', telefon: resP.data.telefon || '' });
        setPrag(resP.data.setari?.zileInainteAlerta || 30);
        setNotificari(resP.data.setari?.notificariActive || false);
        setNrMasini(resV.data.length);
      } catch {
        toast.error('Eroare la încărcarea profilului');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const setCont = (key, val) => setFormCont(f => ({ ...f, [key]: val }));
  const setParola = (key, val) => setFormParola(f => ({ ...f, [key]: val }));

  const handleSalveazaCont = async (e) => {
    e.preventDefault();
    if (!formCont.nume.trim() || !formCont.email.trim()) {
      toast.error('Numele și email-ul sunt obligatorii');
      return;
    }
    setSavingCont(true);
    try {
      const { data } = await api.put('/auth/profil', formCont);
      updateUser({ nume: data.nume, email: data.email });
      setProfil(p => ({ ...p, ...data }));
      setEditCont(false);
      toast.success('Date actualizate!');
    } catch (err) {
      toast.error(err.response?.data?.mesaj || 'Eroare la salvare');
    } finally {
      setSavingCont(false);
    }
  };

  const handleSchimbaParola = async (e) => {
    e.preventDefault();
    if (formParola.parolaNoua !== formParola.confirma) {
      toast.error('Parolele noi nu coincid');
      return;
    }
    setSavingParola(true);
    try {
      await api.put('/auth/parola', { parolaCurenta: formParola.parolaCurenta, parolaNoua: formParola.parolaNoua });
      setFormParola({ parolaCurenta: '', parolaNoua: '', confirma: '' });
      setEditParola(false);
      toast.success('Parola a fost schimbată!');
    } catch (err) {
      toast.error(err.response?.data?.mesaj || 'Eroare la schimbarea parolei');
    } finally {
      setSavingParola(false);
    }
  };

  const handleSchimbaPrag = async (zile) => {
    const vechi = prag;
    setPrag(zile);
    try {
      await api.put('/auth/setari', { zileInainteAlerta: zile });
      toast.success(`Vei fi avertizat cu ${zile} zile înainte`);
    } catch (err) {
      setPrag(vechi);
      toast.error(err.response?.data?.mesaj || 'Eroare la salvarea setării');
    }
  };

  // Deschide modalul de editare cont cu valorile curente (evită schimbări accidentale)
  const deschideEditCont = () => {
    setFormCont({ nume: profil.nume || '', email: profil.email || '', telefon: profil.telefon || '' });
    setEditCont(true);
  };

  const deschideEditParola = () => {
    setFormParola({ parolaCurenta: '', parolaNoua: '', confirma: '' });
    setEditParola(true);
  };

  // Activează/dezactivează notificările push (abonare/dezabonare la nivel de dispozitiv)
  const handleToggleNotificari = async () => {
    if (pushBusy) return;
    setPushBusy(true);
    try {
      if (!notificari) {
        await aboneazaPush();
        setNotificari(true);
        toast.success('Notificări activate');
      } else {
        await dezaboneazaPush();
        setNotificari(false);
        toast.success('Notificări dezactivate');
      }
    } catch (err) {
      toast.error(err.response?.data?.mesaj || err.message || 'Eroare la notificări');
    } finally {
      setPushBusy(false);
    }
  };

  const handleTestNotificare = async () => {
    try {
      await testPush();
      toast.success('Notificare de test trimisă!');
    } catch (err) {
      toast.error(err.response?.data?.mesaj || 'Eroare la trimiterea testului');
    }
  };

  // TEMPORAR (demo licență): declanșează manual verificarea expirărilor
  const handleVerificaAcum = async () => {
    try {
      const { data } = await verificaAcum();
      if (data.trimise > 0) toast.success(`${data.trimise} notificare(i) trimise pentru documente care expiră`);
      else toast.info('Niciun document de notificat acum');
    } catch (err) {
      toast.error(err.response?.data?.mesaj || 'Eroare la verificare');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleStergeCont = async () => {
    if (!window.confirm('Sigur ștergi contul? Toate mașinile și datele tale vor fi șterse definitiv.')) return;
    if (!window.confirm('Această acțiune este IREVERSIBILĂ. Confirmi ștergerea contului?')) return;
    try {
      await api.delete('/auth/cont');
      toast.success('Contul a fost șters');
      logout();
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.mesaj || 'Eroare la ștergerea contului');
    }
  };

  if (loading) {
    return (
      <div style={s.loadingWrap}>
        <div style={s.spinner} />
        <p style={s.loadingText}>SE ÎNCARCĂ PROFILUL...</p>
      </div>
    );
  }

  const membruDin = profil?.createdAt
    ? new Date(profil.createdAt).toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' })
    : null;

  return (
    <div style={s.pagina}>

      <nav style={s.navbar}>
        <button onClick={() => navigate(-1)} style={s.backBtn}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <span style={s.navTitlu}>Setări</span>
        <div style={{ width: '28px' }} />
      </nav>

      <main style={s.main}>

        {/* Card cu avatar + identitate */}
        <div style={s.profilCard}>
          <div style={s.avatar}>{initiale(profil?.nume)}</div>
          <h2 style={s.profilNume}>{profil?.nume}</h2>
          <p style={s.profilEmail}>{profil?.email}</p>
          <div style={s.profilStats}>
            <div style={s.statBox}>
              <span style={s.statVal}>{nrMasini}</span>
              <span style={s.statLbl}>{nrMasini === 1 ? 'MAȘINĂ' : 'MAȘINI'}</span>
            </div>
            {membruDin && (
              <div style={s.statBox}>
                <span style={{ ...s.statVal, fontSize: '13px', textTransform: 'capitalize' }}>{membruDin}</span>
                <span style={s.statLbl}>MEMBRU DIN</span>
              </div>
            )}
          </div>
        </div>

        {/* Aparență — temă */}
        <section style={s.sectiune}>
          <div style={s.sectLabel}>APARENȚĂ</div>
          <div style={s.card}>
            <span style={s.rowLabel}>Temă</span>
            <div style={s.segment}>
              {[{ k: 'dark', l: '🌙 Întunecat' }, { k: 'light', l: '☀️ Luminos' }].map(opt => (
                <button key={opt.k} onClick={() => setTema(opt.k)}
                  style={{ ...s.segBtn, ...(tema === opt.k ? s.segBtnActiv : {}) }}>
                  {opt.l}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Alerte — pragul de avertizare */}
        <section style={s.sectiune}>
          <div style={s.sectLabel}>ALERTE</div>
          <div style={s.card}>
            <span style={s.rowLabel}>Avertizează-mă cu câte zile înainte de expirare</span>
            <div style={s.segment}>
              {PRAGURI.map(z => (
                <button key={z} onClick={() => handleSchimbaPrag(z)}
                  style={{ ...s.segBtn, ...(prag === z ? s.segBtnActiv : {}) }}>
                  {z} zile
                </button>
              ))}
            </div>
            <p style={s.hint}>Se aplică pentru ITP, RCA, Rovinietă și documentele tale.</p>
          </div>
        </section>

        {/* Notificări push */}
        <section style={s.sectiune}>
          <div style={s.sectLabel}>NOTIFICĂRI</div>
          <div style={s.card}>
            <div style={s.dataRow}>
              <span style={s.rowLabel}>Notificări push</span>
              <button
                onClick={handleToggleNotificari}
                disabled={pushBusy || !pushSuportat()}
                style={{ ...s.switch, ...(notificari ? s.switchOn : {}), opacity: pushSuportat() ? 1 : 0.5 }}
                aria-label="Comută notificările"
              >
                <span style={{ ...s.switchKnob, ...(notificari ? s.switchKnobOn : {}) }} />
              </button>
            </div>
            <p style={s.hint}>
              {pushSuportat()
                ? 'Primești o notificare pe telefon când expiră un document, chiar dacă aplicația e închisă.'
                : 'Notificările push nu sunt suportate pe acest browser. Pe iPhone, adaugă aplicația pe ecranul principal.'}
            </p>
            {notificari && (
              <>
                <div style={s.divider} />
                <button onClick={handleTestNotificare} style={s.linkRow}>
                  <span style={s.linkLabel}>🔔 Trimite o notificare de test</span>
                  <span style={s.chevron}>›</span>
                </button>
                {/* TEMPORAR pentru demo licență — de eliminat la final */}
                <div style={s.divider} />
                <button onClick={handleVerificaAcum} style={s.linkRow}>
                  <span style={s.linkLabel}>🔄 Verifică expirările acum <span style={s.demoTag}>demo</span></span>
                  <span style={s.chevron}>›</span>
                </button>
              </>
            )}
          </div>
        </section>

        {/* Date cont — read-only, se editează în modal */}
        <section style={s.sectiune}>
          <div style={s.sectLabel}>DATE CONT</div>
          <div style={s.card}>
            <div style={s.dataRow}>
              <span style={s.dataLabel}>Nume</span>
              <span style={s.dataVal}>{profil?.nume}</span>
            </div>
            <div style={s.divider} />
            <div style={s.dataRow}>
              <span style={s.dataLabel}>Email</span>
              <span style={s.dataVal}>{profil?.email}</span>
            </div>
            <div style={s.divider} />
            <div style={s.dataRow}>
              <span style={s.dataLabel}>Telefon</span>
              <span style={s.dataVal}>{profil?.telefon || '—'}</span>
            </div>
            <div style={s.divider} />
            <button onClick={deschideEditCont} style={s.linkRow}>
              <span style={s.linkLabel}>✎ Editează datele</span>
              <span style={s.chevron}>›</span>
            </button>
          </div>
        </section>

        {/* Securitate — schimbarea parolei se face în modal */}
        <section style={s.sectiune}>
          <div style={s.sectLabel}>SECURITATE</div>
          <div style={s.card}>
            <button onClick={deschideEditParola} style={s.linkRow}>
              <span style={s.linkLabel}>🔒 Schimbă parola</span>
              <span style={s.chevron}>›</span>
            </button>
          </div>
        </section>

        {/* Feedback */}
        <section style={s.sectiune}>
          <div style={s.sectLabel}>FEEDBACK</div>
          <div style={s.card}>
            <a href={`mailto:${EMAIL_SUPORT}?subject=${encodeURIComponent('Raportare problemă')}`} style={s.linkRow}>
              <span style={s.linkLabel}>🐞 Raportează o problemă</span>
              <span style={s.chevron}>›</span>
            </a>
            <div style={s.divider} />
            <a href={`mailto:${EMAIL_SUPORT}?subject=${encodeURIComponent('Sugestie funcție')}`} style={s.linkRow}>
              <span style={s.linkLabel}>💡 Sugerează o funcție</span>
              <span style={s.chevron}>›</span>
            </a>
          </div>
        </section>

        {/* Informații */}
        <section style={s.sectiune}>
          <div style={s.sectLabel}>INFORMAȚII</div>
          <div style={s.card}>
            {[
              { k: 'despre', l: 'ℹ️ Despre aplicație' },
              { k: 'termeni', l: '📄 Termeni și condiții' },
              { k: 'confidentialitate', l: '🔒 Confidențialitate' },
            ].map((it, i) => (
              <div key={it.k}>
                {i > 0 && <div style={s.divider} />}
                <button onClick={() => setInfoModal(it.k)} style={s.linkRow}>
                  <span style={s.linkLabel}>{it.l}</span>
                  <span style={s.chevron}>›</span>
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Aplicație + logout */}
        <section style={s.sectiune}>
          <div style={s.sectLabel}>APLICAȚIE</div>
          <div style={s.card}>
            <div style={s.infoRow}>
              <span style={s.infoLabel}>Versiune</span>
              <span style={s.infoVal}>1.0.0</span>
            </div>
            <div style={s.divider} />
            <button onClick={handleLogout} style={s.logoutBtn}>DECONECTARE</button>
          </div>
        </section>

        {/* Zonă periculoasă */}
        <section style={{ ...s.sectiune, marginBottom: '2rem' }}>
          <div style={{ ...s.sectLabel, color: '#ff4d4d' }}>ZONĂ PERICULOASĂ</div>
          <div style={s.card}>
            <p style={s.dangerText}>Ștergerea contului elimină definitiv toate mașinile, documentele și istoricul tău.</p>
            <button onClick={handleStergeCont} style={s.deleteBtn}>ȘTERGE CONTUL</button>
          </div>
        </section>

      </main>

      {/* Modal informativ */}
      {infoModal && (
        <div style={s.overlay} onClick={() => setInfoModal(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h3 style={s.modalTitlu}>{INFO[infoModal].titlu}</h3>
              <button onClick={() => setInfoModal(null)} style={s.closeBtn}>✕</button>
            </div>
            <p style={s.modalText}>{INFO[infoModal].text}</p>
          </div>
        </div>
      )}

      {/* Modal editare date cont */}
      {editCont && (
        <div style={s.overlay} onClick={() => setEditCont(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h3 style={s.modalTitlu}>Editează datele</h3>
              <button onClick={() => setEditCont(false)} style={s.closeBtn}>✕</button>
            </div>
            <form onSubmit={handleSalveazaCont} style={s.modalForm}>
              <div style={s.field}>
                <label style={s.label}>NUME</label>
                <input style={s.input} value={formCont.nume} onChange={e => setCont('nume', e.target.value)} required autoFocus />
              </div>
              <div style={s.field}>
                <label style={s.label}>EMAIL</label>
                <input type="email" style={s.input} value={formCont.email} onChange={e => setCont('email', e.target.value)} required />
              </div>
              <div style={s.field}>
                <label style={s.label}>TELEFON (opțional)</label>
                <input type="tel" style={s.input} value={formCont.telefon} onChange={e => setCont('telefon', e.target.value)} placeholder="ex: 0712 345 678" />
              </div>
              <button type="submit" style={s.saveBtn} disabled={savingCont}>
                {savingCont ? 'SE SALVEAZĂ...' : 'SALVEAZĂ'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal schimbare parolă */}
      {editParola && (
        <div style={s.overlay} onClick={() => setEditParola(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h3 style={s.modalTitlu}>Schimbă parola</h3>
              <button onClick={() => setEditParola(false)} style={s.closeBtn}>✕</button>
            </div>
            <form onSubmit={handleSchimbaParola} style={s.modalForm}>
              <div style={s.field}>
                <label style={s.label}>PAROLA CURENTĂ</label>
                <input type="password" style={s.input} value={formParola.parolaCurenta} onChange={e => setParola('parolaCurenta', e.target.value)} required autoFocus />
              </div>
              <div style={s.field}>
                <label style={s.label}>PAROLA NOUĂ</label>
                <input type="password" style={s.input} value={formParola.parolaNoua} onChange={e => setParola('parolaNoua', e.target.value)} placeholder="minim 6 caractere" required />
              </div>
              <div style={s.field}>
                <label style={s.label}>CONFIRMĂ PAROLA NOUĂ</label>
                <input type="password" style={s.input} value={formParola.confirma} onChange={e => setParola('confirma', e.target.value)} required />
              </div>
              <button type="submit" style={s.saveBtn} disabled={savingParola}>
                {savingParola ? 'SE SCHIMBĂ...' : 'SCHIMBĂ PAROLA'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const s = {
  pagina: { backgroundColor: 'var(--bg)', color: 'var(--text)', minHeight: '100vh', fontFamily: '"Inter", sans-serif', paddingBottom: 'calc(90px + env(safe-area-inset-bottom))' },
  loadingWrap: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg)', gap: '14px' },
  spinner: { width: '36px', height: '36px', border: '3px solid var(--accent-soft)', borderTop: '3px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  loadingText: { color: 'var(--accent)', fontSize: '11px', letterSpacing: '2px', fontWeight: '700', margin: 0 },

  navbar: { position: 'sticky', top: 0, zIndex: 40, backgroundColor: 'var(--nav-bg)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border-soft)', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' },
  navTitlu: { fontSize: '1rem', fontWeight: '800', letterSpacing: '1px' },

  main: { padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' },

  profilCard: { backgroundColor: 'var(--surface)', border: '1px solid var(--border-soft)', borderRadius: '16px', padding: '28px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' },
  avatar: { width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg, #00e5ff 0%, #0088aa 100%)', color: '#001f24', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', fontWeight: '900', letterSpacing: '1px', marginBottom: '6px' },
  profilNume: { margin: 0, fontSize: '20px', fontWeight: '800', color: 'var(--text)' },
  profilEmail: { margin: 0, fontSize: '13px', color: 'var(--text-dim)' },
  profilStats: { display: 'flex', gap: '12px', marginTop: '16px', width: '100%' },
  statBox: { flex: 1, backgroundColor: 'var(--bg)', border: '1px solid var(--border-soft)', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' },
  statVal: { fontSize: '20px', fontWeight: '900', color: 'var(--accent)' },
  statLbl: { fontSize: '8px', color: 'var(--text-faint)', fontWeight: '800', letterSpacing: '1px' },

  sectiune: { display: 'flex', flexDirection: 'column' },
  sectLabel: { fontSize: '0.6rem', color: 'var(--text-dim)', fontWeight: '800', letterSpacing: '2px', marginBottom: '10px', paddingLeft: '2px' },
  card: { backgroundColor: 'var(--surface)', borderRadius: '14px', border: '1px solid var(--border-soft)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' },

  rowLabel: { fontSize: '0.85rem', color: 'var(--text-strong)', fontWeight: '600' },
  segment: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  segBtn: { flex: 1, minWidth: 'fit-content', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-dim)', borderRadius: '9px', padding: '9px 10px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', fontFamily: '"Inter", sans-serif', whiteSpace: 'nowrap' },
  segBtnActiv: { background: 'var(--accent-soft)', border: '1px solid var(--accent)', color: 'var(--accent)' },
  hint: { margin: 0, fontSize: '0.72rem', color: 'var(--text-faint)', lineHeight: 1.4 },
  switch: { width: '46px', height: '26px', borderRadius: '14px', background: 'var(--surface-3)', border: '1px solid var(--border)', position: 'relative', cursor: 'pointer', padding: 0, flexShrink: 0, transition: 'background 0.2s' },
  switchOn: { background: 'var(--accent)', border: '1px solid var(--accent)' },
  switchKnob: { position: 'absolute', top: '2px', left: '2px', width: '20px', height: '20px', borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.3)', transition: 'transform 0.2s' },
  switchKnobOn: { transform: 'translateX(20px)' },
  demoTag: { fontSize: '0.55rem', fontWeight: '800', color: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: '4px', padding: '1px 5px', marginLeft: '6px', letterSpacing: '0.5px', verticalAlign: 'middle' },

  dataRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' },
  dataLabel: { fontSize: '0.8rem', color: 'var(--text-dim)', flexShrink: 0 },
  dataVal: { fontSize: '0.875rem', color: 'var(--text)', fontWeight: '600', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  modalForm: { display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '4px' },

  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '0.62rem', color: 'var(--accent)', fontWeight: '800', letterSpacing: '1px' },
  input: { backgroundColor: 'var(--input-bg)', border: '1px solid var(--border)', padding: '12px 13px', borderRadius: '8px', color: 'var(--text)', outline: 'none', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box', fontFamily: '"Inter", sans-serif' },
  saveBtn: { backgroundColor: 'var(--accent)', color: 'var(--accent-ink)', padding: '13px', border: 'none', borderRadius: '9px', fontWeight: '800', fontSize: '0.78rem', letterSpacing: '1px', cursor: 'pointer', marginTop: '2px', width: '100%', fontFamily: '"Inter", sans-serif' },

  linkRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', background: 'none', border: 'none', padding: '2px 0', cursor: 'pointer', textDecoration: 'none', fontFamily: '"Inter", sans-serif' },
  linkLabel: { fontSize: '0.875rem', color: 'var(--text-strong)', fontWeight: '600' },
  chevron: { color: 'var(--text-faint)', fontSize: '1.2rem', lineHeight: 1 },

  infoRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { fontSize: '0.875rem', color: 'var(--text-muted)' },
  infoVal: { fontSize: '0.875rem', color: 'var(--text)', fontWeight: '600' },
  divider: { height: '1px', backgroundColor: 'var(--border-soft)' },
  logoutBtn: { background: 'var(--surface-3)', border: '1px solid var(--border)', color: 'var(--text-strong)', padding: '13px', borderRadius: '9px', fontWeight: '800', fontSize: '0.78rem', letterSpacing: '1px', cursor: 'pointer', width: '100%', fontFamily: '"Inter", sans-serif' },

  dangerText: { margin: 0, fontSize: '0.8rem', color: 'var(--text-dim)', lineHeight: 1.5 },
  deleteBtn: { background: 'rgba(255,77,77,0.08)', border: '1px solid rgba(255,77,77,0.3)', color: '#ff4d4d', padding: '13px', borderRadius: '9px', fontWeight: '800', fontSize: '0.78rem', letterSpacing: '1px', cursor: 'pointer', width: '100%', fontFamily: '"Inter", sans-serif' },

  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  modal: { backgroundColor: 'var(--surface)', width: '100%', maxWidth: '420px', padding: '22px', borderRadius: '16px', border: '1px solid var(--border)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  modalTitlu: { margin: 0, fontSize: '1rem', fontWeight: '800', color: 'var(--text)' },
  closeBtn: { background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '1.2rem', cursor: 'pointer', lineHeight: 1 },
  modalText: { margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 },
};

export default Profil;
