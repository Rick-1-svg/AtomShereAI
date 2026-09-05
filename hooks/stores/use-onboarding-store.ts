import { platformStorage } from '@/utils/storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * Onboarding state interface
 * 
 * This store manages the one-time onboarding flow:
 * - On first app installation: hasCompletedOnboarding = false, shows onboarding
 * - After onboarding completion: hasCompletedOnboarding = true, goes to main app
 * - On subsequent app launches: hasCompletedOnboarding remains true, skips onboarding
 */
interface OnboardingState {
  /** Whether the user has completed the onboarding flow */
  hasCompletedOnboarding: boolean;
  /** Whether the persisted state has been loaded from AsyncStorage */
  _hasHydrated: boolean;
  /** Set the onboarding completion status */
  setHasCompletedOnboarding: (hasCompleted: boolean) => void;
  /** Internal method to track hydration status */
  setHasHydrated: (hasHydrated: boolean) => void;
  /** Clear all onboarding data (for testing/development) */
  clearOnboardingData: () => void;
}

/**
 * Onboarding store with persistent state
 * 
 * This store uses Zustand with persistence to AsyncStorage.
 * The onboarding state persists across app restarts, ensuring
 * users only see onboarding once after installation.
 */
export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      // Default to false for new installations
      hasCompletedOnboarding: false,
      _hasHydrated: false,
      setHasCompletedOnboarding: (hasCompleted) => set({ hasCompletedOnboarding: hasCompleted }),
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      clearOnboardingData: () => set({ hasCompletedOnboarding: false, _hasHydrated: false }),
    }),
    {
      name: 'onboarding-storage', // Storage key
      storage: createJSONStorage(() => platformStorage),
      onRehydrateStorage: () => (state) => {
        // Mark as hydrated when state is loaded from storage
        state?.setHasHydrated(true);
      },
    }
  )
);
