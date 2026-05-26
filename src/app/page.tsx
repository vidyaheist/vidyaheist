
"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, 
  ArrowRight,
  PlayCircle,
  Target,
  Zap,
  BarChart3,
  CheckCircle2,
  Star,
  Quote,
  ChevronLeft,
  ChevronRight,
  HelpCircle
} from "lucide-react";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { APP_NAME } from "@/lib/constants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Image from 'next/image';

const testimonials = [
  {
    name: "Rahul Sharma",
    college: "IISER Pune",
    text: "The mock tests were exactly like the actual IAT paper. The AI explanations helped me clear my physics concepts in minutes! Truly a heist for my dream college.",
    rating: 5,
    image: "https://picsum.photos/seed/student1/100/100",
  },
  {
    name: "Priyanshu Kumar",
    college: "NISER Bhubaneswar",
    text: "VidyaHeist's NEST series is a lifesaver. The interface is so realistic that I didn't feel any exam pressure on the big day. The detailed analytics are spot on.",
    rating: 5,
    image: "https://picsum.photos/seed/student2/100/100",
  },
  {
    name: "Aditi Mishra",
    college: "IISER Kolkata",
    text: "The personalized mentorship and the rank predictor gave me the confidence I needed. I could track my growth daily and focus on my weak chapters efficiently.",
    rating: 5,
    image: "https://picsum.photos/seed/student3/100/100",
  },
];

const faqs = [
  {
    question: "What makes Vidyaheist different from other platforms?",
    answer: "Vidyaheist focuses specifically on students who want to pursue research careers. We provide personalized learning paths, expert mentorship, and strategic preparation for research-oriented exams like IAT and NEST."
  },
  {
    question: "Who should join Vidyaheist?",
    answer: "Students who want to pursue scientific research, are preparing for exams like the IISER Aptitude Test (IAT), want guidance for institutes like IISERs/NISER, and need structured preparation with mentorship."
  },
  {
    question: "What services does Vidyaheist provide?",
    answer: "Vidyaheist offers personalized courses, advanced test series, one-to-one mentorship, college counselling for research institutes, and strategy sessions for competitive exams."
  },
  {
    question: "How is the course personalized?",
    answer: "Each student receives a customized study plan, performance analysis from tests, and mentorship guidance based specifically on their unique strengths and weaknesses."
  },
  {
    question: "Does Vidyaheist provide mentorship?",
    answer: "Yes. Students receive direct mentorship from experienced educators and research students who have already cracked these exams to guide you in academics, exams, and research careers."
  },
  {
    question: "Do you help with college selection?",
    answer: "Yes. Vidyaheist provides specialized college counselling and admission guidance for premium research institutes like IISERs, NISER, and UM-DAE CEBS."
  }
];

export default function MarketingPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg font-medium text-foreground">Loading your experience...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground transition-colors duration-300 -mx-4 md:-mx-8 -my-6 md:-my-8">
      {/* Brand mouse-follower glow */}
      <div 
        className="pointer-events-none fixed inset-0 z-0 transition-all duration-500"
        style={{
          background: `radial-gradient(700px circle at ${mousePosition.x}px ${mousePosition.y}px, hsl(var(--primary) / 0.07), transparent 70%)`,
        }}
      />
      {/* Static mesh gradient */}
      <div className="pointer-events-none fixed inset-0 z-0 mesh-gradient opacity-60" />

      <div className="relative z-10 flex flex-col items-center pb-20">
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
        <TestimonialsSection />
        <HowItWorksSection />
        <FAQSection />
        <CTASection />
      </div>
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative w-full pt-20 md:pt-32 lg:pt-40 pb-16 overflow-hidden">
      <div className="container px-4 md:px-6 mx-auto grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col justify-center space-y-8 text-center lg:text-left z-10"
        >
          <div className="space-y-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center rounded-full border border-primary/40 bg-primary/15 px-4 py-1.5 text-sm font-bold text-primary backdrop-blur-sm gap-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span>Rank #1 in IAT & NEST Prep</span>
            </motion.div>
            
            <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl leading-[1.1]">
              <span className="block">Heist your</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-cyan-400 animate-gradient-x" style={{backgroundSize:'200% auto'}}>
                Dream College
              </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-primary to-blue-400 animate-gradient-x" style={{backgroundSize:'200% auto'}}>
                with {APP_NAME}
              </span>
            </h1>
            
            <p className="max-w-[600px] mx-auto lg:mx-0 text-foreground/70 md:text-xl leading-relaxed font-light">
              VidyaHeist helps you turn ambition into admission with proper personal mentorship and structured planning.
            </p>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
          >
            <a href="/signup" className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-primary-foreground bg-primary rounded-full overflow-hidden transition-transform hover:scale-105 active:scale-95 shadow-lg">
              <span className="relative flex items-center gap-2">
                Start Simulating <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </a>
            <a href="#features" className="group inline-flex items-center justify-center px-8 py-4 font-semibold text-foreground bg-secondary/50 hover:bg-secondary rounded-full transition-all backdrop-blur-md border border-border">
              <PlayCircle className="mr-2 w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
              Watch Demo
            </a>
          </motion.div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative w-full max-w-[600px] mx-auto flex flex-col gap-4"
        >
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-background/90 backdrop-blur-md rounded-lg p-3 shadow-lg border border-border flex items-center gap-3 w-fit self-start ml-4 z-20"
          >
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Est. Rank</p>
              <p className="text-sm font-bold text-primary">Top 1%</p>
            </div>
          </motion.div>

          <div className="relative z-10 w-full rounded-2xl border border-border bg-background shadow-2xl overflow-hidden">
            <div className="relative aspect-[4/3] bg-background">
              <Image 
                src="/imghome.jpeg"
                alt="Student analyzing performance" 
                width={800}
                height={600}
                className="object-cover w-full h-full"
                priority
              />
            </div>
          </div>
          
          <div className="absolute -top-1/4 left-1/2 -translate-x-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-primary/10 to-accent/10 blur-[100px] rounded-full -z-10 pointer-events-none"></div>
        </motion.div>
      </div>
    </section>
  );
}

