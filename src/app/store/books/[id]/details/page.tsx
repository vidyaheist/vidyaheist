"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser, useFirestore, useCollectionQuery } from "@/firebase";
import type { BookType, BookOrderType } from "@/lib/types";
import { doc, getDoc, collection, addDoc, getDocs, query, orderBy, serverTimestamp } from "firebase/firestore";
import { Loader2, ArrowLeft, Star, ShoppingBag, Share2, Award, BookOpen, Layers, MessageSquare, Sparkles, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/providers/CartProvider";

type ReviewType = {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt?: { seconds: number };
};

export default function BookDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const { user, loading: userLoading, isAdmin } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const { addToCart, isInCart } = useCart();

  const [book, setBook] = useState<BookType | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<ReviewType[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  // Review Form state
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const { data: bookOrders } = useCollectionQuery<BookOrderType>("bookOrders", "userId", "==", user?.uid || null);

  const isBought = bookOrders?.some((o) => o.bookId === id && o.status === "verified") || isAdmin;
  const isPending = bookOrders?.some((o) => o.bookId === id && o.status === "pending");

  useEffect(() => {
    if (!firestore || userLoading) return;

    const fetchBookAndReviews = async () => {
      setLoading(true);
      try {
        // Fetch Book Details
        const bookDocRef = doc(firestore, "books", id);
        const bookDoc = await getDoc(bookDocRef);

        if (!bookDoc.exists()) {
          setBook(null);
          setLoading(false);
          return;
        }

        const bookData = { ...bookDoc.data(), id: bookDoc.id } as BookType;
        setBook(bookData);

        // Fetch Reviews
        setReviewsLoading(true);
        const reviewsRef = collection(firestore, "books", id, "reviews");
        const reviewsQuery = query(reviewsRef, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(reviewsQuery);
        const reviewsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ReviewType[];
        setReviews(reviewsData);
      } catch (err) {
        console.error("Error loading product details:", err);
      } finally {
        setLoading(false);
        setReviewsLoading(false);
      }
    };

    fetchBookAndReviews();
  }, [firestore, id, userLoading]);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied!",
        description: "Book details URL copied to clipboard. Share it with your friends!",
      });
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user || !book) return;

    if (!comment.trim()) {
      toast({
        title: "Comment Required",
        description: "Please enter a comment for your review.",
        variant: "destructive",
      });
      return;
    }

    setSubmittingReview(true);

    try {
      const reviewRef = collection(firestore, "books", id, "reviews");
      await addDoc(reviewRef, {
        userId: user.uid,
        userName: user.displayName || user.email?.split("@")[0] || "Verified Buyer",
        rating,
        comment,
        createdAt: serverTimestamp(),
      });

      toast({
        title: "Review Published!",
        description: "Thank you for sharing your feedback with other aspirants!",
      });

      // Reset
      setComment("");
      setRating(5);
      setReviewDialogOpen(false);

      // Reload reviews
      const snapshot = await getDocs(query(reviewRef, orderBy("createdAt", "desc")));
      setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as ReviewType));

    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to publish review.",
        variant: "destructive",
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  if (userLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground font-semibold">Loading book details...</p>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="text-center py-20 flex flex-col items-center max-w-md mx-auto">
        <ArrowLeft className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold">Book Not Found</h1>
        <Button className="mt-6" onClick={() => router.push("/store")}>Back to Store</Button>
      </div>
    );
  }

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
    : "5.0";

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-16 px-4">
      {/* Navigation */}
      <div className="flex justify-between items-center pb-4 border-b border-primary/10">
        <Button asChild variant="ghost" className="gap-2 text-muted-foreground font-bold">
          <Link href="/store">
            <ArrowLeft className="w-5 h-5" /> Back to Store
          </Link>
        </Button>
        <Button onClick={handleShare} variant="outline" className="rounded-full gap-2 border-primary/20 text-primary font-bold">
          <Share2 className="w-4 h-4" /> Share Book
        </Button>
      </div>

      {/* Main product display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Cover image & interactive preview */}
        <div className="lg:col-span-5 space-y-6">
          <div className="hybrid-clay-card p-4 aspect-[3/4] relative overflow-hidden flex items-center justify-center bg-muted/20">
            <Image
              src={book.imageUrl || "https://picsum.photos/seed/book/600/400"}
              alt={book.name}
              fill
              className="object-cover rounded-[18px]"
            />
          </div>

          {/* Secure interactive preview warning */}
          <div className="bg-primary/5 border border-primary/10 p-5 rounded-3xl space-y-3 shadow-inner">
            <h4 className="font-extrabold text-sm text-primary flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 animate-pulse" /> Free Content Preview Page
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
              Get an instant preview of the book. Buy to unlock the complete study module with high-resolution equations and notes.
            </p>
          </div>
        </div>

        {/* Product specs & buying center */}
        <div className="lg:col-span-7 space-y-8">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-primary/10 text-primary text-xs font-black px-3 py-1 rounded-full uppercase">
                {book.subject}
              </span>
              <div className="flex items-center text-yellow-500 font-extrabold text-sm gap-1 ml-2">
                <Star className="w-4 h-4 fill-current" />
                <span>{averageRating}</span>
                <span className="text-muted-foreground font-medium text-xs">({reviews.length} reviews)</span>
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight leading-none">
              {book.name}
            </h1>
            
            <p className="text-2xl font-black text-primary">₹{book.price === 0 ? "FREE" : book.price}</p>
          </div>

          <div className="border-y border-primary/10 py-6 space-y-4">
            <h3 className="font-black text-base text-foreground">Book Description</h3>
            <p className="text-muted-foreground text-sm leading-relaxed font-semibold whitespace-pre-line">
              {book.description || "No description provided for this study guide."}
            </p>
          </div>

          {/* Book Specifications */}
          <div className="grid grid-cols-2 gap-4 text-xs font-bold bg-muted/10 p-5 rounded-3xl border border-primary/5">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <div>
                <p className="text-muted-foreground font-medium text-[10px]">Format</p>
                <p className="text-foreground">Secure PDF + Offline shipping copy</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" />
              <div>
                <p className="text-muted-foreground font-medium text-[10px]">Subject Stream</p>
                <p className="text-foreground">{book.subject}</p>
              </div>
            </div>
          </div>

          {/* Buy Call-to-action bar */}
          <div className="pt-2">
            {book.price === 0 || isBought ? (
              <Button asChild size="lg" className="w-full sm:w-auto rounded-full px-12 py-7 font-black text-base shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:scale-102 transition-transform">
                <Link href={`/store/books/${book.id}`}>
                  <BookOpen className="mr-2 w-5 h-5" /> Start Reading Secure Material
                </Link>
              </Button>
            ) : isPending ? (
              <Button disabled size="lg" className="w-full sm:w-auto rounded-full px-12 py-7 font-extrabold text-base opacity-75">
                Pending Verification
              </Button>
            ) : isInCart(book.id) ? (
              <Button asChild size="lg" className="w-full sm:w-auto rounded-full px-12 py-7 font-black text-base shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-green-600 hover:bg-green-700 text-white hover:scale-102 transition-transform">
                <Link href="/store/cart">
                  <ShoppingCart className="mr-2 w-5 h-5" /> Go to Shopping Cart
                </Link>
              </Button>
            ) : (
              <Button
                onClick={() => addToCart(book)}
                size="lg"
                className="w-full sm:w-auto rounded-full px-12 py-7 font-black text-base shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-primary text-primary-foreground hover:scale-102 transition-transform animate-fade-in"
              >
                <ShoppingBag className="mr-2 w-5 h-5" /> Add Study Book to Cart
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* PDF preview container */}
      {book.pdfUrl && (
        <section className="space-y-6 pt-6 border-t border-primary/10">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black text-foreground flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              First Pages Preview (Interactive)
            </h3>
            <span className="text-xs bg-green-50 text-green-700 font-extrabold px-3 py-1.5 rounded-full border border-green-500/20">
              SECURED PREVIEW ONLY
            </span>
          </div>
          <div className="w-full rounded-3xl overflow-hidden border shadow-xl bg-slate-900 p-1.5">
            <iframe
              src={`https://docs.google.com/viewer?url=${encodeURIComponent(book.pdfUrl)}&embedded=true`}
              className="w-full h-[500px] md:h-[700px] rounded-2xl bg-white border-none"
              title="Secure Free Book Preview"
            />
          </div>
        </section>
      )}

      {/* Verified Reviews Section */}
      <section className="space-y-8 pt-8 border-t border-primary/10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-xl font-black text-foreground flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Verified Student Reviews
            </h3>
            <p className="text-xs text-muted-foreground font-semibold mt-1">
              Read real, authenticated feedback from students studying with VidyaHeist modules.
            </p>
          </div>

          {isBought && (
            <Button onClick={() => setReviewDialogOpen(true)} variant="outline" className="rounded-full gap-1.5 font-bold border-primary/20 text-primary">
              <Star className="w-4 h-4" /> Write a Review
            </Button>
          )}
        </div>

        {reviewsLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-muted/10 border-2 border-dashed border-muted/50 p-12 rounded-3xl text-center">
            <p className="text-muted-foreground font-semibold italic text-sm">
              No reviews have been written for this module yet. {isBought ? "Be the first to leave a review!" : ""}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviews.map((r) => (
              <div key={r.id} className="bg-background border border-primary/10 p-6 rounded-3xl space-y-3 relative shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-extrabold text-sm text-foreground">{r.userName}</h5>
                    <span className="text-[10px] text-muted-foreground font-semibold">Verified Student</span>
                  </div>
                  <div className="flex gap-0.5 text-yellow-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? "fill-current" : "text-muted/40"}`} />
                    ))}
                  </div>
                </div>
                <p className="text-xs font-semibold leading-relaxed text-muted-foreground whitespace-pre-line italic">
                  "{r.comment}"
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="rounded-3xl max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-primary">Write a Verified Review</DialogTitle>
            <DialogDescription className="text-xs font-semibold">
              Share your exam preparation experience using this VidyaHeist study material.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReviewSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="font-bold text-xs">Rating Stars</Label>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="text-yellow-500 transition-transform active:scale-90"
                  >
                    <Star className={`w-8 h-8 ${star <= rating ? "fill-current" : "text-muted"}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="review-comment" className="font-bold text-xs">Your Feedback Message</Label>
              <Textarea
                id="review-comment"
                placeholder="What did you like about this study book? Does it cover equations and practice questions well?"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                required
                className="rounded-2xl border-2"
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="submit" disabled={submittingReview} className="w-full rounded-full font-black py-5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-primary text-primary-foreground">
                {submittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : "Publish Review"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
