'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useStore, User } from '@/stores/useStore';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  isLoading: boolean;
  isGuest: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user, setUser } = useStore();
  const supabase = createClient();

  // Check if user is guest (no Supabase auth)
  const isGuest = !supabaseUser && !!user;

  // Fetch user data from database
  const fetchUserData = async (authUser: SupabaseUser) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        // User doesn't exist in DB, create them
        const newUser = {
          id: authUser.id,
          email: authUser.email!,
          display_name: 
            authUser.user_metadata.display_name || 
            authUser.user_metadata.full_name || 
            authUser.email?.split('@')[0],
          google_id: authUser.user_metadata.sub,
          demo_balance: 1000.00,
          live_balance: 0.00,
          is_admin: false,
          is_banned: false,
          // balance_type and virtual_balance_saved will use database defaults
        };

        console.log('Attempting to create user with ID:', authUser.id);
        console.log('User data to insert:', newUser);

        const { data: createdUser, error: createError } = await supabase
          .from('users')
          .insert([newUser])
          .select()
          .single();

        if (createError) {
          console.error('Error creating user:', {
            message: createError.message,
            details: createError.details,
            hint: createError.hint,
            code: createError.code,
            fullError: JSON.stringify(createError)
          });
          
          // If user already exists, try to fetch it instead
          if (createError.code === '23505') { // Unique violation
            const { data: existingUser } = await supabase
              .from('users')
              .select('*')
              .eq('id', authUser.id)
              .single();
            
            if (existingUser) {
              setUser(existingUser as User);
              toast.success('Welcome back!');
              return;
            }
          }
          
          toast.error(`Database error: ${createError.message || 'Please contact support'}`);
          // Sign out user if we can't create their record
          await supabase.auth.signOut();
          return;
        }

        setUser(createdUser as User);
        toast.success('Compte créé avec succès!');
      } else {
        setUser(data as User);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setSupabaseUser(session.user);
          await fetchUserData(session.user);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setSupabaseUser(session.user);
          await fetchUserData(session.user);
        } else {
          setSupabaseUser(null);
          setUser(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Subscribe to user balance changes
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`user:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          setUser(payload.new as User);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast.error('Erreur de connexion');
        console.error('Sign in error:', error);
      }
    } catch (error) {
      console.error('Sign in error:', error);
      toast.error('Erreur de connexion');
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Email ou mot de passe incorrect');
        } else {
          toast.error('Erreur de connexion');
        }
        console.error('Sign in error:', error);
        throw error;
      }

      if (data.user) {
        await fetchUserData(data.user);
        toast.success('Connexion réussie!');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, displayName?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`,
          data: {
            display_name: displayName || email.split('@')[0],
          },
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('Cet email est déjà utilisé');
        } else if (error.message.includes('invalid')) {
          toast.error('Email invalide. Vérifiez la configuration Supabase Auth.');
        } else if (error.message.includes('Unable to validate email')) {
          toast.error('Configuration email manquante. Désactivez la confirmation email dans Supabase.');
        } else {
          toast.error('Erreur lors de l\'inscription');
        }
        console.error('Sign up error:', error);
        throw error;
      }

      if (data.user) {
        // fetchUserData will auto-create the user record if it doesn't exist
        await fetchUserData(data.user);
      }
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSupabaseUser(null);
      toast.success('Déconnecté avec succès');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Erreur de déconnexion');
    }
  };

  const refreshUser = async () => {
    if (supabaseUser) {
      await fetchUserData(supabaseUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        supabaseUser,
        isLoading,
        isGuest,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
