import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { lookupBarcode } from '../services/foodService';
import { FoodItem } from '../types';
import { FONTS, SPACING } from '../utils/constants';
import { useTheme } from '../contexts/ThemeContext';

interface Props {
  onFoodFound: (food: FoodItem) => void;
  onBack: () => void;
}

export default function BarcodeScannerScreen({ onFoodFound, onBack }: Props) {
  const COLORS = useTheme().colors;
  const styles = makeStyles(COLORS);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const lastScannedRef = useRef<string>('');

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    // Prevent duplicate scans of the same barcode
    if (scanned || loading || data === lastScannedRef.current) return;
    setScanned(true);
    setLoading(true);
    lastScannedRef.current = data;

    try {
      const food = await lookupBarcode(data);
      if (food) {
        onFoodFound(food);
      } else {
        Alert.alert('Not found', 'This barcode was not found in the database. Try searching by name or entering manually.', [
          { text: 'OK', onPress: () => { setScanned(false); lastScannedRef.current = ''; } },
        ]);
      }
    } catch (e: any) {
      Alert.alert('Error', `${e?.message || 'Unknown error'}. Check your internet connection.`, [
        { text: 'OK', onPress: () => { setScanned(false); lastScannedRef.current = ''; } },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!permission?.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permText}>Camera permission is required to scan barcodes.</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
        onBarcodeScanned={handleBarCodeScanned}
      />
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <View style={styles.reticle} />
        {loading ? (
          <>
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: SPACING.lg }} />
            <Text style={styles.hint}>Looking up product...</Text>
          </>
        ) : (
          <Text style={styles.hint}>Point camera at barcode</Text>
        )}
      </View>
    </View>
  );
}

const makeStyles = (COLORS: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtn: {
    position: 'absolute',
    top: 60,
    left: SPACING.lg,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  reticle: {
    width: 250,
    height: 150,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 16,
  },
  hint: {
    color: '#fff',
    fontSize: FONTS.sizes.md,
    marginTop: SPACING.lg,
    fontWeight: '600',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.xxl,
  },
  permText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  permBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  permBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: FONTS.sizes.md,
  },
});
