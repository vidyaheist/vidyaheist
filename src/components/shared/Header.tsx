
"use client";
import Link from "next/link";
import { Home, ShoppingBag, User, Menu, MessageSquareHeart, GitBranch, LayoutDashboard, PlusCircle, ClipboardList } from "lucide-react";
import { AuthButton } from "./AuthButton";
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { APP_NAME, ADMIN_EMAIL } from "@/lib/constants";
import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetClose, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useUser } from "@/firebase";
import Image from 'next/image';

const signedOutNavItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/store", label: "Store", icon: ShoppingBag },
  { href: "/counselling", label: "Counselling", icon: MessageSquareHeart },
  { href: "/predictor", label: "Predictor", icon: GitBranch },
];

const signedInNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/store", label: "Store", icon: ShoppingBag },
  { href: "/predictor", label: "Predictor", icon: GitBranch },
  { href: "/counselling", label: "Counselling", icon: MessageSquareHeart },
  { href: "/profile", label: "Profile", icon: User },
];

export function Header() {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const { user, loading, isAdmin, isMicroAdmin } = useUser();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [pathname]);

  const adminNavItems = [
    { href: "/admin/orders", label: "Admin Orders", icon: ClipboardList },
    { href: "/admin/create-quiz", label: "Create Course", icon: PlusCircle },
    { href: "/admin/books", label: "Manage Books", icon: PlusCircle },
    { href: "/admin/book-orders", label: "Book Orders", icon: ClipboardList },
    { href: "/admin/counselling", label: "Counselling Leads", icon: MessageSquareHeart },
  ];

  const microAdminNavItems = [
    { href: "/admin/book-orders", label: "Book Orders", icon: ClipboardList },
  ];

  const navItems = !loading && user 
    ? (isAdmin 
        ? [...signedInNavItems, ...adminNavItems] 
        : (isMicroAdmin 
            ? [...signedInNavItems, ...microAdminNavItems] 
            : signedInNavItems)) 
    : signedOutNavItems;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary/20 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70" style={{boxShadow: '0 1px 0 0 hsl(var(--primary) / 0.15), 0 4px 20px 0 hsl(222 28% 8% / 0.5)'}}>
      <div className="container flex h-16 items-center">
        <Link href={user ? "/dashboard" : "/"} className="mr-6 flex items-center space-x-2">
          <Image src="/logo.jpeg" alt={`${APP_NAME} Logo`} width={32} height={32} className="h-8 w-8 object-contain rounded-sm" />
          <span className="font-bold text-xl leading-none text-primary">{APP_NAME}</span>
        </Link>
        {isMobile ? (
          <div className="flex flex-1 items-center justify-end space-x-2">
            <AuthButton />
            {(isAdmin || isMicroAdmin) && (
              <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] p-0 pt-6">
                  <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                  <SheetDescription className="sr-only">Main navigation links for the application.</SheetDescription>
                  <nav className="flex flex-col space-y-1 px-4">
                    {navItems.map((item) => (
                      <SheetClose asChild key={item.label}>
                        <Link
                          href={item.href}
                          className={cn(
                            "px-3 py-2 text-base font-medium transition-colors hover:text-primary rounded-md flex items-center",
                            pathname === item.href ? "bg-primary/10 text-primary" : "text-foreground/70 hover:bg-secondary"
                          )}
                        >
                          <item.icon className="mr-3 inline-block h-5 w-5" />
                          {item.label}
                        </Link>
                      </SheetClose>
                    ))}
                  </nav>
                </SheetContent>
              </Sheet>
            )}
          </div>
        ) : (
          <>
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 ease-in-out hover:text-primary",
                    pathname === item.href 
                      ? "text-primary" 
                      : "text-foreground/60 hover:text-primary" 
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="flex flex-1 items-center justify-end space-x-4">
              <AuthButton />
            </div>
          </>
        )}
      </div>
    </header>
  );
}
