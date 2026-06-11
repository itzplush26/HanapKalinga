import { View, Text, StyleSheet } from 'react-native';

export default function VerificationQueueScreen() {
  return (
    <View style={styles.container}>
      <Text>Verification Queue</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
