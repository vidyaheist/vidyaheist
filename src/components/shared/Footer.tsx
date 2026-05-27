"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Facebook, Twitter, Linkedin, Instagram, Youtube } from "lucide-react";
import Image from "next/image";
import { APP_NAME } from "@/lib/constants";

export function Footer() {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();

  const showFooterPaths = ["/", "/dashboard", "/profile"];
  const shouldShowFooter = showFooterPaths.includes(pathname);

  if (!shouldShowFooter) return null;

  return (
    <footer className="border-t bg-card text-card-foreground pb-20 md:pb-0">
      <div className="container py-12 px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
                 <Image src="/logo.jpeg" alt={`${APP_NAME} Logo`} width={32} height={32} className="rounded-sm" />
                 <span className="text-2xl font-bold text-primary">{APP_NAME}</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Your partner in acing top research exams.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-lg font-semibold">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="text-muted-foreground hover:text-primary transition-colors">Home</Link></li>
              <li><Link href="/store" className="text-muted-foreground hover:text-primary transition-colors">Test Series</Link></li>
              <li><Link href="/profile" className="text-muted-foreground hover:text-primary transition-colors">My Profile</Link></li>
              <li><Link href="/#features" className="text-muted-foreground hover:text-primary transition-colors">Features</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-lg font-semibold">Compliance</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="/refund" className="text-muted-foreground hover:text-primary transition-colors">Refund & Cancellation</Link></li>
              <li><Link href="/shipping" className="text-muted-foreground hover:text-primary transition-colors">Shipping Policy</Link></li>
              <li><Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-lg font-semibold">Follow Us</h4>
            <div className="flex space-x-4">
              <Link href="#" aria-label="Linkedin" className="text-muted-foreground hover:text-primary transition-colors">
                <Linkedin className="h-6 w-6" />
              </Link>
              <Link href="#" aria-label="Instagram" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="h-6 w-6" />
              </Link>
               <Link href="#" aria-label="YouTube" className="text-muted-foreground hover:text-primary transition-colors">
                <Youtube className="h-6 w-6" />
              </Link>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Stay updated with the latest news and test series.
            </p>
          </div>
        </div>

        <div className="border-t pt-8 mt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground text-center md:text-left">
            &copy; {currentYear} {APP_NAME}. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground mt-4 md:mt-0">
            Designed to help you achieve your best rank.
          </p>
        </div>
      </div>
    </footer>
  );
}
