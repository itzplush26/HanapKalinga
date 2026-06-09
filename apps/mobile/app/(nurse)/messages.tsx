import { View, Text, StyleSheet } from 'react-native';

export default function NurseMessagesScreen() {
  return (
    <View style={styles.container}>
      <Text>Messages Inbox</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
