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
      if (db) {
        const service = new TransactionService(db);
        await service.createTransaction({
          transaction_date: new Date().toISOString().replace('T', ' ').substring(0, 19),
          transaction_type: data.transactionType,
          category_id: data.transactionType === 'IN' ? 1 : 4,
          nominal: data.price * data.quantity,
          quantity: data.quantity,
          unit_price: data.price,
          payment_method: data.paymentMethod,
          description: `${data.name} (${data.category})`,
        });
      }

      // Sync with Central Transaction Context for Rekap
      addTransaction(data);

      // Sync with Inventory Context
      if (data.transactionType === 'OUT') {
        registerOrRestockExpenseItem({
          name: data.name,
          category: data.category,
          quantity: data.quantity,
          unit: data.unit,
          price: data.price,
        });
      } else {
        adjustStockByItemName(data.name, -data.quantity);
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
