/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Flame, 
  Ticket, 
  Sparkles, 
  ChevronRight, 
  RotateCcw, 
  CheckCircle2, 
  XCircle,
  Loader2,
  BookOpen,
  Map as MapIcon
} from 'lucide-react';
import { generateWahanaContent } from './services/gemini';
import { WahanaContent, WahanaType, QuizQuestion, Flashcard } from './types';
import { cn, shuffleArray } from './lib/utils';

const Windmill = ({ className }: { className?: string }) => (
  <div className={cn("relative w-24 h-24", className)}>
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-16 bg-slate-300 rounded-t-full" />
    <motion.div 
      animate={{ rotate: 360 }}
      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      className="absolute top-0 left-0 w-full h-full flex items-center justify-center"
    >
      {[0, 90, 180, 270].map((deg) => (
        <div 
          key={deg} 
          style={{ transform: `rotate(${deg}deg)` }} 
          className="absolute w-1 h-12 bg-pastel-blue border border-blue-200 rounded-full origin-bottom"
        />
      ))}
    </motion.div>
  </div>
);

const Carousel = ({ className }: { className?: string }) => (
  <div className={cn("relative w-32 h-32", className)}>
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-8 bg-pastel-pink border-2 border-pink-200 rounded-t-full" />
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-4 bg-slate-200 rounded-full" />
    <motion.div 
      animate={{ rotate: 360 }}
      transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
      className="absolute top-8 left-0 w-full h-16 flex items-center justify-around"
    >
      {[0, 120, 240].map((deg) => (
        <motion.div 
          key={deg}
          animate={{ translateY: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: deg/100 }}
          className="w-4 h-8 bg-pastel-yellow border border-yellow-300 rounded-md"
        />
      ))}
    </motion.div>
  </div>
);

