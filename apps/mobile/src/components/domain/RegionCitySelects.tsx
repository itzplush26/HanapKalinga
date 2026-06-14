import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { PH_REGIONS } from '@hanapkalinga/shared/constants';
import { useTheme } from '../../contexts/ThemeContext';
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
  const { colors } = useTheme();
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
        colors={colors}
        label="Region"
        value={region}
        placeholder="Select region"
        onPress={() => setShowRegionPicker(true)}
      />
      <PickerTrigger
        colors={colors}
        label="City"
        value={city}
        placeholder={region ? 'Select city' : 'Select region first'}
        onPress={() => {
          if (region) setShowCityPicker(true);
        }}
      />
      <PickerModal
        colors={colors}
        visible={showRegionPicker}
        title="Select Region"
        items={PH_REGIONS}
        selectedValue={region}
        onSelect={handleRegionSelect}
        onClose={() => setShowRegionPicker(false)}
      />
      <PickerModal
        colors={colors}
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
  colors: any;
  label: string;
  value: string;
  placeholder: string;
  onPress: () => void;
}

function PickerTrigger({ colors, label, value, placeholder, onPress }: PickerTriggerProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.label, { color: colors['text-secondary'] }]}>{label}</Text>
      <TouchableOpacity
        onPress={onPress}
        style={[
          styles.trigger,
          {
            borderColor: colors.border,
            backgroundColor: colors.surface,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Select ${label}`}
      >
        <Text
          style={[
            styles.triggerText,
            { color: value ? colors['text-primary'] : colors['text-muted'] },
          ]}
        >
          {value || placeholder}
        </Text>
        <ChevronDown size={16} color={colors['text-muted']} />
      </TouchableOpacity>
    </View>
  );
}

interface PickerModalProps {
  colors: any;
  visible: boolean;
  title: string;
  items: string[];
  selectedValue: string;
  onSelect: (item: string) => void;
  onClose: () => void;
}

function PickerModal({ colors, visible, title, items, selectedValue, onSelect, onClose }: PickerModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors['text-primary'] }]}>{title}</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.modalCloseButton}
              accessibilityLabel="Close"
              accessibilityRole="button"
            >
              <Text style={[styles.modalCloseText, { color: colors.primary }]}>Close</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalList}>
            {items.map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => onSelect(item)}
                style={[
                  styles.modalItem,
                  { borderBottomColor: colors.border },
                  item === selectedValue && { backgroundColor: colors['primary-light'] },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: item === selectedValue }}
              >
                <Text
                  style={[
                    styles.modalItemText,
                    { color: item === selectedValue ? colors.primary : colors['text-primary'] },
                    item === selectedValue && { fontFamily: typography.fontFamily.bodySemiBold },
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
    gap: spacing[4],
  },
  fieldGroup: {
    gap: spacing[2],
  },
  label: {
    fontSize: typography.size.sm,
    fontFamily: typography.fontFamily.bodyMedium,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    borderWidth: 1,
    borderRadius: rounded.md,
    paddingHorizontal: spacing[4],
  },
  triggerText: {
    fontSize: typography.size.base,
    fontFamily: typography.fontFamily.body,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: rounded.lg,
    borderTopRightRadius: rounded.lg,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: typography.size.base,
    fontFamily: typography.fontFamily.bodySemiBold,
  },
  modalCloseButton: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  modalCloseText: {
    fontSize: typography.size.base,
    fontFamily: typography.fontFamily.bodyMedium,
  },
  modalList: {
    paddingHorizontal: spacing[4],
  },
  modalItem: {
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
  },
  modalItemText: {
    fontSize: typography.size.base,
    fontFamily: typography.fontFamily.body,
  },
});
