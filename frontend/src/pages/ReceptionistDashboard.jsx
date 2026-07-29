import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import AppointmentCard from '../components/AppointmentCard.jsx';

export default function ReceptionistDashboard() {
  const { token } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [filter, setFilter] = useState('all');

  const load = async () => {
    try {
      const data = await api.allAppointments(token);
      setAppointments(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCancel = async (id) => {
    setCancellingId(id);
    setError('');
    try {
      await api.cancelAppointment(id, token);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setCancellingId(null);
    }
  };

  const filtered = useMemo(
    () => (filter === 'all' ? appointments : appointments.filter((a) => a.status === filter)),
    [appointments, filter]
  );

  const counts = useMemo(
    () => ({
      booked: appointments.filter((a) => a.status === 'booked').length,
      cancelled: appointments.filter((a) => a.status === 'cancelled').length,
      completed: appointments.filter((a) => a.status === 'completed').length,
    }),
    [appointments]
  );

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="font-display text-2xl font-semibold text-pine-900">Front desk calendar</h1>
      <p className="text-pine-700 text-sm mt-1">
        Every appointment across the clinic, in one place.
      </p>

      <div className="grid sm:grid-cols-3 gap-4 mt-6">
        <div className="card !py-4">
          <p className="text-xs text-pine-700 font-semibold uppercase tracking-wide">Booked</p>
          <p className="font-display text-2xl font-semibold text-teal-600 mt-1">{counts.booked}</p>
        </div>
        <div className="card !py-4">
          <p className="text-xs text-pine-700 font-semibold uppercase tracking-wide">Cancelled</p>
          <p className="font-display text-2xl font-semibold text-red-500 mt-1">{counts.cancelled}</p>
        </div>
        <div className="card !py-4">
          <p className="text-xs text-pine-700 font-semibold uppercase tracking-wide">Completed</p>
          <p className="font-display text-2xl font-semibold text-pine-900 mt-1">{counts.completed}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-2.5 mt-6">{error}</div>
      )}

      <div className="card mt-6">
        <div className="flex items-center gap-2 border-b border-pine-900/10 pb-3">
          {['all', 'booked', 'cancelled', 'completed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-sm font-semibold px-3 py-1.5 rounded-full capitalize ${
                filter === f ? 'bg-pine-900 text-sage-50' : 'text-pine-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="mt-2">
          {filtered.length === 0 ? (
            <p className="text-sm text-pine-700 py-8 text-center">No appointments to show.</p>
          ) : (
            filtered.map((a) => (
              <AppointmentCard
                key={a.id}
                appointment={a}
                personLabel={`${a.patient_name} → Dr. ${a.doctor_name}`}
                onCancel={handleCancel}
                cancelling={cancellingId === a.id}
              />
            ))
          )}
        </div>
      </div>
    </main>
  );
}
