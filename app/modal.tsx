import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import OrderModal, { OrderFormData } from '@/components/OrderModal';
import { useDatabase } from '@/hooks/use-database';
import { TransactionService } from '@/services/TransactionService';
import { useTransactions } from '@/context/TransactionContext';
import { useInventory } from '@/context/InventoryContext';

export default function ModalScreen() {
  const router = useRouter();
  const { db } = useDatabase();
  const { addTransaction } = useTransactions();
  const { registerOrRestockExpenseItem, adjustStockByItemName } = useInventory();
  const [visible, setVisible] = useState(true);

  const handleClose = () => {
    setVisible(false);
    router.back();
  };

  const handleSave = async (data: OrderFormData) => {
    try {
      // Sync with Central Transaction Context for Rekap (also saves to DB)
      await addTransaction(data);

      // Sync with Inventory Context (also saves to DB)
      if (data.transactionType === 'OUT') {
        await registerOrRestockExpenseItem({
          name: data.name,
          category: data.category,
          quantity: data.quantity,
          unit: data.unit,
          price: data.price,
        });
      } else {
        await adjustStockByItemName(data.name, -data.quantity);
      }

      Alert.alert('Sukses', 'Pesanan berhasil disimpan!');
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
