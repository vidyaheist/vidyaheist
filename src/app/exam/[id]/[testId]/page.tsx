
"use client";

import { useState, useEffect, useCallback, useMemo, memo, useRef, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { APP_NAME, ADMIN_EMAIL } from "@/lib/constants";
import type { QuestionType, TestSeriesType, TestType, UserAnswer, ExamPhase } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Bookmark, Check, ListChecks, Loader2, RefreshCcw, Send, XCircle, Clock, HelpCircle, ShieldX } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Leaderboard } from "../components/Leaderboard";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useFirestore, useUser } from "@/firebase";
import { doc, getDoc, collection, getDocs, query, where, addDoc, serverTimestamp, limit, orderBy } from "firebase/firestore";
import { MathText } from "@/components/shared/MathText";
import { Trophy, Target, Zap, RotateCcw, LayoutDashboard, ChevronRight, MessageSquareCode, Save } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { streamFlow } from "@genkit-ai/next/client";

const QuestionPalette = memo(function QuestionPalette({
  questions,
  userAnswers,
  currentQuestionIndex,
  examPhase,
  navigateQuestion,
}: any) {
  const isReview = examPhase === 'review';

  // Calculate status counts
  const answeredCount = userAnswers.filter((a: any) => a.isAnswered && !a.isMarkedForReview).length;
  const notAnsweredCount = userAnswers.filter((a: any) => a.visited && !a.isAnswered).length;
  const markedForReviewCount = userAnswers.filter((a: any) => a.isMarkedForReview && !a.isAnswered).length;
  const answeredAndMarkedCount = userAnswers.filter((a: any) => a.isAnswered && a.isMarkedForReview).length;
  const notVisitedCount = questions.length - userAnswers.filter((a: any) => a.visited).length;

  return (
    <Card className="lg:w-[320px] flex-shrink-0 flex flex-col shadow-lg h-full max-h-[calc(100vh-10rem)] bg-muted/5 border-2 border-primary/10">
      <CardHeader className="border-b p-4">
        <CardTitle className="text-primary text-xl font-black flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-secondary" /> Palette
        </CardTitle>
         <div className="grid grid-cols-2 gap-2 text-[10px] mt-4 font-bold">
             <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-sm"></span>
                <span>{isReview ? "Correct" : "Answered"} ({answeredCount})</span>
             </div>
             <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-red-500 rounded-sm"></span>
                <span>{isReview ? "Incorrect" : "Not Answered"} ({notAnsweredCount})</span>
             </div>
             <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-purple-500 rounded-sm"></span>
                <span>Review ({markedForReviewCount})</span>
             </div>
             <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-gradient-to-br from-purple-500 to-green-500 rounded-sm"></span>
                <span>Ans+Rev ({answeredAndMarkedCount})</span>
             </div>
             <div className="flex items-center gap-2 col-span-2">
                <span className="w-3 h-3 border border-border bg-background rounded-sm"></span>
                <span>Not Visited ({notVisitedCount})</span>
             </div>
        </div>
      </CardHeader>
      <ScrollArea className="flex-grow">
        <CardContent className="p-4 grid grid-cols-5 gap-2">
          {questions.map((q: any, index: number) => {
            const answer = userAnswers.find((ans: any) => ans.questionId === q.id);
            const isActive = currentQuestionIndex === index;
            let statusClass = "bg-background text-muted-foreground border-border";
            
             if (answer?.isMarkedForReview && answer?.isAnswered) {
                 statusClass = "bg-gradient-to-br from-purple-500 to-green-500 text-white border-purple-600";
             } else if (answer?.isMarkedForReview) {
                 statusClass = "bg-purple-500 text-white border-purple-600";
             } else if (answer?.isAnswered) {
                 statusClass = "bg-green-500 text-white border-green-600";
             } else if (answer?.visited) {
                 statusClass = "bg-red-500 text-white border-red-600";
             }

            return (
              <Button
                key={q.id}
                variant="outline"
                className={cn(
                  "h-10 w-full p-0 font-bold transition-all hover:scale-105 border-2",
                  statusClass,
                  isActive && "ring-4 ring-primary ring-offset-2 scale-110 !border-primary z-10"
                )}
                onClick={() => navigateQuestion(index)}
              >
                {index + 1}
              </Button>
            );
          })}
        </CardContent>
      </ScrollArea>
    </Card>
  );
});

