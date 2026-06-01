// Pas de alegere afișat înainte de adăugarea unei mașini: utilizatorul alege
// între scanarea certificatului (OCR) sau introducerea manuală a datelor.
const AlegeMetoda = ({ onManual, onScanner, onClose }) => (
  <div style={s.overlay} onClick={onClose}>
    <div style={s.sheet} onClick={e => e.stopPropagation()}>
      <div style={s.handle} />
      <h3 style={s.titlu}>Adaugă o mașină</h3>
      <p style={s.sub}>Cum vrei să introduci datele?</p>

      <button style={s.optiune} onClick={onScanner}>
        <span style={s.icon}>📷</span>
        <div style={s.optText}>
          <span style={s.optTitlu}>Scanează certificatul</span>
          <span style={s.optSub}>Completare automată din talon (OCR)</span>
        </div>
        <span style={s.chevron}>›</span>
      </button>

      <button style={s.optiune} onClick={onManual}>
        <span style={s.icon}>📝</span>
        <div style={s.optText}>
          <span style={s.optTitlu}>Introdu manual</span>
          <span style={s.optSub}>Completezi tu marca, modelul și restul</span>
        </div>
        <span style={s.chevron}>›</span>
      </button>

      <button style={s.anuleaza} onClick={onClose}>ANULEAZĂ</button>
    </div>
  </div>
);

const s = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 500 },
  sheet: { background: 'var(--surface)', width: '100%', maxWidth: '500px', padding: '12px 20px calc(24px + env(safe-area-inset-bottom))', borderRadius: '20px 20px 0 0', border: '1px solid var(--border)', borderBottom: 'none', display: 'flex', flexDirection: 'column', gap: '10px' },
  handle: { width: '40px', height: '4px', background: 'var(--border-strong)', borderRadius: '2px', margin: '0 auto 8px' },
  titlu: { margin: 0, fontSize: '1.1rem', fontWeight: '800', color: 'var(--text)' },
  sub: { margin: '0 0 6px', fontSize: '0.82rem', color: 'var(--text-dim)' },
  optiune: { display: 'flex', alignItems: 'center', gap: '14px', width: '100%', textAlign: 'left', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', cursor: 'pointer', fontFamily: '"Inter", sans-serif' },
  icon: { fontSize: '1.6rem', flexShrink: 0 },
  optText: { display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, minWidth: 0 },
  optTitlu: { fontSize: '0.95rem', fontWeight: '700', color: 'var(--text)' },
  optSub: { fontSize: '0.75rem', color: 'var(--text-dim)' },
  chevron: { color: 'var(--text-faint)', fontSize: '1.4rem', lineHeight: 1, flexShrink: 0 },
  anuleaza: { background: 'none', border: 'none', color: 'var(--text-dim)', padding: '12px', fontSize: '0.78rem', fontWeight: '800', letterSpacing: '1px', cursor: 'pointer', marginTop: '2px', fontFamily: '"Inter", sans-serif' },
};

export default AlegeMetoda;
