import { Image, ImageSource } from 'expo-image';
import React from 'react';
import { StyleProp, StyleSheet, View } from 'react-native';

interface ProgressiveImageProps {
    source: ImageSource | string | number | { uri: string };
    placeholder?: ImageSource | string | number | { uri: string } | null;
    style?: StyleProp<any>; // Using any to match expo-image style prop
    contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
    transition?: number;
}

export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
    source,
    placeholder,
    style,
    contentFit = 'cover',
    transition = 500,
}) => {
    return (
        <View style={[styles.container, style]}>
            <Image
                source={source}
                placeholder={placeholder}
                contentFit={contentFit}
                transition={transition}
                style={[StyleSheet.absoluteFill, style]}
                cachePolicy="memory-disk"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'transparent',
        overflow: 'hidden',
    },
});
