import { Crown, Eye, Sliders, Users, X } from 'lucide-react';
import './sidebar.css';

const ROLE_META = {
  host: { icon: Crown, label: 'Host' },
  moderator: { icon: Sliders, label: 'Moderator' },
  participant: { icon: Eye, label: 'Participant' },
};

export default function ParticipantList({ participants, myUserId, isHost, hostConnected = true, onAssignRole, onRemove }) {
  const ordered = [...participants].sort((a, b) => ({ host: 0, moderator: 1, participant: 2 }[a.role] ?? 3) - ({ host: 0, moderator: 1, participant: 2 }[b.role] ?? 3));

  return (
    <div className="cad-sidebar-panel cad-people-panel">
      <div className="cad-people-head">
        <div><strong>{participants.length} watching</strong><span>Live in this room</span></div>
        <Users size={16} />
      </div>
      {!hostConnected && <div className="cad-host-status">Host disconnected · room continues normally</div>}

      {ordered.length === 0 ? (
        <div className="cad-empty"><Users size={22} /><p>Invite your friends.</p></div>
      ) : (
        <ul className="cad-participant-list cad-scroll">
          {ordered.map((p) => {
            const meta = ROLE_META[p.role] || ROLE_META.participant;
            const Icon = meta.icon;
            return (
              <li key={p.userId} className={`cad-participant-item${p.role === 'host' ? ' host' : ''}`}>
                <span className="cad-avatar cad-avatar-initials" style={{ width: 30, height: 30, fontSize: 11 }}>{p.name.slice(0, 2).toUpperCase()}</span>
                <div className="cad-participant-info">
                  <span className="cad-participant-name">{p.name}{p.userId === myUserId ? ' (you)' : ''}</span>
                  <span className={`cad-participant-role role-${p.role}`}><Icon size={11} /> {meta.label}</span>
                </div>
                {isHost && p.userId !== myUserId && (
                  <div className="cad-participant-actions">
                    <button className="cad-participant-action-btn" onClick={() => onAssignRole(p.userId, p.role === 'moderator' ? 'participant' : 'moderator')} title={p.role === 'moderator' ? 'Revoke moderator' : 'Make moderator'}><Sliders size={13} /></button>
                    <button className="cad-participant-action-btn danger" onClick={() => onRemove(p.userId)} title="Remove"><X size={13} /></button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
