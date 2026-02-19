import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AppRole } from '@/types/database';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import { useIdleTimeoutSetting } from '@/hooks/useIdleTimeoutSetting';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, role: AppRole, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = async (userId: string): Promise<AppRole | null> => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user role:', error);
      return null;
    }
    return data?.role as AppRole;
  };

  // Ensure student record exists for student role
  const ensureStudentRecord = async (userId: string) => {
    const { data: existingStudent } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!existingStudent) {
      await supabase.from('students').insert({ user_id: userId });
    }
  };

  // Ensure company record exists for company role
  const ensureCompanyRecord = async (userId: string, fullName: string) => {
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!existingCompany) {
      await supabase.from('companies').insert({ user_id: userId, name: fullName || 'My Company' });
    }
  };

  useEffect(() => {
    // Set up auth state listener - keep it synchronous to avoid deadlocks
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Defer async operations with setTimeout to prevent deadlocks
          setTimeout(async () => {
            const userRole = await fetchUserRole(session.user.id);
            setRole(userRole);
            
            // Ensure related records exist based on role
            if (userRole === 'student') {
              await ensureStudentRecord(session.user.id);
            } else if (userRole === 'company') {
              const { data: profile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('user_id', session.user.id)
                .single();
              await ensureCompanyRecord(session.user.id, profile?.full_name || 'My Company');
            }
          }, 0);
        } else {
          setRole(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const userRole = await fetchUserRole(session.user.id);
        setRole(userRole);
        
        // Ensure related records exist based on role
        if (userRole === 'student') {
          await ensureStudentRecord(session.user.id);
        } else if (userRole === 'company') {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', session.user.id)
            .single();
          await ensureCompanyRecord(session.user.id, profile?.full_name || 'My Company');
        }
        
        setLoading(false);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, userRole: AppRole, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) return { error: error as Error };

    if (data.user) {
      // Create profile
      const { error: profileError } = await supabase.from('profiles').insert({
        user_id: data.user.id,
        email,
        full_name: fullName,
      });

      if (profileError) {
        console.error('Error creating profile:', profileError);
      }

      // Create user role
      const { error: roleError } = await supabase.from('user_roles').insert({
        user_id: data.user.id,
        role: userRole,
      });

      if (roleError) {
        console.error('Error creating user role:', roleError);
      }

      // Create company or student record based on role
      if (userRole === 'company') {
        const { error: companyError } = await supabase.from('companies').insert({
          user_id: data.user.id,
          name: fullName,
        });
        if (companyError) console.error('Error creating company:', companyError);
      } else {
        const { error: studentError } = await supabase.from('students').insert({
          user_id: data.user.id,
        });
        if (studentError) console.error('Error creating student:', studentError);
      }
    }

    return { error: null };
  };

  const signOut = useCallback(async () => {
    // Clear state first for immediate UI feedback
    setUser(null);
    setSession(null);
    setRole(null);
    
    // Then sign out from Supabase
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
  }, []);

  // Auto-logout after configured idle timeout
  const idleTimeoutMs = useIdleTimeoutSetting();
  useIdleTimeout(signOut, !!user, idleTimeoutMs);

  return (
    <AuthContext.Provider value={{ user, session, role, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
