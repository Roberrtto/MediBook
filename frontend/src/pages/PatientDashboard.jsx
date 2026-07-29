import { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import AppointmentCard from '../components/AppointmentCard.jsx';

export default function PatientDashboard() {
  const { token, user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [history, setHistory] = useState([]);
  const [form, setForm] = useState({ doctorId: '', appointmentTime: '', reason: '' });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [booking, setBooking] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [tab, setTab] = useState('appointments');

  const loadAll = async () => {
    const [docs, appts, hist] = await Promise.all([
      api.listDoctors(token),
      api.myAppointments(token),
      api.myMedicalHistory(token),
    ]);
    setDoctors(docs);
    setAppointments(appts);
    setHistory(hist);
  };

  useEffect(() => {
    loadAll().catch((err) => setError(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBook = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setBooking(true);
    try {
      await api.bookAppointment(
        { doctorId: Number(form.doctorId), appointmentTime: form.appointmentTime, reason: form.reason },
        token
      );
      setNotice('Appointment booked! A confirmation has been sent.');
      setForm({ doctorId: '', appointmentTime: '', reason: '' });
      await loadAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setBooking(false);
    }
  };

  const handleCancel = async (id) => {
    setCancellingId(id);
    setError('');
    try {
      await api.cancelAppointment(id, token);
      await loadAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setCancellingId(null);
    }
  };

  const upcoming = appointments.filter((a) => a.status === 'booked');

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="font-display text-2xl font-semibold text-pine-900">
        Hi {user.name.split(' ')[0]}, here's your care at a glance.
      </h1>
      <p className="text-pine-700 text-sm mt-1">
        {upcoming.length === 0
          ? 'No upcoming appointments right now.'
          : `You have ${upcoming.length} upcoming appointment${upcoming.length > 1 ? 's' : ''}.`}
      </p>

      <div className="grid lg:grid-cols-5 gap-6 mt-8">
        <section className="lg:col-span-2 card h-fit">
          <h2 className="font-display font-semibold text-pine-900">Book an appointment</h2>
          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-2.5 mt-4">
              {error}
            </div>
          )}
          {notice && (
            <div className="bg-teal-500/10 text-teal-600 text-sm rounded-lg px-4 py-2.5 mt-4">
              {notice}
            </div>
          )}
          <form onSubmit={handleBook} className="space-y-4 mt-4">
            <div>
              <label className="label" htmlFor="doctor">
                Doctor
              </label>
              <select
                id="doctor"
                required
                className="input-field"
                value={form.doctorId}
                onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
              >
                <option value="" disabled>
                  Select a doctor
                </option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    Dr. {d.name} {d.specialty ? `— ${d.specialty}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="time">
                Date &amp; time
              </label>
              <input
                id="time"
                type="datetime-local"
                required
                className="input-field"
                value={form.appointmentTime}
                onChange={(e) => setForm({ ...form, appointmentTime: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="reason">
                Reason for visit
              </label>
              <input
                id="reason"
                className="input-field"
                placeholder="e.g. Annual checkup"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
              />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={booking}>
              {booking ? 'Booking…' : 'Confirm booking'}
            </button>
          </form>
        </section>

        <section className="lg:col-span-3 card">
          <div className="flex items-center gap-2 border-b border-pine-900/10 pb-3">
            <button
              onClick={() => setTab('appointments')}
              className={`text-sm font-semibold px-3 py-1.5 rounded-full ${
                tab === 'appointments' ? 'bg-pine-900 text-sage-50' : 'text-pine-700'
              }`}
            >
              Appointments
            </button>
            <button
              onClick={() => setTab('history')}
              className={`text-sm font-semibold px-3 py-1.5 rounded-full ${
                tab === 'history' ? 'bg-pine-900 text-sage-50' : 'text-pine-700'
              }`}
            >
              Medical history
            </button>
          </div>

          {tab === 'appointments' ? (
            <div className="mt-2">
              {appointments.length === 0 ? (
                <p className="text-sm text-pine-700 py-8 text-center">
                  Nothing booked yet — use the form to schedule your first visit.
                </p>
              ) : (
                appointments.map((a) => (
                  <AppointmentCard
                    key={a.id}
                    appointment={a}
                    personLabel={`Dr. ${a.doctor_name}`}
                    onCancel={handleCancel}
                    cancelling={cancellingId === a.id}
                  />
                ))
              )}
            </div>
          ) : (
            <div className="mt-2">
              {history.length === 0 ? (
                <p className="text-sm text-pine-700 py-8 text-center">
                  No visit records yet. These appear after a completed consultation.
                </p>
              ) : (
                history.map((r) => (
                  <div key={r.id} className="py-4 border-b border-pine-900/10 last:border-b-0">
                    <p className="font-semibold text-pine-900">
                      Dr. {r.doctor_name} — {new Date(r.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-pine-700 mt-1">
                      <span className="font-medium">Diagnosis:</span> {r.diagnosis}
                    </p>
                    {r.prescription && (
                      <p className="text-sm text-pine-700">
                        <span className="font-medium">Prescription:</span> {r.prescription}
                      </p>
                    )}
                    {r.lab_results && (
                      <p className="text-sm text-pine-700">
                        <span className="font-medium">Lab results:</span> {r.lab_results}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
