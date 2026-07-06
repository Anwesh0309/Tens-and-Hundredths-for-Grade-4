import { useEffect, useRef } from 'react';
import { narrate, say, cheer, stopNarration } from '../utils/audio.js';

export default function IntroScreen({ onBegin, audioEnabled }) {
  const narrationRef = useRef(null);

  useEffect(() => {
    const segments = [
      say("Welcome to Decimal Grid — Tenths and Hundredths!"),
      cheer("Join Oliver on a journey to master decimals through stories, simulations, and fun games!"),
    ];
    const timer = setTimeout(() => narrate(segments, audioEnabled), 600);
    return () => { clearTimeout(timer); stopNarration(); };
  }, [audioEnabled]);

  return (
    <div className="intro-screen" role="main" aria-label="Lesson Introduction">
      {/* Badge */}
      <div className="intro-badge" aria-label="Curriculum badge">
        ✨ Grade 4 · Decimals · Chapter 7
      </div>

      {/* Title */}
      <h1 className="intro-title">
        Decimal Grid —{' '}
        <span className="highlight">Tenths &amp; Hundredths</span>
      </h1>

      {/* Mascot + speech */}
      <div className="intro-mascot-row">
        <div className="intro-mascot-avatar" aria-hidden="true">🐻</div>
        <div className="intro-speech">
          Ready for a decimal adventure? 🔢
        </div>
      </div>

      {/* Subtitle */}
      <p className="intro-subtitle">
        Join Oliver on a journey to read, write, and compare decimals — tenths and hundredths — through stories, simulations, and fun games!
      </p>

      {/* Journey roadmap */}
      <div className="intro-journey-box" role="region" aria-label="Your learning journey">
        <div className="intro-journey-title">Your Learning Journey</div>
        <div className="intro-journey-steps">
          {[
            { icon: '🔍', name: 'Wonder', desc: 'Spark your curiosity' },
            { icon: '→', name: '', desc: '' },
            { icon: '📖', name: 'Story', desc: 'Hear the tale' },
            { icon: '→', name: '', desc: '' },
            { icon: '✏️', name: 'Simulate', desc: 'Explore & discover' },
            { icon: '→', name: '', desc: '' },
            { icon: '🎮', name: 'Play', desc: 'Test your skills' },
            { icon: '→', name: '', desc: '' },
            { icon: '🪞', name: 'Reflect', desc: 'What did you learn?' },
          ].map((step, i) =>
            step.name === '' ? (
              <span key={i} className="intro-arrow" aria-hidden="true">→</span>
            ) : (
              <div key={i} className="intro-step">
                <div className="intro-step-icon" aria-hidden="true">{step.icon}</div>
                <div className="intro-step-text">
                  <strong>{step.name}</strong>
                  <span>{step.desc}</span>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* CTA */}
      <button
        className="btn btn-primary btn-lg"
        onClick={onBegin}
        aria-label="Begin your learning journey"
      >
        🚀 Begin Your Journey!
      </button>

      {/* Quick tiles */}
      <div className="intro-quick-tiles" role="list">
        <div className="intro-tile" role="listitem" tabIndex="0" aria-label="Practice questions">
          <span className="intro-tile-icon" aria-hidden="true">🔢</span>
          <span className="intro-tile-label">100 Practice Questions</span>
        </div>
        <div className="intro-tile" role="listitem" tabIndex="0" aria-label="Simulations">
          <span className="intro-tile-icon" aria-hidden="true">🔬</span>
          <span className="intro-tile-label">4 Simulations</span>
        </div>
        <div className="intro-tile" role="listitem" tabIndex="0" aria-label="Game worlds">
          <span className="intro-tile-icon" aria-hidden="true">🏆</span>
          <span className="intro-tile-label">10 Game Worlds</span>
        </div>
      </div>
    </div>
  );
}
