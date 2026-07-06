import { useEffect, useRef } from 'react';

const CORRECT_MSGS = [
  "Amazing decimal work! 🎉",
  "You nailed it! ⭐",
  "That's exactly right! 🏆",
  "Outstanding! 🔥",
  "Brilliant! Keep it up! 🌟",
];

const WRONG_MSGS = [
  "Let's look at the place value again.",
  "Check the tenths and hundredths columns!",
  "Keep going — you've got this!",
];

export default function FeedbackPopup({ isCorrect, explanation, correctAnswer, onContinue }) {
  const msgRef = useRef(
    isCorrect
      ? CORRECT_MSGS[Math.floor(Math.random() * CORRECT_MSGS.length)]
      : WRONG_MSGS[Math.floor(Math.random() * WRONG_MSGS.length)]
  );

  // Auto-dismiss after exactly 1 second then call onContinue
  useEffect(() => {
    const t = setTimeout(() => {
      onContinue();
    }, 1000);
    return () => clearTimeout(t);
  }, [onContinue]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
      aria-live="assertive"
    >
      <div
        style={{
          background: isCorrect
            ? 'linear-gradient(145deg, #2ecc71, #27ae60)'
            : 'linear-gradient(145deg, #e74c3c, #c0392b)',
          borderRadius: 20,
          padding: '32px 40px',
          textAlign: 'center',
          minWidth: 260,
          maxWidth: 340,
          boxShadow: isCorrect
            ? '0 12px 40px rgba(46,204,113,0.45)'
            : '0 12px 40px rgba(231,76,60,0.45)',
          animation: 'popupIn 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards',
          pointerEvents: 'auto',
        }}
        role="dialog"
        aria-modal="true"
        aria-label={isCorrect ? 'Correct answer' : 'Incorrect answer'}
      >
        {/* Big emoji */}
        <div style={{ fontSize: 52, marginBottom: 12, animation: 'bounceIn 0.4s ease' }}>
          {isCorrect ? '🎉' : '😢'}
        </div>

        {/* Title */}
        <div style={{
          fontFamily: 'Fredoka, Nunito, sans-serif',
          fontSize: '1.6rem',
          fontWeight: 700,
          color: '#ffffff',
          marginBottom: 8,
          letterSpacing: '0.01em',
        }}>
          {isCorrect ? 'Correct! 🎉' : 'Not quite!'}
        </div>

        {/* Explanation / correct answer */}
        <div style={{
          fontFamily: 'Nunito, sans-serif',
          fontSize: '0.92rem',
          fontWeight: 600,
          color: 'rgba(255,255,255,0.92)',
          lineHeight: 1.5,
        }}>
          {isCorrect
            ? explanation || msgRef.current
            : correctAnswer !== undefined
              ? `The correct answer is: ${correctAnswer}.`
              : msgRef.current
          }
        </div>
      </div>
    </div>
  );
}
