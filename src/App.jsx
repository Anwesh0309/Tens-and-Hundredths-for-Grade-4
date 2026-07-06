import { useReducer, useEffect, useCallback, useRef } from 'react';
import FloatingNumbers from './components/FloatingNumbers.jsx';
import IntroScreen from './components/IntroScreen.jsx';
import WonderPhase from './components/phases/WonderPhase.jsx';
import StoryPhase from './components/phases/StoryPhase.jsx';
import SimulatePhase from './components/phases/SimulatePhase.jsx';
import PlayPhase from './components/phases/PlayPhase.jsx';
import ReflectPhase from './components/phases/ReflectPhase.jsx';
import BadgeToast from './components/shared/BadgeToast.jsx';
import { checkBadges, getBadgeById } from './utils/badgeEngine.js';
import { generateSessionQuestions } from './data/questionBank.js';
import { stopNarration } from './utils/audio.js';

const initialState = {
  phase: 'intro',
  currentSimStation: 0,
  simStationsComplete: [false, false, false, false],
  questionSet: [],
  currentWorld: 0,
  worldScores: Array(10).fill(null),
  xp: 0,
  totalStars: 0,
  streak: 0,
  maxStreak: 0,
  badges: [],
  phaseComplete: { wonder: false, story: false, simulate: false, play: false, reflect: false },
  sessionId: Math.random().toString(36).slice(2),
  audioEnabled: true,
  toastBadge: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_PHASE': return { ...state, phase: action.phase };
    case 'COMPLETE_PHASE': return { ...state, phaseComplete: { ...state.phaseComplete, [action.phase]: true } };
    case 'LOAD_QUESTIONS': return { ...state, questionSet: action.questions, currentWorld: 0, worldScores: Array(10).fill(null) };
    case 'COMPLETE_WORLD': {
      const newScores = [...state.worldScores];
      newScores[action.worldIndex] = action.score;
      const totalStars = newScores.reduce((sum, s) => {
        if (s === null) return sum;
        if (s >= 9) return sum + 3;
        if (s >= 7) return sum + 2;
        if (s >= 5) return sum + 1;
        return sum;
      }, 0);
      return { ...state, worldScores: newScores, totalStars };
    }
    case 'ADD_XP': return { ...state, xp: state.xp + action.amount };
    case 'UPDATE_STREAK': {
      const streak = action.correct ? state.streak + 1 : 0;
      return { ...state, streak, maxStreak: Math.max(state.maxStreak, streak) };
    }
    case 'COMPLETE_SIM_STATION': {
      const newComplete = [...state.simStationsComplete];
      newComplete[action.station] = true;
      return { ...state, simStationsComplete: newComplete };
    }
    case 'UNLOCK_BADGE':
      if (state.badges.includes(action.badgeId)) return state;
      return { ...state, badges: [...state.badges, action.badgeId], toastBadge: action.badgeId };
    case 'CLEAR_TOAST': return { ...state, toastBadge: null };
    case 'TOGGLE_AUDIO': return { ...state, audioEnabled: !state.audioEnabled };
    case 'RESET_SESSION': {
      const qs = generateSessionQuestions();
      return { ...initialState, questionSet: qs, sessionId: Math.random().toString(36).slice(2) };
    }
    default: return state;
  }
}

