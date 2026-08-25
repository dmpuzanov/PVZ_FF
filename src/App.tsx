import React, { useState, useEffect } from 'react';
import { InventoryItem, ItemState, Seller, TariffRates, UserSession } from './types';
import { StorageService } from './services/storageService';
import { Navbar, NavTab } from './components/Navbar';
import { OperatorStation } from './components/OperatorStation';
import { KanbanBoard } from './components/KanbanBoard';
import { InventoryRegistry } from './components/InventoryRegistry';
import { BillingAndInvoices } from './components/BillingAndInvoices';
import { ServicesReport } from './components/ServicesReport';
import { TariffSettings } from './components/TariffSettings';
import { QuickScannerModal } from './components/QuickScannerModal';
import { ThermalStickerModal } from './components/BarcodeRenderer';
import { ItemLifecycleModal } from './components/ItemLifecycleModal';
import { AdminEditItemModal } from './components/AdminEditItemModal';
import { BrandLogo, BRAND_CONFIG } from './components/BrandLogo';

export default function App() {
  const [session, setSession] = useState<UserSession>(StorageService.getUserSession());
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [tariffs, setTariffs] = useState<TariffRates>(StorageService.getTariffs());
  const [activeTab, setActiveTab] = useState<NavTab>('operator');

  // Selected item for operator workbench
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // Modals
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [stickerItem, setStickerItem] = useState<InventoryItem | null>(null);
  const [timelineItem, setTimelineItem] = useState<InventoryItem | null>(null);
  const [adminEditItem, setAdminEditItem] = useState<InventoryItem | null>(null);

  const refreshAllData = () => {
    const loadedItems = StorageService.getItems();
    const loadedSellers = StorageService.getSellers();
    const loadedTariffs = StorageService.getTariffs();
    setItems(loadedItems);
    setSellers(loadedSellers);
    setTariffs(loadedTariffs);

    if (selectedItem) {
      const refreshedTarget = loadedItems.find((i) => i.id === selectedItem.id);
      if (refreshedTarget) setSelectedItem(refreshedTarget);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  const handleUpdateSession = (newSession: UserSession) => {
    setSession(newSession);
    StorageService.saveUserSession(newSession);
  };

  // Set initial selected item if not set
  useEffect(() => {
    if (items.length > 0 && !selectedItem) {
      setSelectedItem(items[0]);
    }
  }, [items, selectedItem]);

  const handleResetDemo = () => {
    if (window.confirm('Сбросить базу данных к демонстрационному состоянию со всеми этапами под брендом ИП Пузанова Т.Ю.?')) {
      StorageService.resetToDemo();
      refreshAllData();
      setSelectedItem(null);
    }
  };

  const handleDeleteItem = (itemId: string) => {
    StorageService.deleteItem(itemId);
    refreshAllData();
    if (selectedItem?.id === itemId) setSelectedItem(null);
    if (timelineItem?.id === itemId) setTimelineItem(null);
    if (adminEditItem?.id === itemId) setAdminEditItem(null);
  };

  const handleDeleteSeller = (sellerId: string) => {
    StorageService.deleteSeller(sellerId);
    refreshAllData();
  };

  const handleAdminItemUpdated = (updatedItem: InventoryItem) => {
    refreshAllData();
    if (selectedItem?.id === updatedItem.id) setSelectedItem(updatedItem);
    if (timelineItem?.id === updatedItem.id) setTimelineItem(updatedItem);
  };

  const totalRevenue = items.reduce((acc, curr) => acc + curr.accumulatedCost, 0);

  // Quick summary counts
  const inProcessingCount = items.filter(
    (i) => !['shipped', 'returned_seller'].includes(i.currentState) && !i.currentState.startsWith('return_')
  ).length;

  const overdueStorageCount = items.filter((i) => {
    const calc = StorageService.calculateStorageFee(i);
    return calc.chargeableDays > 0;
  }).length;

  const readyForShipmentCount = items.filter((i) =>
    ['placed', 'assembly'].includes(i.currentState)
  ).length;

  const returnsInSortingCount = items.filter((i) =>
    ['return_intake', 'return_sorting', 'return_repair'].includes(i.currentState)
  ).length;

  return (
    <div className="min-h-screen bg-gray-100 text-black flex flex-col antialiased selection:bg-[#6B0F3B] selection:text-white">
      {/* Top Navigation Bar with Branding & RBAC */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenScanner={() => setIsScannerOpen(true)}
        itemsCount={items.length}
        totalRevenue={totalRevenue}
        session={session}
        sellers={sellers}
        onUpdateSession={handleUpdateSession}
      />

      {/* Metrics Banner Strip with Corporate Colors */}
      <div className="bg-white border-b-2 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-[#18181B] text-white p-3.5 sm:p-4 flex flex-col justify-between border-2 border-black shadow-sm">
              <p className="text-[10px] sm:text-xs font-bold text-neutral-300 uppercase tracking-wider">
                В обработке (Прямой поток)
              </p>
              <div className="flex items-baseline justify-between mt-2">
                <p className="text-2xl sm:text-3xl font-black tracking-tighter text-white font-mono">
                  {inProcessingCount}
                </p>
                <span className="text-[9px] sm:text-[10px] font-black text-[#E5C378] uppercase tracking-widest bg-black px-1.5 py-0.5 border border-[#C5A059]">
                  АКТИВНЫХ
                </span>
              </div>
            </div>

            <div className="bg-[#F8F5F0] p-3.5 sm:p-4 flex flex-col justify-between border-2 border-black shadow-sm">
              <p className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">
                Платное хранение (&gt;5 дней)
              </p>
              <div className="flex items-baseline justify-between mt-2">
                <p className={`text-2xl sm:text-3xl font-black tracking-tighter font-mono ${overdueStorageCount > 0 ? 'text-[#6B0F3B]' : 'text-black'}`}>
                  {overdueStorageCount}
                </p>
                <span className="text-[9px] sm:text-[10px] font-black text-[#6B0F3B] uppercase tracking-widest bg-red-100 px-1.5 py-0.5 border border-red-300">
                  ТАРИФИКАЦИЯ
                </span>
              </div>
            </div>

            <div className="bg-white p-3.5 sm:p-4 flex flex-col justify-between border-2 border-black shadow-sm">
              <p className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">
                Готово к отгрузке (WB)
              </p>
              <div className="flex items-baseline justify-between mt-2">
                <p className="text-2xl sm:text-3xl font-black tracking-tighter text-black font-mono">
                  {readyForShipmentCount}
                </p>
                <span className="text-[9px] sm:text-[10px] font-black text-emerald-800 uppercase tracking-widest bg-emerald-100 px-1.5 py-0.5 border border-emerald-300">
                  ГОТОВЫ
                </span>
              </div>
            </div>

            <div className="bg-[#6B0F3B] text-white p-3.5 sm:p-4 flex flex-col justify-between border-2 border-black shadow-sm">
              <p className="text-[10px] sm:text-xs font-bold text-neutral-200 uppercase tracking-wider">
                Возвраты WB (Кат. А/Б/В)
              </p>
              <div className="flex items-baseline justify-between mt-2">
                <p className="text-2xl sm:text-3xl font-black tracking-tighter text-white font-mono">
                  {returnsInSortingCount}
                </p>
                <span className="text-[9px] sm:text-[10px] font-black text-black uppercase tracking-widest bg-[#DFC386] px-1.5 py-0.5">
                  ОБРАТНЫЙ
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'operator' && (
          <OperatorStation
            items={items}
            sellers={sellers}
            tariffs={tariffs}
            selectedItem={selectedItem}
            onSelectItem={(it) => setSelectedItem(it)}
            onRefreshData={refreshAllData}
            onOpenSticker={(it) => setStickerItem(it)}
          />
        )}

        {activeTab === 'kanban' && (
          <KanbanBoard
            items={items}
            sellers={sellers}
            session={session}
            onSelectItem={(it) => setTimelineItem(it)}
            onOpenOperatorStation={(it) => {
              setSelectedItem(it);
              setActiveTab('operator');
            }}
            onOpenSticker={(it) => setStickerItem(it)}
          />
        )}

        {activeTab === 'registry' && (
          <InventoryRegistry
            items={items}
            sellers={sellers}
            session={session}
            onSelectItem={(it) => setTimelineItem(it)}
            onOpenOperatorStation={(it) => {
              setSelectedItem(it);
              setActiveTab('operator');
            }}
            onOpenSticker={(it) => setStickerItem(it)}
            onOpenAdminEdit={(it) => setAdminEditItem(it)}
            onDeleteItem={handleDeleteItem}
          />
        )}

        {activeTab === 'billing' && (
          <BillingAndInvoices sellers={sellers} tariffs={tariffs} session={session} />
        )}

        {activeTab === 'reports' && (
          <ServicesReport items={items} sellers={sellers} tariffs={tariffs} />
        )}

        {activeTab === 'tariffs' && (
          <TariffSettings
            tariffs={tariffs}
            sellers={sellers}
            session={session}
            onTariffsUpdated={(newT) => setTariffs(newT)}
            onSellersUpdated={refreshAllData}
            onResetDemo={handleResetDemo}
            onDeleteSeller={handleDeleteSeller}
          />
        )}
      </main>

      {/* Corporate Brand Footer */}
      <footer className="bg-[#18181B] text-neutral-400 border-t-2 border-black py-6 mt-12 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BrandLogo variant="minimal" showSubtitle={false} />
            <div>
              <p className="text-white font-black uppercase tracking-wider text-xs">
                {BRAND_CONFIG.legalName} • {BRAND_CONFIG.brandName}
              </p>
              <p className="text-[11px] text-neutral-400 font-mono">
                ИНН: {BRAND_CONFIG.inn} | ОГРНИП: {BRAND_CONFIG.ogrnip} | {BRAND_CONFIG.pvzAddress}
              </p>
            </div>
          </div>

          <div className="text-center md:text-right text-[11px] text-neutral-400 font-bold uppercase tracking-wider">
            <div>Автоматизированный складской и поштучный учёт ПВЗ</div>
            <div className="text-[#DFC386]">Прямой и Обратный потоки • Термопечать ШК • Биллинг</div>
          </div>
        </div>
      </footer>

      {/* Quick Scanner Barcode Modal */}
      <QuickScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        items={items}
        onSelectItem={(item) => {
          setSelectedItem(item);
          setTimelineItem(item);
        }}
      />

      {/* Printable Thermal Barcode Sticker Modal */}
      {stickerItem && (
        <ThermalStickerModal
          isOpen={!!stickerItem}
          onClose={() => setStickerItem(null)}
          inventoryNumber={stickerItem.inventoryNumber}
          title={stickerItem.title}
          sku={stickerItem.sellerSku}
          sellerName={stickerItem.sellerName}
          wbMpSticker={stickerItem.wbMpSticker}
          orderNumber={stickerItem.orderNumber}
        />
      )}

      {/* Item Full Lifecycle Chronology Tracker Modal */}
      {timelineItem && (
        <ItemLifecycleModal
          item={timelineItem}
          sellers={sellers}
          onClose={() => setTimelineItem(null)}
          onAdvanceState={(it, nextState) => {
            StorageService.advanceItemState(it.id, nextState, {});
            refreshAllData();
          }}
          onOpenOperatorStation={(it) => {
            setSelectedItem(it);
            setActiveTab('operator');
          }}
        />
      )}

      {/* Admin Edit & Delete Item Modal */}
      {adminEditItem && (
        <AdminEditItemModal
          isOpen={!!adminEditItem}
          item={adminEditItem}
          sellers={sellers}
          onClose={() => setAdminEditItem(null)}
          onItemUpdated={handleAdminItemUpdated}
          onItemDeleted={handleDeleteItem}
        />
      )}
    </div>
  );
}
