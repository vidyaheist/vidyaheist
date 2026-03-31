
"use client";

import { useState, useEffect } from "react";
import type { QuestionType } from "@/lib/types";
import { generateExplanation, type GenerateExplanationInput, type GenerateExplanationOutput } from "@/ai/flows/generate-explanation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import { MathText } from "@/components/shared/MathText";

type ExplanationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  question: QuestionType;
  studentAnswer: string;
};

export function ExplanationModal({ isOpen, onClose, question, studentAnswer }: ExplanationModalProps) {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && !explanation && !isLoading && question) { // Added check for question
      fetchExplanation();
    }
    if (!isOpen) {
      setExplanation(null);
      setError(null);
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, question]); // Removed explanation and isLoading from deps to avoid re-fetch loops

  const fetchExplanation = async () => {
    if (!question) {
        setError("Question data is missing.");
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const correctAnswerText = question.options.find(opt => opt.id === question.correctAnswerId)?.text || "N/A";
      const input: GenerateExplanationInput = {
        question: question.text,
        studentAnswer: studentAnswer,
        correctAnswer: correctAnswerText,
        topic: question.topic || "General",
      };
      const result: GenerateExplanationOutput = await generateExplanation(input);
      setExplanation(result.explanation);
    } catch (err) {
      console.error("Failed to generate explanation:", err);
      setError("Sorry, we couldn't generate an explanation at this time. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const correctAnswer = question?.options.find(opt => opt.id === question?.correctAnswerId)?.text;

  if (!question) return null; // Don't render if question is not available

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle className="text-2xl text-primary">Answer Explanation</DialogTitle>
          <DialogDescription>
            Understanding why an answer is correct or incorrect is key to learning.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4 my-4">
                <div>
                    <h4 className="font-semibold text-lg mb-1">Question:</h4>
                    <div className="text-muted-foreground"><MathText text={question.text} /></div>
                </div>
                <div>
                    <h4 className="font-semibold text-lg mb-1">Your Answer:</h4>
                    <div className={studentAnswer === correctAnswer ? "text-green-600" : "text-red-600"}>
                        <MathText text={studentAnswer || "Not Answered"} />
                    </div>
                </div>
                <div>
                    <h4 className="font-semibold text-lg mb-1">Correct Answer:</h4>
                    <div className="text-green-600"><MathText text={correctAnswer || ""} /></div>
                </div>
                <hr/>
                {isLoading && (
                    <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-3 text-muted-foreground">Generating explanation...</p>
                    </div>
                )}
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                {explanation && !isLoading && (
                    <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                        <h4 className="font-semibold text-lg mb-2 text-primary">Detailed Explanation:</h4>
                        <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed">
                            <MathText text={explanation} />
                        </div>
                    </div>
                )}
            </div>
        </ScrollArea>
        <DialogFooter>
          <Button onClick={onClose} variant="outline">Close</Button>
          {!isLoading && !explanation && error && ( // Show retry only if there was an error and no explanation yet
            <Button onClick={fetchExplanation}>
              Retry Explanation
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
