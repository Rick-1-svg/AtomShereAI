// Clear AsyncStorage utility for testing onboarding
// Run this with: npx expo run:web --dev and open console, then run clearOnboardingStorage()

const clearOnboardingStorage = async () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      // Web platform
      window.localStorage.removeItem('onboarding-storage');
      console.log('✅ Onboarding storage cleared from localStorage');
    } else {
      // React Native platform - this would need to be run from within the app
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      await AsyncStorage.removeItem('onboarding-storage');
      console.log('✅ Onboarding storage cleared from AsyncStorage');
    }
    console.log('🔄 Please reload the app to see onboarding screens');
  } catch (error) {
    console.error('❌ Error clearing storage:', error);
  }
};

// For web testing
if (typeof window !== 'undefined') {
  window.clearOnboardingStorage = clearOnboardingStorage;
}

module.exports = { clearOnboardingStorage };