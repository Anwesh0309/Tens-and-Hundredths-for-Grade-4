import { useState, useRef, useCallback } from 'react';

const TARGETS = [
  { value: 0.5,  start: 0, end: 1, precision: 'tenths',     label: 'Place 0.5 on the number line' },
  { value: 0.3,  start: 0, end: 1, precision: 'tenths',     label: 'Place 0.3 on the number line' },
  { value: 3.4,  start: 3, end: 4, precision: 'tenths',     label: 'Place 3.4 on the number line' },
  { value: 0.75, start: 0, end: 1, precision: 'hundredths', label: 'Place 0.75 on the number line' },
];

export default function NumberLineStation({ isComplete, onComplete, audioEnabled }) {
  const [targetIdx, setTargetIdx] = useState(0);
  const [markerPct, setMarkerPct] = useState(null);
  const [placed, setPlaced] = useState(false);
  const [feedback, setFeedback] = useState('');
  const svgRef = useRef(null);
  const completedRef = useRef(false);

  const target = TARGETS[targetIdx];
  const range = target.end - target.start;
  const step = target.precision === 'hundredths' ? 0.01 : 0.1;
  const minorStep = 0.1;
  const numTicks = Math.round(range / minorStep);

  const pctToValue = (pct) => {
    const raw = target.start + (pct / 100) * range;
    return Math.round(raw / step) * step;
  };

  const handleSvgClick = useCallback((e) => {
    if (placed) return;
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setMarkerPct(pct);
    setFeedback('');
  }, [placed]);

  const handleConfirm = () => {
    if (markerPct === null) { setFeedback('👆 Tap the number line to place your marker first!'); return; }
    const guess = pctToValue(markerPct);
    const diff = Math.abs(guess - target.value);
    const tolerance = step * 1.6;

    if (diff <= tolerance) {
      setPlaced(true);
      setFeedback(`🎉 Correct! ${target.value} placed accurately!`);
      // Call onComplete immediately — no setTimeout
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete();
      }
    } else {
      const correctPct = Math.round(((target.value - target.start) / range) * 100);
      setFeedback(`Not quite! ${target.value} is about ${correctPct}% along the line. Try again! 🔢`);
      setTimeout(() => setFeedback(''), 2800);
    }
  };

  const handleTryAnother = () => {
    const next = (targetIdx + 1) % TARGETS.length;
    setTargetIdx(next);
    setMarkerPct(null);
    setPlaced(false);
    setFeedback('');
    // station stays complete
  };

  return (
    <div>
      {/* Target */}
      <div className="nl-target-label">🎯 {target.label}</div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: 10 }}>
        Tap the line to place your marker, then confirm.
        {target.precision === 'hundredths' && ' (hundredths precision)'}
      </div>

      {/* SVG Number Line */}
      <div style={{ width: '100%', padding: '0 10px', cursor: placed ? 'default' : 'pointer' }}>
        <svg
          ref={svgRef}
          viewBox="0 0 600 80"
          style={{ width: '100%', height: 80, overflow: 'visible' }}
          onClick={handleSvgClick}
          role="img"
          aria-label={`Number line ${target.start} to ${target.end}`}
        >
          <line x1="30" y1="40" x2="570" y2="40" stroke="rgba(255,255,255,0.4)" strokeWidth="3" />

          {Array.from({ length: numTicks + 1 }).map((_, i) => {
            const v = +(target.start + i * minorStep).toFixed(2);
            const x = 30 + (i / numTicks) * 540;
            const isMajor = Math.abs(v - Math.round(v)) < 0.001;
            return (
              <g key={i}>
                <line
                  x1={x} y1={isMajor ? 24 : 32}
                  x2={x} y2={isMajor ? 56 : 48}
                  stroke={isMajor ? '#fff' : 'rgba(255,255,255,0.35)'}
                  strokeWidth={isMajor ? 2.5 : 1}
                />
                {isMajor && (
                  <text x={x} y={72} textAnchor="middle"
                    fill="#fff" fontSize="13" fontWeight="700" fontFamily="Fredoka, sans-serif">
                    {v.toFixed(1)}
                  </text>
                )}
                {!isMajor && (
                  <text x={x} y={18} textAnchor="middle" fill="rgba(255,255,255,0.28)" fontSize="9">
                    {v.toFixed(1)}
                  </text>
                )}
              </g>
            );
          })}

          {markerPct !== null && (() => {
            const mx = 30 + (markerPct / 100) * 540;
            const guessVal = pctToValue(markerPct);
            return (
              <g>
                <line x1={mx} y1={16} x2={mx} y2={64}
                  stroke={placed ? '#4caf50' : '#ffc107'} strokeWidth="2" strokeDasharray="4,3" />
                <circle cx={mx} cy={40} r={11}
                  fill={placed ? '#4caf50' : '#ffc107'} stroke="#fff" strokeWidth="2.5" />
                <text x={mx} y={45} textAnchor="middle"
                  fill="#1a1030" fontSize="10" fontWeight="900" fontFamily="Fredoka, sans-serif">
                  {guessVal.toFixed(target.precision === 'hundredths' ? 2 : 1)}
                </text>
              </g>
            );
          })()}
        </svg>
      </div>

      {/* Feedback */}
      {feedback && (
        <div style={{
          marginTop: 10, padding: '9px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700,
          background: placed ? 'rgba(76,175,80,0.25)' : 'rgba(255,193,7,0.15)',
          border: `1px solid ${placed ? 'rgba(76,175,80,0.5)' : 'rgba(255,193,7,0.4)'}`,
          color: placed ? '#81c784' : '#ffd54f', textAlign: 'center', animation: 'bounceIn 0.3s ease',
        }} aria-live="assertive">
          {feedback}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10, marginTop: 14, justifyContent: 'center' }}>
        {!placed ? (
          <>
            <button className="btn btn-primary" onClick={handleConfirm} disabled={markerPct === null}>
              ✓ Place It Here!
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => { setMarkerPct(null); setFeedback(''); }}>
              Reset
            </button>
          </>
        ) : (
          <button className="btn btn-secondary btn-sm" onClick={handleTryAnother}>
            Try Another →
          </button>
        )}
      </div>
    </div>
  );
}
