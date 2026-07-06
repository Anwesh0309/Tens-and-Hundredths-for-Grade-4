import { useState, useCallback, useEffect, useRef } from 'react';
import { WORLDS, shuffleArray } from '../../data/questionBank.js';
import { calcStars } from '../../utils/scoring.js';
import { narrate, stopNarration, SOUND_EFFECTS } from '../../utils/audio.js';
import { playQuestionNarration } from '../../utils/narration.js';
import FeedbackPopup from '../shared/FeedbackPopup.jsx';

export default function PlayPhase({
  questionSet, worldScores, xp, maxStreak,
  onCompleteWorld, onStreakUpdate, onComplete, audioEnabled
}) {
  const [view, setView] = useState('map');
  const [activeWorld, setActiveWorld] = useState(null);
  const [worldQuestions, setWorldQuestions] = useState([]);
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [localStreak, setLocalStreak] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [answered, setAnswered] = useState(false);

  // Track score in a ref so handleNextQuestion always sees latest value
  const scoreRef = useRef(0);
  const autoNextRef = useRef(null);

  const startWorld = useCallback((worldIdx) => {
    stopNarration();
    const wqs = questionSet.filter(q => q.world === worldIdx);
    const shuffled = shuffleArray(wqs).slice(0, 10);
    setWorldQuestions(shuffled);
    setQIndex(0);
    scoreRef.current = 0;
    setScore(0);
    setLocalStreak(0);
    setFeedback(null);
    setSelectedOption(null);
    setAnswered(false);
    setActiveWorld(worldIdx);
    setView('quiz');
  }, [questionSet]);

  const currentQ = worldQuestions[qIndex];

  // Narrate current question — stop previous audio first to prevent glitch
  useEffect(() => {
    if (view !== 'quiz' || !currentQ) return;
    stopNarration();
    // Small delay so stop fully clears before new audio starts
    const t = setTimeout(() => {
      narrate(playQuestionNarration(currentQ), audioEnabled);
    }, 120);
    return () => {
      clearTimeout(t);
      stopNarration();
    };
  }, [view, qIndex, currentQ?.id, audioEnabled]); // use currentQ.id not currentQ object ref

  // Move to next question or back to map
  const handleNextQuestion = useCallback((wasCorrect) => {
    clearTimeout(autoNextRef.current);
    setFeedback(null);
    setSelectedOption(null);
    setAnswered(false);

    const nextIdx = qIndex + 1;
    if (nextIdx >= worldQuestions.length) {
      // World complete — use scoreRef for up-to-date value
      const finalScore = scoreRef.current;
      onCompleteWorld(activeWorld, finalScore);
      SOUND_EFFECTS.levelUp();
      stopNarration();
      setView('map');
    } else {
      setQIndex(nextIdx);
    }
  }, [qIndex, worldQuestions.length, activeWorld, onCompleteWorld]);

  const handleAnswer = useCallback((option) => {
    if (answered) return;
    setSelectedOption(option);
    setAnswered(true);
    stopNarration(); // stop question narration immediately on answer

    const correct = String(option) === String(currentQ.correctAnswer);

    if (correct) {
      SOUND_EFFECTS.correct();
      const newStreak = localStreak + 1;
      setLocalStreak(newStreak);
      scoreRef.current = scoreRef.current + 1;
      setScore(s => s + 1);
      onStreakUpdate(true);
    } else {
      SOUND_EFFECTS.wrong();
      setLocalStreak(0);
      onStreakUpdate(false);
    }

    setFeedback({
      isCorrect: correct,
      explanation: currentQ.explanation,
      correctAnswer: currentQ.correctAnswer,
    });

    // Auto-advance after 1 second (FeedbackPopup also fires onContinue at 1s)
    autoNextRef.current = setTimeout(() => {
      handleNextQuestion(correct);
    }, 1100); // slightly after popup dismisses itself at 1000ms
  }, [answered, currentQ, localStreak, onStreakUpdate, handleNextQuestion]);

  // Cleanup timer on unmount
  useEffect(() => () => {
    clearTimeout(autoNextRef.current);
    stopNarration();
  }, []);

  // ── World Map ──
  const allWorldsDone = worldScores.every(s => s !== null);

  if (view === 'map') {
    return (
      <div className="play-screen" role="main" aria-label="Play Phase — World Map">
        <div style={{ textAlign: 'center' }}>
          <h2 className="play-title">🎮 Play — Choose Your World!</h2>
          <p className="play-subtitle">Answer questions in each world. Earn stars and XP!</p>
        </div>

        <div className="world-grid" role="list">
          {WORLDS.map((world, i) => {
            const ws = worldScores[i];
            // World 0 always unlocked; world N unlocked if world N-1 is completed (any score including 0)
            const isUnlocked = i === 0 || worldScores[i - 1] !== null;
            const isCompleted = ws !== null;
            const isCurrent = isUnlocked && !isCompleted;
            const stars = isCompleted ? calcStars(ws) : 0;

            return (
              <div
                key={world.id}
                className={[
                  'world-card',
                  isUnlocked ? 'unlocked' : 'locked',
                  isCurrent ? 'current' : '',
                  isCompleted ? 'completed' : '',
                ].join(' ')}
                role="listitem"
                aria-label={`${world.name}${!isUnlocked ? ' (locked)' : ''}`}
              >
                {!isUnlocked && (
                  <span className="world-lock-icon" aria-hidden="true">🔒</span>
                )}
                <span className="world-icon" aria-hidden="true">{world.icon}</span>
                <span className="world-name">{world.name}</span>
                <span className="world-qs">Q {world.qStart}–{world.qEnd}</span>

                {isCompleted ? (
                  <>
                    <span className="world-stars" aria-label={`${stars} stars`}>
                      {[0,1,2].map(si => <span key={si}>{si < stars ? '⭐' : '☆'}</span>)}
                    </span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
                      {ws}/10 correct
                    </span>
                    {/* Replay button */}
                    <button
                      className="world-play-btn"
                      onClick={() => startWorld(i)}
                      style={{ background: '#7c5cbf', marginTop: 2 }}
                      aria-label={`Replay ${world.name}`}
                    >
                      ↺ REPLAY
                    </button>
                  </>
                ) : isUnlocked ? (
                  <button
                    className="world-play-btn"
                    onClick={() => startWorld(i)}
                    aria-label={`Play ${world.name}`}
                  >
                    ▶ PLAY
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>

        {/* Stats */}
        <div style={{
          display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap',
          fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.6)',
        }}>
          <span>⭐ {xp} XP</span>
          <span>🔥 Best streak: {maxStreak}</span>
        </div>

        {allWorldsDone && (
          <button className="btn btn-primary btn-lg" onClick={onComplete}>
            🪞 View Results!
          </button>
        )}
      </div>
    );
  }

  // ── Quiz ──
  if (!currentQ) return null;
  const world = WORLDS[activeWorld];
  const progress = (qIndex / worldQuestions.length) * 100;

  return (
    <div className="quiz-screen" role="main" aria-label={`Quiz: ${world.name}`}>
      {/* World chip */}
      <div className="quiz-world-chip">
        {world.icon} {world.name}
      </div>

      {/* Stats */}
      <div className="quiz-stats-row" role="status">
        <span className="quiz-stars">⭐ {score}</span>
        <span className="quiz-streak">🔥 {localStreak}x</span>
      </div>

      {/* Progress */}
      <div className="quiz-progress-wrap">
        <div className="quiz-progress-label">
          <span>Question {qIndex + 1} / {worldQuestions.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div
          className="quiz-progress-bar"
          role="progressbar"
          aria-valuenow={qIndex + 1}
          aria-valuemax={worldQuestions.length}
        >
          <div className="quiz-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Question card */}
      <div
        className={`question-card ${answered && !feedback?.isCorrect ? 'shake' : ''}`}
        role="region"
        aria-label="Question"
      >
        {/* Hundred-square visual for grid reading questions */}
        {currentQ.type === 'grid_reading' && currentQ.gridShaded != null && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(10, 1fr)',
              gap: 1,
              width: 150,
              aspectRatio: '1',
            }}>
              {Array.from({ length: 100 }).map((_, i) => (
                <div key={i} style={{
                  background: i < currentQ.gridShaded
                    ? 'linear-gradient(135deg,#f5a623,#f7b733)'
                    : 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.04)',
                  borderRadius: 1,
                }} />
              ))}
            </div>
          </div>
        )}

        <p className="question-text">{currentQ.questionText}</p>

        <div className="options-grid" role="group" aria-label="Answer options">
          {currentQ.options.map((opt, i) => {
            let cls = 'option-btn';
            if (answered) {
              if (String(opt) === String(currentQ.correctAnswer)) cls += ' correct';
              else if (String(opt) === String(selectedOption)) cls += ' wrong';
            }
            return (
              <button
                key={i}
                className={cls}
                onClick={() => handleAnswer(opt)}
                disabled={answered}
                aria-label={`Option: ${opt}`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      {/* Feedback popup — shows for 1 second, then auto-advances */}
      {feedback && (
        <FeedbackPopup
          isCorrect={feedback.isCorrect}
          explanation={feedback.explanation}
          correctAnswer={feedback.correctAnswer}
          onContinue={() => handleNextQuestion(feedback.isCorrect)}
        />
      )}
    </div>
  );
}
