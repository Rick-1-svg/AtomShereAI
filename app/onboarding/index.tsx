import { OnboardingPage } from '@/components/onboarding/OnboardingPage';
import { ThemedText } from '@/components/themed-text';
import { useOnboardingStore } from '@/hooks/stores/use-onboarding-store';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

export default function OnboardingScreen() {
  const { setHasCompletedOnboarding } = useOnboardingStore();
  const router = useRouter();

  const handleNext = () => {
    router.push('/onboarding/screen2');
  };

  const handleSkip = () => {
    setHasCompletedOnboarding(true);
    router.replace('/(tabs)');
  };

  return (
    <OnboardingPage stepIndex={0}>
      <View style={styles.iconContainer}>
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <MaterialCommunityIcons name="creation" size={80} color="#a5b4fc" />
        </Animated.View>
      </View>

      <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.textContainer}>
        <ThemedText type="title" style={styles.title}>
          AtomSphere AI
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Your personal intelligent assistant for weather, tasks, and more.
        </ThemedText>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(600).springify()} style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={handleNext}
        >
          <ThemedText style={styles.buttonText}>Get Started</ThemedText>
          <MaterialCommunityIcons name="arrow-right" size={20} color="#0f172a" />
        </Pressable>

        <Pressable onPress={handleSkip} style={styles.skipButton}>
          <ThemedText style={styles.skipText}>Skip</ThemedText>
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
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 80,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 36,
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
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    width: '80%',
    gap: 8,
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
  skipButton: {
    padding: 10,
  },
  skipText: {
    color: '#94a3b8',
    fontSize: 16,
  },
});
