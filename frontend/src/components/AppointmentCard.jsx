import StatusBadge from './StatusBadge.jsx';

function formatDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function AppointmentCard({ appointment, personLabel, onCancel, cancelling }) {
  const canCancel = appointment.status === 'booked' && onCancel;
  return (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-pine-900/10 last:border-b-0">
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-11 h-11 rounded-full bg-teal-500/10 flex items-center justify-center flex-shrink-0">
          <span className="font-display font-semibold text-teal-600 text-sm">
            {formatDateTime(appointment.appointment_time).split(' ')[0]}
          </span>
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-pine-900 truncate">{personLabel}</p>
          <p className="text-sm text-pine-700">{formatDateTime(appointment.appointment_time)}</p>
          {appointment.reason && (
            <p className="text-xs text-pine-700/70 mt-0.5 truncate">{appointment.reason}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <StatusBadge status={appointment.status} />
        {canCancel && (
          <button className="btn-danger" disabled={cancelling} onClick={() => onCancel(appointment.id)}>
            {cancelling ? 'Cancelling…' : 'Cancel'}
          </button>
        )}
      </div>
    </div>
  );
}
