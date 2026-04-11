import React from 'react';
import { LifecycleStage } from '@nestly/shared';
import { useProfileStore } from '@nestly/shared/stores';
import { FeedingTrackerScreen } from './FeedingTrackerScreen';
import { NutritionTrackerScreen } from './NutritionTrackerScreen';

// Routes the "Feeding" stack slot to the stage-appropriate tracker.
// Pregnancy / pre-pregnancy users see nutrition logging (maternal intake);
// postpartum users see infant feeding logs. Keeps the FeedingTracker stack
// entry safe to navigate from anywhere regardless of lifecycle stage.
export function FeedingRouter() {
  const { profile } = useProfileStore();
  const isPregnancyLike =
    profile?.lifecycleStage === LifecycleStage.PREGNANCY ||
    profile?.lifecycleStage === LifecycleStage.PRE_PREGNANCY;
  return isPregnancyLike ? <NutritionTrackerScreen /> : <FeedingTrackerScreen />;
}
