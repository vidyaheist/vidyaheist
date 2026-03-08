
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser, useFirestore, useDoc } from "@/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck, QrCode, ArrowLeft, Send, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import type { TestSeriesType } from "@/lib/types";

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const seriesId = params.id as string;
  const { data: dbSeries, loading: seriesLoading } = useDoc<TestSeriesType>({ path: `testSeries/${seriesId}` });

  const [utr, setUtr] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Handle Demo Course logic
  const isDemo = seriesId === 'demo-paid-test';
  const series = isDemo ? {
    id: 'demo-paid-test',
    name: 'Premium Mock Test (Demo)',
    price: 1,
    subject: 'IAT',
    imageUrl: 'https://picsum.photos/seed/demo-pay/600/400'
  } as TestSeriesType : dbSeries;

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/login");
    }
  }, [user, userLoading, router]);

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !series || !firestore) return;

    if (utr.trim().length < 6) {
      toast({
        title: "Invalid UTR",
        description: "Please enter a valid Transaction ID / UTR number.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(firestore, "purchases"), {
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || "Student",
        userEmail: user.email,
        seriesId: series.id,
        seriesName: series.name,
        amount: series.price,
        utr: utr.trim(),
        status: "pending",
        createdAt: serverTimestamp(),
      });

      setSubmitted(true);
      toast({
        title: "Payment Submitted",
        description: "Our team will verify your payment within 2-4 hours.",
      });
    } catch (error: any) {
      console.error("Payment submission error:", error);
      toast({
        title: "Error",
        description: "Failed to submit payment. Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (userLoading || (seriesLoading && !isDemo)) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!series) {
    return (
      <div className="text-center py-20">
        <p className="text-xl text-muted-foreground">Course not found.</p>
        <Button variant="link" onClick={() => router.push("/store")}>Back to Courses</Button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-md mx-auto py-12">
        <Card className="text-center p-8 shadow-2xl border-2 border-primary/20">
          <CardHeader>
            <div className="mx-auto bg-green-100 p-4 rounded-full w-fit mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <CardTitle className="text-3xl font-bold">Payment Logged!</CardTitle>
            <CardDescription className="text-lg pt-2">
              We have received your UTR: <span className="font-mono font-bold text-foreground">{utr}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Your course <strong>"{series.name}"</strong> will be unlocked once we verify the transaction. This usually takes less than 4 hours.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
             <Button className="w-full rounded-full" onClick={() => router.push("/dashboard")}>Go to Dashboard</Button>
             <Button variant="outline" className="w-full rounded-full" onClick={() => router.push("/store")}>Browse More</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        {/* Course Summary */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>Course Summary</CardTitle>
            <CardDescription>Review the item you are purchasing.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="relative aspect-video rounded-lg overflow-hidden border">
              <Image 
                src={series.imageUrl || "https://placehold.co/600x400.png"} 
                alt={series.name} 
                fill 
                className="object-cover"
              />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-primary">{series.name}</h3>
              <p className="text-muted-foreground mt-1">{series.subject}</p>
            </div>
            <div className="flex justify-between items-center py-4 border-t border-b font-bold text-xl">
              <span>Total Payable:</span>
              <span className="text-primary">₹{series.price}</span>
            </div>
            <div className="bg-secondary/30 p-4 rounded-lg flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-primary mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Your payment is secure. We use manual UTR verification to ensure zero hidden fees and direct access.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Payment Logic */}
        <Card className="shadow-xl border-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="w-6 h-6 text-primary" /> Step 1: Scan & Pay
            </CardTitle>
            <CardDescription>Scan the QR below to pay via any UPI app.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 flex flex-col items-center">
            {/* Demo QR Placeholder */}
            <div className="p-4 bg-white rounded-2xl border-2 border-dashed border-primary/20 shadow-inner">
               <Image 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=your-upi-id@bank%26pn=VidyaHeist%26am=${series.price}%26cu=INR`}
                  alt="Payment QR Code"
                  width={200}
                  height={200}
                  className="mx-auto"
               />
               <p className="text-center mt-2 font-mono text-xs font-bold text-primary">UPI ID: your-upi-id@bank</p>
            </div>

            <form onSubmit={handleSubmitPayment} className="w-full space-y-6">
              <div className="space-y-3">
                <Label htmlFor="utr" className="text-lg font-bold">Step 2: Enter Transaction ID / UTR</Label>
                <Input 
                  id="utr"
                  placeholder="e.g. 123456789012"
                  className="h-14 text-lg font-mono text-center tracking-widest border-2 focus-visible:ring-primary"
                  value={utr}
                  onChange={(e) => setUtr(e.target.value)}
                  required
                />
                <p className="text-xs text-center text-muted-foreground">
                  Find the 12-digit UTR/Ref number in your UPI app's history.
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 rounded-full text-lg font-bold shadow-lg transition-all hover:scale-[1.02]"
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
                Confirm Payment
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
