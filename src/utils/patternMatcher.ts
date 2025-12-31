import { PatternConfig, DetectionResult } from '../types/receipt';

interface WordPosition {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export function findPatternMatches(
  words: WordPosition[],
  pattern: PatternConfig
): DetectionResult | null {
  const keywordPositions: WordPosition[] = [];

  for (const word of words) {
    const wordLower = word.text.toLowerCase();
    for (const keyword of pattern.contextKeywords) {
      if (wordLower.includes(keyword.toLowerCase())) {
        keywordPositions.push(word);
        break;
      }
    }
  }

  if (keywordPositions.length === 0) {
    return null;
  }

  const regex = new RegExp(pattern.numberPattern, 'gi');
  const candidates: Array<{ value: string; distance: number; word: WordPosition }> = [];

  for (const word of words) {
    const cleanedText = word.text.replace(/[^\w]/g, '');
    const matches = cleanedText.match(regex);
    if (matches) {
      for (const match of matches) {
        for (const keywordPos of keywordPositions) {
          const distance = calculateDistance(word, keywordPos);

          if (distance <= pattern.proximity) {
            const positionValid = checkPosition(word, keywordPos, pattern.position);
            if (positionValid) {
              candidates.push({ value: match, distance, word });
            }
          }
        }
      }
    }
  }

  if (candidates.length === 0) {
    return null;
  }

  candidates.sort((a, b) => a.distance - b.distance);
  const best = candidates[0];

  const confidence = Math.max(0, 1 - (best.distance / pattern.proximity));

  return {
    value: best.value,
    confidence,
    patternId: pattern.id,
    source: best.word.text
  };
}

function calculateDistance(word1: WordPosition, word2: WordPosition): number {
  const dx = (word1.x + word1.width / 2) - (word2.x + word2.width / 2);
  const dy = (word1.y + word1.height / 2) - (word2.y + word2.height / 2);
  return Math.sqrt(dx * dx + dy * dy);
}

function checkPosition(
  numberWord: WordPosition,
  keywordWord: WordPosition,
  position: 'before' | 'after' | 'any'
): boolean {
  if (position === 'any') return true;

  const numCenter = numberWord.x + numberWord.width / 2;
  const keyCenter = keywordWord.x + keywordWord.width / 2;

  if (position === 'after') {
    return numCenter > keyCenter;
  } else {
    return numCenter < keyCenter;
  }
}
