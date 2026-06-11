import { View, Text, StyleSheet } from 'react-native';

export default function NurseProfileScreen() {
  return (
    <View style={styles.container}>
      <Text>Nurse Profile</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
