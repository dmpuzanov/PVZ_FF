import React, { useState } from 'react';
import { InventoryItem, ItemState, ReturnCategory, Seller } from '../types';
import { STATE_CONFIG, StorageService } from '../services/storageService';
import { BarcodeRenderer, ThermalStickerModal } from './BarcodeRenderer';
import {
  Package,
  Calendar,
  Layers,
  MapPin,
  Clock,
  User,
  FileText,
  DollarSign,
  Printer,
  ChevronRight,
  ArrowRight,
  RotateCcw,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Info,
} from 'lucide-react';

interface ItemLifecycleModalProps {
  item: InventoryItem | null;
  sellers: Seller[];
  onClose: () => void;
  onAdvanceState: (item: InventoryItem, nextState: ItemState) => void;
  onOpenOperatorStation: (item: InventoryItem) => void;
}

export const ItemLifecycleModal: React.FC<ItemLifecycleModalProps> = ({
  item,
  sellers,
  onClose,
  onAdvanceState,
  onOpenOperatorStation,
}) => {
  const [isStickerPrintOpen, setIsStickerPrintOpen] = useState(false);

  if (!item) return null;

  const stateConfig = STATE_CONFIG[item.currentState];
  const storageCalc = StorageService.calculateStorageFee(item);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 overflow-y-auto">
      <div className="bg-white border-2 border-black w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden my-auto shadow-2xl">
        {/* Modal Header */}
        <div className="p-5 bg-black text-white flex items-start justify-between border-b-2 border-black">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-400 text-black border border-black">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xl font-black text-white tracking-wider">
                  {item.inventoryNumber}
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 font-black uppercase border ${stateConfig.badgeColor}`}
                >
                  {stateConfig.name}
                </span>
              </div>
              <p className="text-xs text-gray-300 font-bold uppercase tracking-wider mt-0.5">
                {item.title || 'Товар без наименования (требуется регистрация)'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsStickerPrintOpen(true)}
              className="px-3 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-1.5 border border-black cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Стикер
            </button>
            <button
              onClick={onClose}
              className="text-white hover:text-yellow-400 p-1 font-black transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-gray-50">
          {/* Key Attributes Bento Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Seller */}
            <div className="bg-white p-3.5 border-2 border-black">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">
                Селлер / Владелец
              </span>
              <div className="font-black text-black text-xs uppercase truncate">
                {item.sellerName || '— (не привязан)'}
              </div>
              <div className="text-[11px] font-mono font-bold text-gray-600 mt-0.5">
                Арт: {item.sellerSku || '—'}
              </div>
            </div>

            {/* Location & Cell */}
            <div className="bg-white p-3.5 border-2 border-black">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">
                Локация / Ячейка
              </span>
              <div className="flex items-center gap-1.5 font-black text-black text-xs uppercase">
                <MapPin className="w-3.5 h-3.5 text-black" />
                {item.placementCell || item.storageCell || 'Зона приёмки / сортировки'}
              </div>
              {item.storageEnteredAt && (
                <div className="text-[11px] font-bold text-gray-600 mt-0.5 uppercase">
                  В хранении: {storageCalc.totalDays} дн. (платных: {storageCalc.chargeableDays})
                </div>
              )}
            </div>

            {/* Dimensions & Weight */}
            <div className="bg-white p-3.5 border-2 border-black">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">
                Габариты и вес
              </span>
              {item.dimensions ? (
                <div>
                  <div className="font-black font-mono text-black text-xs">
                    {item.dimensions.length}×{item.dimensions.width}×{item.dimensions.height} см
                  </div>
                  <div className="text-[11px] font-bold text-gray-600 mt-0.5 uppercase">
                    Вес: {item.dimensions.weight} кг | Объём: {item.dimensions.volumeLiters} л
                  </div>
                </div>
              ) : (
                <span className="text-xs text-red-600 font-black uppercase">Не измерено</span>
              )}
            </div>

            {/* Financial Accumulated */}
            <div className="bg-yellow-400 p-3.5 border-2 border-black">
              <span className="text-[10px] font-black text-black uppercase tracking-widest block mb-1">
                Итого к оплате
              </span>
              <div className="font-black font-mono text-black text-2xl">
                {item.accumulatedCost + (storageCalc.isCurrentlyInStorage ? storageCalc.storageCost : 0)} ₽
              </div>
              <div className="text-[10px] text-black font-bold uppercase">
                За {item.history.length} операций {storageCalc.chargeableDays > 0 ? `+ хранение` : ''}
              </div>
            </div>
          </div>

          {/* Quick Barcode view */}
          <div className="bg-white p-4 border-2 border-black flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="p-2 bg-white border border-black">
                <BarcodeRenderer value={item.inventoryNumber} height={38} width={1.6} fontSize={11} />
              </div>
              <div className="text-xs text-black font-bold uppercase space-y-0.5">
                <div><span className="font-black">Инвентарный ШК:</span> <span className="font-mono">{item.inventoryNumber}</span></div>
                {item.barcodeEan && <div><span className="font-black">ШК производителя (EAN):</span> <span className="font-mono">{item.barcodeEan}</span></div>}
                {item.wbMpSticker && (
                  <div className="text-black font-black bg-yellow-300 p-1 border border-black mt-1">
                    <span>Стикер WB-MP:</span> {item.wbMpSticker} (Заказ: {item.orderNumber})
                  </div>
                )}
              </div>
            </div>

            {/* Operator CTA */}
            <button
              onClick={() => {
                onClose();
                onOpenOperatorStation(item);
              }}
              className="px-4 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 border border-black cursor-pointer"
            >
              <span>Рабочее место оператора</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Chronological State History & Financial Log */}
          <div>
            <div className="flex items-center justify-between mb-3 border-b-2 border-black pb-2">
              <h4 className="font-black text-black text-sm uppercase tracking-tight flex items-center gap-2">
                <Clock className="w-4 h-4 text-black" />
                Хронологический трекинг жизненного цикла (Таймлайн)
              </h4>
              <span className="text-xs text-black font-mono font-black uppercase">
                {item.history.length} этапов зафиксировано
              </span>
            </div>

            <div className="space-y-3">
              {item.history.map((log, index) => {
                const conf = STATE_CONFIG[log.state];
                const dateStr = new Date(log.timestamp).toLocaleString('ru-RU', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={log.id || index}
                    className="relative pl-6 pb-2 border-l-4 border-black last:border-l-transparent"
                  >
                    <div className="absolute -left-[10px] top-0 w-4 h-4 bg-yellow-400 border-2 border-black flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-black" />
                    </div>

                    <div className="bg-white p-3.5 border-2 border-black">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-xs uppercase text-black">
                              {log.stateName}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 font-black uppercase border ${conf.badgeColor}`}>
                              {conf.shortName}
                            </span>
                          </div>
                          <p className="text-xs text-gray-700 font-bold uppercase mt-1">
                            {log.details || conf.description}
                          </p>

                          {/* Specific metadata tags */}
                          {log.meta && Object.keys(log.meta).length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {log.meta.cell && (
                                <span className="text-[10px] bg-gray-100 text-black px-2 py-0.5 font-mono font-black border border-black">
                                  Ячейка: {log.meta.cell}
                                </span>
                              )}
                              {log.meta.brandName && (
                                <span className="text-[10px] bg-yellow-200 text-black px-2 py-0.5 font-bold uppercase border border-black">
                                  Бренд: {log.meta.brandName}
                                </span>
                              )}
                              {log.meta.packagingType && (
                                <span className="text-[10px] bg-gray-200 text-black px-2 py-0.5 font-bold uppercase border border-black">
                                  Упаковка: {log.meta.packagingType}
                                </span>
                              )}
                              {log.meta.orderNumber && (
                                <span className="text-[10px] bg-yellow-400 text-black px-2 py-0.5 font-mono font-black border border-black">
                                  Заказ WB: {log.meta.orderNumber}
                                </span>
                              )}
                              {log.meta.wbMpSticker && (
                                <span className="text-[10px] bg-black text-white px-2 py-0.5 font-mono font-black">
                                  WB-MP: {log.meta.wbMpSticker}
                                </span>
                              )}
                              {log.meta.returnReason && (
                                <span className="text-[10px] bg-red-100 text-red-900 px-2 py-0.5 font-bold uppercase border border-red-600">
                                  Причина: {log.meta.returnReason}
                                </span>
                              )}
                              {log.meta.returnCategory && (
                                <span className="text-[10px] bg-red-600 text-white font-black px-2 py-0.5 uppercase">
                                  Категория {log.meta.returnCategory}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xs font-black text-black font-mono">
                            +{log.cost} ₽
                          </div>
                          <div className="text-[10px] text-gray-500 font-bold uppercase mt-0.5 flex items-center justify-end gap-1">
                            <User className="w-3 h-3" />
                            {log.operator}
                          </div>
                          <div className="text-[10px] text-gray-400 font-mono">{dateStr}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-white border-t-2 border-black flex justify-between items-center">
          <div className="text-xs font-black text-black uppercase tracking-wider">
            Сквозной трекинг единицы товара • ПВЗ Прямой и Обратный поток
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
          >
            Закрыть
          </button>
        </div>
      </div>

      <ThermalStickerModal
        isOpen={isStickerPrintOpen}
        onClose={() => setIsStickerPrintOpen(false)}
        inventoryNumber={item.inventoryNumber}
        title={item.title}
        sku={item.sellerSku}
        sellerName={item.sellerName}
        wbMpSticker={item.wbMpSticker}
        orderNumber={item.orderNumber}
      />
    </div>
  );
};
