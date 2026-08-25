import React from 'react';
import { InventoryItem, ItemState, Seller, TariffRates } from '../types';
import { STATE_CONFIG, StorageService } from '../services/storageService';
import {
  TrendingUp,
  Package,
  Layers,
  RotateCcw,
  Warehouse,
  Boxes,
  Truck,
  CheckCircle2,
  DollarSign,
  PieChart,
} from 'lucide-react';

interface ServicesReportProps {
  items: InventoryItem[];
  sellers: Seller[];
  tariffs: TariffRates;
}

export const ServicesReport: React.FC<ServicesReportProps> = ({ items, sellers, tariffs }) => {
  // Aggregate all history operations
  const allLogs = items.flatMap((i) => i.history);
  const totalRevenue = allLogs.reduce((sum, log) => sum + log.cost, 0);

  // Group by operation state
  const operationsCountMap: Record<ItemState, { count: number; totalCost: number }> = {
    intake: { count: 0, totalCost: 0 },
    registration: { count: 0, totalCost: 0 },
    storage: { count: 0, totalCost: 0 },
    branding: { count: 0, totalCost: 0 },
    packaging: { count: 0, totalCost: 0 },
    placed: { count: 0, totalCost: 0 },
    assembly: { count: 0, totalCost: 0 },
    shipped: { count: 0, totalCost: 0 },
    return_intake: { count: 0, totalCost: 0 },
    return_sorting: { count: 0, totalCost: 0 },
    return_repair: { count: 0, totalCost: 0 },
    returned_seller: { count: 0, totalCost: 0 },
  };

  allLogs.forEach((log) => {
    if (operationsCountMap[log.state]) {
      operationsCountMap[log.state].count += 1;
      operationsCountMap[log.state].totalCost += log.cost;
    }
  });

  // Returns categorization
  const catA = items.filter((i) => i.returnCategory === 'A').length;
  const catB = items.filter((i) => i.returnCategory === 'B').length;
  const catC = items.filter((i) => i.returnCategory === 'C').length;
  const totalReturns = catA + catB + catC;

  // Shipped count
  const shippedCount = items.filter((i) => i.currentState === 'shipped').length;
  const activeInWarehouse = items.filter((i) => i.currentState !== 'shipped' && i.currentState !== 'returned_seller').length;

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 border-2 border-black">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-black uppercase tracking-wider">
              Выручка за услуги
            </span>
            <div className="p-1.5 bg-yellow-400 text-black border border-black">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-black mt-2 font-mono">{totalRevenue} ₽</div>
          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">Всего {allLogs.length} операций проведено</div>
        </div>

        <div className="bg-white p-5 border-2 border-black">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-black uppercase tracking-wider">
              Товаров в обработке
            </span>
            <div className="p-1.5 bg-black text-white border border-black">
              <Warehouse className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-black mt-2 font-mono">{activeInWarehouse} ед.</div>
          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">Находятся на складе ПВЗ</div>
        </div>

        <div className="bg-white p-5 border-2 border-black">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-black uppercase tracking-wider">
              Отгружено в WB
            </span>
            <div className="p-1.5 bg-yellow-400 text-black border border-black">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-black mt-2 font-mono">{shippedCount} ед.</div>
          <div className="text-[10px] text-black font-black uppercase tracking-wider mt-1">Завершённый прямой поток</div>
        </div>

        <div className="bg-white p-5 border-2 border-black">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-black uppercase tracking-wider">
              Возвратный поток
            </span>
            <div className="p-1.5 bg-red-600 text-white border border-black">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-black mt-2 font-mono">{totalReturns} ед.</div>
          <div className="text-[10px] text-red-700 font-black uppercase tracking-wider mt-1">
            А: {catA} | Б: {catB} | В: {catC}
          </div>
        </div>
      </div>

      {/* Breakdown by Service Table */}
      <div className="bg-white p-6 border-2 border-black space-y-4">
        <h3 className="text-xs font-black text-black uppercase tracking-wider">
          Структура оказанных услуг и доходность по операциям
        </h3>

        <div className="border-2 border-black overflow-hidden">
          <table className="w-full text-xs text-left data-grid">
            <thead>
              <tr>
                <th className="py-3 px-4">Технологический модуль</th>
                <th className="py-3 px-4 text-center">Базовый тариф</th>
                <th className="py-3 px-4 text-center">Выполнено раз</th>
                <th className="py-3 px-4 text-right">Начисленная сумма</th>
                <th className="py-3 px-4 text-right">Доля в выручке</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black">
              {Object.entries(operationsCountMap).map(([stateKey, data]) => {
                const conf = STATE_CONFIG[stateKey as ItemState];
                const share = totalRevenue > 0 ? ((data.totalCost / totalRevenue) * 100).toFixed(1) : '0';

                return (
                  <tr key={stateKey} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 status-badge text-[10px] font-black uppercase tracking-wider ${conf.badgeColor}`}>
                          {conf.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-black">
                      {stateKey === 'storage' ? `${tariffs.storagePerDay} ₽/сут` : `${data.totalCost > 0 && data.count > 0 ? (data.totalCost / data.count).toFixed(0) : '—'} ₽`}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-black text-black">
                      {data.count}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-black">
                      {data.totalCost} ₽
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-black font-bold">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 bg-gray-200 border border-black h-2 overflow-hidden">
                          <div
                            className="bg-black h-full"
                            style={{ width: `${share}%` }}
                          />
                        </div>
                        <span>{share}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Return Flow Analysis Card */}
      <div className="bg-white p-6 border-2 border-black space-y-3">
        <h3 className="text-xs font-black text-black uppercase tracking-wider">
          Анализ возвратного потока и сортировки
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 border-2 border-black">
            <div className="flex items-center justify-between">
              <span className="font-black text-xs uppercase text-black">Категория А (Годные)</span>
              <span className="font-mono font-black text-xl text-black bg-yellow-400 px-2 py-0.5 border border-black">{catA} шт.</span>
            </div>
            <p className="text-[11px] text-gray-700 font-bold uppercase mt-2">
              Возвращены в Размещение без дополнительных затрат, готовы к повторной продаже
            </p>
          </div>

          <div className="p-4 bg-yellow-100/70 border-2 border-black">
            <div className="flex items-center justify-between">
              <span className="font-black text-xs uppercase text-black">Категория Б (Ремонт)</span>
              <span className="font-mono font-black text-xl text-black bg-black text-white px-2 py-0.5">{catB} шт.</span>
            </div>
            <p className="text-[11px] text-black font-bold uppercase mt-2">
              Отремонтированы заменой детали из запаса селлера (+{tariffs.returnRepair} ₽) и переупакованы
            </p>
          </div>

          <div className="p-4 bg-red-50 border-2 border-black">
            <div className="flex items-center justify-between">
              <span className="font-black text-xs uppercase text-red-700">Категория В (Брак селлеру)</span>
              <span className="font-mono font-black text-xl text-white bg-red-600 px-2 py-0.5 border border-black">{catC} шт.</span>
            </div>
            <p className="text-[11px] text-red-900 font-bold uppercase mt-2">
              Неремонтопригодные единицы, оформлен возврат продавцу (выход из системы)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
