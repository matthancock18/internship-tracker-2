import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';
import {
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  endConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  useIAP,
  ErrorCode,
  type Purchase,
  type PurchaseError,
  type Product,
  type ProductSubscription,
} from 'react-native-iap';
import { ONETIME_SKUS, SKU, SUBSCRIPTION_SKUS } from '../constants/iap';

export type IAPStatus = 'idle' | 'loading' | 'purchasing' | 'restoring' | 'error';

export interface IAPState {
  isPro: boolean;
  status: IAPStatus;
  products: Product[];
  subscriptions: ProductSubscription[];
  connected: boolean;
  purchase: (sku: string) => Promise<void>;
  restore: () => Promise<void>;
  setIsPro: (v: boolean) => void;
}

// Persist pro status
const PRO_KEY = 'isPro';

const saveProStatus = async (value: boolean) => {
  await AsyncStorage.setItem(PRO_KEY, value ? 'true' : 'false');
};

export function useIAPPurchase(initialIsPro: boolean): IAPState {
  const [isPro, setIsProState] = useState(initialIsPro);
  const [status, setStatus] = useState<IAPStatus>('idle');
  const purchaseListenerRef = useRef<{ remove(): void } | null>(null);
  const errorListenerRef = useRef<{ remove(): void } | null>(null);
  const connectedRef = useRef(false);

  const {
    connected,
    products,
    subscriptions,
    fetchProducts,
    requestPurchase,
  } = useIAP();

  const setIsPro = useCallback((value: boolean) => {
    setIsProState(value);
    saveProStatus(value);
  }, []);

  // Validate a purchase object — if it has a transaction ID it's legit
  const handleValidPurchase = useCallback(async (purchase: Purchase) => {
    try {
      await finishTransaction({ purchase, isConsumable: false });
    } catch {}
    setIsPro(true);
    setStatus('idle');
  }, [setIsPro]);

  // Init connection and register listeners once
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        await initConnection();
        connectedRef.current = true;

        if (!mounted) return;

        // Fetch products from App Store
        await fetchProducts({ skus: ONETIME_SKUS, type: 'in-app' });
        await fetchProducts({ skus: SUBSCRIPTION_SKUS, type: 'subs' });

        // Listen for successful purchases
        purchaseListenerRef.current = purchaseUpdatedListener(async (purchase: Purchase) => {
          if (purchase && purchase.transactionId) {
            await handleValidPurchase(purchase);
          }
        });

        // Listen for purchase errors
        errorListenerRef.current = purchaseErrorListener((error: PurchaseError) => {
          if (error.code !== ErrorCode.UserCancelled) {
            Alert.alert(
              'Purchase Failed',
              error.message || 'Something went wrong. Please try again.',
            );
          }
          setStatus('idle');
        });
      } catch (e) {
        // IAP not available (simulator, no network, etc.) — fail silently
        if (mounted) setStatus('idle');
      }
    };

    init();

    return () => {
      mounted = false;
      purchaseListenerRef.current?.remove();
      errorListenerRef.current?.remove();
      endConnection();
    };
  }, []);

  const purchase = useCallback(async (sku: string) => {
    setStatus('purchasing');
    try {
      const isSubscription = SUBSCRIPTION_SKUS.includes(sku as any);
      if (isSubscription) {
        await requestPurchase({
          type: 'subs',
          request: {
            apple: { sku },
          },
        });
      } else {
        await requestPurchase({
          type: 'in-app',
          request: {
            apple: { sku },
          },
        });
      }
      // Result arrives via purchaseUpdatedListener — status set there
    } catch (e: any) {
      if ((e as any)?.code !== ErrorCode.UserCancelled) {
        Alert.alert('Purchase Error', e?.message || 'Could not complete purchase.');
      }
      setStatus('idle');
    }
  }, [requestPurchase]);

  const restore = useCallback(async () => {
    setStatus('restoring');
    try {
      const purchases = await getAvailablePurchases();
      const hasActivePro = purchases.some(p =>
        Object.values(SKU).includes(p.productId as typeof SKU[keyof typeof SKU])
      );
      if (hasActivePro) {
        setIsPro(true);
        Alert.alert('Restored', 'Your Trax Pro subscription has been restored.');
      } else {
        Alert.alert('Nothing to Restore', 'No previous Trax Pro purchase found on this Apple ID.');
      }
    } catch (e: any) {
      Alert.alert('Restore Failed', e?.message || 'Could not restore purchases.');
    } finally {
      setStatus('idle');
    }
  }, [setIsPro]);

  return {
    isPro,
    status,
    products,
    subscriptions,
    connected,
    purchase,
    restore,
    setIsPro,
  };
}
