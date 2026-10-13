import React, { useEffect } from 'react';
import { router } from 'expo-router';
import { useTranslation } from '../../i18n/useTranslation';
import { useStore } from '../../state/store';
import { asGoal } from '../../lib/goals';
import PaywallView from '../../components/paywall/PaywallView';

/**
 * End of onboarding: the offer, after the user has a plan and a first win.
 * "Continue for free" is always available and finishes onboarding too.
 */
export default function Offer() {
  const { t } = useTranslation();
  const goal = asGoal(useStore((s) => s.user.goal));
  const scenario = useStore((s) => s.scenarios[0]);
  const isPremium = useStore((s) => s.subscription.isPremium);
  const setOnboardingDone = useStore((s) => s.setOnboardingDone);

  const finish = () => {
    setOnboardingDone(true);
    router.replace('/(tabs)/home');
  };

  // Already Premium (e.g. restored earlier) — nothing to offer.
  useEffect(() => {
    if (isPremium) finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPremium]);

  return (
    <PaywallView
      context="onboarding"
      title={t('onboarding.offer_title')}
      // The user's own scenario is the most personal hook; fall back to the goal.
      tagline={scenario
        ? t('onboarding.offer_tagline_scenario', { title: scenario.title })
        : goal ? t(`onboarding.offer_tagline_${goal}`) : t('premium.tagline')}
      closeLabel={t('onboarding.offer_continue_free')}
      onClose={finish}
      onUnlocked={finish}
    />
  );
}
