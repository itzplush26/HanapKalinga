import { useState } from 'react';
import { View, Text, StyleSheet, TextInput as RNTextInput, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { PROVIDER_SPECIALIZATIONS } from '@hanapkalinga/shared/constants';
import { supabase } from '../../../src/lib/supabase';
import { ScreenWrapper } from '../../../src/components/ScreenWrapper';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { Chip } from '../../../src/components/ui/Chip';
import { RegionCitySelects } from '../../../src/components/domain/RegionCitySelects';
import { DocumentUploader } from '../../../src/components/domain/DocumentUploader';
import { colors } from '../../../src/theme/colors';
import { typography } from '../../../src/theme/typography';
import { spacing } from '../../../src/theme/spacing';

type SelectedFile = { uri: string; name: string; size: number; mimeType: string } | null;

export default function RegisterProfileScreen() {
  const router = useRouter();
  const { email, role } = useLocalSearchParams<{ email: string; role: string }>();
  const isFamily = role === 'family';

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [region, setRegion] = useState('');
  const [city, setCity] = useState('');
  const [barangay, setBarangay] = useState('');
  const [address, setAddress] = useState('');
  const [patientName, setPatientName] = useState('');

  const [providerType, setProviderType] = useState<'nurse' | 'caregiver'>('nurse');
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [yearsExp, setYearsExp] = useState('');
  const [bio, setBio] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [dailyRate, setDailyRate] = useState('');

  const [prcFile, setPrcFile] = useState<SelectedFile>(null);
  const [tesdaFile, setTesdaFile] = useState<SelectedFile>(null);
  const [nbiFile, setNbiFile] = useState<SelectedFile>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleSpecialization = (spec: string) => {
    setSpecializations((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    );
  };

  const uploadFile = async (file: SelectedFile, bucket: string, path: string): Promise<string | null> => {
    if (!file) return null;
    try {
      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, { uri: file.uri, name: file.name, type: file.mimeType } as any, {
          upsert: true,
        });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
      return urlData.publicUrl;
    } catch {
      return null;
    }
  };

  const handleSubmit = async () => {
    setError('');

    if (!fullName.trim()) {
      setError('Full name is required');
      return;
    }

    setLoading(true);
    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Session expired. Please go back and try again.');
        setLoading(false);
        setUploading(false);
        return;
      }

      const { error: profileError } = await supabase.from('profiles').upsert({
        id: user.id,
        role,
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        region: region || null,
        city: city || null,
        barangay: barangay || null,
        address: address.trim() || null,
      } as any);

      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        setUploading(false);
        return;
      }

      if (isFamily) {
        const { error: familyError } = await supabase.from('families').upsert({
          id: user.id,
          patient_name: patientName.trim() || null,
        } as any);

        if (familyError) {
          setError(familyError.message);
          setLoading(false);
          setUploading(false);
          return;
        }
      } else {
        let prcUrl: string | null = null;
        let nbiUrl: string | null = null;
        let tesdaUrl: string | null = null;

        if (prcFile) {
          const url = await uploadFile(prcFile, 'documents', `${user.id}/prc-${prcFile.name}`);
          if (!url && providerType === 'nurse') {
            setError('Failed to upload PRC document');
            setLoading(false);
            setUploading(false);
            return;
          }
          prcUrl = url;
        }

        if (nbiFile) {
          const url = await uploadFile(nbiFile, 'documents', `${user.id}/nbi-${nbiFile.name}`);
          if (!url) {
            setError('Failed to upload NBI clearance');
            setLoading(false);
            setUploading(false);
            return;
          }
          nbiUrl = url;
        }

        if (tesdaFile) {
          const url = await uploadFile(tesdaFile, 'documents', `${user.id}/tesda-${tesdaFile.name}`);
          tesdaUrl = url;
        }

        const { error: nurseError } = await supabase.from('nurses').upsert({
          id: user.id,
          prc_document_url: prcUrl,
          nbi_document_url: nbiUrl,
          tesda_document_url: tesdaUrl,
          specializations: specializations.length > 0 ? specializations : null,
          years_experience: yearsExp ? parseInt(yearsExp, 10) : null,
          bio: bio.trim() || null,
          hourly_rate: hourlyRate ? parseInt(hourlyRate, 10) : null,
          daily_rate_12hr: dailyRate ? parseInt(dailyRate, 10) : null,
        } as any);

        if (nurseError) {
          setError(nurseError.message);
          setLoading(false);
          setUploading(false);
          return;
        }
      }

      router.push(`/(auth)/register/set-password?email=${encodeURIComponent(email!)}`);
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <ScreenWrapper scroll>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Complete your profile</Text>
          <Text style={styles.subtitle}>
            {isFamily ? 'Tell us about yourself and your care needs' : 'Tell us about your professional background'}
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Full Name"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter your full name"
            autoCapitalize="words"
            testID={`profile${isFamily ? 'Family' : 'Nurse'}_input_name`}
          />

          <Input
            label="Phone (optional)"
            value={phone}
            onChangeText={setPhone}
            placeholder="+63 XXX XXX XXXX"
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
            label="Address"
            value={address}
            onChangeText={setAddress}
            placeholder="House number, street"
          />

          {isFamily ? (
            <Input
              label="Patient Name (optional)"
              value={patientName}
              onChangeText={setPatientName}
              placeholder="Name of person needing care"
              autoCapitalize="words"
            />
          ) : (
            <>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Provider Type</Text>
                <View style={styles.toggleRow}>
                  <Chip
                    selected={providerType === 'nurse'}
                    onPress={() => setProviderType('nurse')}
                    label="Nurse"
                  />
                  <Chip
                    selected={providerType === 'caregiver'}
                    onPress={() => setProviderType('caregiver')}
                    label="Caregiver"
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Specializations</Text>
                <View style={styles.chipRow}>
                  {PROVIDER_SPECIALIZATIONS.map((spec) => (
                    <Chip
                      key={spec}
                      selected={specializations.includes(spec)}
                      onPress={() => toggleSpecialization(spec)}
                      label={spec}
                    />
                  ))}
                </View>
              </View>

              <Input
                label="Years of Experience"
                value={yearsExp}
                onChangeText={setYearsExp}
                placeholder="e.g. 5"
                keyboardType="numeric"
              />

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Bio (optional)</Text>
                <RNTextInput
                  style={styles.textarea}
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Tell us about your experience and skills"
                  placeholderTextColor={colors.muted}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <Input
                label="Hourly Rate (PHP)"
                value={hourlyRate}
                onChangeText={setHourlyRate}
                placeholder="e.g. 200"
                keyboardType="numeric"
              />

              <Input
                label="Daily Rate (PHP)"
                value={dailyRate}
                onChangeText={setDailyRate}
                placeholder="e.g. 1500"
                keyboardType="numeric"
              />

              {providerType === 'nurse' && (
                <DocumentUploader
                  label="PRC License"
                  onFileSelect={setPrcFile}
                  selectedFile={prcFile}
                  accept={['application/pdf', 'image/*']}
                  loading={uploading}
                />
              )}

              {providerType === 'caregiver' && (
                <DocumentUploader
                  label="TESDA NC II Certificate"
                  onFileSelect={setTesdaFile}
                  selectedFile={tesdaFile}
                  accept={['application/pdf', 'image/*']}
                  loading={uploading}
                />
              )}

              <DocumentUploader
                label="NBI Clearance"
                onFileSelect={setNbiFile}
                selectedFile={nbiFile}
                accept={['application/pdf', 'image/*']}
                loading={uploading}
              />
            </>
          )}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Button
            onPress={handleSubmit}
            loading={loading}
            disabled={uploading}
            style={styles.submit}
          >
            Next
          </Button>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.size.displayMd,
    fontFamily: typography.fontFamily.display,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.body,
    color: colors.muted,
  },
  form: {
    gap: spacing.md,
  },
  submit: {
    marginTop: spacing.sm,
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  label: {
    fontSize: typography.size.labelMd,
    fontFamily: typography.fontFamily.bodyMedium,
    color: colors.body,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  textarea: {
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 6,
    padding: spacing.md,
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.body,
    color: colors.ink,
    minHeight: 100,
    backgroundColor: colors.canvas,
  },
  errorText: {
    fontSize: typography.size.caption,
    fontFamily: typography.fontFamily.body,
    color: colors.semantic.error,
    textAlign: 'center',
  },
});
