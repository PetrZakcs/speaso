import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import PaywallView, { type PaywallContext } from '../../components/paywall/PaywallView';

export default function PaywallScreen() {
  const { context } = useLocalSearchParams<{ context?: PaywallContext }>();
  return (
    <PaywallView
      context={context}
      onClose={() => router.back()}
      onUnlocked={() => router.replace('/paywall/post-purchase')}
    />
  );
}
