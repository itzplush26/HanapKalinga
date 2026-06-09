import { View, Text, StyleSheet } from 'react-native';

export default function FamilyDashboardScreen() {
  return (
    <View style={styles.container}>
      <Text>Family Dashboard</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
