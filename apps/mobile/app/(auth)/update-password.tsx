import { View, Text, StyleSheet } from 'react-native';

export default function UpdatePasswordScreen() {
  return (
    <View style={styles.container}>
      <Text>Update Password</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
