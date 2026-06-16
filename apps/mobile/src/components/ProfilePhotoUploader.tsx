import { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, User } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { rounded } from '../theme/rounded';
import { typography } from '../theme/typography';
import { Button } from './ui/Button';

interface ProfilePhotoUploaderProps {
  photoUrl: string | null;
  displayName: string;
  onPhotoChange: (url: string) => void | Promise<void>;
}

export function ProfilePhotoUploader({
  photoUrl,
  displayName,
  onPhotoChange,
}: ProfilePhotoUploaderProps) {
  const [uploading, setUploading] = useState(false);

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const handlePickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Gallery access is needed to upload a profile photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    if (!asset.uri) return;

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const ext = asset.fileName?.split('.').pop() ?? 'jpg';
      const filePath = `profiles/${user.id}/photo_${Date.now()}.${ext}`;

      const response = await fetch(asset.uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, blob, {
          contentType: asset.mimeType ?? 'image/jpeg',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) throw new Error('Failed to get public URL');

      const { error: updateError } = await (supabase as any)
        .from('profiles')
        .update({ profile_photo_url: urlData.publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await onPhotoChange(urlData.publicUrl);
    } catch (err) {
      Alert.alert('Upload Failed', err instanceof Error ? err.message : 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={handlePickPhoto}
        disabled={uploading}
        style={styles.avatarContainer}
        accessibilityRole="button"
        accessibilityLabel="Change profile photo"
      >
        {photoUrl ? (
          <View style={styles.avatarImage}>
            <Text style={styles.avatarInitials}>{getInitials(displayName)}</Text>
          </View>
        ) : (
          <View style={styles.avatarPlaceholder}>
            <User size={32} color={colors.brand[600]} />
          </View>
        )}
        <View style={styles.cameraBadge}>
          <Camera size={14} color={colors.canvas} />
        </View>
      </TouchableOpacity>
      <View style={styles.textContainer}>
        <Text style={styles.title}>Profile Photo</Text>
        <Text style={styles.subtitle}>Tap the avatar to change your photo</Text>
      </View>
      <Button
        variant="secondary"
        onPress={handlePickPhoto}
        loading={uploading}
      >
        {photoUrl ? 'Change' : 'Upload'}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: rounded.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.canvas,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: rounded.full,
    backgroundColor: colors.brand[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: rounded.full,
    backgroundColor: colors.brand[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: typography.size.titleMd,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.brand[700],
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: rounded.full,
    backgroundColor: colors.brand[600],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.canvas,
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.ink,
  },
  subtitle: {
    fontSize: typography.size.caption,
    fontFamily: typography.fontFamily.body,
    color: colors.muted,
  },
});
