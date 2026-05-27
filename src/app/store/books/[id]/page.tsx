"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser, useFirestore, useCollection, useCollectionQuery } from "@/firebase";
import type { BookType, BookOrderType } from "@/lib/types";
import { doc, getDoc } from "firebase/firestore";
import { Loader2, ShieldAlert, ArrowLeft, BookOpen, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function BookReaderPage() {
  const params = useParams();
  const id = params.id as string;
  const { user, loading: userLoading, isAdmin } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const [book, setBook] = useState<BookType | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  const { data: bookOrders } = useCollectionQuery<BookOrderType>("bookOrders", "userId", "==", user?.uid || null);

  useEffect(() => {
    if (!firestore || userLoading) return;

    const checkAccessAndFetchBook = async () => {
      setLoading(true);
      try {
        const bookDocRef = doc(firestore, "books", id);
        const bookDoc = await getDoc(bookDocRef);

        if (!bookDoc.exists()) {
          setLoading(false);
          return;
        }

        const bookData = { ...bookDoc.data(), id: bookDoc.id } as BookType;
        setBook(bookData);

        const isFree = bookData.price === 0;
        const isVerifiedPurchaser = bookOrders?.some(
          (o) => o.bookId === id && o.userId === user?.uid && o.status === "verified"
        );

        if (isFree || isVerifiedPurchaser || isAdmin) {
          setAuthorized(true);
        } else {
          setAuthorized(false);
        }
      } catch (err) {
        console.error("Error loading book:", err);
      } finally {
        setLoading(false);
      }
    };

    checkAccessAndFetchBook();
  }, [firestore, id, user, userLoading, bookOrders, isAdmin]);

  // Prevent print screen, developer tools, copy, select, print
  useEffect(() => {
    if (!authorized) return;

    // Block right click / context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Block keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent Print (Ctrl+P)
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault();
        alert("Printing is strictly disabled to protect authors' intellectual property.");
      }
      // Prevent Save (Ctrl+S)
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
      }
      // Prevent Copy (Ctrl+C)
      if ((e.ctrlKey || e.metaKey) && e.key === "c") {
        e.preventDefault();
      }
      // Prevent Inspect (Ctrl+Shift+I / F12)
      if (e.key === "F12" || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "i")) {
        e.preventDefault();
      }
    };

    // Detect Printscreen Key and Clear Clipboard (if possible)
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        navigator.clipboard.writeText("");
        alert("Screenshots are blocked.");
      }
    };

    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [authorized]);

  if (userLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground font-semibold mt-4">Loading secure reader...</p>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="text-center py-20 flex flex-col items-center max-w-md mx-auto">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold">Book Not Found</h1>
        <p className="text-muted-foreground mt-2">The module or book you are looking for does not exist.</p>
        <Button className="mt-6" onClick={() => router.push("/store")}>Return to Store</Button>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="text-center py-20 flex flex-col items-center max-w-lg mx-auto bg-destructive/5 rounded-3xl border-2 border-destructive/20 p-8 shadow-lg">
        <ShieldAlert className="h-20 w-20 text-destructive mb-4 animate-bounce" />
        <h1 className="text-3xl font-black text-destructive">Secure Content Locked</h1>
        <p className="text-muted-foreground font-semibold mt-4">
          This study book is a premium intellectual property of Vidyaheist. You must purchase this module before reading it on screen.
        </p>
        <div className="flex gap-4 mt-8">
          <Button asChild variant="outline">
            <Link href="/store">Back to Store</Link>
          </Button>
          <Button onClick={() => router.push("/store")}>Purchase Now</Button>
        </div>
      </div>
    );
  }

  const watermarkText = user ? `${user.displayName || "Aspirant"} (${user.email})` : "SECURED BY VIDYAHEIST";

  return (
    <div className={`space-y-6 mx-auto relative select-none ${book.pdfUrl ? "max-w-6xl w-full" : "max-w-4xl"}`}>
      {/* Print protection stylesheet */}
      <style jsx global>{`
        @media print {
          body {
            display: none !important;
          }
        }
        .unselectable {
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          -khtml-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
      `}</style>

      {/* Floating Watermark pattern to prevent screenshotting */}
      <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden opacity-[0.03] select-none flex flex-wrap gap-x-20 gap-y-24 items-center justify-around">
        {Array.from({ length: 48 }).map((_, i) => (
          <div key={i} className="text-sm font-black tracking-widest text-primary uppercase rotate-12 whitespace-nowrap">
            {watermarkText}
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center pb-4 border-b">
        <Button asChild variant="ghost" className="gap-2">
          <Link href="/store">
            <ArrowLeft className="w-5 h-5" /> Back to Store
          </Link>
        </Button>
        <div className="flex items-center gap-2 text-xs font-black text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-500/25">
          <Shield className="w-3.5 h-3.5" /> SECURE SCREEN READER ACTIVE
        </div>
      </div>

      <div className={`hybrid-clay-card relative overflow-hidden bg-card/90 ${book.pdfUrl ? "p-1 sm:p-4 md:p-8" : "p-8 md:p-12"}`}>
        <div className={`mb-8 pb-6 border-b ${book.pdfUrl ? "px-3 pt-3 md:px-0 md:pt-0" : ""}`}>
          <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary mb-4 w-fit">
            <BookOpen className="h-3.5 w-3.5" />
            <span>{book.subject}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground">{book.name}</h1>
          <p className="text-muted-foreground mt-2 font-medium italic">{book.description}</p>
        </div>

        {/* SECURED READING CONTAINER */}
        <div className="unselectable prose prose-blue max-w-none text-foreground leading-relaxed font-medium space-y-6 text-[17px]">
          {book.pdfUrl ? (
            <div className="w-full rounded-2xl overflow-hidden border shadow-xl bg-slate-900 p-1">
              <iframe
                src={`https://docs.google.com/viewer?url=${encodeURIComponent(book.pdfUrl)}&embedded=true`}
                className="w-full h-[600px] md:h-[850px] rounded-xl bg-white border-none"
                title="Secure Study Material Viewer"
              />
            </div>
          ) : book.content ? (
            book.content.split("\n\n").map((para, i) => (
              <p key={i} className="leading-relaxed">
                {para}
              </p>
            ))
          ) : (
            <p className="text-muted-foreground italic">No secure modules or PDFs are currently uploaded for this book.</p>
          )}
        </div>
      </div>
    </div>
  );
}
