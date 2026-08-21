// src/components/reviews/PhotoPicker.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

interface PhotoPickerProps {
  value: string | null;       // currently picked image URI, or null
  onChange: (uri: string | null) => void;
}

export const PhotoPicker: React.FC<PhotoPickerProps> = ({ value, onChange }) => {
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return; // user declined — nothing to pick, silently no-op for now
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });

    if (!result.canceled && result.assets.length > 0) {
      onChange(result.assets[0].uri);
    }
  };

  return (
    <View>
      <Pressable
        onPress={pickImage}
        style={styles.button}
        accessibilityRole="button"
        accessibilityLabel="Add a photo of the accessibility feature"
      >
        <Text style={styles.buttonText}>
          {value ? '📷 Change Photo' : '📷 Add Photo (optional)'}
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#2563EB',
    fontWeight: '600',
    fontSize: 14,
  },
});