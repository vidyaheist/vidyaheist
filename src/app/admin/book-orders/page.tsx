"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useCollection } from "@/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, CheckCircle, XCircle, ShieldAlert, Search, Package, MapPin, Truck } from "lucide-react";
import { doc, updateDoc, serverTimestamp, deleteDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { BookOrderType } from "@/lib/types";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";

export default function BookOrdersPage() {
  const { user, loading: userLoading, isAdmin, isMicroAdmin } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: allOrders, loading: ordersLoading } = useCollection<BookOrderType>("bookOrders");

  // State for updating tracking info in-line
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [tempTracking, setTempTracking] = useState("");

  const hasAccess = isAdmin || isMicroAdmin;

  const handleVerifyStatus = async (orderId: string, newStatus: "verified" | "rejected") => {
    if (!firestore || !isAdmin) {
      toast({
        title: "Unauthorized",
        description: "Only main administrators can verify manual UTR payments.",
        variant: "destructive",
      });
      return;
    }

    try {
      const docRef = doc(firestore, "bookOrders", orderId);
      await updateDoc(docRef, {
        status: newStatus,
        verifiedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast({
        title: `Order ${newStatus}`,
        description: `Order status updated to ${newStatus} successfully.`,
      });
    } catch (err) {
      console.error("Status verify error:", err);
      toast({
        title: "Error",
        description: "Failed to update order verification status.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateTrackingStatus = async (orderId: string, status: "processing" | "shipped" | "delivered") => {
    if (!firestore || !hasAccess) return;

    try {
      const docRef = doc(firestore, "bookOrders", orderId);
      await updateDoc(docRef, {
        status,
        updatedAt: serverTimestamp(),
      });
      toast({
        title: `Status Updated`,
        description: `Book order status has been set to ${status}.`,
      });
    } catch (err) {
      console.error("Status update error:", err);
      toast({
        title: "Error",
        description: "Failed to update book tracking status.",
        variant: "destructive",
      });
    }
  };

  const handleSaveTrackingInfo = async (orderId: string) => {
    if (!firestore || !hasAccess) return;

    try {
      const docRef = doc(firestore, "bookOrders", orderId);
      await updateDoc(docRef, {
        trackingInfo: tempTracking,
        updatedAt: serverTimestamp(),
      });
      toast({
        title: "Tracking Info Updated",
        description: "Tracking information saved successfully.",
      });
      setEditingOrderId(null);
    } catch (err) {
      console.error("Tracking save error:", err);
      toast({
        title: "Error",
        description: "Failed to save tracking information.",
        variant: "destructive",
      });
    }
  };

  if (userLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="text-center py-20 flex flex-col items-center">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground mt-2">Only administrators and tracking micro-admins can access this page.</p>
        <Button className="mt-6" onClick={() => router.push("/")}>Go Home</Button>
      </div>
    );
  }

  const filteredOrders = allOrders
    ?.filter((o) =>
      (o.bookName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (o.userEmail?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (o.utr?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (o.mobile?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });

  return (
    <div className="space-y-8">
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-primary flex items-center gap-2">
            <Package className="w-8 h-8 text-primary" />
            Book Store Orders
          </h1>
          <p className="text-muted-foreground">
            {isMicroAdmin ? "Micro-Admin Portal: Update order tracking and shipping details." : "Admin Portal: Verify UTR payments and track deliveries."}
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by book, email, UTR..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders & Trackings</CardTitle>
          <CardDescription>
            {isAdmin ? "Approve payments and track shipping." : "Update shipping and tracking reference details."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !filteredOrders?.length ? (
            <div className="text-center py-12 text-muted-foreground italic">No book orders found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Student Details</TableHead>
                  <TableHead>Book Title</TableHead>
                  <TableHead>UTR / Amount</TableHead>
                  <TableHead>Shipping Address</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead>Tracking Status</TableHead>
                  <TableHead>Tracking Info</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => {
                  const dateStr = order.createdAt?.seconds
                    ? format(new Date(order.createdAt.seconds * 1000), "MMM d, HH:mm")
                    : "N/A";

                  return (
                    <TableRow key={order.id}>
                      <TableCell className="text-xs font-semibold">{dateStr}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm">{order.userName}</span>
                          <span className="text-[11px] text-muted-foreground">{order.userEmail}</span>
                          <span className="text-[11px] text-primary font-bold">{order.mobile || "No Mobile"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-sm max-w-[150px] truncate">{order.bookName}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-black text-sm">₹{order.amount}</span>
                          <span className="font-mono bg-muted px-2 py-0.5 rounded text-[10px] w-fit font-bold">
                            {order.utr || "FREE"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <div className="text-[12px] leading-relaxed break-words font-medium text-muted-foreground flex gap-1 items-start">
                          <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                          <span>{order.address || "Digital Access Only"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {order.status === "pending" ? (
                          isAdmin ? (
                            <div className="flex gap-1.5">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50 h-8 w-8"
                                onClick={() => handleVerifyStatus(order.id, "verified")}
                              >
                                <CheckCircle className="h-5 w-5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                                onClick={() => handleVerifyStatus(order.id, "rejected")}
                              >
                                <XCircle className="h-5 w-5" />
                              </Button>
                            </div>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-yellow-100 text-yellow-700">
                              PENDING PAY
                            </span>
                          )
                        ) : (
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                              order.status === "verified" ||
                              order.status === "processing" ||
                              order.status === "shipped" ||
                              order.status === "delivered"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {order.status === "rejected" ? "REJECTED" : "VERIFIED"}
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        {/* Only allowed to adjust tracking status if payment is verified */}
                        {order.status !== "pending" && order.status !== "rejected" ? (
                          <div className="flex flex-col gap-1.5">
                            <div className="flex gap-1">
                              <Button
                                variant={order.status === "processing" ? "default" : "outline"}
                                size="sm"
                                className="text-[10px] px-2 py-0.5 h-6 font-bold rounded"
                                onClick={() => handleUpdateTrackingStatus(order.id, "processing")}
                              >
                                Process
                              </Button>
                              <Button
                                variant={order.status === "shipped" ? "default" : "outline"}
                                size="sm"
                                className="text-[10px] px-2 py-0.5 h-6 font-bold rounded"
                                onClick={() => handleUpdateTrackingStatus(order.id, "shipped")}
                              >
                                Ship
                              </Button>
                              <Button
                                variant={order.status === "delivered" ? "default" : "outline"}
                                size="sm"
                                className="text-[10px] px-2 py-0.5 h-6 font-bold rounded"
                                onClick={() => handleUpdateTrackingStatus(order.id, "delivered")}
                              >
                                Deliver
                              </Button>
                            </div>
                            <span className="text-[10px] font-black uppercase text-primary text-center">
                              {order.status}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground italic">Unlock Payment First</span>
                        )}
                      </TableCell>

                      <TableCell>
                        {order.status !== "pending" && order.status !== "rejected" ? (
                          editingOrderId === order.id ? (
                            <div className="flex items-center gap-1.5">
                              <Input
                                value={tempTracking}
                                onChange={(e) => setTempTracking(e.target.value)}
                                className="h-8 text-xs font-semibold w-32"
                                placeholder="Tracking Link / ID"
                              />
                              <Button
                                size="sm"
                                className="h-8 px-3 text-xs font-bold"
                                onClick={() => handleSaveTrackingInfo(order.id)}
                              >
                                Save
                              </Button>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1">
                              <span className="text-xs font-semibold text-muted-foreground truncate max-w-[130px]">
                                {order.trackingInfo || "No tracking set"}
                              </span>
                              <Button
                                variant="link"
                                className="p-0 h-auto text-[11px] font-black justify-start"
                                onClick={() => {
                                  setEditingOrderId(order.id);
                                  setTempTracking(order.trackingInfo || "");
                                }}
                              >
                                Edit Tracking
                              </Button>
                            </div>
                          )
                        ) : (
                          <span className="text-xs text-muted-foreground italic">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
