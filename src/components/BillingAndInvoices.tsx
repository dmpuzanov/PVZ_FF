import React, { useState } from 'react';
import { InvoiceRecord, Seller, TariffRates, UserSession } from '../types';
import { StorageService } from '../services/storageService';
import { BrandLogo, BRAND_CONFIG } from './BrandLogo';
import {
  FileText,
  Calendar,
  DollarSign,
  Download,
  Printer,
  CheckCircle,
  Plus,
  ArrowRight,
  TrendingUp,
  Receipt,
  Eye,
  Trash2,
  Lock,
  Building2,
  ExternalLink,
} from 'lucide-react';

interface BillingAndInvoicesProps {
  sellers: Seller[];
  tariffs: TariffRates;
  session: UserSession;
}

export const BillingAndInvoices: React.FC<BillingAndInvoicesProps> = ({ sellers, tariffs, session }) => {
  const initialSellerId =
    session.role === 'seller' && session.sellerId
      ? session.sellerId
      : sellers[0]?.id || '';

  const [selectedSellerId, setSelectedSellerId] = useState<string>(initialSellerId);
  const [periodStart, setPeriodStart] = useState<string>('2025-08-01');
  const [periodEnd, setPeriodEnd] = useState<string>('2025-08-31');
  const [invoices, setInvoices] = useState<InvoiceRecord[]>(StorageService.getInvoices());
  const [activeInvoice, setActiveInvoice] = useState<InvoiceRecord | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const effectiveSellerId =
    session.role === 'seller' && session.sellerId ? session.sellerId : selectedSellerId;

  const handleGenerateInvoice = () => {
    if (!effectiveSellerId) return;
    try {
      const newInvoice = StorageService.generateInvoice(effectiveSellerId, periodStart, periodEnd);
      setInvoices(StorageService.getInvoices());
      setActiveInvoice(newInvoice);
    } catch (e: any) {
      alert(e.message || 'Ошибка генерации счёта');
    }
  };

  const handleDeleteInvoice = (invId: string) => {
    if (confirm('Удалить данный счёт-акт из истории?')) {
      StorageService.deleteInvoice(invId);
      setInvoices(StorageService.getInvoices());
      if (activeInvoice?.id === invId) {
        setActiveInvoice(null);
      }
    }
  };

  const selectedSeller = sellers.find((s) => s.id === effectiveSellerId);

  // Filter invoices for seller role
  const visibleInvoices = invoices.filter((inv) => {
    if (session.role === 'seller' && session.sellerId) {
      return inv.sellerId === session.sellerId;
    }
    return true;
  });

  const handlePrint = () => {
    // Robust A4 print handler
    const printDoc = document.getElementById('printable-act-document');
    if (!printDoc) {
      window.print();
      return;
    }

    const printWindow = window.open('', '_blank', 'width=850,height=900');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Акт выполненных услуг - ${activeInvoice?.invoiceNumber || 'ПВЗ'}</title>
            <style>
              @page { size: A4 portrait; margin: 15mm 15mm 15mm 15mm; }
              body { font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #000; background: #fff; margin: 0; padding: 0; font-size: 11pt; line-height: 1.4; }
              .act-container { width: 100%; max-width: 800px; margin: 0 auto; }
              table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 10pt; }
              th, td { border: 1.5px solid #000; padding: 6px 8px; text-align: left; }
              th { background: #f0f0f0; font-weight: bold; text-transform: uppercase; font-size: 9pt; }
              .text-right { text-align: right; }
              .text-center { text-align: center; }
              .font-bold { font-weight: bold; }
              .font-mono { font-family: monospace; }
              .header-title { font-size: 14pt; font-weight: 900; text-transform: uppercase; text-align: center; margin-bottom: 4px; }
              .header-sub { font-size: 10pt; text-align: center; color: #444; margin-bottom: 12px; }
              .meta-block { margin: 12px 0; font-size: 10pt; }
              .signatures { margin-top: 40px; display: flex; justify-content: space-between; }
              .sig-box { width: 45%; }
              .sig-line { margin-top: 35px; border-bottom: 1.5px solid #000; }
            </style>
          </head>
          <body>
            <div class="act-container">
              ${printDoc.innerHTML}
            </div>
            <script>
              window.onload = function() {
                setTimeout(function() { window.print(); }, 250);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      window.print();
    }
  };

  const exportInvoiceCSV = (inv: InvoiceRecord) => {
    const headers = ['Инвентарный номер', 'Артикул', 'Наименование', 'Сумма руб', 'Выполненные операции'];
    const rows = inv.itemDetails.map((it) => [
      `"${it.inventoryNumber}"`,
      `"${it.sku}"`,
      `"${it.title}"`,
      it.totalItemCost,
      `"${it.operations.join('; ')}"`,
    ].join(';'));

    const summaryRows = [
      `"Исполнитель:";"${BRAND_CONFIG.fullName} (ИНН: ${BRAND_CONFIG.inn})"` ,
      `"Счет-Акт:";"${inv.invoiceNumber}"`,
      `"Селлер:";"${inv.sellerName}"`,
      `"Период:";"${inv.periodStart} - ${inv.periodEnd}"`,
      `"ИТОГО К ОПЛАТЕ:";"${inv.totalAmount} ₽"`,
      '',
      headers.join(';'),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [...summaryRows, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${inv.invoiceNumber}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Generator Card */}
      <div className="bg-white p-6 border-2 border-black space-y-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b-2 border-black">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-[#6B0F3B] text-[#C5A059] border border-black">
                <Receipt className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-black text-black text-lg uppercase tracking-tight">
                  Генератор счетов и актов выполненных услуг • {BRAND_CONFIG.legalName}
                </h3>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                  Автоматический расчет всех технологических операций и платного хранения за выбранный период
                </p>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-black font-black uppercase tracking-wider bg-[#DFC386] p-2.5 border-2 border-black">
            Бесплатное хранение: <span className="underline">{tariffs.storageFreeDays} дней</span> | Далее:{' '}
            <span className="underline">{tariffs.storagePerDay} ₽/сут</span>
          </div>
        </div>

        {/* Generator Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 items-end">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-black mb-1.5">Селлер (Клиент)</label>
            {session.role !== 'seller' ? (
              <select
                value={selectedSellerId}
                onChange={(e) => setSelectedSellerId(e.target.value)}
                className="w-full text-xs p-2.5 bg-gray-50 border-2 border-black text-black font-bold uppercase outline-none focus:bg-white"
              >
                {sellers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name.toUpperCase()}
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-full text-xs p-2.5 bg-sky-50 border-2 border-sky-600 text-sky-950 font-bold uppercase flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-sky-700 shrink-0" />
                <span className="truncate">{selectedSeller?.name}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-black mb-1.5">Начало периода</label>
            <input
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              className="w-full text-xs p-2 bg-gray-50 border-2 border-black text-black font-bold uppercase outline-none focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-black mb-1.5">Конец периода</label>
            <input
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              className="w-full text-xs p-2 bg-gray-50 border-2 border-black text-black font-bold uppercase outline-none focus:bg-white"
            />
          </div>

          <div>
            <button
              type="button"
              onClick={handleGenerateInvoice}
              className="w-full py-2.5 px-4 bg-[#6B0F3B] hover:bg-[#851349] text-white text-xs font-black uppercase tracking-wider border-2 border-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <FileText className="w-4 h-4 text-[#C5A059]" />
              <span>Сформировать счёт-акт</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Generated Invoice Preview */}
      {activeInvoice && (
        <div className="bg-white border-2 border-black overflow-hidden shadow-sm">
          {/* Action Header */}
          <div className="p-4 bg-black text-white flex flex-wrap items-center justify-between gap-3 border-b-2 border-black">
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-base text-[#DFC386]">
                {activeInvoice.invoiceNumber}
              </span>
              <span className="text-[10px] font-black uppercase bg-[#6B0F3B] text-white px-2 py-0.5 border border-[#C5A059]">
                Сформирован
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => exportInvoiceCSV(activeInvoice)}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-1.5 border border-neutral-700 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Скачать CSV
              </button>
              <button
                onClick={() => setIsPrintModalOpen(true)}
                className="px-3.5 py-1.5 bg-[#C5A059] hover:bg-[#DFC386] text-black text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer font-sans"
              >
                <Printer className="w-3.5 h-3.5" /> Печать (Акт А4)
              </button>
            </div>
          </div>

          {/* Invoice Body Content */}
          <div className="p-6 space-y-6">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row justify-between border-b-2 border-black pb-4 gap-4">
              <div>
                <div className="text-[10px] text-gray-500 font-black uppercase tracking-wider">Заказчик (Селлер)</div>
                <div className="font-black text-black text-base uppercase mt-0.5">{activeInvoice.sellerName}</div>
                {selectedSeller && (
                  <div className="text-xs text-gray-600 font-bold uppercase space-y-0.5 mt-1">
                    <div>ИНН: {selectedSeller.inn}</div>
                    <div>Контакты: {selectedSeller.phone} ({selectedSeller.contactPerson})</div>
                  </div>
                )}
              </div>

              <div className="sm:text-right">
                <div className="text-[10px] text-gray-500 font-black uppercase tracking-wider">Отчётный период</div>
                <div className="font-black text-black text-sm mt-0.5 font-mono">
                  {new Date(activeInvoice.periodStart).toLocaleDateString('ru-RU')} —{' '}
                  {new Date(activeInvoice.periodEnd).toLocaleDateString('ru-RU')}
                </div>
                <div className="text-xs text-black font-bold uppercase mt-1">
                  Обработано товаров: <b className="font-black">{activeInvoice.itemsCount} шт.</b>
                </div>
              </div>
            </div>

            {/* Breakdown of Operations Table */}
            <div>
              <h4 className="text-xs font-black text-black uppercase tracking-wider mb-2">
                Сводка по выполненным технологическим услугам
              </h4>
              <div className="border-2 border-black overflow-hidden">
                <table className="w-full text-xs text-left data-grid">
                  <thead>
                    <tr>
                      <th className="py-2.5 px-4">Вид услуги / операции</th>
                      <th className="py-2.5 px-4 text-center">Количество операций</th>
                      <th className="py-2.5 px-4 text-right">Сумма к оплате</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-black">
                    {activeInvoice.operationsBreakdown.map((op, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="py-2.5 px-4 font-bold text-black uppercase">{op.name}</td>
                        <td className="py-2.5 px-4 text-center font-mono font-bold text-black">{op.count}</td>
                        <td className="py-2.5 px-4 text-right font-mono font-black text-black">
                          {op.totalCost} ₽
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-[#DFC386] font-black text-black">
                      <td className="py-3 px-4 uppercase tracking-wider">ИТОГО К ОПЛАТЕ:</td>
                      <td className="py-3 px-4 text-center font-mono">
                        {activeInvoice.operationsBreakdown.reduce((acc, curr) => acc + curr.count, 0)} оп.
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-base font-black">
                        {activeInvoice.totalAmount} ₽
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Itemized Goods List */}
            <div>
              <h4 className="text-xs font-black text-black uppercase tracking-wider mb-2">
                Поштучная детализация по единицам товара ({activeInvoice.itemDetails.length} шт.)
              </h4>
              <div className="border-2 border-black overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-xs text-left data-grid">
                  <thead className="sticky top-0 z-10">
                    <tr>
                      <th className="py-2.5 px-4">Инвентарный номер</th>
                      <th className="py-2.5 px-4">Артикул / Наименование</th>
                      <th className="py-2.5 px-4">История операций в периоде</th>
                      <th className="py-2.5 px-4 text-right">Итого</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-black">
                    {activeInvoice.itemDetails.map((it, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="py-2 px-4 font-mono font-black text-black">{it.inventoryNumber}</td>
                        <td className="py-2 px-4">
                          <div className="font-bold text-black uppercase">{it.sku}</div>
                          <div className="text-[11px] text-gray-600 truncate max-w-xs font-medium">{it.title}</div>
                        </td>
                        <td className="py-2 px-4 text-[11px] text-gray-700 font-bold uppercase">
                          {it.operations.join(' → ')}
                        </td>
                        <td className="py-2 px-4 text-right font-mono font-black text-black">
                          {it.totalItemCost} ₽
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History of Issued Invoices */}
      <div className="bg-white p-6 border-2 border-black space-y-3 shadow-sm">
        <h4 className="text-xs font-black text-black uppercase tracking-wider mb-3">
          Ранее выставленные счета и акты ({visibleInvoices.length})
        </h4>

        {visibleInvoices.length === 0 ? (
          <div className="p-8 text-center text-gray-400 font-bold uppercase tracking-wider text-xs border-2 border-dashed border-gray-300">
            Счета ещё не формировались
          </div>
        ) : (
          <div className="space-y-2">
            {visibleInvoices.map((inv) => (
              <div
                key={inv.id}
                className="p-3.5 bg-neutral-50 hover:bg-neutral-100 border-2 border-black flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-xs text-[#6B0F3B]">{inv.invoiceNumber}</span>
                    <span className="text-xs font-black uppercase text-black">{inv.sellerName}</span>
                  </div>
                  <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">
                    Период: {new Date(inv.periodStart).toLocaleDateString('ru-RU')} —{' '}
                    {new Date(inv.periodEnd).toLocaleDateString('ru-RU')} | Товаров: {inv.itemsCount} шт.
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="font-mono font-black text-black text-sm bg-[#DFC386] px-2 py-0.5 border border-black">
                    {inv.totalAmount} ₽
                  </div>
                  <button
                    onClick={() => {
                      setActiveInvoice(inv);
                      window.scrollTo({ top: 120, behavior: 'smooth' });
                    }}
                    className="px-3 py-1.5 bg-black text-white hover:bg-neutral-800 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Открыть
                  </button>
                  {session.role === 'admin' && (
                    <button
                      onClick={() => handleDeleteInvoice(inv.id)}
                      className="p-1.5 text-red-600 hover:bg-red-100 border border-red-400 transition-colors cursor-pointer"
                      title="Удалить счёт (Администратор)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Printable A4 Modal (Act of Services Rendered) */}
      {isPrintModalOpen && activeInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 print:p-0 print:bg-white overflow-y-auto">
          <div className="bg-white border-4 border-black w-full max-w-3xl overflow-hidden print:border-none print:w-full my-auto shadow-2xl">
            <div className="p-4 bg-[#6B0F3B] text-white flex justify-between items-center print:hidden border-b-2 border-black">
              <span className="text-xs font-black uppercase tracking-wider text-white">
                Печатная форма: Акт приемки-сдачи оказанных услуг (А4)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handlePrint}
                  className="px-4 py-1.5 bg-[#C5A059] hover:bg-[#DFC386] text-black text-xs font-black uppercase tracking-wider cursor-pointer border border-black"
                >
                  Печать А4
                </button>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="px-3 py-1.5 bg-black text-white text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-neutral-800"
                >
                  Закрыть
                </button>
              </div>
            </div>

            {/* A4 Printable document body */}
            <div id="printable-act-document" className="p-8 space-y-6 text-black text-xs font-sans print:p-4 bg-white">
              {/* Official Header */}
              <div className="border-b-2 border-black pb-4 text-center">
                <div className="text-[10px] font-black uppercase tracking-widest text-[#6B0F3B] mb-1">
                  {BRAND_CONFIG.brandName} • {BRAND_CONFIG.legalName}
                </div>
                <h2 className="text-lg font-black uppercase tracking-tight">
                  АКТ № {activeInvoice.invoiceNumber.replace('INV-', '')}
                </h2>
                <div className="text-xs text-gray-700 font-bold uppercase mt-1">
                  приемки-сдачи оказанных услуг по складской обработке и фулфилменту ПВЗ
                </div>
                <div className="text-[11px] text-gray-500 font-bold mt-0.5">
                  от {new Date(activeInvoice.createdAt).toLocaleDateString('ru-RU')} г.
                </div>
              </div>

              {/* Legal Requisites */}
              <div className="space-y-1.5 text-xs font-medium">
                <div>
                  <b className="font-black">Исполнитель:</b> {BRAND_CONFIG.fullName}, ИНН {BRAND_CONFIG.inn}, ОГРНИП {BRAND_CONFIG.ogrnip}, адрес: {BRAND_CONFIG.pvzAddress}, тел.: {BRAND_CONFIG.phone}
                </div>
                <div>
                  <b className="font-black">Заказчик:</b> {activeInvoice.sellerName} {selectedSeller ? `(ИНН: ${selectedSeller.inn}, тел: ${selectedSeller.phone})` : ''}
                </div>
                <div>
                  <b className="font-black">Период оказания услуг:</b> с {new Date(activeInvoice.periodStart).toLocaleDateString('ru-RU')} по{' '}
                  {new Date(activeInvoice.periodEnd).toLocaleDateString('ru-RU')}
                </div>
              </div>

              {/* Table of Rendered Services */}
              <table className="w-full text-xs border-2 border-black text-left">
                <thead className="bg-black text-white font-black uppercase">
                  <tr>
                    <th className="p-2 border-r-2 border-black">№</th>
                    <th className="p-2 border-r-2 border-black">Наименование услуги</th>
                    <th className="p-2 border-r-2 border-black text-center">Кол-во</th>
                    <th className="p-2 text-right">Сумма, руб.</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black">
                  {activeInvoice.operationsBreakdown.map((op, i) => (
                    <tr key={i}>
                      <td className="p-2 border-r-2 border-black text-center font-bold">{i + 1}</td>
                      <td className="p-2 border-r-2 border-black font-bold uppercase">{op.name}</td>
                      <td className="p-2 border-r-2 border-black text-center font-mono font-bold">{op.count}</td>
                      <td className="p-2 text-right font-mono font-black">{op.totalCost.toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr className="font-black bg-[#DFC386] border-t-2 border-black">
                    <td colSpan={3} className="p-2 text-right uppercase">
                      ИТОГО К ОПЛАТЕ:
                    </td>
                    <td className="p-2 text-right font-mono text-sm">
                      {activeInvoice.totalAmount.toFixed(2)} ₽
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="text-xs text-gray-800 font-medium">
                Всего оказано услуг на сумму: <b className="font-black">{activeInvoice.totalAmount} рублей 00 копеек</b> (Без НДС).
                Вышеперечисленные услуги выполнены полностью и в срок. Заказчик претензий по объему, качеству и срокам оказания услуг не имеет.
              </div>

              {/* Signatures */}
              <div className="pt-8 grid grid-cols-2 gap-8 text-xs border-t-2 border-black">
                <div>
                  <div className="font-black uppercase">ИСПОЛНИТЕЛЬ:</div>
                  <div className="text-[11px] font-bold mt-1">{BRAND_CONFIG.fullName}</div>
                  <div className="mt-8 border-b-2 border-black w-48" />
                  <div className="text-[10px] text-gray-500 font-bold uppercase mt-1">/ Пузанова Т.Ю. / М.П.</div>
                </div>
                <div>
                  <div className="font-black uppercase">ЗАКАЗЧИК:</div>
                  <div className="text-[11px] font-bold mt-1">{activeInvoice.sellerName}</div>
                  <div className="mt-8 border-b-2 border-black w-48" />
                  <div className="text-[10px] text-gray-500 font-bold uppercase mt-1">/ Представитель Селлера / М.П.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
