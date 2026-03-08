"use client";

import type { TestSeriesType, PurchaseType } from "@/lib/types";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { BookCheck, Edit, ListChecks, Lock, CheckCircle2, Clock3 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser, useCollectionQuery } from "@/firebase";
import { useMemo } from "react";

type TestSeriesCardProps = {
  series: TestSeriesType;
  isAdmin?: boolean;
};

export function TestSeriesCard({ series, isAdmin }: TestSeriesCardProps) {
  const router = useRouter();
  const { user } = useUser();

  // Check if current user has purchased this series
  // We only pass the UID if the user is authenticated to avoid permission errors
  const { data: purchases } = useCollectionQuery<PurchaseType>(
    "purchases",
    "userId",
    "==",
    user?.uid || undefined 
  );

  const purchaseStatus = useMemo(() => {
    if (!user) return null;
    const p = purchases?.find(p => p.seriesId === series.id);
    return p ? p.status : null;
  }, [purchases, series.id, user]);

  const defaultImageUrl = "https://picsum.photos/seed/course/600/400";
  const displayImageUrl = series.imageUrl || defaultImageUrl;

  const isLatexBank = series.id === 'latex-question-bank';
  const isFree = isLatexBank || series.price === 0;
  const isUnlocked = isFree || purchaseStatus === 'verified' || isAdmin;

  const handleActionClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      router.push('/signup');
    }
  };

  return (
    <Card className="flex flex-col h-full overflow-hidden transition-all hover:shadow-lg border-2 border-transparent hover:border-primary/20">
      <CardHeader className="p-0 relative">
        <Image
          src={displayImageUrl}
          alt={series.name}
          width={600}
          height={400}
          className="object-cover aspect-[3/2]"
          data-ai-hint={series.data_ai_hint || "education online"}
          unoptimized={!series.imageUrl} 
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null; 
            target.src = defaultImageUrl;
          }}
        />
        {!isUnlocked && (
           <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center">
              <div className="bg-primary text-primary-foreground p-2 rounded-full shadow-xl">
                <Lock className="w-6 h-6" />
              </div>
           </div>
        )}
      </CardHeader>
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex justify-between items-start gap-2 mb-2">
           <CardTitle className="text-xl hover:text-primary transition-colors">{series.name}</CardTitle>
           {user && purchaseStatus === 'pending' && (
             <span className="flex items-center gap-1 text-[10px] font-bold bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full whitespace-nowrap">
               <Clock3 className="w-3 h-3" /> VERIFYING
             </span>
           )}
           {user && purchaseStatus === 'verified' && (
             <span className="flex items-center gap-1 text-[10px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full whitespace-nowrap">
               <CheckCircle2 className="w-3 h-3" /> UNLOCKED
             </span>
           )}
        </div>
        <CardDescription className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-grow">
          {series.description || "No description available."}
        </CardDescription>
        <div className="space-y-2 text-sm text-muted-foreground mb-4">
          {series.subject && (
            <div className="flex items-center">
              <BookCheck className="w-4 h-4 mr-2 text-accent" />
              <span>{series.subject}</span>
            </div>
          )}
          {series.numberOfTests != null && (
            <div className="flex items-center">
              <ListChecks className="w-4 h-4 mr-2 text-accent" />
              <span>{series.numberOfTests} {series.numberOfTests === 1 ? 'Part' : 'Tests'}</span>
            </div>
          )}
        </div>
      </div>
      <CardFooter className="flex justify-between items-center mt-auto pt-0 p-6">
        <p className="text-2xl font-bold text-primary">
          {isFree ? 'FREE' : `₹${series.price}`}
        </p>
        <div className="flex items-center gap-2">
            {isAdmin && !isLatexBank && (
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/edit-quiz/${series.id}`}> 
                  <Edit className="h-4 w-4" />
                </Link>
              </Button>
            )}
            
            {isUnlocked ? (
              <Button asChild size="sm" className="rounded-full px-6">
                <Link href={isLatexBank ? '/exam/latex-question-bank' : `/exam/${series.id}`} onClick={handleActionClick}>
                  {isAdmin ? 'Manage' : 'Start'}
                </Link>
              </Button>
            ) : (
              <Button asChild size="sm" variant="default" className="rounded-full px-6">
                <Link href={`/checkout/${series.id}`} onClick={handleActionClick}>
                  {purchaseStatus === 'pending' ? 'Checking...' : 'Buy Now'}
                </Link>
              </Button>
            )}
        </div>
      </CardFooter>
    </Card>
  );
}
