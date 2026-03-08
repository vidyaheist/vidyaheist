"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useAuth, useUser, useFirestore } from "@/firebase";
import { updatePassword, updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Award, BarChart2, BookOpenCheck, Edit3, KeyRound, Loader2, User as UserIcon, Phone, Image as ImageIcon } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const changePasswordSchema = z.object({
  newPassword: z.string().min(6, { message: "New password must be at least 6 characters." }),
  confirmPassword: z.string().min(6, { message: "Password must be at least 6 characters." }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const editProfileSchema = z.object({
  displayName: z.string().min(2, { message: "Name must be at least 2 characters." }),
  mobileNumber: z.string().regex(/^\d{10}$/, { message: "Mobile number must be 10 digits." }),
  photoURL: z.string().url({ message: "Please enter a valid image URL." }).or(z.literal("")),
});

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
type EditProfileFormValues = z.infer<typeof editProfileSchema>;

export default function ProfilePage() {
  const { user, loading: userLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const passwordForm = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const profileForm = useForm<EditProfileFormValues>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      displayName: "",
      mobileNumber: "",
      photoURL: "",
    },
  });

  useEffect(() => {
    if (!userLoading) {
      if (!user) {
        router.push("/login");
      } else {
        profileForm.reset({
          displayName: user.displayName || "",
          mobileNumber: "",
          photoURL: user.photoURL || "",
        });
      }
    }
  }, [user, userLoading, router, profileForm]);

  async function onChangePasswordSubmit(data: ChangePasswordFormValues) {
    if (!auth?.currentUser) {
      toast({ title: "Error", description: "You must be logged in to change your password.", variant: "destructive" });
      return;
    }
    try {
      await updatePassword(auth.currentUser, data.newPassword);
      toast({
        title: "Password Updated",
        description: "Your password has been successfully changed.",
      });
      passwordForm.reset();
    } catch (error: any) {
      console.error("Error changing password:", error);
      let description = "Could not update your password. Please try again.";
      if (error.code === 'auth/requires-recent-login') {
        description = "This action is sensitive and requires recent authentication. Please log in again before retrying."
      }
      toast({
        title: "Error Changing Password",
        description,
        variant: "destructive",
      });
    }
  }

  async function onEditProfileSubmit(data: EditProfileFormValues) {
    if (!auth?.currentUser || !firestore) return;

    try {
      await updateProfile(auth.currentUser, {
        displayName: data.displayName,
        photoURL: data.photoURL || null,
      });

      const userDocRef = doc(firestore, "users", auth.currentUser.uid);
      await updateDoc(userDocRef, {
        displayName: data.displayName,
        mobileNumber: data.mobileNumber,
        photoURL: data.photoURL || null,
      });

      toast({
        title: "Profile Updated",
        description: "Your changes have been saved successfully.",
      });
      setIsEditDialogOpen(false);
      router.refresh();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update Failed",
        description: error.message || "An error occurred while updating your profile.",
        variant: "destructive",
      });
    }
  }

  if (userLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)]">
        <p className="text-lg text-muted-foreground mb-4">Redirecting to login...</p>
      </div>
    );
  }

  const displayName = user.displayName || user.email?.split('@')[0] || "User";
  const joinDate = user.metadata.creationTime ? formatDistanceToNow(new Date(user.metadata.creationTime), { addSuffix: true }) : "N/A";
  const avatarUrl = user.photoURL || `https://avatar.vercel.sh/${displayName.replace(/\s+/g, '')}.png`;

  return (
    <div className="space-y-8">
      <section className="text-center py-8 bg-primary/5 rounded-lg">
        <h1 className="text-4xl font-bold tracking-tight text-primary">My Profile</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Manage your account details and track your progress.
        </p>
      </section>

      <Card className="shadow-xl">
        <CardHeader className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 pb-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback>{displayName.substring(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="text-center sm:text-left">
            <CardTitle className="text-2xl">{displayName}</CardTitle>
            <CardDescription>{user.email}</CardDescription>
            <CardDescription>Joined: {joinDate}</CardDescription>
          </div>
          
          <div className="ml-auto">
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Edit Profile</DialogTitle>
                  <DialogDescription>
                    Make changes to your profile here. Click save when you're done.
                  </DialogDescription>
                </DialogHeader>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onEditProfileSubmit)} className="space-y-4">
                    <FormField
                      control={profileForm.control}
                      name="displayName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <div className="relative">
                            <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <FormControl>
                              <Input className="pl-9" placeholder="John Doe" {...field} />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="mobileNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mobile Number</FormLabel>
                          <div className="relative">
                            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <FormControl>
                              <Input className="pl-9" placeholder="10-digit number" {...field} maxLength={10} />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="photoURL"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Profile Picture URL</FormLabel>
                          <div className="relative">
                            <ImageIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <FormControl>
                              <Input className="pl-9" placeholder="https://example.com/avatar.png" {...field} />
                            </FormControl>
                          </div>
                          <FormDescription>Link to an external image file.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                        {profileForm.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Save Changes
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <Separator />

        <CardContent className="pt-6 grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary flex items-center">
              <BarChart2 className="mr-2 h-5 w-5" /> Performance Overview
            </h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Tests Taken: Coming Soon</p>
              <p>Average Score: Coming Soon</p>
            </div>
            <Button variant="link" className="p-0 h-auto" disabled>View Detailed Analytics</Button>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary flex items-center">
              <BookOpenCheck className="mr-2 h-5 w-5" /> Purchased Test Series
            </h3>
            <p className="text-sm text-muted-foreground">No test series purchased yet. (Feature coming soon)</p>
             <Button variant="link" className="p-0 h-auto" onClick={() => router.push('/store')}>Browse Store</Button>
          </div>
        </CardContent>

        <Separator />

        <CardContent className="pt-6">
           <h3 className="text-lg font-semibold text-primary flex items-center mb-4">
              <Award className="mr-2 h-5 w-5" /> Achievements & Badges
            </h3>
            <p className="text-sm text-muted-foreground">Feature coming soon! Earn badges for your accomplishments.</p>
        </CardContent>
      </Card>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center">
            <KeyRound className="mr-2 h-5 w-5 text-primary" /> Change Password
          </CardTitle>
          <CardDescription>
            Update your password here. Make sure it's strong and memorable.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onChangePasswordSubmit)} className="space-y-6 max-w-md">
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
                {passwordForm.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Change Password"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
