"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Volume2, VolumeX } from "lucide-react";

const SRC = "/audio/inauguration-jingle-igbo.mp3";

/**
 * Plays the Igbo inauguration jingle on the home page. Browsers usually block
 * sound until the first tap, so we try on load and again on the first gesture.
 * The control starts the track when it is stopped, and mutes it when it plays.
 */
export function InaugurationJingle() {
  const t = useTranslations("home");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startedRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [needsTap, setNeedsTap] = useState(true);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.preload = "auto";
    audio.loop = false;
    audio.setAttribute("playsinline", "true");

    const markPlaying = () => {
      setPlaying(true);
      setNeedsTap(false);
      startedRef.current = true;
    };
    const markStopped = () => setPlaying(false);

    audio.addEventListener("play", markPlaying);
    audio.addEventListener("playing", markPlaying);
    audio.addEventListener("pause", markStopped);
    audio.addEventListener("ended", markStopped);

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const start = () => {
      if (!audioRef.current || startedRef.current) return;
      audioRef.current.muted = false;
      setMuted(false);
      void audioRef.current
        .play()
        .then(() => {
          startedRef.current = true;
          setNeedsTap(false);
        })
        .catch(() => {
          setNeedsTap(true);
        });
    };

    if (!reduceMotion) {
      start();
    }

    const onFirstGesture = () => {
      start();
    };

    window.addEventListener("pointerdown", onFirstGesture, { passive: true });
    window.addEventListener("touchstart", onFirstGesture, { passive: true });
    window.addEventListener("keydown", onFirstGesture);

    return () => {
      window.removeEventListener("pointerdown", onFirstGesture);
      window.removeEventListener("touchstart", onFirstGesture);
      window.removeEventListener("keydown", onFirstGesture);
      audio.removeEventListener("play", markPlaying);
      audio.removeEventListener("playing", markPlaying);
      audio.removeEventListener("pause", markStopped);
      audio.removeEventListener("ended", markStopped);
      audio.pause();
    };
  }, []);

  function handleControl(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;

    // First tap must start sound. A follow-up tap mutes or unmutes.
    if (needsTap || audio.paused || audio.ended) {
      audio.muted = false;
      setMuted(false);
      void audio
        .play()
        .then(() => {
          startedRef.current = true;
          setNeedsTap(false);
        })
        .catch(() => setNeedsTap(true));
      return;
    }

    audio.muted = !audio.muted;
    setMuted(audio.muted);
  }

  const showPlay = needsTap || muted || !playing;

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2 sm:bottom-8 sm:right-8">
      {needsTap && (
        <p className="glass max-w-[11rem] rounded-2xl border-gold/20 px-3 py-2 text-right font-data text-[10px] uppercase tracking-[0.18em] text-gold-pale">
          {t("jingleTap")}
        </p>
      )}
      <button
        type="button"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={handleControl}
        aria-pressed={!showPlay}
        aria-label={showPlay ? t("jinglePlay") : t("jingleMute")}
        className="glass flex h-12 w-12 items-center justify-center rounded-full border-gold/25 text-gold-pale shadow-[0_10px_40px_-12px_rgba(5,11,8,0.8)] transition-all duration-300 hover:border-gold/50 hover:text-gold-bright"
      >
        {showPlay ? <VolumeX size={18} strokeWidth={1.8} /> : <Volume2 size={18} strokeWidth={1.8} />}
      </button>
      <audio ref={audioRef} src={SRC} preload="auto" playsInline />
    </div>
  );
}
