
"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  User,
  Briefcase,
  Loader2,
  Bot,
  Search,
  FileText,
  Github,
  Linkedin,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function Home() {
  const seekerImage = PlaceHolderImages.find(
    (img) => img.id === "job-seeker-card"
  );
  const employerImage = PlaceHolderImages.find(
    (img) => img.id === "employer-card"
  );
  const heroImage = PlaceHolderImages.find((img) => img.id === "resume-ranking");
  const [year, setYear] = useState(new Date().getFullYear());
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background to-muted/40">
      {/* HEADER */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/70 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-foreground/70">
            <Link href="#features" className="hover:text-primary transition-colors">
              Features
            </Link>
            <Link href="#for-you" className="hover:text-primary transition-colors">
              For You
            </Link>
            <Link href="/auth" className="hover:text-primary transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative flex flex-col items-center justify-center py-24 text-center overflow-hidden">
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            fill
            className="object-cover absolute inset-0 z-0 opacity-20"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background/60 to-background" />
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 container px-6"
        >
          <h1 className="font-headline text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
            Unlock Your Career Potential with AI
          </h1>
          <p className="mt-6 mx-auto max-w-2xl text-foreground/80 md:text-lg">
            CareerAI empowers both job seekers and employers with intelligent, automated tools to make hiring effortless and impactful.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="group transition-all hover:scale-105">
              <Link href="/auth?role=job-seeker">
                Build Your Resume
                <User className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="group transition-all hover:scale-105"
            >
              <Link href="/auth?role=employer">
                Hire Top Talent
                <Briefcase className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-20 bg-muted/50">
        <div className="container text-center">
          <div className="inline-block rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary mb-4">
            Key Features
          </div>
          <h2 className="font-headline text-4xl sm:text-5xl font-bold mb-6">
            How CareerAI Works
          </h2>
          <p className="max-w-2xl mx-auto text-foreground/70 mb-12">
            Streamline your job journey with AI-driven insights at every step.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {[
              {
                icon: <FileText className="h-8 w-8" />,
                title: "AI Resume Builder",
                desc: "Create professional resumes in seconds with real-time AI feedback and style optimization.",
              },
              {
                icon: <Bot className="h-8 w-8" />,
                title: "Smart Job Matching",
                desc: "Find jobs tailored to your skills, preferences, and potential — powered by AI.",
              },
              {
                icon: <Search className="h-8 w-8" />,
                title: "Candidate Ranking",
                desc: "Employers get automated ranking of applicants to identify top talent faster.",
              },
            ].map((f, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -5 }}
                className="rounded-xl bg-background p-8 shadow-lg border hover:border-primary/50 transition"
              >
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-xl mb-2">{f.title}</h3>
                <p className="text-foreground/70 text-sm">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FOR SEEKERS & EMPLOYERS */}
      <section id="for-you" className="py-24 bg-background">
        <div className="container grid lg:grid-cols-2 gap-12">
          {[ 
            {
              title: "For Job Seekers",
              desc: "Build a powerful resume, get personalized insights, and find your ideal job faster with AI assistance.",
              image: seekerImage,
              link: "/auth?role=job-seeker",
              icon: <User className="h-8 w-8" />,
              button: "Get Started",
            },
            {
              title: "For Employers",
              desc: "Generate engaging job posts, rank candidates automatically, and discover top talent effortlessly.",
              image: employerImage,
              link: "/auth?role=employer",
              icon: <Briefcase className="h-8 w-8" />,
              button: "Find Talent",
            },
          ].map((card, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Card className="overflow-hidden border shadow-md hover:shadow-2xl transition-all">
                <CardHeader>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="rounded-full bg-primary/10 p-3 text-primary">
                      {card.icon}
                    </div>
                    <CardTitle className="font-headline text-2xl">
                      {card.title}
                    </CardTitle>
                  </div>
                  <CardDescription className="text-base text-foreground/80">
                    {card.desc}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {card.image && (
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                      <Image
                        src={card.image.imageUrl}
                        alt={card.image.description}
                        fill
                        className="object-cover hover:scale-105 transition-transform"
                      />
                    </div>
                  )}
                </CardContent>
                <div className="p-6 pt-0">
                  <Button asChild className="w-full">
                    <Link href={card.link}>
                      {card.button}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t bg-muted/50 py-6 mt-auto">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-foreground/60">
          <p>© {year} CareerAI. All rights reserved.</p>
          <div className="flex items-center gap-3">
            <Link
              href="https://github.com/"
              className="hover:text-primary transition-colors"
            >
              <Github className="h-4 w-4" />
            </Link>
            <Link
              href="https://linkedin.com/"
              className="hover:text-primary transition-colors"
            >
              <Linkedin className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