function ExamContent() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string; // Test Series ID
  const testId = params.testId as string;
  const firestore = useFirestore();
  const { user, loading: userLoading } = useUser();

  const [test, setTest] = useState<TestType | null>(null);
  const [questions, setQuestions] = useState<QuestionType[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [examPhase, setExamPhase] = useState<ExamPhase>('loading');
  const [score, setScore] = useState(0);
  const searchParams = useSearchParams();
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [explanationContext, setExplanationContext] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const hasInitialized = useRef(false);
  const timeLeftRef = useRef(0);

  // Sync ref with state for use in intervals
  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  useEffect(() => {
    const fetchTestDetails = async () => {
      if (!firestore || !user || hasInitialized.current) return;
      hasInitialized.current = true;
      setExamPhase('loading');
      try {
        // Verify Access
        const seriesSnap = await getDoc(doc(firestore, "testSeries", id));
        if (!seriesSnap.exists()) throw new Error("Course not found");
        const seriesData = seriesSnap.data() as TestSeriesType;

        if (user.email !== ADMIN_EMAIL && seriesData.price > 0) {
            const q = query(collection(firestore, "purchases"), 
                where("userId", "==", user.uid), 
                where("seriesId", "==", id), 
                where("status", "==", "verified")
            );
            const pSnap = await getDocs(q);
            if (pSnap.empty) {
                router.push(`/checkout/${id}`);
                return;
            }
        }

        const testDoc = await getDoc(doc(firestore, "testSeries", id, "tests", testId));
        if (!testDoc.exists()) throw new Error("Test not found");
        const testData = { id: testDoc.id, ...testDoc.data() } as TestType;
        
        const qSnap = await getDocs(collection(firestore, "testSeries", id, "tests", testId, "questions"));
        const qData = qSnap.docs.map(d => ({ ...d.data() as QuestionType, id: d.id })).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        setTest(testData);
        setQuestions(qData);

        // Check for existing progress
        const progressSnap = await getDoc(doc(firestore, "examProgress", `${user.uid}_${testId}`));
        
        if (progressSnap.exists() && searchParams.get('mode') !== 'review') {
            const prog = progressSnap.data();
            setUserAnswers(prog.answers);
            setTimeLeft(prog.timeLeft);
            setExamPhase('taking');
        } else if (searchParams.get('mode') === 'review') {
            const resultId = searchParams.get('resultId');
            if (resultId) {
                const resultSnap = await getDoc(doc(firestore, "results", resultId));
                if (resultSnap.exists()) {
                    const resultData = resultSnap.data();
                    // Merge saved results into initial structure to ensure visited/answered flags are correct
                    setUserAnswers(qData.map(q => {
                        const savedAns = resultData.answers.find((sa: any) => sa.questionId === q.id);
                        return {
                            questionId: q.id,
                            selectedOptionId: savedAns?.selectedOptionId || null,
                            isMarkedForReview: false,
                            isAnswered: !!savedAns?.selectedOptionId,
                            visited: true,
                            explanation: savedAns?.explanation || undefined // Restore saved AI response
                        };
                    }));
                }
            } else {
                setUserAnswers(qData.map(q => ({
                    questionId: q.id,
                    selectedOptionId: null,
                    isMarkedForReview: false,
                    isAnswered: false,
                    visited: false,
                })));
            }
            setExamPhase('review');
        } else {
            setTimeLeft(testData.duration * 60);
            setUserAnswers(qData.map(q => ({
              questionId: q.id,
              selectedOptionId: null,
              isMarkedForReview: false,
              isAnswered: false,
              visited: false,
            })));
            setExamPhase('instructions');
        }
      } catch (e: any) {
        console.error(e);
        setExamPhase('error');
      }
    };
    if (!userLoading) fetchTestDetails();
  }, [id, testId, firestore, user, userLoading, router, searchParams]);

  useEffect(() => {
    if (examPhase === 'taking' && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => clearInterval(timer);
    } else if (examPhase === 'taking' && timeLeft === 0) {
      handleFinish();
    }
  }, [examPhase, timeLeft]);

  // Periodic Progress Saving - Decoupled from timeLeft state to avoid interval reset
  useEffect(() => {
    if (examPhase !== 'taking' || !user || !firestore) return;

    const saveProgress = async () => {
        setIsSaving(true);
        const progressData = {
            userId: user.uid,
            testId,
            testName: test?.name || "Untitled Test",
            answers: userAnswers,
            timeLeft: timeLeftRef.current, // Use ref to get latest without re-triggering effect
            updatedAt: serverTimestamp()
        };

        try {
            await setDoc(doc(firestore, "examProgress", `${user.uid}_${testId}`), progressData);
        } catch (e: any) {
            console.error("Progress save error:", e.code, e.message);
        } finally {
            setIsSaving(false);
        }
    };

    const interval = setInterval(saveProgress, 30000); // Every 30s
    return () => clearInterval(interval);
  }, [examPhase, user, firestore, testId, test, userAnswers]); // No longer depends on timeLeft


  const handleFinish = useCallback(async () => {
    if (!user || !firestore || !test) return;

    let finalScore = 0;
    let correctCount = 0;
    let incorrectCount = 0;

    const finalAnswers = userAnswers.map(ans => {
        const q = questions.find(q => q.id === ans.questionId);
        if (q) {
            if (q.correctAnswerId === ans.selectedOptionId) {
                finalScore += 4;
                correctCount++;
            } else if (ans.selectedOptionId) {
                finalScore -= 1;
                incorrectCount++;
            }
        }
        return {
            questionId: ans.questionId,
            selectedOptionId: ans.selectedOptionId
        };
    });

    const timeTaken = Math.max(0, ((test.duration || 0) * 60) - (timeLeft || 0));

    const resultData = {
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || "Anonymous",
        userEmail: user.email,
        testId: testId,
        testName: test.name,
        seriesId: id,
        score: finalScore,
        correctCount,
        incorrectCount,
        totalQuestions: questions.length,
        timeTaken: timeTaken,
        answers: finalAnswers,
        createdAt: serverTimestamp(),
    };

    try {
        console.log("Attempting to save result:", resultData);
        const docRef = await addDoc(collection(firestore, "results"), resultData);
        
        // Clean up progress
        try {
            await deleteDoc(doc(firestore, "examProgress", `${user.uid}_${testId}`));
        } catch (delError) {
            console.warn("Failed to delete progress doc (non-critical):", delError);
        }
        
        toast({ title: "Results Saved", description: "Simulation complete! Redirecting to analysis..." });
        router.push(`/exam/result/${docRef.id}`);
    } catch (e: any) {
        console.error("CRITICAL: Failed to save results to Firestore", e.code, e.message);
        toast({ 
            title: "Persistence Error", 
            description: "Could not save results to cloud. This usually means Firestore rules need updating.", 
            variant: "destructive" 
        });
    }

  }, [userAnswers, questions, user, firestore, test, testId, id, timeLeft, toast]);

  const handleViewExplanation = async (question: QuestionType) => {
    if (isGenerating) return;
    
    const resultId = searchParams.get('resultId');
    const studentAnswer = userAnswers.find(ua => ua.questionId === question.id);
    const selectedOption = question.options.find(opt => opt.id === studentAnswer?.selectedOptionId);
    const correctOption = question.options.find(opt => opt.id === question.correctAnswerId);

    setIsGenerating(true);
    // Reset explanation context to empty for streaming
    setUserAnswers(prev => prev.map(ans => 
        ans.questionId === question.id ? { ...ans, explanation: "" } : ans
    ));

    try {
        const { stream, output } = streamFlow({
            url: "/api/genkit/generateExplanationFlow",
            input: {
                question: question.text,
                topic: test?.name || "General Science",
                studentAnswer: selectedOption?.text || "Not Answered",
                correctAnswer: correctOption?.text || "None"
            }
        });

        let fullText = "";
        for await (const chunk of stream) {
            fullText += chunk;
            setUserAnswers(prev => prev.map(ans => 
                ans.questionId === question.id ? { ...ans, explanation: fullText } : ans
            ));
        }

        const finalExplanation = await output;

        // 2. Persist to Firestore if resultId exists
        if (resultId && firestore) {
            const resultRef = doc(firestore, "results", resultId);
            const resultSnap = await getDoc(resultRef);
            if (resultSnap.exists()) {
                const currentData = resultSnap.data();
                const updatedAnswers = currentData.answers.map((ans: any) => 
                    ans.questionId === question.id ? { ...ans, explanation: finalExplanation } : ans
                );
                await updateDoc(resultRef, { answers: updatedAnswers });
            }
        }
    } catch (err) {
        console.error("AI Error:", err);
        toast({ title: "AI Error", description: "Failed to generate explanation. (Check model availability)", variant: "destructive" });
    } finally {
        setIsGenerating(false);
    }
  };


  const handleAnswer = (qid: string, optid: string) => {
    setUserAnswers(prev => prev.map(ans => ans.questionId === qid ? { ...ans, selectedOptionId: optid, isAnswered: true } : ans));
  };

  const handleMarkReview = (qid: string) => {
    setUserAnswers(prev => prev.map(ans => ans.questionId === qid ? { ...ans, isMarkedForReview: !ans.isMarkedForReview } : ans));
  };

  const navigateQuestion = (index: number) => {
    if (index < 0 || index >= questions.length) return;
    setUserAnswers(prev => prev.map((a, i) => i === currentQuestionIndex ? { ...a, visited: true } : a));
    setCurrentQuestionIndex(index);
  };

  if (examPhase === 'loading') return <div className="flex justify-center py-20"><Loader2 className="animate-spin h-12 w-12" /></div>;

  if (examPhase === 'instructions') {
    return (
      <div className="max-w-4xl mx-auto my-8 px-4">
        <Card className="shadow-2xl border-t-8 border-t-primary">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-4xl font-black text-primary uppercase tracking-tight">{test?.name}</CardTitle>
            <CardDescription className="text-lg">Please read the following instructions carefully before starting the simulation.</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-8 py-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
               <div className="bg-muted/50 p-4 rounded-2xl flex items-center gap-4 border border-border">
                  <div className="bg-primary/10 p-3 rounded-xl text-primary"><Clock className="w-6 h-6" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground font-bold uppercase">Duration</p>
                    <p className="text-xl font-black">{test?.duration} Minutes</p>
                  </div>
               </div>
               <div className="bg-muted/50 p-4 rounded-2xl flex items-center gap-4 border border-border">
                  <div className="bg-primary/10 p-3 rounded-xl text-primary"><HelpCircle className="w-6 h-6" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground font-bold uppercase">Questions</p>
                    <p className="text-xl font-black">{questions.length} Total</p>
                  </div>
               </div>
               <div className="bg-muted/50 p-4 rounded-2xl flex items-center gap-4 border border-border">
                  <div className="bg-primary/10 p-3 rounded-xl text-primary"><Target className="w-6 h-6" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground font-bold uppercase">Total Marks</p>
                    <p className="text-xl font-black">{questions.length * 4} Marks</p>
                  </div>
               </div>
            </div>

            {/* General Instructions */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2 border-b pb-2"><ListChecks className="text-primary w-5 h-5" /> General Instructions</h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm text-muted-foreground list-decimal list-inside px-2">
                <li>This is a time-bound assessment. Attempt all questions within the allocated time.</li>
                <li><strong>Marking Scheme:</strong> +4 for each correct answer; -1 for each incorrect answer. No marks are deducted for unattempted questions.</li>
                <li>The computer clock will be set at the server. The countdown timer in the top-right corner of the screen will display the remaining time.</li>
                <li>Once the timer disappears, the test will automatically be submitted.</li>
                <li>Ensure a stable internet connection for the duration of the test.</li>
                <li>Clicking on the "Submit Test" button will immediately end your session.</li>
                <li>You can review and change your answers at any point before the final submission.</li>
              </ul>
            </div>

            {/* Color Palette Legend */}
            <div className="space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-2 border-b pb-2"><Zap className="text-primary w-5 h-5" /> Navigation Palette Guide</h3>
                <p className="text-sm text-muted-foreground">The question palette on the right side of the screen shows the status of each question using the following symbols:</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-2">
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-border/50">
                        <div className="w-8 h-8 rounded bg-background border border-border flex items-center justify-center text-xs font-bold shadow-sm">01</div>
                        <span className="text-sm font-medium">Not Visited</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                        <div className="w-8 h-8 rounded bg-red-500 text-white flex items-center justify-center text-xs font-bold shadow-sm">02</div>
                        <span className="text-sm font-medium text-red-700 dark:text-red-400">Not Answered</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-xl border border-green-500/20">
                        <div className="w-8 h-8 rounded bg-green-500 text-white flex items-center justify-center text-xs font-bold shadow-sm">03</div>
                        <span className="text-sm font-medium text-green-700 dark:text-green-400">Answered</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                        <div className="w-8 h-8 rounded bg-purple-500 text-white flex items-center justify-center text-xs font-bold shadow-sm">04</div>
                        <span className="text-sm font-medium text-purple-700 dark:text-purple-400">Marked for Review</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-xl border border-primary/20">
                        <div className="w-8 h-8 rounded bg-gradient-to-br from-purple-500 to-green-500 text-white flex items-center justify-center text-xs font-bold shadow-sm">05</div>
                        <span className="text-sm font-medium text-primary">Ans & Marked</span>
                    </div>
                </div>
            </div>

            {/* AI and Features */}
            <div className="bg-primary/5 p-6 rounded-2xl border border-primary/20 space-y-3">
                <div className="flex items-center gap-2 text-primary">
                    <MessageSquareCode className="w-6 h-6" />
                    <h3 className="font-black text-lg">VidyaHeist Smart Analysis</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    Once you complete the simulation, you will receive a <strong>Detailed Performance Dashboard</strong> powered by <strong>Gemini AI</strong>. 
                    It will provide step-by-step explanations for your mistakes and suggest improvement areas.
                </p>
            </div>
          </CardContent>

          <CardFooter className="bg-muted/30 p-8 flex flex-col gap-4">
              <div className="flex items-center gap-3 text-sm text-muted-foreground italic mb-2">
                <ShieldX className="w-4 h-4 text-destructive" />
                Please do not refresh the page during the test as it might reset your progress.
              </div>
              <Button className="w-full h-16 text-2xl font-black rounded-2xl shadow-xl hover:scale-[1.01] transition-transform" onClick={() => setExamPhase('taking')}>
                I AGREE & START SIMULATION <ChevronRight className="ml-2 w-6 h-6" />
              </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = userAnswers.find(a => a.questionId === currentQuestion?.id);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-grow space-y-6">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row justify-between items-center border-b py-4">
            <CardTitle>Question {currentQuestionIndex + 1} of {questions.length}</CardTitle>
            <div className="flex items-center gap-2 text-destructive font-mono font-bold text-xl border-2 border-destructive/20 p-2 rounded">
              <Clock className="w-5 h-5" /> {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="text-xl mb-6 leading-relaxed"><MathText text={currentQuestion?.text} /></div>
            {currentQuestion?.imageUrl && (
                 // eslint-disable-next-line @next/next/no-img-element
                 <img src={currentQuestion.imageUrl} alt="Diagram" className="max-h-80 object-contain rounded-lg border shadow-sm mb-10" />
            )}
            <RadioGroup 
                value={currentAnswer?.selectedOptionId || ""} 
                onValueChange={(v) => handleAnswer(currentQuestion.id, v)}
                disabled={examPhase === 'review' || examPhase === 'summary'}
                className="space-y-4"
            >
              {currentQuestion?.options.map((opt, optIdx) => {
                const isCorrect = opt.id === currentQuestion.correctAnswerId;
                const isSelected = currentAnswer?.selectedOptionId === opt.id;
                
                let borderClass = "border-transparent bg-muted/20";
                if (examPhase === 'review') {
                    if (isCorrect) borderClass = "border-green-500 bg-green-50 dark:bg-green-900/20";
                    else if (isSelected) borderClass = "border-red-500 bg-red-50 dark:bg-red-900/20";
                } else if (isSelected) {
                    borderClass = "border-primary bg-primary/5";
                }

                return (
                  <div key={opt.id} 
                      className={cn(
                          "flex items-center space-x-3 p-4 border-2 rounded-xl transition-all relative",
                          borderClass,
                          examPhase !== 'review' && "hover:bg-muted/50 cursor-pointer"
                      )}
                      onClick={() => examPhase !== 'review' && handleAnswer(currentQuestion.id, opt.id)}
                  >
                    <RadioGroupItem value={opt.id} id={opt.id} />
                    <Label htmlFor={opt.id} className="flex-grow cursor-pointer text-lg flex items-center gap-2">
                        <span className="font-bold opacity-50">({String.fromCharCode(65 + optIdx)})</span>
                        <MathText text={opt.text} />
                    </Label>
                    {examPhase === 'review' && isCorrect && <Check className="absolute right-4 text-green-600 w-6 h-6" />}
                    {examPhase === 'review' && isSelected && !isCorrect && <XCircle className="absolute right-4 text-red-600 w-6 h-6" />}
                  </div>
                );
              })}
            </RadioGroup>
            {examPhase === 'review' && (
                <div className="mt-8 pt-8 border-t space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black text-primary flex items-center gap-2">
                             <Zap className="w-5 h-5 text-secondary" /> AI Logic & Analytics
                        </h3>
                        {!currentAnswer?.explanation && (
                             <Button 
                                onClick={() => handleViewExplanation(currentQuestion)} 
                                disabled={isGenerating}
                                variant="secondary" 
                                className="rounded-full px-6 border-primary/20 border shadow-sm h-10 hover:scale-105 transition-all"
                             >
                                 {isGenerating ? (
                                     <> <Loader2 className="animate-spin mr-2 h-4 w-4" /> Thinking... </>
                                 ) : (
                                     <> <MessageSquareCode className="mr-2 w-4 h-4 text-primary" /> Review </>
                                 )}
                             </Button>
                        )}
                    </div>
                    
                    {currentAnswer?.explanation ? (
                        <Card className="bg-primary/5 border-primary/20 shadow-inner overflow-hidden rounded-2xl">
                             <CardContent className="p-6">
                                 <MathText text={currentAnswer.explanation} />
                             </CardContent>
                             <CardFooter className="bg-primary/10 py-3 flex justify-center text-[10px] items-center gap-1.5 opacity-60">
                                 <ShieldX className="w-3 h-3" /> AI generated content can occasionally be incorrect. Double check important concepts.
                             </CardFooter>
                        </Card>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 bg-muted/20 border-2 border-dashed rounded-3xl opacity-60">
                             <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                <RotateCcw className="w-6 h-6 text-primary" />
                             </div>
                             <p className="text-sm font-medium text-muted-foreground italic">No explanation saved for this question yet.</p>
                             <p className="text-xs text-muted-foreground mt-1">Click the button above to generate a step-by-step logic.</p>
                        </div>
                    )}
                </div>
            )}

          </CardContent>
          <CardFooter className="border-t p-6 flex justify-between bg-muted/10">
            <Button variant="outline" disabled={currentQuestionIndex === 0} onClick={() => navigateQuestion(currentQuestionIndex - 1)}>
                <ArrowLeft className="mr-2 w-4 h-4" /> Previous
            </Button>
            
            {examPhase === 'review' ? (
                <Button variant="secondary" onClick={() => router.push(`/exam/${id}`)}>
                    <LayoutDashboard className="mr-2 w-4 h-4" /> Back to Course
                </Button>
            ) : (
                <Button variant={currentAnswer?.isMarkedForReview ? "secondary" : "outline"} onClick={() => handleMarkReview(currentQuestion.id)}>
                    <Bookmark className="mr-2 w-4 h-4" /> Review
                </Button>
            )}

            {currentQuestionIndex === questions.length - 1 ? (
              examPhase !== 'review' && (
                <Button onClick={handleFinish} className="bg-green-600 hover:bg-green-700 text-white px-8">Submit Test</Button>
              )
            ) : (
              <Button onClick={() => navigateQuestion(currentQuestionIndex + 1)}>
                Next <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            )}

            {/* In Review Mode, always show next if not last, but hide submit if last */}
            {examPhase === 'review' && currentQuestionIndex === questions.length - 1 && (
                <div className="w-[120px]"></div> // Placeholder for symmetry
            )}
          </CardFooter>
        </Card>
      </div>
      
       <QuestionPalette 
         questions={questions} 
         userAnswers={userAnswers} 
         currentQuestionIndex={currentQuestionIndex} 
         examPhase={examPhase}
         navigateQuestion={navigateQuestion}
       />

       {isSaving && (
           <div className="fixed bottom-4 left-4 bg-background/80 backdrop-blur px-3 py-1.5 rounded-full border shadow-sm flex items-center gap-2 text-[10px] text-muted-foreground animate-pulse">
               <Save className="w-3 h-3 text-primary" /> Auto-saving progress...
           </div>
       )}



      <Leaderboard 
        isOpen={showLeaderboardModal} 
        onClose={() => setShowLeaderboardModal(false)} 
        testId={testId} 
        currentUserId={user?.uid} 
      />


    </div>
  );
}

export default function ExamPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin h-12 w-12 text-primary" />
      </div>
    }>
      <ExamContent />
    </Suspense>
  );
}
