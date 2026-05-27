
// src/app/counselling/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  School, 
  GraduationCap, 
  Library, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Users,
  Star,
  Quote,
  ChevronLeft,
  ChevronRight,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { useToast } from "@/hooks/use-toast";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const counsellingModules = [
  {
    title: "JoSAA & JAC Delhi",
    subtitle: "Engineering Admissions",
    description: "End-to-end guidance for IITs, NITs, IIITs, and Delhi's premier colleges like DTU, NSUT, and IGDTUW.",
    icon: <School className="w-10 h-10 text-primary" />,
    features: ["1-on-1 Counselling + video/voice call support","Choice Filling Optimization", "Rank-based College Prediction", "Document Verification Support"],
    color: "bg-blue-500/10",
  },
  {
    title: "IAT & NEST",
    subtitle: "Research Admissions",
    description: "Specialized counselling for IISERs, NISER, and UM-DAE CEBS. The ultimate guide for research aspirants.",
    icon: <GraduationCap className="w-10 h-10 text-accent" />,
    features: ["1-on-1 Counselling + video/voice call support","IISER Preference Lists", "NISER Admission Process", "Research Career Roadmap"],
    color: "bg-teal-500/10",
  },
  {
    title: "MHTCET",
    subtitle: "State Counselling",
    description: "Expert assistance for CAP rounds in Maharashtra's top engineering and pharmacy institutes.",
    icon: <Library className="w-10 h-10 text-primary" />,
    features: ["1-on-1 Counselling + video/voice call support","CAP Round Strategy", "Institute-wise Cutoff Analysis", "State Quota Benefits"],
    color: "bg-indigo-500/10",
  }
];

const testimonials = [
  {
    name: "Ankit Verma",
    college: "IIT Delhi (JoSAA)",
    text: "The choice filling strategy provided by VidyaHeist was the reason I got into my dream branch. They understand the trends perfectly!",
    rating: 5,
    image: "https://picsum.photos/seed/counsel1/100/100",
  },
  {
    name: "Sneha Rao",
    college: "IISER Mohali (IAT)",
    text: "Navigating the IISER preference list was so confusing until I spoke to the mentors here. Their 1-on-1 support is truly world-class.",
    rating: 5,
    image: "https://picsum.photos/seed/counsel2/100/100",
  },
  {
    name: "Patil Rohan",
    college: "COEP Pune (MHTCET)",
    text: "I was about to make a huge mistake in my CAP rounds. VidyaHeist corrected my list and saved my career. Grateful!",
    rating: 5,
    image: "https://picsum.photos/seed/counsel3/100/100",
  },
];

