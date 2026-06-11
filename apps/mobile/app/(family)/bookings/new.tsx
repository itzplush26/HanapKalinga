import { View, Text, StyleSheet } from 'react-native';

export default function NewBookingScreen() {
  return (
    <View style={styles.container}>
      <Text>New Booking</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
