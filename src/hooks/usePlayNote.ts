import { useRef, useCallback } from "react";
import type { NoteName, Octave } from "../types/music";
import { getFrequency } from "../constants/frequencies";

export function usePlayNote() {
  const audioCtxRef = useRef<AudioContext | null>(null);

  return useCallback((name: NoteName, octave: Octave) => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    const ctx = audioCtxRef.current;
    const freq = getFrequency(name, octave);
    const duration = 0.3;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = "sine";
    osc1.frequency.value = freq;
    osc2.type = "triangle";
    osc2.frequency.value = freq;

    const merger = ctx.createGain();
    merger.gain.value = 0.5;

    osc1.connect(gain);
    osc2.connect(merger);
    merger.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.02);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.1);
    gain.gain.linearRampToValueAtTime(0, now + duration);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration);
    osc2.stop(now + duration);
  }, []);
}
