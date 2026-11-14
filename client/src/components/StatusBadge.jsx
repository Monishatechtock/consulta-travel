export default function StatusBadge({ status }) {
  const isSubmitted = status === 'Submitted';
  return (
    <span className={`badge ${isSubmitted ? 'badge-success' : 'badge-pending'}`}>
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: 'currentColor',
          display: 'inline-block',
        }}
      />
      {status || 'Pending'}
    </span>
  );
}
