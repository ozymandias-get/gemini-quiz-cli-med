import { create } from 'zustand';
import { AppStep } from '../types';

interface RoutingState {
  step: AppStep;
  setStep: (step: AppStep) => void;
}

export const useRoutingStore = create<RoutingState>((set) => ({
  step: AppStep.LANDING,
  setStep: (step) => set({ step }),
}));
