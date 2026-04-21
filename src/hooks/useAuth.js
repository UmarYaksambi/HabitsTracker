import { useState, useEffect } from 'react';
import { supabase } from '../db/supabase';

export function useAuth() {
  const [session, setSession] = useState(null);   // Supabase session or null
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // Get current session on mount
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });

    // Listen for auth changes (login / logout / token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  return {
    session,
    user: session?.user ?? null,
    authLoading,
    signInWithGoogle,
    signOut,
    isLoggedIn: !!session,
  };
}