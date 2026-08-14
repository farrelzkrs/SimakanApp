import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import OrderModal, { OrderFormData } from '@/components/OrderModal';
import { useDatabase } from '@/hooks/use-database';
import { TransactionService } from '@/services/TransactionService';

export default function ModalScreen() {
  const router = useRouter();
  const { db } = useDatabase();
  const [visible, setVisible] = useState(true);

  const handleClose = () => {
    setVisible(false);
    router.back();
  };

  const handleSave = async (data: OrderFormData) => {
    try {
      if (db) {
        const service = new TransactionService(db);
        await service.createTransaction({
          transaction_date: new Date().toISOString().replace('T', ' ').substring(0, 19),
          transaction_type: data.transactionType,
          category_id: data.transactionType === 'IN' ? 'CAT-penjualan' : 'CAT-belanja',
          nominal: data.price * data.quantity,
          quantity: data.quantity,
          unit_price: data.price,
          payment_method: data.paymentMethod,
          description: `${data.name} (${data.category})`,
        });
        Alert.alert('Sukses', 'Pesanan berhasil disimpan!');
      } else {
        Alert.alert('Sukses', `Pesanan ${data.name} dicatat!`);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Gagal menyimpan pesanan.');
    }
  };

  return (
    <View style={styles.container}>
      <OrderModal
        visible={visible}
        onClose={handleClose}
        onSave={handleSave}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
});
