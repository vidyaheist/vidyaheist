
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { APP_NAME } from "@/lib/constants";
import { useAuth, useFirestore } from "@/firebase";
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { Loader2, User as UserIcon, Phone } from "lucide-react";

const signupFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  mobile: z.string().regex(/^\d{10}$/, { message: "Mobile number must be 10 digits." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string().min(6, { message: "Password must be at least 6 characters." }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupFormSchema>;

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      name: "",
      email: "",
      mobile: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleGoogleSignUp = async () => {
    if (!auth || !firestore) return;
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDocRef = doc(firestore, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
        });
      }

      toast({
        title: "Sign Up Successful",
        description: `Welcome to ${APP_NAME}!`,
      });
      router.push("/");
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Google Sign-Up Failed",
        description: error.message || "Could not sign up with Google. Please try again.",
        variant: "destructive",
      });
    }
  };

  async function onSubmit(data: SignupFormValues) {
    if (!auth || !firestore) {
      toast({ title: "Error", description: "Authentication service is not available.", variant: "destructive" });
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      
      if (userCredential.user) {
        const user = userCredential.user;
        await updateProfile(user, {
          displayName: data.name,
        });

        await setDoc(doc(firestore, "users", user.uid), {
          uid: user.uid,
          displayName: data.name,
          email: data.email,
          mobileNumber: data.mobile,
        });

        await sendEmailVerification(user);
        
        toast({
          title: "Account Created!",
          description: `Welcome to ${APP_NAME}! A verification email has been sent. Please check your inbox.`,
          duration: 8000,
        });
        
        await auth.signOut();

        router.push("/login"); 
      }
    } catch (error: any) {
      let description = "An unexpected error occurred. Please try again.";
      if (error.code === 'auth/email-already-in-use') {
        description = "This email address is already in use. Please try logging in or use a different email.";
      }
      toast({
        title: "Signup Failed",
        description,
        variant: "destructive",
      });
    }
  }

  return (
    <div className="login-form-container">
      <div className="login-form">
        <h1 className="text-3xl font-bold text-center mb-2 text-black-100">Create an Account</h1>
        <p className="text-center font-bold text-2xl text-gray-400 mb-2">
            Join {APP_NAME} to start your exam preparation journey.
        </p>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
            <div className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="flex-column">
                    <FormLabel>Full Name</FormLabel>
                    <div className="login-input-form">
                        <UserIcon className="h-5 w-5 text-gray-400" />
                        <FormControl>
                          <Input className="login-input" placeholder="John Doe" {...field} />
                        </FormControl>
                    </div>
                    <FormMessage className="text-red-500 text-xs mt-1" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="flex-column">
                    <FormLabel>Email</FormLabel>
                    <div className="login-input-form">
                      <svg height={20} viewBox="0 0 32 32" width={20} xmlns="http://www.w3.org/2000/svg" className="fill-current text-gray-400">
                        <g id="Layer_3" data-name="Layer 3"><path d="m30.853 13.87a15 15 0 0 0 -29.729 4.082 15.1 15.1 0 0 0 12.876 12.918 15.6 15.6 0 0 0 2.016.13 14.85 14.85 0 0 0 7.715-2.145 1 1 0 1 0 -1.031-1.711 13.007 13.007 0 1 1 5.458-6.529 2.149 2.149 0 0 1 -4.158-.759v-10.856a1 1 0 0 0 -2 0v1.726a8 8 0 1 0 .2 10.325 4.135 4.135 0 0 0 7.83.274 15.2 15.2 0 0 0 .823-7.455zm-14.853 8.13a6 6 0 1 1 6-6 6.006 6.006 0 0 1 -6 6z" /></g>
                      </svg>
                      <FormControl>
                        <Input type="email" className="login-input" placeholder="you@example.com" {...field} />
                      </FormControl>
                    </div>
                    <FormMessage className="text-red-500 text-xs mt-1" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem className="flex-column">
                    <FormLabel>Mobile Number</FormLabel>
                    <div className="login-input-form">
                        <Phone className="h-5 w-5 text-gray-400" />
                        <FormControl>
                          <Input type="tel" className="login-input" placeholder="10-digit mobile number" {...field} maxLength={10} />
                        </FormControl>
                    </div>
                    <FormMessage className="text-red-500 text-xs mt-1" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="flex-column">
                    <FormLabel>Password</FormLabel>
                    <div className="login-input-form">
                       <svg height={20} viewBox="-64 0 512 512" width={20} xmlns="http://www.w3.org/2000/svg" className="fill-current text-gray-400">
                        <path d="m336 512h-288c-26.453125 0-48-21.523438-48-48v-224c0-26.476562 21.546875-48 48-48h288c26.453125 0 48 21.523438 48 48v224c0 26.476562-21.546875 48-48 48zm-288-288c-8.8125 0-16 7.167969-16 16v224c0 8.832031 7.1875 16 16 16h288c8.8125 0 16-7.167969 16-16v-224c0-8.832031-7.1875-16-16-16zm0 0" /><path d="m304 224c-8.832031 0-16-7.167969-16-16v-80c0-52.929688-43.070312-96-96-96s-96 43.070312-96 96v80c0 8.832031-7.167969 16-16 16s-16-7.167969-16-16v-80c0-70.59375 57.40625-128 128-128s128 57.40625 128 128v80c0 8.832031-7.167969 16-16 16zm0 0" /></svg>
                      <FormControl>
                        <Input type="password" className="login-input" placeholder="••••••••" {...field} />
                      </FormControl>
                    </div>
                    <FormMessage className="text-red-500 text-xs mt-1" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem className="flex-column">
                    <FormLabel>Confirm Password</FormLabel>
                    <div className="login-input-form">
                       <svg height={20} viewBox="-64 0 512 512" width={20} xmlns="http://www.w3.org/2000/svg" className="fill-current text-gray-400">
                        <path d="m336 512h-288c-26.453125 0-48-21.523438-48-48v-224c0-26.476562 21.546875-48 48-48h288c26.453125 0 48 21.523438 48 48v224c0 26.476562-21.546875 48-48 48zm-288-288c-8.8125 0-16 7.167969-16 16v224c0 8.832031 7.1875 16 16 16h288c8.8125 0 16-7.167969 16-16v-224c0-8.832031-7.1875-16-16-16zm0 0" /><path d="m304 224c-8.832031 0-16-7.167969-16-16v-80c0-52.929688-43.070312-96-96-96s-96 43.070312-96 96v80c0 8.832031-7.167969 16-16 16s-16-7.167969-16-16v-80c0-70.59375 57.40625-128 128-128s128 57.40625 128 128v80c0 8.832031-7.167969 16-16 16zm0 0" /></svg>
                      <FormControl>
                        <Input type="password" className="login-input" placeholder="••••••••" {...field} />
                      </FormControl>
                    </div>
                    <FormMessage className="text-red-500 text-xs mt-1" />
                  </FormItem>
                )}
              />
              <button type="submit" className="login-button-submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                    </>
                ) : "Sign Up"}
              </button>
            </div>
          </form>
        </Form>
        <p className="login-p line my-4">Or With</p>
        <div className="flex-row">
            <button className="login-social-btn" onClick={handleGoogleSignUp}>
                <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 512 512" style={{enableBackground: 'new 0 0 512 512'}} xmlSpace="preserve">
                <path style={{fill: '#FBBB00'}} d="M113.47,309.408L95.648,375.94l-65.139,1.378C11.042,341.211,0,299.9,0,256 c0-42.451,10.324-82.483,28.624-117.732h0.014l57.992,10.632l25.404,57.644c-5.317,15.501-8.215,32.141-8.215,49.456 C103.821,274.792,107.225,292.797,113.47,309.408z" />
                <path style={{fill: '#518EF8'}} d="M507.527,208.176C510.467,223.662,512,239.655,512,256c0,18.328-1.927,36.206-5.598,53.451 c-12.462,58.683-45.025,109.925-90.134,146.187l-0.014-0.014l-73.044-3.727l-10.338-64.535 c29.932-17.554,53.324-45.025,65.646-77.911h-136.89V208.176h138.887L507.527,208.176L507.527,208.176z" />
                <path style={{fill: '#28B446'}} d="M416.253,455.624l0.014,0.014C372.396,490.901,316.666,512,256,512 c-97.491,0-182.252-54.491-225.491-134.681l82.961-67.91c21.619,57.698,77.278,98.771,142.53,98.771 c28.047,0,54.323-7.582,76.87-20.818L416.253,455.624z" />
                <path style={{fill: '#F14336'}} d="M419.404,58.936l-82.933,67.896c-23.335-14.586-50.919-23.012-80.471-23.012 c-66.729,0-123.429,42.957-143.965,102.724l-83.397-68.276h-0.014C71.23,56.123,157.06,0,256,0 C318.115,0,375.068,22.126,419.404,58.936z" />
                </svg>
                <span>Google</span>
            </button>
        </div>
        <div className="mt-6 text-center text-sm">
          <p className="login-p">
            Already have an account?{" "}
            <Link href="/login" className="login-span">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
