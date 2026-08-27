import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

let apiPromise = null;

function loadYouTubeApi() {
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('YouTube IFrame API timed out.')), 10000);
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      clearTimeout(timeout);
      previous?.();
      resolve(window.YT);
    };
    const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    if (!existing) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      tag.onerror = () => { clearTimeout(timeout); reject(new Error('Could not load YouTube IFrame API.')); };
      document.head.appendChild(tag);
    }
  });
  return apiPromise;
}

export default function useYouTubePlayer(containerId, { onReady, onStateChange, onError } = {}) {
  const playerRef = useRef(null);
  const callbacks = useRef({ onReady, onStateChange, onError });
  const [ready, setReady] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => { callbacks.current = { onReady, onStateChange, onError }; }, [onReady, onStateChange, onError]);

  useEffect(() => {
    let cancelled = false;
    loadYouTubeApi()
      .then((YT) => {
        if (cancelled) return;
        playerRef.current = new YT.Player(containerId, {
          height: '100%',
          width: '100%',
          playerVars: { autoplay: 1, rel: 0, modestbranding: 1, playsinline: 1, enablejsapi: 1 },
          events: {
            onReady: () => { setReady(true); callbacks.current.onReady?.(); },
            onStateChange: (e) => callbacks.current.onStateChange?.(e.data),
            onError: (e) => callbacks.current.onError?.(e.data),
          },
        });
      })
      .catch((err) => {
        apiPromise = null;
        if (!cancelled) setApiError(err.message);
      });

    return () => {
      cancelled = true;
      setReady(false);
      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
  }, [containerId]);

  const loadVideo = useCallback((videoId, startSeconds = 0) => playerRef.current?.loadVideoById({ videoId, startSeconds }), []);
  const play = useCallback(() => playerRef.current?.playVideo(), []);
  const pause = useCallback(() => playerRef.current?.pauseVideo(), []);
  const seekTo = useCallback((seconds) => playerRef.current?.seekTo(Math.max(0, seconds), true), []);
  const getCurrentTime = useCallback(() => playerRef.current?.getCurrentTime?.() ?? 0, []);

  return useMemo(() => ({ ready, apiError, loadVideo, play, pause, seekTo, getCurrentTime }), [ready, apiError, loadVideo, play, pause, seekTo, getCurrentTime]);
}
