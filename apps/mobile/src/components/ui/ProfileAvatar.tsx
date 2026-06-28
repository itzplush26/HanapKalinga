import { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { User } from 'lucide-react-native';
import { rounded } from '../../theme/rounded';
import { typography } from '../../theme/typography';

interface ProfileAvatarProps {
  src?: string | null;
  name?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 44,
  md: 64,
  lg: 80,
};

const fontSizeMap = {
  sm: 12,
  md: 14,
  lg: 16,
};

function initialsFromName(name: string) {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || '?'
  );
}

export function ProfileAvatar({ src, name = '', size = 'md' }: ProfileAvatarProps) {
  const [broken, setBroken] = useState(false);
  const dimension = sizeMap[size];
  const showImage = !!src && !broken;

  return (
    <View
      style={[
        styles.base,
        {
          width: dimension,
          height: dimension,
          borderRadius: rounded.full,
        },
      ]}
    >
      {showImage ? (
        <Image
          source={{ uri: src }}
          style={styles.image}
          onError={() => setBroken(true)}
          accessibilityLabel={name ? `${name} profile photo` : 'Profile photo'}
        />
      ) : name ? (
        <Text
          style={[
            styles.initials,
            { fontSize: fontSizeMap[size] },
          ]}
          aria-hidden={true}
        >
          {initialsFromName(name)}
        </Text>
      ) : (
        <User size={dimension * 0.5} color="#94a3b8" aria-hidden={true} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f1f5f9',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  initials: {
    fontFamily: typography.fontFamily.bodySemiBold,
    color: '#64748b',
  },
});
