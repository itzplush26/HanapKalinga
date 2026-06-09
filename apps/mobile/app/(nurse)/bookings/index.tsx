import { View, Text, StyleSheet } from 'react-native';

export default function NurseBookingsScreen() {
  return (
    <View style={styles.container}>
      <Text>Nurse Bookings</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
