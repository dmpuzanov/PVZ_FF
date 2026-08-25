import {
  InventoryItem,
  ItemState,
  OperationLog,
  ReturnCategory,
  Seller,
  TariffRates,
  InvoiceRecord,
  WeightCategory,
  ItemEditPayload,
  UserSession,
} from '../types';
import { DEFAULT_TARIFFS, INITIAL_ITEMS, INITIAL_SELLERS } from '../data/initialData';

const STORAGE_KEY_ITEMS = 'pvz_inventory_items_v2';
const STORAGE_KEY_SELLERS = 'pvz_sellers_v2';
const STORAGE_KEY_TARIFFS = 'pvz_tariffs_v2';
const STORAGE_KEY_INVOICES = 'pvz_invoices_v2';
const STORAGE_KEY_SESSION = 'pvz_user_session_v1';

export const WEIGHT_CATEGORY_LABELS: Record<WeightCategory, string> = {
  up_to_1kg: 'до 1 кг',
  '1_to_5kg': 'от 1 до 5 кг',
  '5_to_10kg': 'от 5 до 10 кг',
  over_10kg: 'более 10 кг',
};

export function getWeightCategory(weightInKg?: number): WeightCategory {
  if (weightInKg === undefined || weightInKg === null || isNaN(weightInKg) || weightInKg <= 1) {
    return 'up_to_1kg';
  }
  if (weightInKg <= 5) {
    return '1_to_5kg';
  }
  if (weightInKg <= 10) {
    return '5_to_10kg';
  }
  return 'over_10kg';
}

export const STATE_CONFIG: Record<
  ItemState,
  {
    name: string;
    shortName: string;
    description: string;
    badgeColor: string;
    borderColor: string;
    icon: string;
    isReturnFlow?: boolean;
    isTerminal?: boolean;
    order: number;
  }