export default function App() {
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [userName, setUserName] = useState('');
  const [university, setUniversity] = useState('');
  const [isProfileSet, setIsProfileSet] = useState(false);
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState<WahanaContent | null>(null);
  const [activeWahana, setActiveWahana] = useState<WahanaType | null>(null);
  const [quizIndex, setQuizIndex] = useState(0);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [flashcardEvalIndex, setFlashcardEvalIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loadingTip, setLoadingTip] = useState('');

  const loadingTips = [
    "Menyiapkan wahana belajar yang seru...",
    "Membangun kincir angin pengetahuan...",
    "Menyusun kartu-kartu ajaib...",
    "Menghubungkan sirkuit kecerdasan...",
    "Hampir sampai di taman bermain ilmu!"
  ];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedTopic = params.get('topic');
    if (sharedTopic) {
      setTopic(sharedTopic);
    }
  }, []);

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoadingTip(loadingTips[Math.floor(Math.random() * loadingTips.length)]);
      }, 2500);
      setLoadingTip(loadingTips[0]);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  const startLearning = async (targetTopic: string) => {
    if (!targetTopic.trim()) return;

    setIsLoading(true);
    setContent(null);
    setActiveWahana(null);
    
    try {
      const data = await generateWahanaContent(targetTopic);
      
      const randomizedData: WahanaContent = {
        ...data,
        quiz: data.quiz.map(q => ({
          ...q,
          options: shuffleArray(q.options)
        })),
        flashcardEval: data.flashcardEval.map(e => ({
          ...e,
          options: shuffleArray(e.options)
        }))
      };

      setContent(randomizedData);
      setActiveWahana('quiz');
      setQuizIndex(0);
      setFlashcardIndex(0);
      setFlashcardEvalIndex(0);
      setIsFlipped(false);
    } catch (error) {
      console.error("Failed to generate content:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    startLearning(topic);
  };

  const handleProfileSubmit = () => {
    if (userName.trim() && university.trim()) {
      setIsProfileSet(true);
      if (topic) {
        startLearning(topic);
      }
    }
  };

  const handleQuizAnswer = (answer: string) => {
    if (!content) return;
    const currentQuiz = content.quiz[quizIndex];
    const isCorrect = answer === currentQuiz.correctAnswer;

    if (isCorrect) {
      setPoints(prev => prev + 10 + (streak * 2));
      setStreak(prev => prev + 1);
      setFeedback({ isCorrect: true, message: "Hebat! Jawabanmu benar! 🎡" });
    } else {
      setStreak(0);
      setFeedback({ 
        isCorrect: false, 
        message: `Aduh, kurang tepat. Jawabannya adalah: ${currentQuiz.correctAnswer}. \n\n${currentQuiz.explanation} 🎢` 
      });
    }

    // Increase timeout for incorrect answers so user can read explanation
    const timeout = isCorrect ? 2000 : 5000;

    setTimeout(() => {
      setFeedback(null);
      if (quizIndex < content.quiz.length - 1) {
        setQuizIndex(prev => prev + 1);
      } else {
        setActiveWahana('flashcard');
      }
    }, timeout);
  };

  const handleFlashcardNext = () => {
    if (!content) return;
    if (flashcardIndex < content.flashcards.length - 1) {
      setFlashcardIndex(prev => prev + 1);
      setIsFlipped(false);
    } else {
      setActiveWahana('flashcard-eval');
    }
  };

  const handleFlashcardEvalAnswer = (answer: string) => {
    if (!content) return;
    const currentEval = content.flashcardEval[flashcardEvalIndex];
    const isCorrect = answer === currentEval.correctAnswer;

    if (isCorrect) {
      setPoints(prev => prev + 15);
      setStreak(prev => prev + 1);
      setFeedback({ isCorrect: true, message: "Ingatan yang tajam! ✨" });
    } else {
      setStreak(0);
      setFeedback({ 
        isCorrect: false, 
        message: `Hampir! Jawaban yang benar adalah: ${currentEval.correctAnswer}.` 
      });
    }

    setTimeout(() => {
      setFeedback(null);
      if (flashcardEvalIndex < content.flashcardEval.length - 1) {
        setFlashcardEvalIndex(prev => prev + 1);
      } else {
        setActiveWahana('summary');
      }
    }, 2000);
  };

  const calculateGrade = () => {
    if (!content) return 'C';
    const totalPossible = (content.quiz.length * 10) + (content.flashcardEval.length * 15);
    const percentage = (points / totalPossible) * 100;
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    return 'D';
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-6 py-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-pastel-purple p-2 rounded-lg">
              <Sparkles className="text-purple-600 w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 leading-none">INSIGHTARIUM LEARNING APP</h1>
              {isProfileSet && (
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-1">
                  {userName} • {university}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-pastel-yellow px-3 py-1.5 rounded-full border border-yellow-200">
              <Trophy className="text-yellow-600 w-5 h-5" />
              <span className="font-bold text-yellow-800">{points}</span>
            </div>
            <div className="flex items-center gap-2 bg-pastel-pink px-3 py-1.5 rounded-full border border-pink-200">
              <Flame className="text-pink-600 w-5 h-5" />
              <span className="font-bold text-pink-800">{streak}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {!isProfileSet ? (
            <motion.div
              key="profile-setup"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md mx-auto bg-white p-8 rounded-3xl shadow-xl border border-slate-100 space-y-8"
            >
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-pastel-purple rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="text-purple-600 w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black text-slate-800">Daftar Pengunjung 🎟️</h2>
                <p className="text-slate-500 text-sm">Isi data dirimu untuk mendapatkan tiket masuk!</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Nama Lengkap</label>
                  <input
                    type="text"
                    placeholder="Masukkan namamu..."
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-purple-400 outline-none transition-all"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Asal Universitas</label>
                  <input
                    type="text"
                    placeholder="Contoh: Universitas Indonesia"
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-purple-400 outline-none transition-all"
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                  />
                </div>
                <button
                  onClick={handleProfileSubmit}
                  disabled={!userName || !university}
                  className="w-full bg-purple-600 text-white py-4 rounded-xl font-bold hover:bg-purple-700 transition-colors disabled:opacity-50 shadow-lg shadow-purple-100"
                >
                  Dapatkan Tiket
                </button>
              </div>
            </motion.div>
          ) : !content ? (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-8"
            >
              <div className="space-y-4">
                <h2 className="text-4xl font-black text-slate-800">Selamat Datang di INSIGHTARIUM LEARNING APP! 🎡</h2>
                <p className="text-slate-500 text-lg max-w-2xl mx-auto">
                  Belajar jadi seru seperti di taman bermain. Masukkan topik yang ingin kamu pelajari dan mulai petualanganmu!
                </p>
              </div>

              <form onSubmit={handleStart} className="max-w-md mx-auto relative">
                <input
                  type="text"
                  placeholder="Contoh: Fotosintesis, Sejarah Indonesia..."
                  className="w-full px-6 py-4 rounded-2xl border-2 border-slate-200 focus:border-purple-400 outline-none text-lg shadow-sm transition-all"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !topic.trim()}
                  className="absolute right-2 top-2 bottom-2 bg-purple-600 text-white px-6 rounded-xl font-bold hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin w-5 h-5" />
                      Membangun Wahana...
                    </>
                  ) : (
                    <>
                      <Ticket className="w-5 h-5" />
                      Mulai
                    </>
                  )}
                </button>
              </form>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
                {[
                  { icon: BookOpen, title: "Kuis Cerdas", color: "bg-pastel-blue", text: "Uji pemahamanmu dengan kuis interaktif." },
                  { icon: RotateCcw, title: "Flashcard", color: "bg-pastel-green", text: "Hafalkan istilah penting dengan kartu interaktif." },
                  { icon: Flame, title: "Streak Seru", color: "bg-pastel-pink", text: "Jaga semangatmu dan kumpulkan poin!" }
                ].map((feature, i) => (
                  <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-3">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", feature.color)}>
                      <feature.icon className="w-6 h-6 text-slate-700" />
                    </div>
                    <h3 className="font-bold text-slate-800">{feature.title}</h3>
                    <p className="text-slate-500 text-sm">{feature.text}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="wahana"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
                  {/* Wahana Navigation */}
                  <div className="flex flex-wrap justify-center gap-4">
                    <button
                      onClick={() => setActiveWahana('quiz')}
                      className={cn(
                        "px-6 py-2 rounded-full font-bold transition-all flex items-center gap-2",
                        activeWahana === 'quiz' ? "bg-purple-600 text-white shadow-lg" : "bg-white text-slate-500 border border-slate-200"
                      )}
                    >
                      <Ticket className="w-4 h-4" />
                      Wahana Kuis
                    </button>
                    <button
                      onClick={() => setActiveWahana('flashcard')}
                      className={cn(
                        "px-6 py-2 rounded-full font-bold transition-all flex items-center gap-2",
                        activeWahana === 'flashcard' ? "bg-purple-600 text-white shadow-lg" : "bg-white text-slate-500 border border-slate-200"
                      )}
                    >
                      <RotateCcw className="w-4 h-4" />
                      Wahana Flashcard
                    </button>
                    <button
                      onClick={() => setActiveWahana('flashcard-eval')}
                      className={cn(
                        "px-6 py-2 rounded-full font-bold transition-all flex items-center gap-2",
                        activeWahana === 'flashcard-eval' ? "bg-purple-600 text-white shadow-lg" : "bg-white text-slate-500 border border-slate-200"
                      )}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Evaluasi Ingatan
                    </button>
                    {points > 0 && (
                      <button
                        onClick={() => setActiveWahana('summary')}
                        className={cn(
                          "px-6 py-2 rounded-full font-bold transition-all flex items-center gap-2",
                          activeWahana === 'summary' ? "bg-purple-600 text-white shadow-lg" : "bg-white text-slate-500 border border-slate-200"
                        )}
                      >
                        <Trophy className="w-4 h-4" />
                        Hasil Belajar
                      </button>
                    )}
                  </div>

              <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 md:p-12 min-h-[500px] flex flex-col items-center justify-center relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pastel-blue via-pastel-purple to-pastel-pink" />
                
                {/* Playground Decorations */}
                <Windmill className="absolute -top-4 -left-4 opacity-20 scale-75" />
                <Carousel className="absolute -bottom-8 -right-8 opacity-20 scale-75" />
                <div className="absolute top-1/4 -right-12 w-24 h-24 bg-pastel-yellow rounded-full opacity-10 blur-xl" />
                <div className="absolute bottom-1/4 -left-12 w-32 h-32 bg-pastel-pink rounded-full opacity-10 blur-xl" />

                <AnimatePresence mode="wait">
                  {isLoading ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center gap-6"
                    >
                      <div className="relative">
                        <Loader2 className="animate-spin w-16 h-16 text-purple-600" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Sparkles className="w-6 h-6 text-purple-400" />
                        </div>
                      </div>
                      <div className="space-y-2 text-center">
                        <h3 className="text-xl font-bold text-slate-800">Membangun Wahana...</h3>
                        <p className="text-slate-500 animate-pulse">{loadingTip}</p>
                      </div>
                    </motion.div>
                  ) : activeWahana === 'quiz' ? (
                    <motion.div
                      key={`quiz-${quizIndex}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="w-full max-w-2xl space-y-8 relative z-10"
                    >
                      <div className="text-center space-y-2">
                        <span className="text-purple-600 font-bold tracking-widest uppercase text-xs">Pertanyaan {quizIndex + 1} dari {content.quiz.length}</span>
                        <h3 className="text-2xl font-bold text-slate-800">{content.quiz[quizIndex].question}</h3>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        {content.quiz[quizIndex].options.map((option, i) => (
                          <button
                            key={i}
                            onClick={() => !feedback && handleQuizAnswer(option)}
                            disabled={!!feedback}
                            className={cn(
                              "w-full p-4 rounded-2xl border-2 text-left font-medium transition-all hover:scale-[1.02] active:scale-[0.98]",
                              feedback?.isCorrect && option === content.quiz[quizIndex].correctAnswer ? "bg-pastel-green border-green-400 text-green-800" :
                              feedback && !feedback.isCorrect && option === content.quiz[quizIndex].correctAnswer ? "bg-pastel-green border-green-400 text-green-800" :
                              feedback && !feedback.isCorrect && option === feedback.message.split(': ')[1].replace(' 🎢', '') ? "bg-pastel-pink border-pink-400 text-pink-800" :
                              "bg-slate-50 border-slate-100 hover:border-purple-200 text-slate-700"
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <span>{option}</span>
                              {feedback?.isCorrect && option === content.quiz[quizIndex].correctAnswer && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                            </div>
                          </button>
                        ))}
                      </div>

                      {feedback && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            "p-6 rounded-2xl text-center shadow-sm border",
                            feedback.isCorrect ? "bg-green-50 text-green-700 border-green-100" : "bg-pink-50 text-pink-700 border-pink-100"
                          )}
                        >
                          <div className="font-bold mb-2">{feedback.message.split('\n\n')[0]}</div>
                          {feedback.message.includes('\n\n') && (
                            <p className="text-sm font-medium leading-relaxed opacity-90">
                              {feedback.message.split('\n\n')[1]}
                            </p>
                          )}
                        </motion.div>
                      )}
                    </motion.div>
                  ) : activeWahana === 'flashcard' ? (
                    <motion.div
                      key="flashcard"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="w-full max-w-md space-y-8 relative z-10"
                    >
                      <div className="text-center space-y-2">
                        <span className="text-purple-600 font-bold tracking-widest uppercase text-xs">Flashcard {flashcardIndex + 1} dari {content.flashcards.length}</span>
                        <p className="text-slate-500 text-sm">Klik kartu untuk membalik!</p>
                      </div>

                      <div 
                        className="perspective-1000 w-full h-64 cursor-pointer"
                        onClick={() => setIsFlipped(!isFlipped)}
                      >
                        <motion.div 
                          className="relative w-full h-full preserve-3d transition-all duration-500"
                          animate={{ rotateY: isFlipped ? 180 : 0 }}
                        >
                          {/* Front */}
                          <div className="absolute inset-0 backface-hidden bg-pastel-yellow border-4 border-yellow-200 rounded-3xl flex items-center justify-center p-8 text-center shadow-lg">
                            <h4 className="text-xl font-bold text-slate-800">{content.flashcards[flashcardIndex]?.front}</h4>
                          </div>
                          {/* Back */}
                          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-pastel-blue border-4 border-blue-200 rounded-3xl flex items-center justify-center p-8 text-center shadow-lg">
                            <p className="text-lg font-medium text-slate-700">{content.flashcards[flashcardIndex]?.back}</p>
                          </div>
                        </motion.div>
                      </div>

                      <div className="flex justify-between items-center">
                        <button
                          disabled={flashcardIndex === 0}
                          onClick={() => {
                            setFlashcardIndex(prev => prev - 1);
                            setIsFlipped(false);
                          }}
                          className="p-3 rounded-full bg-slate-100 text-slate-500 disabled:opacity-30 hover:bg-slate-200 transition-colors"
                        >
                          <ChevronRight className="w-6 h-6 rotate-180" />
                        </button>
                        <div className="flex gap-2">
                          {content.flashcards.map((_, i) => (
                            <div 
                              key={i} 
                              className={cn(
                                "w-2 h-2 rounded-full transition-all",
                                i === flashcardIndex ? "w-4 bg-purple-600" : "bg-slate-200"
                              )} 
                            />
                          ))}
                        </div>
                        <button
                          onClick={handleFlashcardNext}
                          className="p-3 rounded-full bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-md"
                        >
                          <ChevronRight className="w-6 h-6" />
                        </button>
                      </div>
                    </motion.div>
                  ) : activeWahana === 'flashcard-eval' ? (
                    <motion.div
                      key={`eval-${flashcardEvalIndex}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="w-full max-w-2xl space-y-8 relative z-10"
                    >
                      <div className="text-center space-y-2">
                        <span className="text-purple-600 font-bold tracking-widest uppercase text-xs">Evaluasi {flashcardEvalIndex + 1} dari {content.flashcardEval.length}</span>
                        <h3 className="text-2xl font-bold text-slate-800">{content.flashcardEval[flashcardEvalIndex].question}</h3>
                        <p className="text-slate-500 text-sm italic">Uji ingatanmu dari flashcard tadi!</p>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        {content.flashcardEval[flashcardEvalIndex].options.map((option, i) => (
                          <button
                            key={i}
                            onClick={() => !feedback && handleFlashcardEvalAnswer(option)}
                            disabled={!!feedback}
                            className={cn(
                              "w-full p-4 rounded-2xl border-2 text-left font-medium transition-all hover:scale-[1.02] active:scale-[0.98]",
                              feedback?.isCorrect && option === content.flashcardEval[flashcardEvalIndex].correctAnswer ? "bg-pastel-green border-green-400 text-green-800" :
                              feedback && !feedback.isCorrect && option === content.flashcardEval[flashcardEvalIndex].correctAnswer ? "bg-pastel-green border-green-400 text-green-800" :
                              feedback && !feedback.isCorrect && option === feedback.message.split(': ')[1] ? "bg-pastel-pink border-pink-400 text-pink-800" :
                              "bg-slate-50 border-slate-100 hover:border-purple-200 text-slate-700"
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <span>{option}</span>
                              {feedback?.isCorrect && option === content.flashcardEval[flashcardEvalIndex].correctAnswer && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                            </div>
                          </button>
                        ))}
                      </div>

                      {feedback && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            "p-6 rounded-2xl text-center shadow-sm border",
                            feedback.isCorrect ? "bg-green-50 text-green-700 border-green-100" : "bg-pink-50 text-pink-700 border-pink-100"
                          )}
                        >
                          <div className="font-bold">{feedback.message}</div>
                        </motion.div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="summary"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="w-full max-w-md text-center space-y-8 relative z-10"
                    >
                      <div className="space-y-2">
                        <div className="w-20 h-20 bg-pastel-yellow rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-yellow-200">
                          <Trophy className="text-yellow-600 w-10 h-10" />
                        </div>
                        <h3 className="text-3xl font-black text-slate-800">Petualangan Selesai!</h3>
                        <p className="text-slate-500">Hebat, {userName}! Kamu telah menyelesaikan wahana belajar ini.</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-pastel-blue p-6 rounded-2xl border border-blue-100">
                          <div className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Total Poin</div>
                          <div className="text-4xl font-black text-blue-800">{points}</div>
                        </div>
                        <div className="bg-pastel-pink p-6 rounded-2xl border border-pink-100">
                          <div className="text-xs font-bold text-pink-600 uppercase tracking-widest mb-1">Nilai Akhir</div>
                          <div className="text-4xl font-black text-pink-800">{calculateGrade()}</div>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-slate-500 font-medium">Topik Belajar:</span>
                          <span className="font-bold text-slate-800">{topic}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-medium">Asal Kampus:</span>
                          <span className="font-bold text-slate-800">{university}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setContent(null);
                          setTopic('');
                          setPoints(0);
                          setStreak(0);
                        }}
                        className="w-full bg-purple-600 text-white py-4 rounded-2xl font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-100 flex items-center justify-center gap-2"
                      >
                        <RotateCcw className="w-5 h-5" />
                        Main Lagi!
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-6 py-12 text-center text-slate-400 text-sm">
        <p>© 2026 INSIGHTARIUM LEARNING APP - Belajar Seru Setiap Hari 🎢</p>
      </footer>
    </div>
  );
}
