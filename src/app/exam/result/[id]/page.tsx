
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { useFirestore, useUser } from "@/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Trophy, Target, Zap, Clock, Check, RefreshCcw, LayoutDashboard, MessageSquareCode } from "lucide-react";
import { Leaderboard } from "../../[id]/components/Leaderboard";
import type { TestResult } from "@/lib/types";

export default function ResultPage() {
  const params = useParams();
  const router = useRouter();
  const firestore = useFirestore();
  const { user, loading: userLoading } = useUser();
  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const resultId = params.id as string;

  useEffect(() => {
    const fetchResult = async () => {
      if (!firestore || !resultId) return;
      try {
        const docRef = doc(firestore, "results", resultId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setResult({ id: docSnap.id, ...docSnap.data() } as TestResult);
        }
      } catch (error) {
        console.error("Error fetching result:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [firestore, resultId]);

  if (loading || userLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse font-medium">Crunching your numbers...</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-6 text-center px-4">
        <h1 className="text-4xl font-black text-primary">Result Not Found</h1>
        <p className="text-muted-foreground max-w-md">We couldn't retrieve your test performance at this time. It might be still processing or has been removed.</p>
        <Button onClick={() => router.push("/dashboard")} size="lg" className="rounded-full px-10">Return to Dashboard</Button>
      </div>
    );
  }

  const accuracy = Math.round((result.score / result.totalQuestions) * 100);
  const timeMins = Math.floor(result.timeTaken / 60);
  const timeSecs = result.timeTaken % 60;

  return (
    <div className="min-h-screen bg-background p-4 py-12 lg:py-20">
      <div className="max-w-4xl mx-auto space-y-10">
        <Card className="shadow-2xl border-2 border-primary/20 overflow-hidden bg-card/50 backdrop-blur-sm">
          <div className="bg-primary p-12 text-primary-foreground text-center space-y-4">
             <div className="bg-secondary p-6 rounded-full w-fit mx-auto mb-6 shadow-2xl animate-bounce">
                <Trophy className="w-12 h-12 text-secondary-foreground" />
             </div>
             <h1 className="text-5xl font-black tracking-tight">Simulation Complete</h1>
             <p className="text-primary-foreground/80 text-xl max-w-xl mx-auto font-medium">Excellent work, {result.userName}! Your performance reflects your hard work and dedication.</p>
          </div>
          
          <CardContent className="p-8 space-y-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard icon={<Target className="text-primary" />} label="Final Score" value={`${result.score} / ${result.totalQuestions}`} />
                  <StatCard icon={<Check className="text-green-600" />} label="Accuracy" value={`${accuracy}%`} bgColor="bg-green-500/10" />
                  <StatCard icon={<Clock className="text-blue-600" />} label="Time Spent" value={`${timeMins}m ${timeSecs}s`} bgColor="bg-blue-500/10" />
                  <StatCard icon={<Zap className="text-secondary-foreground" />} label="Unattempted" value={(result.totalQuestions - result.answers.filter(a => a.selectedOptionId).length).toString()} bgColor="bg-secondary/40" />
              </div>

              <div className="flex flex-col sm:flex-row gap-6 justify-center pt-4">
                  <Button 
                    onClick={() => router.push(`/exam/${result.seriesId}/${result.testId}?mode=review&resultId=${resultId}`)} 
                    size="lg" 
                    className="h-16 px-12 rounded-full text-xl shadow-xl hover:scale-105 transition-all bg-primary hover:bg-primary/90"
                  >
                      <MessageSquareCode className="mr-3 w-6 h-6" /> Review Answers
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowLeaderboard(true)} 
                    size="lg" 
                    className="h-16 px-12 rounded-full text-xl border-primary/30 hover:bg-primary/5"
                  >
                      <Trophy className="mr-3 w-6 h-6 text-secondary" /> Competitive Ranking
                  </Button>
              </div>
          </CardContent>

          <CardFooter className="bg-muted/30 p-8 flex flex-col sm:flex-row gap-4 items-center justify-between border-t border-primary/10">
              <div className="flex gap-4 w-full sm:w-auto">
                <Button variant="ghost" onClick={() => router.push("/dashboard")} className="rounded-full">
                    <LayoutDashboard className="mr-2 w-4 h-4" /> My Dashboard
                </Button>
                <Button variant="ghost" onClick={() => router.push("/store")} className="rounded-full">
                    <Check className="mr-2 w-4 h-4" /> Browse More
                </Button>
              </div>
              <Button variant="ghost" className="text-muted-foreground hover:text-primary transition-colors" onClick={() => router.push(`/exam/${result.seriesId}/${result.testId}`)}>
                  <RefreshCcw className="mr-2 w-4 h-4" /> Retake Simulation
              </Button>
          </CardFooter>
        </Card>

        {/* Action Suggestion */}
        <div className="bg-secondary/10 p-8 rounded-3xl border border-secondary/20 flex flex-col md:flex-row items-center gap-6 shadow-sm">
            <div className="bg-secondary p-4 rounded-2xl text-secondary-foreground">
                <MessageSquareCode className="w-8 h-8" />
            </div>
            <div className="text-center md:text-left flex-grow">
                <h3 className="text-xl font-bold">Deep Dive Analysis</h3>
                <p className="text-muted-foreground">Go to Review mode to get AI-powered insights on every question you missed.</p>
            </div>
            <Button variant="secondary" onClick={() => router.push(`/exam/${result.seriesId}/${result.testId}?mode=review`)} className="rounded-full px-8">Start Review</Button>
        </div>
      </div>

      <Leaderboard 
        isOpen={showLeaderboard} 
        onClose={() => setShowLeaderboard(false)} 
        testId={result.testId} 
        currentUserId={user?.uid} 
      />
    </div>
  );
}

function StatCard({ icon, label, value, bgColor = "bg-primary/10" }: { icon: React.ReactNode, label: string, value: string, bgColor?: string }) {
    return (
        <Card className="bg-muted/20 border-none shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6 flex items-center gap-5">
                <div className={`${bgColor} p-4 rounded-2xl shadow-inner`}>{icon}</div>
                <div>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">{label}</p>
                    <p className="text-2xl font-black tracking-tight">{value}</p>
                </div>
            </CardContent>
        </Card>
    );
}
