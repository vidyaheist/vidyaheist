import type { Metadata } from 'next';
import './globals.css';
import 'katex/dist/katex.min.css';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { APP_NAME } from '@/lib/constants';
import { BottomNavbar } from '@/components/shared/BottomNavbar';

import { Geist, Geist_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { FloatingContact } from '@/components/shared/FloatingContact';
import { CartProvider } from '@/providers/CartProvider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const jakarta = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: `${APP_NAME} - Your Exam Preparation Partner`,
  description: `Realistic exam simulations and AI-powered explanations for JEE/NEET with ${APP_NAME}.`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof Element !== 'undefined' && Element.prototype.releasePointerCapture) {
                const originalRelease = Element.prototype.releasePointerCapture;
                Element.prototype.releasePointerCapture = function(pointerId) {
                  try {
                    originalRelease.call(this, pointerId);
                  } catch (e) {}
                };
              }
            `
          }}
        />
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased flex flex-col",
          geistSans.variable,
          geistMono.variable,
          jakarta.variable
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          disableTransitionOnChange
        >
          <FirebaseClientProvider>
            <CartProvider>
              <Header />
              <main className="flex-grow container mx-auto px-4 py-6 md:py-8 pb-24 md:pb-8">
                {children}
              </main>
              <Footer />
              <BottomNavbar />
              <Toaster />
              <FirebaseErrorListener />
              <FloatingContact />
            </CartProvider>
          </FirebaseClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
