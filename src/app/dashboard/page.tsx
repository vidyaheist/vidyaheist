"use client";

import { useUser } from "@/firebase";
import { Loader2, BookOpenCheck, User, TrendingUp, Award } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useUserAnalytics } from "@/hooks/useUserAnalytics";
import { ActivityFeed } from "@/components/shared/analytics/ActivityFeed";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const { user, loading } = useUser();
  const { recentActivity, stats, isLoading: analyticsLoading } = useUserAnalytics();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading dashboard...</p>
      </div>
    );
  }

  if (!user) {
    // This can happen briefly on logout or if accessed directly without being logged in.
    // The main page logic should redirect non-logged-in users away.
    return (
      <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
        <p className="text-lg text-muted-foreground">Redirecting to login...</p>
      </div>
    );
  }

  const displayName = user.displayName || user.email?.split('@')[0] || "Aspirant";

  const dashboardCards = [
    {
      title: "View Test Series",
      description: "Browse and start practicing from our curated collection of tests.",
      href: "/store",
      icon: <BookOpenCheck className="w-8 h-8 text-primary" />,
    },
    {
      title: "Check Your Rank",
      description: stats.totalTests > 0 
        ? `You currently have # ${recentActivity[0]?.rank || '-'} rank in your last attempt.` 
        : "Complete a test to see your global ranking.",
      href: "/profile",
      icon: <Award className="w-8 h-8 text-primary" />,
    },
    {
      title: "Performance Analytics",
      description: stats.totalTests > 0 
        ? `Consistency: ${Math.round(stats.avgScore)}% accuracy across ${stats.totalTests} tests.` 
        : "Unlock deep performance insights after your first test.",
      href: "/profile",
      icon: <TrendingUp className="w-8 h-8 text-primary" />,
    },
     {
      title: "Manage Profile",
      description: "Update your personal details, profile picture, and security.",
      href: "/profile",
      icon: <User className="w-8 h-8 text-primary" />,
    },
  ];

  return (
    <div className="flex flex-col space-y-8">
      <section className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-primary">
          Welcome back, {displayName}!
        </h1>
        <p className="text-lg text-muted-foreground">
          Your journey to success continues here. What would you like to do today?
        </p>
      </section>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {dashboardCards.map((item) => (
          <Link href={item.href} key={item.title} className="group">
            <div className="hybrid-clay-card h-full p-6 flex flex-col justify-between">
              <div>
                <div className="bg-primary/10 p-3 rounded-2xl w-fit mb-4 border border-primary/20">
                    {item.icon}
                </div>
                <h3 className="text-xl font-extrabold mb-2 group-hover:text-primary transition-colors">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

       <div className="hybrid-clay-card p-6 md:p-8">
        <div className="flex flex-col sm:flex-row items-center justify-between border-b pb-6 mb-6">
            <div>
                <h2 className="text-2xl font-black text-foreground">Recent Activity</h2>
                <p className="text-sm text-muted-foreground">Track your journey and performance overview.</p>
            </div>
            {stats.totalTests > 0 && <Badge variant="secondary" className="px-4 py-1.5 rounded-full font-bold">{stats.totalTests} Tests Completed</Badge>}
        </div>
        <div>
            {analyticsLoading ? (
                <div className="py-20 flex justify-center items-center gap-4 text-muted-foreground italic">
                    <Loader2 className="animate-spin h-6 w-6" /> Calculating data...
                </div>
            ) : (
                <ActivityFeed activities={recentActivity} />
            )}
        </div>
       </div>
    </div>
  );
}
