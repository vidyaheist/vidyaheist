
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useUser, useFirestore } from "@/firebase";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { doc, getDoc, collection, getDocs, updateDoc, deleteDoc, writeBatch, serverTimestamp } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldAlert, Trash2, Edit, Check, X, PlusCircle } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { TestSeriesFullType, AdminQuestionType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ADMIN_EMAIL } from "@/lib/constants";

const testSeriesSchema = z.object({
  name: z.string().min(5, { message: "Course name must be at least 5 characters." }),
  description: z.string().optional(),
  price: z.coerce.number().min(0, { message: "Price must be a positive number or zero." }),
  subject: z.string().min(3, { message: "Exam category is required." }),
  numberOfTests: z.coerce.number().optional().nullable(),
  durationPerTest: z.coerce.number().optional().nullable(),
  imageUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  data_ai_hint: z.string().optional().nullable(),
});
type TestSeriesFormValues = z.infer<typeof testSeriesSchema>;

const questionOptionEditSchema = z.object({
  id: z.string(),
  text: z.string().min(1, { message: "Option text cannot be empty." }),
});

const questionEditSchema = z.object({
  text: z.string().min(10, { message: "Question text must be at least 10 characters." }),
  topic: z.string().optional(),
  subject: z.string().optional(),
  options: z.array(questionOptionEditSchema).min(2, "At least two options are required."),
  correctOptionId: z.string().min(1, "Please select a correct option."),
});
type QuestionEditFormValues = z.infer<typeof questionEditSchema>;


interface QuestionEditFormProps {
  questionData: AdminQuestionType;
  onSave: (data: QuestionEditFormValues) => Promise<void>;
  onCancel: () => void;
  formInstance: ReturnType<typeof useForm<QuestionEditFormValues>>;
}

