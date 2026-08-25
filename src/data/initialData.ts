import { InventoryItem, Seller, TariffRates, ItemState } from '../types';

// ==========================================
// НАЧАЛЬНЫЕ ТАРИФЫ (МОТИВАЦИЯ ПЕРСОНАЛА + ХРАНЕНИЕ)
// ==========================================
export const DEFAULT_TARIFFS: TariffRates = {
  directFlow: {
    intake: { up_to_1kg: 1, '1_to_5kg': 2, '5_to_10kg': 3, over_10kg: 2 },
    branding: { up_to_1kg: 3, '1_to_5kg': 5, '5_to_10kg': 10, over_10kg: 10 },
    packaging: { up_to_1kg: 8, '1_to_5kg': 16, '5_to_10kg': 21, over_10kg: 25 },
    assembly: { up_to_1kg: 1, '1_to_5kg': 2, '5_to_10kg': 3, over_10kg: 3 },
  },
  returnFlow: {
    intake: { up_to_1kg: 1, '1_to_5kg': 2, '5_to_10kg': 3, over_10kg: 2 },
    verification: { up_to_1kg: 5, '1_to_5kg': 8, '5_to_10kg': 13, over_10kg: 15 },
    restoration: { up_to_1kg: 15, '1_to_5kg': 15, '5_to_10kg': 18, over_10kg: 20 },
    packaging: { up_to_1kg: 9, '1_to_5kg': 11, '5_to_10kg': 13, over_10kg: 15 },
  },
  storageFreeDays: 5,       // Первые 5 дней бесплатно
  storagePerDay: 15,        // 15 рублей в день за ячейку (40 литров)
};

export const INITIAL_SELLERS: Seller[] = [
  {
    id: 'seller-1',
    name: 'ООО "Тестовый Селлер"',
    inn: '7700000000',
    contactPerson: 'Иван Иванов',
    phone: '+7 (999) 000-00-00',
    email: 'test@seller.ru',
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_ITEMS: InventoryItem[] = [];
