const STYLES = {
  booked: 'bg-teal-500/10 text-teal-600',
  cancelled: 'bg-red-500/10 text-red-500',
  completed: 'bg-pine-900/10 text-pine-900',
};

export default function StatusBadge({ status }) {
  return <span className={`badge ${STYLES[status] || STYLES.completed}`}>{status}</span>;
}
