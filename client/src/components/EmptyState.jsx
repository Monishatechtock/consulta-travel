import { IconInbox } from './Icons';

export default function EmptyState({
  title = 'No records found',
  message = 'Try adjusting your search or filters.',
  action,
}) {
  return (
    <div className="empty-state">
      <div className="icon-wrap">
        <IconInbox />
      </div>
      <h3>{title}</h3>
      <p>{message}</p>
      {action ? <div style={{ marginTop: '1.25rem' }}>{action}</div> : null}
    </div>
  );
}
