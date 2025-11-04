'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useStore } from '@/stores/useStore';
import { initGuestDemo, getGuestDemoAsUser } from '@/lib/guest-demo';
import { FuturisticBackground } from '@/components/layout/futuristic-background';
import { ButtonGold } from '@/components/ui/button-gold';
import { CardClassic, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card-classic';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signInWithGoogle, signInWithEmail, user, isLoading } = useAuth();
  const { setUser } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    // Check for auth errors
    const error = searchParams.get('error');
    if (error === 'auth_failed') {
      toast.error('Login failed. Please try again.');
    }

    // Redirect if already authenticated
    if (user && !isLoading) {
      router.push('/game');
    }
  }, [user, isLoading, searchParams, router]);

  const handleGuestDemo = () => {
    // Check if guest demo already exists
    const existingGuest = getGuestDemoAsUser();
    
    if (existingGuest) {
      setUser(existingGuest);
      toast.success('Demo session restored!');
    } else {
      const guestUser = initGuestDemo();
      setUser(guestUser);
      toast.success('Demo mode activated! Balance: 1000 TND');
    }

    router.push('/game');
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSigningIn(true);
    try {
      await signInWithEmail(email, password);
      router.push('/game');
    } catch (error) {
      // Error handling is done in auth context
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleGoogleSignIn = async () => {
    await signInWithGoogle();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen relative">
        <FuturisticBackground />
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center space-y-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-gold border-t-transparent mx-auto" />
            <p className="text-white">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      <FuturisticBackground />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-5xl"
      >
        <CardClassic variant="glass" hover={false}>
          <CardContent className="p-0">
            <div className="grid md:grid-cols-2 gap-0">
              {/* Left Column - Branding & Social Login */}
              <div className="p-8 md:p-12 flex flex-col justify-center items-center bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-r border-gold/20">
                <div className="text-center space-y-6 w-full max-w-sm">
                  <div className="relative inline-block">
                    <h1 className="font-display text-6xl md:text-7xl font-bold bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text text-transparent">
                      Tunibet
                    </h1>
                    <div className="absolute -inset-6 bg-gradient-to-r from-yellow-400/20 to-yellow-600/20 blur-3xl -z-10" />
                  </div>
                  
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
                    <p className="text-cream/60">Sign in to continue playing</p>
                  </div>

                  <div className="pt-4">
                    <ButtonGold
                      variant="outline"
                      size="lg"
                      onClick={handleGoogleSignIn}
                      className="w-full flex items-center justify-center gap-3 hover:bg-white/5 transition-all"
                      disabled={isSigningIn}
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Continue with Google
                    </ButtonGold>
                  </div>

                  <div className="text-xs text-cream/50">
                    By continuing, you accept our{' '}
                    <Link href="#" className="text-gold hover:text-yellow-400 transition-colors">
                      terms of service
                    </Link>
                  </div>
                </div>
              </div>

              {/* Right Column - Email/Password Form */}
              <div className="p-8 md:p-12 flex flex-col justify-center">
                <div className="w-full max-w-sm mx-auto space-y-6">
                  <div className="text-center md:text-left">
                    <h3 className="text-xl font-bold text-white mb-1">Sign In with Email</h3>
                    <p className="text-sm text-cream/60">Enter your credentials below</p>
                  </div>
                  <form onSubmit={handleEmailSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-cream/90">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isSigningIn}
                        className="h-12"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-medium text-cream/90">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isSigningIn}
                        className="h-12"
                      />
                    </div>

                    <ButtonGold
                      variant="primary"
                      size="lg"
                      type="submit"
                      className="w-full shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/30 transition-shadow"
                      disabled={isSigningIn}
                    >
                      {isSigningIn ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                          Signing in...
                        </span>
                      ) : (
                        '🔑 Sign In'
                      )}
                    </ButtonGold>
                  </form>

                  <div className="text-center text-sm pt-4 border-t border-gold/20">
                    <span className="text-cream/60">
                      Don't have an account?{' '}
                    </span>
                    <Link
                      href="/auth/signup"
                      className="font-semibold text-gold hover:text-yellow-400 transition-colors"
                    >
                      Create Account
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </CardClassic>
      </motion.div>
    </main>
  );
}
