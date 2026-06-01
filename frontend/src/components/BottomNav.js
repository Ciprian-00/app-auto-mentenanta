import { useNavigate, useLocation } from 'react-router-dom';

const BottomNav = ({ onAdaugaClick, remindereUrgente = 0 }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  const isActive = (p) => {
    if (p === '/') return path === '/';
    return path.startsWith(p);
  };

  return (
    <nav style={s.nav}>
      <button
        onClick={() => navigate('/')}
        style={{ ...s.btn, ...(isActive('/') ? s.btnActiv : {}) }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
          stroke={isActive('/') ? '#00e5ff' : '#64748b'}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <span style={{ ...s.lbl, color: isActive('/') ? '#00e5ff' : '#64748b' }}>Acasă</span>
      </button>

      <button
        onClick={() => navigate('/vehicule')}
        style={{ ...s.btn, ...(isActive('/vehicule') ? s.btnActiv : {}) }}
      >
        <img
          src="/icons/icon-192-removeb.png"
          alt="masini"
          style={{
            width: '52px',
            height: '52px',
            objectFit: 'contain',
            marginTop: '-10px',
            marginBottom: '-20.5px',
            marginLeft: '-8px',
            marginRight: '-8px',
            opacity: isActive('/vehicule') ? 1 : 0.35,
            filter: isActive('/vehicule') ? 'none' : 'grayscale(60%)',
            transition: 'opacity 0.2s',
          }}
        />
        <span style={{ ...s.lbl, color: isActive('/vehicule') ? '#00e5ff' : '#64748b' }}>Mașini</span>
      </button>

      <button onClick={onAdaugaClick} style={s.plus}>
        <span style={s.plusIcon}>+</span>
      </button>

      <button
        onClick={() => navigate('/scanner')}
        style={{ ...s.btn, ...(isActive('/scanner') ? s.btnActiv : {}) }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
          stroke={isActive('/scanner') ? '#00e5ff' : '#64748b'}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
        <span style={{ ...s.lbl, color: isActive('/scanner') ? '#00e5ff' : '#64748b' }}>Scanner</span>
      </button>

      <button
        onClick={() => navigate('/notificari')}
        style={{ ...s.btn, position: 'relative', ...(isActive('/notificari') ? s.btnActiv : {}) }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
          stroke={isActive('/notificari') ? '#00e5ff' : '#64748b'}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {remindereUrgente > 0 && (
          <span style={s.badge}>{remindereUrgente > 9 ? '9+' : remindereUrgente}</span>
        )}
        <span style={{ ...s.lbl, color: isActive('/notificari') ? '#00e5ff' : '#64748b' }}>Alerte</span>
      </button>
    </nav>
  );
};

const s = {
  nav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'var(--nav-bg)',
    backdropFilter: 'blur(20px)',
    borderTop: '1px solid var(--border)',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: '8px 0 calc(8px + env(safe-area-inset-bottom))',
    zIndex: 200,
  },
  btn: {
    background: 'none',
    border: 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '3px',
    cursor: 'pointer',
    padding: '4px 12px',
    borderRadius: '10px',
    position: 'relative',
  },
  btnActiv: {},
  lbl: {
    fontSize: '9px',
    fontWeight: '700',
    letterSpacing: '0.3px',
    fontFamily: '"Inter", sans-serif',
  },
  plus: {
    width: '52px',
    height: '52px',
    borderRadius: '50%',
    background: 'var(--accent)',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 0 6px rgba(0,229,255,0.12), 0 4px 20px rgba(0,229,255,0.3)',
    marginTop: '-20px',
    flexShrink: 0,
  },
  plusIcon: {
    color: 'var(--accent-ink)',
    fontSize: '26px',
    fontWeight: '800',
    lineHeight: 1,
    marginTop: '-2px',
  },
  badge: {
    position: 'absolute',
    top: '0',
    right: '5px',
    background: '#ff4d4d',
    color: 'white',
    fontSize: '8px',
    fontWeight: '800',
    minWidth: '15px',
    height: '15px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 3px',
  },
};

export default BottomNav;