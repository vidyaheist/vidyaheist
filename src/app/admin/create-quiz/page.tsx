
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser, useFirestore } from "@/firebase";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
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
import { ChevronLeft } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldAlert, PlusCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { collection, addDoc, serverTimestamp, doc } from "firebase/firestore";
import { Suspense } from "react";
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

const optionSchema = z.object({
  text: z.string().min(1, { message: "Option text cannot be empty." }),
});

const questionSchema = z.object({
  topic: z.string().optional(),
  subject: z.string().optional(),
  options: z.array(optionSchema)
    .min(2, { message: "At least two options are required."})
    .max(5, { message: "Maximum of 5 options allowed."}),
  correctOptionIndex: z.coerce.number()
    .min(0, "Please select a correct option.")
    .max(4, "Invalid option index."),
});
type QuestionFormValues = z.infer<typeof questionSchema>;

function CreateQuizContent() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);

  const [createdTestSeriesId, setCreatedTestSeriesId] = useState<string | null>(null);
  const [createdTestSeriesName, setCreatedTestSeriesName] = useState<string | null>(null);
  const [questionsForCurrentSeries, setQuestionsForCurrentSeries] = useState<any[]>([]);
  
  const [debugQuestionText, setDebugQuestionText] = useState("");

  const qForm = useForm<QuestionFormValues>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      topic: "",
      subject: "", 
      options: [{ text: "" }, { text: "" }],
      correctOptionIndex: -1,
    },
  });


  useEffect(() => {
    if (!userLoading) {
      if (!user) {
        router.push("/login");
      } else {
        if (user.email === ADMIN_EMAIL) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      }
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    if (isMounted) {
      const seriesIdFromParams = searchParams.get('seriesId');
      const seriesNameFromParams = searchParams.get('seriesName');
      const seriesSubjectFromParams = searchParams.get('seriesSubject');

      if (seriesIdFromParams) {
        setCreatedTestSeriesId(seriesIdFromParams);
        setCreatedTestSeriesName(seriesNameFromParams);
        if(seriesSubjectFromParams) {
          qForm.setValue("subject", seriesSubjectFromParams);
        }
      }
    }
    if (isAdmin !== null) setLoading(false);
  }, [isMounted, searchParams, isAdmin, qForm]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const tsForm = useForm<TestSeriesFormValues>({
    resolver: zodResolver(testSeriesSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      subject: "",
      numberOfTests: undefined, 
      durationPerTest: undefined, 
      imageUrl: "",
      data_ai_hint: "",
    },
  });

  const { fields: optionFields, append: appendOption, remove: removeOption } = useFieldArray({
    control: qForm.control,
    name: "options",
  });

  async function onTestSeriesSubmit(data: TestSeriesFormValues) {
    if (!user || !isAdmin || !firestore) {
      toast({ title: "Error", description: "Admin authentication required.", variant: "destructive" });
      return;
    }
    try {
      const insertData = {
        name: data.name,
        description: data.description || null,
        price: data.price,
        subject: data.subject,
        numberOfTests: data.numberOfTests === null || data.numberOfTests === undefined ? null : Number(data.numberOfTests),
        durationPerTest: data.durationPerTest === null || data.durationPerTest === undefined ? null : Number(data.durationPerTest),
        imageUrl: data.imageUrl || null,
        data_ai_hint: data.data_ai_hint || null,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(firestore, "testSeries"), insertData);
      
      toast({ title: "Success", description: `Course "${data.name}" created successfully!` });
      setCreatedTestSeriesId(docRef.id);
      setCreatedTestSeriesName(data.name);
      qForm.setValue("subject", data.subject || ""); 
      tsForm.reset(); 
      setQuestionsForCurrentSeries([]); 
    } catch (error: any) {
      console.error("Error creating course:", error);
      toast({ title: "Error", description: error.message || "Failed to create course.", variant: "destructive" });
    }
  }

  async function onQuestionSubmit(data: QuestionFormValues) {
     if (!user || !isAdmin || !createdTestSeriesId || !firestore) {
      toast({ title: "Error", description: "Admin authentication required.", variant: "destructive" });
      return;
    }

    const questionTextToSave = debugQuestionText.trim();
    if (questionTextToSave.length < 10) {
        toast({ title: "Validation Error", description: "Question text must be at least 10 characters.", variant: "destructive" });
        return;
    }
    if (data.correctOptionIndex === -1 || data.correctOptionIndex === undefined) {
      qForm.setError("correctOptionIndex", { type: "manual", message: "Please select a correct option." });
      toast({ title: "Validation Error", description: "Please select a correct option.", variant: "destructive" });
      return;
    }
    for (const opt of data.options) {
      if (opt.text.trim() === "") {
        toast({ title: "Validation Error", description: "All option fields must be filled.", variant: "destructive" });
        return;
      }
    }


    try {
      const optionsWithIds = data.options.map(opt => ({ ...opt, id: doc(collection(firestore, '_')).id }));
      const correctOptionId = optionsWithIds[data.correctOptionIndex].id;

      const newQuestionData = {
          text: questionTextToSave,
          topic: data.topic || null,
          subject: data.subject || qForm.getValues("subject") || createdTestSeriesName || null, 
          createdBy: user.uid,
          options: optionsWithIds.map(({id, text}) => ({id, text})),
          correctAnswerId: correctOptionId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
      };
      
      const questionsCollectionRef = collection(firestore, "testSeries", createdTestSeriesId, "questions");
      const newQuestionRef = await addDoc(questionsCollectionRef, newQuestionData);
      
      toast({ title: "Success", description: "Question added successfully!" });
      setQuestionsForCurrentSeries(prev => [...prev, {id: newQuestionRef.id, text: newQuestionData.text}]);
      qForm.reset({ 
         topic: "",
         subject: qForm.getValues("subject"), 
         options: [{ text: "" }, { text: "" }],
         correctOptionIndex: -1,
      });
      setDebugQuestionText(""); 

    } catch (error: any) {
      console.error("Error creating question:", error);
      toast({ title: "Error", description: error.message || "Failed to create question.", variant: "destructive" });
    }
  }

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
              You do not have permission to access this page. This area is restricted to administrators only.
            </p>
            <Button onClick={() => router.push("/")}>Go to Homepage</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      {!createdTestSeriesId ? (
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>Step 1: Create Course</CardTitle>
            <CardDescription>
              Fill in the details below to create a new course/test series.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...tsForm}>
              <form onSubmit={tsForm.handleSubmit(onTestSeriesSubmit)} className="space-y-6">
                <FormField
                  control={tsForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course Name</FormLabel>
                      <FormControl><Input placeholder="e.g., NEST Full Syllabus Mock 1" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={tsForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl><Textarea placeholder="A brief description of the course content" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={tsForm.control}
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
                    control={tsForm.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Exam Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select exam (e.g., IAT, NEST)" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="IAT">IAT (IISER Aptitude Test)</SelectItem>
                            <SelectItem value="NEST">NEST (NISER/UM-DAE CEBS)</SelectItem>
                            <SelectItem value="General Aptitude">General Aptitude</SelectItem>
                            <SelectItem value="Other">Other (Specify)</SelectItem>
                          </SelectContent>
                        </Select>
                        {tsForm.watch("subject") === "Other" && 
                          <FormField
                            control={tsForm.control}
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
                    control={tsForm.control}
                    name="numberOfTests"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Number of Tests (Optional)</FormLabel>
                        <FormControl><Input type="number" placeholder="e.g., 5" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))}/></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={tsForm.control}
                    name="durationPerTest"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Duration Per Test (mins, Optional)</FormLabel>
                        <FormControl><Input type="number" placeholder="e.g., 180" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                 <FormField
                    control={tsForm.control}
                    name="imageUrl"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Image URL (Optional)</FormLabel>
                        <FormControl><Input type="url" placeholder="https://example.com/image.png" {...field} /></FormControl>
                        <FormDescription>Paste a URL to an image for the course banner.</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={tsForm.control}
                    name="data_ai_hint"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Image Placeholder Hint (Optional)</FormLabel>
                        <FormControl><Input placeholder="e.g., 'exam prep' or 'science student'" {...field} value={field.value ?? ''} /></FormControl>
                        <FormDescription>Keywords for finding a placeholder image if URL is not provided (max 2 words).</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full" disabled={tsForm.formState.isSubmitting}>
                  {tsForm.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Course and Add Questions
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-xl">
          <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle>Step 2: Add Questions to "{createdTestSeriesName}"</CardTitle>
                    <CardDescription>Fill in the details for each question.</CardDescription>
                </div>
            {createdTestSeriesId && (
                <Button variant="outline" onClick={() => router.push(`/admin/edit-quiz/${createdTestSeriesId}`)}>
                    <ChevronLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                </Button>
            )}

                <Button variant="outline" onClick={() => {
                    setCreatedTestSeriesId(null);
                    setCreatedTestSeriesName(null);
                    tsForm.reset();
                    qForm.reset({
                        topic: "", subject: "",
                        options: [{ text: "" }, { text: "" }], correctOptionIndex: -1,
                    });
                    setDebugQuestionText(""); 
                    setQuestionsForCurrentSeries([]);
                }}>
                    Create Another Course
                </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...qForm}>
              <form onSubmit={qForm.handleSubmit(onQuestionSubmit)} className="space-y-8">
                <FormItem>
                  <FormLabel className="text-lg font-semibold">Question Text</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter the full question text here..."
                      value={debugQuestionText}
                      onChange={(e) => setDebugQuestionText(e.target.value)}
                      rows={5}
                      className="text-base"
                    />
                  </FormControl>
                  {debugQuestionText.trim().length > 0 && debugQuestionText.trim().length < 10 && 
                    <p className="text-sm font-medium text-destructive">Question text must be at least 10 characters.</p>}
                </FormItem>

                <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                    control={qForm.control}
                    name="topic"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Topic (Optional)</FormLabel>
                        <FormControl><Input placeholder="e.g., Kinematics, Cell Biology" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={qForm.control}
                    name="subject"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Question Subject (Optional)</FormLabel>
                        <FormControl><Input placeholder="e.g., Physics (Defaults to course subject)" {...field} /></FormControl>
                        <FormDescription>Defaults to course subject if left blank.</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                
                <FormField
                  control={qForm.control}
                  name="correctOptionIndex"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-lg font-semibold">Options & Correct Answer</FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value !== -1 && field.value !== null && field.value !== undefined ? String(field.value) : ""}
                          onValueChange={(valueString) => {
                            const numericValue = parseInt(valueString, 10);
                            if (!isNaN(numericValue)) {
                              field.onChange(numericValue);
                            }
                          }}
                          className="space-y-3"
                        >
                          {optionFields.map((optionItem, index) => (
                            <div key={optionItem.id} className="flex items-center space-x-3 p-4 border rounded-lg shadow-sm bg-background hover:bg-muted/30 transition-colors">
                              <FormControl>
                                <RadioGroupItem value={String(index)} id={`option-item-${optionItem.id}-${index}`} />
                              </FormControl>
                              <Label htmlFor={`option-item-${optionItem.id}-${index}`} className="sr-only">Option {index + 1}</Label>
                              <div className="flex-grow">
                                <FormField
                                  control={qForm.control}
                                  name={`options.${index}.text`}
                                  render={({ field: optionTextCtrl }) => (
                                    <FormItem className="w-full">
                                      <FormControl>
                                        <Input 
                                          {...optionTextCtrl} 
                                          placeholder={`Option ${index + 1} text`} 
                                          className={cn("w-full text-base", qForm.formState.errors.options?.[index]?.text && "border-destructive")}
                                        />
                                      </FormControl>
                                      <FormMessage /> 
                                    </FormItem>
                                  )}
                                />
                              </div>
                              {optionFields.length > 2 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    removeOption(index);
                                    if (field.value === index) {
                                      field.onChange(-1);
                                    } else if (field.value !== null && field.value > index) {
                                      field.onChange(field.value -1);
                                    }
                                  }}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {optionFields.length < 5 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendOption({ text: "" })}
                      className="mt-4"
                    >
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Option
                    </Button>
                  )}
                
                <Button type="submit" className="w-full mt-8" disabled={qForm.formState.isSubmitting}>
                  {qForm.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Question
                </Button>
              </form>
            </Form>

            {questionsForCurrentSeries.length > 0 && (
                <div className="mt-10 pt-6 border-t">
                    <h3 className="text-xl font-semibold mb-3 text-primary">Questions Added to "{createdTestSeriesName}" ({questionsForCurrentSeries.length}):</h3>
                    <ScrollArea className="h-[200px] rounded-md border p-3">
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            {questionsForCurrentSeries.map(q => 
                                <li key={q.id} className="p-2 bg-muted/30 rounded-md">
                                    {q.text.substring(0,100)}{q.text.length > 100 ? "..." : ""}
                                </li>
                            )}
                        </ul>
                    </ScrollArea>
                </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function CreateQuizPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading Create Quiz Page...</p>
      </div>
    }>
      <CreateQuizContent />
    </Suspense>
  )
}
