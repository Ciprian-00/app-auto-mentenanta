import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [parola, setParola] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !parola) {
      toast.error('Completeaza email-ul si parola');
      return;
    }
    try {
      setLoading(true);
      await login(email, parola);
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.mesaj || 'Eroare la autentificare');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.pagina}>
      <div style={s.card}>
        <div style={s.logo}>
          <img src="/icons/icon-192.png" alt="logo" style={s.logoImg} />
        </div>
        <h1 style={s.titlu}>Auto-Mentenanță</h1>
        <p style={s.subtitlu}>AUTENTIFICĂ-TE ÎN CONT</p>

        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.grup}>
            <label style={s.label}>EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplu.com"
              style={s.input}
              onClick={(e) => e.target.focus()}
            />
          </div>

          <div style={s.grup}>
            <label style={s.label}>PAROLĂ</label>
            <input
              type="password"
              value={parola}
              onChange={(e) => setParola(e.target.value)}
              placeholder="••••••••"
              style={s.input}
              onClick={(e) => e.target.focus()}
            />
          </div>

          <button type="submit" disabled={loading} style={s.buton}>
            {loading ? 'SE AUTENTIFICĂ...' : 'AUTENTIFICĂ-TE'}
          </button>
        </form>

        <p style={s.link}>
          Nu ai cont?{' '}
          <Link to="/register" style={s.linkText}>Înregistrează-te</Link>
        </p>
      </div>
    </div>
  );
};

const s = {
  pagina: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0b0e14',
    fontFamily: '"Inter", sans-serif',
    padding: '20px',
  },
  card: {
    backgroundColor: '#12151e',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '20px',
    padding: '36px 28px',
    width: '100%',
    maxWidth: '380px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  logo: {
    width: '72px',
    height: '72px',
    borderRadius: '20px',
    overflow: 'hidden',
    marginBottom: '18px',
  },
  logoImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  titlu: {
    margin: '0 0 6px 0',
    color: '#f1f5f9',
    fontSize: '22px',
    fontWeight: '800',
    letterSpacing: '-0.3px',
    textAlign: 'center',
  },
  subtitlu: {
    margin: '0 0 28px 0',
    color: '#475569',
    fontSize: '9px',
    fontWeight: '700',
    letterSpacing: '2px',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    width: '100%',
  },
  grup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '9px',
    fontWeight: '700',
    color: '#475569',
    letterSpacing: '1.5px',
  },
  input: {
    padding: '12px 14px',
    backgroundColor: '#0b0e14',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px',
    fontSize: '14px',
    color: '#f1f5f9',
    outline: 'none',
    fontFamily: '"Inter", sans-serif',
    transition: 'border-color 0.2s',
  },
  buton: {
    marginTop: '8px',
    padding: '14px',
    background: '#00e5ff',
    color: '#0b0e14',
    border: 'none',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: '800',
    cursor: 'pointer',
    letterSpacing: '1px',
    fontFamily: '"Inter", sans-serif',
  },
  link: {
    textAlign: 'center',
    marginTop: '20px',
    color: '#475569',
    fontSize: '12px',
  },
  linkText: {
    color: '#00e5ff',
    fontWeight: '700',
    textDecoration: 'none',
  },
};

export default Login;
