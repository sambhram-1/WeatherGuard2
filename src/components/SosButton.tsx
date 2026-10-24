import React, { useState, useRef, useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';
import { playSosCountdownTick, playTactileClick } from '../services/soundEffects';

interface SosButtonProps {
  onTriggerSos: () => void;
  soundEnabled: boolean;
  reducedMotion: boolean;
}

export const SosButton: React.FC<SosButtonProps> = ({
  onTriggerSos,
  soundEnabled,
  reducedMotion,
}) => {
  const [isHolding, setIsHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  const holdDurationMs = 2800; // 2.8 seconds hold
  const startTimeRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastSecondTickedRef = useRef<number | null>(null);

  const startHold = () => {
    setIsHolding(true);
    startTimeRef.current = Date.now();
    lastSecondTickedRef.current = null;
    playTactileClick(soundEnabled);

    // Vibration feedback if supported
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([60]);
    }

    const step = () => {
      if (!startTimeRef.current) return;
      const elapsed = Date.now() - startTimeRef.current;
      const currentProgress = Math.min(1, elapsed / holdDurationMs);
      setProgress(currentProgress);

      const secLeft = Math.max(1, Math.ceil((holdDurationMs - elapsed) / 1000));
      setSecondsRemaining(secLeft);

      if (lastSecondTickedRef.current !== secLeft) {
        lastSecondTickedRef.current = secLeft;
        playSosCountdownTick(secLeft, soundEnabled);
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([40]);
        }
      }

      if (currentProgress >= 1) {
        // Trigger completed
        cancelHold();
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([150, 80, 200]);
        }
        onTriggerSos();
        return;
      }

      animFrameRef.current = requestAnimationFrame(step);
    };

    animFrameRef.current = requestAnimationFrame(step);
  };

  const cancelHold = () => {
    setIsHolding(false);
    startTimeRef.current = null;
    setProgress(0);
    setSecondsRemaining(null);
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const circumference = 132;
  const strokeOffset = circumference * (1 - progress);

  return (
    <div className="relative flex flex-col items-center">
      <button
        onMouseDown={startHold}
        onMouseUp={cancelHold}
        onMouseLeave={cancelHold}
        onTouchStart={(e) => {
          e.preventDefault();
          startHold();
        }}
        onTouchEnd={cancelHold}
        onTouchCancel={cancelHold}
        onKeyDown={(e) => {
          if ((e.key === ' ' || e.key === 'Enter') && !isHolding) {
            e.preventDefault();
            startHold();
          }
        }}
        onKeyUp={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            cancelHold();
          }
        }}
        onDoubleClick={onTriggerSos}
        className="sos-light-well-button relative w-12 h-12 rounded-full shrink-0 flex flex-col items-center justify-center text-white focus-visible:ring-4 focus-visible:ring-red-400 select-none cursor-pointer"
        style={{
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 60%, #b91c1c 100%)',
          boxShadow: isHolding
            ? '0 0 24px rgba(239, 68, 68, 0.9), inset 0 2px 4px rgba(255, 255, 255, 0.9)'
            : '0 8px 18px rgba(220, 38, 38, 0.5), -2px -2px 6px rgba(255, 255, 255, 0.8), inset 0 1px 2px rgba(255, 255, 255, 0.7)',
        }}
        aria-label="Emergency SOS: Press and hold for 3 seconds or double tap to broadcast distress emergency"
        title="Press & hold 3s for Emergency SOS"
      >
        {/* Animated Countdown Progress Ring */}
        <svg
          className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
          viewBox="0 0 50 50"
        >
          <circle
            cx="25"
            cy="25"
            r="21"
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="2.5"
          />
          <circle
            cx="25"
            cy="25"
            r="21"
            fill="none"
            stroke="#ffffff"
            strokeWidth="3.2"
            strokeDasharray={circumference}
            strokeDashoffset={strokeOffset}
            strokeLinecap="round"
          />
        </svg>

        <span className="text-[11px] font-black tracking-wider uppercase z-10 pointer-events-none drop-shadow">
          SOS
        </span>
        <span
          className={`text-[7.5px] font-black tracking-tighter uppercase z-10 pointer-events-none -mt-0.5 ${
            isHolding ? 'text-yellow-300 animate-pulse' : 'text-amber-200'
          }`}
        >
          {isHolding && secondsRemaining !== null ? `${secondsRemaining}s` : 'HOLD'}
        </span>
      </button>
    </div>
  );
};
