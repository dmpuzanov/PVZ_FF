import React, { useState, useEffect, useRef } from 'react';
import { InventoryItem } from '../types';
import { STATE_CONFIG } from '../services/storageService';
import { Scan, Search, Camera, Check, AlertCircle, Sparkles } from 'lucide-react';

interface QuickScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  onSelectItem: (item: InventoryItem) => void;
}

export const QuickScannerModal: React.FC<QuickScannerModalProps> = ({
  isOpen,
  onClose,
  items,
  onSelectItem,
}) => {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isOpen) {
      setBarcodeInput('');
      setErrorMsg('');
      setIsCameraActive(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleLookup = (valueToSearch: string) => {
    const clean = valueToSearch.trim().toLowerCase();
    if (!clean) return;

    const matched = items.find(
      (it) =>
        it.inventoryNumber.toLowerCase() === clean ||
        it.sellerSku?.toLowerCase() === clean ||
        it.barcodeEan?.toLowerCase() === clean ||
        it.wbBarcode?.toLowerCase() === clean ||
        it.wbMpSticker?.toLowerCase() === clean ||
        it.orderNumber?.toLowerCase() === clean
    );

    if (matched) {
      setErrorMsg('');
      onSelectItem(matched);
      onClose();
    } else {
      setErrorMsg(`Товар по штрихкоду/номеру «${valueToSearch}» не найден в системе`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleLookup(barcodeInput);
    }
  };

  const startCamera = async () => {
    setIsCameraActive(true);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }
    } catch (err) {
      console.warn('Camera access error:', err);
      setErrorMsg('Камера недоступна. Используйте ввод штрихкода вручную или 2D-сканер');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div className="bg-white border-2 border-black w-full max-w-xl overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 bg-black text-white flex items-center justify-between border-b-2 border-black">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-yellow-400 text-black border border-black">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base uppercase tracking-tight">Сканер инвентарного стикера / ШК</h3>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Поддерживает ручной 2D-сканер, камеру и ввод с клавиатуры</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="text-white hover:text-yellow-400 p-1 font-black transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 bg-gray-50">
          {/* Barcode input field with scanner focus */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-black mb-2">
              Отсканируйте или введите номер стикера / артикул
            </label>
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="например: INV-2025-00101 или TH-HUM-03"
                className="w-full pl-11 pr-24 py-3 bg-white border-2 border-black font-mono font-black text-base text-black uppercase transition-all outline-none"
              />
              <Search className="w-5 h-5 text-black absolute left-3.5 pointer-events-none" />
              <button
                type="button"
                onClick={() => handleLookup(barcodeInput)}
                className="absolute right-2 px-3.5 py-1.5 bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 text-black text-xs font-black uppercase tracking-wider border border-black transition-colors cursor-pointer"
              >
                Найти
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border-2 border-red-600 text-red-900 text-xs font-black uppercase flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Camera Scan Simulation or Real stream */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-black">Оптическое сканирование камерой</span>
              {!isCameraActive ? (
                <button
                  type="button"
                  onClick={startCamera}
                  className="text-xs text-black hover:text-neutral-700 font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer underline"
                >
                  <Camera className="w-3.5 h-3.5" /> Включить видеокамеру
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopCamera}
                  className="text-xs text-red-600 hover:text-red-800 font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                >
                  Выключить камеру
                </button>
              )}
            </div>

            {isCameraActive ? (
              <div className="relative w-full h-48 bg-black border-2 border-black overflow-hidden flex items-center justify-center">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <div className="absolute inset-0 border-2 border-yellow-400/80 m-6 pointer-events-none flex items-center justify-center">
                  <div className="w-full h-0.5 bg-red-500 shadow-lg shadow-red-500 animate-bounce" />
                </div>
              </div>
            ) : null}
          </div>

          {/* Quick Click Samples from Current Warehouse Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-black">
                Быстрый выбор товара из базы (для теста)
              </span>
              <span className="text-xs font-mono font-bold text-gray-500">{items.length} ед. на складе</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {items.slice(0, 6).map((item) => {
                const stateConfig = STATE_CONFIG[item.currentState];
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelectItem(item);
                      onClose();
                    }}
                    className="text-left p-2.5 bg-white hover:bg-yellow-100 border-2 border-black transition-all group cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-black text-black">
                        {item.inventoryNumber}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 font-black uppercase border ${stateConfig.badgeColor}`}>
                        {stateConfig.shortName}
                      </span>
                    </div>
                    <div className="text-xs text-black font-bold uppercase truncate mt-1">
                      {item.title || item.sellerSku || 'Товар на приёмке'}
                    </div>
                    <div className="text-[10px] text-gray-600 font-bold uppercase mt-0.5 flex justify-between">
                      <span>{item.sellerName ? item.sellerName.split(' ')[0] : 'Без селлера'}</span>
                      <span className="font-black font-mono text-black">{item.accumulatedCost} ₽</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t-2 border-black flex justify-end">
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-4 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
};
