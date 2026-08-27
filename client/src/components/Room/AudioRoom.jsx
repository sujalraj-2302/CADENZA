import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import './audio-room.css';

const RTC_CONFIG = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

export default function AudioRoom({ socket, userId, participants, canControl }) {
  const [enabled, setEnabled] = useState(false);
  const [muted, setMuted] = useState(false);
  const [speakers, setSpeakers] = useState({});
  const streamRef = useRef(null);
  const peersRef = useRef(new Map());
  const audioHostRef = useRef(null);

  useEffect(() => {
    if (!socket) return undefined;
    const sendOffer = async (target) => {
      if (!streamRef.current || peersRef.current.has(target)) return;
      const peer = createPeer(target);
      peersRef.current.set(target, peer);
      streamRef.current.getTracks().forEach((track) => peer.addTrack(track, streamRef.current));
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      socket.emit('audio_offer', { to: target, offer });
    };
    const onOffer = async ({ from, offer }) => {
      if (!streamRef.current) return;
      const peer = peersRef.current.get(from) || createPeer(from);
      peersRef.current.set(from, peer);
      if (!peer.getSenders().length) streamRef.current.getTracks().forEach((track) => peer.addTrack(track, streamRef.current));
      await peer.setRemoteDescription(offer);
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socket.emit('audio_answer', { to: from, answer });
    };
    const onAnswer = ({ from, answer }) => peersRef.current.get(from)?.setRemoteDescription(answer);
    const onIce = ({ from, candidate }) => peersRef.current.get(from)?.addIceCandidate(candidate);
    const onMute = ({ muted: nextMuted }) => {
      setMuted(nextMuted);
      streamRef.current?.getAudioTracks().forEach((track) => { track.enabled = !nextMuted; });
    };
    const onState = ({ socketId, enabled: active }) => setSpeakers((prev) => ({ ...prev, [socketId]: active }));
    socket.on('audio_offer', onOffer);
    socket.on('audio_answer', onAnswer);
    socket.on('audio_ice', onIce);
    socket.on('audio_mute', onMute);
    socket.on('audio_state', onState);
    return () => {
      socket.off('audio_offer', onOffer); socket.off('audio_answer', onAnswer); socket.off('audio_ice', onIce);
      socket.off('audio_mute', onMute); socket.off('audio_state', onState);
    };

    function createPeer(target) {
      const peer = new RTCPeerConnection(RTC_CONFIG);
      peer.onicecandidate = ({ candidate }) => candidate && socket.emit('audio_ice', { to: target, candidate });
      peer.ontrack = ({ streams }) => {
        const audio = document.createElement('audio');
        audio.autoplay = true;
        audio.srcObject = streams[0];
        audio.dataset.peer = target;
        audioHostRef.current?.appendChild(audio);
      };
      peer.onconnectionstatechange = () => {
        if (['failed', 'closed', 'disconnected'].includes(peer.connectionState)) peersRef.current.delete(target);
      };
      return peer;
    }
  }, [socket]);

  useEffect(() => {
    if (!enabled || !socket) return;
    participants.filter((participant) => participant.socketId && participant.socketId !== socket.id).forEach((participant) => {
      if (!peersRef.current.has(participant.socketId) && streamRef.current) {
        const peer = new RTCPeerConnection(RTC_CONFIG);
        peersRef.current.set(participant.socketId, peer);
        streamRef.current.getTracks().forEach((track) => peer.addTrack(track, streamRef.current));
        peer.onicecandidate = ({ candidate }) => candidate && socket.emit('audio_ice', { to: participant.socketId, candidate });
        peer.createOffer().then((offer) => peer.setLocalDescription(offer)).then(() => socket.emit('audio_offer', { to: participant.socketId, offer: peersRef.current.get(participant.socketId).localDescription }));
      }
    });
  }, [enabled, participants, socket]);

  async function toggleMic() {
    if (enabled) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      peersRef.current.forEach((peer) => peer.close());
      peersRef.current.clear();
      streamRef.current = null;
      setEnabled(false); setSpeakers({});
      socket.emit('audio_state', { enabled: false });
      return;
    }
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      setEnabled(true); setMuted(false);
      socket.emit('audio_state', { enabled: true });
    } catch { setEnabled(false); }
  }

  function muteParticipant(socketId, nextMuted) {
    socket.emit('audio_mute', { socketId, muted: nextMuted });
  }

  return (
    <section className="cad-audio-room">
      <div className="cad-audio-title"><Volume2 size={14} /> Room audio</div>
      <button className={`cad-audio-mic${enabled ? ' active' : ''}`} type="button" onClick={toggleMic}>
        {muted || !enabled ? <MicOff size={15} /> : <Mic size={15} />}
        {muted ? 'Muted' : enabled ? 'Live mic' : 'Join audio'}
      </button>
      {Object.entries(speakers).filter(([, active]) => active).map(([socketId]) => {
        const participant = participants.find((item) => item.socketId === socketId);
        return participant ? <div className="cad-audio-speaker" key={socketId}><Mic size={12} /> {participant.name}{canControl && <button type="button" onClick={() => muteParticipant(socketId, true)}>Mute</button>}</div> : null;
      })}
      <div ref={audioHostRef} className="cad-audio-elements" />
      <span className="cad-audio-note">Microphone is off until you join audio.</span>
    </section>
  );
}
