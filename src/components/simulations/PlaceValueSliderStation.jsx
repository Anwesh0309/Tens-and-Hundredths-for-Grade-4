import { useState, useRef } from 'react';

export default function PlaceValueSliderStation({ isComplete, onComplete, audioEnabled }) {
  const [ones, setOnes] = useState(2);
  const [tenths, setTenths] = useState(6);
  const [hundredths, setHundredths] = useState(3);
  const [callout, setCallout] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const prevVals = useRef({ ones: 2, tenths: 6, hundredths: 3 });
  const completedRef = useRef(false);

  const decimalValue = (ones + tenths / 10 + hundredths / 100).toFixed(2);

  const handleChange = (field, val) => {
    if (confirmed) return;
    const n = parseInt(val);
    const prev = prevVals.current[field];
    prevVals.current[field] = n;

    if (field === 'ones') setOnes(n);
    if (field === 'tenths') setTenths(n);
    if (field === 'hundredths') setHundredths(n);

    if (field === 'tenths') {
      const change = ((n - prev) * 0.1).toFixed(1);
      setCallout(n > prev
        ? `Tenths: ${prev} → ${n}. Number grew by ${change}! 📈`
        : n < prev
          ? `Tenths: ${prev} → ${n}. Number shrank by ${Math.abs(+change).toFixed(1)}! 📉`
          : callout);
    } else if (field === 'hundredths') {
      const change = ((n - prev) * 0.01).toFixed(2);
      setCallout(n > prev
        ? `Hundredths: ${prev} → ${n}. Number grew by ${change}! 📈`
        : n < prev
          ? `Hundredths: ${prev} → ${n}. Number shrank by ${Math.abs(+change).toFixed(2)}! 📉`
          : callout);
    } else {
      setCallout(n > prev
        ? `Ones: ${prev} → ${n}. That's +${n - prev} whole unit! 🔢`
        : n < prev
          ? `Ones: ${prev} → ${n}. That's −${prev - n} whole unit! 🔢`
          : callout);
    }
  };

  const handleConfirm = () => {
    setConfirmed(true);
    setCallout(`✅ ${decimalValue} = ${ones} ones + ${tenths} tenths + ${hundredths} hundredths`);
    // Call onComplete immediately — no setTimeout
    if (!completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  };

  const handleTryAnother = () => {
    setConfirmed(false);
    setCallout('');
    prevVals.current = { ones, tenths, hundredths };
    // station stays complete — just let them explore more
  };

  return (
    <div>
      {/* Place value chart */}
      <div className="pv-chart" role="table" aria-label="Place value chart">
        <div className="pv-col ones" role="cell">
          <span className="pv-label">Ones</span>
          <span className="pv-digit" style={{ color: '#7986cb' }}>{ones}</span>
        </div>
        <div className="pv-decimal-point" aria-hidden="true">.</div>
        <div className="pv-col tenths" role="cell">
          <span className="pv-label">Tenths</span>
          <span className="pv-digit" style={{ color: '#ffc107' }}>{tenths}</span>
        </div>
        <div className="pv-col hundredths" role="cell">
          <span className="pv-label">Hundredths</span>
          <span className="pv-digit" style={{ color: '#ef9a9a' }}>{hundredths}</span>
        </div>
      </div>

      {/* Big decimal display */}
      <div style={{
        textAlign: 'center', margin: '12px 0',
        fontFamily: 'Fredoka, sans-serif', fontSize: '2.8rem', fontWeight: 700,
        color: '#ffc107', textShadow: '0 0 20px rgba(255,193,7,0.4)'
      }} aria-live="polite" aria-label={`Current value: ${decimalValue}`}>
        {decimalValue}
      </div>

      {/* Sliders */}
      <div className="slider-row" role="group" aria-label="Place value sliders">
        {[
          { label: 'Ones',       field: 'ones',       val: ones,       color: '#7986cb', cls: 'ones-slider' },
          { label: 'Tenths',     field: 'tenths',     val: tenths,     color: '#ffc107', cls: 'tenths-slider' },
          { label: 'Hundredths', field: 'hundredths', val: hundredths, color: '#ef9a9a', cls: 'hundredths-slider' },
        ].map(s => (
          <div key={s.field} className="slider-group">
            <label className="slider-col-label" htmlFor={`slider-${s.field}`} style={{ color: s.color }}>
              {s.label}
            </label>
            <input
              id={`slider-${s.field}`}
              type="range"
              className={`pv-slider ${s.cls}`}
              min={0} max={9}
              value={s.val}
              onChange={e => handleChange(s.field, e.target.value)}
              disabled={confirmed}
              aria-label={`${s.label}: ${s.val}`}
              aria-valuemin={0} aria-valuemax={9} aria-valuenow={s.val}
            />
            <span className="slider-val" style={{ color: s.color }}>{s.val}</span>
          </div>
        ))}
      </div>

      {/* Callout */}
      <div className="pv-callout" aria-live="polite">
        {callout || 'Drag the sliders to change each digit. Watch the decimal update! 🎚️'}
      </div>

      {/* Action buttons */}
      <div style={{ textAlign: 'center', marginTop: 14, display: 'flex', gap: 10, justifyContent: 'center' }}>
        {!confirmed ? (
          <button className="btn btn-primary" onClick={handleConfirm} aria-label="Confirm decimal">
            ✓ Confirm This Decimal
          </button>
        ) : (
          <button className="btn btn-secondary btn-sm" onClick={handleTryAnother} aria-label="Explore another value">
            Explore Another →
          </button>
        )}
      </div>
    </div>
  );
}
