import { useState, useRef, useCallback, useEffect } from "react";
import type { MusicElement } from "../types/music";
import { getFrequency, getDurationBeats } from "../constants/frequencies";

interface PlaybackState {
  isPlaying: boolean;
  currentIndex: number;
  tempo: number;
}

export function usePlayback(elements: MusicElement[]) {
  const [state, setState] = useState<PlaybackState>({
    isPlaying: false,
    currentIndex: -1,
    tempo: 100,
  });

  const audioCtxRef = useRef<AudioContext | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const isPlayingRef = useRef(false);

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    return audioCtxRef.current;
  }, []);

  const playNote = useCallback(
    (frequency: number, durationSec: number) => {
      const ctx = getAudioContext();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc1.frequency.value = frequency;
      osc2.type = "triangle";
      osc2.frequency.value = frequency;

      const merger = ctx.createGain();
      merger.gain.value = 0.5;

      osc1.connect(gain);
      osc2.connect(merger);
      merger.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.02);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.1);
      gain.gain.setValueAtTime(0.2, now + durationSec - 0.05);
      gain.gain.linearRampToValueAtTime(0, now + durationSec);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + durationSec);
      osc2.stop(now + durationSec);
    },
    [getAudioContext],
  );

  const playSequence = useCallback(
    (startIndex: number) => {
      if (startIndex >= elements.length || !isPlayingRef.current) {
        setState((s) => ({ ...s, isPlaying: false, currentIndex: -1 }));
        isPlayingRef.current = false;
        return;
      }

      const el = elements[startIndex];

      if (el.type === "barline" || el.type === "linebreak") {
        setState((s) => ({ ...s, currentIndex: startIndex }));
        timeoutRef.current = window.setTimeout(
          () => playSequence(startIndex + 1),
          50,
        );
        return;
      }

      const duration = el.duration;
      const beats = getDurationBeats(duration);
      const beatDurationSec = 60 / state.tempo;
      const durationSec = beats * beatDurationSec;

      setState((s) => ({ ...s, currentIndex: startIndex }));

      if (el.type === "note") {
        const freq = getFrequency(el.name, el.octave, el.sharp);
        playNote(freq, durationSec);
      }

      timeoutRef.current = window.setTimeout(
        () => playSequence(startIndex + 1),
        durationSec * 1000,
      );
    },
    [elements, state.tempo, playNote],
  );

  const play = useCallback(() => {
    isPlayingRef.current = true;
    setState((s) => ({ ...s, isPlaying: true }));
    const startIdx = state.currentIndex >= 0 ? state.currentIndex : 0;
    playSequence(startIdx);
  }, [playSequence, state.currentIndex]);

  const pause = useCallback(() => {
    isPlayingRef.current = false;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setState((s) => ({ ...s, isPlaying: false }));
  }, []);

  const stop = useCallback(() => {
    isPlayingRef.current = false;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setState((s) => ({ ...s, isPlaying: false, currentIndex: -1 }));
  }, []);

  const setTempo = useCallback((tempo: number) => {
    setState((s) => ({ ...s, tempo }));
  }, []);

  useEffect(() => {
    return () => {
      isPlayingRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  return {
    isPlaying: state.isPlaying,
    currentIndex: state.currentIndex,
    tempo: state.tempo,
    play,
    pause,
    stop,
    setTempo,
  };
}
