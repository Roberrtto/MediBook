import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import PulseMark from '../components/PulseMark.jsx';

const DASHBOARD_BY_ROLE = { patient: '/patient', doctor: '/doctor', receptionist: '/reception' };

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await api.login(form);
      login(result);
      navigate(DASHBOARD_BY_ROLE[result.user.role] || '/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-md mx-auto px-6 py-16">
      <div className="flex justify-center mb-6">
        <PulseMark className="w-12 h-12" animated />
      </div>
      <h1 className="font-display text-2xl font-semibold text-pine-900 text-center">
        Welcome back
      </h1>
      <p className="text-center text-pine-700 text-sm mt-1">Log in to manage your care.</p>

      <form onSubmit={handleSubmit} className="card mt-8 space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-2.5">{error}</div>
        )}
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            className="input-field"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            className="input-field"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <p className="text-center text-sm text-pine-700 mt-6">
        New to MediBook?{' '}
        <Link to="/register" className="font-semibold text-teal-600 hover:underline">
          Create an account
        </Link>
      </p>
    </main>
  );
}