const PHASES = [
  { id: 'wonder',   label: 'Wonder',   icon: '🔍', num: '01' },
  { id: 'story',    label: 'Story',    icon: '📖', num: '02' },
  { id: 'simulate', label: 'Simulate', icon: '✏️',  num: '03' },
  { id: 'play',     label: 'Play',     icon: '🎮', num: '04' },
  { id: 'reflect',  label: 'Reflect',  icon: '🪞', num: '05' },
];

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const toastTimer = useRef(null);

  // Always reset on load
  useEffect(() => {
    dispatch({ type: 'RESET_SESSION' });
    localStorage.removeItem('intellia_decimal_grid_v1');
  }, []);

  // Badge checker
  useEffect(() => {
    const newBadges = checkBadges(state);
    newBadges.forEach(id => dispatch({ type: 'UNLOCK_BADGE', badgeId: id }));
  }, [state.phaseComplete, state.worldScores, state.maxStreak, state.simStationsComplete]);

  // Auto-hide badge toast
  useEffect(() => {
    if (state.toastBadge) {
      clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => dispatch({ type: 'CLEAR_TOAST' }), 3000);
    }
    return () => clearTimeout(toastTimer.current);
  }, [state.toastBadge]);

  const goTo = useCallback((phase) => { stopNarration(); dispatch({ type: 'SET_PHASE', phase }); }, []);
  const completePhase = useCallback((phase) => dispatch({ type: 'COMPLETE_PHASE', phase }), []);

  const handleCompleteWorld = useCallback((worldIndex, score) => {
    dispatch({ type: 'COMPLETE_WORLD', worldIndex, score });
    dispatch({ type: 'ADD_XP', amount: score * 10 });
  }, []);

  const handleStreakUpdate = useCallback((correct) => {
    dispatch({ type: 'UPDATE_STREAK', correct });
    if (correct) dispatch({ type: 'ADD_XP', amount: state.streak >= 4 ? 15 : 10 });
  }, [state.streak]);

  const handleReset = useCallback(() => {
    dispatch({ type: 'RESET_SESSION' });
    goTo('intro');
  }, [goTo]);

  const renderPhase = () => {
    switch (state.phase) {
      case 'intro':
        return <IntroScreen onBegin={() => goTo('wonder')} audioEnabled={state.audioEnabled} />;
      case 'wonder':
        return <WonderPhase onComplete={() => { completePhase('wonder'); goTo('story'); }} audioEnabled={state.audioEnabled} />;
      case 'story':
        return <StoryPhase onComplete={() => { completePhase('story'); goTo('simulate'); }} audioEnabled={state.audioEnabled} />;
      case 'simulate':
        return <SimulatePhase
          stationsComplete={state.simStationsComplete}
          onCompleteStation={(id) => dispatch({ type: 'COMPLETE_SIM_STATION', station: id })}
          onComplete={() => { completePhase('simulate'); goTo('play'); }}
          audioEnabled={state.audioEnabled} />;
      case 'play':
        return <PlayPhase
          questionSet={state.questionSet}
          worldScores={state.worldScores}
          xp={state.xp}
          streak={state.streak}
          maxStreak={state.maxStreak}
          onCompleteWorld={handleCompleteWorld}
          onStreakUpdate={handleStreakUpdate}
          onComplete={() => { completePhase('play'); goTo('reflect'); }}
          audioEnabled={state.audioEnabled} />;
      case 'reflect':
        return <ReflectPhase
          worldScores={state.worldScores}
          xp={state.xp}
          maxStreak={state.maxStreak}
          badges={state.badges}
          onPlayAgain={handleReset}
          onHome={handleReset}
          audioEnabled={state.audioEnabled} />;
      default: return null;
    }
  };

  const phaseIndex = PHASES.findIndex(p => p.id === state.phase);

  return (
    <div className="app-shell">
      <FloatingNumbers />

      {/* Top bar — transparent, no border */}
      {state.phase !== 'intro' && (
        <header className="top-bar">
          <button className="home-btn" onClick={handleReset} aria-label="Return home">
            🏠 Home
          </button>

          <nav className="phase-nav" aria-label="Learning phases">
            {PHASES.map((ph, i) => {
              const isActive = state.phase === ph.id;
              const isCompleted = state.phaseComplete[ph.id];
              const isPast = phaseIndex > i;
              return (
                <div key={ph.id} style={{ display: 'flex', alignItems: 'center' }}>
                  {i > 0 && <div className={`phase-connector ${isPast || isCompleted ? 'done' : ''}`} />}
                  <div className={`phase-pill ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                    aria-current={isActive ? 'step' : undefined}>
                    <span>{isCompleted ? '✓' : ph.icon}</span>
                    <span className="phase-label">{ph.label}</span>
                  </div>
                </div>
              );
            })}
          </nav>

          <button className="audio-btn" onClick={() => dispatch({ type: 'TOGGLE_AUDIO' })}
            aria-label={state.audioEnabled ? 'Mute audio' : 'Unmute audio'}>
            {state.audioEnabled ? '🔊' : '🔇'}
          </button>
        </header>
      )}

      <main className="phase-content" role="main">
        {renderPhase()}
      </main>

      {state.toastBadge && (
        <BadgeToast badge={getBadgeById(state.toastBadge)} onDismiss={() => dispatch({ type: 'CLEAR_TOAST' })} />
      )}
    </div>
  );
}
