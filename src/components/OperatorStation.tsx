import React, { useState, useEffect } from 'react';
import { InventoryItem, ItemState, ReturnCategory, Seller, TariffRates } from '../types';
import { STATE_CONFIG, StorageService, WEIGHT_CATEGORY_LABELS, getWeightCategory } from '../services/storageService';
import { BarcodeRenderer, ThermalStickerModal } from './BarcodeRenderer';
import {
  PackagePlus,
  FileSpreadsheet,
  Warehouse,
  Tag,
  Box,
  CheckCircle2,
  Boxes,
  Truck,
  RotateCcw,
  GitFork,
  Wrench,
  CornerUpLeft,
  ArrowRight,
  Printer,
  Sparkles,
  Plus,
  Check,
  AlertCircle,
  HelpCircle,
  Scale,
} from 'lucide-react';

interface OperatorStationProps {
  items: InventoryItem[];
  sellers: Seller[];
  tariffs: TariffRates;
  selectedItem: InventoryItem | null;
  onSelectItem: (item: InventoryItem | null) => void;
  onRefreshData: () => void;
  onOpenSticker: (item: InventoryItem) => void;
}

export const OperatorStation: React.FC<OperatorStationProps> = ({
  items,
  sellers,
  tariffs,
  selectedItem,
  onSelectItem,
  onRefreshData,
  onOpenSticker,
}) => {
  const [operatorName, setOperatorName] = useState('Оператор ПВЗ (Кузнецова О.)');
  const [bulkCount, setBulkCount] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'forward' | 'return'>('forward');

  // Form states for advancing item
  const [sellerId, setSellerId] = useState('');
  const [title, setTitle] = useState('');
  const [sellerSku, setSellerSku] = useState('');
  const [barcodeEan, setBarcodeEan] = useState('');
  const [lengthCm, setLengthCm] = useState<number>(20);
  const [widthCm, setWidthCm] = useState<number>(15);
  const [heightCm, setHeightCm] = useState<number>(10);
  const [weightKg, setWeightKg] = useState<number>(0.5);

  const [storageCell, setStorageCell] = useState('A-01-05');
  const [brandName, setBrandName] = useState('Фирменный логотип селлера');
  const [packagingType, setPackagingType] = useState('3-слойная воздушно-пузырьковая плёнка + курьер-пакет');
  const [placementCell, setPlacementCell] = useState('READY-01-02');
  const [orderNumber, setOrderNumber] = useState('');
  const [wbMpSticker, setWbMpSticker] = useState('');
  const [shipmentNumber, setShipmentNumber] = useState('');

  // Return Flow States
  const [returnReason, setReturnReason] = useState('Отказ покупателя в ПВЗ (не подошел размер / оттенок)');
  const [returnNumber, setReturnNumber] = useState('');
  const [returnCategory, setReturnCategory] = useState<ReturnCategory>('A');
  const [returnSortingNotes, setReturnSortingNotes] = useState('');
  const [repairNotes, setRepairNotes] = useState('Заменен компонент из буферного запаса продавца');

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync state when selectedItem changes
  useEffect(() => {
    if (selectedItem) {
      setSellerId(selectedItem.sellerId || sellers[0]?.id || '');
      setTitle(selectedItem.title || '');
      setSellerSku(selectedItem.sellerSku || '');
      setBarcodeEan(selectedItem.barcodeEan || '');
      if (selectedItem.dimensions) {
        setLengthCm(selectedItem.dimensions.length);
        setWidthCm(selectedItem.dimensions.width);
        setHeightCm(selectedItem.dimensions.height);
        setWeightKg(selectedItem.dimensions.weight);
      }
      setStorageCell(selectedItem.storageCell || 'A-02-10');
      setBrandName(selectedItem.brandName || 'Фирменный лейбл');
      setPackagingType(selectedItem.packagingType || '3-слойная воздушно-пузырьковая плёнка + курьер-пакет');
      setPlacementCell(selectedItem.placementCell || 'READY-01');
      setOrderNumber(selectedItem.orderNumber || `WB-${Math.floor(10000000 + Math.random() * 90000000)}`);
      setWbMpSticker(selectedItem.wbMpSticker || `WB-MP-${Math.floor(1000000 + Math.random() * 9000000)}`);
      setShipmentNumber(selectedItem.shipmentNumber || `ACT-WB-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`);
      setReturnReason(selectedItem.returnReason || 'Отказ покупателя в ПВЗ');
      setReturnNumber(selectedItem.returnNumber || `RET-WB-${Math.floor(100000 + Math.random() * 900000)}`);
      setReturnCategory(selectedItem.returnCategory || 'A');

      const isReturn = [
        'return_intake',
        'return_sorting',
        'return_repair',
        'returned_seller',
      ].includes(selectedItem.currentState);
      if (isReturn) {
        setActiveTab('return');
      }
    }
  }, [selectedItem, sellers]);

  // Quick 1-Click Intake
  const defaultIntakeCost = StorageService.getOperationRate('intake', 0.5, tariffs);
  const currentWeightCategory = getWeightCategory(weightKg);

  const handleQuickIntake = () => {
    try {
      const newItem = StorageService.createIntakeItem(operatorName);
      onRefreshData();
      onSelectItem(newItem);
      setFeedbackMsg({
        type: 'success',
        text: `Товар принят! Присвоен инвентарный номер ${newItem.inventoryNumber} (Начислено +${defaultIntakeCost} ₽)`,
      });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  // Bulk Intake
  const handleBulkIntake = () => {
    if (bulkCount < 1) return;
    try {
      const created = StorageService.createBulkIntake(bulkCount, operatorName);
      onRefreshData();
      if (created.length > 0) {
        onSelectItem(created[0]);
      }
      setFeedbackMsg({
        type: 'success',
        text: `Принята партия из ${created.length} шт. (Начислено +${created.length * defaultIntakeCost} ₽)`,
      });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  // Advance state helper
  const handleAdvance = (nextState: ItemState) => {
    if (!selectedItem) return;

    try {
      const selectedSeller = sellers.find((s) => s.id === sellerId);
      const updated = StorageService.advanceItemState(selectedItem.id, nextState, {
        operator: operatorName,
        sellerId,
        sellerName: selectedSeller ? selectedSeller.name : undefined,
        title,
        sellerSku,
        barcodeEan,
        dimensions: {
          length: Number(lengthCm) || 0,
          width: Number(widthCm) || 0,
          height: Number(heightCm) || 0,
          weight: Number(weightKg) || 0,
        },
        storageCell,
        brandName,
        packagingType,
        placementCell,
        orderNumber,
        wbBarcode: barcodeEan || sellerSku,
        wbMpSticker,
        shipmentNumber,
        returnReason,
        returnNumber,
        returnCategory,
        returnSortingNotes,
        repairNotes,
      });

      onRefreshData();
      onSelectItem(updated);
      setFeedbackMsg({
        type: 'success',
        text: `Состояние товара обновлено на: «${STATE_CONFIG[nextState].name}»!`,
      });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: err.message || 'Ошибка при изменении состояния',
      });
    }
  };

  // Inbound Return injection for any item
  const handleInjectReturn = () => {
    if (!selectedItem) return;
    handleAdvance('return_intake');
  };

  const calculatedLiters = ((lengthCm * widthCm * heightCm) / 1000).toFixed(2);
  const calculatedM3 = ((lengthCm * widthCm * heightCm) / 1000000).toFixed(4);

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Intake CTA */}
      <div className="bg-black text-white border-2 border-black p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-yellow-400 text-black text-[10px] font-black uppercase tracking-wider">
              ТЕРМИНАЛ ОПЕРАТОРА ПВЗ
            </span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              СТРОГАЯ ПОСЛЕДОВАТЕЛЬНОСТЬ СОСТОЯНИЙ
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black mt-2 text-white uppercase tracking-tight">
            Пошаговое изменение состояния единиц товара
          </h2>
          <p className="text-xs text-gray-300 max-w-2xl mt-1 font-medium">
            Каждое действие фиксируется со стикером, временем, оператором и тарифом. В любой момент доступен финансовый и физический трекинг.
          </p>
        </div>

        {/* 1-Click Intake Box */}
        <div className="bg-neutral-900 p-3.5 border-2 border-neutral-800 flex flex-col sm:flex-row items-center gap-3 shrink-0">
          <button
            onClick={handleQuickIntake}
            className="w-full sm:w-auto px-4 py-2.5 bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 text-black text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <PackagePlus className="w-4 h-4" />
            <span>Приёмка единицы (+{tariffs.intake} ₽)</span>
          </button>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <input
              type="number"
              min={2}
              max={50}
              value={bulkCount}
              onChange={(e) => setBulkCount(Math.max(2, parseInt(e.target.value) || 2))}
              className="w-14 px-2 py-2 bg-black border-2 border-neutral-700 text-xs font-black text-center text-white"
            />
            <button
              onClick={handleBulkIntake}
              className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-black uppercase tracking-wider transition-colors border border-neutral-700 whitespace-nowrap cursor-pointer"
            >
              Партия шт.
            </button>
          </div>
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={`p-3.5 border-2 border-black text-xs font-black uppercase tracking-wider flex items-center justify-between transition-all ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-400 text-black'
              : 'bg-red-500 text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? (
              <Check className="w-4 h-4 text-black" />
            ) : (
              <AlertCircle className="w-4 h-4 text-white" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-black hover:opacity-75 font-black text-sm">
            ✕
          </button>
        </div>
      )}

      {/* Main Workspace: Left Column (Queue & Item selector) + Right Column (State processing forms) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Current Target Item & Queue Selection */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-4 border-2 border-black space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-black text-black text-xs uppercase tracking-wider">
                Текущий товар в работе
              </h3>
              {selectedItem && (
                <button
                  onClick={() => onOpenSticker(selectedItem)}
                  className="text-xs text-black font-black uppercase tracking-wider flex items-center gap-1 border border-black px-2 py-1 hover:bg-gray-100"
                >
                  <Printer className="w-3 h-3" /> Стикер
                </button>
              )}
            </div>

            {selectedItem ? (
              <div className="p-3.5 bg-gray-50 border-2 border-black space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-base font-black text-black">
                    {selectedItem.inventoryNumber}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 status-badge ${
                      STATE_CONFIG[selectedItem.currentState].badgeColor
                    }`}
                  >
                    {STATE_CONFIG[selectedItem.currentState].shortName}
                  </span>
                </div>

                <div className="text-xs text-black">
                  <div className="font-black uppercase truncate">
                    {selectedItem.title || 'Наименование не заполнено (шаг Регистрация)'}
                  </div>
                  <div className="text-gray-600 font-bold uppercase text-[11px] mt-0.5">
                    Селлер: {selectedItem.sellerName || '—'}
                  </div>
                  {selectedItem.sellerSku && (
                    <div className="text-gray-600 text-[11px] font-mono font-bold">
                      Арт: {selectedItem.sellerSku}
                    </div>
                  )}
                  {selectedItem.dimensions && (
                    <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold text-gray-700">
                        {selectedItem.dimensions.weight} кг
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 bg-yellow-300 text-black font-black uppercase">
                        {WEIGHT_CATEGORY_LABELS[getWeightCategory(selectedItem.dimensions.weight)]}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t-2 border-black flex justify-between items-center text-xs">
                  <span className="font-bold uppercase text-gray-500">Начислено услуг:</span>
                  <span className="font-black text-black font-mono text-base">{selectedItem.accumulatedCost} ₽</span>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center border-2 border-dashed border-black bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                Выберите товар из списка ниже или выполните приёмку
              </div>
            )}
          </div>

          {/* Items Queue / Switcher */}
          <div className="bg-white p-4 border-2 border-black space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-black text-black text-xs uppercase tracking-wider">
                Очередь товаров ({items.length})
              </h3>
              <div className="text-[10px] font-bold text-gray-500 uppercase">Выбор по клику</div>
            </div>

            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {items.map((item) => {
                const conf = STATE_CONFIG[item.currentState];
                const isSelected = selectedItem?.id === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectItem(item)}
                    className={`w-full text-left p-2.5 border-2 text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-black text-white border-black'
                        : 'bg-gray-50 hover:bg-gray-100 border-gray-300 text-black'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-mono font-black ${isSelected ? 'text-white' : 'text-black'}`}>
                        {item.inventoryNumber}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 status-badge ${conf.badgeColor}`}>
                        {conf.shortName}
                      </span>
                    </div>
                    <div className={`truncate mt-1 text-[11px] font-bold uppercase ${isSelected ? 'text-gray-300' : 'text-gray-600'}`}>
                      {item.title || item.sellerSku || 'Товар на приёмке'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Operator switcher settings */}
          <div className="bg-white p-3 border-2 border-black flex items-center justify-between text-xs text-black">
            <span className="font-bold uppercase tracking-wider text-[10px]">Оператор:</span>
            <input
              type="text"
              value={operatorName}
              onChange={(e) => setOperatorName(e.target.value)}
              className="bg-gray-50 border-2 border-black px-2 py-1 text-xs text-black font-bold uppercase"
            />
          </div>
        </div>

        {/* Right Column: State Action Workbench */}
        <div className="lg:col-span-8 space-y-4">
          {selectedItem ? (
            <div className="bg-white p-6 border-2 border-black">
              {/* Flow Selector Tabs */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-2 border-black pb-4 mb-5 gap-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab('forward')}
                    className={`px-4 py-2 text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                      activeTab === 'forward'
                        ? 'bg-black text-white'
                        : 'bg-gray-100 text-black hover:bg-gray-200 border border-black'
                    }`}
                  >
                    Прямой поток (1—8)
                  </button>
                  <button
                    onClick={() => setActiveTab('return')}
                    className={`px-4 py-2 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'return'
                        ? 'bg-red-600 text-white'
                        : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-400'
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Обратный поток (Возвраты)
                  </button>
                </div>

                <div className="text-xs text-black font-black uppercase tracking-wider">
                  Текущее: {STATE_CONFIG[selectedItem.currentState].name}
                </div>
              </div>

              {/* FORWARD FLOW STEPS */}
              {activeTab === 'forward' && (
                <div className="space-y-6">
                  {/* Step 2. Регистрация (габариты, селлер, артикул) */}
                  <div className={`p-4 border-2 transition-all ${
                    selectedItem.currentState === 'intake'
                      ? 'bg-white border-black ring-4 ring-black/10'
                      : 'bg-gray-50 border-gray-300'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 bg-black text-white font-black text-xs flex items-center justify-center">
                          2
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-black text-black uppercase tracking-wide">
                              Модуль: Регистрация и обмер
                            </h4>
                            <span className="px-2 py-0.5 bg-yellow-400 text-black text-[10px] font-black uppercase border border-black">
                              Категория: {WEIGHT_CATEGORY_LABELS[currentWeightCategory]}
                            </span>
                          </div>
                          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                            Привязка селлера, артикула, габаритов (ДxШxВ) и расчет объема
                          </p>
                        </div>
                      </div>

                      {selectedItem.currentState === 'intake' ? (
                        <button
                          onClick={() => handleAdvance('registration')}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>Зафиксировать</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="text-xs text-emerald-700 font-black uppercase tracking-wider flex items-center gap-1">
                          <Check className="w-4 h-4" /> Зарегистрирован
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-black mb-1">Селлер</label>
                        <select
                          value={sellerId}
                          onChange={(e) => setSellerId(e.target.value)}
                          className="w-full text-xs p-2 bg-white border-2 border-black text-black font-bold uppercase outline-none"
                        >
                          {sellers.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name.toUpperCase()}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-black mb-1">Артикул продавца</label>
                        <input
                          type="text"
                          value={sellerSku}
                          onChange={(e) => setSellerSku(e.target.value)}
                          placeholder="TH-HUM-03-WHITE"
                          className="w-full text-xs p-2 bg-white border-2 border-black text-black font-mono font-bold uppercase outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-black mb-1">ШК производителя (EAN)</label>
                        <input
                          type="text"
                          value={barcodeEan}
                          onChange={(e) => setBarcodeEan(e.target.value)}
                          placeholder="4607123984..."
                          className="w-full text-xs p-2 bg-white border-2 border-black text-black font-mono font-bold outline-none"
                        />
                      </div>

                      <div className="sm:col-span-2 lg:col-span-3">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-black mb-1">Название товара</label>
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="например: Умный увлажнитель воздуха 3.5л с подсветкой"
                          className="w-full text-xs p-2 bg-white border-2 border-black text-black font-bold outline-none"
                        />
                      </div>

                      {/* Dimensions calculation */}
                      <div className="sm:col-span-2 lg:col-span-3 bg-gray-100 p-3 border-2 border-black grid grid-cols-2 sm:grid-cols-5 gap-2">
                        <div>
                          <label className="block text-[10px] font-black uppercase text-gray-600">Длина (см)</label>
                          <input
                            type="number"
                            value={lengthCm}
                            onChange={(e) => setLengthCm(parseFloat(e.target.value) || 0)}
                            className="w-full text-xs p-1.5 bg-white border-2 border-black text-black font-black"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase text-gray-600">Ширина (см)</label>
                          <input
                            type="number"
                            value={widthCm}
                            onChange={(e) => setWidthCm(parseFloat(e.target.value) || 0)}
                            className="w-full text-xs p-1.5 bg-white border-2 border-black text-black font-black"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase text-gray-600">Высота (см)</label>
                          <input
                            type="number"
                            value={heightCm}
                            onChange={(e) => setHeightCm(parseFloat(e.target.value) || 0)}
                            className="w-full text-xs p-1.5 bg-white border-2 border-black text-black font-black"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase text-gray-600 flex items-center justify-between">
                            <span>Вес (кг)</span>
                            <span className="text-[9px] text-black font-black bg-yellow-300 px-1">{WEIGHT_CATEGORY_LABELS[currentWeightCategory]}</span>
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={weightKg}
                            onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
                            className="w-full text-xs p-1.5 bg-white border-2 border-black text-black font-black"
                          />
                        </div>
                        <div className="bg-black text-white p-1.5 flex flex-col justify-between">
                          <label className="block text-[9px] font-black uppercase text-yellow-400">Объём</label>
                          <div className="text-xs font-black">{calculatedLiters} л ({calculatedM3} м³)</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 3. Хранение */}
                  <div className={`p-4 border-2 transition-all ${
                    selectedItem.currentState === 'registration' || selectedItem.currentState === 'storage'
                      ? 'bg-white border-black'
                      : 'bg-gray-50 border-gray-300'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 bg-black text-white font-black text-xs flex items-center justify-center">
                          3
                        </span>
                        <div>
                          <h4 className="text-xs font-black text-black uppercase tracking-wide">
                            Модуль: Хранение ({tariffs.storageFreeDays} дней бесплатно, далее {tariffs.storagePerDay} ₽/день)
                          </h4>
                          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                            Фиксация даты поступления и номера складской ячейки
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {selectedItem.currentState === 'registration' && (
                          <button
                            onClick={() => handleAdvance('storage')}
                            className="px-4 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>Разместить в ячейку</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-2">
                      <div className="w-full sm:w-48">
                        <label className="block text-[10px] font-black uppercase text-black mb-1">Ячейка склада</label>
                        <input
                          type="text"
                          value={storageCell}
                          onChange={(e) => setStorageCell(e.target.value)}
                          placeholder="A-04-12"
                          className="w-full text-xs p-2 bg-white border-2 border-black text-black font-mono font-black uppercase outline-none"
                        />
                      </div>
                      <div className="text-xs font-bold text-gray-600 sm:pt-4">
                        {selectedItem.storageEnteredAt ? (
                          <span className="text-black font-black uppercase">
                            Поступил в хранение: {new Date(selectedItem.storageEnteredAt).toLocaleDateString('ru-RU')}
                          </span>
                        ) : (
                          <span>Первые {tariffs.storageFreeDays} дней бесплатно, далее {tariffs.storagePerDay} ₽/сут</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Step 4 & 5. Брендирование и Упаковка */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 4. Брендирование */}
                    <div className="p-4 bg-white border-2 border-black">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 bg-purple-600 text-white font-black text-xs flex items-center justify-center">
                            4
                          </span>
                          <div>
                            <h4 className="text-xs font-black text-black uppercase tracking-wide">
                              Брендирование (+{StorageService.getOperationRate('branding', weightKg, tariffs)} ₽)
                            </h4>
                            <span className="text-[9px] text-gray-500 font-bold uppercase">({WEIGHT_CATEGORY_LABELS[currentWeightCategory]})</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAdvance('branding')}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          Применить
                        </button>
                      </div>
                      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Наклейка фирменных лейблов селлера</p>
                      <input
                        type="text"
                        value={brandName}
                        onChange={(e) => setBrandName(e.target.value)}
                        placeholder="Название бренда"
                        className="w-full text-xs p-2 bg-white border-2 border-black text-black font-bold uppercase"
                      />
                    </div>

                    {/* 5. Упаковка */}
                    <div className="p-4 bg-white border-2 border-black">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 bg-teal-600 text-white font-black text-xs flex items-center justify-center">
                            5
                          </span>
                          <div>
                            <h4 className="text-xs font-black text-black uppercase tracking-wide">
                              Упаковка (+{StorageService.getOperationRate('packaging', weightKg, tariffs)} ₽)
                            </h4>
                            <span className="text-[9px] text-gray-500 font-bold uppercase">({WEIGHT_CATEGORY_LABELS[currentWeightCategory]})</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAdvance('packaging')}
                          className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          Упаковать
                        </button>
                      </div>
                      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Упаковка по утвержденной техкарте</p>
                      <input
                        type="text"
                        value={packagingType}
                        onChange={(e) => setPackagingType(e.target.value)}
                        placeholder="Техкарта: пупырка + короб"
                        className="w-full text-xs p-2 bg-white border-2 border-black text-black font-bold uppercase"
                      />
                    </div>
                  </div>

                  {/* Step 6. Размещение на полку готовности */}
                  <div className="p-4 bg-white border-2 border-black flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                        6
                      </span>
                      <div>
                        <h4 className="text-xs font-black text-black uppercase tracking-wide">
                          Размещение (Готов к заказу)
                        </h4>
                        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                          Товар готов к заказу на полке готовой продукции (входит в тариф упаковки)
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <input
                        type="text"
                        value={placementCell}
                        onChange={(e) => setPlacementCell(e.target.value)}
                        placeholder="READY-01"
                        className="w-32 text-xs p-2 bg-white border-2 border-black font-mono font-black uppercase"
                      />
                      <button
                        onClick={() => handleAdvance('placed')}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Разместить
                      </button>
                    </div>
                  </div>

                  {/* Step 7 & 8: Сборка под заказ WB и Отгрузка в логистику */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 7. Сборка под заказ WB */}
                    <div className="p-4 bg-white border-2 border-black">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                            7
                          </span>
                          <div>
                            <h4 className="text-xs font-black text-black uppercase tracking-wide">
                              Сборка WB (+{StorageService.getOperationRate('assembly', weightKg, tariffs)} ₽)
                            </h4>
                            <span className="text-[9px] text-gray-500 font-bold uppercase">({WEIGHT_CATEGORY_LABELS[currentWeightCategory]})</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAdvance('assembly')}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          Собрать
                        </button>
                      </div>
                      <div className="space-y-2 mt-2">
                        <div>
                          <label className="block text-[10px] font-black uppercase text-black">Номер заказа WB</label>
                          <input
                            type="text"
                            value={orderNumber}
                            onChange={(e) => setOrderNumber(e.target.value)}
                            placeholder="WB-84920194"
                            className="w-full text-xs p-2 bg-white border-2 border-black font-mono font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase text-black">Стикер WB-MP (ШК поставки)</label>
                          <input
                            type="text"
                            value={wbMpSticker}
                            onChange={(e) => setWbMpSticker(e.target.value)}
                            placeholder="WB-MP-3829104"
                            className="w-full text-xs p-2 bg-white border-2 border-black font-mono font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 8. Отгрузка в логистику Wildberries */}
                    <div className="p-4 bg-white border-2 border-black">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 bg-black text-white font-black text-xs flex items-center justify-center">
                            8
                          </span>
                          <h4 className="text-xs font-black text-black uppercase tracking-wide">
                            Отгрузка в WB (Выход)
                          </h4>
                        </div>
                        <button
                          onClick={() => handleAdvance('shipped')}
                          className="px-3 py-1.5 bg-black hover:bg-neutral-800 text-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          Отгрузить
                        </button>
                      </div>
                      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Передача водителю-экспедитору WB</p>
                      <label className="block text-[10px] font-black uppercase text-black">Номер акта / рейса</label>
                      <input
                        type="text"
                        value={shipmentNumber}
                        onChange={(e) => setShipmentNumber(e.target.value)}
                        placeholder="ACT-WB-20250823-01"
                        className="w-full text-xs p-2 bg-white border-2 border-black font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* RETURN FLOW (ОБРАТНЫЙ ПОТОК) */}
              {activeTab === 'return' && (
                <div className="space-y-6">
                  <div className="p-4 bg-red-600 text-white border-2 border-black">
                    <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider mb-1">
                      <RotateCcw className="w-4 h-4" />
                      Модуль: Обратный поток (Возврат от покупателя)
                    </div>
                    <p className="text-xs font-medium text-red-100">
                      Врезается между Упаковкой и Размещением. Позволяет принять возвращенный товар, классифицировать его по категориям А / Б / В и направить по соответствующему маршруту с учетом весового тарифа ({WEIGHT_CATEGORY_LABELS[currentWeightCategory]}).
                    </p>
                  </div>

                  {/* 1. Приёмка возврата */}
                  <div className="p-4 bg-white border-2 border-black space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 bg-red-600 text-white font-black text-xs flex items-center justify-center">
                          9
                        </span>
                        <div>
                          <h4 className="text-xs font-black text-black uppercase tracking-wide">
                            Приёмка возврата (+{StorageService.getOperationRate('return_intake', weightKg, tariffs)} ₽)
                          </h4>
                          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                            Фиксация даты и причины возврата ({WEIGHT_CATEGORY_LABELS[currentWeightCategory]})
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAdvance('return_intake')}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Принять возврат
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-black mb-1">Номер возврата WB</label>
                        <input
                          type="text"
                          value={returnNumber}
                          onChange={(e) => setReturnNumber(e.target.value)}
                          placeholder="RET-WB-901920"
                          className="w-full text-xs p-2 bg-gray-50 border-2 border-black font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-black mb-1">Причина возврата</label>
                        <input
                          type="text"
                          value={returnReason}
                          onChange={(e) => setReturnReason(e.target.value)}
                          placeholder="например: Отказ покупателя / повреждена упаковка"
                          className="w-full text-xs p-2 bg-gray-50 border-2 border-black font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2. Сортировка возврата (А / Б / В) */}
                  <div className="p-4 bg-white border-2 border-black space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 bg-pink-600 text-white font-black text-xs flex items-center justify-center">
                          10
                        </span>
                        <div>
                          <h4 className="text-xs font-black text-black uppercase tracking-wide">
                            Сортировка и классификация (+{StorageService.getOperationRate('return_sorting', weightKg, tariffs)} ₽)
                          </h4>
                          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                            Экспертная оценка состояния возврата ({WEIGHT_CATEGORY_LABELS[currentWeightCategory]})
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 3 Categories Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Category A */}
                      <button
                        type="button"
                        onClick={() => {
                          setReturnCategory('A');
                          setReturnSortingNotes('Категория А: Товар полностью годен, возвращен в Размещение');
                        }}
                        className={`p-3.5 border-2 text-left transition-all cursor-pointer ${
                          returnCategory === 'A'
                            ? 'bg-emerald-600 text-white border-black'
                            : 'bg-gray-50 hover:bg-gray-100 border-gray-300 text-black'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase">Категория А</span>
                          <span className="text-[9px] px-1.5 py-0.5 status-badge bg-black text-white">
                            ГОДЕН
                          </span>
                        </div>
                        <p className={`text-[11px] font-bold mt-2 ${returnCategory === 'A' ? 'text-emerald-100' : 'text-gray-600'}`}>
                          Без дефектов → напрямую в <b>Размещение</b> (готов к новому заказу).
                        </p>
                      </button>

                      {/* Category B */}
                      <button
                        type="button"
                        onClick={() => {
                          setReturnCategory('B');
                          setReturnSortingNotes('Категория Б: Требуется замена элемента из буферного запаса селлера');
                        }}
                        className={`p-3.5 border-2 text-left transition-all cursor-pointer ${
                          returnCategory === 'B'
                            ? 'bg-yellow-400 text-black border-black font-bold'
                            : 'bg-gray-50 hover:bg-gray-100 border-gray-300 text-black'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase">Категория Б</span>
                          <span className="text-[9px] px-1.5 py-0.5 status-badge bg-black text-white">
                            ЗАМЕНА
                          </span>
                        </div>
                        <p className="text-[11px] font-bold mt-2 text-gray-800">
                          Замена элемента из запаса селлера → <b>Упаковка</b> → <b>Размещение</b>.
                        </p>
                      </button>

                      {/* Category C */}
                      <button
                        type="button"
                        onClick={() => {
                          setReturnCategory('C');
                          setReturnSortingNotes('Категория В: Критический дефект / неремонтопригоден, возврат селлеру');
                        }}
                        className={`p-3.5 border-2 text-left transition-all cursor-pointer ${
                          returnCategory === 'C'
                            ? 'bg-red-600 text-white border-black'
                            : 'bg-gray-50 hover:bg-gray-100 border-gray-300 text-black'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase">Категория В</span>
                          <span className="text-[9px] px-1.5 py-0.5 status-badge bg-black text-white">
                            СЕЛЛЕРУ
                          </span>
                        </div>
                        <p className={`text-[11px] font-bold mt-2 ${returnCategory === 'C' ? 'text-red-100' : 'text-gray-600'}`}>
                          Неремонтопригоден → <b>Возврат селлеру</b> (выход из системы).
                        </p>
                      </button>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-black mb-1">
                        Заключение эксперта / описание дефекта
                      </label>
                      <input
                        type="text"
                        value={returnSortingNotes}
                        onChange={(e) => setReturnSortingNotes(e.target.value)}
                        placeholder="Описание дефекта..."
                        className="w-full text-xs p-2 bg-gray-50 border-2 border-black font-bold uppercase"
                      />
                    </div>

                    {/* Routing Actions according to Category */}
                    <div className="pt-2 flex flex-wrap gap-3 justify-end">
                      {returnCategory === 'A' && (
                        <button
                          onClick={() => {
                            handleAdvance('return_sorting');
                            setTimeout(() => handleAdvance('placed'), 50);
                          }}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Категория А: Направить сразу в Размещение</span>
                        </button>
                      )}

                      {returnCategory === 'B' && (
                        <button
                          onClick={() => handleAdvance('return_repair')}
                          className="px-5 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-black text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <Wrench className="w-4 h-4" />
                          <span>Категория Б: Замена детали (+{StorageService.getOperationRate('return_repair', weightKg, tariffs)} ₽)</span>
                        </button>
                      )}

                      {returnCategory === 'C' && (
                        <button
                          onClick={() => handleAdvance('returned_seller')}
                          className="px-5 py-2.5 bg-red-700 hover:bg-red-800 text-white text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <CornerUpLeft className="w-4 h-4" />
                          <span>Категория В: Оформить возврат селлеру (+{StorageService.getOperationRate('returned_seller', weightKg, tariffs)} ₽)</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white p-12 border-2 border-black text-center">
              <PackagePlus className="w-12 h-12 text-black mx-auto mb-3" />
              <h3 className="font-black text-black text-lg uppercase tracking-tight">Товар не выбран</h3>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider max-w-md mx-auto mt-2">
                Выберите инвентарную единицу из списка слева, отсканируйте штрих-код или нажмите кнопку «Приёмка единицы» для добавления нового товара.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
