import { View, Text, StyleSheet } from 'react-native';

export default function AdminBookingsScreen() {
  return (
    <View style={styles.container}>
      <Text>Admin - All Bookings</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
