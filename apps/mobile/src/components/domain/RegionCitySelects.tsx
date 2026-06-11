import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { PH_REGIONS } from '@hanapkalinga/shared/constants';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { rounded } from '../../theme/rounded';
import { typography } from '../../theme/typography';

const PH_CITIES_BY_REGION: Record<string, string[]> = {
  'NCR': ['Manila', 'Quezon City', 'Makati', 'Taguig', 'Pasig', 'Mandaluyong', 'Caloocan', 'Pasay', 'Paranaque', 'Las Pinas', 'Muntinlupa', 'Marikina', 'Valenzuela', 'Malabon', 'Navotas', 'San Juan', 'Pateros'],
  'CAR': ['Baguio', 'La Trinidad', 'Bontoc', 'Lagawe', 'Tabuk', 'Bangued'],
  'Region I - Ilocos': ['San Fernando', 'Laoag', 'Vigan', 'Dagupan', 'Alaminos', 'Urdaneta'],
  'Region II - Cagayan Valley': ['Tuguegarao', 'Cauayan', 'Santiago', 'Ilagan', 'Bayombong'],
  'Region III - Central Luzon': ['Angeles', 'San Fernando', 'Olongapo', 'Tarlac', 'Cabanatuan', 'Malolos', 'Meycauayan', 'Gapan', 'Baler'],
  'Region IV-A - CALABARZON': ['Calamba', 'Dasmarinas', 'Antipolo', 'Batangas', 'Lucena', 'San Pablo', 'Lipa', 'Tanauan', 'Cavite', 'Imus', 'Bacoor', 'General Trias'],
  'Region IV-B - MIMAROPA': ['Calapan', 'Puerto Princesa', 'Odiongan', 'Roxas'],
  'Region V - Bicol': ['Legazpi', 'Naga', 'Iriga', 'Tabaco', 'Masbate', 'Sorsogon', 'Daet'],
  'Region VI - Western Visayas': ['Iloilo City', 'Bacolod', 'Silay', 'Kabankalan', 'Cadiz', 'Roxas', 'San Carlos', 'Kalibo'],
  'Region VII - Central Visayas': ['Cebu City', 'Mandaue', 'Lapu-Lapu', 'Toledo', 'Danao', 'Tagbilaran', 'Dumaguete', 'Bais'],
  'Region VIII - Eastern Visayas': ['Tacloban', 'Ormoc', 'Calbayog', 'Maasin', 'Borongan', 'Catbalogan'],
  'Region IX - Zamboanga Peninsula': ['Zamboanga City', 'Dipolog', 'Pagadian', 'Isabela', 'Dapitan'],
  'Region X - Northern Mindanao': ['Cagayan de Oro', 'Iligan', 'Malaybalay', 'Oroquieta', 'Ozamiz', 'Tangub'],
  'Region XI - Davao': ['Davao City', 'Tagum', 'Panabo', 'Digos', 'Samal', 'Mati'],
  'Region XII - SOCCSKSARGEN': ['General Santos', 'Koronadal', 'Tacurong', 'Kidapawan', 'Cotabato'],
  'Region XIII - Caraga': ['Butuan', 'Surigao', 'Bislig', 'Tandag', 'Cabadbaran'],
  'BARMM': ['Cotabato City', 'Marawi', 'Jolo', 'Lamitan'],
};

interface RegionCitySelectsProps {
  region: string;
  city: string;
  onRegionChange: (region: string) => void;
  onCityChange: (city: string) => void;
}

export function RegionCitySelects({
  region,
  city,
  onRegionChange,
  onCityChange,
}: RegionCitySelectsProps) {
  const [showRegionPicker, setShowRegionPicker] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);

  const cities = region ? PH_CITIES_BY_REGION[region] ?? [] : [];

  const handleRegionSelect = (r: string) => {
    onRegionChange(r);
    onCityChange('');
    setShowRegionPicker(false);
  };

  const handleCitySelect = (c: string) => {
    onCityChange(c);
    setShowCityPicker(false);
  };

  return (
    <View style={styles.container}>
      <PickerTrigger
        label="Region"
        value={region}
        placeholder="Select region"
        onPress={() => setShowRegionPicker(true)}
      />
      <PickerTrigger
        label="City"
        value={city}
        placeholder={region ? 'Select city' : 'Select region first'}
        onPress={() => {
          if (region) setShowCityPicker(true);
        }}
      />
      <PickerModal
        visible={showRegionPicker}
        title="Select Region"
        items={PH_REGIONS}
        selectedValue={region}
        onSelect={handleRegionSelect}
        onClose={() => setShowRegionPicker(false)}
      />
      <PickerModal
        visible={showCityPicker}
        title="Select City"
        items={cities}
        selectedValue={city}
        onSelect={handleCitySelect}
        onClose={() => setShowCityPicker(false)}
      />
    </View>
  );
}

interface PickerTriggerProps {
  label: string;
  value: string;
  placeholder: string;
  onPress: () => void;
}

function PickerTrigger({ label, value, placeholder, onPress }: PickerTriggerProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        onPress={onPress}
        style={styles.trigger}
        accessibilityRole="button"
        accessibilityLabel={`Select ${label}`}
      >
        <Text style={[styles.triggerText, !value && styles.triggerPlaceholder]}>
          {value || placeholder}
        </Text>
        <ChevronDown size={16} color={colors.muted} />
      </TouchableOpacity>
    </View>
  );
}

interface PickerModalProps {
  visible: boolean;
  title: string;
  items: string[];
  selectedValue: string;
  onSelect: (item: string) => void;
  onClose: () => void;
}

function PickerModal({ visible, title, items, selectedValue, onSelect, onClose }: PickerModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.modalCloseButton}
              accessibilityLabel="Close"
              accessibilityRole="button"
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalList}>
            {items.map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => onSelect(item)}
                style={[
                  styles.modalItem,
                  item === selectedValue && styles.modalItemSelected,
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: item === selectedValue }}
              >
                <Text
                  style={[
                    styles.modalItemText,
                    item === selectedValue && styles.modalItemTextSelected,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  label: {
    fontSize: typography.size.labelMd,
    fontFamily: typography.fontFamily.bodyMedium,
    color: colors.body,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: rounded.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.canvas,
  },
  triggerText: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.body,
    color: colors.ink,
  },
  triggerPlaceholder: {
    color: colors.muted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.canvas,
    borderTopLeftRadius: rounded.lg,
    borderTopRightRadius: rounded.lg,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  modalTitle: {
    fontSize: typography.size.titleSm,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.ink,
  },
  modalCloseButton: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  modalCloseText: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.bodyMedium,
    color: colors.brand[600],
  },
  modalList: {
    paddingHorizontal: spacing.md,
  },
  modalItem: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  modalItemSelected: {
    backgroundColor: colors.brand[50],
  },
  modalItemText: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.body,
    color: colors.ink,
  },
  modalItemTextSelected: {
    color: colors.brand[600],
    fontFamily: typography.fontFamily.bodySemiBold,
  },
});
