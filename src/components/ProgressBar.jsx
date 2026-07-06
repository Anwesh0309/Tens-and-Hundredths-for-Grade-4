export default function ProgressBar({ phases, currentPhase, phaseComplete }) {
  return (
    <nav className="phase-nav" aria-label="Learning phases">
      {phases.map((ph, i) => {
        const isActive = currentPhase === ph.id;
        const isCompleted = phaseComplete?.[ph.id];
        return (
          <div key={ph.id} style={{ display: 'flex', alignItems: 'center' }}>
            {i > 0 && <div className={`phase-connector ${isCompleted ? 'done' : ''}`} />}
            <div
              className={`phase-pill ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
              aria-current={isActive ? 'step' : undefined}
            >
              <span>{isCompleted ? '✓' : ph.icon}</span>
              <span className="phase-label">{ph.label}</span>
            </div>
          </div>
        );
      })}
    </nav>
  );
}
