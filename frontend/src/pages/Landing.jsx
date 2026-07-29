import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const STATS = [
  { value: '24/7', label: 'Online self-service booking' },
  { value: '<2s', label: 'Booking confirmation time' },
  { value: '0', label: 'Double-bookings, by design' },
];

export default function Landing() {
  const { isAuthenticated, user } = useAuth();

  const dashboardPath = user
    ? { patient: '/patient', doctor: '/doctor', receptionist: '/reception' }[user.role]
    : '/login';

  return (
    <main>
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <span className="badge bg-gold-500/15 text-pine-900 mb-5">
            For small &amp; mid-size clinics
          </span>
          <h1 className="font-display text-4xl md:text-5xl font-semibold text-pine-900 leading-[1.1] tracking-tight">
            One heartbeat, <br /> not a hundred phone calls.
          </h1>
          <p className="mt-5 text-pine-700 text-lg max-w-md">
            MediBook replaces the paper diary and the overflowing phone line with real-time
            booking, automatic reminders, and a secure record for every visit.
          </p>
          <div className="mt-8 flex items-center gap-4">
            <Link to={isAuthenticated ? dashboardPath : '/register'} className="btn-primary">
              {isAuthenticated ? 'Go to dashboard' : 'Get started'}
            </Link>
            <Link to={isAuthenticated ? dashboardPath : '/login'} className="btn-secondary">
              {isAuthenticated ? 'View schedule' : 'Log in'}
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-3 gap-6 max-w-md">
            {STATS.map((s) => (
              <div key={s.label}>
                <p className="font-display text-2xl font-semibold text-teal-600">{s.value}</p>
                <p className="text-xs text-pine-700 mt-1 leading-snug">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card !p-8 relative overflow-hidden">
          <p className="label">Live vital — clinic capacity</p>
          <svg viewBox="0 0 400 140" className="w-full h-36 mt-2" aria-hidden="true">
            <line x1="0" y1="70" x2="400" y2="70" stroke="#12312F" strokeOpacity="0.08" />
            <path
              d="M0 70 L60 70 L80 30 L100 110 L120 15 L140 70 L400 70"
              stroke="#2F6F5E"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="pulse-line"
            />
          </svg>
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-pine-900/10">
            <div>
              <p className="font-display text-xl font-semibold text-pine-900">Real-time</p>
              <p className="text-xs text-pine-700 mt-1">Slot availability</p>
            </div>
            <div>
              <p className="font-display text-xl font-semibold text-pine-900">Locked</p>
              <p className="text-xs text-pine-700 mt-1">Transaction-safe DB</p>
            </div>
            <div>
              <p className="font-display text-xl font-semibold text-pine-900">Encrypted</p>
              <p className="text-xs text-pine-700 mt-1">AES-256 records</p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24 grid md:grid-cols-3 gap-6">
        {[
          {
            title: 'Patients',
            body: 'Book, view, and cancel appointments online — no more waiting on hold.',
          },
          {
            title: 'Doctors',
            body: 'See exactly who is next and review clinical history before the visit.',
          },
          {
            title: 'Front desk',
            body: 'One calendar for the whole clinic, with walk-ins and manual bookings covered.',
          },
        ].map((f) => (
          <div key={f.title} className="card">
            <h3 className="font-display font-semibold text-pine-900 text-lg">{f.title}</h3>
            <p className="text-sm text-pine-700 mt-2">{f.body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
