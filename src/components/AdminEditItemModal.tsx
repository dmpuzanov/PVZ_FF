import React, { useState } from 'react';
import { InventoryItem, ItemEditPayload, ReturnCategory, Seller } from '../types';
import { StorageService, getWeightCategory, WEIGHT_CATEGORY_LABELS } from '../services/storageService';
import { Edit3, Trash2, Save, X, AlertTriangle, Package, ShieldCheck } from 'lucide-react';

interface AdminEditItemModalProps {
  isOpen: boolean;
  item: InventoryItem | null;
  sellers: Seller[];
  onClose: () => void;
  onItemUpdated: (updatedItem: InventoryItem) => void;
  onItemDeleted: (deletedItemId: string) => void;
}

export const AdminEditItemModal: React.FC<AdminEditItemModalProps> = ({
  isOpen,
  item,
  sellers,
  onClose,
  onItemUpdated,
  onItemDeleted,
}) => {
  if (!isOpen || !item) return null;

  const [title, setTitle] = useState(item.title || '');
  const [sellerSku, setSellerSku] = useState(item.sellerSku || '');
  const [barcodeEan, setBarcodeEan] = useState(item.barcodeEan || '');
  const [sellerId, setSellerId] = useState(item.sellerId || sellers[0]?.id || '');
  const [storageCell, setStorageCell] = useState(item.storageCell || '');
  const [placementCell, setPlacementCell] = useState(item.placementCell || '');
  const [orderNumber, setOrderNumber] = useState(item.orderNumber || '');
  const [wbMpSticker, setWbMpSticker] = useState(item.wbMpSticker || '');
  const [accumulatedCost, setAccumulatedCost] = useState(item.accumulatedCost || 0);

  const [length, setLength] = useState(item.dimensions?.length || 20);
  const [width, setWidth] = useState(item.dimensions?.width || 15);
  const [height, setHeight] = useState(item.dimensions?.height || 10);
  const [weight, setWeight] = useState(item.dimensions?.weight || 0.5);

  const [returnReason, setReturnReason] = useState(item.returnReason || '');
  const [returnCategory, setReturnCategory] = useState<ReturnCategory>(item.returnCategory || 'A');

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const calculatedVolumeLiters = Number(((length * width * height) / 1000).toFixed(2));
  const calculatedVolumeM3 = Number(((length * width * height) / 1000000).toFixed(4));
  const currentWeightCategory = getWeightCategory(weight);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedSeller = sellers.find((s) => s.id === sellerId);

    const payload: ItemEditPayload = {
      title: title.trim(),
      sellerSku: sellerSku.trim(),
      barcodeEan: barcodeEan.trim(),
      sellerId,
      sellerName: selectedSeller ? selectedSeller.name : item.sellerName,
      storageCell: storageCell.trim(),
      placementCell: placementCell.trim(),
      orderNumber: orderNumber.trim(),
      wbMpSticker: wbMpSticker.trim(),
      accumulatedCost: Number(accumulatedCost) || 0,
      dimensions: {
        length: Number(length) || 0,
        width: Number(width) || 0,
        height: Number(height) || 0,
        weight: Number(weight) || 0,
        volumeLiters: calculatedVolumeLiters,
        volumeM3: calculatedVolumeM3,
      },
      returnReason: returnReason.trim(),
      returnCategory,
    };

    try {
      const updated = StorageService.updateItem(item.id, payload, 'Администратор (ИП Пузанова Т.Ю.)');
      onItemUpdated(updated);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Ошибка сохранения изменений');
    }
  };

  const handleDelete = () => {
    try {
      StorageService.deleteItem(item.id);
      onItemDeleted(item.id);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Ошибка удаления товара');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 overflow-y-auto">
      <div className="bg-white border-2 border-black w-full max-w-3xl overflow-hidden shadow-2xl my-auto">
        {/* Header */}
        <div className="p-4 bg-[#6B0F3B] text-white border-b-2 border-black flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-[#C5A059] text-black border border-black">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-black text-sm uppercase tracking-tight text-white flex items-center gap-2">
                <span>Редактирование параметров товара</span>
                <span className="text-xs bg-black text-white px-2 py-0.5 font-mono font-black border border-[#C5A059]">
                  {item.inventoryNumber}
                </span>
              </h3>
              <p className="text-[10px] text-[#E5C378] font-bold uppercase tracking-wider">
                Режим администратора • Полный доступ к корректировке данных и удалению
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-[#C5A059] p-1 font-black transition-colors cursor-pointer text-lg"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Main Info */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase text-black flex items-center gap-1.5 border-b-2 border-black pb-1">
              <span className="w-2.5 h-2.5 bg-[#6B0F3B]" />
              <span>1. Основные реквизиты и принадлежность селлеру</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-black mb-1">
                  Селлер (Владелец товара)
                </label>
                <select
                  value={sellerId}
                  onChange={(e) => setSellerId(e.target.value)}
                  className="w-full text-xs p-2 bg-gray-50 border-2 border-black font-bold uppercase outline-none focus:bg-white"
                >
                  {sellers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-black mb-1">
                  Артикул продавца (SKU)
                </label>
                <input
                  type="text"
                  value={sellerSku}
                  onChange={(e) => setSellerSku(e.target.value)}
                  className="w-full text-xs p-2 bg-white border-2 border-black font-mono font-bold uppercase"
                  placeholder="SKU-1002"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-black mb-1">
                  ШК производителя (EAN-13)
                </label>
                <input
                  type="text"
                  value={barcodeEan}
                  onChange={(e) => setBarcodeEan(e.target.value)}
                  className="w-full text-xs p-2 bg-white border-2 border-black font-mono font-bold"
                  placeholder="4607000000000"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-[10px] font-black uppercase tracking-wider text-black mb-1">
                  Наименование товара
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs p-2 bg-white border-2 border-black font-bold uppercase"
                  placeholder="Наименование товара..."
                />
              </div>
            </div>
          </div>

          {/* Dimensions and Weight */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase text-black flex items-center gap-1.5 border-b-2 border-black pb-1">
              <span className="w-2.5 h-2.5 bg-[#C5A059]" />
              <span>2. Весогабаритные характеристики (ВГХ) и тарификация</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-black uppercase text-black mb-1">Длина (см)</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  value={length}
                  onChange={(e) => setLength(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs p-2 bg-white border-2 border-black font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-black mb-1">Ширина (см)</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  value={width}
                  onChange={(e) => setWidth(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs p-2 bg-white border-2 border-black font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-black mb-1">Высота (см)</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  value={height}
                  onChange={(e) => setHeight(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs p-2 bg-white border-2 border-black font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-black mb-1">Фактический вес (кг)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.01"
                  value={weight}
                  onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs p-2 bg-yellow-50 border-2 border-black font-mono font-black"
                />
              </div>
            </div>

            {/* Calculated category banner */}
            <div className="p-2.5 bg-neutral-100 border-2 border-black flex flex-wrap items-center justify-between text-xs font-bold gap-2">
              <span className="uppercase text-black">
                Категория веса: <b className="text-[#6B0F3B] underline font-black">{WEIGHT_CATEGORY_LABELS[currentWeightCategory]}</b>
              </span>
              <span className="font-mono text-gray-700">
                Объём: {calculatedVolumeLiters} л ({calculatedVolumeM3} м³)
              </span>
            </div>
          </div>

          {/* Storage and Logistics Cells */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase text-black flex items-center gap-1.5 border-b-2 border-black pb-1">
              <span className="w-2.5 h-2.5 bg-black" />
              <span>3. Складская логистика и заказы маркетплейса</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-black uppercase text-black mb-1">Ячейка хранения</label>
                <input
                  type="text"
                  value={storageCell}
                  onChange={(e) => setStorageCell(e.target.value)}
                  className="w-full text-xs p-2 bg-white border-2 border-black font-mono font-bold uppercase"
                  placeholder="A-12-04"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-black mb-1">Ячейка отгрузки</label>
                <input
                  type="text"
                  value={placementCell}
                  onChange={(e) => setPlacementCell(e.target.value)}
                  className="w-full text-xs p-2 bg-white border-2 border-black font-mono font-bold uppercase"
                  placeholder="READY-01"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-black mb-1">Номер заказа WB</label>
                <input
                  type="text"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="w-full text-xs p-2 bg-white border-2 border-black font-mono font-bold uppercase"
                  placeholder="WB-84920194"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-black mb-1">ШК стикера WB MP</label>
                <input
                  type="text"
                  value={wbMpSticker}
                  onChange={(e) => setWbMpSticker(e.target.value)}
                  className="w-full text-xs p-2 bg-white border-2 border-black font-mono font-bold uppercase"
                  placeholder="WB-MP-492019"
                />
              </div>
            </div>
          </div>

          {/* Accumulated Cost Manual Override */}
          <div className="p-3 bg-yellow-50 border-2 border-black flex items-center justify-between gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-black mb-0.5">
                Накопленная стоимость технологических услуг (₽)
              </label>
              <span className="text-[10px] text-gray-600 font-bold uppercase">
                Сумма, которая войдет в счет-акт селлеру за данный товар
              </span>
            </div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                value={accumulatedCost}
                onChange={(e) => setAccumulatedCost(parseFloat(e.target.value) || 0)}
                className="w-24 p-2 bg-white border-2 border-black text-center font-mono font-black text-sm"
              />
              <span className="font-mono font-black text-black">₽</span>
            </div>
          </div>

          {/* Delete Danger Section */}
          <div className="pt-2 border-t-2 border-black flex items-center justify-between">
            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-900 border-2 border-red-700 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-700" />
                <span>Удалить запись товара</span>
              </button>
            ) : (
              <div className="p-2.5 bg-red-600 text-white border-2 border-black flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-300 shrink-0" />
                <span className="text-[11px] font-black uppercase">Удалить безвозвратно?</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-2.5 py-1 bg-white text-red-700 font-black text-xs uppercase border border-black hover:bg-gray-100 cursor-pointer"
                >
                  Да, удалить
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-2 py-1 bg-black text-white font-black text-xs uppercase hover:bg-neutral-800 cursor-pointer"
                >
                  Отмена
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-black border-2 border-black text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#6B0F3B] hover:bg-[#851349] text-white border-2 border-black text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Save className="w-4 h-4 text-[#C5A059]" />
                <span>Сохранить изменения</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
