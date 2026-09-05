import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Paginator } from './Paginator';

// Define the total number of onboarding steps
const TOTAL_STEPS = 5;
const STEPS_ARRAY = new Array(TOTAL_STEPS).fill(0);

interface OnboardingPageProps {
    children: React.ReactNode;
    stepIndex: number; // 0-based index
}

export const OnboardingPage = ({ children, stepIndex }: OnboardingPageProps) => {
    const insets = useSafeAreaInsets();

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <LinearGradient
                // Deep purple/blue gradient for a "cosmic/atom" feel
                colors={['#0f172a', '#1e1b4b', '#312e81']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                <View style={[styles.contentContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
                    <View style={styles.mainContent}>
                        {children}
                    </View>

                    <View style={styles.footer}>
                        <Paginator data={STEPS_ARRAY} currentIndex={stepIndex} />
                    </View>
                </View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: 20,
    },
    mainContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    footer: {
        paddingVertical: 20,
        alignItems: 'center',
    },
});
