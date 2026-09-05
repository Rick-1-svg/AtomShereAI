import { OnboardingPage } from '@/components/onboarding/OnboardingPage';
import { ThemedText } from '@/components/themed-text';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

export default function OnboardingScreen4() {
  const router = useRouter();

  const handleNext = () => {
    router.push('/onboarding/screen5');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <OnboardingPage stepIndex={3}>
      <View style={styles.iconContainer}>
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <MaterialCommunityIcons name="tune-vertical" size={80} color="#60a5fa" />
        </Animated.View>
      </View>

      <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.textContainer}>
        <ThemedText type="title" style={styles.title}>
          Tailored For You
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Customize your dashboard, themes, and notification preferences to suit your lifestyle.
        </ThemedText>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(600).springify()} style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={handleNext}
        >
          <ThemedText style={styles.buttonText}>Next</ThemedText>
          <MaterialCommunityIcons name="arrow-right" size={20} color="#0f172a" />
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