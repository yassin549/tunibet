'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { TrendingUp, Shield, Zap, Users, Sparkles, Trophy, Rocket } from 'lucide-react';
import { FuturisticBackground } from '@/components/layout/futuristic-background';
import { useRef } from 'react';

export default function Home() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  
  const logoY = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <main className="min-h-screen relative">
      <FuturisticBackground />
      
      {/* Hero Section - Two Column Layout */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center px-4 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
            
            {/* Left Column - Branding */}
            <motion.div 
              style={{ y: logoY, opacity }}
              className="text-center md:text-left space-y-8"
            >
              {/* Logo with Floating Animation */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="relative"
              >
                <motion.div
                  animate={{ 
                    y: [0, -20, 0],
                  }}
                  transition={{ 
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <h1 className="font-display text-5xl sm:text-7xl md:text-9xl font-bold bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text text-transparent relative">
                    Tunibet
                  </h1>
                </motion.div>
                
                {/* Sparkle Icons */}
                <motion.div
                  animate={{ 
                    rotate: 360,
                  }}
                  transition={{ 
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  className="absolute -top-8 -right-8"
                >
                  <Sparkles className="w-12 h-12 text-yellow-400" />
                </motion.div>
                <motion.div
                  animate={{ 
                    rotate: -360,
                  }}
                  transition={{ 
                    duration: 15,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  className="absolute -bottom-4 -left-4"
                >
                  <Trophy className="w-10 h-10 text-yellow-500" />
                </motion.div>
              </motion.div>

              {/* Subtitle with Typing Animation */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="space-y-3"
              >
                <h2 className="text-xl sm:text-3xl md:text-4xl font-light text-white">
                  <motion.span 
                    className="text-yellow-400 font-bold"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    Cash Out Smart
                  </motion.span>
                  {' '}— Lock Winnings Before the Crash
                </h2>
              </motion.div>
            </motion.div>

            {/* Right Column - Content & CTA */}
            <motion.div 
              style={{ y: contentY }}
              className="space-y-8"
            >
              {/* Description */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <motion.p 
                    className="text-lg sm:text-2xl md:text-3xl text-white font-semibold"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    Built for Players — Play, Compete, Cash Out
                  </motion.p>
                  <motion.p 
                    className="text-base sm:text-xl md:text-2xl text-yellow-400 font-bold"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    Blockchain-Proven Fair Play
                  </motion.p>
                  <motion.p 
                    className="text-sm sm:text-lg text-gray-400 leading-relaxed"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                  >
                    Play live rounds with provable randomness, climb leaderboards, and convert winnings instantly — audited payouts and guaranteed withdrawals.
                  </motion.p>
                </div>

                {/* Stats Pills */}
                <motion.div 
                  className="flex flex-wrap gap-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="px-6 py-3 rounded-full bg-yellow-500/20 border-2 border-yellow-500/50 backdrop-blur-sm"
                  >
                    <p className="text-yellow-400 font-bold">Audited & Tamper-Proof</p>
                  </motion.div>
                </motion.div>
              </motion.div>

              {/* CTA Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.6 }}
              >
                <Link href="/game">
                  <motion.button
                    whileHover={{ 
                      scale: 1.05,
                      boxShadow: "0 0 40px rgba(234, 179, 8, 0.6)"
                    }}
                    whileTap={{ scale: 0.95 }}
                    className="group relative px-8 sm:px-12 py-4 sm:py-6 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full text-black font-bold text-base sm:text-xl shadow-2xl shadow-yellow-500/50 overflow-hidden"
                  >
                    {/* Shimmer Effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                    <span className="relative flex items-center gap-2 sm:gap-3">
                      <Rocket className="w-5 h-5 sm:w-6 sm:h-6" />
                      Create Account — Play & Win
                    </span>
                  </motion.button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-32 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold text-white mb-4">
              Why Join{' '}
              <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                Tunibet
              </span>
              {' '}— Trusted by 50,000+ Players
            </h2>
            <p className="text-xl text-gray-400">Real-time tournaments, verified fairness, and instant cashouts</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Shield, title: "Audited Fairness", desc: "Independent audits and public proofs — play with confidence", delay: 0.1 },
              { icon: Zap, title: "Instant Payouts", desc: "Withdraw to bank, mobile wallet, or crypto in seconds", delay: 0.2 },
              { icon: TrendingUp, title: "Up to 100x Multipliers", desc: "Turn small bets into big wins with smart auto-cashout options", delay: 0.3 },
              { icon: Users, title: "Signup Rewards & Safe Mode", desc: "Get 5 starter rounds after signup — plus referral bonuses", delay: 0.4 }
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50, scale: 0.9 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ 
                    duration: 0.5, 
                    delay: feature.delay,
                    type: "spring",
                    stiffness: 100
                  }}
                  whileHover={{ 
                    y: -10,
                    transition: { duration: 0.2 }
                  }}
                  className="relative group"
                >
                  <div className="h-full p-8 rounded-2xl bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-2 border-yellow-500/20 backdrop-blur-sm transition-all duration-300 group-hover:border-yellow-500/50 group-hover:shadow-2xl group-hover:shadow-yellow-500/20">
                    {/* Animated Icon */}
                    <motion.div
                      animate={{ 
                        rotate: [0, 10, -10, 0],
                      }}
                      transition={{ 
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="mb-6"
                    >
                      <Icon className="h-16 w-16 text-yellow-400 mx-auto" />
                    </motion.div>
                    
                    <h3 className="text-2xl font-bold text-white mb-3 text-center">
                      {feature.title}
                    </h3>
                    <p className="text-gray-400 text-center leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-32 px-4 pb-40">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <div className="relative p-12 md:p-16 rounded-3xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border-2 border-yellow-500/30 backdrop-blur-xl overflow-hidden">
            {/* Animated Background Pattern */}
            <motion.div
              animate={{ 
                rotate: 360,
              }}
              transition={{ 
                duration: 30,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: "radial-gradient(circle at 20px 20px, rgba(234, 179, 8, 0.3) 1px, transparent 0)",
                backgroundSize: "40px 40px"
              }}
            />

            <div className="relative z-10 text-center space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <h2 className="text-3xl sm:text-5xl md:text-7xl font-bold text-white mb-4">
                  Ready to{' '}
                  <motion.span 
                    className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent"
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    Win Big?
                  </motion.span>
                </h2>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-lg sm:text-2xl text-gray-300"
              >
                Join hundreds of players. Start winning today.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="pt-4"
              >
                <Link href="/game">
                  <motion.button
                    whileHover={{ 
                      scale: 1.08,
                      boxShadow: "0 0 50px rgba(234, 179, 8, 0.7)"
                    }}
                    whileTap={{ scale: 0.95 }}
                    className="px-10 sm:px-20 py-5 sm:py-7 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full text-black font-bold text-lg sm:text-2xl shadow-2xl shadow-yellow-500/50 relative overflow-hidden group"
                  >
                    {/* Pulse Animation */}
                    <motion.div
                      animate={{ 
                        scale: [1, 1.5, 1],
                        opacity: [0.5, 0, 0.5]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                      }}
                      className="absolute inset-0 bg-yellow-300 rounded-full"
                    />
                    <span className="relative flex items-center gap-3 sm:gap-4">
                      <Rocket className="w-6 h-6 sm:w-7 sm:h-7" />
                      Create Account — Play & Win
                    </span>
                  </motion.button>
                </Link>
              </motion.div>

              {/* Trust Indicators */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="flex flex-wrap justify-center gap-6 pt-8 text-sm text-gray-400"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-yellow-400" />
                  <span>Verified & Secure</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span>Instant Payouts</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-yellow-400" />
                  <span>500+ Active Players</span>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </section>
    </main>
  );
}