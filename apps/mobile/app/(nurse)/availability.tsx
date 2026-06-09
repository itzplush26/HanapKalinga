import { View, Text, StyleSheet } from 'react-native';

export default function AvailabilityScreen() {
  return (
    <View style={styles.container}>
      <Text>Availability Calendar</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
