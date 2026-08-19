import { supabase, isConfigured } from './client';
import { UserProfile } from '../../types';

export async function signUp(
  email: string,
  password: string,
  fullName: string
): Promise<{ user: any; profile: UserProfile | null; error: string | null }> {
  if (!isConfigured || !supabase) {
    return {
      user: null,
      profile: null,
      error:
        'Supabase database is not connected. Please connect your Supabase Project URL and Anon Key so your registration can be stored directly in the database.',
    };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (error) {
      return { user: null, profile: null, error: error.message };
    }

    if (!data.user) {
      return { user: null, profile: null, error: 'Registration failed to create user.' };
    }

    const userId = data.user.id;

    // Fetch existing profile or create new one in Supabase database
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    let profile: UserProfile = profileData;

    if (!profile) {
      const newProfile: UserProfile = {
        id: userId,
        full_name: fullName,
        email: email,
        plan: 'free',
        credits: 5,
        target_career: 'Software Engineer',
        bio: 'Professional navigating modern technology career pathways.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: insertedProfile, error: profileError } = await supabase
        .from('profiles')
        .insert([newProfile])
        .select()
        .single();

      if (profileError) {
        console.warn('Profile insertion note:', profileError.message);
        profile = newProfile;
      } else {
        profile = insertedProfile;
      }

      // Record welcome credits in database
      try {
        await supabase.from('credit_transactions').insert([
          {
            user_id: userId,
            transaction_type: 'BONUS',
            amount: 5,
            feature: 'welcome_bonus',
            description: 'Welcome bonus credits for joining CareerPilotAI',
          },
        ]);
      } catch (txError) {
        console.warn('Welcome credit transaction note:', txError);
      }
    }

    return { user: data.user, profile, error: null };
  } catch (err: any) {
    return { user: null, profile: null, error: err.message || 'Signup failed' };
  }
}

export async function signIn(
  email: string,
  password: string
): Promise<{ user: any; profile: UserProfile | null; error: string | null }> {
  if (!isConfigured || !supabase) {
    return {
      user: null,
      profile: null,
      error:
        'Supabase database is not connected. Please connect your Supabase Project URL and Anon Key to log into your account.',
    };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { user: null, profile: null, error: error.message };
    }

    if (!data.user) {
      return { user: null, profile: null, error: 'User not found in Supabase database.' };
    }

    const userId = data.user.id;

    // Fetch user profile from Supabase database
    const { data: profileData, error: profileFetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    let profile: UserProfile = profileData;

    if (!profile) {
      // Create profile row if it does not exist yet
      const newProfile: UserProfile = {
        id: userId,
        full_name: data.user.user_metadata?.full_name || email.split('@')[0] || 'Member',
        email: email,
        plan: 'free',
        credits: 5,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      try {
        const { data: created } = await supabase
          .from('profiles')
          .insert([newProfile])
          .select()
          .single();
        profile = created || newProfile;
      } catch {
        profile = newProfile;
      }
    }

    return { user: data.user, profile, error: null };
  } catch (err: any) {
    return { user: null, profile: null, error: err.message || 'Login failed' };
  }
}

export async function signOut(): Promise<{ error: string | null }> {
  if (isConfigured && supabase) {
    const { error } = await supabase.auth.signOut();
    return { error: error ? error.message : null };
  }
  return { error: null };
}

export async function getCurrentUser(): Promise<{ user: any; profile: UserProfile | null }> {
  if (isConfigured && supabase) {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return { user: null, profile: null };

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      return { user: session.user, profile };
    } catch {
      return { user: null, profile: null };
    }
  }

  return { user: null, profile: null };
}

export async function updateProfile(
  userId: string,
  updates: Partial<UserProfile>
): Promise<{ profile: UserProfile | null; error: string | null }> {
  if (!isConfigured || !supabase) {
    return { profile: null, error: 'Supabase database is not connected.' };
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    return { profile: data, error: error ? error.message : null };
  } catch (err: any) {
    return { profile: null, error: err.message };
  }
}
