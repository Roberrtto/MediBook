import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import PulseMark from '../components/PulseMark.jsx';

const ROLES = [
  { value: 'patient', label: 'Patient' },
  { value: 'doctor', label: 'Doctor' },
  { value: 'receptionist', label: 'Front desk' },
];

export default function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'patient',
    specialty: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.register(form);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-md mx-auto px-6 py-16">
      <div className="flex justify-center mb-6">
        <PulseMark className="w-12 h-12" />
      </div>
      <h1 className="font-display text-2xl font-semibold text-pine-900 text-center">
        Create your account
      </h1>
      <p className="text-center text-pine-700 text-sm mt-1">
        Set up access for your role at the clinic.
      </p>

      <form onSubmit={handleSubmit} className="card mt-8 space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-2.5">{error}</div>
        )}
        {success && (
          <div className="bg-teal-500/10 text-teal-600 text-sm rounded-lg px-4 py-2.5">
            Account created! Redirecting to log in…
          </div>
        )}

        <div>
          <label className="label" htmlFor="name">
            Full name
          </label>
          <input
            id="name"
            required
            className="input-field"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
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
            minLength={8}
            className="input-field"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>
        <div>
          <label className="label" htmlFor="role">
            I am a…
          </label>
          <select
            id="role"
            className="input-field"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        {form.role === 'doctor' && (
          <div>
            <label className="label" htmlFor="specialty">
              Specialty
            </label>
            <input
              id="specialty"
              className="input-field"
              placeholder="e.g. General Practice"
              value={form.specialty}
              onChange={(e) => setForm({ ...form, specialty: e.target.value })}
            />
          </div>
        )}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="text-center text-sm text-pine-700 mt-6">
        Already registered?{' '}
        <Link to="/login" className="font-semibold text-teal-600 hover:underline">
          Log in
        </Link>
      </p>
    </main>
  );
}
