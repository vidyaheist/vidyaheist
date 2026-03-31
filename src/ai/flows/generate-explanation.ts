// src/ai/flows/generate-explanation.ts
'use server';

/**
 * @fileOverview AI-powered explanation generator for incorrect answers.
 *
 * - generateExplanation - A function that generates explanations for incorrect answers.
 * - GenerateExplanationInput - The input type for the generateExplanation function.
 * - GenerateExplanationOutput - The return type for the generateExplanation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateExplanationInputSchema = z.object({
  question: z.string().describe('The question that was answered incorrectly.'),
  studentAnswer: z.string().describe('The student\'s incorrect answer.'),
  correctAnswer: z.string().describe('The correct answer to the question.'),
  topic: z.string().describe('The topic of the question.'),
});

export type GenerateExplanationInput = z.infer<typeof GenerateExplanationInputSchema>;

const GenerateExplanationOutputSchema = z.object({
  explanation: z.string().describe('The AI-generated explanation of why the student\'s answer was incorrect and why the correct answer is correct.'),
});

export type GenerateExplanationOutput = z.infer<typeof GenerateExplanationOutputSchema>;

export async function generateExplanation(input: GenerateExplanationInput) {
  return generateExplanationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateExplanationPrompt',
  input: {schema: GenerateExplanationInputSchema},
  prompt: `You are a world-class academic tutor. Your goal is to provide a structured, step-by-step pedagogical explanation for a student who has answered a question incorrectly.

  Topic: {{{topic}}}
  Question: {{{question}}}
  Student's Answer: {{{studentAnswer}}}
  Correct Answer: {{{correctAnswer}}}

  Your explanation MUST be formatted in Markdown with the following sections:

  ### 1. Concept Overview 📖
  Briefly explain the core scientific/mathematical principle involved in this question. Use LaTeX for formulas where appropriate.

  ### 2. Step-by-Step Solution 🧠
  Break down the logic required to reach the correct answer. Use bullet points and ensure LaTeX formulas (if any) are correctly formatted (e.g., $$E = mc^2$$).

  ### 3. Why the Student's Answer is a Common Pitfall ⚠️
  Analyze why a student might choose an incorrect option (e.g., miscalculation, wrong formula, or conceptual misunderstanding).

  ### 4. Common Mistakes to Avoid 🚫
  List 2-3 common traps or mistakes related to this topic.

  ### 5. Fundamental Takeaway ✨
  One sentence summarizing the key rule or concept to remember for future questions.

  Use clear, encouraging language. Keep the explanation professional and concise.
  `,
});

export const generateExplanationFlow = ai.defineFlow(
  {
    name: 'generateExplanationFlow',
    inputSchema: GenerateExplanationInputSchema,
    outputSchema: z.string(), // Stream string directly or return final
  },
  async (input, {sendChunk}) => {
    const {response, stream} = await prompt.stream(input);
    if (sendChunk) {
        for await (const chunk of stream) {
          sendChunk(chunk.text);
        }
    }
    return (await response).text;
  }
);
