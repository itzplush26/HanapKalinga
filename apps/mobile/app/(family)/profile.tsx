import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { ScreenWrapper } from '../../src/components/ScreenWrapper';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { RegionCitySelects } from '../../src/components/domain/RegionCitySelects';
import { ProfilePhotoUploader } from '../../src/components/ProfilePhotoUploader';
import { ThemeToggle } from '../../src/components/ThemeToggle';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { typography } from '../../src/theme/typography';
import { supabase } from '../../src/lib/supabase';
import { familyProfileSchema } from '@hanapkalinga/shared/validations';

export default function FamilyProfileScreen() {
  const router = useRouter();
  const { user, profile, refreshProfile, signOut } = useAuth();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [region, setRegion] = useState('');
  const [city, setCity] = useState('');
  const [barangay, setBarangay] = useState('');
  const [address, setAddress] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [patientName, setPatientName] = useState('');

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '');
      setPhone(profile.phone ?? '');
      setRegion(profile.region ?? '');
      setCity(profile.city ?? '');
      setBarangay(profile.barangay ?? '');
      setAddress(profile.address ?? '');
      setPhotoUrl(profile.profile_photo_url ?? null);
      setLoading(false);

      if (user) {
        (supabase as any)
          .from('families')
          .select('patient_name')
          .eq('id', user.id)
          .single()
          .then(({ data }: any) => {
            if (data?.patient_name) setPatientName(data.patient_name);
          });
      }
    }
  }, [profile, user]);

  const handleSave = async () => {
    if (!user) return;

    const names = fullName.trim().split(' ');
    const firstName = names[0] ?? '';
    const lastName = names.slice(1).join(' ') || firstName;

    const result = familyProfileSchema.safeParse({
      firstName,
      middleName: '',
      lastName,
      phone: phone || undefined,
      region,
      city,
      barangay,
      address: address || undefined,
    });

    if (!result.success) {
      const firstError = result.error.errors[0];
      Alert.alert('Validation Error', firstError.message);
      return;
    }

    setSaving(true);

    const { error: profileError } = await (supabase as any)
      .from('profiles')
      .update({
        full_name: fullName.trim() || null,
        first_name: firstName,
        last_name: lastName,
        phone: phone.trim() || null,
        region,
        city,
        barangay: barangay.trim() || null,
        address: address.trim() || null,
      })
      .eq('id', user.id);

    if (profileError) {
      Alert.alert('Error', profileError.message);
      setSaving(false);
      return;
    }

    const { error: familyError } = await (supabase as any)
      .from('families')
      .upsert({
        id: user.id,
        patient_name: patientName.trim() || null,
      });

    setSaving(false);

    if (familyError) {
      Alert.alert('Error', familyError.message);
      return;
    }

    await refreshProfile();
    Alert.alert('Saved', 'Your profile has been updated.');
  };

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper scroll>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Family Profile</Text>

        <ProfilePhotoUploader
          photoUrl={photoUrl}
          displayName={fullName || 'Family'}
          onPhotoChange={(url) => setPhotoUrl(url)}
        />

        <Input
          label="Full name"
          value={fullName}
          onChangeText={setFullName}
          placeholder="Enter your full name"
        />

        <Input
          label="Phone number"
          value={phone}
          onChangeText={setPhone}
          placeholder="Enter phone number"
          keyboardType="phone-pad"
        />

        <RegionCitySelects
          region={region}
          city={city}
          onRegionChange={setRegion}
          onCityChange={setCity}
        />

        <Input
          label="Barangay"
          value={barangay}
          onChangeText={setBarangay}
          placeholder="Enter barangay"
        />

        <Input
          label="Home address"
          value={address}
          onChangeText={setAddress}
          placeholder="Enter your address"
        />

        <Input
          label="Patient name"
          value={patientName}
          onChangeText={setPatientName}
          placeholder="Name of person needing care"
        />

        <Card title="Appearance" roundedSize="md">
          <ThemeToggle />
        </Card>

        <Button variant="primary" loading={saving} onPress={handleSave}>
          Save
        </Button>

        <Button
          variant="outline"
          onPress={() => {
            Alert.alert('Sign out', 'Are you sure you want to sign out?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Sign out',
                style: 'destructive',
                onPress: async () => {
                  await signOut();
                  router.replace('/');
                },
              },
            ]);
          }}
        >
          Sign out
        </Button>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  title: {
    fontSize: typography.size.displayMd,
    fontFamily: typography.fontFamily.display,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.body,
    color: colors.muted,
  },
});
