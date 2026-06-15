import { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput as RNTextInput, ScrollView, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { User, AlertTriangle } from 'lucide-react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { ScreenWrapper } from '../../src/components/ScreenWrapper';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { Card } from '../../src/components/ui/Card';
import { Chip } from '../../src/components/ui/Chip';
import { Skeleton } from '../../src/components/ui/Skeleton';
import { Separator } from '../../src/components/ui/Separator';
import { RegionCitySelects } from '../../src/components/domain/RegionCitySelects';
import { DocumentUploader } from '../../src/components/domain/DocumentUploader';
import { PROVIDER_SPECIALIZATIONS } from '@hanapkalinga/shared/constants';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { rounded } from '../../src/theme/rounded';
import { typography } from '../../src/theme/typography';
import type { Nurse, Profile } from '@hanapkalinga/shared/types';

export default function NurseProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [region, setRegion] = useState('');
  const [city, setCity] = useState('');
  const [barangay, setBarangay] = useState('');
  const [address, setAddress] = useState('');
  const [prcLicense, setPrcLicense] = useState('');
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [yearsExperience, setYearsExperience] = useState('');
  const [bio, setBio] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [hourlyRateMax, setHourlyRateMax] = useState('');
  const [dailyRate, setDailyRate] = useState('');
  const [dailyRateMax, setDailyRateMax] = useState('');
  const [prcDoc, setPrcDoc] = useState<{ uri: string; name: string; size: number; mimeType: string } | null>(null);
  const [nbiDoc, setNbiDoc] = useState<{ uri: string; name: string; size: number; mimeType: string } | null>(null);
  const [existingPrcUrl, setExistingPrcUrl] = useState<string | null>(null);
  const [existingNbiUrl, setExistingNbiUrl] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw new Error(profileError.message);

      const p = profileData as unknown as Profile;
      setFullName(p.full_name ?? '');
      setPhone(p.phone ?? '');
      setRegion(p.region ?? '');
      setCity(p.city ?? '');
      setBarangay(p.barangay ?? '');
      setAddress(p.address ?? '');

      const { data: nurseData, error: nurseError } = await supabase
        .from('nurses')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!nurseError && nurseData) {
        const n = nurseData as unknown as Nurse;
        setPrcLicense(n.prc_license_no ?? '');
        setSpecializations(n.specializations ?? []);
        setYearsExperience(n.years_experience?.toString() ?? '');
        setBio(n.bio ?? '');
        setHourlyRate(n.hourly_rate?.toString() ?? '');
        setHourlyRateMax(n.hourly_rate_max?.toString() ?? '');
        setDailyRate(n.daily_rate_12hr?.toString() ?? '');
        setDailyRateMax(n.daily_rate_12hr_max?.toString() ?? '');
        setExistingPrcUrl(n.prc_document_url);
        setExistingNbiUrl(n.nbi_document_url);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const toggleSpecialization = (spec: string) => {
    setSpecializations((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    );
  };

  const handleSave = async () => {
    if (!user) return;

    const docsChanged =
      (prcDoc && prcDoc.uri !== existingPrcUrl) ||
      (nbiDoc && nbiDoc.uri !== existingNbiUrl);

    if (docsChanged) {
      Alert.alert(
        'Re-verification required',
        'Your documents have changed and need re-verification. Your profile will be set to pending review.'
      );
    }

    setSaving(true);
    setError(null);

    const profileUpdate = {
      full_name: fullName || null,
      phone: phone || null,
      region: region || null,
      city: city || null,
      barangay: barangay || null,
      address: address || null,
    };

    const { error: profileError } = await (supabase as any)
      .from('profiles')
      .update(profileUpdate)
      .eq('id', user.id);

    if (profileError) {
      setError(profileError.message);
      setSaving(false);
      return;
    }

    let prcUrl = existingPrcUrl;
    let nbiUrl = existingNbiUrl;

    if (prcDoc && prcDoc.uri !== existingPrcUrl) {
      const formData = new FormData();
      formData.append('file', {
        uri: prcDoc.uri,
        name: prcDoc.name,
        type: prcDoc.mimeType,
      } as any);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(`nurses/${user.id}/prc_${Date.now()}`, formData as any);

      if (!uploadError && uploadData) {
        const { data: urlData } = supabase.storage
          .from('documents')
          .getPublicUrl(uploadData.path);
        prcUrl = urlData?.publicUrl ?? null;
      }
    }

    if (nbiDoc && nbiDoc.uri !== existingNbiUrl) {
      const formData = new FormData();
      formData.append('file', {
        uri: nbiDoc.uri,
        name: nbiDoc.name,
        type: nbiDoc.mimeType,
      } as any);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(`nurses/${user.id}/nbi_${Date.now()}`, formData as any);

      if (!uploadError && uploadData) {
        const { data: urlData } = supabase.storage
          .from('documents')
          .getPublicUrl(uploadData.path);
        nbiUrl = urlData?.publicUrl ?? null;
      }
    }

    const nurseUpdate: Record<string, unknown> = {
      prc_license_no: prcLicense || null,
      specializations: specializations.length > 0 ? specializations : null,
      years_experience: yearsExperience ? parseInt(yearsExperience, 10) : null,
      bio: bio || null,
      hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
      hourly_rate_max: hourlyRateMax ? parseFloat(hourlyRateMax) : null,
      daily_rate_12hr: dailyRate ? parseFloat(dailyRate) : null,
      daily_rate_12hr_max: dailyRateMax ? parseFloat(dailyRateMax) : null,
      prc_document_url: prcUrl,
      nbi_document_url: nbiUrl,
    };

    if (docsChanged) {
      nurseUpdate.verification_status = 'pending';
    }

    const { error: nurseError } = await (supabase as any)
      .from('nurses')
      .update(nurseUpdate)
      .eq('id', user.id);

    setSaving(false);

    if (nurseError) {
      setError(nurseError.message);
      return;
    }

    router.back();
  };

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.skeletonContainer}>
          <Skeleton variant="rectangle" height={48} />
          <Skeleton variant="rectangle" height={48} />
          <Skeleton variant="rectangle" height={48} />
          <Skeleton variant="rectangle" height={48} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.pageTitle}>Edit Profile</Text>

        <Card title="Personal Information" roundedSize="md">
          <View style={styles.formFields}>
            <Input label="Full name" value={fullName} onChangeText={setFullName} placeholder="Enter full name" />
            <Input label="Phone" value={phone} onChangeText={setPhone} placeholder="Enter phone number" keyboardType="phone-pad" />
            <RegionCitySelects region={region} city={city} onRegionChange={setRegion} onCityChange={setCity} />
            <Input label="Barangay" value={barangay} onChangeText={setBarangay} placeholder="Enter barangay" />
            <Input label="Address" value={address} onChangeText={setAddress} placeholder="Enter address" />
          </View>
        </Card>

        <Separator />

        <Card title="Professional Information" roundedSize="md">
          <View style={styles.formFields}>
            <Input label="PRC License No." value={prcLicense} onChangeText={setPrcLicense} placeholder="Enter PRC license number" />
            <View>
              <Text style={styles.fieldLabel}>Specializations</Text>
              <View style={styles.chipRow}>
                {PROVIDER_SPECIALIZATIONS.map((spec) => (
                  <Chip
                    key={spec}
                    label={spec}
                    selected={specializations.includes(spec)}
                    onPress={() => toggleSpecialization(spec)}
                  />
                ))}
              </View>
            </View>
            <Input label="Years of experience" value={yearsExperience} onChangeText={setYearsExperience} placeholder="Enter years of experience" keyboardType="numeric" />
            <View>
              <Text style={styles.fieldLabel}>Bio</Text>
              <RNTextInput
                style={styles.textarea}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell families about yourself"
                placeholderTextColor={colors.muted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
        </Card>

        <Separator />

        <Card title="Rates" roundedSize="md">
          <View style={styles.formFields}>
            <Text style={styles.fieldLabel}>Hourly rate (PHP)</Text>
            <View style={styles.rateRow}>
              <Input
                value={hourlyRate}
                onChangeText={setHourlyRate}
                placeholder="Min"
                keyboardType="numeric"
                style={styles.rateInput}
              />
              <Text style={styles.rateSeparator}>to</Text>
              <Input
                value={hourlyRateMax}
                onChangeText={setHourlyRateMax}
                placeholder="Max"
                keyboardType="numeric"
                style={styles.rateInput}
              />
            </View>
            <Text style={styles.fieldLabel}>Daily rate (12hr, PHP)</Text>
            <View style={styles.rateRow}>
              <Input
                value={dailyRate}
                onChangeText={setDailyRate}
                placeholder="Min"
                keyboardType="numeric"
                style={styles.rateInput}
              />
              <Text style={styles.rateSeparator}>to</Text>
              <Input
                value={dailyRateMax}
                onChangeText={setDailyRateMax}
                placeholder="Max"
                keyboardType="numeric"
                style={styles.rateInput}
              />
            </View>
          </View>
        </Card>

        <Separator />

        <Card title="Documents" roundedSize="md">
          <View style={styles.formFields}>
            <DocumentUploader
              label="PRC / TESDA Certificate"
              onFileSelect={setPrcDoc}
              selectedFile={prcDoc}
            />
            <DocumentUploader
              label="NBI Clearance"
              onFileSelect={setNbiDoc}
              selectedFile={nbiDoc}
            />
          </View>
        </Card>

        {error && (
          <View style={styles.errorRow}>
            <AlertTriangle size={14} color={colors.semantic.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Button variant="primary" loading={saving} onPress={handleSave}>
          Save
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
  skeletonContainer: {
    padding: spacing.md,
    gap: spacing.md,
  },
  pageTitle: {
    fontSize: typography.size.displayMd,
    fontFamily: typography.fontFamily.display,
    color: colors.ink,
  },
  formFields: {
    gap: spacing.md,
  },
  fieldLabel: {
    fontSize: typography.size.labelMd,
    fontFamily: typography.fontFamily.bodyMedium,
    color: colors.body,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xxs,
    marginTop: spacing.xs,
  },
  textarea: {
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: rounded.sm,
    padding: spacing.sm,
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.body,
    color: colors.ink,
    minHeight: 100,
    marginTop: spacing.xs,
  },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rateInput: {
    flex: 1,
  },
  rateSeparator: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.body,
    color: colors.muted,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  errorText: {
    fontSize: typography.size.caption,
    fontFamily: typography.fontFamily.body,
    color: colors.semantic.error,
  },
});
