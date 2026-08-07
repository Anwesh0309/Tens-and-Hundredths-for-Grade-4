import { useEffect, useRef } from 'react';
import { narrate, say, cheer, stopNarration } from '../utils/audio.js';

export default function IntroScreen({ onBegin, audioEnabled, onToggleAudio }) {
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
      {/* Audio Mute Button centered above badge */}
      <button
        className="audio-btn intro-audio-btn"
        onClick={onToggleAudio}
        aria-label={audioEnabled ? 'Mute audio' : 'Unmute audio'}
      >
        {audioEnabled ? '🔊' : '🔇'}
      </button>

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
            { id: 'wonder', icon: '🔍', name: 'Wonder', desc: 'Spark your curiosity' },
            { id: null, icon: '→', name: '', desc: '' },
            { id: 'story', icon: '📖', name: 'Story', desc: 'Hear the tale' },
            { id: null, icon: '→', name: '', desc: '' },
            { id: 'simulate', icon: '✏️', name: 'Simulate', desc: 'Explore & discover' },
            { id: null, icon: '→', name: '', desc: '' },
            { id: 'play', icon: '🎮', name: 'Practice', desc: 'Test your skills' },
            { id: null, icon: '→', name: '', desc: '' },
            { id: 'reflect', icon: '🪞', name: 'Reflect', desc: 'What did you learn?' },
          ].map((step, i) =>
            step.name === '' ? (
              <span key={i} className="intro-arrow" aria-hidden="true">→</span>
            ) : (
              <button
                key={i}
                type="button"
                className="intro-step clickable"
                onClick={() => onBegin(step.id)}
                aria-label={`Jump to ${step.name} phase`}
              >
                <div className="intro-step-icon" aria-hidden="true">{step.icon}</div>
                <div className="intro-step-text">
                  <strong>{step.name}</strong>
                  <span>{step.desc}</span>
                </div>
              </button>
            )
          )}
        </div>
      </div>

      {/* CTA */}
      <button
        className="btn btn-primary btn-lg"
        onClick={() => onBegin('wonder')}
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
