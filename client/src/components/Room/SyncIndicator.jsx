import './sync-indicator.css';

const STATE_META = {
  synced: { dot: '🟢', label: 'Synced' },
  syncing: { dot: '🟡', label: 'Syncing…' },
  lost: { dot: '🔴', label: 'Connection lost' },
  reconnecting: { dot: '🔄', label: 'Reconnecting…' },
};

export default function SyncIndicator({ status, latencyMs }) {
  const meta = STATE_META[status] || STATE_META.synced;
  return (
    <span className="cad-sync-indicator" title={meta.label}>
      <span className="cad-sync-dot">{meta.dot}</span>
      {meta.label}
      {status === 'synced' && typeof latencyMs === 'number' && (
        <span className="cad-sync-latency"> · {latencyMs}ms</span>
      )}
    </span>
  );
}
