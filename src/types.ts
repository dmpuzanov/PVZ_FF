export type ItemState =
  | 'intake'          // 1. Приёмка (только стикер ШК)
  | 'registration'    // 2. Регистрация (габариты, селлер, артикул)
  | 'storage'         // 3. Хранение (ячейка, учет дней)
  | 'branding'        // 4. Брендирование (опционально)
  | 'packaging'       // 5. Упаковка (по техкарте)
  | 'placed'          // 6. Размещение (готов к заказу)
  | 'assembly'        // 7. Сборка (под заказ WB)
  | 'shipped'         // 8. Отгрузка (передан WB, завершен)
  | 'return_intake'   // 9. Приемка возврата
  | 'return_sorting'  // 10. Сортировка возврата
  | 'return_repair'   // 11. Замена элемента (Категория Б)
  | 'returned_seller';// 12. Возвращен селлеру (Категория В, завершен)

export type ReturnCategory = 'A' | 'B' | 'C' | null;

export interface OperationLog {
  id: string;
  itemId: string;
  inventoryNumber: string;
  state: ItemState;
  stateName: string;
  timestamp: string; // ISO date
  cost: number;
  operator: string;
  details?: string;
  meta?: {
    cell?: string;
    dimensions?: { length: number; width: number; height: number; weight: number; volumeM3: number };
    brandName?: string;
    packagingType?: string;
    orderNumber?: string;
    wbBarcode?: string;
    wbMpSticker?: string;
    returnReason?: string;
    returnNumber?: string;
    returnCategory?: ReturnCategory;
    repairNotes?: string;
    weightCategory?: WeightCategory;
    weightKg?: number;
    storageDays?: number;
    chargeableDays?: number;
  };
}

export interface InventoryItem {
  id: string;
  inventoryNumber: string; // e.g. "INV-2025-00101"
  currentState: ItemState;
  createdAt: string;
  updatedAt: string;

  // Registration info
  sellerId?: string;
  sellerName?: string;
  title?: string;
  sellerSku?: string; // Артикул продавца
  barcodeEan?: string; // ШК производителя
  dimensions?: {
    length: number; // см
    width: number;  // см
    height: number; // см
    weight: number; // кг
    volumeLiters: number; // л
    volumeM3: number; // м³
  };

  // Storage info
  storageCell?: string; // e.g. "A-04-12"
  storageEnteredAt?: string; // ISO date
  storageExitedAt?: string; // ISO date
  
  // Branding info
  brandingRequired?: boolean;
  brandName?: string;
  brandingCompletedAt?: string;

  // Packaging info
  packagingType?: string; // 'Стандарт (Пакет)', 'Пупырчатая пленка + Короб', etc.
  packagingCompletedAt?: string;

  // Placement info
  placementCell?: string;
  placedAt?: string;

  // Assembly info (WB Order)
  orderNumber?: string; // e.g. "WB-789401"
  wbBarcode?: string; // ШК товара
  wbMpSticker?: string; // Стикер WB-MP (поставки)
  assembledAt?: string;

  // Shipping info
  shipmentNumber?: string; // e.g. "ACT-WB-8831"
  shippedAt?: string;

  // Return info
  returnEnteredAt?: string;
  returnReason?: string;
  returnNumber?: string;
  returnCategory?: ReturnCategory; // A (годен), B (замена), C (селлеру)
  returnSortingNotes?: string;
  returnRepairedAt?: string;
  returnedToSellerAt?: string;

  // Financial summary for this specific item
  accumulatedCost: number;
  history: OperationLog[];
}

export interface Seller {
  id: string;
  name: string;
  inn: string;
  contactPerson: string;
  phone: string;
  email: string;
  customTariffs?: Partial<TariffRates>;
  createdAt: string;
}

export type WeightCategory = 'up_to_1kg' | '1_to_5kg' | '5_to_10kg' | 'over_10kg';

export interface WeightTierPrices {
  up_to_1kg: number;  // до 1 кг
  '1_to_5kg': number; // от 1 до 5 кг
  '5_to_10kg': number;// от 5 до 10 кг
  over_10kg: number;  // более 10 кг
}

export interface DirectFlowTariffs {
  intakeAndAccounting: WeightTierPrices;   // Приемка и учет товара (10, 10, 10, 10)
  branding: WeightTierPrices;              // Брендирование товара (10, 10, 15, 20)
  packagingAndPlacement: WeightTierPrices; // Упаковка и размещение (20, 30, 35, 45)
  assemblyAndStickering: WeightTierPrices; // Сборка и стикерование (10, 15, 25, 30)
}

export interface ReturnFlowTariffs {
  intakeAndInspection: WeightTierPrices;   // Приемка, осмотр (10, 10, 10, 10)
  verification: WeightTierPrices;          // Проверка (10, 15, 20, 25)
  restoration: WeightTierPrices;           // Восстановление (30, 30, 35, 45)
  packagingAndStickering: WeightTierPrices;// Упаковка и стикерование (15, 15, 25, 30)
}

export interface TariffRates {
  // Прямой поток по весовым категориям
  directFlow: DirectFlowTariffs;
  // Обратный поток по весовым категориям
  returnFlow: ReturnFlowTariffs;
  // Хранение
  storageFreeDays: number;  // Бесплатных дней хранения (5 дней)
  storagePerDay: number;    // Хранение за сутки после бесплатных (10 руб/сут)

  // Опциональные поля для обратной совместимости
  intake?: number;
  registration?: number;
  branding?: number;
  packaging?: number;
  placement?: number;
  assembly?: number;
  shipping?: number;
  returnIntake?: number;
  returnSorting?: number;
  returnRepair?: number;
  returnToSeller?: number;
}

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  sellerId: string;
  sellerName: string;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
  totalAmount: number;
  itemsCount: number;
  operationsBreakdown: {
    state: ItemState;
    name: string;
    count: number;
    totalCost: number;
  }[];
  storageBreakdown: {
    totalStorageDays: number;
    paidStorageDays: number;
    storageCost: number;
  };
  itemDetails: {
    inventoryNumber: string;
    sku: string;
    title: string;
    totalItemCost: number;
    operations: string[];
  }[];
  status: 'draft' | 'issued' | 'paid';
}

export type UserRole = 'admin' | 'operator' | 'seller';

export interface UserSession {
  role: UserRole;
  userName: string;
  sellerId?: string; // only active when role === 'seller'
}

export interface ItemEditPayload {
  title?: string;
  sellerSku?: string;
  barcodeEan?: string;
  sellerId?: string;
  sellerName?: string;
  storageCell?: string;
  placementCell?: string;
  orderNumber?: string;
  wbMpSticker?: string;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    weight: number;
    volumeLiters: number;
    volumeM3: number;
  };
  accumulatedCost?: number;
  brandingRequired?: boolean;
  brandName?: string;
  packagingType?: string;
  returnReason?: string;
  returnCategory?: ReturnCategory;
}
