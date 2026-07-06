import { useState, useCallback, useEffect, useRef } from 'react';

const TARGETS = [0.30, 0.50, 0.75, 0.10, 0.45, 0.20, 0.08, 0.60, 0.25, 0.09];

export default function GridShaderStation({ isComplete, onComplete, audioEnabled }) {
  const [targetIdx, setTargetIdx] = useState(0);
  const [shadedCells, setShadedCells] = useState(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [toast, setToast] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const completedRef = useRef(false);

  const target = TARGETS[targetIdx];
  const targetCount = Math.round(target * 100);
  const shadedCount = shadedCells.size;
  const currentDecimal = (shadedCount / 100).toFixed(2);

  const toggleCell = useCallback((i) => {
    if (confirmed) return;
    setShadedCells(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      const row = Math.floor(i / 10);
      const rowFull = Array.from({ length: 10 }, (_, c) => c).every(c => next.has(row * 10 + c));
      if (rowFull) setToast("That's one tenth! ✨");
      return next;
    });
  }, [confirmed]);

  const handleMouseDown = (i) => { setIsDragging(true); toggleCell(i); };
  const handleMouseEnter = (i) => { if (isDragging) toggleCell(i); };
  const handleMouseUp = () => setIsDragging(false);

  const handleConfirm = () => {
    if (shadedCount === targetCount) {
      setConfirmed(true);
      setToast(`🎉 Correct! ${targetCount} squares = ${target}`);
      // Call onComplete immediately — no auto setTimeout
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete();
      }
    } else {
      setToast(`Shade exactly ${targetCount} squares for ${target}. You have ${shadedCount}. 🔢`);
      setTimeout(() => setToast(''), 2500);
    }
  };

  const handleTryAnother = () => {
    setTargetIdx(t => (t + 1) % TARGETS.length);
    setShadedCells(new Set());
    setToast('');
    setConfirmed(false);
    // Note: station already complete, this is just extra practice
  };

  const handleReset = () => {
    if (confirmed) return;
    setShadedCells(new Set());
    setToast('');
  };

  useEffect(() => {
    if (toast && !confirmed) {
      const t = setTimeout(() => setToast(''), 2500);
      return () => clearTimeout(t);
    }
  }, [toast, confirmed]);

  return (
    <div>
      {/* Target */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{
          background: 'rgba(255,193,7,0.15)', border: '1px solid rgba(255,193,7,0.4)',
          borderRadius: 8, padding: '8px 16px',
          fontFamily: 'Fredoka, sans-serif', fontWeight: 700, fontSize: '1.05rem', color: '#ffd54f'
        }}>
          🎯 Shade: <span style={{ fontSize: '1.5rem', color: '#ffc107' }}>{target}</span>
          <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginLeft: 8 }}>
            ({targetCount} squares)
          </span>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={handleReset}
          disabled={confirmed}
          aria-label="Reset grid"
        >
          🔄 Reset
        </button>
      </div>

      {/* Grid */}
      <div
        className="hundred-grid"
        onMouseLeave={() => setIsDragging(false)}
        onMouseUp={handleMouseUp}
        role="grid"
        aria-label="Hundred square grid — click or drag to shade"
      >
        {Array.from({ length: 100 }).map((_, i) => {
          const row = Math.floor(i / 10);
          const isRowComplete = Array.from({ length: 10 }, (_, c) => c).every(c => shadedCells.has(row * 10 + c));
          return (
            <div
              key={i}
              className={`grid-cell ${shadedCells.has(i) ? 'filled' : ''} ${isRowComplete && shadedCells.has(i) ? 'row-complete' : ''}`}
              onMouseDown={() => handleMouseDown(i)}
              onMouseEnter={() => handleMouseEnter(i)}
              onTouchStart={() => toggleCell(i)}
              role="gridcell"
              aria-pressed={shadedCells.has(i)}
              aria-label={`Square ${i + 1}`}
            />
          );
        })}
      </div>

      {/* Live readout */}
      <div className="grid-readout" aria-live="polite">
        <span>Shaded: {shadedCount} / 100 = </span>
        <strong>{currentDecimal}</strong>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          marginTop: 10, padding: '8px 14px',
          background: confirmed ? 'rgba(76,175,80,0.25)' : 'rgba(255,193,7,0.15)',
          border: `1px solid ${confirmed ? 'rgba(76,175,80,0.5)' : 'rgba(255,193,7,0.4)'}`,
          borderRadius: 8, fontSize: 13, fontWeight: 700,
          color: confirmed ? '#81c784' : '#ffd54f', textAlign: 'center',
          animation: 'bounceIn 0.3s ease'
        }} aria-live="assertive">
          {toast}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10, marginTop: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        {!confirmed ? (
          <button
            className="btn btn-primary"
            onClick={handleConfirm}
            disabled={shadedCount === 0}
            aria-label="Confirm answer"
          >
            ✓ Confirm Answer
          </button>
        ) : (
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleTryAnother}
            aria-label="Try another decimal"
          >
            Try Another →
          </button>
        )}
      </div>
    </div>
  );
}
