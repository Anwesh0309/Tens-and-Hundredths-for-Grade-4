import { useState, useEffect, useRef, useMemo } from 'react';
import { narrate, stopNarration } from '../../utils/audio.js';
import { reflectJournalNarration } from '../../utils/narration.js';
import { WORLDS } from '../../data/questionBank.js';
import { calcStars, getEncouragementMessage } from '../../utils/scoring.js';
import Confetti from '../shared/Confetti.jsx';
import { getBadgeById } from '../../utils/badgeEngine.js';

export default function ReflectPhase({ worldScores, xp, maxStreak, badges, onPlayAgain, onHome, audioEnabled }) {
  const [showJournal, setShowJournal] = useState(false);
  const [journalText, setJournalText] = useState('');
  const narRef = useRef(null);

  const totalCorrect = worldScores.reduce((sum, ws) => sum + (ws || 0), 0);
  const totalQ = worldScores.filter(ws => ws !== null).length * 10;
  const pct = totalQ > 0 ? Math.round((totalCorrect / totalQ) * 100) : 0;

  const totalStars = useMemo(() => {
    return worldScores.reduce((sum, ws) => {
      if (ws === null) return sum;
      return sum + calcStars(ws);
    }, 0);
  }, [worldScores]);

  const encouragement = getEncouragementMessage(totalCorrect, Math.max(totalQ, 1));

  useEffect(() => {
    stopNarration();
    const segs = reflectJournalNarration();
    const t = setTimeout(() => narrate(segs, audioEnabled), 800);
    return () => { clearTimeout(t); stopNarration(); };
  }, [audioEnabled]);

  return (
    <>
      <Confetti />
      <div className="reflect-screen" role="main" aria-label="Reflect Phase - Results">
        <div className="reflect-card">
          {/* Trophy */}
          <span className="reflect-trophy" aria-hidden="true">🏆</span>
          <h2 className="reflect-title">Journey Complete!</h2>
          <p className="reflect-sub">You finished all 5 phases!</p>

          {/* Score ring */}
          <div className="score-ring-wrap">
            <div
              className="score-ring"
              style={{ '--pct': pct }}
              role="img"
              aria-label={`Score: ${pct}%, ${totalCorrect} out of ${totalQ} correct`}
            >
              <div className="score-ring-text">
                <span className="score-ring-pct">{pct}%</span>
                <span className="score-ring-fraction">{totalCorrect}/{totalQ}</span>
              </div>
            </div>
          </div>

          {/* Stars */}
          <div className="reflect-stars-row" aria-label={`Total stars: ${totalStars} out of 30`}>
            {Array(3).fill(0).map((_, i) => (
              <span key={i} style={{ opacity: i < Math.round(totalStars / 3) ? 1 : 0.3 }}>
                {i < Math.round(totalStars / 3) ? '⭐' : '☆'}
              </span>
            ))}
          </div>

          {/* Stats */}
          <div className="reflect-stats-row">
            <div className="reflect-stat">
              <span className="reflect-stat-val">{xp}</span>
              <span className="reflect-stat-label">XP Earned</span>
            </div>
            <div className="reflect-stat">
              <span className="reflect-stat-val">🔥 {maxStreak}</span>
              <span className="reflect-stat-label">Max Streak</span>
            </div>
            <div className="reflect-stat">
              <span className="reflect-stat-val">{badges.length}/6</span>
              <span className="reflect-stat-label">Badges</span>
            </div>
          </div>

          {/* World breakdown */}
          <div className="reflect-world-list" role="list" aria-label="World scores">
            {WORLDS.map((w, i) => {
              const ws = worldScores[i];
              if (ws === null) return null;
              const stars = calcStars(ws);
              return (
                <div key={w.id} className="reflect-world-row" role="listitem">
                  <span className="wname">{w.icon} {w.name}</span>
                  <span>{ws}/10</span>
                  <span className="wstars" aria-label={`${stars} stars`}>
                    {Array(3).fill(0).map((_, si) => (
                      <span key={si}>{si < stars ? '⭐' : '☆'}</span>
                    ))}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Badges */}
          {badges.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#ffc107', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
                Badges Unlocked
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                {badges.map(id => {
                  const b = getBadgeById(id);
                  return b ? (
                    <span key={id} title={b.description} style={{
                      background: 'rgba(255,193,7,0.15)', border: '1px solid rgba(255,193,7,0.3)',
                      borderRadius: 20, padding: '4px 10px', fontSize: 12, fontWeight: 700, color: '#ffd54f'
                    }}>
                      {b.label}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Mascot */}
          <div className="reflect-mascot-row">
            <div className="reflect-mascot" aria-hidden="true">🐻</div>
            <div className="reflect-mascot-bubble">{encouragement}</div>
          </div>

          {/* Journal */}
          {!showJournal ? (
            <button className="btn btn-outline btn-sm" onClick={() => setShowJournal(true)} style={{ marginBottom: 14, width: '100%' }}>
              📓 Write in your journal
            </button>
          ) : (
            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>
                Tell me one thing you learned about decimals today!
              </p>
              <textarea
                value={journalText}
                onChange={e => setJournalText(e.target.value)}
                placeholder="I learned that..."
                style={{
                  width: '100%', minHeight: 80, background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: '10px 14px',
                  color: '#fff', fontSize: 14, fontFamily: 'Nunito, sans-serif',
                  resize: 'vertical', outline: 'none'
                }}
                aria-label="Journal entry"
              />
            </div>
          )}

          {/* CTAs */}
          <div className="reflect-ctas">
            <button className="btn btn-primary" onClick={onPlayAgain} aria-label="Practice again from the beginning">
              🎮 Practice Again
            </button>
            <button className="btn btn-secondary" onClick={onHome} aria-label="Return to home screen">
              🏠 Home
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
