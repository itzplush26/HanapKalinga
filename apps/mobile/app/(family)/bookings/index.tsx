import { View, Text, StyleSheet } from 'react-native';

export default function FamilyBookingsScreen() {
  return (
    <View style={styles.container}>
      <Text>Family Bookings</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
