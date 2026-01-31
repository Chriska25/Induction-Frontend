import React, { useState } from 'react';
import { QuizData, QuizQuestion } from '../types';
import './Quiz.css';

interface QuizProps {
  quizData: QuizData;
  onComplete: (score: number) => void;
}

const Quiz: React.FC<QuizProps> = ({ quizData, onComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [questionTimeLeft, setQuestionTimeLeft] = useState<number | null>(null);

  const [shuffledQuestions, setShuffledQuestions] = useState<QuizQuestion[]>([]);

  // Shuffle helper
  const shuffleArray = (array: QuizQuestion[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  // Initialize shuffled questions
  React.useEffect(() => {
    if (quizData.questions) {
      setShuffledQuestions(shuffleArray(quizData.questions));
    }
  }, [quizData]);

  // Global Quiz Timer
  React.useEffect(() => {
    if (quizData.timeLimit && quizData.timeLimit > 0 && !showResults) {
      setTimeLeft(quizData.timeLimit * 60);
    } else {
      setTimeLeft(null);
    }
  }, [quizData.timeLimit, showResults]);

  React.useEffect(() => {
    if (timeLeft === null || showResults) return;

    if (timeLeft <= 0) {
      calculateScore(answers);
      setShowResults(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, showResults]);

  // Question Timer
  React.useEffect(() => {
    if (shuffledQuestions.length === 0) return;
    const q = shuffledQuestions[currentQuestion];
    if (q && q.timeLimit && q.timeLimit > 0 && !showResults) {
      setQuestionTimeLeft(q.timeLimit);
    } else {
      setQuestionTimeLeft(null);
    }
  }, [currentQuestion, shuffledQuestions, showResults]);

  React.useEffect(() => {
    if (questionTimeLeft === null || showResults) return;

    if (questionTimeLeft <= 0) {
      // Timeout for this question
      const q = shuffledQuestions[currentQuestion];
      if (q && q.timeLimit && q.timeLimit > 0) {
        handleAnswer(-1);
      }
      return;
    }

    const timer = setInterval(() => {
      setQuestionTimeLeft(prev => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [questionTimeLeft, showResults, currentQuestion, shuffledQuestions]);


  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleAnswer = (answerIndex: number) => {
    // If answerIndex is -1 (timeout), we treat as wrong (e.g. -1 !== correct)

    // Reset timer immediately to prevent race condition where next render sees 0 and skips next question
    setQuestionTimeLeft(null);

    const newAnswers = [...answers, answerIndex];
    setAnswers(newAnswers);

    if (currentQuestion < shuffledQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateScore(newAnswers);
      setShowResults(true);
    }
  };

  const calculateScore = (userAnswers: number[]) => {
    let correct = 0;
    shuffledQuestions.forEach((question, index) => {
      if (userAnswers[index] === question.correct) {
        correct++;
      }
    });
    const percentage = (correct / shuffledQuestions.length) * 100;
    setScore(percentage);
    onComplete(percentage);
  };

  const resetQuiz = () => {
    // Reshuffle on reset
    setShuffledQuestions(shuffleArray(quizData.questions));
    setCurrentQuestion(0);
    setAnswers([]);
    setShowResults(false);
    setScore(0);
    if (quizData.timeLimit) setTimeLeft(quizData.timeLimit * 60);
    // Question timer will be reset by the effect when shuffledQuestions updates or currentQuestion changes
    // We don't need to manually set it here as the effect depends on shuffledQuestions and currentQuestion
  };

  if (showResults) {
    return (
      <div className="quiz-results">
        <h2>Résultats du Quiz</h2>
        <div className={`score-display ${score >= 80 ? 'success' : 'failure'}`}>
          <div className="score-value">{score.toFixed(0)}%</div>
          <div className="score-label">
            {score >= 80
              ? 'Félicitations ! Vous avez réussi le quiz.'
              : timeLeft === 0 ? 'Temps écoulé !' : 'Score insuffisant. Veuillez réessayer.'}
          </div>
        </div>
        <div className="results-details">
          <p>
            Vous avez répondu correctement à{' '}
            {answers.filter((ans, idx) => ans === shuffledQuestions[idx]?.correct).length} sur{' '}
            {shuffledQuestions.length} questions.
          </p>
        </div>
        {score < 80 && (
          <button className="btn-retry" onClick={resetQuiz}>
            Réessayer le quiz
          </button>
        )}
      </div>
    );
  }

  if (shuffledQuestions.length === 0) return <div>Chargement du quiz...</div>;

  const question = shuffledQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / shuffledQuestions.length) * 100;

  return (
    <div className="quiz">
      <div className="quiz-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>{quizData.title}</h2>
          {questionTimeLeft !== null ? (
            <div className={`quiz-timer ${questionTimeLeft < 10 ? 'timer-warning' : ''}`}>
              ⏳ Question : {formatTime(questionTimeLeft)}
            </div>
          ) : timeLeft !== null ? (
            <div className={`quiz-timer ${timeLeft < 60 ? 'timer-warning' : ''}`}>
              ⏱️ {formatTime(timeLeft)}
            </div>
          ) : null}
        </div>
        <p className="quiz-instructions">{quizData.instructions}</p>
        <div className="quiz-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <span className="progress-text">
            Question {currentQuestion + 1} sur {shuffledQuestions.length}
          </span>
        </div>
      </div>

      <div className="question-container">
        <h3 className="question-text">{question.question}</h3>
        <div className="options-container">
          {question.options.map((option, index) => (
            <button
              key={index}
              className="option-button"
              onClick={() => handleAnswer(index)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Quiz;
