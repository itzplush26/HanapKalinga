import { View, Text, StyleSheet } from 'react-native';

export default function NurseDashboardScreen() {
  return (
    <View style={styles.container}>
      <Text>Nurse Dashboard</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
