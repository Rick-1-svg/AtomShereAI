import { ThemedText } from '@/components/themed-text';
import { Fonts } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface MetricDetailModalProps {
    visible: boolean;
    onClose: () => void;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    iconColor: string;
    label: string;
    value: string;
    description: string;
}

/**
 * Modal that displays detailed information about a weather metric.
 * Used instead of inline expansion to prevent layout shifts.
 */
export const MetricDetailModal: React.FC<MetricDetailModalProps> = ({
    visible,
    onClose,
    icon,
    iconColor,
    label,
    value,
    description,
}) => {
    return (
        <Modal
            animationType="fade"
            transparent
            visible={visible}
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <Pressable style={styles.backdrop} onPress={onClose}>
                <Animated.View
                    entering={FadeIn.duration(200)}
                    exiting={FadeOut.duration(150)}
                    style={styles.modalContainer}
                >
                    <Pressable onPress={(e) => e.stopPropagation()}>
                        <BlurView
                            intensity={80}
                            tint="dark"
                            style={styles.modalContent}
                        >
                            <View style={styles.header}>
                                <View style={styles.iconContainer}>
                                    <MaterialCommunityIcons
                                        name={icon}
                                        size={32}
                                        color={iconColor}
                                    />
                                </View>
                                <Pressable
                                    onPress={onClose}
                                    style={styles.closeButton}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <MaterialCommunityIcons
                                        name="close"
                                        size={24}
                                        color="#94a3b8"
                                    />
                                </Pressable>
                            </View>

                            <ThemedText style={styles.label}>{label}</ThemedText>
                            <ThemedText style={styles.value}>{value}</ThemedText>

                            <View style={styles.divider} />

                            <ScrollView
                                style={styles.descriptionScroll}
                                showsVerticalScrollIndicator={false}
                            >
                                <ThemedText style={styles.description}>
                                    {description}
                                </ThemedText>
                            </ScrollView>
                        </BlurView>
                    </Pressable>
                </Animated.View>
            </Pressable>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 360,
    },
    modalContent: {
        borderRadius: 24,
        padding: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        ...Platform.select({
            android: {
                backgroundColor: 'rgba(30, 30, 50, 0.95)',
            },
            web: {
                backgroundColor: 'rgba(30, 30, 50, 0.95)',
            },
        }),
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        fontSize: 14,
        fontFamily: Fonts.sans,
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    value: {
        fontSize: 30,
        //marginTop: 5,
        fontFamily: Fonts.rounded,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 20,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        marginBottom: 16,
    },
    descriptionScroll: {
        maxHeight: 200,
    },
    description: {
        fontSize: 15,
        fontFamily: Fonts.sans,
        color: '#e2e8f0',
        lineHeight: 22,
    },
});
