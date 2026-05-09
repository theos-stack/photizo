"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown } from "lucide-react";

import { Button } from "@/components/Button";
import { Container } from "@/components/Container";

const ease = [0.16, 1, 0.3, 1] as const;

const floatingCards = [
  {
    title: "Evangelism",
    description: "Reaching men with the gospel.",
    className: "lg:left-10 lg:top-10 lg:-rotate-6",
    mobileClassName: "rotate-[-3deg]",
    duration: 7.2,
    delay: 0.2,
  },
  {
    title: "Teachings",
    description: "Establishing believers in truth.",
    className: "lg:right-0 lg:top-28 lg:rotate-4",
    mobileClassName: "rotate-[2deg]",
    duration: 6.4,
    delay: 0.35,
  },
  {
    title: "Follow-Up",
    description: "Strengthening new believers.",
    className: "lg:left-20 lg:bottom-18 lg:rotate-3",
    mobileClassName: "rotate-[1deg]",
    duration: 7.8,
    delay: 0.45,
  },
  {
    title: "Discipleship",
    description: "Raising men who raise others.",
    className: "lg:right-12 lg:bottom-0 lg:-rotate-4",
    mobileClassName: "rotate-[-2deg]",
    duration: 6.9,
    delay: 0.55,
  },
];

export function HomeHero() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="hero-glow relative overflow-hidden text-white">
      <div className="hero-mesh absolute inset-0 opacity-40" />
      <motion.div
        aria-hidden
        className="hero-rays absolute inset-0 opacity-80"
        animate={
          reduceMotion
            ? undefined
            : {
                x: [0, 12, -8, 0],
                y: [0, -10, 8, 0],
              }
        }
        transition={{
          duration: 16,
          ease: "easeInOut",
          repeat: Infinity,
        }}
      />
      <div className="pointer-events-none absolute left-[-8%] top-[16%] h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(255,214,0,0.22),transparent_68%)] blur-3xl" />
      <div className="pointer-events-none absolute right-[6%] top-[20%] h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(235,255,243,0.24),transparent_72%)] blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.08))]" />
      <div className="hero-curve pointer-events-none absolute left-[54%] top-18 hidden h-[480px] w-[480px] -translate-x-1/2 lg:block" />
      <div className="hero-curve pointer-events-none absolute left-[62%] top-26 hidden h-[360px] w-[360px] -translate-x-1/2 lg:block" />

      <Container className="relative grid min-h-[calc(100vh-5rem)] gap-14 py-20 lg:grid-cols-[0.98fr_1.02fr] lg:items-center lg:py-28">
        <div className="max-w-3xl">
          <motion.p
            initial={{ opacity: 1, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease }}
            className="text-[11px] font-semibold uppercase tracking-[0.38em] text-[var(--gold)]"
          >
            PHOTIZO Network International
          </motion.p>

          <div className="mt-6 space-y-1">
            {["Enlightened by Truth.", "Raised for the Kingdom."].map(
              (line, index) => (
                <motion.h1
                  key={line}
                  initial={{ opacity: 1, y: 26 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.8,
                    ease,
                    delay: 0.1 + index * 0.12,
                  }}
                  className="font-display text-5xl font-semibold leading-[0.92] tracking-[-0.055em] text-white sm:text-6xl lg:text-7xl"
                >
                  {line}
                </motion.h1>
              ),
            )}
          </div>

          <motion.p
            initial={{ opacity: 1, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.28 }}
            className="mt-7 max-w-2xl text-base leading-8 text-white/80 sm:text-lg"
          >
            PHOTIZO Network International is committed to evangelizing men,
            raising disciples, and establishing the truth of God&apos;s kingdom in
            hearts across the world.
          </motion.p>

          <motion.div
            initial={{ opacity: 1, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.42 }}
            className="mt-10 flex flex-wrap gap-4"
          >
            <Button href="/programs" size="lg">
              Join a Meeting
            </Button>
            <Button href="/ask-a-question" variant="outline" size="lg">
              Ask a Biblical Question
            </Button>
            <Button href="/salvation" variant="ghost" size="lg">
              I Just Got Saved
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, ease, delay: 0.55 }}
            className="mt-14 hidden items-center gap-3 text-sm text-white/58 sm:flex"
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/14 bg-white/6">
              <ArrowDown className="h-4 w-4 text-[var(--gold)]" />
            </span>
            Scroll to see the ministry vision unfold
          </motion.div>
        </div>

        <div className="relative">
          <div className="relative mx-auto grid max-w-[28rem] gap-4 sm:max-w-[34rem] sm:grid-cols-2 lg:block lg:h-[32rem] lg:max-w-none">
            {floatingCards.map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 1, y: 28, rotate: 0 }}
                animate={
                  reduceMotion
                    ? { opacity: 1, y: 0, rotate: 0 }
                    : {
                        opacity: 1,
                        y: [0, -8, 0, 6, 0],
                        rotate: [0, index % 2 === 0 ? -1 : 1, 0],
                      }
                }
                transition={
                  reduceMotion
                    ? { duration: 0.8, ease, delay: card.delay }
                    : {
                        opacity: { duration: 0.4, ease, delay: card.delay },
                        y: {
                          duration: card.duration,
                          ease: "easeInOut",
                          repeat: Infinity,
                          delay: card.delay + 0.8,
                        },
                        rotate: {
                          duration: card.duration,
                          ease: "easeInOut",
                          repeat: Infinity,
                          delay: card.delay + 0.8,
                        },
                      }
                }
                className={`glass-card relative rounded-[28px] p-5 sm:p-6 lg:absolute lg:w-[16rem] ${card.className} ${card.mobileClassName}`}
              >
                <div className="mb-4 h-px w-14 bg-[linear-gradient(90deg,var(--gold),transparent)]" />
                <div className="font-display text-[1.9rem] font-semibold leading-none tracking-[-0.05em] text-white">
                  {card.title}
                </div>
                <p className="mt-3 text-sm leading-7 text-white/72">
                  {card.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
