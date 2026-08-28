import { AlertTriangle, LoaderCircle, Maximize2, Minimize2, RotateCcw, SkipBack, SkipForward } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import useYouTubePlayer from '../../hooks/useYouTubePlayer';
import './video-player.css';

const YT_PLAYING = 1;
const YT_PAUSED = 2;
const YT_ENDED = 0;
const YT_CUED = 5;

export default function VideoPlayer({ videoId, canControl, playbackState = 'paused', startTime = 0, onLocalStateChange, onSeek, onEnded, applyRef }) {
  const containerId = useRef(`cad-yt-player-${Math.random().toString(36).slice(2)}`).current;
  const lastEmittedState = useRef(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const wrapRef = useRef(null);

  const player = useYouTubePlayer(containerId, {
    onReady: () => setStatus('ready'),
    onError: (code) => {
      const messages = {
        2: 'YouTube rejected the video ID. Check the link and try again.',
        5: 'YouTube could not play this video in the embedded player.',
        100: 'This video is unavailable.',
        101: 'This video does not allow playback on CADENZA.',
        150: 'This video does not allow playback on CADENZA.',
        153: 'YouTube could not verify the embedded player request. Refresh the room and try again.',
      };
      setStatus('error');
      setError(messages[code] || `YouTube player error (${code}).`);
    },
    onStateChange: (state) => {
      if (state === YT_PLAYING) setStatus('playing');
      if (state === YT_PAUSED) setStatus('paused');
      if (state === YT_CUED) setStatus('ready');
      if (state === YT_ENDED) {
        setStatus('ended');
        if (canControl) onEnded?.();
      }
      if (!canControl) return;
      if (state === YT_PLAYING && lastEmittedState.current !== 'playing') {
        lastEmittedState.current = 'playing';
        onLocalStateChange('play', player.getCurrentTime());
      } else if (state === YT_PAUSED && lastEmittedState.current !== 'paused') {
        lastEmittedState.current = 'paused';
        onLocalStateChange('pause', player.getCurrentTime());
      }
    },
  });

  useEffect(() => {
    if (applyRef) applyRef.current = player;
    return () => { if (applyRef?.current === player) applyRef.current = null; };
  }, [player, applyRef]);

  useEffect(() => {
    if (player.apiError) { setStatus('error'); setError(player.apiError); }
  }, [player.apiError]);

  useEffect(() => {
    if (!player.ready || !videoId) {
      if (!videoId) setStatus('idle');
      return;
    }
    setError('');
    setStatus('loading');
    lastEmittedState.current = playbackState;
    player.loadVideo(videoId, Math.max(0, Number(startTime) || 0));
    setStatus(playbackState === 'playing' ? 'playing' : 'ready');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player.ready, videoId]);

  useEffect(() => {
    if (!player.ready || !videoId) return;
    if (playbackState === 'playing') {
      player.play();
      setStatus('playing');
    } else {
      player.pause();
      setStatus('paused');
    }
  }, [player.ready, playbackState, videoId, player]);

  useEffect(() => {
    if (!player.ready || !videoId) return;
    const time = Math.max(0, Number(startTime) || 0);
    player.seekTo(time);
    if (playbackState === 'playing') player.play();
  }, [player.ready, videoId, startTime, playbackState, player]);

  useEffect(() => {
    const updateFullscreenState = () => setIsFullscreen(document.fullscreenElement === wrapRef.current);
    document.addEventListener('fullscreenchange', updateFullscreenState);
    return () => document.removeEventListener('fullscreenchange', updateFullscreenState);
  }, []);

  async function toggleFullscreen() {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await wrapRef.current?.requestFullscreen();
    }
  }

  function skip(seconds) {
    const time = Math.max(0, player.getCurrentTime() + seconds);
    player.seekTo(time);
    onSeek?.(time);
  }

  function retry() {
    setError('');
    player.loadVideo(videoId, Math.max(0, Number(startTime) || 0));
    setStatus(playbackState === 'playing' ? 'playing' : 'ready');
  }

  return (
    <div className="cad-video-wrap" ref={wrapRef}>
      {!videoId && (
        <div className="cad-video-empty">
          <p>No video playing yet.</p>
          {canControl && <p className="cad-video-empty-hint">Add a YouTube video to the queue to get started.</p>}
        </div>
      )}
      <div id={containerId} className="cad-video-frame" />

      {videoId && (
        <button
          className="cad-video-fullscreen"
          type="button"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
        </button>
      )}

      {videoId && canControl && (
        <div className="cad-video-seek-controls">
          <button type="button" onClick={() => skip(-10)} aria-label="Back 10 seconds" title="Back 10 seconds">
            <SkipBack size={16} />
          </button>
          <button type="button" onClick={() => skip(10)} aria-label="Forward 10 seconds" title="Forward 10 seconds">
            <SkipForward size={16} />
          </button>
        </div>
      )}

      {videoId && status === 'loading' && (
        <div className="cad-video-status"><LoaderCircle size={20} className="cad-spin" /><span>Connecting to YouTube…</span></div>
      )}
      {videoId && status === 'error' && (
        <div className="cad-video-status error">
          <AlertTriangle size={20} />
          <strong>Video could not start</strong>
          <span>{error}</span>
          <button className="cad-btn cad-btn-ghost" onClick={retry}><RotateCcw size={14} /> Try again</button>
        </div>
      )}
    </div>
  );
}
