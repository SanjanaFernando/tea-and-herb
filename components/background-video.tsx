"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

function playVideo(video: HTMLVideoElement) {
  // Keep the poster or paused frame if the browser blocks playback.
  void video.play().catch(() => {});
}

export function BackgroundVideo({ src, poster }: { src: string; poster: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const userPlayback = useRef<boolean | null>(null);
  const [playing, setPlaying] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    let inView = false;
    const syncPlayback = () => {
      const wantsPlayback = userPlayback.current ?? !reducedMotion.matches;
      if (inView && wantsPlayback) playVideo(video);
      else video.pause();
    };
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.intersectionRatio >= 0.1;
      syncPlayback();
    }, { threshold: 0.1 });

    observer.observe(video);
    reducedMotion.addEventListener("change", syncPlayback);
    return () => {
      observer.disconnect();
      reducedMotion.removeEventListener("change", syncPlayback);
      video.pause();
    };
  }, []);

  function togglePlayback() {
    const video = videoRef.current;
    if (!video) return;

    userPlayback.current = video.paused;
    if (video.paused) playVideo(video);
    else video.pause();
  }

  const Icon = playing ? Pause : Play;
  return <>
    <video
      ref={videoRef}
      className="background-video"
      src={src}
      poster={poster}
      preload="none"
      muted
      playsInline
      loop
      aria-hidden="true"
      onPlay={() => setPlaying(true)}
      onPause={() => setPlaying(false)}
      onError={() => setUnavailable(true)}
    />
    {!unavailable && (
      <button type="button" className="background-video-toggle" onClick={togglePlayback} aria-label={playing ? "Pause background video" : "Play background video"}>
        <Icon size={18} aria-hidden="true" />
      </button>
    )}
  </>;
}
