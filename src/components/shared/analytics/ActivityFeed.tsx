"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Award, ChevronRight, Clock, Target, TrendingUp } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface ActivityFeedProps {
  activities: any[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <div className="bg-muted/50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 opacity-20" />
        </div>
        <p className="font-medium">No tests taken yet</p>
        <p className="text-sm">Your recent performance and rankings will appear here.</p>
        <Button asChild variant="link" className="mt-2 text-primary font-bold">
            <Link href="/store">Browse Test Series <ChevronRight className="ml-1 w-4 h-4" /></Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="group relative flex items-center justify-between p-4 rounded-xl border-2 border-transparent hover:border-primary/10 hover:bg-primary/5 transition-all">
          <div className="flex items-center gap-4">
             <div className="bg-primary/10 p-3 rounded-xl">
                 <TrendingUp className="w-6 h-6 text-primary" />
             </div>
             <div>
                <h4 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">{activity.testName}</h4>
                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground font-medium">
                    <span className="flex items-center gap-1"><Target className="w-3.5 h-3.5" /> {activity.score} / {activity.totalQuestions} Marks</span>
                    <span className="flex items-center gap-1 border-l pl-3"><Clock className="w-3.5 h-3.5" /> {formatDistanceToNow(new Date(activity.createdAt.seconds * 1000))} ago</span>
                </div>
             </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
                <div className="flex items-center justify-end gap-1.5 font-black text-2xl text-secondary">
                    <Award className="w-5 h-5" /> #{activity.rank}
                </div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mt-1">Global Rank</p>
            </div>
            
            <Button asChild variant="ghost" size="icon" className="rounded-full hover:bg-primary/20">
                <Link href={`/exam/result/${activity.id}`}>
                    <ChevronRight className="w-6 h-6" />
                </Link>
            </Button>
          </div>
        </div>
      ))}

      {activities.length >= 5 && (
          <div className="pt-4 flex justify-center">
              <Button asChild variant="outline" className="rounded-full shadow-sm hover:translate-y-[-2px] transition-transform">
                  <Link href="/profile">View All History <TrendingUp className="ml-2 w-4 h-4" /></Link>
              </Button>
          </div>
      )}
    </div>
  );
}
