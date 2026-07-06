import { useEffect, useState } from 'react';

export default function BadgeToast({ badge, onDismiss }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShow(true), 50);
    const t2 = setTimeout(() => { setShow(false); setTimeout(onDismiss, 400); }, 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDismiss]);

  if (!badge) return null;

  return (
    <div
      className={`badge-toast ${show ? 'show' : ''}`}
      role="status"
      aria-live="polite"
      aria-label={`Badge unlocked: ${badge.label}`}
    >
      <span aria-hidden="true">{badge.label.split(' ')[0]}</span>
      <div>
        <div style={{ fontWeight: 800, fontSize: 14 }}>Badge Unlocked!</div>
        <div style={{ fontWeight: 600, fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
          {badge.label.slice(badge.label.indexOf(' ') + 1)}
        </div>
      </div>
    </div>
  );
}
