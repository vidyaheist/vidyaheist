"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TestSeriesCard } from "./components/TestSeriesCard";
import type { TestSeriesType, BookType, BookOrderType } from "@/lib/types";
import { useUser, useFirestore, useCollection, useCollectionQuery, useDoc } from "@/firebase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, PlusCircle, Award, BookOpen, ShoppingCart, Lock, CreditCard, CheckCircle2, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { collection, getDocs, query, orderBy, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function StorePage() {
  const [activeMainTab, setActiveMainTab] = useState<"courses" | "books">("courses");
  const [activeCourseFilter, setActiveCourseFilter] = useState<"free" | "premium">("premium");
  const [activeBookFilter, setActiveBookFilter] = useState<"free" | "premium">("premium");

  const [allTestSeries, setAllTestSeries] = useState<TestSeriesType[]>([]);
  const [allBooks, setAllBooks] = useState<BookType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user, loading: userLoading, isAdmin } = useUser();
  const { data: dbUser } = useDoc<any>({ path: user ? `users/${user.uid}` : null });
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  // Dialog for buying a book
  const [selectedBook, setSelectedBook] = useState<BookType | null>(null);
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [shippingAddress, setShippingAddress] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [utrNumber, setUtrNumber] = useState("");
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<"details" | "payment" | "processing" | "success">("details");
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card" | "netbanking">("upi");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  // Fetch already purchased books
  const { data: bookOrders } = useCollectionQuery<BookOrderType>("bookOrders", "userId", "==", user?.uid || null);
  const purchasedBookIds = bookOrders
    ?.filter((o) => o.status === "verified")
    .map((o) => o.bookId) || [];

  const pendingBookIds = bookOrders
    ?.filter((o) => o.status === "pending")
    .map((o) => o.bookId) || [];

  useEffect(() => {
    if (!firestore) return;

    const fetchStoreData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch Courses
        const seriesQuery = query(collection(firestore, "testSeries"), orderBy("createdAt", "desc"));
        const seriesSnapshot = await getDocs(seriesQuery);
        const seriesData = seriesSnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })) as TestSeriesType[];
        setAllTestSeries(seriesData);

        // Fetch Books
        const booksQuery = query(collection(firestore, "books"), orderBy("createdAt", "desc"));
        const booksSnapshot = await getDocs(booksQuery);
        const booksData = booksSnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })) as BookType[];
        setAllBooks(booksData);
      } catch (err: any) {
        console.error("Error fetching store data:", err);
        setError("Failed to load store items. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchStoreData();
  }, [firestore]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleBuyBook = (book: BookType) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please sign in to purchase books and study modules.",
        variant: "destructive",
      });
      router.push("/login");
      return;
    }
    setSelectedBook(book);
    setCheckoutStep("details");
    setPaymentMethod("upi");
    setCardNumber("");
    setCardExpiry("");
    setCardCvv("");
    setMobileNumber(dbUser?.mobileNumber || "");
    setShippingAddress(dbUser?.address || "");
    setCheckoutDialogOpen(true);
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobileNumber.trim() || !shippingAddress.trim()) {
      toast({
        title: "Required Fields",
        description: "Please enter your mobile number and shipping address to proceed.",
        variant: "destructive",
      });
      return;
    }
    setCheckoutStep("payment");
  };

  const handlePaymentSubmit = async () => {
    if (!firestore || !user || !selectedBook) return;

    setCheckoutStep("processing");

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast({
          title: "Payment Gateway Error",
          description: "Failed to load payment script. Check your network connection.",
          variant: "destructive",
        });
        setCheckoutStep("payment");
        return;
      }

      const orderRes = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: selectedBook.price, receipt: `rcpt_book_${user.uid}` })
      });
      
      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.error || "Failed to create order on server");
      }
      const orderId = orderData.order.id;

      const bookOrderRef = await addDoc(collection(firestore, "bookOrders"), {
        bookId: selectedBook.id,
        bookName: selectedBook.name,
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || "Student",
        userEmail: user.email || "",
        amount: selectedBook.price,
        utr: `RAZORPAY_${orderId}`,
        mobile: mobileNumber,
        address: shippingAddress,
        status: "pending",
        razorpay_order_id: orderId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: selectedBook.price * 100,
        currency: "INR",
        name: "VidyaHeist",
        description: `Purchase for ebook: ${selectedBook.name}`,
        image: "https://your-logo-url.com/logo.png",
        order_id: orderId,
        handler: async function (response: any) {
          setCheckoutStep("processing");
          try {
            const verifyRes = await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                purchaseId: bookOrderRef.id,
                isBook: true,
              })
            });

            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.success) {
              setCheckoutStep("success");
              toast({
                title: "Payment Successful!",
                description: "Your book has been instantly unlocked!",
              });
            } else {
              toast({
                title: "Verification Failed",
                description: "Failed to verify signature. Contact support if debited.",
                variant: "destructive",
              });
              setCheckoutStep("payment");
            }
          } catch (err) {
            console.error("Verification error:", err);
            toast({
              title: "Error",
              description: "Verification request failed.",
              variant: "destructive",
            });
            setCheckoutStep("payment");
          }
        },
        prefill: {
          name: user.displayName || "",
          email: user.email || "",
          contact: mobileNumber || ""
        },
        theme: {
          color: "#3399cc"
        },
        modal: {
          ondismiss: async function () {
            try {
              const docRef = doc(firestore, "bookOrders", bookOrderRef.id);
              await updateDoc(docRef, {
                status: "rejected",
                updatedAt: serverTimestamp()
              });
            } catch (err) {
              console.error("Error setting dismissed status:", err);
            }
            setCheckoutStep("payment");
          }
        }
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.on("payment.failed", async function (response: any) {
        try {
          const docRef = doc(firestore, "bookOrders", bookOrderRef.id);
          await updateDoc(docRef, {
            status: "rejected",
            updatedAt: serverTimestamp()
          });
        } catch (err) {
          console.error("Error setting failed status:", err);
        }
        toast({
          title: "Payment Failed",
          description: response.error?.description || "Payment failed or was canceled.",
          variant: "destructive"
        });
        setCheckoutStep("payment");
      });
      paymentObject.open();

    } catch (err: any) {
      console.error("Order setup failed:", err);
      toast({
        title: "Setup Error",
        description: err.message || "Failed to initialize payment gateway.",
        variant: "destructive",
      });
      setCheckoutStep("payment");
    }
  };

  // Filters
  const coursesToDisplay = allTestSeries.filter((series) => {
    const isFree = series.price === 0;
    return activeCourseFilter === "free" ? isFree : !isFree;
  });

  const booksToDisplay = allBooks.filter((book) => {
    const isFree = book.price === 0;
    return activeBookFilter === "free" ? isFree : !isFree;
  });

  return (
    <div className="space-y-6 pt-4">
      {isAdmin && (
        <div className="flex justify-end gap-3 w-full max-w-7xl mx-auto px-4">
          <Button asChild variant="outline" size="sm" className="rounded-full shadow-sm">
            <Link href="/admin/create-quiz">
              <PlusCircle className="mr-1.5 h-4 w-4 text-primary" /> Create Course
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="rounded-full shadow-sm">
            <Link href="/admin/books">
              <PlusCircle className="mr-1.5 h-4 w-4 text-primary" /> Manage Books
            </Link>
          </Button>
        </div>
      )}

      {/* Main Tabs Selection */}
      <div className="flex flex-col items-center gap-6">
        <div className="flex border-b border-primary/20 w-full max-w-lg justify-around">
          <button
            onClick={() => setActiveMainTab("courses")}
            className={`pb-3 text-lg font-black transition-all border-b-4 px-6 ${
              activeMainTab === "courses"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Online Courses
          </button>
          <button
            onClick={() => setActiveMainTab("books")}
            className={`pb-3 text-lg font-black transition-all border-b-4 px-6 ${
              activeMainTab === "books"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Study Books & Modules
          </button>
        </div>

        {/* Course Filter Sub-Tabs */}
        {activeMainTab === "courses" && (
          <div className="flex gap-4 bg-secondary/50 p-1.5 rounded-2xl w-full max-w-sm justify-between shadow-inner">
            <button
              onClick={() => setActiveCourseFilter("free")}
              className={`flex-grow py-2.5 rounded-xl font-bold transition-all text-sm ${
                activeCourseFilter === "free"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Free Courses
            </button>
            <button
              onClick={() => setActiveCourseFilter("premium")}
              className={`flex-grow py-2.5 rounded-xl font-bold transition-all text-sm ${
                activeCourseFilter === "premium"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Premium Courses (Paid)
            </button>
          </div>
        )}

        {/* Book Filter Sub-Tabs */}
        {activeMainTab === "books" && (
          <div className="flex gap-4 bg-secondary/50 p-1.5 rounded-2xl w-full max-w-sm justify-between shadow-inner">
            <button
              onClick={() => setActiveBookFilter("free")}
              className={`flex-grow py-2.5 rounded-xl font-bold transition-all text-sm ${
                activeBookFilter === "free"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Free Books
            </button>
            <button
              onClick={() => setActiveBookFilter("premium")}
              className={`flex-grow py-2.5 rounded-xl font-bold transition-all text-sm ${
                activeBookFilter === "premium"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Premium Books (Paid)
            </button>
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading && !error && (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="h-12 w-12 animate-spin text-primary opacity-50" />
          <p className="mt-4 text-muted-foreground font-medium">Loading store items...</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <Alert variant="destructive" className="my-8 max-w-lg mx-auto rounded-2xl">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>System Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Contents Grid */}
      {!loading && !error && (
        <div className="animate-fade-in">
          {activeMainTab === "courses" ? (
            coursesToDisplay.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-6">
                {coursesToDisplay.map((series) => (
                  <TestSeriesCard key={series.id} series={series} isAdmin={isAdmin} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed border-muted max-w-lg mx-auto">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-60" />
                <p className="text-lg text-muted-foreground font-semibold">
                  No courses found in this category. Check back soon!
                </p>
              </div>
            )
          ) : booksToDisplay.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-6">
              {booksToDisplay.map((book) => {
                const isFree = book.price === 0;
                const isBought = purchasedBookIds.includes(book.id) || isAdmin;
                const isPending = pendingBookIds.includes(book.id);

                return (
                  <div key={book.id} className="hybrid-clay-card flex flex-col h-full overflow-hidden">
                    <div className="relative h-48 w-full overflow-hidden rounded-t-[22px] border-b border-border/50">
                      <Image
                        src={book.imageUrl || "https://picsum.photos/seed/book/600/400"}
                        alt={book.name}
                        fill
                        className="object-cover"
                      />
                      {!isFree && !isBought && (
                        <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center">
                          <div className="bg-primary text-primary-foreground p-3 rounded-full shadow-2xl border border-foreground/10">
                            <Lock className="w-6 h-6" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-6 flex flex-col flex-grow">
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <h3 className="text-xl font-extrabold text-foreground leading-snug">{book.name}</h3>
                        {isPending && (
                          <span className="bg-yellow-500/20 text-yellow-600 text-[10px] px-2.5 py-1 rounded-full font-extrabold border border-yellow-500/30">
                            PENDING
                          </span>
                        )}
                        {isBought && !isFree && (
                          <span className="bg-green-500/20 text-green-600 text-[10px] px-2.5 py-1 rounded-full font-extrabold border border-green-500/30">
                            UNLOCKED
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-5 leading-relaxed">
                        {book.description}
                      </p>
                      <div className="mt-auto space-y-2 text-sm text-muted-foreground font-semibold flex items-center gap-2">
                        <Award className="w-4 h-4 text-primary" /> <span>{book.subject}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-6 pt-0 mt-2">
                      <p className="text-2xl font-black text-primary">{isFree ? "FREE" : `₹${book.price}`}</p>
                      <div className="flex gap-2">
                        {isAdmin && (
                          <Button asChild variant="outline" size="sm" className="rounded-full">
                            <Link href={`/admin/books?edit=${book.id}`}>Edit</Link>
                          </Button>
                        )}
                        {isFree || isBought ? (
                          <Button asChild size="sm" className="rounded-full px-6 font-extrabold hover:scale-105 active:scale-95 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            <Link href={`/store/books/${book.id}`}>Read Book</Link>
                          </Button>
                        ) : isPending ? (
                          <Button disabled size="sm" className="rounded-full px-6 font-extrabold opacity-70">
                            Pending Verification
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleBuyBook(book)}
                            size="sm"
                            className="rounded-full px-6 font-extrabold hover:scale-105 active:scale-95 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                          >
                            Buy Book
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed border-muted max-w-lg mx-auto">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-60" />
              <p className="text-lg text-muted-foreground font-semibold">
                No modules or books found in this category. Check back soon!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Sleek Checkout Dialog */}
      <Dialog open={checkoutDialogOpen} onOpenChange={setCheckoutDialogOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-3xl p-6 overflow-hidden">
          {checkoutStep === "details" && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-primary">Checkout Details</DialogTitle>
                <DialogDescription className="text-sm font-semibold">
                  Enter your mobile number and shipping address to proceed to payment.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleDetailsSubmit} className="space-y-4 pt-2">
                <div className="space-y-1">
                  <Label htmlFor="book-title" className="font-bold">Book Name</Label>
                  <Input id="book-title" value={selectedBook?.name || ""} disabled className="bg-muted font-semibold" />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="mobile" className="font-bold">WhatsApp / Mobile Number</Label>
                  <Input
                    id="mobile"
                    placeholder="10-digit mobile number"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    maxLength={10}
                    required
                    className="rounded-xl border-2"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="address" className="font-bold">Full Shipping Address (For Hardcopy Deliveries)</Label>
                  <Input
                    id="address"
                    placeholder="Detailed house address, city, pincode, state"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    required
                    className="rounded-xl border-2"
                  />
                </div>

                <DialogFooter className="pt-4">
                  <Button
                    type="submit"
                    className="w-full rounded-full font-black py-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-primary text-primary-foreground hover:scale-102 transition-transform"
                  >
                    Proceed to Payment (₹{selectedBook?.price})
                  </Button>
                </DialogFooter>
              </form>
            </>
          )}

          {checkoutStep === "payment" && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-primary flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-green-500" />
                  Secure Checkout
                </DialogTitle>
                <DialogDescription className="text-sm font-bold text-muted-foreground">
                  Select your preferred payment method below.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-4">
                {/* Book Details Summary Card */}
                <div className="bg-muted/40 p-4 rounded-2xl border-2 border-dashed border-border/80 flex justify-between items-center text-sm font-bold">
                  <div>
                    <p className="text-muted-foreground font-semibold">Subtotal</p>
                    <p className="text-foreground text-base">{selectedBook?.name}</p>
                  </div>
                  <p className="text-primary text-lg font-black">₹{selectedBook?.price}</p>
                </div>

                {/* Tabs / Selectors for Payment Methods */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setPaymentMethod("upi")}
                    className={cn(
                      "p-3 rounded-2xl border-2 text-xs font-bold flex flex-col items-center gap-1 transition-all",
                      paymentMethod === "upi" ? "border-primary bg-primary/5 text-primary shadow-md scale-102" : "border-border/60 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <div className="p-1.5 rounded-xl bg-background border border-border/40 font-black text-[10px] text-green-500 tracking-tight">UPI</div>
                    <span>UPI Apps</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod("card")}
                    className={cn(
                      "p-3 rounded-2xl border-2 text-xs font-bold flex flex-col items-center gap-1 transition-all",
                      paymentMethod === "card" ? "border-primary bg-primary/5 text-primary shadow-md scale-102" : "border-border/60 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <CreditCard className="w-5 h-5" />
                    <span>Card</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod("netbanking")}
                    className={cn(
                      "p-3 rounded-2xl border-2 text-xs font-bold flex flex-col items-center gap-1 transition-all",
                      paymentMethod === "netbanking" ? "border-primary bg-primary/5 text-primary shadow-md scale-102" : "border-border/60 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <Lock className="w-5 h-5" />
                    <span>Net Banking</span>
                  </button>
                </div>

                {/* Dynamic Payment Option Forms */}
                {paymentMethod === "upi" && (
                  <div className="space-y-3 p-1">
                    <p className="text-xs font-bold text-muted-foreground">Select a UPI application or enter your VPA:</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2 border rounded-xl flex items-center justify-center gap-1 text-[11px] font-bold bg-muted/20 hover:bg-muted/40 cursor-pointer">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span> GPay
                      </div>
                      <div className="p-2 border rounded-xl flex items-center justify-center gap-1 text-[11px] font-bold bg-muted/20 hover:bg-muted/40 cursor-pointer">
                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span> PhonePe
                      </div>
                      <div className="p-2 border rounded-xl flex items-center justify-center gap-1 text-[11px] font-bold bg-muted/20 hover:bg-muted/40 cursor-pointer">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span> Paytm
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === "card" && (
                  <div className="space-y-2 border border-border/80 p-3 rounded-2xl bg-muted/10">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold">Card Number</Label>
                      <Input
                        placeholder="4111 2222 3333 4444"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="rounded-lg h-9 border-2"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold">Expiry Date</Label>
                        <Input
                          placeholder="MM/YY"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="rounded-lg h-9 border-2"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold">CVV</Label>
                        <Input
                          placeholder="123"
                          type="password"
                          maxLength={3}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          className="rounded-lg h-9 border-2"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === "netbanking" && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-muted-foreground">Popular Banks:</p>
                    <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                      <div className="p-2.5 border rounded-xl cursor-pointer hover:bg-muted text-center">State Bank of India</div>
                      <div className="p-2.5 border rounded-xl cursor-pointer hover:bg-muted text-center">HDFC Bank</div>
                      <div className="p-2.5 border rounded-xl cursor-pointer hover:bg-muted text-center">ICICI Bank</div>
                      <div className="p-2.5 border rounded-xl cursor-pointer hover:bg-muted text-center">Axis Bank</div>
                    </div>
                  </div>
                )}

                {/* Footer Payment Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => setCheckoutStep("details")}
                    variant="outline"
                    className="rounded-full px-4 py-6 font-bold"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handlePaymentSubmit}
                    className="flex-1 rounded-full font-black py-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-primary text-primary-foreground hover:scale-102 transition-transform"
                  >
                    Pay Securely ₹{selectedBook?.price}
                  </Button>
                </div>
              </div>
            </>
          )}

          {checkoutStep === "processing" && (
            <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-foreground">Processing Payment</h3>
                <p className="text-sm font-semibold text-muted-foreground animate-pulse">
                  Connecting to secure payment network...
                </p>
              </div>
              <div className="text-[11px] text-muted-foreground font-medium max-w-[280px]">
                Please do not close this window or hit back while we authorize the checkout transaction.
              </div>
            </div>
          )}

          {checkoutStep === "success" && (
            <div className="py-8 flex flex-col items-center justify-center space-y-6 text-center">
              <div className="w-20 h-20 bg-green-500/10 rounded-full border-2 border-green-500 flex items-center justify-center text-green-500 shadow-lg animate-bounce-subtle">
                <CheckCircle2 className="w-12 h-12 fill-green-500 text-background stroke-[2]" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-foreground">Payment Successful!</h3>
                <p className="text-sm font-bold text-muted-foreground max-w-sm px-4">
                  Awesome! Your payment has been processed and your book has been instantly unlocked!
                </p>
              </div>
              <Button
                onClick={() => setCheckoutDialogOpen(false)}
                className="w-full rounded-full font-black py-6 bg-primary text-primary-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:scale-105 transition-transform"
              >
                Start Reading Now
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
