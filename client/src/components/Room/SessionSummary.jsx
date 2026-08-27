import Modal from './Modal';

/**
 * A calm, cinematic recap - not an analytics dashboard. Stats are derived
 * from what happened during this client's session (message/reaction
 * counts), which is enough for a meaningful, lightweight summary without
 * needing a dedicated analytics pipeline.
 */
export default function SessionSummary({ stats, onClose }) {
  return (
    <Modal title="Session Complete" onClose={onClose}>
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <p style={{ fontFamily: 'var(--cad-font-display)', fontSize: 24, margin: 0, color: 'var(--cad-gold)' }}>
          {stats.videoTitle || 'This session'}
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          <SummaryStat label="Duration" value={stats.duration} />
          <SummaryStat label="Viewers" value={stats.viewerCount} />
          <SummaryStat label="Reactions" value={stats.reactionCount} />
          <SummaryStat label="Messages" value={stats.messageCount} />
        </div>

        {stats.mostActive && (
          <p style={{ fontSize: 13, color: 'var(--cad-text-dim)', margin: 0 }}>
            Most active: <strong style={{ color: 'var(--cad-text)' }}>{stats.mostActive}</strong>
          </p>
        )}
      </div>
    </Modal>
  );
}

function SummaryStat({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--cad-text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
    </div>
  );
}
