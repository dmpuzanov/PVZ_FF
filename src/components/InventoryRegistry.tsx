import React, { useState } from 'react';
import { InventoryItem, ItemState, Seller, UserSession } from '../types';
import { STATE_CONFIG, StorageService } from '../services/storageService';
import {
  Search,
  Filter,
  Download,
  Printer,
  Eye,
  ArrowUpDown,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Clock,
  Layers,
  Edit3,
  Trash2,
  ShieldCheck,
  Building2,
  Lock,
} from 'lucide-react';

interface InventoryRegistryProps {
  items: InventoryItem[];
  sellers: Seller[];
  session: UserSession;
  onSelectItem: (item: InventoryItem) => void;
  onOpenOperatorStation: (item: InventoryItem) => void;
  onOpenSticker: (item: InventoryItem) => void;
  onOpenAdminEdit?: (item: InventoryItem) => void;
  onDeleteItem?: (itemId: string) => void;
}

export const InventoryRegistry: React.FC<InventoryRegistryProps> = ({
  items,
  sellers,
  session,
  onSelectItem,
  onOpenOperatorStation,
  onOpenSticker,
  onOpenAdminEdit,
  onDeleteItem,
}) => {
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [sellerFilter, setSellerFilter] = useState<string>(
    session.role === 'seller' && session.sellerId ? session.sellerId : 'all'
  );
  const [onlyOverdueStorage, setOnlyOverdueStorage] = useState(false);
  const [sortField, setSortField] = useState<'inventoryNumber' | 'updatedAt' | 'cost'>('updatedAt');
  const [sortAsc, setSortAsc] = useState(false);

  // If role is seller, restrict to session.sellerId
  const effectiveSellerFilter =
    session.role === 'seller' && session.sellerId ? session.sellerId : sellerFilter;

  const filteredItems = items
    .filter((item) => {
      if (stateFilter !== 'all' && item.currentState !== stateFilter) return false;
      if (effectiveSellerFilter !== 'all' && item.sellerId !== effectiveSellerFilter) return false;
      if (onlyOverdueStorage) {
        const calc = StorageService.calculateStorageFee(item);
        if (calc.chargeableDays === 0) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const match =
          item.inventoryNumber.toLowerCase().includes(q) ||
          (item.title && item.title.toLowerCase().includes(q)) ||
          (item.sellerSku && item.sellerSku.toLowerCase().includes(q)) ||
          (item.barcodeEan && item.barcodeEan.toLowerCase().includes(q)) ||
          (item.storageCell && item.storageCell.toLowerCase().includes(q)) ||
          (item.placementCell && item.placementCell.toLowerCase().includes(q)) ||
          (item.orderNumber && item.orderNumber.toLowerCase().includes(q)) ||
          (item.wbMpSticker && item.wbMpSticker.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    })
    .sort((a, b) => {
      let res = 0;
      if (sortField === 'inventoryNumber') {
        res = a.inventoryNumber.localeCompare(b.inventoryNumber);
      } else if (sortField === 'cost') {
        res = a.accumulatedCost - b.accumulatedCost;
      } else {
        res = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      }
      return sortAsc ? res : -res;
    });

  const exportToCSV = () => {
    const headers = [
      'Инвентарный номер',
      'Текущее состояние',
      'Селлер',
      'Артикул',
      'Название товара',
      'Ячейка',
      'Дней хранения',
      'Платных дней',
      'Габариты ДxШxВ',
      'Вес кг',
      'Заказ WB',
      'Стикер WB-MP',
      'Начислено руб',
      'Дата обновления',
    ];

    const rows = filteredItems.map((it) => {
      const storageCalc = StorageService.calculateStorageFee(it);
      return [
        `"${it.inventoryNumber}"`,
        `"${STATE_CONFIG[it.currentState].name}"`,
        `"${it.sellerName || ''}"`,
        `"${it.sellerSku || ''}"`,
        `"${it.title || ''}"`,
        `"${it.placementCell || it.storageCell || ''}"`,
        storageCalc.totalDays,
        storageCalc.chargeableDays,
        it.dimensions ? `"${it.dimensions.length}x${it.dimensions.width}x${it.dimensions.height}"` : '""',
        it.dimensions?.weight || '',
        `"${it.orderNumber || ''}"`,
        `"${it.wbMpSticker || ''}"`,
        it.accumulatedCost,
        `"${new Date(it.updatedAt).toLocaleString('ru-RU')}"`,
      ].join(';');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pvz_inventory_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeSellerName =
    sellers.find((s) => s.id === session.sellerId)?.name || 'Селлер';

  return (
    <div className="space-y-4">
      {/* Role Banner */}
      {session.role === 'seller' && (
        <div className="p-3 bg-sky-50 border-2 border-sky-600 flex items-center justify-between gap-3 text-xs text-sky-950">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-sky-700 shrink-0" />
            <span className="font-bold uppercase">
              Личный кабинет селлера: <b className="font-black underline">{activeSellerName}</b> (Режим только для чтения)
            </span>
          </div>
          <span className="text-[10px] bg-sky-700 text-white px-2 py-0.5 font-black uppercase">
            Read-Only
          </span>
        </div>
      )}

      {session.role === 'admin' && (
        <div className="p-2.5 bg-[#6B0F3B] text-white border-2 border-black flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#C5A059] shrink-0" />
            <span className="font-bold uppercase tracking-wider">
              Режим Администратора: Полный доступ к корректировке данных товаров, габаритов, ячеек и удалению записей
            </span>
          </div>
          <span className="text-[10px] bg-[#C5A059] text-black px-2 py-0.5 font-black uppercase">
            Admin Access
          </span>
        </div>
      )}

      {/* Search & Filter Header */}
      <div className="bg-white p-4 border-2 border-black space-y-3">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="relative w-full lg:w-96">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ПОИСК: ШК, АРТИКУЛ, НАЗВАНИЕ, ЯЧЕЙКА, ЗАКАЗ WB..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border-2 border-black text-xs text-black font-bold outline-none focus:bg-white placeholder:text-gray-400 uppercase tracking-tight"
            />
            <Search className="w-4 h-4 text-black absolute left-3 top-2.5" />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {/* Filter by state */}
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="text-xs px-3 py-2 bg-white border-2 border-black text-black font-bold uppercase tracking-tight outline-none cursor-pointer"
            >
              <option value="all">ВСЕ СОСТОЯНИЯ ({items.length})</option>
              {Object.entries(STATE_CONFIG).map(([key, conf]) => (
                <option key={key} value={key}>
                  {conf.name.toUpperCase()}
                </option>
              ))}
            </select>

            {/* Filter by seller */}
            {session.role !== 'seller' ? (
              <select
                value={sellerFilter}
                onChange={(e) => setSellerFilter(e.target.value)}
                className="text-xs px-3 py-2 bg-white border-2 border-black text-black font-bold uppercase tracking-tight outline-none cursor-pointer"
              >
                <option value="all">ВСЕ СЕЛЛЕРЫ</option>
                {sellers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name.toUpperCase()}
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-xs px-3 py-2 bg-gray-100 border-2 border-black text-black font-bold uppercase tracking-tight flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-gray-500" />
                <span>{activeSellerName}</span>
              </div>
            )}

            {/* Paid storage toggle */}
            <button
              onClick={() => setOnlyOverdueStorage(!onlyOverdueStorage)}
              className={`text-xs px-3 py-2 border-2 border-black font-bold uppercase tracking-tight transition-colors cursor-pointer ${
                onlyOverdueStorage ? 'bg-[#6B0F3B] text-white' : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              Платное хранение (&gt;5 дн.)
            </button>

            {/* Export CSV */}
            <button
              onClick={exportToCSV}
              className="text-xs px-3 py-2 bg-black hover:bg-neutral-800 text-white font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer border-2 border-black"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Экспорт CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border-2 border-black overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left data-grid">
            <thead>
              <tr>
                <th
                  onClick={() => {
                    setSortField('inventoryNumber');
                    setSortAsc(!sortAsc);
                  }}
                  className="py-3 px-4 cursor-pointer hover:bg-gray-200 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>ИНВЕНТАРНЫЙ ШК</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">СОСТОЯНИЕ</th>
                <th className="py-3 px-4">ТОВАР И АРТИКУЛ</th>
                <th className="py-3 px-4">СЕЛЛЕР</th>
                <th className="py-3 px-4">ЛОКАЦИЯ / ХРАНЕНИЕ</th>
                <th className="py-3 px-4">ГАБАРИТЫ / ВЕС</th>
                <th
                  onClick={() => {
                    setSortField('cost');
                    setSortAsc(!sortAsc);
                  }}
                  className="py-3 px-4 text-right cursor-pointer hover:bg-gray-200 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>СУММА УСЛУГ</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center">ДЕЙСТВИЯ</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500 font-bold uppercase tracking-wider text-xs">
                    Товары не найдены по заданным критериям
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const conf = STATE_CONFIG[item.currentState];
                  const storageCalc = StorageService.calculateStorageFee(item);

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-neutral-50 transition-colors cursor-pointer group border-b border-gray-200"
                      onClick={() => onSelectItem(item)}
                    >
                      <td className="py-3 px-4 font-mono font-black text-black text-sm">
                        <span className="group-hover:underline text-[#6B0F3B]">
                          {item.inventoryNumber}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 text-[10px] status-badge ${conf.badgeColor}`}
                        >
                          {conf.shortName}
                        </span>
                        {item.returnCategory && (
                          <span className="ml-1.5 text-[9px] px-1.5 py-0.5 bg-black text-white font-black uppercase">
                            КАТ.{item.returnCategory}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-black text-black truncate text-xs uppercase">
                          {item.title || 'ТОВАР НА ПРИЁМКЕ'}
                        </div>
                        {item.sellerSku && (
                          <div className="font-mono font-bold text-[10px] text-gray-500">
                            АРТ: {item.sellerSku}
                          </div>
                        )}
                        {item.orderNumber && (
                          <div className="text-[10px] text-[#6B0F3B] font-mono font-bold">
                            ЗАКАЗ WB: {item.orderNumber}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 font-bold text-gray-700 uppercase text-xs">
                        {item.sellerName || '— (НЕ ПРИВЯЗАН)'}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 font-mono font-black text-black text-xs">
                          <MapPin className="w-3.5 h-3.5 text-black shrink-0" />
                          <span>{item.placementCell || item.storageCell || '—'}</span>
                        </div>
                        {storageCalc.totalDays > 0 && (
                          <div
                            className={`text-[10px] font-black uppercase ${
                              storageCalc.chargeableDays > 0 ? 'text-red-600' : 'text-gray-500'
                            }`}
                          >
                            {storageCalc.totalDays} ДН. (ПЛАТНЫХ: {storageCalc.chargeableDays})
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-gray-800">
                        {item.dimensions ? (
                          <div>
                            <div className="font-bold text-xs">{item.dimensions.length}×{item.dimensions.width}×{item.dimensions.height} см</div>
                            <div className="text-[10px] font-bold text-gray-500 font-mono">
                              {item.dimensions.weight} кг | {item.dimensions.volumeLiters} л
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 font-bold">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right font-black text-black font-mono text-sm">
                        {item.accumulatedCost} ₽
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div
                          className="flex items-center justify-center gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Print Sticker */}
                          <button
                            onClick={() => onOpenSticker(item)}
                            className="p-1.5 text-black hover:bg-gray-200 transition-colors border border-black cursor-pointer"
                            title="Печать инвентарного стикера"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Operator Action Button (Hidden for Seller) */}
                          {session.role !== 'seller' && (
                            <button
                              onClick={() => onOpenOperatorStation(item)}
                              className="px-2.5 py-1 bg-black hover:bg-neutral-800 text-white text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                              title="Выполнить следующую операцию"
                            >
                              ШАГ
                            </button>
                          )}

                          {/* Admin Edit & Delete Buttons */}
                          {session.role === 'admin' && (
                            <>
                              <button
                                onClick={() => onOpenAdminEdit && onOpenAdminEdit(item)}
                                className="p-1.5 bg-[#6B0F3B] hover:bg-[#851349] text-white transition-colors border border-black cursor-pointer"
                                title="Редактировать параметры товара (Администратор)"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-[#C5A059]" />
                              </button>

                              <button
                                onClick={() => {
                                  if (confirm(`Удалить товар ${item.inventoryNumber} безвозвратно?`)) {
                                    onDeleteItem && onDeleteItem(item.id);
                                  }
                                }}
                                className="p-1.5 bg-red-100 hover:bg-red-200 text-red-800 transition-colors border border-red-400 cursor-pointer"
                                title="Удалить запись (Администратор)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer summary */}
        <div className="p-4 bg-gray-100 border-t-2 border-black flex flex-col sm:flex-row items-center justify-between text-xs text-black gap-2">
          <span className="font-bold uppercase tracking-wider">
            ПОКАЗАНО <b className="font-black">{filteredItems.length}</b> ИЗ <b className="font-black">{items.length}</b> ТОВАРОВ
          </span>
          <span className="font-bold uppercase tracking-wider">
            ОБЩАЯ СТОИМОСТЬ УСЛУГ ПО ВЫБОРКЕ:{' '}
            <b className="text-black font-mono text-base font-black ml-1">
              {filteredItems.reduce((acc, curr) => acc + curr.accumulatedCost, 0).toLocaleString('ru-RU')} ₽
            </b>
          </span>
        </div>
      </div>
    </div>
  );
};
