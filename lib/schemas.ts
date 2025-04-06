import { z } from "zod";

export const questionSchema = z.object({
  question: z.string(),
  options: z
    .array(z.string())
    .length(4)
    .describe(
      "Four possible answers to the question. Only one should be correct. They should all be of equal lengths.",
    ),
  answer: z
    .enum(["A", "B", "C", "D"])
    .describe(
      "The correct answer, where A is the first option, B is the second, and so on.",
    ),
});

export type Question = z.infer<typeof questionSchema>;

// Dynamic schema that supports variable question counts
export const questionsSchema = z.array(questionSchema);

// Difficulty level definition
export const difficultySchema = z.enum(["easy", "normal", "hard"]);
export type Difficulty = z.infer<typeof difficultySchema>;

// Helper function to get question count range based on difficulty
export function getQuestionCountByDifficulty(difficulty: Difficulty): { min: number; max: number } {
  switch (difficulty) {
    case "easy":
      return { min: 5, max: 10 };
    case "normal":
      return { min: 10, max: 20 };
    case "hard":
      return { min: 20, max: 30 }; // Reduced from 50 to 30 for practical reasons
    default:
      return { min: 5, max: 10 }; // Default
  }
}
