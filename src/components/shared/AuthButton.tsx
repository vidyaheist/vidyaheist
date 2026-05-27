
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogIn, LogOut, UserCircle, Loader2 } from "lucide-react";
import { useAuth, useUser } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { signOut } from "firebase/auth";

export function AuthButton() {
  const { user, loading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      router.push("/");
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Logout Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
        <Button variant="ghost" size="icon" disabled>
            <Loader2 className="h-5 w-5 animate-spin" />
        </Button>
    );
  }

  const displayName = user?.displayName || user?.email?.split('@')[0] || "User";
  const displayEmail = user?.email || "Not available";
  const avatarUrl = user?.photoURL || `https://avatar.vercel.sh/${displayName.replace(/\s+/g, '')}.png?text=${displayName.substring(0,1)}`;

  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="focus:outline-none cursor-pointer rounded-full ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <Avatar className="h-8 w-8 hover:opacity-85 transition-opacity overflow-hidden rounded-full">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback>{displayName.substring(0, 1).toUpperCase()}</AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{displayName}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {displayEmail}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/profile">
              <UserCircle className="mr-2 h-4 w-4" />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Link href="/login" passHref>
       <Button variant="outline">
        <LogIn className="mr-2 h-4 w-4" />
        Login
      </Button>
    </Link>
  );
}
