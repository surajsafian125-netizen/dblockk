import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import { isEmailConfirmed } from '@/lib/authUser';
import { normalizeEmail, validateSignupEmail } from '@/lib/emailValidation';
import { signInWithGoogle } from '@/lib/googleAuth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  signup: (
    name: string,
    email: string,
    password: string,
  ) => Promise<{ error?: string; needsConfirmation?: boolean }>;
  loginWithGoogle: () => Promise<{ error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Refs to prevent duplicate work / stale state across re-renders
  const mountedRef = useRef(true);
  const lastUserIdRef = useRef<string | null>(null);
  const adminCheckTokenRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;

    const applySession = (session: Session | null, { initial = false } = {}) => {
      if (!mountedRef.current) return;
      const rawUser = session?.user ?? null;
      if (rawUser && !isEmailConfirmed(rawUser)) {
        lastUserIdRef.current = null;
        setUser(null);
        setIsAdmin(false);
        adminCheckTokenRef.current++;
        if (initial) setIsLoading(false);
        setTimeout(() => {
          supabase.auth.signOut();
        }, 0);
        return;
      }
      const nextUser = rawUser;
      const nextUserId = nextUser?.id ?? null;
      const userChanged = nextUserId !== lastUserIdRef.current;

      setUser(nextUser);

      if (!nextUser) {
        // Wipe all derived state immediately on sign-out / session loss
        lastUserIdRef.current = null;
        setIsAdmin(false);
        adminCheckTokenRef.current++; // invalidate any in-flight admin check
        if (initial) setIsLoading(false);
        return;
      }

      if (userChanged) {
        lastUserIdRef.current = nextUserId;
        const token = ++adminCheckTokenRef.current;
        // Defer to avoid Supabase client deadlock inside auth callback
        setTimeout(async () => {
          try {
            const { data } = await supabase.rpc('has_role', {
              _user_id: nextUser.id,
              _role: 'admin',
            });
            if (!mountedRef.current) return;
            if (token !== adminCheckTokenRef.current) return; // stale
            setIsAdmin(!!data);
          } catch {
            if (mountedRef.current && token === adminCheckTokenRef.current) {
              setIsAdmin(false);
            }
          } finally {
            if (mountedRef.current && initial) setIsLoading(false);
          }
        }, 0);
      } else if (initial) {
        setIsLoading(false);
      }
    };

    // 1. Singleton listener — set up BEFORE getSession
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          applySession(null);
        } else {
          applySession(session);
        }
      }
    );

    // 2. Restore initial session from storage
    supabase.auth.getSession().then(({ data: { session } }) => {
      applySession(session, { initial: true });
    });

    // 3. Strict cleanup
    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizeEmail(email),
      password,
    });
    if (error) return { error: error.message };
    if (data.user && !isEmailConfirmed(data.user)) {
      await supabase.auth.signOut();
      return { error: 'Please check your inbox to confirm your email before signing in.' };
    }
    return {};
  };

  const signup = async (name: string, email: string, password: string) => {
    const emailError = validateSignupEmail(email);
    if (emailError) return { error: emailError };

    const { data, error } = await supabase.auth.signUp({
      email: normalizeEmail(email),
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) return { error: error.message };
    if (!data.session) return { needsConfirmation: true };
    if (data.user && !isEmailConfirmed(data.user)) {
      await supabase.auth.signOut();
      return { needsConfirmation: true };
    }
    return {};
  };

  const loginWithGoogle = () => signInWithGoogle();

  const logout = async () => {
    // Clear local state first to prevent any guarded UI from re-firing
    lastUserIdRef.current = null;
    adminCheckTokenRef.current++;
    setUser(null);
    setIsAdmin(false);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: isEmailConfirmed(user),
      isLoading,
      isAdmin,
      login,
      signup,
      loginWithGoogle,
      logout,
    }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};
