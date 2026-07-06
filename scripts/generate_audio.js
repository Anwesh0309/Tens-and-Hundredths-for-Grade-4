#!/usr/bin/env node
/**
 * ElevenLabs Full Audio Generation Script
 * Decimal Grid — Tenths & Hundredths | Grade 4
 *
 * Generates ALL on-screen text narrations:
 *   - Wonder, Story, Simulate, Reflect phase narrations
 *   - All 100 question texts (read-aloud during quiz)
 *   - All 100 hint1 texts
 *   - All 100 hint2 texts
 *   - All 100 explanation texts
 *   - Feedback messages, mascot lines, UI instructions
 *
 * Usage: node scripts/generate_audio.js
 * Output: public/assets/audio/decimals/*.mp3
 *         src/utils/audioMap.js
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const API_KEY = process.env.ELEVENLABS_API_KEY || 'sk_7ef27dccb32144843f8ee5068dfd4223a85326c56c14b00a';
const VOICE_ID = 'Xb7hH8MSUJpSbSDYk0k2';
const MODEL = 'eleven_multilingual_v2';
const OUT_DIR = path.join(ROOT, 'public', 'assets', 'audio', 'decimals');
const MAP_FILE = path.join(ROOT, 'src', 'utils', 'audioMap.js');
const RATE_LIMIT_MS = 520;

const STYLE_SETTINGS = {
  celebration:   { stability: 0.35, similarity_boost: 0.80, style: 0.85, use_speaker_boost: true },
  encouragement: { stability: 0.50, similarity_boost: 0.75, style: 0.60, use_speaker_boost: true },
  question:      { stability: 0.55, similarity_boost: 0.78, style: 0.45, use_speaker_boost: true },
  emphasis:      { stability: 0.45, similarity_boost: 0.80, style: 0.65, use_speaker_boost: true },
  thinking:      { stability: 0.60, similarity_boost: 0.72, style: 0.30, use_speaker_boost: false },
  statement:     { stability: 0.65, similarity_boost: 0.75, style: 0.25, use_speaker_boost: false },
  hint:          { stability: 0.58, similarity_boost: 0.76, style: 0.35, use_speaker_boost: false },
  explanation:   { stability: 0.62, similarity_boost: 0.74, style: 0.28, use_speaker_boost: false },
};

// ══════════════════════════════════════════════════════════
// PHASE NARRATIONS — Wonder, Story, Simulate, Reflect, Intro
// ══════════════════════════════════════════════════════════
const PHASE_PHRASES = [
  // Intro
  { text: "Welcome to Decimal Grid — Tenths and Hundredths!", style: 'statement' },
  { text: "Join Oliver on a journey to master decimals through stories, simulations, and fun games!", style: 'encouragement' },
  { text: "Ready for a decimal adventure?", style: 'encouragement' },

  // Wonder phase
  { text: "Hmm... I wonder...", style: 'thinking' },
  { text: "Emma has three dollars and forty-five cents. Her friend has three dollars and fifty cents. Who has more money?", style: 'question' },
  { text: "What if it's not always the number with more digits that's bigger?", style: 'emphasis' },
  { text: "It's not always the number with more digits that is bigger!", style: 'emphasis' },
  { text: "Let's investigate decimals together and find out!", style: 'encouragement' },

  // Story Panel 1
  { text: "Oliver is baking croissants for his family.", style: 'statement' },
  { text: "The recipe says he needs zero point five cup of flour.", style: 'statement' },
  { text: "How much is zero point five exactly?", style: 'question' },
  { text: "Let's help Oliver find out!", style: 'encouragement' },

  // Story Panel 2
  { text: "Oliver draws a ten-by-ten grid.", style: 'statement' },
  { text: "Each small square is one hundredth — written zero point zero one.", style: 'statement' },
  { text: "A full row of ten squares equals one tenth — zero point one.", style: 'emphasis' },
  { text: "Oliver shades five full rows to show zero point five. That's exactly half the grid — fifty squares!", style: 'statement' },
  { text: "How many squares make zero point five?", style: 'question' },

  // Story Panel 3
  { text: "Oliver's sister Sophie needs zero point seven five cup of sugar.", style: 'statement' },
  { text: "She says: That's 7 tenths and 5 hundredths!", style: 'emphasis' },
  { text: "She shades 75 squares on her grid — 7 full rows and 5 more squares.", style: 'statement' },
  { text: "Which is more — zero point five, or zero point seven five?", style: 'question' },

  // Story Panel 4
  { text: "Oliver and Sophie place their numbers on a number line from zero to one.", style: 'statement' },
  { text: "Zero point five lands right in the middle.", style: 'statement' },
  { text: "Zero point seven five is between zero point five and one.", style: 'emphasis' },
  { text: "Compare tenths first — 7 is greater than 5, so zero point seven five is greater than zero point five!", style: 'statement' },
  { text: "You're ready to explore decimals!", style: 'celebration' },
  { text: "What comes between zero point five and zero point seven five?", style: 'question' },

  // Simulate station intros
  { text: "Station A: Grid Shader. Shade squares on the hundred grid to build a decimal. Try shading a full row — that's one tenth!", style: 'statement' },
  { text: "Station B: Place Value Slider. Drag the sliders to change the ones, tenths, and hundredths digits. Watch the number update live!", style: 'statement' },
  { text: "Station C: Number Line. Tap the number line to place your decimal marker. One correct placement unlocks the next station!", style: 'statement' },
  { text: "Station D: Spot the Error. Is the decimal statement true or false? One correct answer unlocks the Play phase!", style: 'statement' },

  // Simulate feedback
  { text: "That's one tenth!", style: 'celebration' },
  { text: "Correct! Moving to the next station!", style: 'celebration' },
  { text: "Shade exactly the right number of squares for the target decimal.", style: 'hint' },
  { text: "Tap the number line to place your marker, then confirm.", style: 'statement' },
  { text: "Confirm any decimal value to unlock Station C.", style: 'statement' },
  { text: "Get one correct answer to unlock the Play phase.", style: 'statement' },

  // Reflect phase
  { text: "Journey complete! Amazing work on decimals!", style: 'celebration' },
  { text: "Tell me one thing you learned about tenths and hundredths today!", style: 'question' },
  { text: "Keep exploring numbers — you're doing brilliantly!", style: 'encouragement' },

  // Play phase UI
  { text: "Choose your world. Answer questions in each world to earn stars and experience points!", style: 'statement' },
  { text: "Amazing! You nailed it!", style: 'celebration' },
  { text: "Brilliant decimal work!", style: 'celebration' },
  { text: "Correct! You're a star!", style: 'celebration' },
  { text: "That's exactly right!", style: 'celebration' },
  { text: "Outstanding!", style: 'celebration' },
  { text: "Let's look at the place value again.", style: 'encouragement' },
  { text: "Not quite — check the column!", style: 'encouragement' },
  { text: "Keep going — you've got this!", style: 'encouragement' },
];

// ══════════════════════════════════════════════════════════
// ALL 100 QUESTIONS — question text, hint1, hint2, explanation
// ══════════════════════════════════════════════════════════
const QUESTION_PHRASES = [
  // ── Q1: Place Value ──
  { text: "In 3.7, what is the value of the digit 7?", style: 'question' },
  { text: "The digit 7 is to the right of the decimal point, in the tenths column.", style: 'hint' },
  { text: "Tenths means the value is 7 times 0.1, which equals 0.7.", style: 'hint' },
  { text: "The digit 7 is in the tenths place. Its value is 0.7.", style: 'explanation' },

  { text: "In 5.4, what is the value of the digit 4?", style: 'question' },
  { text: "The digit 4 sits in the tenths column.", style: 'hint' },
  { text: "Tenths value equals 4 times 0.1, which is 0.4.", style: 'hint' },
  { text: "Digit 4 is in the tenths place. Its value is 0.4.", style: 'explanation' },

  { text: "In 2.85, what is the value of the digit 8?", style: 'question' },
  { text: "Count positions after the decimal: the first position is tenths.", style: 'hint' },
  { text: "8 is the first digit after the decimal, so it equals 8 tenths, which is 0.8.", style: 'hint' },
  { text: "Digit 8 is in the tenths place. Its value is 0.8.", style: 'explanation' },

  { text: "In 6.23, what is the value of the digit 3?", style: 'question' },
  { text: "Count positions after the decimal: the second position is hundredths.", style: 'hint' },
  { text: "3 is the second digit after the decimal, so it equals 3 hundredths, which is 0.03.", style: 'hint' },
  { text: "Digit 3 is in the hundredths place. Its value is 0.03.", style: 'explanation' },

  { text: "In 7.56, which digit is in the hundredths place?", style: 'question' },
  { text: "Hundredths is the second position after the decimal point.", style: 'hint' },
  { text: "7.56 means: ones is 7, tenths is 5, hundredths is 6.", style: 'hint' },
  { text: "In 7.56, the digit 6 is in the hundredths place.", style: 'explanation' },

  { text: "In 4.09, what is the value of the digit 9?", style: 'question' },
  { text: "The second position after the decimal is hundredths.", style: 'hint' },
  { text: "9 hundredths equals 9 times 0.01, which is 0.09.", style: 'hint' },
  { text: "Digit 9 is in the hundredths place. Its value is 0.09.", style: 'explanation' },

  { text: "In 8.30, which digit is in the tenths place?", style: 'question' },
  { text: "Tenths is the first position after the decimal point.", style: 'hint' },
  { text: "8.30 means: ones is 8, tenths is 3, hundredths is 0.", style: 'hint' },
  { text: "In 8.30, the digit 3 is in the tenths place.", style: 'explanation' },

  { text: "In 1.47, the digit 4 represents which value?", style: 'question' },
  { text: "4 is the first digit after the decimal point.", style: 'hint' },
  { text: "The first digit after the decimal is tenths. So 4 times 0.1 equals 0.4.", style: 'hint' },
  { text: "The digit 4 is in the tenths place and has value 0.4.", style: 'explanation' },

  { text: "Which number has 5 in the hundredths place?", style: 'question' },
  { text: "Look for 5 in the second position after the decimal.", style: 'hint' },
  { text: "3.05 means: ones is 3, tenths is 0, hundredths is 5. That's the one!", style: 'hint' },
  { text: "In 3.05, the digit 5 is in the hundredths place.", style: 'explanation' },

  { text: "In 9.72, the value of 7 is 0.7 and the value of 2 is what?", style: 'question' },
  { text: "Count positions after the decimal point carefully.", style: 'hint' },
  { text: "In 9.72, 7 is in the tenths place giving 0.7, and 2 is in the hundredths place giving 0.02.", style: 'hint' },
  { text: "Digit 2 is in the hundredths place. Its value is 0.02.", style: 'explanation' },

  // ── Q2: Fraction ↔ Decimal ──
  { text: "Express 3 over 10 as a decimal.", style: 'question' },
  { text: "3 over 10 means 3 tenths.", style: 'hint' },
  { text: "3 tenths written as a decimal equals 0.3.", style: 'hint' },
  { text: "3 over 10 equals 3 tenths equals 0.3.", style: 'explanation' },

  { text: "Express 0.7 as a fraction.", style: 'question' },
  { text: "0.7 equals 7 tenths.", style: 'hint' },
  { text: "7 tenths as a fraction equals 7 over 10.", style: 'hint' },
  { text: "0.7 equals 7 over 10, which is seven tenths.", style: 'explanation' },

  { text: "Express 47 over 100 as a decimal.", style: 'question' },
  { text: "47 over 100 means 47 hundredths.", style: 'hint' },
  { text: "47 hundredths equals 0.47, which has two decimal places.", style: 'hint' },
  { text: "47 over 100 equals 47 hundredths equals 0.47.", style: 'explanation' },

  { text: "Express 0.09 as a fraction.", style: 'question' },
  { text: "0.09 has two decimal places — that means hundredths.", style: 'hint' },
  { text: "9 hundredths as a fraction equals 9 over 100.", style: 'hint' },
  { text: "0.09 equals 9 over 100, which is nine hundredths.", style: 'explanation' },

  { text: "Which decimal equals 25 over 100?", style: 'question' },
  { text: "25 over 100 equals 25 hundredths.", style: 'hint' },
  { text: "Write 25 after the decimal point: 0.25.", style: 'hint' },
  { text: "25 over 100 equals 0.25, which is twenty-five hundredths.", style: 'explanation' },

  { text: "Express 0.6 as an equivalent fraction with denominator 100.", style: 'question' },
  { text: "Multiply the numerator and denominator of 6 over 10 by 10.", style: 'hint' },
  { text: "6 over 10 multiplied by 10 over 10 equals 60 over 100.", style: 'hint' },
  { text: "0.6 equals 6 over 10 equals 60 over 100. These are equivalent fractions.", style: 'explanation' },

  { text: "Express 8 over 10 as a decimal with 2 decimal places.", style: 'question' },
  { text: "0.8 and 0.80 are the same value.", style: 'hint' },
  { text: "0.8 equals 0.80. Trailing zeros don't change the value.", style: 'hint' },
  { text: "8 over 10 equals 0.8, which is the same as 0.80. Both are correct.", style: 'explanation' },

  { text: "Which fraction equals 0.35?", style: 'question' },
  { text: "0.35 has two decimal places — that means hundredths.", style: 'hint' },
  { text: "35 hundredths equals 35 over 100.", style: 'hint' },
  { text: "0.35 equals 35 over 100, which is thirty-five hundredths.", style: 'explanation' },

  { text: "What is 1 over 4 written as a decimal?", style: 'question' },
  { text: "1 over 4 equals 25 over 100. Multiply top and bottom by 25.", style: 'hint' },
  { text: "25 over 100 equals 0.25.", style: 'hint' },
  { text: "1 over 4 equals 25 over 100 equals 0.25, which is twenty-five hundredths.", style: 'explanation' },

  { text: "Which decimal is equivalent to 1 over 2?", style: 'question' },
  { text: "1 over 2 equals 5 over 10. Multiply top and bottom by 5.", style: 'hint' },
  { text: "5 over 10 equals 0.5.", style: 'hint' },
  { text: "1 over 2 equals 5 over 10 equals 0.5, which is five tenths.", style: 'explanation' },
];

const QUESTION_PHRASES_2 = [
  // ── Q3: Grid Reading ──
  { text: "The grid has 10 squares shaded out of 100. What decimal does it show?", style: 'question' },
  { text: "10 shaded squares out of 100 equals 10 over 100.", style: 'hint' },
  { text: "10 over 100 equals 1 over 10, which equals 0.1.", style: 'hint' },
  { text: "10 out of 100 squares equals 0.1, which is one tenth.", style: 'explanation' },

  { text: "30 squares are shaded on the grid. What decimal is shown?", style: 'question' },
  { text: "30 out of 100 equals 30 over 100.", style: 'hint' },
  { text: "30 over 100 equals 3 over 10 equals 0.3.", style: 'hint' },
  { text: "30 over 100 equals 0.3, which is three tenths.", style: 'explanation' },

  { text: "Half the grid is shaded. What decimal does this represent?", style: 'question' },
  { text: "Half of 100 squares equals 50 squares.", style: 'hint' },
  { text: "50 over 100 equals 0.5.", style: 'hint' },
  { text: "50 over 100 equals 0.5, which is five tenths — exactly half.", style: 'explanation' },

  { text: "25 squares are shaded. What decimal is shown?", style: 'question' },
  { text: "25 out of 100 hundredths.", style: 'hint' },
  { text: "25 over 100 equals 0.25.", style: 'hint' },
  { text: "25 over 100 equals 0.25, which is twenty-five hundredths.", style: 'explanation' },

  { text: "70 squares are shaded. What decimal does the grid show?", style: 'question' },
  { text: "70 out of 100 squares equals 70 over 100.", style: 'hint' },
  { text: "70 over 100 equals 7 over 10 equals 0.7.", style: 'hint' },
  { text: "70 over 100 equals 0.7, which is seven tenths.", style: 'explanation' },

  { text: "63 squares are shaded. What decimal does this show?", style: 'question' },
  { text: "63 out of 100 equals 63 hundredths.", style: 'hint' },
  { text: "63 over 100 equals 0.63.", style: 'hint' },
  { text: "63 over 100 equals 0.63, which is sixty-three hundredths.", style: 'explanation' },

  { text: "Only 8 squares are shaded. What decimal is shown?", style: 'question' },
  { text: "8 out of 100 equals 8 hundredths.", style: 'hint' },
  { text: "8 over 100 equals 0.08. Remember: there's one zero after the decimal point.", style: 'hint' },
  { text: "8 over 100 equals 0.08, which is eight hundredths.", style: 'explanation' },

  { text: "A grid has 45 squares shaded. Write this as a decimal.", style: 'question' },
  { text: "45 squares out of 100 equals 45 hundredths.", style: 'hint' },
  { text: "45 over 100 equals 0.45.", style: 'hint' },
  { text: "45 over 100 equals 0.45, which is forty-five hundredths.", style: 'explanation' },

  { text: "90 squares out of 100 are shaded. What is the decimal?", style: 'question' },
  { text: "90 hundredths equals 9 tenths.", style: 'hint' },
  { text: "90 over 100 equals 9 over 10 equals 0.9.", style: 'hint' },
  { text: "90 over 100 equals 0.9, which is nine tenths.", style: 'explanation' },

  { text: "Only 5 out of 100 squares are shaded. What decimal is shown?", style: 'question' },
  { text: "5 out of 100 equals 5 hundredths.", style: 'hint' },
  { text: "5 over 100 equals 0.05. That's not the same as 0.5, which would be 50 squares.", style: 'hint' },
  { text: "5 over 100 equals 0.05, which is five hundredths — only half a row.", style: 'explanation' },

  // ── Q4: Word Problems ──
  { text: "Emma buys a sandwich for 2 dollars and 50 cents. How much does she pay? Write as a decimal.", style: 'question' },
  { text: "2 dollars and 50 cents equals 2 and 50 hundredths.", style: 'hint' },
  { text: "2.50 equals 2 ones, 5 tenths, and 0 hundredths.", style: 'hint' },
  { text: "2 dollars and 50 cents written as a decimal is $2.50.", style: 'explanation' },

  { text: "Oliver has a ribbon that is 0.8 metres long. Sophie's ribbon is 0.3 metres long. How much longer is Oliver's ribbon?", style: 'question' },
  { text: "Subtract: 0.8 minus 0.3.", style: 'hint' },
  { text: "8 tenths minus 3 tenths equals 5 tenths, which is 0.5.", style: 'hint' },
  { text: "0.8 minus 0.3 equals 0.5 metres. Oliver's ribbon is 0.5 metres longer.", style: 'explanation' },

  { text: "Lucas runs 1.4 kilometres on Monday and 1.2 kilometres on Tuesday. How far does he run in total?", style: 'question' },
  { text: "Add: 1.4 plus 1.2.", style: 'hint' },
  { text: "4 tenths plus 2 tenths equals 6 tenths. 1 plus 1 equals 2. Answer: 2.6.", style: 'hint' },
  { text: "1.4 plus 1.2 equals 2.6 kilometres.", style: 'explanation' },

  { text: "Mia buys a drink for 1 dollar 65 cents and a snack for 80 cents. How much does she spend in total?", style: 'question' },
  { text: "Line up the decimal points: 1.65 plus 0.80.", style: 'hint' },
  { text: "5 plus 0 equals 5 hundredths. 6 plus 8 equals 14 tenths, carry 1. 1 plus 0 plus 1 equals 2 ones. Answer: 2.45.", style: 'hint' },
  { text: "1.65 plus 0.80 equals 2.45. Mia spends $2.45 in total.", style: 'explanation' },

  { text: "A pencil is 17.4 centimetres long. It is sharpened to 16.9 centimetres. How much was sharpened off?", style: 'question' },
  { text: "Subtract: 17.4 minus 16.9.", style: 'hint' },
  { text: "Regroup: 14 tenths minus 9 tenths equals 5 tenths, which is 0.5.", style: 'hint' },
  { text: "17.4 minus 16.9 equals 0.5 centimetres was sharpened off.", style: 'explanation' },

  { text: "Noah has 5 dollars. He spends 2 dollars and 75 cents on a book. How much money does he have left?", style: 'question' },
  { text: "Subtract: 5.00 minus 2.75.", style: 'hint' },
  { text: "5.00 minus 2.75 equals 2.25.", style: 'hint' },
  { text: "5 dollars minus $2.75 equals $2.25 remaining.", style: 'explanation' },

  { text: "A water bottle holds 1.25 litres. Grace fills 3 bottles. How much water is that?", style: 'question' },
  { text: "Multiply: 1.25 times 3.", style: 'hint' },
  { text: "1 times 3 equals 3. 0.25 times 3 equals 0.75. 3 plus 0.75 equals 3.75.", style: 'hint' },
  { text: "1.25 times 3 equals 3.75 litres.", style: 'explanation' },

  { text: "Lily's bag weighs 3.48 kilograms. James's bag weighs 2.79 kilograms. How much heavier is Lily's bag?", style: 'question' },
  { text: "Subtract: 3.48 minus 2.79.", style: 'hint' },
  { text: "3.48 minus 2.79 equals 0.69.", style: 'hint' },
  { text: "3.48 minus 2.79 equals 0.69 kilograms. Lily's bag is 0.69 kilograms heavier.", style: 'explanation' },

  { text: "A school track is 0.25 kilometres long. Marcus runs around it 4 times. How far does he run?", style: 'question' },
  { text: "Multiply: 0.25 times 4.", style: 'hint' },
  { text: "0.25 times 4 equals 1.00, which equals 1 kilometre.", style: 'hint' },
  { text: "0.25 times 4 equals 1.0 kilometres. Marcus runs exactly 1 kilometre.", style: 'explanation' },

  { text: "Rain falls 4.62 centimetres on Saturday and 3.89 centimetres on Sunday. What is the total rainfall?", style: 'question' },
  { text: "Add: 4.62 plus 3.89.", style: 'hint' },
  { text: "2 plus 9 equals 11 hundredths. 6 plus 8 plus 1 equals 15 tenths. 4 plus 3 plus 1 equals 8. Answer: 8.51.", style: 'hint' },
  { text: "4.62 plus 3.89 equals 8.51 centimetres total rainfall.", style: 'explanation' },
];

const QUESTION_PHRASES_3 = [
  // ── Q5: Compare & Order ──
  { text: "Which is greater: 0.6 or 0.4?", style: 'question' },
  { text: "Compare the tenths digit: 6 is greater than 4.", style: 'hint' },
  { text: "6 tenths is more than 4 tenths on a number line.", style: 'hint' },
  { text: "0.6 is greater than 0.4. Six tenths is more than four tenths.", style: 'explanation' },

  { text: "Which is smaller: 0.3 or 0.7?", style: 'question' },
  { text: "Compare tenths digits: 3 is less than 7.", style: 'hint' },
  { text: "3 tenths is less than 7 tenths.", style: 'hint' },
  { text: "0.3 is smaller than 0.7. Three tenths is less than seven tenths.", style: 'explanation' },

  { text: "Which is greater: 0.5 or 0.50?", style: 'question' },
  { text: "Trailing zeros after the decimal don't change the value.", style: 'hint' },
  { text: "0.5 equals 0.50, which equals 5 tenths equals 50 hundredths. They are equal!", style: 'hint' },
  { text: "0.5 equals 0.50. Trailing zeros do not change the value. They are equal.", style: 'explanation' },

  { text: "Order from smallest to greatest: 0.6, 0.56, 0.65.", style: 'question' },
  { text: "Compare tenths first. 0.56 has 5 tenths. 0.6 and 0.65 both have 6 tenths.", style: 'hint' },
  { text: "0.56 is less than 0.60, which equals 0.6, which is less than 0.65.", style: 'hint' },
  { text: "0.56 is less than 0.6 is less than 0.65. Compare tenths, then hundredths.", style: 'explanation' },

  { text: "Which is greatest: 1.2, 1.09, 1.19, 1.20?", style: 'question' },
  { text: "Remember: 1.2 equals 1.20. They are the same value!", style: 'hint' },
  { text: "1.20 equals 1.2 equals 1 and 2 tenths. 1.19 is less than 1.20.", style: 'hint' },
  { text: "1.2 equals 1.20, which is the greatest value. Both equal 1 and 2 tenths.", style: 'explanation' },

  { text: "Which is less: 0.07 or 0.7?", style: 'question' },
  { text: "0.07 equals 7 hundredths. 0.7 equals 7 tenths.", style: 'hint' },
  { text: "7 hundredths is much smaller than 7 tenths.", style: 'hint' },
  { text: "0.07 is less than 0.7. Seven hundredths is less than seven tenths.", style: 'explanation' },

  { text: "Order from greatest to smallest: 3.4, 3.04, 3.44.", style: 'question' },
  { text: "All have 3 ones. Compare tenths: 3.04 has 0 tenths, while 3.4 and 3.44 have 4 tenths.", style: 'hint' },
  { text: "3.04 is less than 3.40, which equals 3.4, which is less than 3.44.", style: 'hint' },
  { text: "From greatest to smallest: 3.44, then 3.4, then 3.04. Always compare ones, tenths, then hundredths.", style: 'explanation' },

  { text: "Which number is between 0.4 and 0.5?", style: 'question' },
  { text: "A number between 0.4 and 0.5 must be greater than 0.40 and less than 0.50.", style: 'hint' },
  { text: "0.40 is less than 0.45 is less than 0.50. So 0.45 is between them.", style: 'hint' },
  { text: "0.45 is between 0.4 and 0.5. It is greater than 0.40 and less than 0.50.", style: 'explanation' },

  { text: "Which statement is correct about 0.9 and 0.89?", style: 'question' },
  { text: "0.9 equals 0.90, which is 9 tenths. 0.89 equals 8 tenths and 9 hundredths.", style: 'hint' },
  { text: "9 tenths is greater than 8 tenths, so 0.9 is greater than 0.89.", style: 'hint' },
  { text: "0.9 equals 0.90, which is greater than 0.89, because 9 tenths is more than 8 tenths.", style: 'explanation' },

  { text: "What is the largest number among 5.07, 5.7, 5.70, and 5.17?", style: 'question' },
  { text: "5.7 equals 5.70. Look for the greatest tenths digit.", style: 'hint' },
  { text: "5.7 equals 5.70 equals 5 and 7 tenths, which is the greatest. 5.17 equals 5 and 1 tenth, which is smaller.", style: 'hint' },
  { text: "5.7 equals 5.70 is the greatest value because 7 tenths is more than 1 tenth.", style: 'explanation' },

  // ── Q6: True/False ──
  { text: "True or false: 0.30 is the same as 0.3.", style: 'question' },
  { text: "Trailing zeros after the last digit don't change the value.", style: 'hint' },
  { text: "0.30 equals 30 over 100 equals 3 over 10 equals 0.3. They are the same!", style: 'hint' },
  { text: "TRUE. 0.30 equals 0.3. Trailing zeros don't change the value.", style: 'explanation' },

  { text: "True or false: 0.7 is greater than 0.70.", style: 'question' },
  { text: "Check if a trailing zero changes the value.", style: 'hint' },
  { text: "0.7 equals 0.70. They are equal, so neither is greater.", style: 'hint' },
  { text: "FALSE. 0.7 equals 0.70. They are equal values.", style: 'explanation' },

  { text: "True or false: 0.5 is greater than 0.05.", style: 'question' },
  { text: "0.5 equals 5 tenths. 0.05 equals 5 hundredths.", style: 'hint' },
  { text: "5 tenths is greater than 5 hundredths on a number line.", style: 'hint' },
  { text: "TRUE. 0.5 equals 5 tenths and 0.05 equals 5 hundredths. So 0.5 is greater.", style: 'explanation' },

  { text: "True or false: 0.7 is smaller than 0.65 because 7 is less than 65.", style: 'question' },
  { text: "Don't compare the whole numbers — compare place by place.", style: 'hint' },
  { text: "0.7 has 7 tenths. 0.65 has 6 tenths and 5 hundredths. 7 tenths is more than 6 tenths.", style: 'hint' },
  { text: "FALSE. 0.7 is greater than 0.65. Compare tenths first: 7 tenths is more than 6 tenths.", style: 'explanation' },

  { text: "True or false: 0.10 equals 0.1.", style: 'question' },
  { text: "0.10 equals 10 hundredths. 0.1 equals 1 tenth.", style: 'hint' },
  { text: "10 hundredths equals 1 tenth equals 0.1. They match!", style: 'hint' },
  { text: "TRUE. 0.10 equals 10 over 100 equals 1 over 10 equals 0.1.", style: 'explanation' },

  { text: "True or false: The number 3.40 has a 4 in the hundredths place.", style: 'question' },
  { text: "In 3.40: ones is 3, tenths is 4, hundredths is 0.", style: 'hint' },
  { text: "The 4 is in the TENTHS place, not hundredths.", style: 'hint' },
  { text: "FALSE. In 3.40, the digit 4 is in the tenths place, not the hundredths place.", style: 'explanation' },

  { text: "True or false: 0.09 is greater than 0.1.", style: 'question' },
  { text: "0.09 equals 9 hundredths. 0.1 equals 10 hundredths.", style: 'hint' },
  { text: "9 hundredths is less than 10 hundredths, so 0.09 is less than 0.1.", style: 'hint' },
  { text: "FALSE. 0.09 is less than 0.1. Nine hundredths is less than one tenth.", style: 'explanation' },

  { text: "True or false: Rounding 4.75 to the nearest whole number gives 5.", style: 'question' },
  { text: "Look at the tenths digit: 7. Is 7 greater than or equal to 5?", style: 'hint' },
  { text: "7 is greater than or equal to 5, so we round up. 4 becomes 5.", style: 'hint' },
  { text: "TRUE. 4.75 rounds to 5. The tenths digit 7 is greater than or equal to 5, so round up.", style: 'explanation' },

  { text: "True or false: 0.99 is equal to 1.", style: 'question' },
  { text: "0.99 equals 99 hundredths. 1 equals 100 hundredths.", style: 'hint' },
  { text: "0.99 is one hundredth less than 1.", style: 'hint' },
  { text: "FALSE. 0.99 is not equal to 1. It is one hundredth less than 1.00.", style: 'explanation' },

  { text: "True or false: 5 tenths and 3 hundredths written as a decimal is 0.53.", style: 'question' },
  { text: "5 tenths gives 0.5 and 3 hundredths gives 0.03.", style: 'hint' },
  { text: "0.5 plus 0.03 equals 0.53.", style: 'hint' },
  { text: "TRUE. 5 tenths plus 3 hundredths equals 0.5 plus 0.03 equals 0.53.", style: 'explanation' },
];

const QUESTION_PHRASES_4 = [
  // ── Q7: Number Line ──
  { text: "On a number line from 0 to 1, which point shows 0.5?", style: 'question' },
  { text: "0.5 is exactly halfway between 0 and 1.", style: 'hint' },
  { text: "Half of 1 equals 0.5, so it's at the midpoint.", style: 'hint' },
  { text: "0.5 is exactly at the midpoint between 0 and 1.", style: 'explanation' },

  { text: "On a number line from 0 to 1 marked in tenths, where is 0.3?", style: 'question' },
  { text: "The number line has 10 equal parts, called tenths. Count 3 from the left.", style: 'hint' },
  { text: "0.1, 0.2, 0.3 — that is the 3rd tick mark.", style: 'hint' },
  { text: "0.3 is at the 3rd tick, which is 3 tenths from 0.", style: 'explanation' },

  { text: "A number line goes from 1 to 2. Where is 1.5?", style: 'question' },
  { text: "1.5 equals 1 and 5 tenths. That's halfway between 1 and 2.", style: 'hint' },
  { text: "1.0, 1.5, 2.0 — midpoint!", style: 'hint' },
  { text: "1.5 is halfway between 1 and 2.", style: 'explanation' },

  { text: "On a number line from 0 to 1 with hundredth marks, 0.35 is between which two tenths?", style: 'question' },
  { text: "0.35 equals 3 tenths and 5 hundredths. It lies between 0.30 and 0.40.", style: 'hint' },
  { text: "0.30 is less than 0.35 is less than 0.40.", style: 'hint' },
  { text: "0.35 is between 0.3 and 0.4 on the number line.", style: 'explanation' },

  { text: "Which decimal is closest to 1 on a number line?", style: 'question' },
  { text: "The largest value is closest to 1.", style: 'hint' },
  { text: "0.91 equals 91 hundredths, which is the closest to 100 hundredths, which equals 1.", style: 'hint' },
  { text: "0.91 is closest to 1. It is only 0.09 away.", style: 'explanation' },

  { text: "Between which two values does 2.45 lie?", style: 'question' },
  { text: "2.45 equals 2 and 45 hundredths.", style: 'hint' },
  { text: "2.40 is less than 2.45 is less than 2.50.", style: 'hint' },
  { text: "2.45 lies between 2.4 and 2.5.", style: 'explanation' },

  { text: "How many tenths are there between 3.0 and 4.0?", style: 'question' },
  { text: "Count: 3.1, 3.2, 3.3, all the way to 4.0.", style: 'hint' },
  { text: "There are 10 equal tenth intervals from 3.0 to 4.0.", style: 'hint' },
  { text: "From 3.0 to 4.0 there are 10 tenths.", style: 'explanation' },

  { text: "On a 0-to-1 number line, what decimal is halfway between 0.6 and 0.7?", style: 'question' },
  { text: "Find the midpoint of 0.6 and 0.7.", style: 'hint' },
  { text: "0.6 plus 0.7 divided by 2 equals 1.3 divided by 2 equals 0.65.", style: 'hint' },
  { text: "Halfway between 0.6 and 0.7 is 0.65.", style: 'explanation' },

  { text: "Which decimal is NOT between 0.2 and 0.3?", style: 'question' },
  { text: "A value between 0.2 and 0.3 must be greater than 0.20 and less than 0.30.", style: 'hint' },
  { text: "0.31 equals 31 hundredths, which is greater than 0.30, so it is NOT between 0.2 and 0.3.", style: 'hint' },
  { text: "0.31 is greater than 0.30, so it is NOT between 0.2 and 0.3.", style: 'explanation' },

  { text: "On a 0-to-2 number line with tenths marks, how many marks are there in total including 0 and 2?", style: 'question' },
  { text: "From 0.0 to 2.0 in steps of 0.1.", style: 'hint' },
  { text: "0.0, 0.1, 0.2, all the way to 2.0 — that is 21 marks in total.", style: 'hint' },
  { text: "From 0.0 to 2.0 in steps of 0.1 gives 21 marks total.", style: 'explanation' },

  // ── Q8: Rounding ──
  { text: "Round 3.7 to the nearest whole number.", style: 'question' },
  { text: "Look at the tenths digit: 7. Is 7 greater than or equal to 5?", style: 'hint' },
  { text: "7 is greater than or equal to 5, so round up. 3 becomes 4.", style: 'hint' },
  { text: "3.7 rounded to the nearest whole number is 4.", style: 'explanation' },

  { text: "Round 2.3 to the nearest whole number.", style: 'question' },
  { text: "Look at the tenths digit: 3. Is 3 greater than or equal to 5?", style: 'hint' },
  { text: "3 is less than 5, so round down. 2 stays as 2.", style: 'hint' },
  { text: "2.3 rounded to the nearest whole number is 2.", style: 'explanation' },

  { text: "Round 6.78 to the nearest whole number.", style: 'question' },
  { text: "Look at the tenths digit: 7. Is 7 greater than or equal to 5?", style: 'hint' },
  { text: "7 is greater than or equal to 5, so round up. 6 becomes 7.", style: 'hint' },
  { text: "6.78 rounded to the nearest whole number is 7.", style: 'explanation' },

  { text: "Round 4.53 to the nearest tenth — that's 1 decimal place.", style: 'question' },
  { text: "Look at the hundredths digit: 3. Is 3 greater than or equal to 5?", style: 'hint' },
  { text: "3 is less than 5, so round down. 4.53 becomes 4.5.", style: 'hint' },
  { text: "4.53 rounded to the nearest tenth is 4.5.", style: 'explanation' },

  { text: "Round 8.45 to the nearest tenth.", style: 'question' },
  { text: "Look at the hundredths digit: 5. Is 5 greater than or equal to 5?", style: 'hint' },
  { text: "5 is greater than or equal to 5, so round up. 8.4 becomes 8.5.", style: 'hint' },
  { text: "8.45 rounded to the nearest tenth is 8.5.", style: 'explanation' },

  { text: "Round 1.96 to the nearest tenth.", style: 'question' },
  { text: "The hundredths digit is 6. Is 6 greater than or equal to 5?", style: 'hint' },
  { text: "6 is greater than or equal to 5, so round up. 1.9 becomes 2.0.", style: 'hint' },
  { text: "1.96 rounded to the nearest tenth is 2.0.", style: 'explanation' },

  { text: "Which of these rounds to 5.0 when rounded to 1 decimal place?", style: 'question' },
  { text: "To round to 1 decimal place, look at the hundredths digit.", style: 'hint' },
  { text: "4.95 has hundredths digit 5, which is greater than or equal to 5. So 4.9 rounds up to 5.0.", style: 'hint' },
  { text: "4.95 rounds to 5.0 because the hundredths digit 5 triggers rounding up.", style: 'explanation' },

  { text: "A plank is 2.47 metres long. Rounded to 1 decimal place, how long is it?", style: 'question' },
  { text: "The hundredths digit is 7. Is 7 greater than or equal to 5?", style: 'hint' },
  { text: "7 is greater than or equal to 5, so round up. 2.4 becomes 2.5.", style: 'hint' },
  { text: "2.47 rounded to 1 decimal place is 2.5 metres.", style: 'explanation' },

  { text: "Oliver runs 3.85 kilometres. To the nearest kilometre, how far did he run?", style: 'question' },
  { text: "To round to the nearest kilometre (whole number), look at the tenths digit.", style: 'hint' },
  { text: "The tenths digit is 8. 8 is greater than or equal to 5, so 3 rounds up to 4.", style: 'hint' },
  { text: "3.85 rounded to the nearest kilometre is 4 kilometres.", style: 'explanation' },

  { text: "Round 9.95 to the nearest tenth.", style: 'question' },
  { text: "The hundredths digit is 5. Is 5 greater than or equal to 5?", style: 'hint' },
  { text: "5 is greater than or equal to 5, so round up. 9.9 becomes 10.0.", style: 'hint' },
  { text: "9.95 rounded to the nearest tenth is 10.0.", style: 'explanation' },
];

const QUESTION_PHRASES_5 = [
  // ── Q9: Number Patterns ──
  { text: "1.2, 1.4, 1.6, blank, 2.0 — what is the missing number?", style: 'question' },
  { text: "The pattern increases by 0.2 each time.", style: 'hint' },
  { text: "1.6 plus 0.2 equals 1.8.", style: 'hint' },
  { text: "The pattern adds 0.2 each step. 1.6 plus 0.2 equals 1.8.", style: 'explanation' },

  { text: "0.5, 0.6, 0.7, blank, 0.9 — fill in the blank.", style: 'question' },
  { text: "The pattern increases by 0.1.", style: 'hint' },
  { text: "0.7 plus 0.1 equals 0.8.", style: 'hint' },
  { text: "Counting up in 0.1 steps: 0.7 plus 0.1 equals 0.8.", style: 'explanation' },

  { text: "0.05, 0.10, 0.15, blank, 0.25 — what comes next?", style: 'question' },
  { text: "The pattern increases by 0.05.", style: 'hint' },
  { text: "0.15 plus 0.05 equals 0.20.", style: 'hint' },
  { text: "Adding 0.05 each time: 0.15 plus 0.05 equals 0.20.", style: 'explanation' },

  { text: "3.7, 3.8, 3.9, blank, 4.1 — find the missing term.", style: 'question' },
  { text: "The pattern adds 0.1 each time.", style: 'hint' },
  { text: "3.9 plus 0.1 equals 4.0.", style: 'hint' },
  { text: "3.9 plus 0.1 equals 4.0. The pattern counts through a whole number.", style: 'explanation' },

  { text: "0.01, 0.03, 0.05, blank, 0.09 — what is the missing term?", style: 'question' },
  { text: "The pattern increases by 0.02.", style: 'hint' },
  { text: "0.05 plus 0.02 equals 0.07.", style: 'hint' },
  { text: "Adding 0.02 each step: 0.05 plus 0.02 equals 0.07.", style: 'explanation' },

  { text: "2.30, 2.40, 2.50, 2.60, blank — what is the next number?", style: 'question' },
  { text: "The pattern adds 0.10 each time.", style: 'hint' },
  { text: "2.60 plus 0.10 equals 2.70.", style: 'hint' },
  { text: "Adding 0.1 each step: 2.60 plus 0.10 equals 2.70.", style: 'explanation' },

  { text: "1.00, 0.90, 0.80, blank, 0.60 — find the missing term.", style: 'question' },
  { text: "The pattern decreases by 0.10.", style: 'hint' },
  { text: "0.80 minus 0.10 equals 0.70.", style: 'hint' },
  { text: "Subtracting 0.1 each step: 0.80 minus 0.10 equals 0.70.", style: 'explanation' },

  { text: "0.25, 0.50, 0.75, blank, 1.25 — what is the missing term?", style: 'question' },
  { text: "The pattern increases by 0.25.", style: 'hint' },
  { text: "0.75 plus 0.25 equals 1.00.", style: 'hint' },
  { text: "Adding 0.25 each step: 0.75 plus 0.25 equals 1.00.", style: 'explanation' },

  { text: "4.95, 4.96, 4.97, blank, 4.99 — find the missing number.", style: 'question' },
  { text: "The pattern increases by 0.01.", style: 'hint' },
  { text: "4.97 plus 0.01 equals 4.98.", style: 'hint' },
  { text: "Adding 0.01 each step: 4.97 plus 0.01 equals 4.98.", style: 'explanation' },

  { text: "blank, 1.6, 1.9, 2.2, 2.5 — what is the first term?", style: 'question' },
  { text: "The pattern adds 0.3 each time.", style: 'hint' },
  { text: "1.6 minus 0.3 equals 1.3.", style: 'hint' },
  { text: "Subtracting 0.3 from 1.6: the first term is 1.3.", style: 'explanation' },

  // ── Q10: Build the Decimal ──
  { text: "Which decimal has 6 in the tenths place and 0 in the hundredths place?", style: 'question' },
  { text: "6 in the tenths place means the decimal looks like question mark dot 6 blank.", style: 'hint' },
  { text: "0 ones, 6 tenths, 0 hundredths equals 0.60.", style: 'hint' },
  { text: "0.60 has 6 in the tenths place and 0 in the hundredths place.", style: 'explanation' },

  { text: "Build a decimal: 2 ones, 5 tenths, 0 hundredths.", style: 'question' },
  { text: "Ones equals 2, Tenths equals 5, Hundredths equals 0.", style: 'hint' },
  { text: "Place value chart: 2, dot, 5, 0 gives 2.50.", style: 'hint' },
  { text: "2 ones plus 5 tenths plus 0 hundredths equals 2.50.", style: 'explanation' },

  { text: "A number has 0 ones, 4 tenths, and 7 hundredths. What is it?", style: 'question' },
  { text: "0 ones, 4 tenths, 7 hundredths. Place them after the decimal.", style: 'hint' },
  { text: "0 dot 4 7 gives 0.47.", style: 'hint' },
  { text: "0 ones plus 4 tenths plus 7 hundredths equals 0.47.", style: 'explanation' },

  { text: "Which digit makes the hundredths place equal to 8 in a number between 3 and 4?", style: 'question' },
  { text: "Between 3 and 4 means the ones digit is 3. Hundredths digit equals 8.", style: 'hint' },
  { text: "3 ones, 0 tenths, 8 hundredths gives 3.08.", style: 'hint' },
  { text: "3.08 has ones equal to 3, tenths equal to 0, and hundredths equal to 8.", style: 'explanation' },

  { text: "What is 3 ones plus 0 tenths plus 5 hundredths?", style: 'question' },
  { text: "Write each digit in its column: 3, dot, 0, 5.", style: 'hint' },
  { text: "3.05 — the 0 in the tenths place means no full tenth was added.", style: 'hint' },
  { text: "3 ones plus 0 tenths plus 5 hundredths equals 3.05.", style: 'explanation' },

  { text: "Which decimal has the digit 9 in the hundredths position?", style: 'question' },
  { text: "Hundredths is the second position after the decimal.", style: 'hint' },
  { text: "1.09 means: ones is 1, tenths is 0, hundredths is 9.", style: 'hint' },
  { text: "1.09 has 9 in the hundredths place.", style: 'explanation' },

  { text: "Noah has 4 dollars and 35 cents. Write this as a decimal.", style: 'question' },
  { text: "Dollars equal ones. Cents equal hundredths because 100 cents make 1 dollar.", style: 'hint' },
  { text: "4 dollars and 35 cents equals 4.35.", style: 'hint' },
  { text: "4 dollars and 35 cents equals $4.35, because 35 cents equals 35 hundredths of a dollar.", style: 'explanation' },

  { text: "What decimal is made up of 1 ten, 4 ones, 2 tenths, and 6 hundredths?", style: 'question' },
  { text: "Tens digit is 1, ones is 4, tenths is 2, hundredths is 6.", style: 'hint' },
  { text: "14, dot, 2, 6 gives 14.26.", style: 'hint' },
  { text: "1 ten plus 4 ones plus 2 tenths plus 6 hundredths equals 14.26.", style: 'explanation' },

  { text: "A decimal has 5 hundredths and 3 tenths, and no whole-number part. What is it?", style: 'question' },
  { text: "3 tenths plus 5 hundredths. Tenths come first after the decimal.", style: 'hint' },
  { text: "0 dot 3 tenths 5 hundredths gives 0.35.", style: 'hint' },
  { text: "3 tenths plus 5 hundredths equals 0.35.", style: 'explanation' },

  { text: "Which two decimals have the SAME value as 7 tenths?", style: 'question' },
  { text: "Trailing zeros don't change the decimal value.", style: 'hint' },
  { text: "0.7 equals 0.70. Both equal 7 tenths, which equals 70 hundredths.", style: 'hint' },
  { text: "0.7 equals 0.70. Trailing zeros do not change the value.", style: 'explanation' },
];

// Combine ALL phrases
const ALL_PHRASES = [
  ...PHASE_PHRASES,
  ...QUESTION_PHRASES,
  ...QUESTION_PHRASES_2,
  ...QUESTION_PHRASES_3,
  ...QUESTION_PHRASES_4,
  ...QUESTION_PHRASES_5,
];

// De-duplicate by text (keep first occurrence)
const seen = new Set();
const UNIQUE_PHRASES = ALL_PHRASES.filter(p => {
  const key = p.text.trim();
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

// ══════════════════════════════════════════════════════════
// GENERATION ENGINE
// ══════════════════════════════════════════════════════════

function slugify(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 55);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function callElevenLabs(text, style) {
  return new Promise((resolve, reject) => {
    const settings = STYLE_SETTINGS[style] || STYLE_SETTINGS.statement;
    const body = JSON.stringify({
      text,
      model_id: MODEL,
      voice_settings: settings,
    });

    const options = {
      hostname: 'api.elevenlabs.io',
      path: `/v1/text-to-speech/${VOICE_ID}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': API_KEY,
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(Buffer.concat(chunks));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${Buffer.concat(chunks).toString().slice(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Request timeout')); });
    req.write(body);
    req.end();
  });
}

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  // Load existing audioMap to preserve already-generated entries
  let existingMap = {};
  if (fs.existsSync(MAP_FILE)) {
    try {
      const content = fs.readFileSync(MAP_FILE, 'utf8');
      const match = content.match(/const audioMap = ({[\s\S]*?});/);
      if (match) existingMap = JSON.parse(match[1]);
    } catch {}
  }

  const audioMap = { ...existingMap };
  let generated = 0;
  let skipped = 0;
  let errors = 0;
  const errorList = [];

  console.log(`\n🎙️  Decimal Grid — FULL Audio Generator`);
  console.log(`📁 Output: ${OUT_DIR}`);
  console.log(`🔊 Voice: Alice (${VOICE_ID})`);
  console.log(`📝 Unique phrases to process: ${UNIQUE_PHRASES.length}\n`);

  for (let i = 0; i < UNIQUE_PHRASES.length; i++) {
    const { text, style } = UNIQUE_PHRASES[i];
    const slug = slugify(text);
    const filename = `audio_${slug}_${i}.mp3`;
    const filepath = path.join(OUT_DIR, filename);
    const webPath = `/assets/audio/decimals/${filename}`;

    // Skip if already in audioMap and file exists
    if (audioMap[text] && fs.existsSync(path.join(ROOT, 'public', audioMap[text]))) {
      console.log(`  ⏭️  [${i+1}/${UNIQUE_PHRASES.length}] SKIP: ${text.slice(0, 50)}...`);
      skipped++;
      continue;
    }

    try {
      process.stdout.write(`  🎙️  [${i+1}/${UNIQUE_PHRASES.length}] (${style}) "${text.slice(0, 52)}"... `);
      const buffer = await callElevenLabs(text, style);
      fs.writeFileSync(filepath, buffer);
      audioMap[text] = webPath;
      generated++;
      console.log(`✅ ${(buffer.length/1024).toFixed(1)}KB`);
    } catch (err) {
      console.log(`❌ ${err.message.slice(0, 60)}`);
      errors++;
      errorList.push({ text: text.slice(0, 60), error: err.message.slice(0, 80) });
    }

    if (i < UNIQUE_PHRASES.length - 1) await sleep(RATE_LIMIT_MS);
  }

  // Write audioMap.js
  const mapContent = `// Auto-generated by scripts/generate_audio.js
// ${new Date().toISOString()}
// Total entries: ${Object.keys(audioMap).length}
// DO NOT EDIT MANUALLY

const audioMap = ${JSON.stringify(audioMap, null, 2)};

export default audioMap;
`;

  fs.writeFileSync(MAP_FILE, mapContent);

  console.log(`\n${'='.repeat(60)}`);
  console.log(`✨ Audio Generation Complete!`);
  console.log(`   ✅ Generated: ${generated}`);
  console.log(`   ⏭️  Skipped (cached): ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`   📄 Total in audioMap: ${Object.keys(audioMap).length}`);
  console.log(`   📁 audioMap.js → ${MAP_FILE}`);
  if (errorList.length) {
    console.log(`\n⚠️  Failed phrases:`);
    errorList.forEach(e => console.log(`   • "${e.text}" — ${e.error}`));
  }
  console.log(`${'='.repeat(60)}\n`);
}

main().catch(console.error);
