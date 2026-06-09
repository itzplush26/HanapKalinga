import { View, Text, StyleSheet } from 'react-native';

export default function RegisterProfileScreen() {
  return (
    <View style={styles.container}>
      <Text>Register Step 4: Profile</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
