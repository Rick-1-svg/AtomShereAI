import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ScreenLayout } from '@/components/ui/ScreenLayout';

export default function ModalScreen() {
  const router = useRouter();

  return (
    <ScreenLayout>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#a5b4fc" />
          </Pressable>
          <ThemedText type="title" style={styles.title}>About</ThemedText>
          <View style={styles.placeholder} />
        </Animated.View>

        {/* App Icon */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.iconContainer}>
          <View style={styles.appIcon}>
            <MaterialCommunityIcons name="weather-partly-cloudy" size={60} color="#a5b4fc" />
          </View>
          <ThemedText type="title" style={styles.appName}>AtomSphere AI</ThemedText>
          <ThemedText style={styles.version}>Version 1.0.1</ThemedText>
        </Animated.View>

        {/* Description */}
        <Animated.View entering={FadeInUp.delay(400).springify()} style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>About the App</ThemedText>
          <ThemedText style={styles.description}>
            AtomSphere AI combines accurate weather data with artificial intelligence to provide you with personalized weather insights and forecasts. Get real-time weather updates, AI-powered predictions, and smart recommendations for your day.
          </ThemedText>
        </Animated.View>

        {/* Features */}
        <Animated.View entering={FadeInUp.delay(500).springify()} style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Features</ThemedText>

          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="weather-cloudy" size={24} color="#38bdf8" />
              <View style={styles.featureText}>
                <ThemedText style={styles.featureTitle}>Real-time Weather</ThemedText>
                <ThemedText style={styles.featureDesc}>Accurate weather data for any location</ThemedText>
              </View>
            </View>

            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="robot-outline" size={24} color="#a5b4fc" />
              <View style={styles.featureText}>
                <ThemedText style={styles.featureTitle}>AI Insights</ThemedText>
                <ThemedText style={styles.featureDesc}>Smart weather predictions and recommendations</ThemedText>
              </View>
            </View>

            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="map-marker" size={24} color="#4ade80" />
              <View style={styles.featureText}>
                <ThemedText style={styles.featureTitle}>Location-based</ThemedText>
                <ThemedText style={styles.featureDesc}>Weather for your current location</ThemedText>
              </View>
            </View>

            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="chart-line" size={24} color="#fbbf24" />
              <View style={styles.featureText}>
                <ThemedText style={styles.featureTitle}>Detailed Forecasts</ThemedText>
                <ThemedText style={styles.featureDesc}>Hourly and daily weather forecasts</ThemedText>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Credits */}
        <Animated.View entering={FadeInUp.delay(600).springify()} style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Credits</ThemedText>
          <View style={styles.creditItem}>
            <ThemedText style={styles.creditLabel}>Weather Data</ThemedText>
            <ThemedText style={styles.creditValue}>OpenWeatherMap API</ThemedText>
          </View>
          <View style={styles.creditItem}>
            <ThemedText style={styles.creditLabel}>AI Technology</ThemedText>
            <ThemedText style={styles.creditValue}>Google Gemini</ThemedText>
          </View>
        </Animated.View>

        {/* Footer */}
        <Animated.View entering={FadeInUp.delay(700).springify()} style={styles.footer}>
          <ThemedText style={styles.footerText}>
            Made with ❤️ for weather enthusiasts
          </ThemedText>
          <ThemedText style={styles.copyright}>
            © 2026 AtomSphere AI. All rights reserved.
          </ThemedText>
        </Animated.View>

        {/* Back to Home Link */}
        <Animated.View entering={FadeInUp.delay(800).springify()} style={styles.linkContainer}>
          <Link href="/" dismissTo asChild>
            <Pressable style={styles.homeButton}>
              <MaterialCommunityIcons name="home" size={20} color="#0f172a" />
              <ThemedText style={styles.homeButtonText}>Go to home screen</ThemedText>
            </Pressable>
          </Link>
        </Animated.View>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  title: {
    fontSize: 24,
    color: '#ffffff',
  },
  placeholder: {
    width: 40,
  },
  iconContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  appIcon: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: 'rgba(165, 180, 252, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(165, 180, 252, 0.3)',
    marginBottom: 20,
  },
  appName: {
    fontSize: 28,
    color: '#ffffff',
    marginBottom: 8,
    fontWeight: '700',
  },
  version: {
    fontSize: 14,
    color: '#94a3b8',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    color: '#ffffff',
    marginBottom: 16,
    fontWeight: '600',
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: '#cbd5e1',
  },
  featuresList: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  featureText: {
    flex: 1,
    gap: 4,
  },
  featureTitle: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  featureDesc: {
    fontSize: 14,
    color: '#94a3b8',
  },
  creditItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  creditLabel: {
    fontSize: 15,
    color: '#94a3b8',
  },
  creditValue: {
    fontSize: 15,
    color: '#a5b4fc',
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 20,
    marginBottom: 16,
  },
  footerText: {
    fontSize: 14,
    color: '#cbd5e1',
    textAlign: 'center',
    marginBottom: 8,
  },
  copyright: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  linkContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    backgroundColor: '#a5b4fc',
    borderRadius: 12,
    shadowColor: '#a5b4fc',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  homeButtonText: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '600',
  },
});
