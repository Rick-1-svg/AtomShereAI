# Onboarding Flow Documentation

## Overview

AtomSphere AI implements a one-time onboarding flow that appears only during the first launch after installation. Subsequent app openings skip the onboarding screens and proceed directly to the main interface.

## How It Works

### 1. First Launch (New Installation)
- `hasCompletedOnboarding` = `false` (default value)
- App shows onboarding screens starting with `/onboarding/index.tsx`
- User goes through 5 onboarding screens:
  1. **Welcome** - Introduction to AtomSphere AI
  2. **Feature Highlights** - What the app can do
  3. **Permissions** - Required permissions explanation
  4. **User Preferences** - Customization options
  5. **Completion** - Final setup and "Get Started" button

### 2. Onboarding Completion
- When user completes onboarding (taps "Get Started" on screen 5)
- `hasCompletedOnboarding` is set to `true`
- State is persisted to AsyncStorage
- App navigates to main interface `/(tabs)`

### 3. Subsequent Launches
- `hasCompletedOnboarding` = `true` (loaded from AsyncStorage)
- App skips onboarding and goes directly to `/(tabs)`
- User sees main app interface immediately

## Implementation Details

### State Management
- **Store**: `hooks/stores/use-onboarding-store.ts`
- **Persistence**: Uses Zustand with AsyncStorage
- **Key**: `'onboarding-storage'`
- **Hydration**: Waits for state to load before navigation decisions

### Navigation Logic
- **Location**: `app/_layout.tsx` in `RootLayoutNav` component
- **Wait for hydration**: Prevents navigation until state loads
- **Smart routing**: Checks current route to avoid unnecessary redirects
- **Modal handling**: Preserves modal navigation

### File Structure
```
app/
├── _layout.tsx                 # Root navigation logic
├── (tabs)/                     # Main app interface
│   ├── index.tsx              # Home screen
│   └── explore.tsx            # Explore screen
└── onboarding/                # Onboarding flow
    ├── _layout.tsx            # Onboarding stack navigation
    ├── index.tsx              # Screen 1: Welcome
    ├── screen2.tsx            # Screen 2: Features
    ├── screen3.tsx            # Screen 3: Permissions
    ├── screen4.tsx            # Screen 4: Preferences
    └── screen5.tsx            # Screen 5: Completion
```

## Key Features

### ✅ One-Time Only
- Onboarding appears only once per installation
- State persists across app restarts
- No way for users to accidentally reset in production

### ✅ Smooth Transitions
- Uses Expo Router for seamless navigation
- Animated screen transitions with Reanimated
- Proper splash screen handling

### ✅ Production Ready
- No debug/test functionality in production build
- Proper error handling and fallbacks
- Clean, documented code

### ✅ User Experience
- Intuitive flow with clear navigation
- Skip option on first screen
- Progress through 5 informative screens
- Clear completion action

## Customization

### Adding New Onboarding Screens
1. Create new screen file: `app/onboarding/screenX.tsx`
2. Update `app/onboarding/_layout.tsx` to include the screen
3. Update navigation in previous screen to link to new screen

### Modifying Content
- Edit individual screen files in `app/onboarding/`
- Update text, images, and interactions as needed
- Maintain consistent styling and animations

### Resetting for Development
For development/testing purposes only, you can reset onboarding by:
```javascript
import { useOnboardingStore } from '@/hooks/stores/use-onboarding-store';

// In a development component
const { setHasCompletedOnboarding } = useOnboardingStore();
setHasCompletedOnboarding(false);
```

**Note**: Never include reset functionality in production builds.

## Troubleshooting

### Onboarding Appears on Every Launch
- Check if AsyncStorage is working properly
- Verify `_hasHydrated` is becoming `true`
- Check console for persistence errors

### Navigation Issues
- Ensure all screen files exist and export default components
- Check `_layout.tsx` files for proper Stack configuration
- Verify route names match file names

### State Not Persisting
- Check AsyncStorage permissions
- Verify Zustand persist configuration
- Look for storage quota issues on device