function StatsSection() {
  const stats = [
    { label: "Mentored Students", value: "1000+" },
    { label: "Mock Tests Attempted", value: "1.2k+" },
    { label: "Questions Bank", value: "35+" },
    { label: "Selection Rate", value: "2x Higher" },
  ];

  return (
    <section className="w-full py-14 border-y border-border bg-secondary/10 backdrop-blur-sm z-10 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="space-y-2 group"
            >
              <h3 className="text-3xl md:text-4xl font-extrabold text-primary group-hover:brand-text-glow transition-all">{stat.value}</h3>
              <p className="text-sm md:text-base text-muted-foreground font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      title: "Realistic Exam Simulation",
      description: "Experience the actual IAT/NEST environment with identical UI and timed tests.",
      icon: <Target className="w-8 h-8 text-primary" />,
      items: ["Strict Timed Sessions", "Distraction-free mode", "Realistic UI", "Live Mock Feed"]
    },
    {
      title: "AI-Enhanced Explanations",
      description: "Never get stuck. Get detailed AI-generated logic for every single answer.",
      icon: <Zap className="w-8 h-8 text-primary" />,
      items: ["Step-by-step logic", "Core Concept Clarity", "Mistake Analysis", "Instant Clarification", "Topic Tagging"]
    },
    {
      title: "Performance Analytics",
      description: "Monitor progress with pinpoint accuracy. Identify weak chapters early.",
      icon: <BarChart3 className="w-8 h-8 text-primary" />,
      items: ["Subject-wise Tracking", "Time Management Stats", "Real-time Rank Estimator", "Error Pattern Recognition", "Growth Charts"]
    }
  ];

  return (
    <section id="features" className="w-full py-24 md:py-32 relative z-10">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block rounded-full bg-secondary px-4 py-1.5 text-sm font-bold text-primary border border-border"
          >
            The Ultimate Toolkit
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-bold tracking-tighter sm:text-5xl"
          >
            Everything you need to <span className="text-primary">Succeed</span>
          </motion.h2>
          <p className="text-foreground/70 md:text-xl leading-relaxed">
            We've engineered every feature to give you an unfair advantage. Dive into tools built specifically for top rankers.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
            >
              <div className="hybrid-clay-card h-full p-6 md:p-8 flex flex-col justify-between group">
                <div className="space-y-4">
                  <div className="mb-4 bg-primary/10 w-fit p-3 rounded-2xl group-hover:bg-primary group-hover:text-primary-foreground transition-all border border-primary/20 shadow-inner">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-extrabold text-foreground">{feature.title}</h3>
                  <p className="text-base text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
                <div className="mt-6 pt-6 border-t border-border/50">
                  <ul className="space-y-3">
                    {feature.items.map((item, i) => (
                      <li key={i} className="flex items-center text-sm font-semibold text-muted-foreground/80">
                        <CheckCircle2 className="mr-2 h-4 w-4 text-green-500 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="w-full py-24 relative z-10 overflow-hidden" style={{background: 'linear-gradient(180deg, transparent 0%, hsl(var(--primary) / 0.04) 50%, transparent 100%)'}}>
      <div className="container px-4 md:px-6 mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl mb-4 text-primary">Success Stories</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Hear from students who heist their way into India's top research institutes.</p>
        </div>

        <div className="relative max-w-4xl mx-auto px-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
              className="hybrid-clay-card p-8 md:p-12 flex flex-col md:flex-row gap-8 items-center"
            >
              <div className="relative flex-shrink-0">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-primary/20 shadow-xl">
                  <Image 
                    src={testimonials[current].image} 
                    alt={testimonials[current].name}
                    width={128}
                    height={128}
                    className="object-cover"
                  />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground p-2 rounded-full shadow-lg">
                  <Quote className="w-4 h-4" />
                </div>
              </div>

              <div className="flex-grow space-y-4 text-center md:text-left">
                <div className="flex justify-center md:justify-start gap-1">
                  {[...Array(testimonials[current].rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-xl md:text-2xl font-medium italic text-foreground/90 leading-relaxed">
                  "{testimonials[current].text}"
                </p>
                <div>
                  <h4 className="text-xl font-bold text-primary">{testimonials[current].name}</h4>
                  <p className="text-muted-foreground font-semibold">{testimonials[current].college}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

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

          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${current === i ? 'bg-primary w-8' : 'bg-primary/20'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    { num: "01", title: "Create Profile", desc: "Sign up and tell us your target exam and current prep level." },
    { num: "02", title: "Dashboard Analysis", desc: "A personalized dashboard to identify your strong and weak zones." },
    { num: "03", title: "Take Guided Tests", desc: "Get a personalized study roadmap and targeted practice questions." },
    { num: "04", title: "Track & Conquer", desc: "Watch your rank improve in real-time as you clear your weaknesses." },
  ];

  return (
    <section className="w-full py-24 relative z-10">
      <div className="container px-4 md:px-6 mx-auto max-w-5xl">
        {/* Centered Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-bold text-primary border border-primary/20"
          >
            Our Methodology
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-extrabold tracking-tight"
          >
            Your Path to <span className="text-primary font-black brand-text-glow">Victory</span>
          </motion.h2>
          <p className="text-foreground/70 md:text-xl leading-relaxed">
            We've distilled the success strategies of top rankers into a simple, automated 4-step process. No more guessing, just focused execution.
          </p>
        </div>

        {/* Steps Listed Vertically */}
        <div className="relative max-w-3xl mx-auto">
          {/* Timeline Line */}
          <div className="absolute left-10 md:left-12 top-4 bottom-4 w-1 bg-gradient-to-b from-primary via-accent to-transparent z-0 opacity-20 hidden sm:block"></div>

          <div className="space-y-8 relative z-10">
            {steps.map((step, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                className="hybrid-clay-card p-6 md:p-8 flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left"
              >
                {/* Neo-brutalist circle for step number */}
                <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground border-2 border-foreground flex items-center justify-center text-2xl font-black flex-shrink-0 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]">
                  {step.num}
                </div>
                <div className="space-y-2 flex-grow">
                  <h3 className="text-2xl font-black text-foreground">{step.title}</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Centered CTA */}
        <div className="text-center mt-12">
          <a href="/store" className="inline-flex items-center justify-center px-8 py-4 font-extrabold rounded-full bg-primary text-primary-foreground hover:bg-primary/95 transition-all shadow-lg hover:scale-105 active:scale-95 brand-glow">
            View Test Series
          </a>
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  return (
    <section className="w-full py-24 relative z-10 overflow-hidden" style={{background: 'linear-gradient(180deg, transparent 0%, hsl(var(--primary) / 0.03) 100%)'}}>
      <div className="container px-4 md:px-6 mx-auto max-w-4xl">
        <div className="text-center mb-16 space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-bold text-primary"
          >
            <HelpCircle className="h-4 w-4" />
            <span>Common Questions</span>
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-bold tracking-tighter sm:text-5xl"
          >
            Find your <span className="text-primary">Answers</span>
          </motion.h2>
        </div>

        <Card className="shadow-2xl border-primary/10 overflow-hidden">
          <CardContent className="p-0">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, idx) => (
                <AccordionItem key={idx} value={`home-item-${idx}`} className="border-b last:border-0 px-6 hover:bg-muted/30 transition-colors">
                  <AccordionTrigger className="text-left font-bold text-lg hover:text-primary transition-colors hover:no-underline py-6">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-base leading-relaxed pb-6">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="w-full py-24 relative z-10">
      <div className="container px-4 md:px-6 mx-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative rounded-[3rem] overflow-hidden px-6 py-16 md:py-24 text-center text-white shadow-2xl brand-glow"
          style={{background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(221 80% 40%) 40%, hsl(222 80% 30%) 100%)'}}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/10 rounded-full animate-[spin_60s_linear_infinite] z-0 pointer-events-none"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/20 rounded-full animate-[spin_40s_linear_infinite_reverse] z-0 pointer-events-none"></div>

          <div className="relative z-10 max-w-3xl mx-auto space-y-8">
            <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight">
              Heist your dream college. <br/>with VidyaHeist.
            </h2>
            <p className="text-lg md:text-2xl text-primary-foreground/80 max-w-2xl mx-auto">
              Join thousands of students who have already transformed their preparation and secured their dream colleges.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-6">
              <a 
                href="/signup" 
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold bg-background text-primary rounded-full hover:scale-105 active:scale-95 transition-all shadow-xl"
              >
                Sign Up for Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
