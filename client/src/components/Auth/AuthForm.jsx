import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './auth.css';

export default function AuthForm({ mode }) {
  const isSignup = mode === 'signup';
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    identifier: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (isSignup) {
        await signup(form);
      } else {
        await login(form.identifier, form.password);
      }
      navigate('/home');
    } catch (err) {
      setError(err?.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="cad-auth-form" onSubmit={handleSubmit}>
      {isSignup && (
        <>
          <input className="cad-input" placeholder="Name" value={form.name} onChange={update('name')} required />
          <input className="cad-input" placeholder="Username" value={form.username} onChange={update('username')} required />
          <input className="cad-input" type="email" placeholder="Email" value={form.email} onChange={update('email')} required />
        </>
      )}

      {!isSignup && (
        <input
          className="cad-input"
          placeholder="Email or username"
          value={form.identifier}
          onChange={update('identifier')}
          required
        />
      )}

      <input
        className="cad-input"
        type="password"
        placeholder="Password"
        value={form.password}
        onChange={update('password')}
        required
      />

      {isSignup && (
        <input
          className="cad-input"
          type="password"
          placeholder="Confirm password"
          value={form.confirmPassword}
          onChange={update('confirmPassword')}
          required
        />
      )}

      {error && <p className="cad-auth-error">{error}</p>}

      <button className="cad-btn cad-btn-primary" type="submit" disabled={submitting}>
        {submitting ? 'Please wait…' : isSignup ? 'Create account' : 'Log in'}
      </button>
    </form>
  );
}
