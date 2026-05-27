"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, GitBranch, LayoutDashboard, User, MessageSquareHeart } from "lucide-react";
import { useUser } from "@/firebase";
import { cn } from "@/lib/utils";

export function BottomNavbar() {
  const pathname = usePathname();
  const { user, loading, isAdmin, isMicroAdmin } = useUser();

  // Only display for regular users/visitors (not admin or microadmin)
  if (loading || isAdmin || isMicroAdmin) return null;

  const items = [
    { href: "/store", label: "Store", icon: ShoppingBag },
    { href: "/predictor", label: "Predictor", icon: GitBranch },
    { href: user ? "/dashboard" : "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/counselling", label: "Counselling", icon: MessageSquareHeart },
    { href: user ? "/profile" : "/login", label: "Profile", icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-background/95 backdrop-blur-xl border-t border-primary/10 shadow-[0_-4px_30px_rgba(0,0,0,0.12)] pb-safe-bottom">
      <div className="flex justify-around items-center h-16 px-1">
        {items.map((item) => {
          const isActive = pathname === item.href || (item.href === "/" && pathname === "/dashboard");
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full py-1 transition-all duration-200 relative group",
                isActive ? "text-primary font-black" : "text-muted-foreground hover:text-foreground font-semibold"
              )}
            >
              {/* Sleek active dot / bar indicator */}
              {isActive && (
                <span className="absolute top-0 w-10 h-0.5 bg-primary rounded-full animate-fade-in" />
              )}
              
              <div className={cn(
                "p-1 rounded-xl transition-all duration-200 mb-0.5",
                isActive ? "text-primary scale-110 animate-fade-in" : "text-muted-foreground group-hover:text-foreground"
              )}>
                <Icon className="w-5 h-5" />
              </div>
              
              <span className="text-[10px] tracking-tight whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
