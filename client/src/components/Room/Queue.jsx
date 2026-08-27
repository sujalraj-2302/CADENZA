import { ListMusic, Play, Plus, ThumbsUp, X } from 'lucide-react';
import { useState } from 'react';
import { extractYouTubeId } from '../../utils/youtube';
import './sidebar.css';

function buildVideo(videoId) {
  return {
    videoId,
    title: `YouTube video · ${videoId}`,
    thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    duration: null,
  };
}

export default function Queue({ queue, myUserId, canManage, onAdd, onRemove, onVote, onPlay }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  function handleAdd(e) {
    e.preventDefault();
    const id = extractYouTubeId(input);
    if (!id) {
      setError('Paste a valid YouTube link or 11-character video ID.');
      return;
    }

    setError('');
    onAdd(buildVideo(id));
    setInput('');
  }

  const sorted = [...queue].sort((a, b) => b.votes.length - a.votes.length);

  return (
    <div className="cad-sidebar-panel">
      <form className="cad-queue-add" onSubmit={handleAdd}>
        <input
          className="cad-input"
          placeholder="Paste a YouTube link…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button className="cad-btn cad-btn-primary cad-queue-add-btn" type="submit" aria-label="Add to queue">
          <Plus size={16} />
        </button>
      </form>

      {error && <p className="cad-error-text">{error}</p>}

      {sorted.length === 0 ? (
        <div className="cad-empty">
          <ListMusic size={22} />
          <p>Nothing queued yet.<br />Add something to watch.</p>
        </div>
      ) : (
        <ul className="cad-queue-list cad-scroll">
          {sorted.map((item, i) => {
            const voted = item.votes.includes(myUserId);
            return (
              <li key={item._id} className="cad-queue-item">
                <img
                  src={item.thumbnail || `https://i.ytimg.com/vi/${item.videoId}/default.jpg`}
                  alt=""
                  onError={(e) => {
                    e.currentTarget.src = `https://i.ytimg.com/vi/${item.videoId}/default.jpg`;
                  }}
                />
                <div className="cad-queue-item-info">
                  <span className="cad-queue-item-title">{item.title || `#${i + 1} queued video`}</span>
                  <span className="cad-queue-item-meta">Added by {item.addedByName}</span>
                </div>
                <button className={`cad-queue-vote${voted ? ' active' : ''}`} onClick={() => onVote(item._id)} aria-label="Vote">
                  <ThumbsUp size={13} /> {item.votes.length}
                </button>
                {canManage && (
                  <button className="cad-queue-play" onClick={() => onPlay(item)} aria-label={`Play ${item.title || 'video'}`} title="Play now">
                    <Play size={13} />
                  </button>
                )}
                {canManage && <button className="cad-queue-remove" onClick={() => onRemove(item._id)} aria-label="Remove from queue"><X size={14} /></button>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
