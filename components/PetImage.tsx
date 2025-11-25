import React from 'react';
import { View, Image, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PetImageProps {
  photoUrl?: string | null;
  species?: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other';
  size?: number;
  style?: ViewStyle;
}

const getSpeciesIcon = (species?: string): string => {
  switch (species) {
    case 'dog':
    case 'cat':
    case 'rabbit':
      return 'paw';
    case 'bird':
      return 'egg';
    default:
      return 'paw';
  }
};

const PetImage: React.FC<PetImageProps> = ({ 
  photoUrl, 
  species = 'dog', 
  size = 60,
  style 
}) => {
  const containerStyle = [
    styles.container,
    { width: size, height: size, borderRadius: size / 2 },
    style,
  ];

  if (photoUrl) {
    return (
      <View style={containerStyle}>
        <Image
          source={{ uri: photoUrl }}
          style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
          resizeMode="cover"
        />
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <Ionicons 
        name={getSpeciesIcon(species) as any} 
        size={size * 0.5} 
        color="#0EA5E9" 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

export default PetImage;