> = {
  intake: {
    name: '1. Приёмка',
    shortName: 'ПРИЁМКА',
    description: 'Товар занесен в ПВЗ, присвоен инвентарный стикер и штрих-код',
    badgeColor: 'bg-gray-200 text-black font-black uppercase tracking-tight',
    borderColor: 'border-black',
    icon: 'PackagePlus',
    order: 1,
  },
  registration: {
    name: '2. Регистрация',
    shortName: 'РЕГИСТРАЦИЯ',
    description: 'Привязаны селлер, артикул, вес, ДxШxВ и рассчитан объём',
    badgeColor: 'bg-blue-100 text-blue-900 font-black uppercase tracking-tight border border-blue-300',
    borderColor: 'border-blue-500',
    icon: 'FileSpreadsheet',
    order: 2,
  },
  storage: {
    name: '3. Хранение',
    shortName: 'ХРАНЕНИЕ',
    description: 'Размещен в ячейке хранения. Первые 5 дней бесплатно',
    badgeColor: 'bg-yellow-400 text-black font-black uppercase tracking-tight',
    borderColor: 'border-yellow-500',
    icon: 'Warehouse',
    order: 3,
  },
  branding: {
    name: '4. Брендирование',
    shortName: 'БРЕНДИРОВАНИЕ',
    description: 'Нанесение фирменных этикеток/лейблов селлера (по запросу)',
    badgeColor: 'bg-purple-600 text-white font-black uppercase tracking-tight',
    borderColor: 'border-purple-600',
    icon: 'Tag',
    order: 4,
  },
  packaging: {
    name: '5. Упаковка',
    shortName: 'УПАКОВКА',
    description: 'Упакован по технологической карте',
    badgeColor: 'bg-teal-500 text-white font-black uppercase tracking-tight',
    borderColor: 'border-teal-500',
    icon: 'Box',
    order: 5,
  },
  placed: {
    name: '6. Размещение',
    shortName: 'РАЗМЕЩЕНИЕ',
    description: 'Готов к заказу. Находится в зоне готовой продукции',
    badgeColor: 'bg-emerald-500 text-white font-black uppercase tracking-tight',
    borderColor: 'border-emerald-500',
    icon: 'CheckCircle2',
    order: 6,
  },
  assembly: {
    name: '7. Сборка',
    shortName: 'СБОРКА',
    description: 'Зарезервирован под заказ, нанесены стикер ШК и WB-MP',
    badgeColor: 'bg-blue-600 text-white font-black uppercase tracking-tight',
    borderColor: 'border-blue-600',
    icon: 'Boxes',
    order: 7,
  },
  shipped: {
    name: '8. Отгрузка',
    shortName: 'ОТГРУЗКА',
    description: 'Передан в логистику Wildberries. Выход из системы',
    badgeColor: 'bg-green-600 text-white font-black uppercase tracking-tight',
    borderColor: 'border-green-600',
    icon: 'Truck',
    isTerminal: true,
    order: 8,
  },
  return_intake: {
    name: 'Возврат: Приёмка',
    shortName: 'ВОЗВРАТ: ПРИЁМ',
    description: 'Поступил возврат от покупателя WB, зафиксирована причина',
    badgeColor: 'bg-rose-500 text-white font-black uppercase tracking-tight',
    borderColor: 'border-rose-500',
    icon: 'RotateCcw',
    isReturnFlow: true,
    order: 9,
  },
  return_sorting: {
    name: 'Возврат: Сортировка',
    shortName: 'СОРТИРОВКА',
    description: 'Экспертная оценка: Категория А (годен), Б (ремонт), В (селлеру)',
    badgeColor: 'bg-pink-600 text-white font-black uppercase tracking-tight',
    borderColor: 'border-pink-600',
    icon: 'GitFork',
    isReturnFlow: true,
    order: 10,
  },
  return_repair: {
    name: 'Возврат: Замена детали (Б)',
    shortName: 'ВОЗВРАТ: Б (РЕМОНТ)',
    description: 'Замена элемента из запаса селлера перед переупаковкой',
    badgeColor: 'bg-red-600 text-white font-black uppercase tracking-tight',
    borderColor: 'border-red-600',
    icon: 'Wrench',
    isReturnFlow: true,
    order: 11,
  },
  returned_seller: {
    name: 'Возвращен селлеру (В)',
    shortName: 'ВОЗВРАТ: В (СЕЛЛЕРУ)',
    description: 'Категория В: неремонтопригоден, передан селлеру. Выход из системы',
    badgeColor: 'bg-black text-white font-black uppercase tracking-tight',
    borderColor: 'border-black',
    icon: 'CornerUpLeft',
    isReturnFlow: true,
    isTerminal: true,
    order: 12,
  },
};

