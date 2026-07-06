// Badge unlock logic

export const BADGES = [
  {
    id: 'tenths_trailblazer',
    label: '🏅 Tenths Trailblazer',
    description: 'Complete Wonder & Story phases',
    condition: (s) => s.phaseComplete.wonder && s.phaseComplete.story,
  },
  {
    id: 'grid_master',
    label: '🥈 Grid Master',
    description: 'Complete all 4 simulation stations',
    condition: (s) => s.simStationsComplete && s.simStationsComplete.every(Boolean),
  },
  {
    id: 'decimal_champion',
    label: '🥇 Decimal Champion',
    description: 'Score 80%+ across the Play phase',
    condition: (s) => {
      const totalCorrect = s.worldScores.reduce((sum, ws) => sum + (ws || 0), 0);
      return totalCorrect >= 80;
    },
  },
  {
    id: 'perfect_hundredth',
    label: '💎 Perfect Hundredth',
    description: 'Score 10/10 in any world',
    condition: (s) => s.worldScores.some(ws => ws === 10),
  },
  {
    id: 'streak_legend',
    label: '🔥 Streak Legend',
    description: 'Achieve a 10-answer streak',
    condition: (s) => s.maxStreak >= 10,
  },
  {
    id: 'full_journey',
    label: '🌟 Full Journey',
    description: 'Complete all 5 phases',
    condition: (s) => s.phaseComplete && Object.values(s.phaseComplete).every(Boolean),
  },
];

export function checkBadges(state) {
  return BADGES
    .filter(b => !state.badges.includes(b.id) && b.condition(state))
    .map(b => b.id);
}

export function getBadgeById(id) {
  return BADGES.find(b => b.id === id);
}
