import { questionSchema, questionsSchema, difficultySchema, getQuestionCountByDifficulty } from "@/lib/schemas";
import { google } from "@ai-sdk/google";
import { streamObject } from "ai";
import { z } from "zod";

export const maxDuration = 60;

// Language schema
const languageSchema = z.enum(["english", "arabic", "spanish", "french", "german", "chinese"]);
type Language = z.infer<typeof languageSchema>;

// Language display names for prompts
const languageNames: Record<Language, string> = {
  english: "English",
  arabic: "Arabic",
  spanish: "Spanish",
  french: "French",
  german: "German",
  chinese: "Chinese"
};

export async function POST(req: Request) {
  try {
    const { files, difficulty = "normal", language = "english" } = await req.json();
    const firstFile = files[0].data;
    
    // Validate and parse difficulty
    const parsedDifficulty = difficultySchema.safeParse(difficulty);
    const validDifficulty = parsedDifficulty.success ? parsedDifficulty.data : "normal";
    
    // Validate and parse language
    const parsedLanguage = languageSchema.safeParse(language);
    const validLanguage = parsedLanguage.success ? parsedLanguage.data : "english";
    
    // Get question count range based on difficulty
    const { min, max } = getQuestionCountByDifficulty(validDifficulty);
    // Random number of questions within the range
    const questionCount = Math.floor(Math.random() * (max - min + 1)) + min;

    // Create a new TransformStream for handling the data
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Handle the quiz generation in the background
    (async () => {
      try {
        const result = await streamObject({
          model: google("gemini-1.5-pro-latest"),
          messages: [
            {
              role: "system",
              content: `You are a teacher. Your job is to take a document, and create a multiple choice test with ${questionCount} questions based on the content of the document in ${languageNames[validLanguage]} language. 
              
Difficulty level: ${validDifficulty.toUpperCase()}
Output language: ${languageNames[validLanguage].toUpperCase()}

For the ${validDifficulty} difficulty level:
${validDifficulty === "easy" ? 
  "- Focus on basic concepts and straightforward information explicitly stated in the text.\n- Keep questions simple and direct.\n- Make distractors clearly different from the correct answer." : 
  validDifficulty === "normal" ? 
  "- Include a mix of straightforward and moderately challenging questions.\n- Test understanding of concepts beyond simple recall.\n- Make distractors somewhat plausible but distinguishable." : 
  "- Create challenging questions that require deep understanding of the material.\n- Include questions that require synthesis of multiple concepts.\n- Make distractors very plausible and require careful analysis to distinguish from the correct answer."}

Each option should be roughly equal in length. Each question should have exactly 4 options (A, B, C, D).

IMPORTANT: Regardless of the language of the input document, ALL your output must be in ${languageNames[validLanguage]} only.`,
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Create a ${validDifficulty} difficulty multiple choice test with ${questionCount} questions based on this document in ${languageNames[validLanguage]} language. Make sure to extract the key concepts.`,
                },
                {
                  type: "file",
                  data: firstFile,
                  mimeType: "application/pdf",
                },
              ],
            },
          ],
          schema: questionSchema,
          output: "array",
          temperature: validDifficulty === "easy" ? 0.3 : validDifficulty === "normal" ? 0.5 : 0.7,
          onFinish: ({ object }) => {
            const res = questionsSchema.safeParse(object);
            if (res.error) {
              throw new Error(res.error.errors.map((e) => e.message).join("\n"));
            }
          },
        });

        // Convert the result to a response and pipe it to our stream
        const response = await result.toTextStreamResponse();
        const reader = response.body?.getReader();
        
        if (!reader) {
          throw new Error('No reader available from response');
        }

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          await writer.write(value);
        }
      } catch (error) {
        console.error('Streaming error:', error);
        const errorMessage = JSON.stringify({ 
          error: 'Failed to generate quiz. Please try again or contact support.' 
        });
        await writer.write(new TextEncoder().encode(errorMessage));
      } finally {
        await writer.close();
      }
    })();

    return new Response(stream.readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (error) {
    console.error('Error generating quiz:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate quiz. Please try again with a smaller PDF or contact support.' 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