export class StorageService {
  private static get<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      if (!item) return defaultValue;
      return JSON.parse(item);
    } catch {
      return defaultValue;
    }
  }

  private static set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage set error:', e);
    }
  }

  static getTariffs(): TariffRates {
    const raw = this.get<any>(STORAGE_KEY_TARIFFS, null);
    if (!raw || !raw.directFlow || !raw.returnFlow) {
      this.set(STORAGE_KEY_TARIFFS, DEFAULT_TARIFFS);
      return DEFAULT_TARIFFS;
    }
    return raw as TariffRates;
  }

  static saveTariffs(tariffs: TariffRates): void {
    this.set(STORAGE_KEY_TARIFFS, tariffs);
  }

  /**
   * Получить стоимость конкретной операции в зависимости от веса товара
   */
  static getOperationRate(
    state: ItemState,
    weightInKg?: number,
    tariffs: TariffRates = this.getTariffs()
  ): number {
    const cat = getWeightCategory(weightInKg);
    switch (state) {
      // 1. Прямой поток
      case 'intake':
        return tariffs.directFlow?.intake?.[cat] ?? 1;
      case 'registration':
        return 0; 
      case 'branding':
        return tariffs.directFlow?.branding?.[cat] ?? 3;
      case 'packaging':
        return tariffs.directFlow?.packaging?.[cat] ?? 8;
      case 'placed':
        return 0; 
      case 'assembly':
        return tariffs.directFlow?.assembly?.[cat] ?? 1;
      case 'shipped':
        return 0; 

      // 2. Обратный поток
      case 'return_intake':
        return tariffs.returnFlow?.intake?.[cat] ?? 1;
      case 'return_sorting':
        return tariffs.returnFlow?.verification?.[cat] ?? 5;
      case 'return_repair':
        return tariffs.returnFlow?.restoration?.[cat] ?? 15;
      case 'returned_seller':
        return tariffs.returnFlow?.packaging?.[cat] ?? 9;

      case 'storage':
        return 0; 
      default:
        return 0;
    }
  }

  /**
   * Подсчёт суммарной мотивации прямого потока по всем 4 весовым категориям
   */
  static getDirectFlowTotals(tariffs: TariffRates = this.getTariffs()): Record<WeightCategory, number> {
    const cats: WeightCategory[] = ['up_to_1kg', '1_to_5kg', '5_to_10kg', 'over_10kg'];
    const res = {} as Record<WeightCategory, number>;
    cats.forEach((cat) => {
      res[cat] =
        (tariffs.directFlow?.intake?.[cat] || 0) +
        (tariffs.directFlow?.branding?.[cat] || 0) +
        (tariffs.directFlow?.packaging?.[cat] || 0) +
        (tariffs.directFlow?.assembly?.[cat] || 0);
    });
    return res;
  }

  /**
   * Подсчёт суммарной мотивации обратного потока по всем 4 весовым категориям
   */
  static getReturnFlowTotals(tariffs: TariffRates = this.getTariffs()): Record<WeightCategory, number> {
    const cats: WeightCategory[] = ['up_to_1kg', '1_to_5kg', '5_to_10kg', 'over_10kg'];
    const res = {} as Record<WeightCategory, number>;
    cats.forEach((cat) => {
      res[cat] =
        (tariffs.returnFlow?.intake?.[cat] || 0) +
        (tariffs.returnFlow?.verification?.[cat] || 0) +
        (tariffs.returnFlow?.restoration?.[cat] || 0) +
        (tariffs.returnFlow?.packaging?.[cat] || 0);
    });
    return res;
  }

  static getSellers(): Seller[] {
    const sellers = this.get<Seller[]>(STORAGE_KEY_SELLERS, []);
    if (!sellers || sellers.length === 0) {
      this.set(STORAGE_KEY_SELLERS, INITIAL_SELLERS);
      return INITIAL_SELLERS;
    }
    return sellers;
  }

  static saveSeller(seller: Seller): void {
    const sellers = this.getSellers();
    const idx = sellers.findIndex((s) => s.id === seller.id);
    if (idx >= 0) {
      sellers[idx] = seller;
    } else {
      sellers.push(seller);
    }
    this.set(STORAGE_KEY_SELLERS, sellers);
  }

  static getItems(): InventoryItem[] {
    const items = this.get<InventoryItem[]>(STORAGE_KEY_ITEMS, []);
    if (!items || items.length === 0) {
      this.set(STORAGE_KEY_ITEMS, INITIAL_ITEMS);
      return INITIAL_ITEMS;
    }
    return items;
  }

  static saveItems(items: InventoryItem[]): void {
    this.set(STORAGE_KEY_ITEMS, items);
  }

  static getItemById(id: string): InventoryItem | undefined {
    return this.getItems().find((i) => i.id === id || i.inventoryNumber.toLowerCase() === id.toLowerCase());
  }

  static getItemBySticker(sticker: string): InventoryItem | undefined {
    const clean = sticker.trim().toLowerCase();
    return this.getItems().find(
      (i) =>
        i.inventoryNumber.toLowerCase() === clean ||
        i.sellerSku?.toLowerCase() === clean ||
        i.barcodeEan?.toLowerCase() === clean ||
        i.wbBarcode?.toLowerCase() === clean ||
        i.wbMpSticker?.toLowerCase() === clean ||
        i.orderNumber?.toLowerCase() === clean
    );
  }

  static generateNextInventoryNumber(): string {
    const items = this.getItems();
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;
    let maxSeq = 100;

    items.forEach((it) => {
      if (it.inventoryNumber.startsWith(prefix)) {
        const numPart = parseInt(it.inventoryNumber.replace(prefix, ''), 10);
        if (!isNaN(numPart) && numPart > maxSeq) {
          maxSeq = numPart;
        }
      }
    });

    const next = maxSeq + 1;
    return `${prefix}${String(next).padStart(5, '0')}`;
  }

  static createIntakeItem(operator = 'Оператор ПВЗ', customSticker?: string): InventoryItem {
    const tariffs = this.getTariffs();
    const inventoryNumber = customSticker?.trim() || this.generateNextInventoryNumber();
    const id = `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();
    const intakeCost = this.getOperationRate('intake', undefined, tariffs);

    const log: OperationLog = {
      id: `log-${Date.now()}-1`,
      itemId: id,
      inventoryNumber,
      state: 'intake',
      stateName: 'Приёмка и учёт товара',
      timestamp: now,
      cost: intakeCost,
      operator,
      details: 'Товар принят в ПВЗ, присвоен инвентарный номер и штрих-код',
      meta: {
        weightCategory: 'up_to_1kg',
      },
    };

    const newItem: InventoryItem = {
      id,
      inventoryNumber,
      currentState: 'intake',
      createdAt: now,
      updatedAt: now,
      accumulatedCost: intakeCost,
      history: [log],
    };

    const items = this.getItems();
    items.unshift(newItem);
    this.saveItems(items);
    return newItem;
  }

  static createBulkIntake(count: number, operator = 'Оператор ПВЗ'): InventoryItem[] {
    const created: InventoryItem[] = [];
    for (let i = 0; i < count; i++) {
      const item = this.createIntakeItem(operator);
      created.push(item);
    }
    return created;
  }

  static calculateStorageFee(item: InventoryItem, tariffs = this.getTariffs()): {
    totalDays: number;
    freeDays: number;
    chargeableDays: number;
    storageCost: number;
    isCurrentlyInStorage: boolean;
  } {
    if (!item.storageEnteredAt) {
      return { totalDays: 0, freeDays: tariffs.storageFreeDays, chargeableDays: 0, storageCost: 0, isCurrentlyInStorage: false };
    }

    const startDate = new Date(item.storageEnteredAt).getTime();
    const endDate = item.storageExitedAt ? new Date(item.storageExitedAt).getTime() : Date.now();
    const diffMs = Math.max(0, endDate - startDate);
    const totalDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const freeDays = tariffs.storageFreeDays;
    const chargeableDays = Math.max(0, totalDays - freeDays);
    const storageCost = chargeableDays * tariffs.storagePerDay;

    return {
      totalDays,
      freeDays,
      chargeableDays,
      storageCost,
      isCurrentlyInStorage: item.currentState === 'storage' && !item.storageExitedAt,
    };
  }

  static advanceItemState(
    itemId: string,
    nextState: ItemState,
    payload: {
      operator?: string;
      details?: string;
      sellerId?: string;
      sellerName?: string;
      title?: string;
      sellerSku?: string;
      barcodeEan?: string;
      dimensions?: {
        length: number;
        width: number;
        height: number;
        weight: number;
      };
      storageCell?: string;
      brandingRequired?: boolean;
      brandName?: string;
      packagingType?: string;
      placementCell?: string;
      orderNumber?: string;
      wbBarcode?: string;
      wbMpSticker?: string;
      shipmentNumber?: string;
      returnReason?: string;
      returnNumber?: string;
      returnCategory?: ReturnCategory;
      returnSortingNotes?: string;
      repairNotes?: string;
    }
  ): InventoryItem {
    const items = this.getItems();
    const idx = items.findIndex((it) => it.id === itemId);
    if (idx === -1) {
      throw new Error(`Товар с ID ${itemId} не найден`);
    }

    const item = { ...items[idx] };
    const tariffs = this.getTariffs();
    const now = new Date().toISOString();
    const operator = payload.operator || 'Оператор ПВЗ';

    const currentWeight = payload.dimensions?.weight ?? item.dimensions?.weight;
    const weightCat = getWeightCategory(currentWeight);
    const weightCatLabel = WEIGHT_CATEGORY_LABELS[weightCat];

    const stateMeta: OperationLog['meta'] = {
      weightCategory: weightCat,
      weightKg: currentWeight,
    };

    if (item.currentState === 'storage' && nextState !== 'storage' && !item.storageExitedAt) {
      item.storageExitedAt = now;
      const storageCalc = this.calculateStorageFee(item, tariffs);
      if (storageCalc.storageCost > 0) {
        const storageLog: OperationLog = {
          id: `log-${Date.now()}-storage`,
          itemId: item.id,
          inventoryNumber: item.inventoryNumber,
          state: 'storage',
          stateName: 'Начисление за хранение',
          timestamp: now,
          cost: storageCalc.storageCost,
          operator: 'Система (Биллинг)',
          details: `Хранение: ${storageCalc.totalDays} дн. (платных: ${storageCalc.chargeableDays} дн. по ${tariffs.storagePerDay} ₽/дн)`,
          meta: {
            storageDays: storageCalc.totalDays,
            chargeableDays: storageCalc.chargeableDays,
            weightCategory: weightCat,
            weightKg: currentWeight,
          },
        };
        item.history.push(storageLog);
        item.accumulatedCost += storageCalc.storageCost;
      }
    }

    const operationCost = this.getOperationRate(nextState, currentWeight, tariffs);

    switch (nextState) {
      case 'registration': {
        if (payload.sellerId) item.sellerId = payload.sellerId;
        if (payload.sellerName) item.sellerName = payload.sellerName;
        if (payload.title) item.title = payload.title;
        if (payload.sellerSku) item.sellerSku = payload.sellerSku;
        if (payload.barcodeEan) item.barcodeEan = payload.barcodeEan;

        if (payload.dimensions) {
          const { length, width, height, weight } = payload.dimensions;
          const volumeLiters = parseFloat(((length * width * height) / 1000).toFixed(2));
          const volumeM3 = parseFloat(((length * width * height) / 1000000).toFixed(4));
          item.dimensions = { length, width, height, weight, volumeLiters, volumeM3 };
          stateMeta.dimensions = { length, width, height, weight, volumeM3 };
        }
        break;
      }
      case 'storage': {
        item.storageCell = payload.storageCell || item.storageCell || 'A-01-01';
        item.storageEnteredAt = now;
        item.storageExitedAt = undefined;
        stateMeta.cell = item.storageCell;
        break;
      }
      case 'branding': {
        item.brandingRequired = true;
        item.brandName = payload.brandName || item.brandName || 'Фирменный бренд';
        item.brandingCompletedAt = now;
        stateMeta.brandName = item.brandName;
        break;
      }
      case 'packaging': {
        item.packagingType = payload.packagingType || item.packagingType || 'Стандартная упаковка (Пакет + воздушно-пузырчатая пленка)';
        item.packagingCompletedAt = now;
        stateMeta.packagingType = item.packagingType;
        break;
      }
      case 'placed': {
        item.placementCell = payload.placementCell || item.placementCell || 'READY-01';
        item.placedAt = now;
        stateMeta.cell = item.placementCell;
        break;
      }
      case 'assembly': {
        item.orderNumber = payload.orderNumber || item.orderNumber || `WB-${Math.floor(10000000 + Math.random() * 90000000)}`;
        item.wbBarcode = payload.wbBarcode || item.barcodeEan || item.sellerSku || 'WB-BC-DEFAULT';
        item.wbMpSticker = payload.wbMpSticker || `WB-MP-${Math.floor(1000000 + Math.random() * 9000000)}`;
        item.assembledAt = now;
        stateMeta.orderNumber = item.orderNumber;
        stateMeta.wbBarcode = item.wbBarcode;
        stateMeta.wbMpSticker = item.wbMpSticker;
        break;
      }
      case 'shipped': {
        item.shipmentNumber = payload.shipmentNumber || `ACT-WB-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(10 + Math.random() * 90)}`;
        item.shippedAt = now;
        stateMeta.orderNumber = item.orderNumber;
        stateMeta.wbMpSticker = item.wbMpSticker;
        break;
      }
      case 'return_intake': {
        item.returnEnteredAt = now;
        item.returnReason = payload.returnReason || 'Отказ покупателя при вручении в ПВЗ';
        item.returnNumber = payload.returnNumber || `RET-WB-${Math.floor(100000 + Math.random() * 900000)}`;
        stateMeta.returnReason = item.returnReason;
        stateMeta.returnNumber = item.returnNumber;
        break;
      }
      case 'return_sorting': {
        item.returnCategory = payload.returnCategory || 'A';
        item.returnSortingNotes = payload.returnSortingNotes || payload.details || '';
        stateMeta.returnCategory = item.returnCategory;
        break;
      }
      case 'return_repair': {
        item.returnRepairedAt = now;
        stateMeta.repairNotes = payload.repairNotes || 'Замена детали из запаса селлера произведена';
        break;
      }
      case 'returned_seller': {
        item.returnedToSellerAt = now;
        break;
      }
    }

    const stateConfig = STATE_CONFIG[nextState];
    const log: OperationLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      itemId: item.id,
      inventoryNumber: item.inventoryNumber,
      state: nextState,
      stateName: stateConfig.name,
      timestamp: now,
      cost: operationCost,
      operator,
      details: payload.details || `${stateConfig.description} (Категория: ${weightCatLabel})`,
      meta: stateMeta,
    };

    item.currentState = nextState;
    item.updatedAt = now;
    item.accumulatedCost += operationCost;
    item.history.push(log);

    items[idx] = item;
    this.saveItems(items);
    return item;
  }

  static generateInvoice(sellerId: string, periodStart: string, periodEnd: string): InvoiceRecord {
    const sellers = this.getSellers();
    const seller = sellers.find((s) => s.id === sellerId);
    if (!seller) throw new Error('Селлер не найден');

    const items = this.getItems().filter((i) => i.sellerId === sellerId);
    const startMs = new Date(periodStart).getTime();
    const endMs = new Date(periodEnd).setHours(23, 59, 59, 999);

    const opsMap: Record<ItemState, { count: number; totalCost: number; name: string }> = {
      intake: { count: 0, totalCost: 0, name: 'Приёмка товара' },
      registration: { count: 0, totalCost: 0, name: 'Регистрация и обмер' },
      storage: { count: 0, totalCost: 0, name: 'Хранение (сверх 5 дней)' },
      branding: { count: 0, totalCost: 0, name: 'Брендирование' },
      packaging: { count: 0, totalCost: 0, name: 'Упаковка по техкарте' },
      placed: { count: 0, totalCost: 0, name: 'Размещение на полку готовности' },
      assembly: { count: 0, totalCost: 0, name: 'Сборка заказа Wildberries' },
      shipped: { count: 0, totalCost: 0, name: 'Отгрузка в логистику WB' },
      return_intake: { count: 0, totalCost: 0, name: 'Приёмка возврата' },
      return_sorting: { count: 0, totalCost: 0, name: 'Сортировка возврата' },
      return_repair: { count: 0, totalCost: 0, name: 'Замена элемента (Кат. Б)' },
      returned_seller: { count: 0, totalCost: 0, name: 'Оформление возврата селлеру (Кат. В)' },
    };

    let totalAmount = 0;
    let totalStorageDays = 0;
    let paidStorageDays = 0;
    let storageCost = 0;

    const itemDetails: InvoiceRecord['itemDetails'] = [];

    items.forEach((item) => {
      let itemInPeriodCost = 0;
      const executedOps: string[] = [];

      item.history.forEach((log) => {
        const logTime = new Date(log.timestamp).getTime();
        if (logTime >= startMs && logTime <= endMs) {
          if (opsMap[log.state]) {
            opsMap[log.state].count += 1;
            opsMap[log.state].totalCost += log.cost;
          }
          itemInPeriodCost += log.cost;
          executedOps.push(`${log.stateName} (${log.cost} ₽)`);

          if (log.state === 'storage' && log.meta?.chargeableDays) {
            totalStorageDays += log.meta.storageDays || 0;
            paidStorageDays += log.meta.chargeableDays || 0;
            storageCost += log.cost;
          }
        }
      });

      if (itemInPeriodCost > 0) {
        totalAmount += itemInPeriodCost;
        itemDetails.push({
          inventoryNumber: item.inventoryNumber,
          sku: item.sellerSku || '—',
          title: item.title || 'Товар без наименования',
          totalItemCost: itemInPeriodCost,
          operations: executedOps,
        });
      }
    });

    const operationsBreakdown = Object.entries(opsMap)
      .filter(([_, val]) => val.count > 0 || val.totalCost > 0)
      .map(([state, val]) => ({
        state: state as ItemState,
        name: val.name,
        count: val.count,
        totalCost: val.totalCost,
      }));

    const invoiceNum = `INV-ACT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const invoice: InvoiceRecord = {
      id: `invoice-${Date.now()}`,
      invoiceNumber: invoiceNum,
      sellerId: seller.id,
      sellerName: seller.name,
      periodStart,
      periodEnd,
      createdAt: new Date().toISOString(),
      totalAmount,
      itemsCount: itemDetails.length,
      operationsBreakdown,
      storageBreakdown: {
        totalStorageDays,
        paidStorageDays,
        storageCost,
      },
      itemDetails,
      status: 'issued',
    };

    const invoices = this.getInvoices();
    invoices.unshift(invoice);
    this.set(STORAGE_KEY_INVOICES, invoices);

    return invoice;
  }

  static deleteInvoice(invoiceId: string): void {
    const invoices = this.getInvoices().filter((inv) => inv.id !== invoiceId);
    this.set(STORAGE_KEY_INVOICES, invoices);
  }

  static deleteItem(itemId: string): void {
    const items = this.getItems().filter((i) => i.id !== itemId);
    this.saveItems(items);
  }

  static updateItem(itemId: string, payload: ItemEditPayload, adminName = 'Администратор'): InventoryItem {
    const items = this.getItems();
    const idx = items.findIndex((i) => i.id === itemId);
    if (idx === -1) throw new Error('Товар не найден');

    const item = { ...items[idx] };
    const now = new Date().toISOString();

    if (payload.title !== undefined) item.title = payload.title;
    if (payload.sellerSku !== undefined) item.sellerSku = payload.sellerSku;
    if (payload.barcodeEan !== undefined) item.barcodeEan = payload.barcodeEan;
    if (payload.sellerId !== undefined) {
      item.sellerId = payload.sellerId;
      item.sellerName = payload.sellerName;
    }
    if (payload.storageCell !== undefined) item.storageCell = payload.storageCell;
    if (payload.placementCell !== undefined) item.placementCell = payload.placementCell;
    if (payload.orderNumber !== undefined) item.orderNumber = payload.orderNumber;
    if (payload.wbMpSticker !== undefined) item.wbMpSticker = payload.wbMpSticker;
    if (payload.dimensions !== undefined) item.dimensions = payload.dimensions;
    if (payload.accumulatedCost !== undefined) item.accumulatedCost = payload.accumulatedCost;
    if (payload.brandingRequired !== undefined) item.brandingRequired = payload.brandingRequired;
    if (payload.brandName !== undefined) item.brandName = payload.brandName;
    if (payload.packagingType !== undefined) item.packagingType = payload.packagingType;
    if (payload.returnReason !== undefined) item.returnReason = payload.returnReason;
    if (payload.returnCategory !== undefined) item.returnCategory = payload.returnCategory;

    item.updatedAt = now;

    const log: OperationLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      itemId: item.id,
      inventoryNumber: item.inventoryNumber,
      state: item.currentState,
      stateName: 'Корректировка данных (Администратор)',
      timestamp: now,
      cost: 0,
      operator: adminName,
      details: 'Ручное редактирование параметров товара администратором',
    };
    item.history.push(log);

    items[idx] = item;
    this.saveItems(items);
    return item;
  }

  static deleteSeller(sellerId: string): void {
    const sellers = this.getSellers().filter((s) => s.id !== sellerId);
    this.set(STORAGE_KEY_SELLERS, sellers);
  }

  static getUserSession(): UserSession {
    return this.get<UserSession>(STORAGE_KEY_SESSION, {
      role: 'admin',
      userName: 'Пузанова Т.Ю.',
    });
  }

  static saveUserSession(session: UserSession): void {
    this.set(STORAGE_KEY_SESSION, session);
  }

  static getInvoices(): InvoiceRecord[] {
    return this.get<InvoiceRecord[]>(STORAGE_KEY_INVOICES, []);
  }

  static resetToDemo(): void {
    this.set(STORAGE_KEY_ITEMS, INITIAL_ITEMS);
    this.set(STORAGE_KEY_SELLERS, INITIAL_SELLERS);
    this.set(STORAGE_KEY_TARIFFS, DEFAULT_TARIFFS);
    this.set(STORAGE_KEY_INVOICES, []);
  }
}
