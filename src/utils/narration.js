// Phase-specific narration scripts — Decimal Grid module
import { say, ask, cheer, emphasize, celebrate, instruct } from './audio.js';

export function wonderNarration() {
  return [
    say("Hmm... I wonder..."),
    ask("Emma has three dollars and forty-five cents. Her friend has three dollars and fifty cents. Who has more money?"),
    say("What if it's not always the number with more digits that's bigger?"),
    instruct("Let's investigate decimals together and find out!"),
  ];
}

export function getStoryNarration(panelIndex) {
  const scripts = [
    // Panel 1
    [
      say("Oliver is baking croissants for his family."),
      say("The recipe says he needs zero point five cup of flour."),
      ask("How much is zero point five exactly?"),
      cheer("Let's help Oliver find out!"),
    ],
    // Panel 2
    [
      instruct("Oliver draws a ten-by-ten grid."),
      say("Each small square is one hundredth — written zero point zero one."),
      emphasize("A full row of ten squares equals one tenth — zero point one."),
      say("Oliver shades five full rows to show zero point five. That's exactly half the grid — fifty squares!"),
    ],
    // Panel 3
    [
      say("Oliver's sister Sophie needs zero point seven five cup of sugar."),
      emphasize("She says: That's 7 tenths and 5 hundredths!"),
      say("She shades 75 squares on her grid — 7 full rows and 5 more squares."),
      ask("Which is more — zero point five, or zero point seven five?"),
    ],
    // Panel 4
    [
      instruct("Oliver and Sophie place their numbers on a number line from zero to one."),
      say("Zero point five lands right in the middle."),
      emphasize("Zero point seven five is between zero point five and one."),
      say("Compare tenths first — 7 is greater than 5, so zero point seven five is greater than zero point five!"),
      celebrate("You're ready to explore decimals!"),
    ],
  ];
  return scripts[panelIndex] || [];
}

export function simulateStationIntro(stationId) {
  const intros = {
    0: [instruct("Station A: Grid Shader. Shade squares on the hundred grid to build a decimal. Try shading a full row — that's one tenth!")],
    1: [instruct("Station B: Place Value Slider. Drag the sliders to change the ones, tenths, and hundredths digits. Watch the number update live!")],
    2: [instruct("Station C: Number Line. Drag the marker to place your decimal exactly on the number line. Try zooming in to see hundredths!")],
    3: [instruct("Station D: Spot the Error. Is the decimal statement true or false? Find the mistake and fix the place-value reasoning!")],
  };
  return intros[stationId] || [];
}

export function playQuestionNarration(question) {
  return [ask(question.questionText)];
}

export function reflectJournalNarration() {
  return [
    celebrate("Journey complete! Amazing work on decimals!"),
    ask("Tell me one thing you learned about tenths and hundredths today!"),
    cheer("Keep exploring numbers — you're doing brilliantly!"),
  ];
}
