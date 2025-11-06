'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { FuturisticBackground } from '@/components/layout/futuristic-background';
import { ButtonGold } from '@/components/ui/button-gold';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { SupabaseConfigCheck } from '@/components/auth/supabase-config-check';

export default function SignUpPage() {
  const router = useRouter();
  const { signUpWithEmail, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!email || !password) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    if (password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    setIsLoading(true);
    try {
      await signUpWithEmail(email, password, displayName || undefined);
      router.push('/game');
    } catch (error) {
      // Error handling is done in the auth context
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    await signInWithGoogle();
  };

  return (
    <main className="min-h-screen relative flex items-center justify-center p-4 pb-32 overflow-hidden">
      <FuturisticBackground />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-6xl"
      >
        <div className="grid md:grid-cols-2 gap-16 md:gap-24 items-center">
          {/* Left Column - Branding & Social Login */}
          <div className="flex flex-col justify-center items-center">
            <div className="text-center space-y-8 w-full max-w-sm">
              <div className="relative inline-block">
                <h1 className="font-display text-7xl md:text-8xl font-bold bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text text-transparent">
                  Tunibet
                </h1>
              </div>
              
              <div className="space-y-3">
                <h2 className="text-3xl font-bold text-white">Join Tunibet</h2>
                <p className="text-lg text-cream/70">Start your winning journey today</p>
              </div>

              <div className="pt-4">
                <ButtonGold
                  variant="outline"
                  size="lg"
                  onClick={handleGoogleSignUp}
                  className="w-full flex items-center justify-center gap-3 backdrop-blur-sm bg-black/20 border-2 border-yellow-500/50 hover:bg-yellow-500/10 transition-all"
                  disabled={isLoading}
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
                  Continuer avec Google
                </ButtonGold>
              </div>

              <div className="text-sm text-cream/50">
                Fast signup with Google
              </div>
            </div>
          </div>

          {/* Right Column - Email/Password Form */}
          <div className="flex flex-col justify-center">
            <div className="w-full max-w-sm mx-auto space-y-8">
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-bold text-white mb-2">Sign Up with Email</h3>
                <p className="text-cream/60">Create your account below</p>
              </div>
              <form onSubmit={handleEmailSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="text-base font-medium text-white">Display Name (optional)</Label>
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="Your nickname"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={isLoading}
                    className="h-13 bg-black/30 backdrop-blur-sm border-2 border-yellow-500/30 text-white placeholder:text-cream/40 focus:border-yellow-500/60"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base font-medium text-white">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-13 bg-black/30 backdrop-blur-sm border-2 border-yellow-500/30 text-white placeholder:text-cream/40 focus:border-yellow-500/60"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-base font-medium text-white">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    minLength={6}
                    className="h-13 bg-black/30 backdrop-blur-sm border-2 border-yellow-500/30 text-white placeholder:text-cream/40 focus:border-yellow-500/60"
                  />
                  <p className="text-xs text-cream/50">
                    Minimum 6 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-base font-medium text-white">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    minLength={6}
                    className="h-13 bg-black/30 backdrop-blur-sm border-2 border-yellow-500/30 text-white placeholder:text-cream/40 focus:border-yellow-500/60"
                  />
                </div>

                <ButtonGold
                  variant="primary"
                  size="lg"
                  type="submit"
                  className="w-full h-14 text-lg shadow-2xl shadow-yellow-500/30 hover:shadow-yellow-500/50 transition-shadow"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
                      Creating...
                    </div>
                  ) : (
                    '📧 Create Account'
                  )}
                </ButtonGold>
              </form>

              <div className="text-center pt-6">
                <span className="text-cream/60">
                  Already have an account?{' '}
                </span>
                <Link
                  href="/auth/signin"
                  className="font-semibold text-yellow-400 hover:text-yellow-300 transition-colors"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Diagnostic Tool - Remove after fixing */}
      <SupabaseConfigCheck />
    </main>
  );
}
