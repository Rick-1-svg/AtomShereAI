import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useMemo } from 'react';
import { Dimensions, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Default gradient colors (fallback)
const DEFAULT_GRADIENT_COLORS: readonly [string, string, string] = ['#0f172a', '#1e1b4b', '#312e81'];

interface ScreenLayoutProps {
    children: React.ReactNode;
    /* 
     * Optional custom padding. 
     * If true, applies standard padding. 
     * If false, no padding (good for parallax). 
     */
    hasPadding?: boolean;
    /*
     * Whether to apply safe area insets.
     * Default: true. Set to false for full-screen attributes (maps, parallax).
     */
    useSafeArea?: boolean;
    /**
     * Optional gradient colors for dynamic weather theming.
     * Should be an array of 3 color strings.
     * Falls back to default dark gradient if not provided.
     */
    gradientColors?: readonly [string, string, string];
    /**
     * Status bar style. Defaults to 'light'.
     * Use 'dark' for light backgrounds (e.g., snow theme).
     */
    statusBarStyle?: 'light' | 'dark';
}

export const ScreenLayout = ({
    children,
    hasPadding = false,
    useSafeArea = true,
    gradientColors,
    statusBarStyle = 'light',
}: ScreenLayoutProps) => {
    const insets = useSafeAreaInsets();

    // Validate and memoize gradient colors
    const validatedColors = useMemo(() => {
        if (!gradientColors) {
            return DEFAULT_GRADIENT_COLORS;
        }

        // Validate it's an array of 3 strings
        if (!Array.isArray(gradientColors) || gradientColors.length !== 3) {
            console.warn('[ScreenLayout] Invalid gradientColors, using default');
            return DEFAULT_GRADIENT_COLORS;
        }

        // Validate each color is a string
        const isValid = gradientColors.every(
            (color) => typeof color === 'string' && color.length > 0
        );

        if (!isValid) {
            console.warn('[ScreenLayout] Invalid color values in gradientColors, using default');
            return DEFAULT_GRADIENT_COLORS;
        }

        return gradientColors;
    }, [gradientColors]);

    return (
        <View style={styles.container}>
            <StatusBar style={statusBarStyle} />
            <LinearGradient
                // Dynamic gradient colors based on weather
                colors={[...validatedColors]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                <View
                    style={[
                        styles.contentContainer,
                        {
                            // We only apply top inset if we aren't handling it inside children (like headers)
                            // But for safety, standard screens might want it.
                            // For now, let's expose safe area but let children handle padding if needed, 
                            // or just use flex 1.
                            paddingTop: useSafeArea ? insets.top : 0,
                            paddingBottom: useSafeArea ? insets.bottom : 0
                        }
                    ]}
                >
                    {children}
                </View>
            </LinearGradient>
        </View>
    );
};

// Get window dimensions for web height calculation
const { height: windowHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        flex: 1,
        ...Platform.select({
            web: {
                minHeight: windowHeight,
            },
            default: {},
        }),
    },
    gradient: {
        flex: 1,
        ...Platform.select({
            web: {
                minHeight: windowHeight,
            },
            default: {},
        }),
    },
    contentContainer: {
        flex: 1,
    },
});
