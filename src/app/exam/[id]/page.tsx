
"use client";

import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useParams, useRouter } from "next/navigation";
import { APP_NAME, ADMIN_EMAIL } from "@/lib/constants";
import type { QuestionType, TestSeriesType, UserAnswer, ExamPhase, PurchaseType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { AlertTriangle, ArrowLeft, ArrowRight, Bookmark, Check, CircleDot, Clock, HelpCircle, ListChecks, Loader2, Menu, RefreshCcw, Send, XCircle, ShieldX } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ExplanationModal } from "./components/ExplanationModal";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useFirestore, useUser } from "@/firebase";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
// Removed: import { getQuestionsFromTex } from "@/lib/tex-parser";

import { MathText } from "@/components/shared/MathText";


type QuestionPaletteProps = {
  questions: QuestionType[];
  userAnswers: UserAnswer[];
  currentQuestionIndex: number;
  examPhase: ExamPhase;
  answeredCount: number;
  notAnsweredCount: number;
  markedForReviewCount: number;
  answeredAndMarkedCount: number;
  notVisitedCount: number;
  navigateQuestion: (index: number) => void;
  setExamPhase: (phase: ExamPhase) => void;
};

const QuestionPalette = memo(function QuestionPalette({
  questions,
  userAnswers,
  currentQuestionIndex,
  examPhase,
  answeredCount,
  notAnsweredCount,
  markedForReviewCount,
  answeredAndMarkedCount,
  notVisitedCount,
  navigateQuestion,
  setExamPhase
}: QuestionPaletteProps) {
  return (
    <Card className="lg:w-[320px] flex-shrink-0 flex flex-col shadow-lg h-full max-h-[calc(100vh-10rem)]">
      <CardHeader className="border-b p-4">
        <CardTitle className="text-primary text-lg">Question Palette</CardTitle>
         <div className="text-xs mt-2 space-y-1 text-muted-foreground">
            <p><span className="inline-block w-3 h-3 bg-green-500 rounded-sm mr-1.5 align-middle"></span>Answered ({answeredCount})</p>
            <p><span className="inline-block w-3 h-3 bg-red-500 rounded-sm mr-1.5 align-middle"></span>Not Answered ({notAnsweredCount})</p>
            <p><span className="inline-block w-3 h-3 bg-purple-500 rounded-sm mr-1.5 align-middle"></span>Marked for Review ({markedForReviewCount})</p>
            <p className="flex items-center">
                <span className="inline-flex justify-center items-center w-3 h-3 bg-purple-500 border border-green-400 dark:border-green-600 rounded-sm mr-1.5 align-middle">
                    <Check className="h-2 w-2 text-green-300 dark:text-green-400 font-bold"/>
                </span>Answered & Marked ({answeredAndMarkedCount})
            </p>
            <p><span className="inline-block w-3 h-3 border border-border bg-background rounded-sm mr-1.5 align-middle"></span>Not Visited ({notVisitedCount})</p>
            <p className="mt-1 pt-1 border-t border-dashed"><span className="inline-block w-3 h-3 ring-2 ring-primary ring-offset-1 bg-blue-200 dark:bg-blue-800 rounded-sm mr-1.5 align-middle"></span>Current Question</p>
        </div>
      </CardHeader>
      <ScrollArea className="flex-grow">
        <CardContent className="p-3 grid grid-cols-5 gap-1.5">
          {questions.map((q, index) => {
            const answer = userAnswers.find(ans => ans.questionId === q.id);
            let statusClass = "bg-background hover:bg-secondary text-foreground border-input";
            let icon = null;

            if (examPhase === 'review' || examPhase === 'summary') { 
                if(answer?.selectedOptionId === q.correctAnswerId) {
                    statusClass = "bg-green-100 dark:bg-green-900 border-green-500 text-green-700 dark:text-green-300";
                    icon = <Check className="h-3 w-3"/>;
                 } else if (answer?.selectedOptionId && answer?.selectedOptionId !== q.correctAnswerId) {
                    statusClass = "bg-red-100 dark:bg-red-900 border-red-500 text-red-700 dark:text-red-300";
                    icon = <XCircle className="h-3 w-3"/>;
                 } else { 
                    statusClass = "bg-gray-100 dark:bg-gray-700 border-gray-400 text-gray-600 dark:text-gray-300";
                 }
            } else { 
                if (answer?.isAnswered && answer?.isMarkedForReview) {
                    statusClass = "bg-purple-500 hover:bg-purple-600 text-primary-foreground border-purple-600 relative";
                    icon = <Check className="absolute top-0.5 right-0.5 h-3 w-3 text-green-300"/>;
                } else if (answer?.isMarkedForReview) {
                    statusClass = "bg-purple-500 hover:bg-purple-600 text-primary-foreground border-purple-600";
                } else if (answer?.isAnswered) {
                    statusClass = "bg-green-500 hover:bg-green-600 text-primary-foreground border-green-600";
                } else if (answer?.visited) { 
                    statusClass = "bg-red-500 hover:bg-red-600 text-primary-foreground border-red-600";
                }
                if (currentQuestionIndex === index) {
                    statusClass = cn(statusClass, "ring-2 ring-primary ring-offset-2 dark:ring-offset-background");
                }
            }
            
            return (
              <Button
                key={q.id}
                variant="outline"
                size="icon"
                className={cn("h-9 w-9 font-semibold text-xs relative", statusClass)}
                onClick={() => navigateQuestion(index)}
                disabled={examPhase === 'summary'}
              >
                {index + 1}
                {icon}
              </Button>
            );
          })}
        </CardContent>
      </ScrollArea>
      {examPhase === 'review' && (
          <CardContent className="border-t p-3">
              <Button onClick={() => setExamPhase('summary')} className="w-full">
                  Back to Summary
              </Button>
          </CardContent>
      )}
    </Card>
  );
});

