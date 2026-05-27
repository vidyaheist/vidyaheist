
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useCollection } from "@/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, CheckCircle, XCircle, ShieldAlert, Search } from "lucide-react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { PurchaseType } from "@/lib/types";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { ADMIN_EMAIL } from "@/lib/constants";

export default function AdminOrdersPage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: allPurchases, loading: purchasesLoading } = useCollection<PurchaseType>("purchases");

  useEffect(() => {
    if (!userLoading) {
      if (user && user.email === ADMIN_EMAIL) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    }
  }, [user, userLoading]);

  const handleStatusUpdate = async (purchaseId: string, newStatus: 'verified' | 'rejected') => {
    if (!firestore) return;
    try {
      const docRef = doc(firestore, "purchases", purchaseId);
      await updateDoc(docRef, {
        status: newStatus,
        verifiedAt: serverTimestamp(),
      });
      toast({
        title: `Order ${newStatus}`,
        description: `The order status has been updated to ${newStatus}.`,
      });
    } catch (error: any) {
      console.error("Status update error:", error);
      toast({
        title: "Error",
        description: "Failed to update status.",
        variant: "destructive",
      });
    }
  };

  if (userLoading || isAdmin === null) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-20 flex flex-col items-center">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground mt-2">Only administrators can access the order verification panel.</p>
        <Button className="mt-6" onClick={() => router.push("/")}>Go Home</Button>
      </div>
    );
  }

  const filteredPurchases = allPurchases?.filter(p => {
    // Hide unpaid/abandoned Razorpay orders
    const isUnpaidRazorpay = p.status === 'pending' && (p as any).razorpay_order_id && !(p as any).razorpay_payment_id;
    if (isUnpaidRazorpay) return false;

    return (p.utr?.toLowerCase() || "").includes(searchTerm.toLowerCase()) || 
      ((p as any).razorpay_payment_id?.toLowerCase() || "").includes(searchTerm.toLowerCase()) || 
      (p.userEmail?.toLowerCase() || "").includes(searchTerm.toLowerCase()) || 
      (p.seriesName?.toLowerCase() || "").includes(searchTerm.toLowerCase());
  }).sort((a, b) => {
    const timeA = a.createdAt?.seconds || 0;
    const timeB = b.createdAt?.seconds || 0;
    return timeB - timeA;
  });

  return (
    <div className="space-y-8">
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Order History</h1>
          <p className="text-muted-foreground">Monitor automated payments and verify manual UTR submissions.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by UTR, Email, Course..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>Approve or Reject payments based on your bank statement.</CardDescription>
        </CardHeader>
        <CardContent>
          {purchasesLoading ? (
             <div className="flex justify-center py-12">
               <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
          ) : !filteredPurchases?.length ? (
            <div className="text-center py-12 text-muted-foreground">
              No orders found matching your search.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Reference / UTR</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPurchases.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell className="text-xs font-medium">
                      {purchase.createdAt?.seconds ? format(new Date(purchase.createdAt.seconds * 1000), "MMM d, HH:mm") : "N/A"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold">{purchase.userName}</span>
                        <span className="text-[10px] text-muted-foreground">{purchase.userEmail}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate">{purchase.seriesName}</TableCell>
                    <TableCell className="font-bold">₹{purchase.amount}</TableCell>
                    <TableCell>
                      <span className="font-mono bg-muted px-2 py-1 rounded text-[10px] font-bold">
                        {purchase.utr || purchase.razorpay_payment_id || purchase.razorpay_order_id || "NOT_ASSIGNED"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                        purchase.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        (purchase.status === 'verified' || purchase.status === 'success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {purchase.status === 'success' ? 'AUTOMATED' : purchase.status}
                      </span>
                    </TableCell>
                     <TableCell className="text-right">
                      {purchase.status === 'pending' && !purchase.razorpay_payment_id && !purchase.razorpay_order_id && (
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleStatusUpdate(purchase.id, 'verified')}
                          >
                            <CheckCircle className="h-5 w-5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleStatusUpdate(purchase.id, 'rejected')}
                          >
                            <XCircle className="h-5 w-5" />
                          </Button>
                        </div>
                      )}
                       {(purchase.status === 'verified' || purchase.status === 'success' || purchase.razorpay_payment_id || purchase.razorpay_order_id) && (
                        <div className="flex justify-end">
                           <span className={`text-xs font-bold flex items-center gap-1 px-3 py-1 rounded-full ${
                             (purchase.status === 'success' || purchase.status === 'verified') 
                             ? "text-green-600 bg-green-50" 
                             : "text-yellow-600 bg-yellow-50"
                           }`}>
                              { (purchase.status === 'success' || purchase.status === 'verified') ? <CheckCircle className="w-3 h-3" /> : <Loader2 className="w-3 h-3 animate-spin" /> }
                              { (purchase.status === 'success' || purchase.status === 'verified') ? "Confirmed" : "In Progress" }
                           </span>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
