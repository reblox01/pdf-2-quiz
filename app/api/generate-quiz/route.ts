import { questionSchema, questionsSchema } from "@/lib/schemas";
import { google } from "@ai-sdk/google";
import { streamObject } from "ai";

export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const { files } = await req.json();
    const firstFile = files[0].data;

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
              content:
                "You are a teacher. Your job is to take a document, and create a multiple choice test (with 4 questions) based on the content of the document. Each option should be roughly equal in length. Focus on the most important concepts from the document.",
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Create a multiple choice test based on this document. Make sure to extract the key concepts.",
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
          temperature: 0.7,
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
