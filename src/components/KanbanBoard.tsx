import React, { useState } from 'react';
import { InventoryItem, ItemState, Seller, UserSession } from '../types';
import { STATE_CONFIG, StorageService } from '../services/storageService';
import { BarcodeRenderer } from './BarcodeRenderer';
import {
  Package,
  Layers,
  ArrowRight,
  Printer,
  ChevronRight,
  RotateCcw,
  Sparkles,
  MapPin,
  Clock,
  Eye,
  Lock,
  Building2,
} from 'lucide-react';

interface KanbanBoardProps {
  items: InventoryItem[];
  sellers: Seller[];
  session?: UserSession;
  onSelectItem: (item: InventoryItem) => void;
  onOpenOperatorStation: (item: InventoryItem) => void;
  onOpenSticker: (item: InventoryItem) => void;
}

const FORWARD_COLUMNS: ItemState[] = [
  'intake',
  'registration',
  'storage',
  'branding',
  'packaging',
  'placed',
  'assembly',
  'shipped',
];

const RETURN_COLUMNS: ItemState[] = [
  'return_intake',
  'return_sorting',
  'return_repair',
  'returned_seller',
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  items,
  sellers,
  session,
  onSelectItem,
  onOpenOperatorStation,
  onOpenSticker,
}) => {
  const [activePipeline, setActivePipeline] = useState<'all' | 'forward' | 'returns'>('all');
  const [selectedSellerFilter, setSelectedSellerFilter] = useState<string>(
    session?.role === 'seller' && session.sellerId ? session.sellerId : 'all'
  );
  const [searchQuery, setSearchQuery] = useState('');

  const isSeller = session?.role === 'seller';
  const effectiveSellerFilter =
    isSeller && session?.sellerId ? session.sellerId : selectedSellerFilter;

  const filteredItems = items.filter((item) => {
    if (effectiveSellerFilter !== 'all' && item.sellerId !== effectiveSellerFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        item.inventoryNumber.toLowerCase().includes(q) ||
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.sellerSku && item.sellerSku.toLowerCase().includes(q)) ||
        (item.orderNumber && item.orderNumber.toLowerCase().includes(q)) ||
        (item.wbMpSticker && item.wbMpSticker.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  let columnsToRender: ItemState[] = [];
  if (activePipeline === 'forward') {
    columnsToRender = FORWARD_COLUMNS;
  } else if (activePipeline === 'returns') {
    columnsToRender = RETURN_COLUMNS;
  } else {
    columnsToRender = [...FORWARD_COLUMNS, ...RETURN_COLUMNS];
  }

  const activeSellerName =
    sellers.find((s) => s.id === session?.sellerId)?.name || 'Селлер';

  return (
    <div className="space-y-4">
      {/* Role Notice for Seller */}
      {isSeller && (
        <div className="p-3 bg-sky-50 border-2 border-sky-600 flex items-center justify-between gap-3 text-xs text-sky-950">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-sky-700 shrink-0" />
            <span className="font-bold uppercase">
              Канбан-поток селлера: <b className="font-black underline">{activeSellerName}</b> (Только просмотр движения)
            </span>
          </div>
          <span className="text-[10px] bg-sky-700 text-white px-2 py-0.5 font-black uppercase">
            Read-Only
          </span>
        </div>
      )}

      {/* Pipeline Controls & Filters */}
      <div className="bg-white p-4 border-2 border-black space-y-3">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Stream Switcher */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <button
              onClick={() => setActivePipeline('all')}
              className={`px-3.5 py-2 text-xs font-black uppercase tracking-wider transition-colors border-2 border-black cursor-pointer ${
                activePipeline === 'all'
                  ? 'bg-black text-white'
                  : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              Все потоки ({items.length})
            </button>

            <button
              onClick={() => setActivePipeline('forward')}
              className={`px-3.5 py-2 text-xs font-black uppercase tracking-wider transition-colors border-2 border-black cursor-pointer flex items-center gap-1.5 ${
                activePipeline === 'forward'
                  ? 'bg-[#6B0F3B] text-white border-black'
                  : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              <Package className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Прямой поток (Штучная обработка)</span>
            </button>

            <button
              onClick={() => setActivePipeline('returns')}
              className={`px-3.5 py-2 text-xs font-black uppercase tracking-wider transition-colors border-2 border-black cursor-pointer flex items-center gap-1.5 ${
                activePipeline === 'returns'
                  ? 'bg-red-800 text-white border-black'
                  : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Обратный поток (Возвраты WB)</span>
            </button>
          </div>

          {/* Search & Seller Filter */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ПОИСК ПО КАНБАНУ..."
              className="text-xs px-3 py-2 bg-gray-50 border-2 border-black text-black font-bold uppercase outline-none focus:bg-white placeholder:text-gray-400"
            />

            {!isSeller ? (
              <select
                value={selectedSellerFilter}
                onChange={(e) => setSelectedSellerFilter(e.target.value)}
                className="text-xs px-3 py-2 bg-white border-2 border-black text-black font-bold uppercase outline-none cursor-pointer"
              >
                <option value="all">ВСЕ СЕЛЛЕРЫ</option>
                {sellers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name.toUpperCase()}
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-xs px-3 py-2 bg-gray-100 border-2 border-black text-black font-bold uppercase flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-gray-500" />
                <span>{activeSellerName}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Kanban Board Columns Horizontal Scroll */}
      <div className="flex space-x-3 overflow-x-auto pb-4 pt-1 items-start min-h-[500px]">
        {columnsToRender.map((stateKey) => {
          const conf = STATE_CONFIG[stateKey];
          const columnItems = filteredItems.filter((i) => i.currentState === stateKey);
          const colSum = columnItems.reduce((acc, curr) => acc + curr.accumulatedCost, 0);

          return (
            <div
              key={stateKey}
              className="flex-shrink-0 w-80 bg-gray-50 border-2 border-black flex flex-col max-h-[75vh] overflow-hidden shadow-sm"
            >
              {/* Column Header */}
              <div className="p-3 bg-white border-b-2 border-black">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-black uppercase tracking-wider px-2 py-0.5 status-badge ${conf.badgeColor}`}
                    >
                      {conf.name}
                    </span>
                  </div>
                  <span className="text-xs font-black text-white bg-black px-2 py-0.5 font-mono">
                    {columnItems.length}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1.5">
                  <span className="truncate">{conf.description}</span>
                  <span className="font-black text-black font-mono shrink-0 ml-1">{colSum} ₽</span>
                </div>
              </div>

              {/* Items Card List */}
              <div className="p-2.5 overflow-y-auto space-y-2.5 flex-1">
                {columnItems.length === 0 ? (
                  <div className="p-6 text-center text-xs font-bold text-gray-400 border-2 border-dashed border-gray-300 uppercase tracking-wider">
                    Нет товаров
                  </div>
                ) : (
                  columnItems.map((item) => {
                    return (
                      <div
                        key={item.id}
                        onClick={() => onSelectItem(item)}
                        className="bg-white p-3 border-2 border-black hover:bg-yellow-50/60 transition-all cursor-pointer group shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-black text-black group-hover:underline">
                            {item.inventoryNumber}
                          </span>
                          <span className="font-black text-xs text-black font-mono bg-[#DFC386] px-1.5 py-0.5 border border-black">
                            {item.accumulatedCost} ₽
                          </span>
                        </div>

                        <div className="text-xs font-black uppercase text-black line-clamp-2 mt-1.5">
                          {item.title || 'Товар на приёмке (без названия)'}
                        </div>

                        {item.sellerSku && (
                          <div className="text-[10px] text-gray-600 font-mono font-bold mt-0.5 uppercase">
                            Арт: {item.sellerSku}
                          </div>
                        )}

                        <div className="mt-2 pt-1.5 border-t-2 border-black flex items-center justify-between text-[10px] text-gray-600 font-bold uppercase">
                          <span className="truncate max-w-[120px]">
                            {item.sellerName?.split(' ')[0] || '—'}
                          </span>
                          {item.placementCell || item.storageCell ? (
                            <span className="flex items-center gap-1 font-mono font-black text-black bg-gray-100 border border-black px-1.5 py-0.5">
                              <MapPin className="w-2.5 h-2.5 text-black" />
                              {item.placementCell || item.storageCell}
                            </span>
                          ) : (
                            <span className="text-gray-400">
                              {new Date(item.updatedAt).toLocaleDateString('ru-RU')}
                            </span>
                          )}
                        </div>

                        {/* Return category tag if applicable */}
                        {item.returnCategory && (
                          <div className="mt-2 flex items-center justify-between text-[10px] font-black uppercase">
                            <span className="px-1.5 py-0.5 bg-black text-white">
                              КАТ. {item.returnCategory}
                            </span>
                            {item.returnReason && (
                              <span className="text-red-700 truncate max-w-[130px] font-bold">
                                {item.returnReason}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Card Action Bar */}
                        <div className="mt-2 pt-2 border-t border-gray-200 flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenSticker(item);
                            }}
                            className="p-1 text-black hover:bg-gray-100 border border-black cursor-pointer"
                            title="Печать стикера"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          
                          {!isSeller ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenOperatorStation(item);
                              }}
                              className="px-2 py-1 bg-black text-white hover:bg-neutral-800 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                            >
                              <span>Изменить</span>
                              <ArrowRight className="w-2.5 h-2.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectItem(item);
                              }}
                              className="px-2 py-1 bg-sky-700 text-white hover:bg-sky-800 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-2.5 h-2.5" />
                              <span>Детали</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