export default function CounsellingPage() {
  const [current, setCurrent] = useState(0);
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { data: dbUser } = useDoc<any>({ path: user ? `users/${user.uid}` : null });

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [interest, setInterest] = useState("JoSAA & JAC Delhi");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (dbUser) {
      setName(dbUser.displayName || user?.displayName || "");
      setPhone(dbUser.mobileNumber || "");
    }
  }, [dbUser, user]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore) return;

    if (!name.trim() || !phone.trim() || !message.trim()) {
      toast({
        title: "Required Fields",
        description: "Please fill all the fields before submitting.",
        variant: "destructive",
      });
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid 10-digit mobile number.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      await addDoc(collection(firestore, "counsellingQueries"), {
        userId: user?.uid || null,
        userName: name,
        userEmail: user?.email || "anonymous@visitor.com",
        phone: phone,
        interest: interest,
        message: message,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast({
        title: "Callback Request Submitted!",
        description: "Our counseling mentor will contact you shortly.",
      });

      setMessage("");
    } catch (err) {
      console.error(err);
      toast({
        title: "Submission Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const handleAction = () => {
    document.getElementById("counselling-form")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex flex-col space-y-12 pb-20">
      {/* Header Section */}
      <section className="text-center space-y-4 py-12 bg-primary/5 rounded-3xl border border-primary/10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-bold text-primary mb-2"
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Expert Admission Mentorship</span>
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-primary">
          College Counselling Services
        </h1>
        <p className="max-w-2xl mx-auto text-lg text-muted-foreground font-medium px-4">
          Navigate the complex admission process with confidence. Get personalized guidance to secure your seat in India's top-tier institutions.
        </p>
      </section>

      {/* Grid Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
        {counsellingModules.map((module, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="h-full flex flex-col border-2 border-border/50 transition-all hover:shadow-2xl hover:border-primary/30 group relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-32 h-32 ${module.color} blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500`} />
              
              <CardHeader className="relative">
                <div className="mb-4 p-3 rounded-2xl bg-background border border-border shadow-sm w-fit group-hover:scale-110 transition-transform">
                  {module.icon}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-accent tracking-wider uppercase">
                    {module.subtitle}
                  </p>
                  <CardTitle className="text-2xl font-bold">{module.title}</CardTitle>
                </div>
                <CardDescription className="text-base pt-2">
                  {module.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-grow space-y-4 relative">
                <div className="h-px bg-border w-full" />
                <ul className="space-y-3">
                  {module.features.map((feature, i) => (
                    <li key={i} className="flex items-center text-sm text-muted-foreground">
                      <CheckCircle2 className="mr-2 h-4 w-4 text-green-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="relative">
                <Button onClick={handleAction} className="w-full group/btn rounded-xl py-6" variant="outline">
                  View Details 
                  <ArrowRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Testimonials Section */}
      <section className="w-full py-16 bg-accent/5 rounded-[3rem] border border-accent/10 relative overflow-hidden">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-primary mb-2">Mentorship Success Stories</h2>
            <p className="text-muted-foreground">What students say about our counselling support.</p>
          </div>

          <div className="relative max-w-4xl mx-auto px-2 sm:px-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5 }}
                className="bg-background rounded-3xl p-5 md:p-12 shadow-xl border border-border flex flex-col md:flex-row gap-8 items-center"
              >
                <div className="relative flex-shrink-0">
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-accent/20 shadow-lg">
                    <Image 
                      src={testimonials[current].image} 
                      alt={testimonials[current].name}
                      width={128}
                      height={128}
                      className="object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-accent text-accent-foreground p-2 rounded-full shadow-lg">
                    <Quote className="w-4 h-4" />
                  </div>
                </div>

                <div className="flex-grow space-y-4 text-center md:text-left">
                  <div className="flex justify-center md:justify-start gap-1">
                    {[...Array(testimonials[current].rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-xl font-medium italic text-foreground/90 leading-relaxed">
                    "{testimonials[current].text}"
                  </p>
                  <div>
                    <h4 className="text-xl font-bold text-primary">{testimonials[current].name}</h4>
                    <p className="text-muted-foreground font-semibold">{testimonials[current].college}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Controls */}
            <button 
              onClick={() => setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
              className="absolute left-0 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background border border-border shadow-md hover:bg-secondary transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
              onClick={() => setCurrent((prev) => (prev + 1) % testimonials.length)}
              className="absolute right-0 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background border border-border shadow-md hover:bg-secondary transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="container mx-auto px-4">
        <div className="bg-secondary/30 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 border border-border">
          <div className="flex-1 space-y-4 text-center md:text-left">
            <h2 className="text-3xl font-bold text-primary">Why choose our Counselling?</h2>
            <p className="text-muted-foreground text-lg">
              Admissions are not just about marks; they are about strategy. Our mentors are graduates from IISERs, NITs, and top state colleges who understand the ground reality.
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
              <div className="flex items-center gap-2 bg-background px-4 py-2 rounded-full border border-border text-sm font-medium">
                <Users className="w-4 h-4 text-primary" /> 500+ Mentored
              </div>
              <div className="flex items-center gap-2 bg-background px-4 py-2 rounded-full border border-border text-sm font-medium">
                <ShieldCheck className="w-4 h-4 text-primary" /> 100% Verified Info
              </div>
            </div>
          </div>
          <div className="w-full md:w-1/3 flex justify-center">
             <Button onClick={handleAction} size="lg" className="rounded-full px-8 py-8 text-lg font-bold shadow-xl hover:scale-105 transition-transform">
                Book a Free Slot
             </Button>
          </div>
        </div>
      </section>

      {/* Counselling Callback Request Form */}
      <section id="counselling-form" className="container mx-auto px-4 max-w-3xl pt-8">
        <Card className="border-2 border-primary/20 shadow-2xl relative overflow-hidden rounded-[2rem] bg-card">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 blur-3xl rounded-full" />
          <CardHeader className="text-center relative">
            <CardTitle className="text-3xl font-extrabold text-primary">Get in Touch with our Mentors</CardTitle>
            <CardDescription className="text-base font-semibold">
              Fill in your details below. Our counselling expert will call or WhatsApp you within 24 hours.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 relative">
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-secondary/40 border border-border px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm font-semibold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground">Phone Number</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="10-digit mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-secondary/40 border border-border px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-2 flex flex-col">
                <label className="text-sm font-bold text-foreground">Select Counselling Stream / Interest</label>
                <select
                  value={interest}
                  onChange={(e) => setInterest(e.target.value)}
                  className="w-full bg-secondary/40 border border-border px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm font-semibold cursor-pointer"
                >
                  <option value="JoSAA & JAC Delhi">JoSAA & JAC Delhi (IITs, NITs, IIITs, DTU)</option>
                  <option value="IAT & NEST">IAT & NEST (IISERs, NISER)</option>
                  <option value="MHTCET">MHTCET CAP Rounds</option>
                  <option value="General Guidance">General Study & College Counselling</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">Your Query / Message</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Tell us about your rank, target college, or any questions you have..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-secondary/40 border border-border px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm font-semibold resize-none"
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full py-6 rounded-xl font-black text-base shadow-lg transition-transform hover:scale-[1.01]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Submitting Request...
                  </>
                ) : (
                  "Request Free Callback Session"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
