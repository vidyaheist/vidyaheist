"use client";

import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, orderBy, getDocs, limit, doc, getDoc } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { TestResult } from '@/lib/types';

export interface UserAnalytics {
  results: any[];
  chartData: { date: string; score: number; testName: string; timestamp: number }[];
  recentActivity: (any & { rank: number; totalStudents: number })[];
  stats: {
    totalTests: number;
    avgScore: number;
    highestScore: number;
  };
  isLoading: boolean;
}

export function useUserAnalytics() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [analytics, setAnalytics] = useState<UserAnalytics>({
    results: [],
    chartData: [],
    recentActivity: [],
    stats: { totalTests: 0, avgScore: 0, highestScore: 0 },
    isLoading: true,
  });

  useEffect(() => {
    async function fetchAnalytics() {
      if (!user || !firestore) return;

      try {
        // 1. Fetch All User Results
        const q = query(
          collection(firestore, "results"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        const results = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as TestResult));

        // 2. Process Stats
        const totalTests = results.length;
        const totalScorePercent = results.reduce((acc, curr) => acc + (curr.score / curr.totalQuestions), 0);
        const avgScore = totalTests > 0 ? (totalScorePercent / totalTests) * 100 : 0;
        const highestScore = results.length > 0 ? Math.max(...results.map(r => (r.score / r.totalQuestions) * 100)) : 0;

        // 3. Process Chart Data (Historical Trend)
        const chartData = [...results].reverse().map(r => ({
          date: new Date(r.createdAt.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          score: Math.round((r.score / r.totalQuestions) * 100),
          testName: r.testName,
          timestamp: r.createdAt.seconds * 1000
        }));

        // 4. Process Recent Activity with Rankings
        const recentResults = results.slice(0, 5);
        const activityWithRanks = await Promise.all(recentResults.map(async (res) => {
          // Count results for this specific test where score is higher
          const rankQuery = query(
            collection(firestore, "results"),
            where("testId", "==", res.testId),
            orderBy("score", "desc")
          );
          const rankSnap = await getDocs(rankQuery);
          
          // Simplified ranking: first occurrence of user's score in sorted list
          const allScores = rankSnap.docs.map(d => d.data().score);
          const rank = allScores.findIndex(s => s <= res.score) + 1;
          const totalStudents = rankSnap.size;

          return { ...res, rank: rank || 1, totalStudents };
        }));

        setAnalytics({
          results,
          chartData,
          recentActivity: activityWithRanks,
          stats: { totalTests, avgScore, highestScore },
          isLoading: false
        });

      } catch (error) {
        console.error("Error fetching analytics:", error);
        setAnalytics(prev => ({ ...prev, isLoading: false }));
      }
    }

    fetchAnalytics();
  }, [user, firestore]);

  return analytics;
}
