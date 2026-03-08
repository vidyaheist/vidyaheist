
"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";

export default function FAQPage() {
  const faqs = [
    {
      question: "What makes Vidyaheist different from other platforms?",
      answer: "Vidyaheist focuses specifically on students who want to pursue research careers. We provide personalized learning paths, expert mentorship, and strategic preparation for research-oriented exams like IAT and NEST."
    },
    {
      question: "Who should join Vidyaheist?",
      answer: "Students who want to pursue scientific research, are preparing for exams like the IISER Aptitude Test (IAT) or NEST, want guidance for institutes like IISERs/NISER, and need structured preparation with active mentorship."
    },
    {
      question: "What services does Vidyaheist provide?",
      answer: "Vidyaheist offers personalized courses, advanced test series with AI explanations, one-to-one mentorship, college counselling for research institutes, and strategy sessions for competitive exams."
    },
    {
      question: "How is the course personalized?",
      answer: "Each student receives a customized study plan, deep performance analysis from tests using our analytics engine, and mentorship guidance based specifically on their unique strengths and weaknesses."
    },
    {
      question: "Does Vidyaheist provide mentorship?",
      answer: "Yes. Students receive direct mentorship from experienced educators and research students who have already cracked these exams. They guide you in academics, exam strategy, and building a research career."
    },
    {
      question: "Do you help with college selection?",
      answer: "Absolutely. Vidyaheist provides specialized college counselling and admission guidance for premium research institutes like IISERs, NISER, and UM-DAE CEBS, helping you navigate preference lists and CAP rounds."
    }
  ];

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="text-center mb-12 space-y-4">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-2">
          <HelpCircle className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-primary">Frequently Asked Questions</h1>
        <p className="text-lg text-muted-foreground">
          Everything you need to know about starting your research journey with Vidyaheist.
        </p>
      </div>

      <Card className="shadow-xl border-t-4 border-t-primary">
        <CardContent className="p-6 md:p-8">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, idx) => (
              <AccordionItem key={idx} value={`item-${idx}`} className="border-b last:border-0 py-2">
                <AccordionTrigger className="text-left font-bold text-lg hover:text-primary transition-colors hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base leading-relaxed pt-2">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      <div className="mt-12 text-center p-8 bg-secondary/30 rounded-3xl border border-dashed border-primary/20">
        <h3 className="text-xl font-bold text-primary mb-2">Still have questions?</h3>
        <p className="text-muted-foreground mb-6">We're here to help you heist your dream college.</p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <a 
            href="mailto:team.vidyaheist@gmail.com" 
            className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-primary text-primary-foreground font-bold hover:scale-105 transition-transform"
          >
            Email Support
          </a>
          <a 
            href="https://wa.me/918708673831" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-[#25D366] text-white font-bold hover:scale-105 transition-transform"
          >
            Chat on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

    