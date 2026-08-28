import { useCallback, useEffect, useRef, useState } from 'react';
import { LogOut, Maximize2, Minimize2, Share2, Users } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { getRoom, leaveRoom } from '../api/rooms';
import Logo from '../components/Logo/Logo';
import VideoPlayer from '../components/Room/VideoPlayer';
import { ReactionBar, ReactionOverlay } from '../components/Room/ReactionBar';
import Queue from '../components/Room/Queue';
import Chat from '../components/Room/Chat';
import ParticipantList from '../components/Room/ParticipantList';
import SyncIndicator from '../components/Room/SyncIndicator';
import InviteModal from '../components/Room/InviteModal';
import SessionSummary from '../components/Room/SessionSummary';
import AudioRoom from '../components/Room/AudioRoom';
import './room.css';

const ROOM_THEMES = [
  ['midnight-cinema', 'Midnight Cinema'],
  ['aurora', 'Aurora'],
  ['sunset', 'Sunset'],
  ['ocean', 'Ocean'],
  ['minimal', 'Minimal'],
  ['light', 'Light'],
];

export default function RoomPage() {
  const { roomCode } = useParams();
  const { user } = useAuth();
  const { socket, connected } = useSocket();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [queue, setQueue] = useState([]);
  const [messages, setMessages] = useState([]);
  const [typingNames, setTypingNames] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [playbackState, setPlaybackState] = useState('paused');
  const [playbackTime, setPlaybackTime] = useState(0);
  const [poll, setPoll] = useState(null);
  const [incomingReaction, setIncomingReaction] = useState(null);
  const [messageReactions, setMessageReactions] = useState({});
  const [cinemaMode, setCinemaMode] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [hostDisconnected, setHostDisconnected] = useState(false);
  const [syncStatus, setSyncStatus] = useState('syncing');
  const [leaving, setLeaving] = useState(false);

  const playerHandle = useRef(null);
  const isApplyingRemote = useRef(false);
  const statsRef = useRef({ reactionCount: 0, messageCount: 0 });

  const me = participants.find((p) => p.userId === user?.id);
  const canControl = me?.role === 'host' || me?.role === 'moderator';
  const isHost = me?.role === 'host';

  useEffect(() => {
    let cancelled = false;
    getRoom(roomCode)
      .then(({ room: data }) => {
        if (cancelled) return;
        setRoom(data);
        setQueue(data.queue || []);
        setCurrentVideo(data.currentVideo?.videoId ? data.currentVideo : null);
        setPlaybackState(data.playbackState || 'paused');
        setPlaybackTime(data.currentTime || 0);
        setParticipants((data.participants || []).map((p) => ({
          userId: p.user?._id || p.user,
          name: p.user?.name || 'Participant',
          avatarUrl: p.user?.avatarUrl,
          role: p.role,
        })));
      })
      .catch(() => setNotFound(true));
    return () => { cancelled = true; };
  }, [roomCode]);

  useEffect(() => {
    if (!socket || !connected) return;
    setSyncStatus('syncing');

    socket.emit('join_room', { roomCode }, (res) => {
      if (res?.error) { setNotFound(true); return; }
      setRoom(res.room);
      setQueue(res.room.queue || []);
      setParticipants(res.participants || []);
      setCurrentVideo(res.room.currentVideo?.videoId ? res.room.currentVideo : null);
      setPlaybackState(res.playback?.state || res.room.playbackState || 'paused');
      setPlaybackTime(res.playback?.time || res.room.currentTime || 0);
      setHostDisconnected(Boolean(res.hostConnected === false));
      setSyncStatus('synced');
    });

    const on = (event, handler) => socket.on(event, handler);

    on('user_joined', ({ socketId, userId, name, role }) => {
      setParticipants((prev) => prev.some((p) => p.userId === userId) ? prev : [...prev, { socketId, userId, name, role }]);
      setMessages((prev) => [...prev, { id: `system-join-${userId}-${Date.now()}`, system: true, text: `${name} joined the room.` }]);
    });

    on('user_left', ({ userId, name, wasHost }) => {
      setParticipants((prev) => {
        const leaving = prev.find((p) => p.userId === userId);
        if (leaving) setMessages((items) => [...items, { id: `system-left-${userId}-${Date.now()}`, system: true, text: `${leaving.name} left the room.` }]);
        return prev.filter((p) => p.userId !== userId);
      });
      if (wasHost) {
        setHostDisconnected(true);
        setMessages((prev) => [...prev, { id: `system-host-${Date.now()}`, system: true, text: 'Host disconnected. The room continues normally.' }]);
      }
    });

    const applyRemote = (fn) => {
      isApplyingRemote.current = true;
      fn();
      window.setTimeout(() => { isApplyingRemote.current = false; }, 600);
    };

    on('play', ({ time }) => {
      setPlaybackState('playing');
      setPlaybackTime(time);
      applyRemote(() => { playerHandle.current?.seekTo(time); playerHandle.current?.play(); });
    });
    on('pause', ({ time }) => {
      setPlaybackState('paused');
      setPlaybackTime(time);
      applyRemote(() => { playerHandle.current?.seekTo(time); playerHandle.current?.pause(); });
    });
    on('seek', ({ time }) => {
      setPlaybackTime(time);
      applyRemote(() => playerHandle.current?.seekTo(time));
    });
    on('change_video', (video) => {
      setCurrentVideo(video);
      setPlaybackState('playing');
      setPlaybackTime(0);
      setSyncStatus('syncing');
    });

    on('queue_updated', ({ queue: nextQueue }) => setQueue(nextQueue));
    on('reaction', (payload) => {
      statsRef.current.reactionCount += 1;
      setIncomingReaction({ emoji: payload.emoji, id: `${payload.userId}-${payload.at}` });
    });
    on('message', (msg) => {
      statsRef.current.messageCount += 1;
      setMessages((prev) => [...prev, msg]);
    });
    on('message_reaction', ({ messageId, emoji }) => {
      setMessageReactions((prev) => ({
        ...prev,
        [messageId]: { ...(prev[messageId] || {}), [emoji]: (prev[messageId]?.[emoji] || 0) + 1 },
      }));
    });
    on('typing', ({ name, isTyping }) => {
      setTypingNames((prev) => {
        const without = prev.filter((n) => n !== name);
        return isTyping ? [...without, name] : without;
      });
    });
    on('role_assigned', ({ userId, role }) => setParticipants((prev) => prev.map((p) => p.userId === userId ? { ...p, role } : p)));
    on('participant_removed', () => navigate('/home'));
    on('poll_created', (p) => setPoll(p));
    on('poll_updated', (p) => setPoll(p));
    on('theme_changed', ({ theme }) => setRoom((prev) => prev ? { ...prev, theme } : prev));

    return () => {
      ['user_joined', 'user_left', 'play', 'pause', 'seek', 'change_video', 'queue_updated', 'reaction', 'message', 'message_reaction', 'typing', 'role_assigned', 'participant_removed', 'poll_created', 'poll_updated', 'theme_changed'].forEach((event) => socket.off(event));
      socket.emit('leave_room');
    };
  }, [socket, connected, roomCode, navigate]);

  useEffect(() => {
    if (!socket || !connected) return;
    const interval = setInterval(() => {
      const time = playerHandle.current?.getCurrentTime?.();
      if (typeof time === 'number') socket.emit('report_time', { time, state: playbackState });
    }, 1000);
    return () => clearInterval(interval);
  }, [socket, connected, playbackState]);

  const handleLocalStateChange = useCallback((type, time) => {
    if (isApplyingRemote.current) { isApplyingRemote.current = false; return; }
    setPlaybackState(type === 'play' ? 'playing' : 'paused');
    setPlaybackTime(time);
    socket?.emit(type, { time });
  }, [socket]);

  const handleReact = useCallback((emoji) => {
    const time = playerHandle.current?.getCurrentTime?.() ?? 0;
    socket?.emit('react', { emoji, videoTime: time });
  }, [socket]);

  const handleSeek = useCallback((time) => {
    setPlaybackTime(time);
    socket?.emit('seek', { time });
  }, [socket]);

  const handleLeave = async () => {
    if (leaving) return;
    setLeaving(true);
    try { await leaveRoom(roomCode); } catch { }
    socket?.emit('leave_room');
    navigate('/home');
  };

  if (notFound) return <div className="cad-room-error"><Logo size={30} /><p>Room not found</p><button className="cad-btn cad-btn-primary" onClick={() => navigate('/home')}>Back home</button></div>;
  if (!room) return <div className="cad-room-loading"><Logo size={30} /><span>Opening room…</span></div>;

  return (
    <div className={`cad-room${cinemaMode ? ' cinema' : ''}`} data-theme={room.theme}>
      <header className="cad-room-header">
        <div className="cad-room-brand"><Logo size={22} /><span className="cad-room-code">#{room.roomCode}</span></div>
        <div className="cad-room-header-right">
          <SyncIndicator status={syncStatus} />
          <span className="cad-room-count"><Users size={14} /> {participants.length} watching</span>
          <button
            className="cad-cinema-toggle-header"
            onClick={() => setCinemaMode((c) => !c)}
            title={cinemaMode ? 'Exit cinema mode' : 'Enter cinema mode'}
            aria-label={cinemaMode ? 'Exit cinema mode' : 'Enter cinema mode'}
          >
            {cinemaMode ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
          <button className="cad-btn cad-btn-ghost cad-room-invite-btn" onClick={() => setShowInvite(true)}><Share2 size={13} /> Invite</button>
          <button className="cad-room-leave" onClick={handleLeave} disabled={leaving}><LogOut size={14} /> {leaving ? 'Leaving…' : 'Leave'}</button>
        </div>
      </header>

      {hostDisconnected && <div className="cad-room-banner">Host disconnected · playback and the room continue normally.</div>}

      <div className="cad-room-body">
        {!cinemaMode && (
          <aside className="cad-room-people cad-card">
            <ParticipantList
              participants={participants}
              myUserId={user.id}
              isHost={isHost}
              hostConnected={!hostDisconnected}
              onAssignRole={(userId, role) => socket?.emit('assign_role', { userId, role })}
              onRemove={(userId) => socket?.emit('remove_participant', { userId })}
            />
            <AudioRoom socket={socket} userId={user.id} participants={participants} canControl={canControl} />
          </aside>
        )}

        <main className="cad-room-video-col">
          <div className="cad-room-title-row">
            <div><span className="cad-room-live-dot" /> LIVE ROOM<h1>{room.name}</h1></div>
            <div className="cad-video-actions">
              {canControl && (
                <select
                  className="cad-theme-select"
                  value={room.theme || 'midnight-cinema'}
                  onChange={(event) => socket?.emit('change_theme', { theme: event.target.value })}
                  aria-label="Room theme"
                >
                  {ROOM_THEMES.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                </select>
              )}
            </div>
          </div>

          <div className="cad-video-stage">
            <VideoPlayer
              videoId={currentVideo?.videoId}
              canControl={canControl}
              playbackState={playbackState}
              startTime={playbackTime}
              onLocalStateChange={handleLocalStateChange}
              onSeek={handleSeek}
              onEnded={() => socket?.emit('video_ended')}
              applyRef={playerHandle}
            />
            <ReactionOverlay incoming={incomingReaction} />
          </div>

          {currentVideo?.title && <p className="cad-current-video-title">{currentVideo.title}</p>}
          <ReactionBar onReact={handleReact} />

          <section className="cad-queue-card cad-card">
            <div className="cad-section-label">UP NEXT</div>
            <Queue
              queue={queue}
              myUserId={user.id}
              canManage={canControl}
              onAdd={(video) => socket?.emit('add_to_queue', video)}
              onPlay={(video) => socket?.emit('play_queue_item', video)}
              onRemove={(itemId) => socket?.emit('remove_from_queue', { itemId })}
              onVote={(itemId) => socket?.emit('vote_queue_item', { itemId })}
            />
          </section>
        </main>

        {!cinemaMode && (
          <aside className="cad-room-chat cad-card">
            <Chat
              messages={messages}
              myUserId={user.id}
              typingUsers={typingNames}
              poll={poll}
              canCreatePoll={canControl}
              messageReactions={messageReactions}
              currentVideoId={currentVideo?.videoId}
              getCurrentTime={() => playerHandle.current?.getCurrentTime?.() || playbackTime}
              onSeek={(time) => { playerHandle.current?.seekTo(time); handleSeek(time); }}
              onSend={(text, replyTo, videoId, videoTime) => socket?.emit('send_message', { text, replyTo, videoId, videoTime })}
              onReactMessage={(messageId, emoji) => socket?.emit('react_message', { messageId, emoji })}
              onCreatePoll={({ question, options }) => socket?.emit('create_poll', { question, options })}
              onVotePoll={(optionIndex) => socket?.emit('vote_poll', { optionIndex })}
            />
          </aside>
        )}
      </div>

      {showInvite && <InviteModal room={room} inviterName={user.name} onClose={() => setShowInvite(false)} />}
      {showSummary && <SessionSummary stats={{ videoTitle: currentVideo?.title, duration: '—', viewerCount: participants.length, reactionCount: statsRef.current.reactionCount, messageCount: statsRef.current.messageCount }} onClose={() => setShowSummary(false)} />}
    </div>
  );
}
