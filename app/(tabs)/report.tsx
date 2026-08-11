import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';

export default function ReportScreen() {
  return (
    <View style={styles.container}>
      <ThemedText type="title">Laporan</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
});
