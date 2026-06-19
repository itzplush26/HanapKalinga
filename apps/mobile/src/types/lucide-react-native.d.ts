import 'lucide-react-native';
import type { StyleProp, ViewStyle, ColorValue as OpaqueColorValue } from 'react-native';

declare module 'lucide-react-native' {
  interface LucideProps {
    color?: string | OpaqueColorValue;
    fill?: string | OpaqueColorValue;
    strokeWidth?: number | string;
    style?: StyleProp<ViewStyle>;
  }
}
