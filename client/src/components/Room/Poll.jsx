import './poll.css';

export default function Poll({ poll, myUserId, onVote, compact = false }) {
  if (!poll) return null;
  const totalVotes = poll.options.reduce((sum, o) => sum + o.votes.length, 0);

  return (
    <div className={`cad-poll${compact ? ' compact' : ''}`}>
      <p className="cad-poll-question">{poll.question}</p>
      {poll.options.map((opt, i) => {
        const pct = totalVotes ? Math.round((opt.votes.length / totalVotes) * 100) : 0;
        const voted = opt.votes.includes(myUserId);
        return (
          <button type="button" key={i} className={`cad-poll-option${voted ? ' voted' : ''}`} onClick={() => onVote(i)}>
            <span className="cad-poll-option-fill" style={{ width: `${pct}%` }} />
            <span className="cad-poll-option-label">{opt.text}</span>
            <span className="cad-poll-option-pct">{pct}%</span>
          </button>
        );
      })}
      <span className="cad-poll-votes">{totalVotes} vote{totalVotes === 1 ? '' : 's'}</span>
    </div>
  );
}
