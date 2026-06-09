import { View, Text, StyleSheet } from 'react-native';

export default function RegisterStep1Screen() {
  return (
    <View style={styles.container}>
      <Text>Register Step 1: Email</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
