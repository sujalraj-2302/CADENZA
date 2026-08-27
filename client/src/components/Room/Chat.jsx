import { useEffect, useMemo, useRef, useState } from 'react';
import { BarChart3, Clock3, CornerUpLeft, MessageCircle, Reply, Send, SmilePlus, X } from 'lucide-react';
import Poll from './Poll';
import PollComposer from './PollComposer';
import './sidebar.css';

const MESSAGE_EMOJIS = ['❤️', '😂', '🔥', '👏', '😱'];

export default function Chat({
  messages,
  myUserId,
  onSend,
  typingUsers = [],
  poll,
  canCreatePoll,
  onCreatePoll,
  onVotePoll,
  messageReactions = {},
  onReactMessage,
  currentVideoId,
  getCurrentTime,
  onSeek,
}) {
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [showComposer, setShowComposer] = useState(false);
  const [commentAtTime, setCommentAtTime] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const activePoll = useMemo(() => poll || null, [poll]);

  function handleSubmit(e) {
    e.preventDefault();
    const clean = text.trim();
    if (!clean) return;
    const videoTime = commentAtTime && currentVideoId ? getCurrentTime?.() : null;
    onSend(clean, replyTo ? { id: replyTo.id, name: replyTo.name, text: replyTo.text } : null, commentAtTime ? currentVideoId : null, videoTime);
    setText('');
    setReplyTo(null);
  }

  return (
    <div className="cad-sidebar-panel cad-chat">
      <div className="cad-chat-head">
        <div>
          <strong>Live chat</strong>
          <span>{messages.length} messages</span>
        </div>
        {canCreatePoll && (
          <button className="cad-chat-poll-btn" onClick={() => setShowComposer((v) => !v)} title="Create poll">
            <BarChart3 size={15} /> Poll
          </button>
        )}
      </div>

      {activePoll && (
        <div className="cad-pinned-poll">
          <div className="cad-pinned-label"><span>PINNED</span><BarChart3 size={12} /></div>
          <Poll poll={activePoll} myUserId={myUserId} onVote={onVotePoll} compact />
        </div>
      )}

      {showComposer && canCreatePoll && (
        <PollComposer
          onCancel={() => setShowComposer(false)}
          onCreate={(payload) => { onCreatePoll(payload); setShowComposer(false); }}
        />
      )}

      {messages.length === 0 ? (
        <div className="cad-empty" style={{ flex: 1 }}>
          <MessageCircle size={22} />
          <p>Start the conversation.</p>
        </div>
      ) : (
        <ul className="cad-chat-list cad-scroll" ref={listRef}>
          {messages.map((m) => {
            const reactions = messageReactions[m.id] || {};
            return (
              <li key={m.id} className={`cad-chat-msg${m.userId === myUserId ? ' mine' : ''}`}>
                {m.system ? (
                  <span className="cad-chat-system"><UsersIcon /> {m.text}</span>
                ) : (
                  <>
                    <span className="cad-chat-author">{m.name}{m.userId === myUserId ? ' · you' : ''}</span>
                    {m.replyTo && (
                      <button className="cad-chat-replied" onClick={() => {
                        const target = document.getElementById(`cad-message-${m.replyTo.id}`);
                        target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}>
                        <CornerUpLeft size={11} /> {m.replyTo.name}: {m.replyTo.text}
                      </button>
                    )}
                    <span id={`cad-message-${m.id}`} className="cad-chat-text">{m.text}</span>
                    {m.videoId && typeof m.videoTime === 'number' && (
                      <button className="cad-chat-timestamp" type="button" onClick={() => onSeek?.(m.videoTime)}>
                        {formatTime(m.videoTime)}
                      </button>
                    )}
                    <div className="cad-chat-message-actions">
                      <button onClick={() => setReplyTo(m)} title="Reply"><Reply size={12} /></button>
                      <div className="cad-chat-react-wrap">
                        <button title="React"><SmilePlus size={12} /></button>
                        <div className="cad-chat-react-menu">
                          {MESSAGE_EMOJIS.map((emoji) => (
                            <button key={emoji} onClick={() => onReactMessage(m.id, emoji)}>{emoji}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                    {Object.keys(reactions).length > 0 && (
                      <div className="cad-chat-reactions">
                        {Object.entries(reactions).map(([emoji, count]) => <span key={emoji}>{emoji} {count}</span>)}
                      </div>
                    )}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {typingUsers.length > 0 && <p className="cad-chat-typing">{typingUsers.join(', ')} typing…</p>}

      {replyTo && (
        <div className="cad-chat-replying">
          <div><CornerUpLeft size={13} /><span>Replying to <strong>{replyTo.name}</strong>: {replyTo.text}</span></div>
          <button onClick={() => setReplyTo(null)} aria-label="Cancel reply"><X size={14} /></button>
        </div>
      )}

      <form className="cad-chat-input-row" onSubmit={handleSubmit}>
        <input
          className="cad-input"
          placeholder="Say something…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={500}
        />
        <button className={`cad-chat-timestamp-toggle${commentAtTime ? ' active' : ''}`} type="button" onClick={() => setCommentAtTime((value) => !value)} title={commentAtTime ? 'Remove video timestamp' : 'Comment at current video time'} aria-label={commentAtTime ? 'Remove video timestamp' : 'Comment at current video time'}>
          <Clock3 size={14} />
        </button>
        <button className="cad-btn cad-btn-primary cad-chat-send" type="submit" aria-label="Send message"><Send size={15} /></button>
      </form>
    </div>
  );
}

function UsersIcon() { return <span aria-hidden="true">•</span>; }

function formatTime(seconds) {
  const value = Math.max(0, Math.floor(seconds));
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
}
