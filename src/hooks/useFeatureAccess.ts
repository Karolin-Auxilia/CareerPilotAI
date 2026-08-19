import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { isFeatureUnlocked, unlockFeatureWithCredits } from '../services/supabase/database';
import { PREMIUM_FEATURES_CATALOG } from '../services/premium/creditService';

export function useFeatureAccess(featureId: string, customCost?: number) {
  const { user, profile, refreshProfile } = useAuth();
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [unlocking, setUnlocking] = useState<boolean>(false);

  const featureMeta = PREMIUM_FEATURES_CATALOG[featureId];
  const creditCost = customCost ?? featureMeta?.credit_cost ?? 2;
  const isPremiumPlan = profile?.plan === 'premium' || profile?.plan === 'pro';
  const hasEnoughCredits = (profile?.credits ?? 0) >= creditCost;

  const checkStatus = useCallback(async () => {
    if (!user || !profile) {
      setIsUnlocked(false);
      setLoading(false);
      return;
    }

    if (isPremiumPlan) {
      setIsUnlocked(true);
      setLoading(false);
      return;
    }

    try {
      const unlocked = await isFeatureUnlocked(user.id, featureId, profile.plan);
      setIsUnlocked(unlocked);
    } catch {
      setIsUnlocked(false);
    } finally {
      setLoading(false);
    }
  }, [user, profile, isPremiumPlan, featureId]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const unlock = async (): Promise<{ success: boolean; error?: string }> => {
    if (!user || !profile) {
      return { success: false, error: 'Please log in to unlock this feature' };
    }

    if (isUnlocked) {
      return { success: true };
    }

    if (!hasEnoughCredits) {
      return { success: false, error: `You need ${creditCost} credits to unlock this feature` };
    }

    setUnlocking(true);
    try {
      const result = await unlockFeatureWithCredits(
        user.id,
        featureId,
        featureMeta?.feature_name || featureId,
        creditCost
      );

      if (result.success) {
        setIsUnlocked(true);
        await refreshProfile();
        return { success: true };
      } else {
        return { success: false, error: result.error || 'Failed to unlock feature' };
      }
    } catch (e: any) {
      return { success: false, error: e.message || 'An error occurred' };
    } finally {
      setUnlocking(false);
    }
  };

  return {
    isUnlocked,
    loading,
    unlocking,
    creditCost,
    hasEnoughCredits,
    isPremiumPlan,
    currentCredits: profile?.credits ?? 0,
    featureMeta,
    unlock,
    recheck: checkStatus,
  };
}
