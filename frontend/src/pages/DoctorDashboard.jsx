import { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import AppointmentCard from '../components/AppointmentCard.jsx';

export default function DoctorDashboard() {
  const { token, user } = useAuth();
  const [schedule, setSchedule] = useState([]);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState('');
  const [noteFor, setNoteFor] = useState(null);
  const [note, setNote] = useState({ diagnosis: '', prescription: '', labResults: '' });
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState('');

  const loadSchedule = async (d) => {
    try {
      const data = await api.doctorSchedule(token, d);
      setSchedule(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadSchedule(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const openNoteForm = (appt) => {
    setNoteFor(appt);
    setNote({ diagnosis: '', prescription: '', labResults: '' });
    setSavedNotice('');
  };

  const handleSaveNote = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.addMedicalRecord(
        {
          patientId: noteFor.patient_id,
          appointmentId: noteFor.id,
          diagnosis: note.diagnosis,
          prescription: note.prescription,
          labResults: note.labResults,
        },
        token
      );
      setSavedNotice('Clinical note saved to patient record.');
      setNoteFor(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-pine-900">
            Dr. {user.name.split(' ').slice(-1)[0]}'s schedule
          </h1>
          <p className="text-pine-700 text-sm mt-1">
            {schedule.length === 0 ? 'No appointments for this day.' : `${schedule.length} patient${schedule.length > 1 ? 's' : ''} today.`}
          </p>
        </div>
        <div>
          <label className="label" htmlFor="date">
            Date
          </label>
          <input
            id="date"
            type="date"
            className="input-field"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-2.5 mt-4">{error}</div>
      )}
      {savedNotice && (
        <div className="bg-teal-500/10 text-teal-600 text-sm rounded-lg px-4 py-2.5 mt-4">
          {savedNotice}
        </div>
      )}

      <div className="card mt-6">
        {schedule.length === 0 ? (
          <p className="text-sm text-pine-700 py-8 text-center">Nothing scheduled for this day.</p>
        ) : (
          schedule.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-4 py-4 border-b border-pine-900/10 last:border-b-0">
              <AppointmentCard appointment={a} personLabel={a.patient_name} />
              <button className="btn-secondary !py-2 !px-4 text-sm flex-shrink-0" onClick={() => openNoteForm(a)}>
                Add note
              </button>
            </div>
          ))
        )}
      </div>

      {noteFor && (
        <div className="fixed inset-0 bg-pine-950/40 flex items-center justify-center p-6 z-30">
          <form onSubmit={handleSaveNote} className="card w-full max-w-md space-y-4">
            <h2 className="font-display font-semibold text-pine-900">
              Clinical note — {noteFor.patient_name}
            </h2>
            <div>
              <label className="label" htmlFor="diagnosis">
                Diagnosis
              </label>
              <textarea
                id="diagnosis"
                required
                className="input-field"
                rows={2}
                value={note.diagnosis}
                onChange={(e) => setNote({ ...note, diagnosis: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="prescription">
                Prescription
              </label>
              <textarea
                id="prescription"
                className="input-field"
                rows={2}
                value={note.prescription}
                onChange={(e) => setNote({ ...note, prescription: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="lab">
                Lab results
              </label>
              <textarea
                id="lab"
                className="input-field"
                rows={2}
                value={note.labResults}
                onChange={(e) => setNote({ ...note, labResults: e.target.value })}
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary flex-1" disabled={saving}>
                {saving ? 'Saving…' : 'Save note'}
              </button>
              <button type="button" className="btn-secondary flex-1" onClick={() => setNoteFor(null)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
