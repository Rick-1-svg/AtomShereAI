import { OnboardingPage } from '@/components/onboarding/OnboardingPage';
import { ThemedText } from '@/components/themed-text';
import { useOnboardingStore } from '@/hooks/stores/use-onboarding-store';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

export default function OnboardingScreen5() {
  const router = useRouter();
  const { setHasCompletedOnboarding } = useOnboardingStore();

  const handleComplete = () => {
    setHasCompletedOnboarding(true);
    router.replace('/(tabs)');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <OnboardingPage stepIndex={4}>
      <View style={styles.iconContainer}>
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <MaterialCommunityIcons name="check-circle" size={80} color="#34d399" />
        </Animated.View>
      </View>

      <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.textContainer}>
        <ThemedText type="title" style={styles.title}>
          All Set!
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          You're ready to experience local-first, privacy-focused AI intelligence.
        </ThemedText>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(600).springify()} style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={handleComplete}
        >
          <ThemedText style={styles.buttonText}>Start Exploring</ThemedText>
          <View style={styles.checkIconContainer}>
            <MaterialCommunityIcons name="check" size={16} color="#4ade80" />
          </View>
        </Pressable>

        <Pressable onPress={handleBack} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={20} color="#94a3b8" />
          <ThemedText style={styles.backText}>Back</ThemedText>
        </Pressable>
      </Animated.View>
    </OnboardingPage>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
    width: 160,
    height: 160,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 80,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    color: 'white',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 18,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 20,
  },
  actions: {
    gap: 20,
    alignItems: 'center',
    width: '100%',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingLeft: 32,
    paddingRight: 16,
    borderRadius: 30,
    width: '80%',
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  checkIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
  },
  backText: {
    color: '#94a3b8',
    fontSize: 16,
  },
});
