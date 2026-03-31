
"use client";

import { useState, useEffect } from "react";
import { collection, query, where, orderBy, getDocs, limit } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trophy, Medal, Clock, Target, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type LeaderboardProps = {
  isOpen: boolean;
  onClose: () => void;
  testId: string;
  currentUserId?: string;
};

export function Leaderboard({ isOpen, onClose, testId, currentUserId }: LeaderboardProps) {
  const [rankings, setRankings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const firestore = useFirestore();

  useEffect(() => {
    if (isOpen && firestore && testId) {
      fetchRankings();
    }
  }, [isOpen, testId, firestore]);

  const fetchRankings = async () => {
    if (!firestore) return;
    setLoading(true);
    try {
      const q = query(
        collection(firestore, "results"),
        where("testId", "==", testId),
        // orderBy("score", "desc"),
        // orderBy("timeTaken", "asc"),
        limit(20)
      );
      
      const snap = await getDocs(q);
      const results = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Since composite indexes take time to deploy, we filter/sort in memory for now if needed
      // but Firestore supports multi-order natively if index is present.
      // For immediate use, we sort manually.
      results.sort((a: any, b: any) => {
          if (b.score !== a.score) return b.score - a.score;
          return (a.timeTaken || 9999) - (b.timeTaken || 9999);
      });

      setRankings(results);
    } catch (e) {
      console.error("Leaderboard fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (sec: number) => {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `${m}m ${s}s`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-primary p-6 text-primary-foreground">
            <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-3">
                <Trophy className="text-secondary w-8 h-8" /> 
                Real-time Leaderboard
            </DialogTitle>
            <DialogDescription className="text-primary-foreground/70">
                Performance rankings for this test simulation.
            </DialogDescription>
            </DialogHeader>
        </div>

        <div className="p-4 bg-muted/20">
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 className="animate-spin text-primary w-10 h-10" />
                    <p className="text-sm font-medium animate-pulse">Calculating Ranks...</p>
                </div>
            ) : (
                <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-2">
                        {rankings.map((rank, idx) => {
                            const isMe = rank.userId === currentUserId;
                            const isTop3 = idx < 3;
                            
                            return (
                                <div 
                                    key={rank.id} 
                                    className={cn(
                                        "flex items-center gap-4 p-4 rounded-xl border transition-all",
                                        isMe ? "bg-primary/5 border-primary shadow-sm" : "bg-background border-border",
                                        isTop3 && "ring-1 ring-secondary/30"
                                    )}
                                >
                                    <div className={cn(
                                        "w-10 h-10 flex items-center justify-center rounded-full font-bold text-lg",
                                        idx === 0 ? "bg-yellow-400 text-yellow-900" :
                                        idx === 1 ? "bg-slate-300 text-slate-700" :
                                        idx === 2 ? "bg-orange-300 text-orange-900" :
                                        "bg-muted text-muted-foreground"
                                    )}>
                                        {idx + 1}
                                    </div>
                                    
                                    <div className="flex-grow">
                                        <p className="font-bold flex items-center gap-2">
                                            {rank.userName}
                                            {isMe && <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full uppercase tracking-tighter">You</span>}
                                        </p>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                            <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {rank.score} Correct</span>
                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatTime(rank.timeTaken)}</span>
                                        </div>
                                    </div>

                                    {isTop3 && <Medal className={cn(
                                        "w-6 h-6",
                                        idx === 0 ? "text-yellow-500" : idx === 1 ? "text-slate-400" : "text-orange-500"
                                    )} />}
                                </div>
                            );
                        })}
                        {rankings.length === 0 && (
                            <p className="text-center py-10 text-muted-foreground italic">No attempts logged yet. Be the first!</p>
                        )}
                    </div>
                </ScrollArea>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
