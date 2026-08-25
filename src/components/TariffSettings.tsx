import React, { useState } from 'react';
import { Seller, TariffRates, UserSession, WeightCategory } from '../types';
import { StorageService, WEIGHT_CATEGORY_LABELS } from '../services/storageService';
import { BrandLogo, BRAND_CONFIG } from './BrandLogo';
import {
  DollarSign,
  Users,
  Save,
  RotateCcw,
  Plus,
  Check,
  Package,
  Layers,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Lock,
  Trash2,
  Edit2,
  Building2,
} from 'lucide-react';

interface TariffSettingsProps {
  tariffs: TariffRates;
  sellers: Seller[];
  session: UserSession;
  onTariffsUpdated: (newTariffs: TariffRates) => void;
  onSellersUpdated: () => void;
  onResetDemo: () => void;
  onDeleteSeller?: (sellerId: string) => void;
}

const WEIGHT_COLS: { key: WeightCategory; label: string; sub: string }[] = [
  { key: 'up_to_1kg', label: 'до 1 кг', sub: 'Легкие / малогабарит' },
  { key: '1_to_5kg', label: '1 – 5 кг', sub: 'Средний вес' },
  { key: '5_to_10kg', label: '5 – 10 кг', sub: 'Тяжелые' },
  { key: 'over_10kg', label: '> 10 кг', sub: 'Крупногабарит / КГТ' },
];

