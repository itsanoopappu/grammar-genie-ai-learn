import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Profile {
  id: string;
  username: string;
  level: string;
  xp: number;
  streak: number;
  total_lessons: number;
  completed_lessons: number;
}

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setError(null);
      
      // Check if Supabase client is properly initialized
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }

      const { data, error: supabaseError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (supabaseError) {
        throw new Error(`Failed to fetch profile: ${supabaseError.message}`);
      }

      setProfile(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(new Error(errorMessage));
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      setError(null);
      
      if (!user?.id) {
        throw new Error('No authenticated user found');
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (updateError) {
        throw new Error(`Failed to update profile: ${updateError.message}`);
      }
      
      setProfile(prev => prev ? { ...prev, ...updates } : null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(new Error(errorMessage));
      console.error('Error updating profile:', err);
      throw err; // Re-throw to allow handling by the caller
    }
  };

  return { 
    profile, 
    loading, 
    error,
    updateProfile, 
    refetch: fetchProfile 
  };
};