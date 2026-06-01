import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [form, setForm] = useState({ nume: '', email: '', parola: '', telefon: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nume || !form.email || !form.parola) {
      toast.error('Numele, email-ul și parola sunt obligatorii');
      return;
    }
    if (form.parola.length < 6) {
      toast.error('Parola trebuie să aibă minim 6 caractere');
      return;
    }
    try {
      setLoading(true);
      await register(form.nume, form.email, form.parola, form.telefon);
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.mesaj || 'Eroare la înregistrare');
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
        <p style={s.subtitlu}>CREEAZĂ UN CONT NOU</p>

        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.grup}>
            <label style={s.label}>NUME COMPLET</label>
            <input
              name="nume"
              value={form.nume}
              onChange={handleChange}
              placeholder="Ion Popescu"
              style={s.input}
              onClick={(e) => e.target.focus()}
            />
          </div>

          <div style={s.grup}>
            <label style={s.label}>EMAIL</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="email@exemplu.com"
              style={s.input}
              onClick={(e) => e.target.focus()}
            />
          </div>

          <div style={s.grup}>
            <label style={s.label}>PAROLĂ</label>
            <input
              type="password"
              name="parola"
              value={form.parola}
              onChange={handleChange}
              placeholder="••••••••"
              style={s.input}
              onClick={(e) => e.target.focus()}
            />
          </div>

          <div style={s.grup}>
            <label style={s.label}>TELEFON <span style={s.optional}>(OPȚIONAL)</span></label>
            <input
              name="telefon"
              value={form.telefon}
              onChange={handleChange}
              placeholder="07xx xxx xxx"
              style={s.input}
              onClick={(e) => e.target.focus()}
            />
          </div>

          <button type="submit" disabled={loading} style={s.buton}>
            {loading ? 'SE ÎNREGISTREAZĂ...' : 'CREEAZĂ CONT'}
          </button>
        </form>

        <p style={s.link}>
          Ai deja cont?{' '}
          <Link to="/login" style={s.linkText}>Autentifică-te</Link>
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
    backgroundColor: 'var(--bg)',
    fontFamily: '"Inter", sans-serif',
    padding: '20px',
  },
  card: {
    backgroundColor: 'var(--surface-2)',
    border: '1px solid var(--border)',
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
    color: 'var(--text-strong)',
    fontSize: '22px',
    fontWeight: '800',
    letterSpacing: '-0.3px',
    textAlign: 'center',
  },
  subtitlu: {
    margin: '0 0 28px 0',
    color: 'var(--text-faint)',
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
    color: 'var(--text-faint)',
    letterSpacing: '1.5px',
  },
  optional: {
    color: 'var(--text-fainter)',
    fontWeight: '600',
  },
  input: {
    padding: '12px 14px',
    backgroundColor: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    fontSize: '14px',
    color: 'var(--text-strong)',
    outline: 'none',
    fontFamily: '"Inter", sans-serif',
    transition: 'border-color 0.2s',
  },
  buton: {
    marginTop: '8px',
    padding: '14px',
    background: 'var(--accent)',
    color: 'var(--bg)',
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
    color: 'var(--text-faint)',
    fontSize: '12px',
  },
  linkText: {
    color: 'var(--accent)',
    fontWeight: '700',
    textDecoration: 'none',
  },
};

export default Register;
