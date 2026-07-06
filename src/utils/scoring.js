// Scoring utilities

export const XP_TABLE = {
  correctFirstTry: 10,
  correctSecondTry: 7,
  correctWithHint: 5,
  streakBonus: 5,
};

export function calcXP(attemptNumber, hintsUsed, streak) {
  const base = attemptNumber === 1
    ? XP_TABLE.correctFirstTry
    : hintsUsed > 0
      ? XP_TABLE.correctWithHint
      : XP_TABLE.correctSecondTry;
  const streakBonus = streak >= 5 ? XP_TABLE.streakBonus : 0;
  return base + streakBonus;
}

export function calcStars(correct, total = 10) {
  if (correct >= 9) return 3;
  if (correct >= 7) return 2;
  if (correct >= 5) return 1;
  return 0;
}

// Every completed world (even 0/10) unlocks the next
export function canUnlockWorld(worldScore) {
  return worldScore !== null;
}

export function getEncouragementMessage(score, total) {
  const pct = (score / total) * 100;
  if (pct >= 90) return "Outstanding! You're a decimal champion! 🏆";
  if (pct >= 70) return "Well done! You understand decimals really well! ⭐";
  if (pct >= 50) return "Good effort! Keep practising and you'll get there! 💪";
  return "Good start! Try again to improve! 📚";
}

export function calcTotalScore(worldScores) {
  return worldScores.reduce((sum, ws) => sum + (ws || 0), 0);
}
