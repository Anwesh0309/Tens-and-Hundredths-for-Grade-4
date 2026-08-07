import { useState, useEffect, useRef } from 'react';
import { narrate, stopNarration } from '../../utils/audio.js';
import { getStoryNarration } from '../../utils/narration.js';
import { storyPanels } from '../../data/storyContent.js';

export default function StoryPhase({ onComplete, audioEnabled }) {
  const [panelIndex, setPanelIndex] = useState(0);
  const narRef = useRef(null);

  const panel = storyPanels[panelIndex];
  const total = storyPanels.length;

  useEffect(() => {
    stopNarration();
    const timer = setTimeout(() => {
      const segs = getStoryNarration(panelIndex);
      narrate(segs, audioEnabled);
    }, 400);
    return () => { clearTimeout(timer); };
  }, [panelIndex, audioEnabled]);

  const goNext = () => {
    if (panelIndex < total - 1) setPanelIndex(panelIndex + 1);
    else onComplete();
  };
  const goBack = () => {
    if (panelIndex > 0) setPanelIndex(panelIndex - 1);
  };

  return (
    <div className="story-screen" role="main" aria-label={`Story panel ${panelIndex + 1} of ${total}`}>
      {/* Progress bar header */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div className="story-progress-bar-wrap">
          <div
            className="story-progress-bar-fill"
            style={{ width: `${((panelIndex + 1) / total) * 100}%` }}
            role="progressbar"
            aria-valuenow={panelIndex + 1}
            aria-valuemin={1}
            aria-valuemax={total}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 900, color: '#ffd54f', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            📖 Story Adventure · Panel {panelIndex + 1}
          </span>
          <span className="story-progress-label">{panelIndex + 1} / {total}</span>
        </div>
      </div>

      {/* Story card */}
      <div className="story-card">
        {/* Image panel */}
        <div
          className="story-image-panel"
          style={{ background: panel.imageBg }}
          aria-label={`Story illustration: ${panel.title}`}
        >
          {panel.image ? (
            <img
              src={panel.image}
              alt={panel.title}
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                position: 'absolute', top: 0, left: 0
              }}
              loading="eager"
            />
          ) : (
            <div className="story-image-placeholder">
              <div className="story-image-emoji" aria-hidden="true">{panel.imageEmoji}</div>
            </div>
          )}
          {/* Always show emoji caption */}
          <div style={{
            position: 'absolute', bottom: 12, left: '50%',
            transform: 'translateX(-50%)', zIndex: 2, width: '90%', textAlign: 'center'
          }}>
            <div className="story-image-caption">
              ✨ {panel.imageCaption}
            </div>
          </div>
        </div>

        {/* Text panel */}
        <div className="story-text-panel">
          <h2 className="story-panel-title">{panel.title}</h2>
          
          <p className="story-body">
            {panel.body}
          </p>

          <div className="story-question-chip" aria-label="Key question">
            ✦ {panel.questionChip} ✦
          </div>

          {/* Math fact highlight */}
          <div className="story-math-fact" aria-label="Math fact">
            📐 <strong>Key Fact:</strong> {panel.mathFact}
          </div>

          {/* Mascot */}
          <div className="story-mascot-row">
            <div className="story-mascot-mini" aria-hidden="true">🐻</div>
            <div className="story-mascot-speech">{panel.mascotCaption}</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="story-nav-row">
        <button
          className="btn btn-secondary btn-sm"
          onClick={goBack}
          disabled={panelIndex === 0}
          aria-label="Previous panel"
        >
          ← Back
        </button>

        <div className="story-dots" role="tablist" aria-label="Story panels">
          {storyPanels.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`story-dot ${i === panelIndex ? 'active' : ''}`}
              onClick={() => setPanelIndex(i)}
              role="tab"
              aria-selected={i === panelIndex}
              aria-label={`Go to story panel ${i + 1}`}
            />
          ))}
        </div>

        <button
          className="btn btn-primary btn-sm"
          onClick={goNext}
          aria-label={panelIndex < total - 1 ? 'Next panel' : 'Continue to Practice'}
        >
          {panelIndex < total - 1 ? 'Next Panel →' : 'Continue →'}
        </button>
      </div>
    </div>
  );
}
