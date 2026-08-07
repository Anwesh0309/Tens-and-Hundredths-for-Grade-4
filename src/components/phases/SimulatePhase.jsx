import { useState, useEffect } from 'react';
import { narrate, stopNarration } from '../../utils/audio.js';
import { simulateStationIntro } from '../../utils/narration.js';
import GridShaderStation from '../simulations/GridShaderStation.jsx';
import PlaceValueSliderStation from '../simulations/PlaceValueSliderStation.jsx';
import NumberLineStation from '../simulations/NumberLineStation.jsx';
import SpotErrorStation from '../simulations/SpotErrorStation.jsx';

const STATIONS = [
  { id: 0, letter: 'A', icon: '🟨', name: 'Grid Shader',
    desc: 'Shade the hundred-square grid to match the target decimal' },
  { id: 1, letter: 'B', icon: '🎚️', name: 'Place Value Slider',
    desc: 'Drag sliders to set ones, tenths & hundredths digits' },
  { id: 2, letter: 'C', icon: '📏', name: 'Number Line',
    desc: 'Tap the number line to place your decimal marker' },
  { id: 3, letter: 'D', icon: '🔍', name: 'Spot the Error',
    desc: 'Decide if each decimal statement is true or false' },
];

export default function SimulatePhase({ stationsComplete, onCompleteStation, onComplete, audioEnabled }) {
  const [activeStation, setActiveStation] = useState(0);

  // Play station intro narration when switching tabs
  useEffect(() => {
    stopNarration();
    const segs = simulateStationIntro(activeStation);
    const t = setTimeout(() => narrate(segs, audioEnabled), 400);
    return () => { clearTimeout(t); stopNarration(); };
  }, [activeStation, audioEnabled]);

  // All stations unlocked and accessible
  const canAccess = () => true;

  // Called by each station after exactly 1 correct answer — does NOT auto-switch tab
  const handleStationComplete = (id) => {
    onCompleteStation(id);
    // No automatic tab switch — user decides via "Go to Next Station" button
  };

  const allDone = stationsComplete.every(Boolean);
  const currentStationDone = stationsComplete[activeStation];

  return (
    <div className="simulate-screen" role="main" aria-label="Simulate Phase">
      {/* Header */}
      <div className="simulate-header">
        <h2 className="simulate-title">✏️ Simulate</h2>
        <p className="simulate-subtitle">Explore and discover — no wrong answers here!</p>
      </div>

      {/* Station tab bar */}
      <div className="station-tabs" role="tablist" aria-label="Simulation stations">
        {STATIONS.map(s => {
          const accessible = canAccess(s.id);
          const done = stationsComplete[s.id];
          const active = activeStation === s.id;
          return (
            <button
              key={s.id}
              className={`station-tab ${active ? 'active' : ''} ${done ? 'done' : ''}`}
              onClick={() => setActiveStation(s.id)}
              role="tab"
              aria-selected={active}
              aria-label={`Station ${s.letter}: ${s.name}${done ? ' (done)' : ''}`}
            >
              <span className="tab-letter">{done ? '✓' : s.letter}</span>
              <span className="tab-label">{s.icon} {s.name}</span>
            </button>
          );
        })}
      </div>

      {/* Active station panel */}
      <div className="station-panel" role="tabpanel" aria-label={`${STATIONS[activeStation].name} station`}>
        {/* Title row — NO badge/banner here */}
        <div className="station-title-row">
          <span style={{ fontSize: 20 }}>{STATIONS[activeStation].icon}</span>
          <h3 className="station-name">{STATIONS[activeStation].name}</h3>
        </div>
        <p className="station-desc">{STATIONS[activeStation].desc}</p>

        {/* Station content */}
        {activeStation === 0 && (
          <GridShaderStation
            isComplete={stationsComplete[0]}
            onComplete={() => handleStationComplete(0)}
            audioEnabled={audioEnabled}
          />
        )}
        {activeStation === 1 && (
          <PlaceValueSliderStation
            isComplete={stationsComplete[1]}
            onComplete={() => handleStationComplete(1)}
            audioEnabled={audioEnabled}
          />
        )}
        {activeStation === 2 && (
          <NumberLineStation
            isComplete={stationsComplete[2]}
            onComplete={() => handleStationComplete(2)}
            audioEnabled={audioEnabled}
          />
        )}
        {activeStation === 3 && (
          <SpotErrorStation
            isComplete={stationsComplete[3]}
            onComplete={() => handleStationComplete(3)}
            audioEnabled={audioEnabled}
          />
        )}

        {/* Bottom nav row */}
        <div className="station-nav-row">
          {/* Back button */}
          <button
            className="btn btn-secondary btn-sm"
            disabled={activeStation === 0}
            onClick={() => setActiveStation(s => Math.max(0, s - 1))}
            aria-label="Previous station"
          >
            ← Previous
          </button>

          {/* Right-side buttons */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {activeStation < 3 && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setActiveStation(s => s + 1)}
                aria-label="Go to next station"
              >
                Next Station →
              </button>
            )}

            <button
              className="btn btn-primary"
              onClick={onComplete}
              aria-label="Continue to Practice phase"
            >
              🎮 Practice Now!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
