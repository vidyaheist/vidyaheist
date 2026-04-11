"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser, useFirestore, useDoc } from "@/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, CreditCard, ArrowLeft, Send, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import type { TestSeriesType } from "@/lib/types";
import Script from "next/script";

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const seriesId = params.id as string;
  const { data: dbSeries, loading: seriesLoading } = useDoc<TestSeriesType>({ path: `testSeries/${seriesId}` });

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

  const handleRazorpayPayment = async () => {
    if (!user || !series || !firestore) return;

    setIsSubmitting(true);
    try {
      // 1. Create order on our backend
      const orderRes = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: series.price, receipt: `rcpt_${user.uid}` })
      });
      
      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        const error = new Error(orderData.error || "Failed to create order");
        (error as any).details = orderData.details;
        throw error;
      }
      
      const orderId = orderData.order.id;

      // 2. Draft the purchase document in pending state
      const purchaseRef = await addDoc(collection(firestore, "purchases"), {
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || "Student",
        userEmail: user.email,
        seriesId: series.id,
        seriesName: series.name,
        amount: series.price,
        status: "pending",
        razorpay_order_id: orderId,
        createdAt: serverTimestamp(),
      });

      // 3. Initialize Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // Enter the Key ID generated from the Dashboard
        amount: series.price * 100, // Amount is in currency subunits. Default currency is INR.
        currency: "INR",
        name: "VidyaHeist",
        description: `Purchase for ${series.name}`,
        image: "https://your-logo-url.com/logo.png",
        order_id: orderId,
        handler: async function (response: any) {
          // 4. Verify payment via server
          try {
            const verifyRes = await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                purchaseId: purchaseRef.id,
              })
            });

            const verifyData = await verifyRes.json();
            
            if (verifyRes.ok && verifyData.success) {
               setSubmitted(true);
               toast({
                 title: "Payment Successful",
                 description: "Your course has been unlocked!",
               });
            } else {
               toast({
                 title: "Verification Failed",
                 description: "Please contact support if amount was deducted.",
                 variant: "destructive",
               });
            }
          } catch (err) {
             console.error(err);
             toast({ title: "Error", description: "Verification endpoint failed.", variant: "destructive" });
          }
        },
        prefill: {
          name: user.displayName || "",
          email: user.email || "",
          contact: ""
        },
        theme: {
          color: "#3399cc"
        }
      };

      const paymentObject = new (window as any).Razorpay(options);
      
      paymentObject.on("payment.failed", function (response: any) {
        toast({
          title: "Payment Failed",
          description: response.error.description,
          variant: "destructive"
        });
      });

      paymentObject.open();

    } catch (error: any) {
      console.error("Payment setup error:", error);
      toast({
        title: "Order Error",
        description: error.details || error.message || "Failed to initialize payment.",
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
            <CardTitle className="text-3xl font-bold">Payment Successful!</CardTitle>
            <CardDescription className="text-lg pt-2">
              Your purchase for <span className="font-bold text-foreground">{series.name}</span> is approved.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              You now have full access to this course. Let the heist begin!
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
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      
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
                Your payment is secure and processed by Razorpay. Military-grade encryption protects your card and UPI details.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Payment Logic */}
        <Card className="shadow-xl border-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-primary" /> Checkout
            </CardTitle>
            <CardDescription>Pay instantly using UPI, Cards, Netbanking, or Wallets.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 flex flex-col items-center py-8">
            <div className="p-4 bg-muted/30 rounded-2xl border-2 border-dashed border-primary/20 shadow-inner w-full text-center">
               <ShieldCheck className="w-12 h-12 text-primary mx-auto mb-2 opacity-50" />
               <p className="font-semibold">Secured by Razorpay</p>
            </div>

            <Button 
              onClick={handleRazorpayPayment}
              className="w-full h-14 rounded-full text-lg font-bold shadow-lg transition-all hover:scale-[1.02]"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
              Pay ₹{series.price}
            </Button>
            
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
