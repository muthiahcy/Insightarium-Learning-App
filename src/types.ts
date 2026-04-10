export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string; // Brief explanation for correct/incorrect answers
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface FlashcardEval {
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface WahanaContent {
  quiz: QuizQuestion[];
  flashcards: Flashcard[];
  flashcardEval: FlashcardEval[];
}

export type WahanaType = 'quiz' | 'flashcard' | 'flashcard-eval' | 'summary';
