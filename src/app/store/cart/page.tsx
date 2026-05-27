"use client";

import React, { useState, useEffect } from "react";
import { useCart } from "@/providers/CartProvider";
import { useUser, useFirestore, useDoc } from "@/firebase";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { addDoc, collection, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, ShoppingBag, Loader2, CreditCard, ShieldCheck, ArrowLeft, CheckCircle2 } from "lucide-react";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh", "Puducherry"
];

export default function CartPage() {
  const { cart, removeFromCart, clearCart, cartCount, cartTotal } = useCart();
  const { user, loading: userLoading } = useUser();
  const { data: dbUser } = useDoc<any>({ path: user ? `users/${user.uid}` : null });
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  // Structured Address State
  const [fullName, setFullName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [altMobileNumber, setAltMobileNumber] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [pincode, setPincode] = useState("");

  const [checkoutStep, setCheckoutStep] = useState<"cart" | "address" | "processing" | "success">("cart");
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // Autofill from user profile if available
  useEffect(() => {
    if (user) {
      setFullName(user.displayName || "");
    }
    if (dbUser) {
      setMobileNumber(dbUser.mobileNumber || "");
      if (dbUser.address) {
        // If address is stored as single block, populate Address Line 1
        setAddressLine1(dbUser.address);
      }
    }
  }, [user, dbUser]);

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

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to purchase study materials.",
        variant: "destructive",
      });
      router.push("/login");
      return;
    }

    if (checkoutStep === "cart") {
      setCheckoutStep("address");
    }
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user || cart.length === 0) return;

    // Form Validation
    if (!fullName.trim() || !mobileNumber.trim() || !addressLine1.trim() || !city.trim() || !selectedState || !pincode.trim()) {
      toast({
        title: "Missing Fields",
        description: "Please fill out all mandatory shipping details.",
        variant: "destructive",
      });
      return;
    }

    if (mobileNumber.length !== 10) {
      toast({
        title: "Invalid Phone Number",
        description: "Primary mobile number must be exactly 10 digits.",
        variant: "destructive",
      });
      return;
    }

    if (pincode.length !== 6 || isNaN(Number(pincode))) {
      toast({
        title: "Invalid Pincode",
        description: "Pincode must be a 6-digit number.",
        variant: "destructive",
      });
      return;
    }

    setCheckoutStep("processing");

    // Concatenate shipping address to a robust clean string
    const altSuffix = altMobileNumber ? `, Alternate Contact: ${altMobileNumber}` : "";
    const fullShippingAddress = `${addressLine1}, ${addressLine2 ? addressLine2 + ", " : ""}${city}, ${selectedState} - ${pincode}${altSuffix}`;

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast({
          title: "Payment Gateway Error",
          description: "Could not initialize payment module. Check your connection.",
          variant: "destructive",
        });
        setCheckoutStep("address");
        return;
      }

      // Create Razorpay Order
      const orderRes = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: cartTotal, receipt: `rcpt_cart_${user.uid}` }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.error || "Server order setup failed.");
      }

      const orderId = orderData.order.id;

      // Add a pending bookOrder document for each book in the cart
      const pendingOrderRefs: string[] = [];
      for (const book of cart) {
        const docRef = await addDoc(collection(firestore, "bookOrders"), {
          bookId: book.id,
          bookName: book.name,
          userId: user.uid,
          userName: fullName,
          userEmail: user.email || "",
          amount: book.price,
          utr: `RAZORPAY_${orderId}`,
          mobile: mobileNumber,
          address: fullShippingAddress,
          status: "pending",
          razorpay_order_id: orderId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        pendingOrderRefs.push(docRef.id);
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: cartTotal * 100,
        currency: "INR",
        name: "VidyaHeist",
        description: `Shopping Cart Checkout (${cartCount} Books)`,
        order_id: orderId,
        handler: async function (response: any) {
          setCheckoutStep("processing");
          try {
            // Verify all created purchases
            let success = true;
            for (const purchaseId of pendingOrderRefs) {
              const verifyRes = await fetch("/api/razorpay/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                  purchaseId: purchaseId,
                  isBook: true,
                }),
              });
              const verifyData = await verifyRes.json();
              if (!verifyRes.ok || !verifyData.success) {
                success = false;
              }
            }

            if (success) {
              clearCart();
              setCheckoutStep("success");
              toast({
                title: "Purchase Successful!",
                description: "All books have been unlocked in your secure library!",
              });
            } else {
              toast({
                title: "Verification issue",
                description: "One or more payments failed to verify. Contact admin.",
                variant: "destructive",
              });
              setCheckoutStep("address");
            }
          } catch (err) {
            console.error(err);
            setCheckoutStep("address");
          }
        },
        prefill: {
          name: fullName,
          email: user.email || "",
          contact: mobileNumber,
        },
        theme: {
          color: "#3b82f6",
        },
        modal: {
          ondismiss: async function () {
            if (firestore) {
              for (const purchaseId of pendingOrderRefs) {
                try {
                  const docRef = doc(firestore, "bookOrders", purchaseId);
                  await updateDoc(docRef, {
                    status: "rejected",
                    updatedAt: serverTimestamp()
                  });
                } catch (err) {
                  console.error("Error rejecting dismissed order:", err);
                }
              }
            }
            toast({
              title: "Payment Cancelled",
              description: "The payment process was dismissed. You can modify your cart or retry.",
            });
            setCheckoutStep("address");
          },
        },
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.on("payment.failed", async function (response: any) {
        if (firestore) {
          for (const purchaseId of pendingOrderRefs) {
            try {
              const docRef = doc(firestore, "bookOrders", purchaseId);
              await updateDoc(docRef, {
                status: "rejected",
                updatedAt: serverTimestamp()
              });
            } catch (err) {
              console.error("Error setting failed status:", err);
            }
          }
        }
        toast({
          title: "Payment Failed",
          description: response.error?.description || "Payment failed or was canceled.",
          variant: "destructive"
        });
        setCheckoutStep("address");
      });
      paymentObject.open();

    } catch (err: any) {
      console.error(err);
      toast({
        title: "Order Failed",
        description: err.message || "Failed to initiate transaction.",
        variant: "destructive",
      });
      setCheckoutStep("address");
    }
  };

  if (checkoutStep === "success") {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-6 animate-fade-in bg-card border border-primary/10 rounded-[32px] p-8 shadow-xl mt-12">
        <div className="bg-green-100 p-4 rounded-full w-fit mx-auto border border-green-500/20 text-green-600">
          <CheckCircle2 className="w-16 h-16 animate-bounce" />
        </div>
        <h1 className="text-3xl font-black text-foreground">Order Placed!</h1>
        <p className="text-sm font-semibold text-muted-foreground leading-relaxed">
          Your payment was successfully processed. Your secure digital study books are unlocked, and hardcopies will be dispatched to your address shortly!
        </p>
        <div className="flex flex-col gap-3 pt-4">
          <Button asChild size="lg" className="rounded-full font-black py-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Link href="/profile">View Purchases & Tracking</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-full font-black py-6">
            <Link href="/store">Back to Store</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (cartCount === 0) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 bg-muted/10 border-2 border-dashed border-muted rounded-3xl p-12 mt-12 space-y-6">
        <ShoppingBag className="w-16 h-16 text-muted mx-auto" />
        <h2 className="text-2xl font-black text-foreground">Your Shopping Cart is Empty</h2>
        <p className="text-sm font-semibold text-muted-foreground">
          Explore VidyaHeist secure study guides and test booster modules to prepare for your competitive exams.
        </p>
        <Button asChild className="rounded-full px-8 py-6 font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <Link href="/store">Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 px-4">
      {/* Header and Back navigation */}
      <div className="flex items-center pb-4 border-b border-primary/10">
        <Button asChild variant="ghost" className="gap-2 text-muted-foreground font-bold">
          <Link href="/store">
            <ArrowLeft className="w-5 h-5" /> Back to Store
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Cart Item Listing / Checkout Form */}
        <div className="lg:col-span-8 space-y-6">
          {checkoutStep === "cart" ? (
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-foreground">Shopping Cart ({cartCount} Items)</h2>
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="bg-card border border-primary/10 p-5 rounded-[22px] flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="relative h-20 w-16 overflow-hidden rounded-lg flex-shrink-0 border bg-muted">
                        <Image
                          src={item.imageUrl || "https://picsum.photos/seed/book/600/400"}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-base text-foreground leading-tight">{item.name}</h4>
                        <span className="bg-primary/10 text-primary text-[10px] font-black px-2.5 py-0.5 rounded-full mt-1.5 inline-block uppercase">
                          {item.subject}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-none border-primary/5">
                      <p className="text-xl font-black text-primary">₹{item.price}</p>
                      <Button
                        onClick={() => removeFromCart(item.id)}
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10 rounded-full h-10 w-10"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : checkoutStep === "address" ? (
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Button onClick={() => setCheckoutStep("cart")} variant="ghost" size="icon" className="rounded-full">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <h2 className="text-2xl font-black text-foreground">Dispatched Shipping Address</h2>
              </div>
              <form onSubmit={handleAddressSubmit} className="bg-card border border-primary/10 p-6 rounded-[28px] space-y-4 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="fullname" className="text-xs font-bold">Student Full Name *</Label>
                    <Input
                      id="fullname"
                      placeholder="Enter full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="rounded-xl border-2 font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="mobile" className="text-xs font-bold">Primary WhatsApp Phone *</Label>
                    <Input
                      id="mobile"
                      maxLength={10}
                      placeholder="10-digit number"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      required
                      className="rounded-xl border-2 font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="altMobile" className="text-xs font-bold">Alternate Contact Number (Optional)</Label>
                    <Input
                      id="altMobile"
                      maxLength={10}
                      placeholder="Alternative contact number"
                      value={altMobileNumber}
                      onChange={(e) => setAltMobileNumber(e.target.value)}
                      className="rounded-xl border-2 font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="pincode" className="text-xs font-bold">Pincode (6-Digits Dispatched Location) *</Label>
                    <Input
                      id="pincode"
                      maxLength={6}
                      placeholder="e.g. 110001"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      required
                      className="rounded-xl border-2 font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="address1" className="text-xs font-bold">Address Line 1 (House No, Building, Street Name) *</Label>
                  <Input
                    id="address1"
                    placeholder="e.g. Flat 302, Wing-B, Royal heights"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    required
                    className="rounded-xl border-2 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="address2" className="text-xs font-bold">Address Line 2 (Area, Colony, Landmark) *</Label>
                  <Input
                    id="address2"
                    placeholder="e.g. Near HDFC Bank, Sector 4"
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                    className="rounded-xl border-2 font-semibold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="city" className="text-xs font-bold">City *</Label>
                    <Input
                      id="city"
                      placeholder="e.g. Noida"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                      className="rounded-xl border-2 font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="state" className="text-xs font-bold">State *</Label>
                    <Select value={selectedState} onValueChange={setSelectedState} required>
                      <SelectTrigger className="rounded-xl border-2 font-semibold h-10">
                        <SelectValue placeholder="Select State" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDIAN_STATES.map((state) => (
                          <SelectItem key={state} value={state} className="font-semibold">
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button type="submit" className="hidden" id="address-submit-btn" />
              </form>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-card border border-primary/10 rounded-[28px] space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="font-extrabold text-muted-foreground text-sm">Initializing Secure Razorpay Checkout Gateway...</p>
            </div>
          )}
        </div>

        {/* Pricing Summary Side-panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-card border border-primary/10 p-6 rounded-[28px] space-y-6 shadow-sm sticky top-24">
            <h3 className="font-black text-lg text-foreground pb-2 border-b">Order Summary</h3>
            <div className="space-y-3 font-semibold text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Total Items</span>
                <span>{cartCount}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Hardcopy Shipping</span>
                <span className="text-green-600 font-extrabold">FREE DELIVERY</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Taxes & GST</span>
                <span>Included</span>
              </div>
              <div className="flex justify-between items-center text-foreground font-black text-base pt-3 border-t border-dashed">
                <span>Subtotal Amount</span>
                <span className="text-primary text-xl font-black">₹{cartTotal}</span>
              </div>
            </div>

            {checkoutStep === "cart" ? (
              <Button
                onClick={handleNextStep}
                className="w-full rounded-full py-6 font-black text-base shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] bg-primary text-primary-foreground hover:scale-102 transition-transform"
              >
                Proceed to Checkout
              </Button>
            ) : checkoutStep === "address" ? (
              <Button
                onClick={() => document.getElementById("address-submit-btn")?.click()}
                className="w-full rounded-full py-6 font-black text-base shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] bg-primary text-primary-foreground hover:scale-102 transition-transform flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-5 h-5 text-green-400" /> Pay ₹{cartTotal} Securely
              </Button>
            ) : null}

            {/* Quality Badges */}
            <div className="pt-2 text-[10px] text-muted-foreground font-semibold flex flex-col gap-2 border-t border-primary/5">
              <p className="flex items-center gap-1.5 text-green-700">
                <ShieldCheck className="w-3.5 h-3.5 fill-green-500/10" /> 100% Genuine exam books & study modules
              </p>
              <p className="flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-primary" /> Dispatched within 24 hours of successful verification
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
