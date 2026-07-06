import { useMemo } from 'react';

const DECIMAL_STRINGS = [
  '0.1','0.5','0.01','0.75','0.3','0.99','0.25',
  '1/10','3.4','0.07','0.50','2.6','0.08','7/10',
  '100','0.9','0.45','1.2','0.6','3/10','0.35',
  '0.4','0.2','1.5','0.03','0.70','0.60','0.15',
];

export default function FloatingNumbers() {
  const items = useMemo(() => {
    return DECIMAL_STRINGS.map((str, i) => ({
      str,
      top: `${5 + (i * 31) % 90}%`,
      left: `${3 + (i * 37) % 95}%`,
      size: `${1.2 + (i % 5) * 0.6}rem`,
      delay: `${(i * 1.3) % 8}s`,
      duration: `${14 + (i % 7) * 3}s`,
    }));
  }, []);

  return (
    <div className="floating-numbers" aria-hidden="true">
      {items.map((item, i) => (
        <span
          key={i}
          className="float-num"
          style={{
            top: item.top,
            left: item.left,
            fontSize: item.size,
            animationDelay: item.delay,
            animationDuration: item.duration,
          }}
        >
          {item.str}
        </span>
      ))}
    </div>
  );
}