export const TariffSettings: React.FC<TariffSettingsProps> = ({
  tariffs,
  sellers,
  session,
  onTariffsUpdated,
  onSellersUpdated,
  onResetDemo,
  onDeleteSeller,
}) => {
  const [formData, setFormData] = useState<TariffRates>(tariffs);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // New Seller Form
  const [newSellerName, setNewSellerName] = useState('');
  const [newSellerInn, setNewSellerInn] = useState('');
  const [newSellerContact, setNewSellerContact] = useState('');
  const [newSellerPhone, setNewSellerPhone] = useState('');
  const [newSellerEmail, setNewSellerEmail] = useState('');
  const [isAddingSeller, setIsAddingSeller] = useState(false);

  const isAdmin = session.role === 'admin';

  const handleSaveTariffs = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    StorageService.saveTariffs(formData);
    onTariffsUpdated(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleAddSeller = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !newSellerName.trim()) return;

    const seller: Seller = {
      id: `seller-${Date.now()}`,
      name: newSellerName.trim(),
      inn: newSellerInn.trim() || '7700000000',
      contactPerson: newSellerContact.trim() || 'Контактное лицо',
      phone: newSellerPhone.trim() || '+7 (900) 000-00-00',
      email: newSellerEmail.trim() || 'seller@example.com',
      createdAt: new Date().toISOString(),
    };

    StorageService.saveSeller(seller);
    onSellersUpdated();
    setNewSellerName('');
    setNewSellerInn('');
    setNewSellerContact('');
    setNewSellerPhone('');
    setNewSellerEmail('');
    setIsAddingSeller(false);
  };

  const updateDirect = (op: keyof TariffRates['directFlow'], cat: WeightCategory, val: number) => {
    if (!isAdmin) return;
    setFormData((prev) => ({
      ...prev,
      directFlow: {
        ...prev.directFlow,
        [op]: {
          ...prev.directFlow[op],
          [cat]: val,
        },
      },
    }));
  };

  const updateReturn = (op: keyof TariffRates['returnFlow'], cat: WeightCategory, val: number) => {
    if (!isAdmin) return;
    setFormData((prev) => ({
      ...prev,
      returnFlow: {
        ...prev.returnFlow,
        [op]: {
          ...prev.returnFlow[op],
          [cat]: val,
        },
      },
    }));
  };

  // Calculates direct totals per tier (MOTIVATION)
  const directTotals: Record<WeightCategory, number> = {
    up_to_1kg:
      (formData.directFlow?.intake?.up_to_1kg || 0) +
      (formData.directFlow?.branding?.up_to_1kg || 0) +
      (formData.directFlow?.packaging?.up_to_1kg || 0) +
      (formData.directFlow?.assembly?.up_to_1kg || 0),
    '1_to_5kg':
      (formData.directFlow?.intake?.['1_to_5kg'] || 0) +
      (formData.directFlow?.branding?.['1_to_5kg'] || 0) +
      (formData.directFlow?.packaging?.['1_to_5kg'] || 0) +
      (formData.directFlow?.assembly?.['1_to_5kg'] || 0),
    '5_to_10kg':
      (formData.directFlow?.intake?.['5_to_10kg'] || 0) +
      (formData.directFlow?.branding?.['5_to_10kg'] || 0) +
      (formData.directFlow?.packaging?.['5_to_10kg'] || 0) +
      (formData.directFlow?.assembly?.['5_to_10kg'] || 0),
    over_10kg:
      (formData.directFlow?.intake?.over_10kg || 0) +
      (formData.directFlow?.branding?.over_10kg || 0) +
      (formData.directFlow?.packaging?.over_10kg || 0) +
      (formData.directFlow?.assembly?.over_10kg || 0),
  };

  // Calculates return totals per tier (MOTIVATION)
  const returnTotals: Record<WeightCategory, number> = {
    up_to_1kg:
      (formData.returnFlow?.intake?.up_to_1kg || 0) +
      (formData.returnFlow?.verification?.up_to_1kg || 0) +
      (formData.returnFlow?.restoration?.up_to_1kg || 0) +
      (formData.returnFlow?.packaging?.up_to_1kg || 0),
    '1_to_5kg':
      (formData.returnFlow?.intake?.['1_to_5kg'] || 0) +
      (formData.returnFlow?.verification?.['1_to_5kg'] || 0) +
      (formData.returnFlow?.restoration?.['1_to_5kg'] || 0) +
      (formData.returnFlow?.packaging?.['1_to_5kg'] || 0),
    '5_to_10kg':
      (formData.returnFlow?.intake?.['5_to_10kg'] || 0) +
      (formData.returnFlow?.verification?.['5_to_10kg'] || 0) +
      (formData.returnFlow?.restoration?.['5_to_10kg'] || 0) +
      (formData.returnFlow?.packaging?.['5_to_10kg'] || 0),
    over_10kg:
      (formData.returnFlow?.intake?.over_10kg || 0) +
      (formData.returnFlow?.verification?.over_10kg || 0) +
      (formData.returnFlow?.restoration?.over_10kg || 0) +
      (formData.returnFlow?.packaging?.over_10kg || 0),
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Role Notice */}
      {!isAdmin && (
        <div className="p-3 bg-amber-50 border-2 border-amber-600 flex items-center justify-between gap-3 text-xs text-amber-950">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-700 shrink-0" />
            <span className="font-bold uppercase">
              Режим только для чтения: Изменение мотивации и редактирование селлеров доступно Администратору
            </span>
          </div>
          <span className="text-[10px] bg-amber-700 text-white px-2 py-0.5 font-black uppercase">
            Read-Only
          </span>
        </div>
      )}

      {/* Motivation Form */}
      <form onSubmit={handleSaveTariffs} className="bg-white p-6 border-2 border-black space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-black">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#6B0F3B] text-[#C5A059] border border-black">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-black text-base uppercase tracking-tight">
                Таблица мотивации сотрудников
              </h3>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                Ставки выплат операторам ПВЗ за выполнение операций по весовым категориям
              </p>
            </div>
          </div>

          {isAdmin ? (
            <button
              type="submit"
              className="px-4 py-2 bg-[#6B0F3B] hover:bg-[#851349] text-white text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer border-2 border-black"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-[#C5A059]" />
                  <span>Сохранено!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-[#C5A059]" />
                  <span>Сохранить мотивацию</span>
                </>
              )}
            </button>
          ) : (
            <span className="text-[10px] font-black uppercase px-3 py-1.5 bg-gray-200 text-gray-700 border border-gray-400">
              Ставки утверждены
            </span>
          )}
        </div>

        {/* 1. ПРЯМОЙ ПОТОК (МОТИВАЦИЯ) */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-[#6B0F3B]"></span>
            <h4 className="text-xs font-black uppercase tracking-wider text-black">
              1. Выплаты персоналу: Прямой поток
            </h4>
          </div>

          <div className="border-2 border-black overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#6B0F3B] text-white uppercase text-[11px] font-black">
                <tr>
                  <th className="p-3 border-r-2 border-black w-2/5">Технологическая операция</th>
                  {WEIGHT_COLS.map((col) => (
                    <th key={col.key} className="p-2 border-r-2 border-black text-center last:border-r-0">
                      <div>{col.label}</div>
                      <div className="text-[9px] text-[#DFC386] font-normal normal-case">{col.sub}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-black text-xs font-bold">
                {/* Операция 1 */}
                <tr className="hover:bg-neutral-50">
                  <td className="p-3 border-r-2 border-black">
                    <div className="font-black text-black uppercase">1. Приемка и учет товара</div>
                  </td>
                  {WEIGHT_COLS.map((col) => (
                    <td key={col.key} className="p-2 border-r-2 border-black text-center bg-gray-50/50">
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="number"
                          min="0"
                          disabled={!isAdmin}
                          value={formData.directFlow?.intake?.[col.key] ?? 1}
                          onChange={(e) => updateDirect('intake', col.key, parseFloat(e.target.value) || 0)}
                          className="w-20 p-1.5 bg-white border-2 border-black text-center font-mono font-black text-black text-xs disabled:bg-gray-100"
                        />
                        <span className="text-xs font-black text-gray-600">₽</span>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Операция 2 */}
                <tr className="hover:bg-neutral-50">
                  <td className="p-3 border-r-2 border-black">
                    <div className="font-black text-black uppercase">2. Брендирование товара</div>
                  </td>
                  {WEIGHT_COLS.map((col) => (
                    <td key={col.key} className="p-2 border-r-2 border-black text-center bg-gray-50/50">
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="number"
                          min="0"
                          disabled={!isAdmin}
                          value={formData.directFlow?.branding?.[col.key] ?? 3}
                          onChange={(e) => updateDirect('branding', col.key, parseFloat(e.target.value) || 0)}
                          className="w-20 p-1.5 bg-white border-2 border-black text-center font-mono font-black text-black text-xs disabled:bg-gray-100"
                        />
                        <span className="text-xs font-black text-gray-600">₽</span>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Операция 3 */}
                <tr className="hover:bg-neutral-50">
                  <td className="p-3 border-r-2 border-black">
                    <div className="font-black text-black uppercase">3. Упаковка и размещение</div>
                  </td>
                  {WEIGHT_COLS.map((col) => (
                    <td key={col.key} className="p-2 border-r-2 border-black text-center bg-gray-50/50">
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="number"
                          min="0"
                          disabled={!isAdmin}
                          value={formData.directFlow?.packaging?.[col.key] ?? 8}
                          onChange={(e) => updateDirect('packaging', col.key, parseFloat(e.target.value) || 0)}
                          className="w-20 p-1.5 bg-white border-2 border-black text-center font-mono font-black text-black text-xs disabled:bg-gray-100"
                        />
                        <span className="text-xs font-black text-gray-600">₽</span>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Операция 4 */}
                <tr className="hover:bg-neutral-50">
                  <td className="p-3 border-r-2 border-black">
                    <div className="font-black text-black uppercase">4. Сборка и стикерование</div>
                  </td>
                  {WEIGHT_COLS.map((col) => (
                    <td key={col.key} className="p-2 border-r-2 border-black text-center bg-gray-50/50">
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="number"
                          min="0"
                          disabled={!isAdmin}
                          value={formData.directFlow?.assembly?.[col.key] ?? 1}
                          onChange={(e) => updateDirect('assembly', col.key, parseFloat(e.target.value) || 0)}
                          className="w-20 p-1.5 bg-white border-2 border-black text-center font-mono font-black text-black text-xs disabled:bg-gray-100"
                        />
                        <span className="text-xs font-black text-gray-600">₽</span>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* ИТОГО ПРЯМОЙ ПОТОК */}
                <tr className="bg-[#FAF2E6] text-black font-black">
                  <td className="p-3 border-r-2 border-black uppercase text-xs tracking-wider">
                    ИТОГО затраты на персонал (прямой поток):
                  </td>
                  {WEIGHT_COLS.map((col) => (
                    <td key={col.key} className="p-3 border-r-2 border-black text-center font-mono text-sm">
                      {directTotals[col.key]} ₽
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. ОБРАТНЫЙ ПОТОК (МОТИВАЦИЯ) */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-red-600"></span>
            <h4 className="text-xs font-black uppercase tracking-wider text-black">
              2. Выплаты персоналу: Обратный поток (Возвраты)
            </h4>
          </div>

          <div className="border-2 border-black overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-red-800 text-white uppercase text-[11px] font-black">
                <tr>
                  <th className="p-3 border-r-2 border-black w-2/5">Технологическая операция возврата</th>
                  {WEIGHT_COLS.map((col) => (
                    <th key={col.key} className="p-2 border-r-2 border-black text-center last:border-r-0">
                      <div>{col.label}</div>
                      <div className="text-[9px] text-red-200 font-normal normal-case">{col.sub}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-black text-xs font-bold">
                {/* Операция 1 */}
                <tr className="hover:bg-red-50/50">
                  <td className="p-3 border-r-2 border-black">
                    <div className="font-black text-black uppercase">1. Приемка, осмотр</div>
                  </td>
                  {WEIGHT_COLS.map((col) => (
                    <td key={col.key} className="p-2 border-r-2 border-black text-center bg-gray-50/50">
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="number"
                          min="0"
                          disabled={!isAdmin}
                          value={formData.returnFlow?.intake?.[col.key] ?? 1}
                          onChange={(e) => updateReturn('intake', col.key, parseFloat(e.target.value) || 0)}
                          className="w-20 p-1.5 bg-white border-2 border-black text-center font-mono font-black text-black text-xs disabled:bg-gray-100"
                        />
                        <span className="text-xs font-black text-gray-600">₽</span>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Операция 2 */}
                <tr className="hover:bg-red-50/50">
                  <td className="p-3 border-r-2 border-black">
                    <div className="font-black text-black uppercase">2. Проверка (Категоризация А / Б / В)</div>
                  </td>
                  {WEIGHT_COLS.map((col) => (
                    <td key={col.key} className="p-2 border-r-2 border-black text-center bg-gray-50/50">
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="number"
                          min="0"
                          disabled={!isAdmin}
                          value={formData.returnFlow?.verification?.[col.key] ?? 5}
                          onChange={(e) => updateReturn('verification', col.key, parseFloat(e.target.value) || 0)}
                          className="w-20 p-1.5 bg-white border-2 border-black text-center font-mono font-black text-black text-xs disabled:bg-gray-100"
                        />
                        <span className="text-xs font-black text-gray-600">₽</span>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Операция 3 */}
                <tr className="hover:bg-red-50/50">
                  <td className="p-3 border-r-2 border-black">
                    <div className="font-black text-black uppercase">3. Восстановление</div>
                  </td>
                  {WEIGHT_COLS.map((col) => (
                    <td key={col.key} className="p-2 border-r-2 border-black text-center bg-gray-50/50">
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="number"
                          min="0"
                          disabled={!isAdmin}
                          value={formData.returnFlow?.restoration?.[col.key] ?? 15}
                          onChange={(e) => updateReturn('restoration', col.key, parseFloat(e.target.value) || 0)}
                          className="w-20 p-1.5 bg-white border-2 border-black text-center font-mono font-black text-black text-xs disabled:bg-gray-100"
                        />
                        <span className="text-xs font-black text-gray-600">₽</span>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Операция 4 */}
                <tr className="hover:bg-red-50/50">
                  <td className="p-3 border-r-2 border-black">
                    <div className="font-black text-black uppercase">4. Упаковка и стикерование</div>
                  </td>
                  {WEIGHT_COLS.map((col) => (
                    <td key={col.key} className="p-2 border-r-2 border-black text-center bg-gray-50/50">
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="number"
                          min="0"
                          disabled={!isAdmin}
                          value={formData.returnFlow?.packaging?.[col.key] ?? 9}
                          onChange={(e) => updateReturn('packaging', col.key, parseFloat(e.target.value) || 0)}
                          className="w-20 p-1.5 bg-white border-2 border-black text-center font-mono font-black text-black text-xs disabled:bg-gray-100"
                        />
                        <span className="text-xs font-black text-gray-600">₽</span>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* ИТОГО ОБРАТНЫЙ ПОТОК */}
                <tr className="bg-red-100 text-red-950 font-black">
                  <td className="p-3 border-r-2 border-black uppercase text-xs tracking-wider">
                    ИТОГО затраты на персонал (обратный поток):
                  </td>
                  {WEIGHT_COLS.map((col) => (
                    <td key={col.key} className="p-3 border-r-2 border-black text-center font-mono text-sm">
                      {returnTotals[col.key]} ₽
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. УСЛОВИЯ ХРАНЕНИЯ */}
        <div className="bg-neutral-50 p-4 border-2 border-black">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 bg-black"></span>
            <h4 className="text-xs font-black uppercase tracking-wider text-black">
              3. Условия складского хранения товаров на ПВЗ
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-3 border-2 border-black">
              <label className="block text-[10px] font-black uppercase tracking-wider text-black mb-1">
                Бесплатный период хранения (суток)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  disabled={!isAdmin}
                  value={formData.storageFreeDays}
                  onChange={(e) => setFormData({ ...formData, storageFreeDays: parseInt(e.target.value) || 0 })}
                  className="w-full text-xs p-2 bg-white border-2 border-black font-mono font-black text-black disabled:bg-gray-100"
                />
                <span className="text-xs font-black text-black shrink-0">дней</span>
              </div>
              <span className="text-[10px] text-gray-500 font-bold uppercase mt-1 block">
                Первые 5 дней хранения входят в базовую обработку
              </span>
            </div>

            <div className="bg-white p-3 border-2 border-black">
              <label className="block text-[10px] font-black uppercase tracking-wider text-black mb-1">
                Стоимость хранения сверх бесплатного периода (₽/сут. за ячейку 40л)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  disabled={!isAdmin}
                  value={formData.storagePerDay}
                  onChange={(e) => setFormData({ ...formData, storagePerDay: parseFloat(e.target.value) || 0 })}
                  className="w-full text-xs p-2 bg-white border-2 border-black font-mono font-black text-black disabled:bg-gray-100"
                />
                <span className="text-xs font-black text-black shrink-0">₽/сутки</span>
              </div>
              <span className="text-[10px] text-gray-500 font-bold uppercase mt-1 block">
                Начисляется ежедневно начиная с 6-го дня (15 ₽ за ячейку 40л)
              </span>
            </div>
          </div>
        </div>
      </form>

      {/* Sellers Registry */}
      <div className="bg-white p-6 border-2 border-black space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-black">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#6B0F3B] text-[#C5A059] border border-black">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-black text-base uppercase tracking-tight">
                Реестр селлеров (Заказчиков фулфилмента)
              </h3>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                Продавцы маркетплейсов на обслуживании
              </p>
            </div>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsAddingSeller(!isAddingSeller)}
              className="px-3.5 py-2 bg-[#6B0F3B] hover:bg-[#851349] text-white text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer border-2 border-black"
            >
              <Plus className="w-4 h-4 text-[#C5A059]" />
              <span>Добавить селлера</span>
            </button>
          )}
        </div>

        {isAdmin && isAddingSeller && (
          <form onSubmit={handleAddSeller} className="p-4 bg-yellow-50 border-2 border-black my-4 space-y-3">
            <h4 className="text-xs font-black text-black uppercase tracking-wider">Новый селлер</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-black mb-1">
                  Наименование (ИП / ООО)
                </label>
                <input
                  type="text"
                  required
                  value={newSellerName}
                  onChange={(e) => setNewSellerName(e.target.value)}
                  placeholder="ИП Иванов И.И."
                  className="w-full text-xs p-2 bg-white border-2 border-black font-bold uppercase"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-black mb-1">ИНН</label>
                <input
                  type="text"
                  value={newSellerInn}
                  onChange={(e) => setNewSellerInn(e.target.value)}
                  placeholder="772349019284"
                  className="w-full text-xs p-2 bg-white border-2 border-black font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-black mb-1">
                  Контактное лицо
                </label>
                <input
                  type="text"
                  value={newSellerContact}
                  onChange={(e) => setNewSellerContact(e.target.value)}
                  placeholder="Иван Иванов"
                  className="w-full text-xs p-2 bg-white border-2 border-black font-bold uppercase"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-black mb-1">Телефон</label>
                <input
                  type="text"
                  value={newSellerPhone}
                  onChange={(e) => setNewSellerPhone(e.target.value)}
                  placeholder="+7 (999) 000-00-00"
                  className="w-full text-xs p-2 bg-white border-2 border-black font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-black mb-1">
                  Эл. почта
                </label>
                <input
                  type="email"
                  value={newSellerEmail}
                  onChange={(e) => setNewSellerEmail(e.target.value)}
                  placeholder="seller@mail.ru"
                  className="w-full text-xs p-2 bg-white border-2 border-black font-bold"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingSeller(false)}
                className="px-3 py-1.5 bg-white border-2 border-black text-xs font-black uppercase tracking-wider text-black cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#6B0F3B] hover:bg-[#851349] text-white text-xs font-black uppercase tracking-wider cursor-pointer border border-black"
              >
                Сохранить селлера
              </button>
            </div>
          </form>
        )}

        <div className="divide-y-2 divide-black mt-4">
          {sellers.length === 0 ? (
            <div className="py-6 text-center text-gray-500 font-bold uppercase text-xs">
              Селлеры не добавлены. Нажмите "Добавить селлера" выше.
            </div>
          ) : (
            sellers.map((s) => (
              <div key={s.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="font-black text-xs uppercase text-black flex items-center gap-2">
                    <span>{s.name}</span>
                  </div>
                  <div className="text-[11px] text-gray-600 font-bold uppercase flex flex-wrap gap-x-3 mt-0.5">
                    <span>ИНН: {s.inn}</span>
                    <span>
                      Контакты: {s.contactPerson} ({s.phone})
                    </span>
                    <span>{s.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-[10px] text-black bg-[#DFC386] px-2 py-0.5 font-black uppercase border border-black">
                    Активный договор
                  </span>

                  {isAdmin && (
                    <button
                      onClick={() => {
                        if (confirm(`Удалить селлера ${s.name} из реестра?`)) {
                          onDeleteSeller && onDeleteSeller(s.id);
                        }
                      }}
                      className="p-1 text-red-600 hover:bg-red-100 border border-red-400 cursor-pointer"
                      title="Удалить селлера (Администратор)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Demo Reset Card (Admin Only) */}
      {isAdmin && (
        <div className="p-5 bg-yellow-400 border-2 border-black flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-black">
              Сброс к демонстрационным данным
            </h4>
            <p className="text-[11px] text-black font-bold uppercase">
              Восстановить примеры товаров на всех этапах жизненного цикла.
            </p>
          </div>
          <button
            onClick={() => {
              if (confirm('Сбросить базу данных к демонстрационному набору? Все ручные правки будут заменены.')) {
                onResetDemo();
              }
            }}
            className="px-3.5 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer border border-black"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#DFC386]" />
            <span>Сбросить данные</span>
          </button>
        </div>
      )}
    </div>
  );
};