function QuestionEditForm({ questionData, onSave, onCancel, formInstance }: QuestionEditFormProps) {
  const { toast } = useToast();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting },
  } = formInstance;

  const { fields } = useFieldArray({
    control,
    name: "options",
  });

  const watchedOptions = watch("options");
  const watchedCorrectOptionId = watch("correctOptionId");

  const onSubmit = async (data: QuestionEditFormValues) => {
    if (!data.options.find(opt => opt.id === data.correctOptionId)) {
        toast({
            title: "Invalid Correct Option",
            description: "The selected correct option does not exist among the provided options.",
            variant: "destructive",
        });
        return;
    }
    await onSave(data);
  };

  return (
    <Form {...formInstance}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-4 border rounded-lg shadow-md bg-background">
        <FormField
          control={control}
          name="text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Question Text</FormLabel>
              <FormControl>
                <Textarea {...field} rows={4} placeholder="Enter the full question text..." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="topic"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Topic (Optional)</FormLabel>
                <FormControl><Input {...field} placeholder="e.g., Kinematics" /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subject (Optional)</FormLabel>
                <FormControl><Input {...field} placeholder="e.g., Physics" /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormItem>
            <FormLabel>Options & Correct Answer</FormLabel>
            <RadioGroup
                value={watchedCorrectOptionId}
                onValueChange={(value) => setValue("correctOptionId", value, { shouldValidate: true, shouldDirty: true })}
                className="space-y-3 mt-2"
            >
                {fields.map((item, index) => (
                <Card key={item.id} className={cn("p-3 flex items-center gap-3 transition-all", watchedCorrectOptionId === item.id && "bg-primary/10 ring-2 ring-primary")}>
                    <FormControl>
                        <RadioGroupItem value={item.id} id={`edit-option-${item.id}`} />
                    </FormControl>
                    <div className="flex-grow">
                    <FormField
                        control={control}
                        name={`options.${index}.text`}
                        render={({ field: optionTextCtrl }) => (
                        <FormItem className="w-full">
                            <FormControl>
                            <Input {...optionTextCtrl} placeholder={`Option ${index + 1} text`} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    </div>
                </Card>
                ))}
            </RadioGroup>
        </FormItem>

        <div className="flex justify-end space-x-3">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            <X className="mr-2 h-4 w-4" /> Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4"/>}
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}


export default function EditQuizPage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [testSeriesData, setTestSeriesData] = useState<TestSeriesFullType | null>(null);
  const [isDeletingSeries, setIsDeletingSeries] = useState(false);
  
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [currentEditingQuestionData, setCurrentEditingQuestionData] = useState<AdminQuestionType | null>(null);


  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const seriesId = params.id as string;

  const testSeriesEditForm = useForm<TestSeriesFormValues>({
    resolver: zodResolver(testSeriesSchema),
  });

  const questionEditForm = useForm<QuestionEditFormValues>({
    resolver: zodResolver(questionEditSchema),
    defaultValues: {
        text: "",
        topic: "",
        subject: "",
        options: [],
        correctOptionId: ""
    }
  });


  const fetchTestSeriesAndQuestions = useCallback(async (id: string) => {
    if (!firestore) return;
    setLoading(true);
    try {
      const seriesDocRef = doc(firestore, "testSeries", id);
      const seriesSnap = await getDoc(seriesDocRef);

      if (!seriesSnap.exists()) throw new Error("Course not found.");
      
      const seriesData = { id: seriesSnap.id, ...seriesSnap.data() } as TestSeriesFullType;

      const questionsQuery = collection(firestore, "testSeries", id, "questions");
      const questionsSnap = await getDocs(questionsQuery);
      const questionsData = questionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminQuestionType));

      seriesData.questions = questionsData;
      
      setTestSeriesData(seriesData);

      testSeriesEditForm.reset({
        name: seriesData.name || "",
        description: seriesData.description || "",
        price: seriesData.price || 0,
        subject: seriesData.subject || "",
        numberOfTests: seriesData.numberOfTests === null ? undefined : seriesData.numberOfTests,
        durationPerTest: seriesData.durationPerTest === null ? undefined : seriesData.durationPerTest,
        imageUrl: seriesData.imageUrl || "",
        data_ai_hint: seriesData.data_ai_hint || "",
      });

    } catch (error: any) {
      console.error("Error fetching course details:", error);
      toast({ title: "Error", description: "Failed to load course data.", variant: "destructive" });
      router.push("/store"); 
    } finally {
        setLoading(false);
    }
  }, [firestore, testSeriesEditForm, router, toast]);


  useEffect(() => {
    if (!userLoading) {
      if (!user) {
        router.push("/login");
        return;
      }
      if (user.email === ADMIN_EMAIL) {
        setIsAdmin(true);
        if (seriesId) {
          fetchTestSeriesAndQuestions(seriesId);
        }
      } else {
        setIsAdmin(false);
      }
    }
  }, [user, userLoading, seriesId, fetchTestSeriesAndQuestions, router]);


  async function onTestSeriesUpdate(data: TestSeriesFormValues) {
    if (!user || !isAdmin || !seriesId || !firestore) {
      toast({ title: "Error", description: "Admin authentication required.", variant: "destructive" });
      return;
    }
    try {
      const seriesDocRef = doc(firestore, "testSeries", seriesId);
      await updateDoc(seriesDocRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });

      toast({ title: "Success", description: `Course "${data.name}" updated successfully!` });
    } catch (error: any) {
      console.error("Error updating course:", error);
      toast({ title: "Error", description: error.message || "Failed to update course.", variant: "destructive" });
    }
  }

  async function handleDeleteTestSeries() {
    if (!seriesId || !isAdmin || !firestore) {
        toast({ title: "Error", description: "Cannot delete course.", variant: "destructive" });
        return;
    }
    setIsDeletingSeries(true);
    try {
        const seriesDocRef = doc(firestore, "testSeries", seriesId);
        const questionsQuery = collection(firestore, "testSeries", seriesId, "questions");
        const questionsSnap = await getDocs(questionsQuery);
        const batch = writeBatch(firestore);
        questionsSnap.docs.forEach(qDoc => {
            batch.delete(qDoc.ref);
        });
        await batch.commit();

        await deleteDoc(seriesDocRef);

        toast({ title: "Success", description: "Course deleted successfully." });
        router.push("/store");
    } catch (error: any) {
        console.error("Error deleting course:", error);
        toast({ title: "Error", description: error.message || "Failed to delete course.", variant: "destructive" });
    } finally {
        setIsDeletingSeries(false);
    }
  }

  const handleEditQuestionClick = (question: AdminQuestionType) => {
    setEditingQuestionId(question.id);
    setCurrentEditingQuestionData(question);
    questionEditForm.reset({
      text: question.text,
      topic: question.topic || "",
      subject: question.subject || testSeriesData?.subject || "",
      options: question.options.map(opt => ({ text: opt.text, id: opt.id })),
      correctOptionId: question.correctAnswerId || "",
    });
  };

  const handleCancelEditQuestion = () => {
    setEditingQuestionId(null);
    setCurrentEditingQuestionData(null);
    questionEditForm.reset();
  };

  const handleSaveEditedQuestion = async (formData: QuestionEditFormValues) => {
    if (!editingQuestionId || !currentEditingQuestionData || !firestore) return;

    try {
      const questionDocRef = doc(firestore, "testSeries", seriesId, "questions", editingQuestionId);
      
      await updateDoc(questionDocRef, {
        text: formData.text,
        topic: formData.topic || null,
        subject: formData.subject || null,
        options: formData.options,
        correctOptionId: formData.correctOptionId,
        updatedAt: serverTimestamp(),
      });

      toast({ title: "Success", description: "Question updated successfully." });
      setEditingQuestionId(null);
      setCurrentEditingQuestionData(null);
      await fetchTestSeriesAndQuestions(seriesId);
    } catch (error: any) {
      console.error("Error updating question:", error);
      toast({ title: "Error updating question", description: error.message, variant: "destructive" });
    }
  };
  
  const handleDeleteQuestion = async (questionId: string) => {
    if (!isAdmin || !firestore) {
        toast({title: "Error", description: "Unauthorized action.", variant: "destructive"});
        return;
    }
    try {
        const questionDocRef = doc(firestore, "testSeries", seriesId, "questions", questionId);
        await deleteDoc(questionDocRef);
        toast({title: "Success", description: "Question deleted successfully."});
        setTestSeriesData(prev => prev ? ({
            ...prev,
            questions: prev.questions?.filter(q => q.id !== questionId) || []
        }) : null);
    } catch (error: any) {
        console.error("Error deleting question:", error);
        toast({title: "Error", description: error.message || "Failed to delete question.", variant: "destructive"});
    }
  };


  if (loading || isAdmin === null || userLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Verifying access...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center">
        <Card className="max-w-md p-8 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-destructive flex items-center justify-center">
              <ShieldAlert className="mr-2 h-8 w-8" /> Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              You do not have permission to access this page.
            </p>
            <Button onClick={() => router.push("/")}>Go to Homepage</Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!testSeriesData && !loading) {
     return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)]">
        <ShieldAlert className="h-12 w-12 text-destructive mb-4" />
        <p className="text-xl text-destructive mb-2">Course Not Found</p>
        <p className="text-muted-foreground mb-6">The requested course could not be loaded or does not exist.</p>
        <Button onClick={() => router.push("/store")} variant="outline">Back to Courses</Button>
      </div>
    );
  }
  
  if (!testSeriesData) {
     return (
      <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading course details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="text-center py-8 bg-primary/5 rounded-lg">
        <h1 className="text-4xl font-bold tracking-tight text-primary">Edit Course & Questions</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Modifying: {testSeriesData.name}
        </p>
      </section>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>Course Details</CardTitle>
          <CardDescription>Update the core information for this exam module.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...testSeriesEditForm}>
            <form onSubmit={testSeriesEditForm.handleSubmit(onTestSeriesUpdate)} className="space-y-6">
                <FormField
                  control={testSeriesEditForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course Name</FormLabel>
                      <FormControl><Input placeholder="e.g., IAT Mock Exam Pack" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={testSeriesEditForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl><Textarea placeholder="Course description..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={testSeriesEditForm.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (₹)</FormLabel>
                        <FormControl><Input type="number" placeholder="e.g., 499" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={testSeriesEditForm.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Exam Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select exam" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="IAT">IAT (IISER Aptitude Test)</SelectItem>
                            <SelectItem value="NEST">NEST (NISER/UM-DAE CEBS)</SelectItem>
                            <SelectItem value="General Aptitude">General Aptitude</SelectItem>
                            <SelectItem value="Other">Other (Specify)</SelectItem>
                          </SelectContent>
                        </Select>
                        {testSeriesEditForm.watch("subject") === "Other" && 
                          <FormField
                            control={testSeriesEditForm.control}
                            name="subject" 
                            render={({ field: otherField }) => (
                              <Input 
                                placeholder="Specify other exam" 
                                className="mt-2" 
                                {...otherField}
                                onChange={(e) => otherField.onChange(e.target.value)}
                              />
                            )}
                          />
                        }
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                    control={testSeriesEditForm.control}
                    name="numberOfTests"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Number of Tests (Optional)</FormLabel>
                        <FormControl><Input type="number" placeholder="e.g., 5" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={testSeriesEditForm.control}
                    name="durationPerTest"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Duration Per Test (mins, Optional)</FormLabel>
                        <FormControl><Input type="number" placeholder="e.g., 180" {...field} value={field.value ?? ''}  onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))}/></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                 <FormField
                    control={testSeriesEditForm.control}
                    name="imageUrl"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Image URL (Optional)</FormLabel>
                        <FormControl><Input type="url" placeholder="https://example.com/image.png" {...field} /></FormControl>
                        <FormDescription>Course banner image.</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={testSeriesEditForm.control}
                    name="data_ai_hint"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Image Placeholder Hint (Optional)</FormLabel>
                        <FormControl><Input placeholder="e.g., 'exam prep'" {...field} value={field.value ?? ''} /></FormControl>
                        <FormDescription>Keywords for AI image generation fallback.</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                />
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <Button type="submit" className="w-full sm:w-auto" disabled={testSeriesEditForm.formState.isSubmitting}>
                  {testSeriesEditForm.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Update Course Details
                </Button>

                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full sm:w-auto" disabled={isDeletingSeries}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            {isDeletingSeries ? 'Deleting...' : 'Delete Course'}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this course
                            and all its associated questions.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeletingSeries}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteTestSeries} disabled={isDeletingSeries} className="bg-destructive hover:bg-destructive/90">
                            {isDeletingSeries ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Yes, delete course
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Manage Questions ({testSeriesData.questions?.length || 0})</CardTitle>
            <Button variant="outline" onClick={() => router.push(`/admin/create-quiz?seriesId=${seriesId}&seriesName=${encodeURIComponent(testSeriesData.name)}&seriesSubject=${encodeURIComponent(testSeriesData.subject || "")}`)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Question
            </Button>
          </div>
          <CardDescription>Edit or delete questions for this exam.</CardDescription>
        </CardHeader>
        <CardContent>
          {testSeriesData.questions && testSeriesData.questions.length > 0 ? (
            <div className="mt-2 space-y-6">
              {testSeriesData.questions.map((q) => {
                const isCurrentlyEditingThisQuestion = editingQuestionId === q.id;
                return (
                <Card key={q.id} className="bg-background overflow-hidden">
                  <CardHeader className="bg-muted/30 p-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-grow">
                        <p className="font-semibold text-base text-primary">
                            {isCurrentlyEditingThisQuestion ? "Editing Question:" : `Q: ${q.text.substring(0,120)}${q.text.length > 120 ? "..." : ""}`}
                        </p>
                        {!isCurrentlyEditingThisQuestion && (
                            <>
                                {q.topic && <p className="text-xs text-muted-foreground mt-1">Topic: {q.topic}</p>}
                                {q.subject && <p className="text-xs text-muted-foreground">Subject: {q.subject}</p>}
                            </>
                        )}
                      </div>
                      <div className="flex-shrink-0 flex items-center space-x-2">
                        {!isCurrentlyEditingThisQuestion ? (
                          <>
                            <Button variant="outline" size="sm" onClick={() => handleEditQuestionClick(q)}>
                              <Edit className="mr-1.5 h-3.5 w-3.5" /> Edit
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete this question?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteQuestion(q.id)} className="bg-destructive hover:bg-destructive/90">
                                    Yes, delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </CardHeader>
                  
                  {isCurrentlyEditingThisQuestion && currentEditingQuestionData ? (
                    <CardContent className="p-4">
                      <QuestionEditForm
                        questionData={currentEditingQuestionData}
                        onSave={handleSaveEditedQuestion}
                        onCancel={handleCancelEditQuestion}
                        formInstance={questionEditForm}
                      />
                    </CardContent>
                  ) : (
                    <CardContent className="p-4">
                      <ul className="space-y-2 text-sm">
                        {q.options.map((opt) => (
                          <li key={opt.id} className={cn(
                            "flex items-center p-2 rounded-md border",
                            q.correctAnswerId === opt.id ? 'bg-green-100 dark:bg-green-800 border-green-500 font-semibold text-green-700 dark:text-green-200' : 'bg-muted/20 border-border'
                          )}>
                            {q.correctAnswerId === opt.id ? <Check className="mr-2 h-4 w-4 text-green-600" /> : <div className="mr-2 h-4 w-4"/> }
                            {opt.text}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  )}
                </Card>
              )})}
            </div>
          ) : (
            <p className="mt-4 text-muted-foreground text-center py-6">
              No questions have been added yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
