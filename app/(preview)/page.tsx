"use client";

import { useState } from "react";
import { experimental_useObject } from "ai/react";
import { questionsSchema, difficultySchema, Difficulty, getQuestionCountByDifficulty } from "@/lib/schemas";
import { z } from "zod";
import { toast } from "sonner";
import { FileUp, Plus, Loader2, Moon, Sun, BrainCircuit, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Quiz from "@/components/quiz";
import { Link } from "@/components/ui/link";
import NextLink from "next/link";
import { generateQuizTitle } from "./actions";
import { AnimatePresence, motion } from "framer-motion";
import { VercelIcon, GitIcon } from "@/components/icons";
import { useTheme } from "next-themes";
import { formatFileSize } from "@/lib/utils";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

// Add language type definition after other imports
const languageSchema = z.enum(["english", "arabic", "spanish", "french", "german", "chinese"]);
type Language = z.infer<typeof languageSchema>;

export default function ChatWithFiles() {
  const [files, setFiles] = useState<File[]>([]);
  const [questions, setQuestions] = useState<z.infer<typeof questionsSchema>>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [title, setTitle] = useState<string>();
  const { theme, setTheme } = useTheme();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [language, setLanguage] = useState<Language>("english");

  const {
    submit,
    object: partialQuestions,
    isLoading,
  } = experimental_useObject({
    api: "/api/generate-quiz",
    schema: questionsSchema,
    initialValue: undefined,
    onError: (error) => {
      toast.error("Failed to generate quiz. Please try again.");
      setFiles([]);
      setUploadProgress(0);
    },
    onFinish: ({ object }) => {
      setQuestions(object ?? []);
      setUploadProgress(0);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement> | { target: { files: FileList } }) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter((file) => {
      if (file.type !== "application/pdf") {
        toast.error(`${file.name} is not a PDF file`);
        return false;
      }
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`${file.name} is larger than 20MB`);
        return false;
      }
      return true;
    });

    setFiles(validFiles);
    if (validFiles.length > 0) {
      toast.success(`${validFiles[0].name} (${formatFileSize(validFiles[0].size)}) ready to upload`);
    }
  };

  const encodeFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmitWithFiles = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + 1, 90));
    }, 500);

    try {
    const encodedFiles = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        type: file.type,
        data: await encodeFileAsBase64(file),
      })),
    );
      submit({ files: encodedFiles, difficulty, language });
    const generatedTitle = await generateQuizTitle(encodedFiles[0].name);
    setTitle(generatedTitle);
    } finally {
      clearInterval(interval);
      setUploadProgress(100);
    }
  };

  const clearPDF = () => {
    setFiles([]);
    setQuestions([]);
  };

  // Calculate approximate question count for display
  const questionRange = getQuestionCountByDifficulty(difficulty);
  const averageQuestionCount = Math.floor((questionRange.min + questionRange.max) / 2);

  // Use the partialQuestions length if available, otherwise use the average for the selected difficulty
  const expectedQuestionCount = partialQuestions?.length || averageQuestionCount;
  const progress = partialQuestions ? (partialQuestions.length / expectedQuestionCount) * 100 : 0;

  // Add a regenerate function 
  const regenerateQuiz = async () => {
    // Clear current questions but keep the same PDF
    setQuestions([]);
    setUploadProgress(0);
    
    const interval = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + 1, 90));
    }, 500);

    try {
      if (files.length > 0) {
        const encodedFiles = await Promise.all(
          files.map(async (file) => ({
            name: file.name,
            type: file.type,
            data: await encodeFileAsBase64(file),
          })),
        );
        
        // Generate new quiz
        submit({ files: encodedFiles, difficulty, language });
        toast.success("Generating new questions...");
      }
    } catch (error) {
      toast.error("Failed to regenerate quiz. Please try again.");
    } finally {
      clearInterval(interval);
      setUploadProgress(100);
    }
  };

  if (questions.length > 0) {
    return (
      <Quiz 
        title={title ?? "Quiz"} 
        questions={questions} 
        clearPDF={clearPDF}
        regenerateQuiz={regenerateQuiz}
      />
    );
  }

  // Get badge color based on difficulty
  const getDifficultyColor = (diff: Difficulty) => {
    switch (diff) {
      case "easy": return "bg-green-500/10 text-green-500";
      case "normal": return "bg-blue-500/10 text-blue-500";
      case "hard": return "bg-red-500/10 text-red-500";
      default: return "";
    }
  };

  return (
    <div
      className="min-h-[100dvh] w-full flex flex-col justify-center items-center relative px-4 sm:px-6 py-8 sm:py-16"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragExit={() => setIsDragging(false)}
      onDragEnd={() => setIsDragging(false)}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFileChange({
          target: { files: e.dataTransfer.files },
        });
      }}
    >
      <Button
        variant="outline"
        size="icon"
        className="fixed top-6 right-6 z-10 rounded-full w-10 h-10 shadow-md"
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      >
        {theme === "light" ? (
          <Moon className="h-[1.2rem] w-[1.2rem]" />
        ) : (
          <Sun className="h-[1.2rem] w-[1.2rem]" />
        )}
        <span className="sr-only">Toggle theme</span>
      </Button>
      
      <AnimatePresence>
        {isDragging && (
          <motion.div
            className="fixed pointer-events-none dark:bg-zinc-900/90 h-dvh w-dvw z-10 justify-center items-center flex flex-col gap-1 bg-zinc-100/90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <FileUp className="h-12 w-12 mb-4 animate-bounce" />
            <div className="text-xl font-semibold">Drop your PDF here</div>
            <div className="text-sm dark:text-zinc-400 text-zinc-500">
              Maximum size: 20MB
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <Card className="w-full max-w-md h-full border-0 sm:border sm:h-fit sm:my-8 relative overflow-hidden mx-auto shadow-lg">
        {(isLoading || uploadProgress > 0) && (
          <div className="absolute top-0 left-0 w-full h-1 bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 ease-in-out"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}
        
        <CardHeader className="text-center space-y-6 px-6 pt-6 pb-4">
          <motion.div 
            className="mx-auto flex items-center justify-center space-x-2 text-muted-foreground"
            animate={{ 
              scale: isLoading ? [1, 1.05, 1] : 1,
              transition: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }
            }}
          >
            <div className="rounded-full bg-primary/10 p-2 transition-colors hover:bg-primary/20">
              <FileUp className="h-6 w-6" />
            </div>
            <Plus className="h-4 w-4 animate-pulse" />
            <div className="rounded-full bg-primary/10 p-2 transition-colors hover:bg-primary/20">
              <Loader2 className={`h-6 w-6 ${isLoading ? 'animate-spin' : ''}`} />
            </div>
          </motion.div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              PDF Quiz Generator
            </CardTitle>
            <CardDescription className="text-base leading-relaxed">
              Upload a PDF to generate an interactive quiz based on its content
              using the <Link href="https://sdk.vercel.ai">AI SDK</Link> and{" "}
              <Link href="https://sdk.vercel.ai/providers/ai-sdk-providers/google-generative-ai">
                Google&apos;s Gemini Pro
              </Link>
              .
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="px-6 py-4 space-y-6">
          <form onSubmit={handleSubmitWithFiles} className="space-y-6">
            <motion.div
              className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 transition-colors
                ${isDragging 
                  ? 'border-primary bg-primary/5' 
                  : files.length > 0 
                    ? 'border-green-500/50 bg-green-500/5' 
                    : 'border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/10'}`}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <input
                type="file"
                onChange={handleFileChange}
                accept="application/pdf"
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
                {files.length > 0 ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <FileUp className="h-5 w-5 text-green-500" />
                  </div>
                  <span className="font-medium text-foreground text-center">
                    {files[0].name}
                  </span>
                  <Badge variant="outline" className="text-green-500 bg-green-500/10 border-green-500/20">
                    {formatFileSize(files[0].size)}
                  </Badge>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <FileUp className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-center">
                    Drop your PDF here or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs text-center">
                    Upload a PDF document to generate a quiz based on its content. Maximum file size: 20MB
                  </p>
                </div>
              )}
            </motion.div>
            
            <div className="space-y-2">
              <label htmlFor="difficulty-selector" className="text-sm font-medium flex items-center gap-2">
                <BrainCircuit className="h-4 w-4 text-primary" />
                <span>Difficulty Level</span>
              </label>
              <Select 
                value={difficulty} 
                onValueChange={(value) => setDifficulty(value as Difficulty)}
              >
                <SelectTrigger className="w-full rounded-md border-muted-foreground/20 focus:ring-primary">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent className="rounded-md border-muted-foreground/20">
                  <SelectItem value="easy" className="cursor-pointer focus:bg-primary/10">
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium">Easy</span>
                      <Badge className={`ml-2 ${getDifficultyColor("easy")}`}>
                        {questionRange.min}-{questionRange.max} Questions
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="normal" className="cursor-pointer focus:bg-primary/10">
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium">Normal</span>
                      <Badge className={`ml-2 ${getDifficultyColor("normal")}`}>
                        {getQuestionCountByDifficulty("normal").min}-{getQuestionCountByDifficulty("normal").max} Questions
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="hard" className="cursor-pointer focus:bg-primary/10">
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium">Hard</span>
                      <Badge className={`ml-2 ${getDifficultyColor("hard")}`}>
                        {getQuestionCountByDifficulty("hard").min}-{getQuestionCountByDifficulty("hard").max} Questions
                      </Badge>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {difficulty === "easy" 
                  ? "Basic concepts with straightforward questions" 
                  : difficulty === "normal" 
                  ? "Mix of basic and challenging questions" 
                  : "Advanced concepts with complex questions"}
              </p>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="language-selector" className="text-sm font-medium flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                <span>Quiz Language</span>
              </label>
              <Select 
                value={language} 
                onValueChange={(value) => setLanguage(value as Language)}
              >
                <SelectTrigger className="w-full rounded-md border-muted-foreground/20 focus:ring-primary">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent className="rounded-md border-muted-foreground/20">
                  <SelectItem value="english" className="cursor-pointer focus:bg-primary/10">
                    <span className="font-medium">English</span>
                  </SelectItem>
                  <SelectItem value="arabic" className="cursor-pointer focus:bg-primary/10">
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium">Arabic</span>
                      <span className="text-muted-foreground text-sm">(العربية)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="spanish" className="cursor-pointer focus:bg-primary/10">
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium">Spanish</span>
                      <span className="text-muted-foreground text-sm">(Español)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="french" className="cursor-pointer focus:bg-primary/10">
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium">French</span>
                      <span className="text-muted-foreground text-sm">(Français)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="german" className="cursor-pointer focus:bg-primary/10">
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium">German</span>
                      <span className="text-muted-foreground text-sm">(Deutsch)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="chinese" className="cursor-pointer focus:bg-primary/10">
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium">Chinese</span>
                      <span className="text-muted-foreground text-sm">(中文)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The language in which the quiz questions and answers will be generated
              </p>
            </div>
            
            <Button
              type="submit"
              className="w-full relative overflow-hidden group"
              disabled={files.length === 0 || isLoading}
            >
              {isLoading ? (
                <motion.span 
                  className="flex items-center justify-center space-x-2 w-full"
                  animate={{ opacity: [1, 0.7, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Generating Quiz...</span>
                </motion.span>
              ) : (
                <span className="flex items-center justify-center">
                  <span>Generate Quiz</span>
                </span>
              )}
              {isLoading && (
                <motion.div 
                  className="absolute bottom-0 left-0 h-1 bg-primary"
                  style={{ width: `${uploadProgress}%` }}
                  initial={{ width: "0%" }}
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </Button>
          </form>
        </CardContent>
        
        {isLoading && (
          <CardFooter className="px-6 py-5 border-t">
            <div className="w-full space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-foreground flex items-center">
                  <span className="inline-block h-2 w-2 bg-primary rounded-full mr-2 animate-pulse"></span>
                  Generating {difficulty} questions
                </span>
                <Badge variant="outline">{Math.round(progress)}%</Badge>
              </div>
              <Progress value={progress} className="h-1.5" />
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                <Badge variant="secondary" className="font-normal">
                  ~{expectedQuestionCount} questions
                </Badge>
                <Badge variant="secondary" className="font-normal capitalize">
                  {difficulty} difficulty
                </Badge>
                <Badge variant="secondary" className="font-normal capitalize">
                  {language} language
                </Badge>
              </div>
            </div>
          </CardFooter>
        )}
      </Card>
      <motion.div
        className="flex flex-row gap-4 items-center justify-center sm:justify-between fixed bottom-0 text-xs max-w-md mx-auto px-4 w-full pb-6 pt-4 bg-gradient-to-t from-background to-transparent"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <NextLink
          target="_blank"
          href="https://github.com/reblox01"
          className="flex flex-row gap-2 items-center border px-3 py-2 rounded-md hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800"
        >
          <GitIcon />
          <span className="hidden sm:block">@reblox01</span>
          <span className="sm:hidden">GitHub</span>
        </NextLink>

        <div className="text-center text-muted-foreground flex items-center">
          <span>Created by <span className="font-medium text-foreground">0x8D</span></span>
        </div>

        <NextLink
          target="_blank"
          href="https://sohail-koutari.vercel.app"
          className="flex flex-row gap-2 items-center bg-zinc-900 px-3 py-2 rounded-md text-zinc-50 hover:bg-zinc-950 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-50"
        >
          <span className="hidden sm:block">Visit Website</span>
          <span className="sm:hidden">Portfolio</span>
        </NextLink>
      </motion.div>
    </div>
  );
}
