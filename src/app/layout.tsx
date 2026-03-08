import type { Metadata } from 'next';
import { Inter as FontSans } from 'next/font/google'; // Using Inter as a common clean sans-serif
import './globals.css';
import 'katex/dist/katex.min.css';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { APP_NAME } from '@/lib/constants';

import { Geist, Geist_Mono } from 'next/font/google';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { FloatingContact } from '@/components/shared/FloatingContact';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
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
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased flex flex-col",
          geistSans.variable,
          geistMono.variable
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <FirebaseClientProvider>
            <Header />
            <main className="flex-grow container mx-auto py-8">
              {children}
            </main>
            <Footer />
            <Toaster />
            <FirebaseErrorListener />
            <FloatingContact />
          </FirebaseClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