async function getQuestionsFromTex() {
  const res = await fetch("/api/questions?filePath=physics/1.tex");
  if (!res.ok) throw new Error("Failed to fetch questions from TeX file.");
  const data = await res.json();
  return data.questions || [];
}

export default function ExamPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const testId = params.id as string;
  const firestore = useFirestore();
  const { user, loading: userLoading } = useUser();

  const [testSeries, setTestSeries] = useState<TestSeriesType | null>(null);
  const [questions, setQuestions] = useState<QuestionType[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [examPhase, setExamPhase] = useState<ExamPhase>('loading');
  const [score, setScore] = useState(0);

  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [explanationContext, setExplanationContext] = useState<{ question: QuestionType; studentAnswer: string } | null>(null);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  const initializeLocalExamState = useCallback((seriesData: TestSeriesType, questionsData: QuestionType[]) => {
    setTestSeries(seriesData);
    setQuestions(questionsData);
    setTimeLeft((seriesData.durationPerTest || 30) * 60);
    setUserAnswers(questionsData.map(q => ({
      questionId: q.id,
      selectedOptionId: null,
      isMarkedForReview: false,
      isAnswered: false,
      visited: false,
    })));
    setCurrentQuestionIndex(0);
    setScore(0);
    setExamPhase('instructions');
  }, []);
  
  const handleSubmitTest = useCallback(() => {
    let calculatedScore = 0;
    userAnswers.forEach(ua => {
      const question = questions.find(q => q.id === ua.questionId);
      if (question) {
        if (question.correctAnswerId === ua.selectedOptionId) {
          calculatedScore += 4;
        } else if (ua.selectedOptionId) {
          calculatedScore -= 1;
        }
      }
    });
    setScore(calculatedScore);
    setExamPhase('summary');
  }, [userAnswers, questions]);

  useEffect(() => {
    if (!userLoading && !user) {
        router.push('/signup');
        return;
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    const fetchTestDetails = async () => {
      if (userLoading || !user || !firestore) return;
      setExamPhase('loading');

      try {
        const isLatexBank = testId === 'latex-question-bank';
        const isDemo = testId === 'demo-paid-test';
        const isAdminUser = user.email === ADMIN_EMAIL;
        
        let fetchedSeries: TestSeriesType;
        let fetchedQuestions: QuestionType[] = [];

        if (isLatexBank) {
            fetchedQuestions = await getQuestionsFromTex();
            fetchedSeries = {
                id: 'latex-question-bank',
                name: 'General Question Bank (Free)',
                description: 'A collection of questions rendered from a LaTeX file.',
                price: 0,
                imageUrl: 'https://picsum.photos/seed/latex-questions/600/400',
                subject: 'General',
                durationPerTest: 60,
                createdAt: new Date().toISOString(),
            };
        } else if (isDemo) {
            fetchedSeries = {
                id: 'demo-paid-test',
                name: 'Premium Mock Test (Demo)',
                description: 'A sample paid test to verify the payment and paywall system.',
                price: 1,
                imageUrl: 'https://picsum.photos/seed/demo-pay/600/400',
                subject: 'IAT',
                durationPerTest: 180,
                createdAt: new Date().toISOString(),
            };
            fetchedQuestions = [
                {
                    id: 'demo-q1',
                    text: 'What is the correct way to test the VidyaHeist paywall?',
                    options: [
                        { id: 'a', text: 'Scan QR, Pay, submit UTR' },
                        { id: 'b', text: 'Call Admin' },
                        { id: 'c', text: 'Wait forever' }
                    ],
                    correctAnswerId: 'a',
                    topic: 'System Demo'
                }
            ];
        } else {
            const seriesDocRef = doc(firestore, "testSeries", testId);
            const seriesSnap = await getDoc(seriesDocRef);
            if (!seriesSnap.exists()) throw new Error("Test series not found.");
            fetchedSeries = { id: seriesSnap.id, ...seriesSnap.data() } as TestSeriesType;
            const questionsQuery = collection(firestore, "testSeries", testId, "questions");
            const questionsSnap = await getDocs(questionsQuery);
            fetchedQuestions = questionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuestionType));
        }

        // Check ownership if not free and not admin
        if (!isAdminUser && fetchedSeries.price > 0) {
            const q = query(
                collection(firestore, "purchases"),
                where("userId", "==", user.uid),
                where("seriesId", "==", testId),
                where("status", "==", "verified")
            );
            const purchaseSnap = await getDocs(q);
            if (purchaseSnap.empty) {
                toast({ title: "Course Locked", description: "Please complete your purchase to access this test.", variant: "destructive" });
                router.push(`/checkout/${testId}`);
                return;
            }
        }
        
        if (fetchedQuestions.length === 0) {
          toast({ title: "No Questions", description: "This test series currently has no questions.", variant: "destructive" });
          setExamPhase('error');
          return;
        }
        
        initializeLocalExamState(fetchedSeries, fetchedQuestions);

      } catch (error: any) {
        console.error("Error fetching test details:", error);
        toast({ title: "Error", description: error.message || "Failed to load test details.", variant: "destructive" });
        setExamPhase('error');
      }
    };

    fetchTestDetails();
  }, [testId, firestore, toast, initializeLocalExamState, user, userLoading, router]);


  useEffect(() => {
    if (examPhase !== 'taking' || timeLeft <= 0) {
      if (examPhase === 'taking' && timeLeft <= 0) {
        handleSubmitTest();
        toast({ title: "Time's Up!", description: "Your test has been automatically submitted.", variant: "info"});
      }
      return;
    };
    const timerId = setInterval(() => {
      setTimeLeft(prevTime => prevTime > 0 ? prevTime - 1 : 0);
    }, 1000);
    return () => clearInterval(timerId);
  }, [examPhase, timeLeft, handleSubmitTest, toast]);


  useEffect(() => {
    if (examPhase === 'taking' && questions.length > 0 && userAnswers.length > 0) {
      const currentQuestionId = questions[currentQuestionIndex].id;
      if (!userAnswers.find(ua => ua.questionId === currentQuestionId)?.visited) {
         setUserAnswers(prev => prev.map(ua => ua.questionId === currentQuestionId ? {...ua, visited: true} : ua));
      }
    }
  }, [currentQuestionIndex, examPhase, questions, userAnswers]);


  const handleStartTest = useCallback(() => {
    if (!testSeries || questions.length === 0) return;
    if (examPhase === 'summary' || examPhase === 'review' || examPhase === 'error') {
        initializeLocalExamState(testSeries, questions);
    }
    setExamPhase('taking');
    setUserAnswers(prev => prev.map((ua,idx) => idx === 0 ? {...ua, visited: true} : ua));
  }, [testSeries, questions, examPhase, initializeLocalExamState]);

  const handleAnswerChange = useCallback((questionId: string, selectedOptionId: string) => {
    setUserAnswers(prevAnswers =>
      prevAnswers.map(ans =>
        ans.questionId === questionId
          ? { ...ans, selectedOptionId, isAnswered: true }
          : ans
      )
    );
  }, []);

  const handleClearResponse = useCallback((questionId: string) => {
    setUserAnswers(prevAnswers =>
      prevAnswers.map(ans =>
        ans.questionId === questionId
          ? { ...ans, selectedOptionId: null, isAnswered: false }
          : ans
      )
    );
  }, []);

  const handleMarkForReview = useCallback((questionId: string) => {
    setUserAnswers(prevAnswers =>
      prevAnswers.map(ans =>
        ans.questionId === questionId
          ? { ...ans, isMarkedForReview: !ans.isMarkedForReview }
          : ans
      )
    );
  }, []);

  const navigateQuestion = useCallback((index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
      if (isPaletteOpen) setIsPaletteOpen(false);
    }
  }, [questions.length, isPaletteOpen]);


  const handleViewExplanation = useCallback((question: QuestionType) => {
    const userAnswer = userAnswers.find(ua => ua.questionId === question.id);
    const studentSelectedOption = question.options.find(opt => opt.id === userAnswer?.selectedOptionId);
    setExplanationContext({ question, studentAnswer: studentSelectedOption?.text || "Not Answered" });
    setShowExplanationModal(true);
  }, [userAnswers]);

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = userAnswers.find(ans => ans.questionId === currentQuestion?.id);
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const answeredCount = useMemo(() => userAnswers.filter(a => a.isAnswered).length, [userAnswers]);
  const notAnsweredCount = useMemo(() => userAnswers.filter(a => a.visited && !a.isAnswered).length, [userAnswers]);
  const markedForReviewCount = useMemo(() => userAnswers.filter(a => a.isMarkedForReview && !a.isAnswered).length, [userAnswers]);
  const answeredAndMarkedCount = useMemo(() => userAnswers.filter(a => a.isMarkedForReview && a.isAnswered).length, [userAnswers]);
  const notVisitedCount = useMemo(() => questions.length - userAnswers.filter(a => a.visited).length, [userAnswers, questions]);


  if (examPhase === 'loading') {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading test details...</p>
      </div>
    );
  }

  if (examPhase === 'error' || !testSeries) {
    return (
      <Card className="max-w-2xl mx-auto my-8 shadow-xl">
        <CardHeader className="text-center">
            <ShieldX className="mx-auto h-16 w-16 text-destructive mb-4" />
            <CardTitle className="text-3xl text-destructive">Test Load Error</CardTitle>
            <CardDescription className="text-lg">
                {testSeries && questions.length === 0 ? `The test series "${testSeries.name}" has no questions.` : "We couldn't load the test details."}
            </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
            <Button onClick={() => router.push('/store')} variant="outline" size="lg">Back to Test Series</Button>
        </CardContent>
      </Card>
    );
  }
  

  if (examPhase === 'instructions' || examPhase === 'summary') {
    return (
      <Card className="max-w-2xl mx-auto my-8 shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl text-primary">{testSeries.name}</CardTitle>
          {examPhase === 'instructions' && <CardDescription className="text-lg">{testSeries.description || "Welcome to the test!"}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-6">
          {examPhase === 'instructions' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left p-4 border rounded-lg bg-muted/30">
                <p><strong>Subject:</strong> {testSeries.subject || 'General'}</p>
                <p><strong>Questions:</strong> {questions.length}</p>
                <p><strong>Duration:</strong> {testSeries.durationPerTest || (timeLeft / 60)} minutes</p>
              </div>
              <h3 className="font-semibold text-xl mt-6">Instructions:</h3>
              <ul className="list-disc list-inside text-left text-muted-foreground space-y-1">
                <li><strong>Scoring:</strong> +4 for correct, -1 for incorrect.</li>
                <li>Each question has multiple options. Only one option is correct.</li>
                <li>Ensure you submit the test before the time runs out.</li>
                <li>You can navigate between questions using the palette.</li>
              </ul>
              <Button onClick={handleStartTest} size="lg" className="mt-8 w-full">Start Test</Button>
            </>
          )}
          {examPhase === 'summary' && (
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-semibold">Test Completed!</h2>
              <p className="text-lg">Your Score: <span className="font-bold text-primary">{score}</span> out of {questions.length * 4}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
                <Button onClick={() => setExamPhase('review')} size="lg">Review Answers</Button>
                <Button onClick={handleStartTest} variant="outline" size="lg">
                  <RefreshCcw className="mr-2 h-4 w-4" /> Start Again
                </Button>
                <Button onClick={() => router.push('/store')} variant="secondary" size="lg">Back to Store</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-6 min-h-[calc(100vh-8rem)] pt-2">
      <div className="md:hidden sticky top-16 bg-background py-2 z-40 border-b mb-2">
        <div className="container mx-auto flex justify-between items-center">
             <CardTitle className="text-primary text-lg">{testSeries.subject || APP_NAME}</CardTitle>
            <div className="flex items-center gap-2 text-destructive font-semibold">
                <Clock className="h-5 w-5" />
                <span>{formatTime(timeLeft)}</span>
            </div>
            <Sheet open={isPaletteOpen} onOpenChange={setIsPaletteOpen}>
                <SheetTrigger asChild>
                    <Button variant="outline" size="sm">
                        <ListChecks className="mr-2 h-4 w-4" /> Palette ({currentQuestionIndex + 1}/{questions.length})
                    </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] p-0">
                    <QuestionPalette
                        questions={questions}
                        userAnswers={userAnswers}
                        currentQuestionIndex={currentQuestionIndex}
                        examPhase={examPhase}
                        answeredCount={answeredCount}
                        notAnsweredCount={notAnsweredCount}
                        markedForReviewCount={markedForReviewCount}
                        answeredAndMarkedCount={answeredAndMarkedCount}
                        notVisitedCount={notVisitedCount}
                        navigateQuestion={navigateQuestion}
                        setExamPhase={setExamPhase}
                    />
                </SheetContent>
            </Sheet>
        </div>
      </div>

      <Card className="flex-grow flex flex-col shadow-lg w-full md:w-2/3">
        <CardHeader className="border-b p-4 hidden md:block">
          <div className="flex justify-between items-center">
            <CardTitle className="text-primary">Question {currentQuestionIndex + 1} of {questions.length}</CardTitle>
            <div className="flex items-center gap-2 text-destructive font-semibold p-2 border border-destructive rounded-md">
              <Clock className="h-5 w-5" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          </div>
          <Progress value={progress} className="w-full mt-2 h-2" />
        </CardHeader>
        <ScrollArea className="flex-grow">
          <CardContent className="py-6 px-4 md:px-6 text-base md:text-lg">
            <p className="font-semibold mb-6">
                <MathText text={currentQuestion.text} />
            </p>
            <RadioGroup
              value={currentAnswer?.selectedOptionId || ""}
              onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
              disabled={examPhase === 'review' || examPhase === 'summary'}
              className="space-y-3"
            >
              {currentQuestion.options.map((option) => (
                <div key={option.id} 
                  className={cn("flex items-center space-x-3 p-3 border rounded-md transition-all hover:bg-secondary/50 cursor-pointer",
                    examPhase === 'review' && option.id === currentQuestion.correctAnswerId && "bg-green-100 dark:bg-green-800 border-green-500",
                    examPhase === 'review' && option.id === currentAnswer?.selectedOptionId && option.id !== currentQuestion.correctAnswerId && "bg-red-100 dark:bg-red-800 border-red-500",
                    currentAnswer?.selectedOptionId === option.id && "border-primary ring-1 ring-primary"
                  )}
                  onClick={() => (examPhase !== 'review' && examPhase !== 'summary') && handleAnswerChange(currentQuestion.id, option.id)}
                >
                  <RadioGroupItem value={option.id} id={option.id} />
                  <Label htmlFor={option.id} className="flex-1 cursor-pointer text-sm md:text-base">
                    <MathText text={option.text} />
                  </Label>
                  {examPhase === 'review' && option.id === currentQuestion.correctAnswerId && <Check className="h-5 w-5 text-green-600" />}
                  {examPhase === 'review' && option.id === currentAnswer?.selectedOptionId && option.id !== currentQuestion.correctAnswerId && <XCircle className="h-5 w-5 text-red-600" />}
                </div>
              ))}
            </RadioGroup>
            {(examPhase === 'review') && (
              <Button onClick={() => handleViewExplanation(currentQuestion)} variant="outline" size="sm" className="mt-6">
                <HelpCircle className="mr-2 h-4 w-4" /> View Explanation
              </Button>
            )}
          </CardContent>
        </ScrollArea>
        <CardContent className="border-t p-3 md:p-4">
          <div className="flex flex-wrap gap-2 justify-between items-center">
            <Button
              variant="outline"
              onClick={() => navigateQuestion(currentQuestionIndex - 1)}
              disabled={currentQuestionIndex === 0 || examPhase === 'review' || examPhase === 'summary'}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            
            <div className="flex gap-2">
              <Button
                variant={currentAnswer?.isMarkedForReview ? "secondary" : "outline"}
                onClick={() => handleMarkForReview(currentQuestion.id)}
                disabled={examPhase === 'review' || examPhase === 'summary'}
                className={currentAnswer?.isMarkedForReview ? "bg-purple-500 hover:bg-purple-600 text-white" : ""}
              >
                <Bookmark className="mr-2 h-4 w-4" /> Mark for Review
              </Button>
            </div>

            {currentQuestionIndex === questions.length - 1 ? (
              <Button onClick={handleSubmitTest} disabled={examPhase === 'review' || examPhase === 'summary'} className="bg-green-600 hover:bg-green-700 text-white">
                <Send className="mr-2 h-4 w-4" /> Submit Test
              </Button>
            ) : (
              <Button
                onClick={() => navigateQuestion(currentQuestionIndex + 1)}
                disabled={currentQuestionIndex === questions.length - 1 || examPhase === 'review' || examPhase === 'summary'}
              >
                Save & Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="hidden md:block md:w-[320px] flex-shrink-0">
        <QuestionPalette
            questions={questions}
            userAnswers={userAnswers}
            currentQuestionIndex={currentQuestionIndex}
            examPhase={examPhase}
            answeredCount={answeredCount}
            notAnsweredCount={notAnsweredCount}
            markedForReviewCount={markedForReviewCount}
            answeredAndMarkedCount={answeredAndMarkedCount}
            notVisitedCount={notVisitedCount}
            navigateQuestion={navigateQuestion}
            setExamPhase={setExamPhase}
        />
      </div>

      {explanationContext && (
        <ExplanationModal
          isOpen={showExplanationModal}
          onClose={() => setShowExplanationModal(false)}
          question={explanationContext.question}
          studentAnswer={explanationContext.studentAnswer}
        />
      )}
    </div>
  );
}
