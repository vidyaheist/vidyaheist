
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TestSeriesCard } from "./components/TestSeriesCard";
import type { TestSeriesType } from "@/lib/types";
import { useUser, useFirestore } from "@/firebase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, PlusCircle, Award } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { ADMIN_EMAIL } from "@/lib/constants";

export default function StorePage() {
  const [allTestSeries, setAllTestSeries] = useState<TestSeriesType[]>([]);
  const [filteredSeries, setFilteredSeries] = useState<TestSeriesType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const { user, loading: userLoading } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const firestore = useFirestore();

  useEffect(() => {
    if (!userLoading) {
      if (user && user.email === ADMIN_EMAIL) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    }
  }, [user, userLoading]);

  useEffect(() => {
    if (!firestore) return;
    
    const fetchInitialData = async () => {
      setLoading(true);
      setError(null);
      try {
        const seriesQuery = query(collection(firestore, "testSeries"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(seriesQuery);
        
        const mappedData = querySnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
        })) as TestSeriesType[];

        const questionBankSeries: TestSeriesType = {
          id: 'latex-question-bank',
          name: 'General Question Bank (Free)',
          description: 'A collection of questions rendered from a LaTeX file to test the quiz interface.',
          price: 0,
          imageUrl: 'https://picsum.photos/seed/latex-questions/600/400',
          data_ai_hint: 'library books',
          subject: 'General',
          numberOfTests: 1,
          durationPerTest: null,
          createdAt: new Date().toISOString(),
        };

        const demoPaidSeries: TestSeriesType = {
          id: 'demo-paid-test',
          name: 'Premium Mock Test (Demo)',
          description: 'A sample paid test to verify the payment and paywall system. Buy this for ₹1 to test the UTR submission flow.',
          price: 1,
          imageUrl: 'https://picsum.photos/seed/demo-pay/600/400',
          data_ai_hint: 'online test',
          subject: 'IAT',
          numberOfTests: 1,
          durationPerTest: 180,
          createdAt: new Date().toISOString(),
        };

        setAllTestSeries([questionBankSeries, demoPaidSeries, ...mappedData]);
        setFilteredSeries([questionBankSeries, demoPaidSeries, ...mappedData]);
      } catch (err: any) {
        console.error("Error fetching test series:", err);
        setError("Failed to load courses. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [firestore]); 

  useEffect(() => {
    let seriesToDisplay = allTestSeries;
    if (activeTab === "nest") {
      seriesToDisplay = allTestSeries.filter(
        (series) => series.subject && series.subject.toLowerCase().includes("nest")
      );
    } else if (activeTab === "iat") {
      seriesToDisplay = allTestSeries.filter(
        (series) => series.subject && series.subject.toLowerCase().includes("iat")
      );
    }
    setFilteredSeries(seriesToDisplay);
  }, [activeTab, allTestSeries]);

  return (
    <div className="space-y-8">
      <section className="text-center py-12 bg-primary/5 rounded-3xl relative overflow-hidden px-4">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-20" />
        
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-bold text-primary mb-6 animate-fade-in-up">
          <Award className="h-4 w-4" />
          <span>India's #1 Test Series</span>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-primary mb-4">
          Our Courses
        </h1>
        <p className="max-w-2xl mx-auto text-lg text-muted-foreground font-medium">
          Premium exam preparation modules curated by research experts for IAT & NEST aspirants.
        </p>
        
        {isAdmin && (
          <div className="mt-8">
            <Button asChild variant="outline" size="lg" className="rounded-full shadow-sm hover:shadow-md transition-all">
              <Link href="/admin/create-quiz">
                <PlusCircle className="mr-2 h-5 w-5" /> Create New Course
              </Link>
            </Button>
          </div>
        )}
      </section>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto bg-secondary/50 p-1 rounded-xl">
          <TabsTrigger value="all" className="rounded-lg font-semibold">All</TabsTrigger>
          <TabsTrigger value="iat" className="rounded-lg font-semibold">IAT</TabsTrigger>
          <TabsTrigger value="nest" className="rounded-lg font-semibold">NEST</TabsTrigger>
        </TabsList>

        {loading && !error && ( 
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="h-12 w-12 animate-spin text-primary opacity-50" />
            <p className="mt-4 text-muted-foreground font-medium">Fetching courses...</p>
          </div>
        )}

        {error && ( 
            <Alert variant="destructive" className="my-8 max-w-lg mx-auto rounded-2xl">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>System Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

        {!loading && (
          <TabsContent value={activeTab} forceMount className="animate-fade-in">
              {filteredSeries.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
                  {filteredSeries.map((series) => (
                    <TestSeriesCard key={series.id} series={series} isAdmin={isAdmin} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-24 bg-muted/20 rounded-3xl border-2 border-dashed border-muted">
                  <p className="text-xl text-muted-foreground font-medium">
                    New courses for {activeTab.toUpperCase()} are coming soon.
                  </p>
                </div>
              )}
            </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
