import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { typography } from '../../theme/typography';

export interface TabConfig {
  key: string;
  label: string;
  icon: React.ReactNode;
  badgeCount?: number;
}

interface TabBarProps {
  tabs: TabConfig[];
  activeTab: string;
  onTabPress: (key: string) => void;
}

export function TabBar({ tabs, activeTab, onTabPress }: TabBarProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors['nav-bg'],
          borderTopColor: colors['nav-border'],
        },
      ]}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onTabPress(tab.key)}
            style={styles.tab}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={tab.label}
          >
            <View style={styles.iconContainer}>
              {tab.icon}
              {tab.badgeCount != null && tab.badgeCount > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.error }]}>
                  <Text style={[styles.badgeText, { color: colors['on-primary'] }]}>
                    {tab.badgeCount > 9 ? '9+' : tab.badgeCount}
                  </Text>
                </View>
              )}
            </View>
            <Text
              style={[
                styles.label,
                {
                  color: isActive ? colors['nav-active'] : colors['nav-inactive'],
                  fontFamily: isActive ? typography.fontFamily.bodySemiBold : typography.fontFamily.body,
                },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    height: 64,
    paddingBottom: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 2,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: typography.fontFamily.bodySemiBold,
  },
  label: {
    fontSize: 10,
    textAlign: 'center',
  },
});
