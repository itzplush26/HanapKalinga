import { View, Text, StyleSheet } from 'react-native';

export default function AdminFamiliesScreen() {
  return (
    <View style={styles.container}>
      <Text>Admin - All Families</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
