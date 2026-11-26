"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Volume2, VolumeX } from "lucide-react";

const SRC = "/audio/inauguration-jingle-igbo.mp3";
const SESSION_KEY = "iedf_jingle_started";

/**
 * Plays the Igbo inauguration jingle when someone lands on the home page.
 * Browsers often block sound until the first tap; if that happens, the first
 * pointer or key press starts the track. A mute control stays on screen.
 */
export function InaugurationJingle() {
  const t = useTranslations("home");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const audio = new Audio(SRC);
    audio.preload = "auto";
    audio.loop = false;
    audioRef.current = audio;

    const markPlaying = () => setPlaying(true);
    const markStopped = () => setPlaying(false);
    audio.addEventListener("play", markPlaying);
    audio.addEventListener("pause", markStopped);
    audio.addEventListener("ended", markStopped);

    let unlocked = false;
    const tryPlay = () => {
      if (unlocked || !audioRef.current) return;
      void audioRef.current
        .play()
        .then(() => {
          unlocked = true;
          try {
            sessionStorage.setItem(SESSION_KEY, "1");
          } catch {
            // Private browsing can block sessionStorage.
          }
        })
        .catch(() => {
          // Waiting for the first visitor gesture.
        });
    };

    const alreadyStarted = (() => {
      try {
        return sessionStorage.getItem(SESSION_KEY) === "1";
      } catch {
        return false;
      }
    })();

    if (!alreadyStarted) {
      tryPlay();
    }

    const unlock = () => {
      tryPlay();
      if (unlocked) {
        window.removeEventListener("pointerdown", unlock);
        window.removeEventListener("keydown", unlock);
        window.removeEventListener("touchstart", unlock);
      }
    };

    window.addEventListener("pointerdown", unlock, { passive: true });
    window.addEventListener("keydown", unlock);
    window.addEventListener("touchstart", unlock, { passive: true });

    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("touchstart", unlock);
      audio.removeEventListener("play", markPlaying);
      audio.removeEventListener("pause", markStopped);
      audio.removeEventListener("ended", markStopped);
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, []);

  function toggleMute() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    setMuted(audio.muted);
    if (audio.paused) {
      void audio.play().catch(() => undefined);
    }
  }

  return (
    <button
      type="button"
      onClick={toggleMute}
      aria-pressed={muted || !playing}
      aria-label={muted || !playing ? t("jinglePlay") : t("jingleMute")}
      className="glass fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full border-gold/25 text-gold-pale shadow-[0_10px_40px_-12px_rgba(5,11,8,0.8)] transition-all duration-300 hover:border-gold/50 hover:text-gold-bright sm:bottom-8 sm:right-8"
    >
      {muted || !playing ? <VolumeX size={18} strokeWidth={1.8} /> : <Volume2 size={18} strokeWidth={1.8} />}
    </button>
  );
}
