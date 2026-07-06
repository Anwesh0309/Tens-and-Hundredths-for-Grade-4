import { useMemo } from 'react';

const COLORS = ['#ffc107', '#4caf50', '#e91e8c', '#2196f3', '#ff5722', '#9c27b0', '#00bcd4'];

export default function Confetti() {
  const pieces = useMemo(() => {
    return Array.from({ length: 40 }, (_, i) => ({
      left: `${(i * 17 + 5) % 100}%`,
      color: COLORS[i % COLORS.length],
      size: `${6 + (i % 5) * 3}px`,
      delay: `${(i * 0.15) % 4}s`,
      duration: `${3 + (i % 4)}s`,
    }));
  }, []);

  return (
    <div className="confetti-container" aria-hidden="true">
      {pieces.map((p, i) => (
        <div
          key={i}
          className="confetti-piece"
          style={{
            left: p.left,
            top: '-20px',
            width: p.size,
            height: p.size,
            background: p.color,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
    </div>
  );
}
