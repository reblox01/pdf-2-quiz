import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  RefreshCw,
  FileText,
  Keyboard,
  BrainCircuit,
  RotateCcw,
  Shuffle,
} from "lucide-react";
import QuizScore from "./score";
import QuizReview from "./quiz-overview";
import { Question } from "@/lib/schemas";
import { Badge } from "@/components/ui/badge";

type QuizProps = {
  questions: Question[];
  clearPDF: () => void;
  title: string;
  regenerateQuiz?: () => void;
};

const QuestionCard: React.FC<{
  question: Question;
  selectedAnswer: string | null;
  onSelectAnswer: (answer: string) => void;
  isSubmitted: boolean;
  showCorrectAnswer: boolean;
}> = ({ question, selectedAnswer, onSelectAnswer, showCorrectAnswer }) => {
  const answerLabels = ["A", "B", "C", "D"];

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (!showCorrectAnswer) {
      const key = e.key.toUpperCase();
      if (answerLabels.includes(key)) {
        onSelectAnswer(key);
      }
    }
  }, [onSelectAnswer, showCorrectAnswer, answerLabels]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-lg font-semibold leading-tight">
        {question.question}
      </h2>
      <div className="grid grid-cols-1 gap-4">
        {question.options.map((option, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Button
              variant={
                selectedAnswer === answerLabels[index] ? "secondary" : "outline"
              }
              className={`h-auto py-6 px-4 justify-start text-left whitespace-normal w-full
                ${
                  showCorrectAnswer && answerLabels[index] === question.answer
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : showCorrectAnswer &&
                      selectedAnswer === answerLabels[index] &&
                      selectedAnswer !== question.answer
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : ""
                }`}
              onClick={() => onSelectAnswer(answerLabels[index])}
            >
              <span className="text-lg font-medium mr-4 shrink-0">
                {answerLabels[index]}
              </span>
              <span className="flex-grow">{option}</span>
              {showCorrectAnswer && answerLabels[index] === question.answer && (
                <Check className="ml-2 shrink-0 text-white" size={20} />
              )}
              {showCorrectAnswer &&
                selectedAnswer === answerLabels[index] &&
                selectedAnswer !== question.answer && (
                  <X className="ml-2 shrink-0 text-white" size={20} />
                )}
            </Button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default function Quiz({
  questions,
  clearPDF,
  title = "Quiz",
  regenerateQuiz,
}: QuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>(
    Array(questions.length).fill(null),
  );
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  
  // Determine difficulty level based on number of questions
  const difficultyLevel = useMemo(() => {
    if (questions.length <= 10) return "easy";
    if (questions.length <= 20) return "normal";
    return "hard";
  }, [questions.length]);
  
  // Get badge color based on difficulty
  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "easy": return "bg-green-500/10 text-green-500";
      case "normal": return "bg-blue-500/10 text-blue-500";
      case "hard": return "bg-red-500/10 text-red-500";
      default: return "";
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress((currentQuestionIndex / questions.length) * 100);
    }, 100);
    return () => clearTimeout(timer);
  }, [currentQuestionIndex, questions.length]);

  const handleSelectAnswer = (answer: string) => {
    if (!isSubmitted) {
      const newAnswers = [...answers];
      newAnswers[currentQuestionIndex] = answer;
      setAnswers(newAnswers);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
    const correctAnswers = questions.reduce((acc, question, index) => {
      return acc + (question.answer === answers[index] ? 1 : 0);
    }, 0);
    setScore(correctAnswers);
  };

  const handleReset = () => {
    setAnswers(Array(questions.length).fill(null));
    setIsSubmitted(false);
    setScore(null);
    setCurrentQuestionIndex(0);
    setProgress(0);
  };

  const currentQuestion = questions[currentQuestionIndex];

  const handleKeyNavigation = useCallback((e: KeyboardEvent) => {
    if (e.key === "ArrowLeft" && currentQuestionIndex > 0) {
      handlePreviousQuestion();
    } else if (
      e.key === "ArrowRight" &&
      currentQuestionIndex < questions.length - 1 &&
      answers[currentQuestionIndex] !== null
    ) {
      handleNextQuestion();
    } else if (
      e.key === "Enter" &&
      currentQuestionIndex === questions.length - 1 &&
      answers[currentQuestionIndex] !== null &&
      !isSubmitted
    ) {
      handleSubmit();
    }
  }, [currentQuestionIndex, questions.length, answers, isSubmitted]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyNavigation);
    return () => window.removeEventListener("keydown", handleKeyNavigation);
  }, [handleKeyNavigation]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-4">
          <motion.h1 
            className="text-3xl font-bold text-center text-foreground"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {title}
          </motion.h1>
          
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex items-center mt-2 sm:mt-0"
          >
            <BrainCircuit className="h-4 w-4 mr-2" />
            <Badge className={getDifficultyColor(difficultyLevel)}>
              {difficultyLevel.charAt(0).toUpperCase() + difficultyLevel.slice(1)} · {questions.length} Questions
            </Badge>
          </motion.div>
        </div>
        
        <div className="relative">
          {!isSubmitted && (
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Progress value={progress} className="h-1 mb-8" />
            </motion.div>
          )}
          
          <div className="min-h-[400px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={isSubmitted ? "results" : currentQuestionIndex}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
                {!isSubmitted ? (
                  <div className="space-y-8">
                    <QuestionCard
                      question={currentQuestion}
                      selectedAnswer={answers[currentQuestionIndex]}
                      onSelectAnswer={handleSelectAnswer}
                      isSubmitted={isSubmitted}
                      showCorrectAnswer={false}
                    />
                    <div className="flex justify-between items-center pt-4">
                      <Button
                        onClick={handlePreviousQuestion}
                        disabled={currentQuestionIndex === 0}
                        variant="ghost"
                        className="space-x-2"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span>Previous</span>
                      </Button>
                      
                      <div className="flex flex-col items-center space-y-2">
                        <span className="text-sm font-medium">
                          Question {currentQuestionIndex + 1} of {questions.length}
                        </span>
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                          <Keyboard className="h-3 w-3" />
                          <span>Use arrow keys to navigate</span>
                        </div>
                      </div>
                      
                      <Button
                        onClick={handleNextQuestion}
                        disabled={answers[currentQuestionIndex] === null}
                        variant="ghost"
                        className="space-x-2"
                      >
                        <span>
                          {currentQuestionIndex === questions.length - 1
                            ? "Submit"
                            : "Next"}
                        </span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <motion.div 
                    className="space-y-8"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <QuizScore
                      correctAnswers={score ?? 0}
                      totalQuestions={questions.length}
                    />
                    <div className="space-y-12">
                      <QuizReview questions={questions} userAnswers={answers} />
                    </div>
                    <motion.div 
                      className="flex flex-wrap justify-center gap-4 pt-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <Button
                        onClick={handleReset}
                        variant="outline"
                        className="bg-muted hover:bg-muted/80 space-x-2"
                      >
                        <RefreshCw className="h-4 w-4" />
                        <span>Try Again</span>
                      </Button>
                      
                      {regenerateQuiz && (
                        <Button
                          onClick={regenerateQuiz}
                          variant="secondary"
                          className="space-x-2"
                        >
                          <Shuffle className="h-4 w-4" />
                          <span>New Questions</span>
                        </Button>
                      )}
                      
                      <Button
                        onClick={clearPDF}
                        variant="default"
                        className="space-x-2"
                      >
                        <FileText className="h-4 w-4" />
                        <span>New PDF</span>
                      </Button>
                    </motion.div>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
