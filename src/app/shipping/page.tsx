"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ShippingPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 animate-in slide-in-from-top-10 duration-700">
      <Card className="shadow-xl bg-card border-2 border-primary/5">
        <CardHeader className="bg-primary/5 border-b py-8">
          <CardTitle className="text-3xl font-black text-center text-primary uppercase leading-tight">Shipping Policy</CardTitle>
          <CardDescription className="text-center font-medium mt-2 italic text-muted-foreground">Official Shipping Standards for VidyaHeist</CardDescription>
        </CardHeader>
        <CardContent className="p-8 prose prose-slate max-w-none text-muted-foreground leading-relaxed">
          <p className="mb-6">
            The orders for the user are shipped through registered domestic courier companies and/or speed post
            only. Orders are shipped within 14 days from the date of the order and/or payment or as per the delivery
            date agreed at the time of order confirmation and delivering of the shipment, subject to courier company /
            post office norms.
          </p>
          
          <div className="bg-primary/5 p-6 rounded-xl border border-primary/10 mb-6">
            <p className="font-bold text-foreground mb-2 italic underline underline-offset-4">Limitation of Liability:</p>
            <p>
                Platform Owner shall not be liable for any delay in delivery by the courier company /
                postal authority. Delivery of all orders will be made to the address provided by the buyer at the time of
                purchase. Delivery of our services will be confirmed on your email ID as specified at the time of
                registration.
            </p>
          </div>

          <p>
            If there are any shipping cost(s) levied by the seller or the Platform Owner (as the case be), 
            the same is not refundable.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
