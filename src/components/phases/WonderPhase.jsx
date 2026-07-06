import { useEffect, useRef } from 'react';
import { narrate, stopNarration } from '../../utils/audio.js';
import { wonderNarration } from '../../utils/narration.js';

export default function WonderPhase({ onComplete, audioEnabled }) {
  const narRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const segments = wonderNarration();
      narrate(segments, audioEnabled);
    }, 500);
    return () => { clearTimeout(timer); stopNarration(); };
  }, [audioEnabled]);

  return (
    <div className="wonder-screen" role="main" aria-label="Wonder Phase">
      {/* Mascot row */}
      <div className="wonder-mascot-row">
        <div className="wonder-mascot-avatar" aria-hidden="true">🐻</div>
        <div className="wonder-speech-bubble">Hmm... I wonder... 🤔</div>
      </div>

      {/* Main card */}
      <div className="wonder-card glass-card">
        <div className="wonder-qmark" aria-hidden="true">❓</div>

        <p className="wonder-question">
          Emma has $3.45. Her friend has $3.5.<br />
          Who has more money?
        </p>

        <p className="wonder-subtext">
          What if it's not always the number with more digits that's bigger?
        </p>

        <div className="wonder-hint-chip" aria-label="Hint">
          ✨ It's not always the number with more digits! ✨
        </div>
      </div>

      {/* CTA */}
      <button
        className="btn btn-primary btn-lg"
        onClick={onComplete}
        aria-label="Let's investigate decimals"
        style={{ fontSize: '1.1rem' }}
      >
        🔍 Let&apos;s Investigate!
      </button>
    </div>
  );
}
