import { View, Text, StyleSheet } from 'react-native';

export default function SetPasswordScreen() {
  return (
    <View style={styles.container}>
      <Text>Set Password</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
