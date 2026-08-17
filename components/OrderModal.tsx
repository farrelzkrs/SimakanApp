import { InventoryItem, useInventory } from '@/context/InventoryContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

export interface OrderFormData {
  id?: string;
  name: string;
  customerName: string;
  category: string;
  stock: number;
  quantity: number;
  unit: string;
  price: number;
  paymentMethod: 'Lunas' | 'Hutang';
  transactionType: 'IN' | 'OUT';
}

export interface OrderModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: OrderFormData) => void;
  onDelete?: (id: string) => void;
  initialData?: OrderFormData | null;
  defaultType?: 'IN' | 'OUT';
}

const CATEGORY_SUGGESTIONS = [
  'Bahan Baku',
  'Makanan',
  'Minuman',
  'Kemasan',
  'Elektronik',
  'Aksesoris',
  'ATK',
  'Operasional',
];

const UNIT_OPTIONS = ['Pcs', 'Dus', 'Pack'];

export default function OrderModal({
  visible,
  onClose,
  onSave,
  onDelete,
  initialData,
  defaultType = 'IN',
}: OrderModalProps) {
  const router = useRouter();
  const { inventoryItems, adjustStockByItemName, registerOrRestockExpenseItem } = useInventory();
  const isEditing = !!initialData?.id;

  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);
  const [name, setName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [category, setCategory] = useState('Bahan Baku');
  const [stock, setStock] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('Pcs');
  const [pcsPerUnit, setPcsPerUnit] = useState(1);
  const [price, setPrice] = useState(0);
  const [priceInput, setPriceInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Lunas' | 'Hutang'>('Lunas');
  const [transactionType, setTransactionType] = useState<'IN' | 'OUT'>(defaultType);

  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [pickerSearchQuery, setPickerSearchQuery] = useState('');

  const matchingExpenseItems = inventoryItems.filter((item) =>
    item.name.toLowerCase().includes(name.trim().toLowerCase())
  );

  const matchingPickerItems = inventoryItems.filter(
    (item) =>
      item.name.toLowerCase().includes(pickerSearchQuery.trim().toLowerCase()) ||
      item.category.toLowerCase().includes(pickerSearchQuery.trim().toLowerCase())
  );

  const isExactItemInInventory = inventoryItems.some(
    (item) => item.name.toLowerCase() === name.trim().toLowerCase()
  );

  useEffect(() => {
    if (visible) {
      setPickerSearchQuery('');
      if (initialData) {
        setName(initialData.name || '');
        setCustomerName(initialData.customerName || '');
        setCategory(initialData.category || 'Bahan Baku');
        setStock(initialData.stock ?? 0);
        setQuantity(initialData.quantity || 1);
        setUnit('Pcs'); // Always edit in Pcs
        setPcsPerUnit(1);
        setPrice(initialData.price || 0);
        setPriceInput(initialData.price ? String(initialData.price) : '');
        setPaymentMethod(initialData.paymentMethod === 'Hutang' ? 'Hutang' : 'Lunas');
        setTransactionType(initialData.transactionType || defaultType);

        const matched = inventoryItems.find(
          (i) => i.name.toLowerCase() === initialData.name?.toLowerCase()
        );
        if (matched) setSelectedInventoryItem(matched);
      } else {
        setName('');
        setCustomerName('');
        setCategory('Bahan Baku');
        setStock(0);
        setQuantity(1);
        setUnit('Pcs');
        setPcsPerUnit(1);
        setPrice(0);
        setPriceInput('');
        setPaymentMethod('Lunas');
        setTransactionType(defaultType);
        setSelectedInventoryItem(null);
      }
    }
  }, [visible, initialData, defaultType, inventoryItems]);

  const handleSelectInventoryItem = (item: InventoryItem) => {
    if (transactionType === 'IN' && item.category === 'Operasional') {
      Alert.alert(
        'Kategori Operasional Dikunci',
        'Barang dengan kategori Operasional tidak dapat dijual / dijadikan Pemasukan karena khusus untuk Pengeluaran operasional toko.'
      );
      return;
    }

    setSelectedInventoryItem(item);
    setName(item.name);
    setCategory(item.category);
    setStock(item.stock);
    setUnit('Pcs'); // Load from inventory as Pcs
    setPcsPerUnit(1);
    setPrice(item.sellingPrice > 0 ? item.sellingPrice : item.price);
    setPriceInput(item.sellingPrice > 0 ? String(item.sellingPrice) : (item.price ? String(item.price) : '0'));
    setShowSearchDropdown(false);
    setPickerSearchQuery('');
  };

  const handleQuantityIncrement = () => {
    setQuantity((prev) => prev + 1);
  };

  const handleQuantityDecrement = () => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  };

  const handleSelectCategoryChip = (cat: string) => {
    if (transactionType === 'IN' && cat === 'Operasional') {
      Alert.alert(
        'Kategori Dikunci',
        'Kategori Operasional dikunci untuk Pemasukan karena barang operasional tidak untuk diperjualbelikan.'
      );
      return;
    }
    setCategory(cat);
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert(
        'Barang Belum Dipilih',
        transactionType === 'IN'
          ? 'Silakan pilih barang yang terdaftar dari Inventori.'
          : 'Silakan masukkan nama barang terlebih dahulu.'
      );
      return;
    }

    if (transactionType === 'IN' && !isExactItemInInventory) {
      Alert.alert(
        'Pemasukan Ditolak',
        'Hanya barang yang SUDAH TERDAFTAR di Inventori yang dapat dijual / dijadikan Pemasukan. Silakan gunakan fitur cari di pilihan barang.'
      );
      return;
    }

    if (transactionType === 'IN' && category === 'Operasional') {
      Alert.alert(
        'Transaksi Ditolak',
        'Kategori Operasional dikunci untuk Pemasukan (khusus Pengeluaran toko).'
      );
      return;
    }

    if (transactionType === 'IN' && paymentMethod === 'Hutang' && !customerName.trim()) {
      Alert.alert(
        'Nama Pemesan Wajib',
        'Untuk pembayaran Hutang, nama pemesan wajib diisi agar tercatat di daftar hutang.'
      );
      return;
    }

    const parsedPrice = parseFloat(priceInput.replace(/[^0-9]/g, '')) || price || 0;
    
    // Convert Dus/Pack to Pcs if applicable
    const isPackOrDus = (unit === 'Dus' || unit === 'Pack');
    const finalQuantity = isPackOrDus ? quantity * pcsPerUnit : quantity;
    const finalPrice = isPackOrDus ? parsedPrice / pcsPerUnit : parsedPrice;

    if (transactionType === 'IN') {
      adjustStockByItemName(name.trim(), -finalQuantity);
    } else {
      registerOrRestockExpenseItem({
        name: name.trim(),
        category: category.trim() || 'Bahan Baku',
        quantity: finalQuantity,
        unit: 'Pcs',
        price: finalPrice,
      });
    }

    onSave({
      id: initialData?.id,
      name: name.trim(),
      customerName: customerName.trim() || 'Admin',
      category: category.trim() || 'Bahan Baku',
      stock,
      quantity: finalQuantity,
      unit: 'Pcs',
      price: finalPrice,
      paymentMethod,
      transactionType,
    });

    onClose();
  };

  const handleDelete = () => {
    if (!initialData?.id || !onDelete) return;

    Alert.alert('Konfirmasi Hapus', `Apakah Anda yakin ingin menghapus pesanan "${name}"?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: () => {
          onDelete(initialData.id!);
          onClose();
        },
      },
    ]);
  };

  const handleGoToInventory = () => {
    onClose();
    router.push('/inventory');
  };

  const formatRupiah = (num: number) => {
    return 'Rp ' + num.toLocaleString('id-ID');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => {
            Keyboard.dismiss();
            onClose();
          }}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
          pointerEvents="box-none"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalContainer}>
              <View style={styles.handleBar} />

              <View style={styles.header}>
                <View style={styles.headerRow}>
                  <View style={styles.headerIconBadge}>
                    <Ionicons
                      name={transactionType === 'IN' ? 'cart-outline' : 'receipt-outline'}
                      size={22}
                      color="#14A39F"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title}>
                      {isEditing
                        ? 'Edit Transaksi'
                        : transactionType === 'OUT'
                        ? 'Tambah Pengeluaran'
                        : 'Tambah Pemasukan'}
                    </Text>
                    <Text style={styles.subtitle}>
                      {transactionType === 'OUT'
                        ? 'Pengeluaran otomatis mendaftarkan stok ke Inventori'
                        : 'Pilih barang terdaftar dari Inventori'}
                    </Text>
                  </View>
                  <TouchableOpacity activeOpacity={0.7} style={styles.closeBtn} onPress={onClose}>
                    <Ionicons name="close" size={24} color="#64748B" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.divider} />

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.scrollContent}
              >
                {/* Switcher Tipe Transaksi */}
                <View style={styles.typeToggleContainer}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[
                      styles.typeToggleBtn,
                      transactionType === 'IN' && styles.typeToggleBtnInActive,
                    ]}
                    onPress={() => {
                      setTransactionType('IN');
                      if (category === 'Operasional') {
                        setCategory('Bahan Baku');
                      }
                    }}
                  >
                    <Ionicons
                      name="arrow-down-circle"
                      size={18}
                      color={transactionType === 'IN' ? '#FFFFFF' : '#16A34A'}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.typeToggleText,
                        transactionType === 'IN' && styles.typeToggleTextActive,
                      ]}
                    >
                      Pemasukan
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[
                      styles.typeToggleBtn,
                      transactionType === 'OUT' && styles.typeToggleBtnOutActive,
                    ]}
                    onPress={() => setTransactionType('OUT')}
                  >
                    <Ionicons
                      name="arrow-up-circle"
                      size={18}
                      color={transactionType === 'OUT' ? '#FFFFFF' : '#DC2626'}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.typeToggleText,
                        transactionType === 'OUT' && styles.typeToggleTextActive,
                      ]}
                    >
                      Pengeluaran
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* FIELD: NAMA PEMESAN (Hanya untuk Pemasukan) */}
                {transactionType === 'IN' && (
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>
                      Nama Pemesan {paymentMethod === 'Hutang' && <Text style={styles.requiredStar}>*</Text>}
                    </Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Contoh: Pak Budi, Bu Ani, Admin..."
                      placeholderTextColor="#94A3B8"
                      value={customerName}
                      onChangeText={setCustomerName}
                    />
                    {paymentMethod === 'Hutang' && !customerName.trim() && (
                      <Text style={{ fontSize: 11, color: '#D97706', fontWeight: '600', marginTop: 4 }}>
                        ⚠️ Wajib diisi untuk pembayaran Hutang
                      </Text>
                    )}
                  </View>
                )}

                {/* FIELD: PILIH BARANG */}
                <View style={styles.formGroup}>
                  <View style={styles.labelHeaderRow}>
                    <Text style={styles.label}>
                      {transactionType === 'IN' ? 'Pilih Barang Inventori' : 'Cari / Nama Barang'}{' '}
                      <Text style={styles.requiredStar}>*</Text>
                    </Text>
                    <TouchableOpacity onPress={handleGoToInventory}>
                      <Text style={styles.addInventoryLink}>Daftar Inventori ➔</Text>
                    </TouchableOpacity>
                  </View>

                  {transactionType === 'IN' ? (
                    <TouchableOpacity
                      activeOpacity={0.85}
                      style={[
                        styles.pickerTriggerBox,
                        showSearchDropdown && styles.pickerTriggerBoxActive,
                      ]}
                      onPress={() => setShowSearchDropdown((prev) => !prev)}
                    >
                      <View style={styles.pickerTriggerLeft}>
                        <View style={styles.lockBadgeIcon}>
                          <Ionicons name="search-outline" size={18} color="#14A39F" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.pickerTriggerTitle,
                              !name && { color: '#94A3B8', fontWeight: '500' },
                            ]}
                          >
                            {name || 'Tekan untuk cari & pilih barang...'}
                          </Text>
                          {selectedInventoryItem ? (
                            <Text style={styles.pickerTriggerSub}>
                              {selectedInventoryItem.category} • Stok: {selectedInventoryItem.stock}{' '}
                              {selectedInventoryItem.unit} • {formatRupiah(selectedInventoryItem.sellingPrice > 0 ? selectedInventoryItem.sellingPrice : selectedInventoryItem.price)}
                            </Text>
                          ) : (
                            <Text style={styles.pickerTriggerLockedNotice}>
                              🔍 Cari barang terdaftar di inventori
                            </Text>
                          )}
                        </View>
                      </View>

                      <Ionicons
                        name={showSearchDropdown ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color="#64748B"
                      />
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.searchInputBox}>
                      <Ionicons name="search" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
                      <TextInput
                        style={styles.searchInputText}
                        placeholder="Ketik nama barang (mis: Indomie, Susu)..."
                        placeholderTextColor="#A1A1AA"
                        value={name}
                        onChangeText={(val) => {
                          setName(val);
                          setShowSearchDropdown(true);
                        }}
                        onFocus={() => setShowSearchDropdown(true)}
                      />
                      {name.length > 0 && (
                        <TouchableOpacity onPress={() => setName('')}>
                          <Ionicons name="close-circle" size={18} color="#94A3B8" />
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {showSearchDropdown && (
                    <View style={styles.searchDropdownContainer}>
                      {transactionType === 'IN' && (
                        <View style={styles.dropdownSearchInputBox}>
                          <Ionicons name="search" size={16} color="#14A39F" style={{ marginRight: 8 }} />
                          <TextInput
                            style={styles.dropdownSearchInputText}
                            placeholder="Cari nama atau kategori barang di inventori..."
                            placeholderTextColor="#94A3B8"
                            value={pickerSearchQuery}
                            onChangeText={setPickerSearchQuery}
                          />
                          {pickerSearchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setPickerSearchQuery('')}>
                              <Ionicons name="close-circle" size={16} color="#94A3B8" />
                            </TouchableOpacity>
                          )}
                        </View>
                      )}

                      <Text style={styles.dropdownHeaderTitle}>
                        {transactionType === 'IN'
                          ? `Daftar Barang Inventori (${matchingPickerItems.length} barang):`
                          : 'Hasil Pencarian Inventori:'}
                      </Text>

                      <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
                        {(transactionType === 'IN' ? matchingPickerItems : matchingExpenseItems).length > 0 ? (
                          (transactionType === 'IN' ? matchingPickerItems : matchingExpenseItems).map(
                            (invItem) => {
                              const isOperasionalLocked =
                                transactionType === 'IN' && invItem.category === 'Operasional';
                              const isSelected = selectedInventoryItem?.id === invItem.id;

                              return (
                                <TouchableOpacity
                                  key={invItem.id}
                                  activeOpacity={0.7}
                                  style={[
                                    styles.dropdownItemRow,
                                    isSelected && styles.dropdownItemRowSelected,
                                    isOperasionalLocked && styles.dropdownItemRowLocked,
                                  ]}
                                  onPress={() => handleSelectInventoryItem(invItem)}
                                >
                                  <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                      <Text
                                        style={[
                                          styles.dropdownItemName,
                                          isOperasionalLocked && styles.textLocked,
                                        ]}
                                      >
                                        {invItem.name}
                                      </Text>
                                      {isOperasionalLocked && (
                                        <View style={styles.lockBadgeMini}>
                                          <Ionicons
                                            name="lock-closed"
                                            size={10}
                                            color="#DC2626"
                                            style={{ marginRight: 2 }}
                                          />
                                          <Text style={styles.lockBadgeMiniText}>Operasional</Text>
                                        </View>
                                      )}
                                    </View>
                                    <Text style={styles.dropdownItemMeta}>
                                      {invItem.category} • {formatRupiah(invItem.price)} / {invItem.unit}
                                    </Text>
                                  </View>

                                  <View style={{ alignItems: 'flex-end', flexDirection: 'row' }}>
                                    <Text style={styles.dropdownStockBadge}>
                                      Stok: {invItem.stock} {invItem.unit}
                                    </Text>
                                    {isSelected && (
                                      <Ionicons
                                        name="checkmark-circle"
                                        size={18}
                                        color="#14A39F"
                                        style={{ marginLeft: 6 }}
                                      />
                                    )}
                                  </View>
                                </TouchableOpacity>
                              );
                            }
                          )
                        ) : (
                          <View style={styles.noSearchMatchBox}>
                            <Ionicons name="search-outline" size={24} color="#94A3B8" style={{ marginBottom: 4 }} />
                            <Text style={styles.noMatchTitle}>
                              Barang "{pickerSearchQuery || name}" tidak ditemukan di inventori
                            </Text>
                            <Text style={styles.noMatchSub}>
                              Hanya barang terdaftar di inventori yang dapat dipilih untuk Pemasukan.
                            </Text>
                          </View>
                        )}
                      </ScrollView>
                    </View>
                  )}

                  {name.trim().length > 0 && (
                    <View style={{ marginTop: 6 }}>
                      {isExactItemInInventory ? (
                        <View style={styles.badgeRegistered}>
                          <Ionicons name="checkmark-circle" size={14} color="#16A34A" style={{ marginRight: 4 }} />
                          <Text style={styles.badgeRegisteredText}>
                            Barang Terdaftar di Inventori ({transactionType === 'IN' ? 'Stok berkurang' : 'Stok bertambah'})
                          </Text>
                        </View>
                      ) : (
                        transactionType === 'OUT' && (
                          <View style={styles.badgeNewItem}>
                            <Ionicons name="sparkles" size={14} color="#0284C7" style={{ marginRight: 4 }} />
                            <Text style={styles.badgeNewItemText}>
                              Barang Baru — Otomatis Didaftarkan ke Inventori saat Disimpan
                            </Text>
                          </View>
                        )
                      )}
                    </View>
                  )}
                </View>

                {/* FIELD: KATEGORI */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Kategori Barang</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 6, paddingVertical: 4 }}
                  >
                    {CATEGORY_SUGGESTIONS.map((cat) => {
                      const isSelected = category === cat;
                      const isLocked = transactionType === 'IN' && cat === 'Operasional';

                      return (
                        <TouchableOpacity
                          key={cat}
                          activeOpacity={0.8}
                          style={[
                            styles.catChip,
                            isSelected && styles.catChipActive,
                            isLocked && styles.catChipLocked,
                          ]}
                          onPress={() => handleSelectCategoryChip(cat)}
                        >
                          {isLocked && (
                            <Ionicons name="lock-closed" size={12} color="#94A3B8" style={{ marginRight: 4 }} />
                          )}
                          <Text
                            style={[
                              styles.catChipText,
                              isSelected && styles.catChipTextActive,
                              isLocked && styles.catChipTextLocked,
                            ]}
                          >
                            {cat} {isLocked ? '(Dikunci)' : ''}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* FIELD: HARGA PER PICIS */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>
                    Harga per Picis / Unit (Rp) <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  {transactionType === 'IN' && selectedInventoryItem ? (
                    <View style={styles.readOnlyPriceBox}>
                      <Text style={styles.readOnlyPriceTextLabel}>
                        {formatRupiah(price)} / {unit}
                      </Text>
                      <Text style={styles.readOnlySubText}>Standard Harga Inventori</Text>
                    </View>
                  ) : (
                    <View style={styles.inputPrefixBox}>
                      <Text style={styles.inputPrefixText}>Rp</Text>
                      <TextInput
                        style={styles.prefixedInput}
                        placeholder="Contoh: 3.500"
                        placeholderTextColor="#A1A1AA"
                        keyboardType="numeric"
                        value={priceInput}
                        onChangeText={(val) => {
                          const numeric = val.replace(/[^0-9]/g, '');
                          setPriceInput(numeric);
                          setPrice(parseFloat(numeric) || 0);
                        }}
                      />
                    </View>
                  )}
                </View>

                {/* FIELD: JUMLAH & SATUAN */}
                <View style={styles.rowGrid}>
                  <View style={[styles.formGroup, { flex: 1.2, marginRight: 10 }]}>
                    <Text style={styles.label}>Jumlah (Qty)</Text>
                    <View style={styles.stepperContainer}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        style={styles.stepperBtnMinus}
                        onPress={handleQuantityDecrement}
                      >
                        <Ionicons name="remove" size={18} color="#FFFFFF" />
                      </TouchableOpacity>

                      <Text style={styles.stepperValueText}>{quantity}</Text>

                      <TouchableOpacity
                        activeOpacity={0.8}
                        style={styles.stepperBtnPlus}
                        onPress={handleQuantityIncrement}
                      >
                        <Ionicons name="add" size={18} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Satuan</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ gap: 4 }}
                    >
                      {UNIT_OPTIONS.map((u) => {
                        // Jika IN (penjualan), hide Dus/Pack jika tidak ingin dijual dalam bentuk dus.
                        // User request: "waktu dijual pakai pcs saja"
                        if (transactionType === 'IN' && (u === 'Dus' || u === 'Pack')) return null;

                        const isSelected = unit === u;
                        return (
                          <TouchableOpacity
                            key={u}
                            activeOpacity={0.8}
                            style={[styles.unitMiniChip, isSelected && styles.unitMiniChipActive]}
                            onPress={() => setUnit(u)}
                          >
                            <Text
                              style={[
                                styles.unitMiniChipText,
                                isSelected && styles.unitMiniChipTextActive,
                              ]}
                            >
                              {u}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                </View>

                {/* PCS PER UNIT CONVERSION (Only for Dus/Pack when OUT) */}
                {(unit === 'Dus' || unit === 'Pack') && transactionType === 'OUT' && (
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Satu {unit} isi berapa Pcs? <Text style={styles.requiredStar}>*</Text></Text>
                    <View style={styles.stepperContainer}>
                      <TouchableOpacity style={styles.stepperBtnMinus} onPress={() => setPcsPerUnit(s => Math.max(1, s - 1))}>
                        <Ionicons name="remove" size={18} color="#FFFFFF" />
                      </TouchableOpacity>
                      <TextInput
                        style={[styles.stepperValueText, { flex: 1, textAlign: 'center' }]}
                        keyboardType="numeric"
                        value={String(pcsPerUnit)}
                        onChangeText={(v) => setPcsPerUnit(parseInt(v.replace(/[^0-9]/g, ''), 10) || 1)}
                      />
                      <TouchableOpacity style={styles.stepperBtnPlus} onPress={() => setPcsPerUnit(s => s + 1)}>
                        <Ionicons name="add" size={18} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                    <Text style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
                      Akan otomatis dicatat sebagai {quantity * pcsPerUnit} Pcs di Inventori.
                    </Text>
                  </View>
                )}

                {/* SUBTOTAL */}
                <View style={styles.subtotalCard}>
                  <Text style={styles.subtotalLabel}>
                    Total Transaksi ({quantity} {unit} @ {formatRupiah(price || 0)})
                  </Text>
                  <Text
                    style={[
                      styles.subtotalValue,
                      { color: transactionType === 'IN' ? '#16A34A' : '#DC2626' },
                    ]}
                  >
                    {formatRupiah((price || 0) * quantity)}
                  </Text>
                </View>

                {/* METODE PEMBAYARAN */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Tipe Pembayaran</Text>
                  <View style={styles.paymentMethodRow}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={[
                        styles.paymentChip,
                        paymentMethod === 'Lunas' && styles.paymentChipLunasActive,
                      ]}
                      onPress={() => setPaymentMethod('Lunas')}
                    >
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color={paymentMethod === 'Lunas' ? '#FFFFFF' : '#16A34A'}
                        style={{ marginRight: 4 }}
                      />
                      <Text
                        style={[
                          styles.paymentChipText,
                          paymentMethod === 'Lunas' && styles.paymentChipTextActive,
                        ]}
                      >
                        Tunai / Lunas
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={[
                        styles.paymentChip,
                        paymentMethod === 'Hutang' && styles.paymentChipHutangActive,
                      ]}
                      onPress={() => setPaymentMethod('Hutang')}
                    >
                      <Ionicons
                        name="time"
                        size={16}
                        color={paymentMethod === 'Hutang' ? '#FFFFFF' : '#D97706'}
                        style={{ marginRight: 4 }}
                      />
                      <Text
                        style={[
                          styles.paymentChipText,
                          paymentMethod === 'Hutang' && styles.paymentChipTextActive,
                        ]}
                      >
                        Hutang / Kasbon
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>

              {/* ACTIONS */}
              <View style={styles.actionRow}>
                {isEditing && onDelete && (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.deleteBtn}
                    onPress={handleDelete}
                  >
                    <Ionicons name="trash-outline" size={18} color="#DC2626" />
                  </TouchableOpacity>
                )}

                <TouchableOpacity activeOpacity={0.8} style={styles.cancelBtn} onPress={onClose}>
                  <Text style={styles.cancelBtnText}>Batal</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[
                    styles.saveBtn,
                    transactionType === 'IN' ? styles.saveBtnIn : styles.saveBtnOut,
                  ]}
                  onPress={handleSave}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.saveBtnText}>
                    {isEditing ? 'Perbarui Transaksi' : 'Simpan Transaksi'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  keyboardAvoidingView: {
    width: '100%',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '92%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  handleBar: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 14,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    marginBottom: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  closeBtn: {
    padding: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 14,
  },
  typeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    padding: 4,
    marginBottom: 18,
    gap: 6,
  },
  typeToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  typeToggleBtnInActive: {
    backgroundColor: '#16A34A',
  },
  typeToggleBtnOutActive: {
    backgroundColor: '#DC2626',
  },
  typeToggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  typeToggleTextActive: {
    color: '#FFFFFF',
  },
  formGroup: {
    marginBottom: 16,
  },
  labelHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  fieldHint: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  requiredStar: {
    color: '#EF4444',
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  addInventoryLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#14A39F',
  },
  pickerTriggerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pickerTriggerBoxActive: {
    borderColor: '#14A39F',
    backgroundColor: '#F0FDFA',
  },
  pickerTriggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  lockBadgeIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  pickerTriggerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  pickerTriggerSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  pickerTriggerLockedNotice: {
    fontSize: 11,
    color: '#14A39F',
    fontWeight: '600',
    marginTop: 2,
  },
  searchInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInputText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  searchDropdownContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    marginTop: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  dropdownSearchInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
  },
  dropdownSearchInputText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  dropdownHeaderTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  dropdownItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 4,
    backgroundColor: '#F8FAFC',
  },
  dropdownItemRowSelected: {
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#14A39F',
  },
  dropdownItemRowLocked: {
    opacity: 0.6,
    backgroundColor: '#FEF2F2',
  },
  textLocked: {
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  lockBadgeMini: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  lockBadgeMiniText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#DC2626',
  },
  dropdownItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  dropdownItemMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  dropdownStockBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#14A39F',
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  noSearchMatchBox: {
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noMatchTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
  },
  noMatchSub: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 2,
  },
  badgeRegistered: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  badgeRegisteredText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
  },
  badgeNewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  badgeNewItemText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  catChipActive: {
    backgroundColor: '#14A39F',
  },
  catChipLocked: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    opacity: 0.7,
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  catChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  catChipTextLocked: {
    color: '#94A3B8',
  },
  readOnlyPriceBox: {
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  readOnlyPriceTextLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#10B981',
  },
  readOnlySubText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  inputPrefixBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  inputPrefixText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#14A39F',
    marginRight: 8,
  },
  prefixedInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  rowGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 3,
    justifyContent: 'space-between',
  },
  stepperBtnMinus: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnPlus: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#14A39F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValueText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  unitMiniChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  unitMiniChipActive: {
    backgroundColor: '#0F172A',
  },
  unitMiniChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  unitMiniChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  subtotalCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  subtotalLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    flex: 1,
  },
  subtotalValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  paymentMethodRow: {
    flexDirection: 'row',
    gap: 10,
  },
  paymentChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
  },
  paymentChipLunasActive: {
    backgroundColor: '#16A34A',
  },
  paymentChipHutangActive: {
    backgroundColor: '#D97706',
  },
  paymentChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  paymentChipTextActive: {
    color: '#FFFFFF',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  deleteBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnIn: {
    backgroundColor: '#16A34A',
  },
  saveBtnOut: {
    backgroundColor: '#DC2626',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
