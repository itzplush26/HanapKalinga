import { View, Text, StyleSheet } from 'react-native';

export default function ChooseRoleScreen() {
  return (
    <View style={styles.container}>
      <Text>Choose Role</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
