import { useState, useRef } from 'react';

const STATEMENTS = [
  { text: "0.7 is smaller than 0.65 because 7 < 65.", isTrue: false,
    explanation: "FALSE — Compare tenths first: 0.7 has 7 tenths, 0.65 has 6 tenths. So 0.7 > 0.65." },
  { text: "0.30 is NOT the same as 0.3.", isTrue: false,
    explanation: "FALSE — 0.30 = 0.3. Trailing zeros after the decimal don't change the value." },
  { text: "0.5 is greater than 0.05.", isTrue: true,
    explanation: "TRUE — 0.5 = 5 tenths, 0.05 = 5 hundredths. Tenths are 10× larger than hundredths." },
  { text: "The digit 4 in 6.47 is worth 0.04.", isTrue: false,
    explanation: "FALSE — In 6.47 the digit 4 is in the tenths place, so it is worth 0.4, not 0.04." },
  { text: "0.9 is greater than 0.89.", isTrue: true,
    explanation: "TRUE — 0.9 = 0.90 has 9 tenths; 0.89 has only 8 tenths. So 0.9 > 0.89." },
  { text: "0.10 equals 0.1.", isTrue: true,
    explanation: "TRUE — Trailing zeros don't change value. 0.10 = 0.1 = 1 tenth." },
  { text: "0.09 is greater than 0.1.", isTrue: false,
    explanation: "FALSE — 0.09 = 9 hundredths, 0.1 = 10 hundredths. So 0.09 < 0.1." },
];

export default function SpotErrorStation({ isComplete, onComplete, audioEnabled }) {
  const [stIdx, setStIdx] = useState(0);
  const [selected, setSelected] = useState(null);   // 'true' | 'false'
  const [submitted, setSubmitted] = useState(false);
  const completedRef = useRef(false);

  const stmt = STATEMENTS[stIdx];
  const isCorrect = submitted && (selected === 'true') === stmt.isTrue;

  const handleSelect = (val) => {
    if (submitted) return;
    setSelected(val);
  };

  const handleSubmit = () => {
    if (!selected || submitted) return;
    setSubmitted(true);
    const correct = (selected === 'true') === stmt.isTrue;
    // Call onComplete immediately on first correct answer — no setTimeout, no auto-navigate
    if (correct && !completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  };

  // Move to next statement (user choice, not automatic)
  const handleNextStatement = () => {
    setStIdx(i => (i + 1) % STATEMENTS.length);
    setSelected(null);
    setSubmitted(false);
  };

  return (
    <div>
      {/* Counter */}
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 10, textAlign: 'right', fontWeight: 700 }}>
        Statement {stIdx + 1} of {STATEMENTS.length}
      </div>

      {/* Statement card */}
      <div className="spot-error-statement" role="region" aria-label="Decimal statement to evaluate">
        "{stmt.text}"
      </div>

      {/* True / False buttons */}
      <div className="spot-tf-row" role="group" aria-label="True or false?">
        <button
          className={`spot-tf-btn true-btn ${selected === 'true' ? 'selected' : ''}`}
          onClick={() => handleSelect('true')}
          disabled={submitted}
          aria-pressed={selected === 'true'}
        >
          ✅ True
        </button>
        <button
          className={`spot-tf-btn false-btn ${selected === 'false' ? 'selected' : ''}`}
          onClick={() => handleSelect('false')}
          disabled={submitted}
          aria-pressed={selected === 'false'}
        >
          ❌ False
        </button>
      </div>

      {/* Submit button */}
      {!submitted && (
        <div style={{ textAlign: 'center', marginBottom: 10 }}>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={!selected}>
            ✓ Submit Answer
          </button>
        </div>
      )}

      {/* Result + explanation */}
      {submitted && (
        <div className="spot-explanation" role="alert" aria-live="assertive">
          <div style={{ fontSize: 24, marginBottom: 6 }}>
            {isCorrect ? '🎉' : '💡'}
          </div>
          <div className={isCorrect ? 'correct-text' : 'wrong-text'}>
            {isCorrect ? 'Correct! Great reasoning!' : 'Not quite — here\'s the explanation:'}
          </div>
          <div style={{ marginTop: 6, fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.55 }}>
            {stmt.explanation}
          </div>

          {/* User-controlled "next statement" button — never automatic */}
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleNextStatement}
            style={{ marginTop: 12 }}
            aria-label="Try next statement"
          >
            {isCorrect ? 'Try Another Statement →' : 'Try Next →'}
          </button>
        </div>
      )}
    </div>
  );
}
