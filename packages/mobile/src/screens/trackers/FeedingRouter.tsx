import React, { useLayoutEffect } from 'react';
import { LifecycleStage } from '@nestly/shared';
import { useProfileStore } from '@nestly/shared/stores';
import { useNavigation } from '@react-navigation/native';
import { FeedingTrackerScreen } from './FeedingTrackerScreen';
import { NutritionTrackerScreen } from './NutritionTrackerScreen';

// Routes the "Feeding" stack slot to the stage-appropriate tracker.
// Pregnancy / pre-pregnancy users see nutrition logging (maternal intake);
// postpartum users see infant feeding logs. Keeps the FeedingTracker stack
// entry safe to navigate from anywhere regardless of lifecycle stage.
//
// The stack entry is registered with a static "Feeding" title, so we override
// the header title in a layout effect to match the resolved child. Without
// this, a pregnancy-stage user taps "Feeding" in the hub and sees a "Feeding"
// header above the Nutrition form, which is confusing. See #236.
export function FeedingRouter() {
  const { profile } = useProfileStore();
  const navigation = useNavigation();
  const isPregnancyLike =
    profile?.lifecycleStage === LifecycleStage.PREGNANCY ||
    profile?.lifecycleStage === LifecycleStage.PRE_PREGNANCY;

  useLayoutEffect(() => {
    navigation.setOptions({ title: isPregnancyLike ? 'Nutrition' : 'Feeding' });
  }, [navigation, isPregnancyLike]);

  return isPregnancyLike ? <NutritionTrackerScreen /> : <FeedingTrackerScreen />;
}
