"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser, useFirestore, useCollection, useStorage } from "@/firebase";
import type { BookType } from "@/lib/types";
import { doc, setDoc, addDoc, collection, getDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Loader2, ShieldAlert, PlusCircle, Trash, Edit, CheckCircle, ArrowLeft, BookOpen, Upload, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";

function AdminBooksContent() {
  const { user, loading: userLoading, isAdmin } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const { toast } = useToast();

  const { data: allBooks, loading: booksLoading } = useCollection<BookType>("books");

  const storage = useStorage();
  const [bookName, setBookName] = useState("");
  const [bookDesc, setBookDesc] = useState("");
  const [bookSubject, setBookSubject] = useState("");
  const [bookImageUrl, setBookImageUrl] = useState("");
  const [bookPrice, setBookPrice] = useState("0");
  const [bookContent, setBookContent] = useState("");
  
  // Storage & Upload States
  const [imageUploading, setImageUploading] = useState(false);
  const [imageProgress, setImageProgress] = useState(0);
  const [pdfUrl, setPdfUrl] = useState("");
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);

  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !storage || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Cover images must be smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setImageUploading(true);
    setImageProgress(0);

    const storageRef = ref(storage, `books/covers/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const percent = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setImageProgress(percent);
      },
      (error) => {
        console.error("Cover upload error:", error);
        setImageUploading(false);
        toast({
          title: "Upload Failed",
          description: error.message,
          variant: "destructive",
        });
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        setImageUploading(false);
        setBookImageUrl(downloadURL);
        toast({
          title: "Cover Uploaded",
          description: "Book cover image successfully updated.",
        });
      }
    );
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !storage || !user) return;

    if (file.type !== "application/pdf") {
      toast({
        title: "Invalid File",
        description: "Please select a valid PDF document.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 30 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "PDF files must be smaller than 30MB.",
        variant: "destructive",
      });
      return;
    }

    setPdfUploading(true);
    setPdfProgress(0);

    const storageRef = ref(storage, `books/pdfs/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const percent = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setPdfProgress(percent);
      },
      (error) => {
        console.error("PDF upload error:", error);
        setPdfUploading(false);
        toast({
          title: "Upload Failed",
          description: error.message,
          variant: "destructive",
        });
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        setPdfUploading(false);
        setPdfUrl(downloadURL);
        toast({
          title: "PDF Uploaded",
          description: "Study PDF document successfully linked to this book.",
        });
      }
    );
  };

  useEffect(() => {
    if (!firestore || !editId) {
      setBookName("");
      setBookDesc("");
      setBookSubject("");
      setBookImageUrl("");
      setBookPrice("0");
      setBookContent("");
      setPdfUrl("");
      setIsEditing(false);
      return;
    }

    const loadEditBook = async () => {
      try {
        const docRef = doc(firestore, "books", editId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setBookName(data.name || "");
          setBookDesc(data.description || "");
          setBookSubject(data.subject || "");
          setBookImageUrl(data.imageUrl || "");
          setBookPrice(String(data.price || 0));
          setBookContent(data.content || "");
          setPdfUrl(data.pdfUrl || "");
          setIsEditing(true);
        }
      } catch (err) {
        console.error("Error loading book to edit:", err);
      }
    };

    loadEditBook();
  }, [firestore, editId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore) return;

    if (!bookName.trim() || !bookDesc.trim() || !bookSubject.trim() || (!bookContent.trim() && !pdfUrl)) {
      toast({
        title: "Fields Required",
        description: "Please provide either the secure book text contents OR upload a study PDF document.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const bookData = {
        name: bookName,
        description: bookDesc,
        subject: bookSubject,
        imageUrl: bookImageUrl || null,
        pdfUrl: pdfUrl || null,
        price: Number(bookPrice) || 0,
        content: bookContent,
        updatedAt: serverTimestamp(),
      };

      if (isEditing && editId) {
        const docRef = doc(firestore, "books", editId);
        await setDoc(docRef, bookData, { merge: true });
        toast({
          title: "Book Updated",
          description: "Your changes have been saved successfully.",
        });
      } else {
        await addDoc(collection(firestore, "books"), {
          ...bookData,
          createdAt: serverTimestamp(),
        });
        toast({
          title: "Book Added",
          description: "New study book has been listed in the store.",
        });
      }

      router.push("/admin/books");
      setBookName("");
      setBookDesc("");
      setBookSubject("");
      setBookImageUrl("");
      setBookPrice("0");
      setBookContent("");
      setPdfUrl("");
      setIsEditing(false);
    } catch (err) {
      console.error("Error saving book:", err);
      toast({
        title: "Error Saving Book",
        description: "Failed to list the study book. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!firestore) return;
    if (!confirm("Are you sure you want to delete this study book? This action cannot be undone.")) return;

    try {
      await deleteDoc(doc(firestore, "books", id));
      toast({
        title: "Book Deleted",
        description: "Book has been removed from store catalog.",
      });
    } catch (err) {
      console.error("Error deleting book:", err);
      toast({
        title: "Delete Failed",
        description: "Failed to delete from Firestore.",
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
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground mt-2">Only administrators can manage study books and store catalogs.</p>
        <Button className="mt-6" onClick={() => router.push("/")}>Go Home</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 justify-between">
        <div>
          <h1 className="text-3xl font-black text-primary">Manage Books & Modules</h1>
          <p className="text-muted-foreground">List, edit, or delete secure study books for aspirants.</p>
        </div>
        <Button asChild variant="ghost" className="gap-2">
          <Link href="/store">
            <ArrowLeft className="w-4 h-4" /> View Store
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Listing of Existing Books */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Catalog Listings</CardTitle>
              <CardDescription>All currently uploaded study books.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {booksLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : !allBooks?.length ? (
                <p className="text-sm text-muted-foreground text-center italic">No study books added yet.</p>
              ) : (
                allBooks.map((b) => (
                  <div key={b.id} className="flex justify-between items-center p-3.5 bg-secondary/50 rounded-xl border">
                    <div className="flex flex-col pr-4">
                      <span className="font-bold text-sm truncate max-w-[150px]">{b.name}</span>
                      <span className="text-[10px] text-primary font-black uppercase">{b.subject}</span>
                      <span className="text-[11px] text-muted-foreground mt-0.5">{b.price === 0 ? "Free" : `₹${b.price}`}</span>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-primary">
                        <Link href={`/admin/books?edit=${b.id}`}>
                          <Edit className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(b.id)}
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Creator / Editor Form */}
        <div className="lg:col-span-2">
          <Card className="shadow-lg border-2 border-primary/20">
            <CardHeader className="bg-primary/5 rounded-t-xl border-b pb-4">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                {isEditing ? "Edit Study Book details" : "Add New Study Book / Module"}
              </CardTitle>
              <CardDescription>
                Ensure pricing is 0 for free books, otherwise set premium amounts in INR.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="name">Book Title</Label>
                    <Input
                      id="name"
                      placeholder="e.g. Biology Masterclass (NEST 2026)"
                      value={bookName}
                      onChange={(e) => setBookName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="subject">Subject Area</Label>
                    <Input
                      id="subject"
                      placeholder="e.g. Biology, Physics, Chemistry"
                      value={bookSubject}
                      onChange={(e) => setBookSubject(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="price">INR Price (0 = Free)</Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="0"
                      value={bookPrice}
                      onChange={(e) => setBookPrice(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1 flex flex-col justify-end">
                    <Label className="mb-1">Book Cover Image</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Cover Image URL or upload..."
                        value={bookImageUrl}
                        onChange={(e) => setBookImageUrl(e.target.value)}
                        className="flex-1"
                      />
                      <label className="flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90 px-3 rounded-md cursor-pointer shrink-0 transition-colors">
                        <Upload className="w-4 h-4" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                          disabled={imageUploading}
                        />
                      </label>
                    </div>
                    {imageUploading && (
                      <div className="space-y-1 mt-1">
                        <Progress value={imageProgress} className="h-1" />
                        <span className="text-[10px] text-muted-foreground">Uploading cover... {Math.round(imageProgress)}%</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-secondary/20 p-4 rounded-xl border border-dashed border-primary/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      <Label className="font-bold text-sm">Upload Secure PDF Study Module (Optional)</Label>
                    </div>
                    {pdfUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10 h-7 text-xs font-bold"
                        onClick={() => setPdfUrl("")}
                      >
                        <X className="w-3.5 h-3.5 mr-1" /> Remove PDF
                      </Button>
                    )}
                  </div>
                  {pdfUrl ? (
                    <div className="bg-primary/5 p-3 rounded-lg border border-primary/10 flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-primary truncate max-w-md">
                        {pdfUrl}
                      </span>
                      <span className="text-[10px] bg-green-100 text-green-700 font-black uppercase px-2 py-0.5 rounded">
                        LINKED
                      </span>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-primary/15 rounded-lg bg-primary/[0.02] hover:bg-primary/[0.04] transition-all cursor-pointer">
                      <Upload className="w-6 h-6 text-primary mb-2" />
                      <span className="text-xs font-bold text-primary">Click to select and upload PDF</span>
                      <span className="text-[10px] text-muted-foreground mt-1">MAX. 30MB • PDF ONLY</span>
                      <input
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={handlePdfUpload}
                        disabled={pdfUploading}
                      />
                    </label>
                  )}
                  {pdfUploading && (
                    <div className="space-y-1">
                      <Progress value={pdfProgress} className="h-1.5" />
                      <span className="text-[11px] text-muted-foreground">Uploading study PDF... {Math.round(pdfProgress)}%</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="description">Short Description / Subtitle</Label>
                  <Textarea
                    id="description"
                    placeholder="Provide a high-yield caption of what is covered in this module..."
                    value={bookDesc}
                    onChange={(e) => setBookDesc(e.target.value)}
                    rows={2}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="content">Secure Book Contents (Optional if PDF is uploaded)</Label>
                  <Textarea
                    id="content"
                    placeholder="Write or copy-paste modules/chapters text contents here..."
                    value={bookContent}
                    onChange={(e) => setBookContent(e.target.value)}
                    rows={12}
                  />
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  {isEditing && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        router.push("/admin/books");
                      }}
                    >
                      Cancel Edit
                    </Button>
                  )}
                  <Button type="submit" disabled={submitting} className="font-extrabold px-8 rounded-full">
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                      </>
                    ) : isEditing ? (
                      "Save Book Changes"
                    ) : (
                      "List Secure Book"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function AdminBooksPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    }>
      <AdminBooksContent />
    </Suspense>
  );
}
