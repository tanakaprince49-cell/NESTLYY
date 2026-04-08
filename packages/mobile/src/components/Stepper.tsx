import React from 'react';
import { View } from 'react-native';

interface StepperProps {
  totalSteps: number;
  currentStep: number;
}

export function Stepper({ totalSteps, currentStep }: StepperProps) {
  return (
    <View className="flex-row justify-center gap-2 py-4">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <View
          key={i}
          className={`h-2 w-2 rounded-full ${i === currentStep ? 'bg-rose-400' : 'bg-gray-300'}`}
        />
      ))}
    </View>
  );
}
