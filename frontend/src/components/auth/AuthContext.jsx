import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null); // The public.users row
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("Auth session error:", error);
        // If refresh token is invalid or not found, clear the stale session
        if (error.message?.includes('Refresh Token Not Found') || error.status === 400) {
          supabase.auth.signOut();
        }
        setLoading(false);
        return;
      }

      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error("Error fetching user profile:", error);
        // If user profile is not found (maybe deleted from DB), sign out
        if (error.code === 'PGRST116') {
          supabase.auth.signOut();
        }
      } else {
        setUser(data);
      }
    } catch (err) {
      console.error("Failed to fetch profile", err);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    session,
    user,
    role: user?.role || null,
    loading,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};
