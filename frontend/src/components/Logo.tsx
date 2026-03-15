import React from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
}

export default function Logo({ size = 'medium' }: LogoProps) {
  const logoSizes = {
    small: { width: 150, height: 60 },
    medium: { width: 220, height: 88 },
    large: { width: 280, height: 112 },
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/elektro-logo.png')}
        style={[styles.logo, logoSizes[size]]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    // Default size handled by props
  },
});
