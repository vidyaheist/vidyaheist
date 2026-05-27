"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useCollection } from "@/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Phone, MessageCircle, CheckCircle2, AlertCircle, Trash2, Search, Users, Sparkles, MessageSquareHeart } from "lucide-react";
import { doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";

type CounsellingQueryType = {
  id: string;
  userId: string | null;
  userName: string;
  userEmail: string;
  phone: string;
  interest: string;
  message: string;
  status: "pending" | "contacted" | "resolved";
  createdAt?: { seconds: number };
  updatedAt?: { seconds: number };
};

export default function AdminCounsellingPage() {
  const { user, loading: userLoading, isAdmin } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: allQueries, loading: queriesLoading } = useCollection<CounsellingQueryType>("counsellingQueries");

  const handleUpdateStatus = async (queryId: string, status: "pending" | "contacted" | "resolved") => {
    if (!firestore || !isAdmin) return;

    try {
      const docRef = doc(firestore, "counsellingQueries", queryId);
      await updateDoc(docRef, {
        status,
        updatedAt: serverTimestamp(),
      });
      toast({
        title: "Status Updated",
        description: `Lead status has been changed to ${status}.`,
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to update lead status.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteQuery = async (queryId: string) => {
    if (!firestore || !isAdmin) return;
    if (!confirm("Are you sure you want to delete this counselling lead?")) return;

    try {
      const docRef = doc(firestore, "counsellingQueries", queryId);
      await deleteDoc(docRef);
      toast({
        title: "Lead Deleted",
        description: "Counselling query has been deleted successfully.",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to delete lead.",
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

  if (!isAdmin) {
    return (
      <div className="text-center py-20 flex flex-col items-center">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground mt-2">Only administrators can access this portal.</p>
        <Button className="mt-6" onClick={() => router.push("/")}>Go Home</Button>
      </div>
    );
  }

  const filteredQueries = allQueries
    ?.filter((q) =>
      (q.userName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (q.userEmail?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (q.phone?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (q.interest?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (q.message?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    }) || [];

  const pendingCount = filteredQueries.filter((q) => q.status === "pending").length;
  const contactedCount = filteredQueries.filter((q) => q.status === "contacted").length;
  const resolvedCount = filteredQueries.filter((q) => q.status === "resolved").length;

  return (
    <div className="space-y-8 pb-10">
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-primary flex items-center gap-2">
            <MessageSquareHeart className="w-8 h-8 text-primary" />
            Counselling & Mentorship Leads
          </h1>
          <p className="text-muted-foreground">
            Admin Portal: Manage student counselling inquiries, track callback statuses, and start direct conversations.
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by student, phone, stream..."
            className="pl-9 font-semibold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </section>

      {/* Metrics overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-2 border-yellow-200/50 bg-yellow-50/5 relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black text-yellow-600 uppercase tracking-wider">Pending Action</CardTitle>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold">{pendingCount}</span>
              <span className="text-xs text-muted-foreground">queries</span>
            </div>
          </CardHeader>
        </Card>
        <Card className="border-2 border-blue-200/50 bg-blue-50/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black text-blue-600 uppercase tracking-wider">Currently Contacted</CardTitle>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold">{contactedCount}</span>
              <span className="text-xs text-muted-foreground">queries</span>
            </div>
          </CardHeader>
        </Card>
        <Card className="border-2 border-green-200/50 bg-green-50/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black text-green-600 uppercase tracking-wider">Resolved Leads</CardTitle>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold">{resolvedCount}</span>
              <span className="text-xs text-muted-foreground">queries</span>
            </div>
          </CardHeader>
        </Card>
      </div>

      <Card className="shadow-lg border-2 border-primary/10">
        <CardHeader>
          <CardTitle>Mentorship Inquiries ({filteredQueries.length})</CardTitle>
          <CardDescription>Click WhatsApp or Call to get in touch with students immediately.</CardDescription>
        </CardHeader>
        <CardContent>
          {queriesLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredQueries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground italic font-semibold">No counselling queries found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Student Info</TableHead>
                  <TableHead>Counselling Stream</TableHead>
                  <TableHead>Student Message</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Direct Contact Action</TableHead>
                  <TableHead>Admin Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQueries.map((query) => {
                  const dateStr = query.createdAt?.seconds
                    ? format(new Date(query.createdAt.seconds * 1000), "MMM d, HH:mm")
                    : "N/A";

                  // Clean Indian number formatting
                  let waPhone = query.phone.replace(/\D/g, "");
                  if (waPhone.length === 10) waPhone = "91" + waPhone;

                  const waText = encodeURIComponent(
                    `Hello ${query.userName},\nThis is from VidyaHeist Counselling support. We received your request regarding ${query.interest}. Let me know a convenient time to schedule a call.`
                  );
                  const waUrl = `https://wa.me/${waPhone}?text=${waText}`;

                  return (
                    <TableRow key={query.id} className={query.status === "pending" ? "bg-yellow-500/[0.02]" : ""}>
                      <TableCell className="text-xs font-bold text-muted-foreground">{dateStr}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-extrabold text-sm text-foreground">{query.userName}</span>
                          <span className="text-[11px] text-muted-foreground">{query.userEmail}</span>
                          <span className="text-[11px] text-primary font-black mt-0.5">{query.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="px-2.5 py-1 rounded bg-primary/10 text-primary text-xs font-black uppercase">
                          {query.interest}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[220px] text-xs font-semibold leading-relaxed text-muted-foreground whitespace-pre-wrap">
                        {query.message}
                      </TableCell>
                      <TableCell>
                        <select
                          value={query.status}
                          onChange={(e) => handleUpdateStatus(query.id, e.target.value as any)}
                          className={`text-xs font-bold px-2.5 py-1 rounded-full cursor-pointer focus:outline-none border ${
                            query.status === "pending"
                              ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                              : query.status === "contacted"
                              ? "bg-blue-100 text-blue-800 border-blue-300"
                              : "bg-green-100 text-green-800 border-green-300"
                          }`}
                        >
                          <option value="pending">PENDING</option>
                          <option value="contacted">CONTACTED</option>
                          <option value="resolved">RESOLVED</option>
                        </select>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {/* Call Option */}
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs font-bold gap-1 h-8 px-2.5 rounded-lg border-primary/30 text-primary hover:bg-primary/5"
                            onClick={() => window.open(`tel:${query.phone}`)}
                          >
                            <Phone className="w-3.5 h-3.5" /> Call
                          </Button>
                          {/* WhatsApp Option */}
                          <Button
                            variant="default"
                            size="sm"
                            className="text-xs font-black gap-1 h-8 px-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white shadow-sm"
                            onClick={() => window.open(waUrl, "_blank")}
                          >
                            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                          onClick={() => handleDeleteQuery(query.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
