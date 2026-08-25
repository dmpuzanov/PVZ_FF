import React, { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';
import { BrandLogo, BRAND_CONFIG } from './BrandLogo';
import { Printer, Download, Copy, Check, ExternalLink, Sliders } from 'lucide-react';

interface BarcodeRendererProps {
  value: string;
  format?: 'CODE128' | 'EAN13' | 'pharmacode';
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  lineColor?: string;
  background?: string;
  className?: string;
}

export const BarcodeRenderer: React.FC<BarcodeRendererProps> = ({
  value,
  format = 'CODE128',
  width = 1.6,
  height = 42,
  displayValue = true,
  fontSize = 12,
  lineColor = '#000000',
  background = 'transparent',
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;

    try {
      JsBarcode(svgRef.current, value, {
        format,
        width,
        height,
        displayValue,
        fontSize,
        textMargin: 3,
        font: 'monospace',
        lineColor,
        background,
        margin: 2,
      });
    } catch (e) {
      console.warn('Barcode rendering fallback to CODE128:', e);
      try {
        JsBarcode(svgRef.current, value, {
          format: 'CODE128',
          width,
          height,
          displayValue,
          fontSize,
          lineColor,
          background,
        });
      } catch {
        // quiet fallback
      }
    }
  }, [value, format, width, height, displayValue, fontSize, lineColor, background]);

  return <svg ref={svgRef} className={`max-w-full inline-block ${className}`} />;
};

interface ThermalStickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventoryNumber: string;
  title?: string;
  sku?: string;
  sellerName?: string;
  wbMpSticker?: string;
  orderNumber?: string;
  weightCategoryLabel?: string;
}

export const ThermalStickerModal: React.FC<ThermalStickerModalProps> = ({
  isOpen,
  onClose,
  inventoryNumber,
  title,
  sku,
  sellerName,
  wbMpSticker,
  orderNumber,
  weightCategoryLabel,
}) => {
  const [copied, setCopied] = useState(false);
  const [stickerFormat, setStickerFormat] = useState<'58x40' | '58x30' | '75x120'>('58x40');
  const stickerRef = useRef<HTMLDivElement | null>(null);

  if (!isOpen) return null;

  const handleCopyBarcode = () => {
    navigator.clipboard.writeText(inventoryNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /**
   * Universal Print Handler:
   * 1. Tries hidden iframe print with zero margins.
   * 2. If iframe printing is blocked, falls back to popup window print.
   */
  const handlePrintDirect = () => {
    const stickerEl = stickerRef.current;
    if (!stickerEl) {
      window.print();
      return;
    }

    const stickerHTML = stickerEl.innerHTML;
    const isWbLarge = stickerFormat === '75x120';
    const isCompact = stickerFormat === '58x30';
    const pageDimensions = isWbLarge ? '75mm 120mm' : isCompact ? '58mm 30mm' : '58mm 40mm';

    const printDocumentContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Термостикер ПВЗ - ${inventoryNumber}</title>
          <style>
            @page {
              size: ${pageDimensions};
              margin: 0;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              background: #ffffff;
              color: #000000;
              display: flex;
              justify-content: center;
              align-items: flex-start;
              padding: 2mm;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .sticker-container {
              width: 100%;
              text-align: center;
              border: 1.5px solid #000000;
              padding: 3mm 2mm;
              background: #ffffff;
            }
            .brand-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-bottom: 1.5px solid #000000;
              padding-bottom: 1.5mm;
              margin-bottom: 2mm;
            }
            .brand-title {
              font-size: 8pt;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: -0.2px;
            }
            .brand-sub {
              font-size: 6.5pt;
              font-weight: 700;
              color: #333333;
            }
            .badge-badge {
              border: 1px solid #000000;
              background: #000000;
              color: #ffffff;
              font-size: 6pt;
              font-weight: 900;
              padding: 1px 4px;
              text-transform: uppercase;
            }
            .sku-block {
              text-align: left;
              border: 1px solid #000000;
              padding: 1.5mm;
              margin-top: 1.5mm;
              background: #fafafa;
            }
            .sku-text {
              font-family: monospace;
              font-size: 7.5pt;
              font-weight: 900;
              text-transform: uppercase;
            }
            .title-text {
              font-size: 6.5pt;
              font-weight: 700;
              line-height: 1.1;
              max-height: 2.3em;
              overflow: hidden;
            }
            .seller-text {
              font-size: 6pt;
              font-weight: 600;
              color: #444444;
            }
            .wb-block {
              margin-top: 2mm;
              padding-top: 1.5mm;
              border-top: 1.5px solid #000000;
            }
            .footer-info {
              display: flex;
              justify-content: space-between;
              font-size: 5.5pt;
              font-family: monospace;
              font-weight: 700;
              margin-top: 1.5mm;
              color: #555555;
            }
            svg {
              display: block;
              margin: 0 auto;
              max-width: 100%;
              height: auto;
            }
          </style>
        </head>
        <body>
          <div class="sticker-container">
            ${stickerHTML}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.focus();
                window.print();
              }, 250);
            };
          </script>
        </body>
      </html>
    `;

    // Attempt 1: Print via hidden iframe
    try {
      let iframe = document.getElementById('sticker-print-frame') as HTMLIFrameElement | null;
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'sticker-print-frame';
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);
      }

      const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(printDocumentContent);
        iframeDoc.close();

        setTimeout(() => {
          try {
            iframe?.contentWindow?.focus();
            iframe?.contentWindow?.print();
          } catch (e) {
            console.warn('IFrame print restricted, opening dedicated print window:', e);
            handleOpenPrintWindow(printDocumentContent);
          }
        }, 400);
        return;
      }
    } catch (e) {
      console.warn('Direct iframe creation failed:', e);
    }

    // Fallback: Open clean popup print window
    handleOpenPrintWindow(printDocumentContent);
  };

  const handleOpenPrintWindow = (content?: string) => {
    const printWindow = window.open('', '_blank', 'width=420,height=520,menubar=no,toolbar=no,location=no,status=no');
    if (printWindow) {
      if (content) {
        printWindow.document.open();
        printWindow.document.write(content);
        printWindow.document.close();
      } else {
        // Build on the fly
        const stickerEl = stickerRef.current;
        if (stickerEl) {
          printWindow.document.write(`
            <html>
              <head><title>Печать стикера ${inventoryNumber}</title></head>
              <body style="margin:0;padding:4mm;display:flex;justify-content:center;">
                <div style="width:58mm;border:1.5px solid #000;padding:2mm;text-align:center;">
                  ${stickerEl.innerHTML}
                </div>
                <script>window.onload = function(){ window.print(); };</script>
              </body>
            </html>
          `);
          printWindow.document.close();
        }
      }
    } else {
      // If popup blocked, fallback to standard window.print
      window.print();
    }
  };

  /**
   * Save Sticker as PNG (for bluetooth / wireless thermal printers & archiving)
   */
  const handleDownloadPNG = () => {
    const stickerEl = stickerRef.current;
    if (!stickerEl) return;

    // Create a high resolution canvas (approx 58mm x 40mm at 300 DPI = ~685 x 472 px)
    const canvas = document.createElement('canvas');
    canvas.width = 685;
    canvas.height = 472;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#000000';
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    // Header
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('priv.ent. puzanova', 25, 45);

    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#555555';
    ctx.fillText('ИП Пузанова Т.Ю. • Владелец ПВЗ', 25, 68);

    // Tag
    ctx.fillStyle = '#000000';
    ctx.fillRect(canvas.width - 180, 26, 155, 30);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px monospace';
    ctx.fillText('ШТУЧНЫЙ УЧЁТ', canvas.width - 165, 47);

    // Divider
    ctx.beginPath();
    ctx.moveTo(20, 80);
    ctx.lineTo(canvas.width - 20, 80);
    ctx.stroke();

    // Barcode SVG to Image
    const svgEl = stickerEl.querySelector('svg');
    if (svgEl) {
      const svgData = new XMLSerializer().serializeToString(svgEl);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const urlUtil = window.URL || (window as any).webkitURL;
      const blobURL = urlUtil.createObjectURL(svgBlob);
      const img = new Image();

      img.onload = () => {
        ctx.drawImage(img, 30, 95, canvas.width - 60, 180);

        // SKU / Title Box
        ctx.fillStyle = '#f8f8f8';
        ctx.fillRect(25, 290, canvas.width - 50, 120);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(25, 290, canvas.width - 50, 120);

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 20px monospace';
        ctx.fillText(`АРТ: ${sku || 'БЕЗ АРТИКУЛА'}`, 40, 322);

        ctx.font = 'bold 18px sans-serif';
        ctx.fillText(title ? (title.length > 38 ? title.slice(0, 38) + '...' : title) : 'ТОВАР ПВЗ', 40, 352);

        ctx.font = '15px sans-serif';
        ctx.fillStyle = '#444444';
        ctx.fillText(`Селлер: ${sellerName || 'ИП Пузанова Т.Ю.'}`, 40, 380);

        // Footer
        ctx.fillStyle = '#666666';
        ctx.font = '13px monospace';
        ctx.fillText(`${new Date().toLocaleDateString('ru-RU')} | PVZ FLOW`, 30, 442);
        ctx.fillText(weightCategoryLabel || 'Прямой поток', canvas.width - 200, 442);

        // Trigger Download
        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `sticker_${inventoryNumber}_58x40.png`;
        link.href = pngUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };
      img.src = blobURL;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 print:p-0 print:bg-white overflow-y-auto">
      <div className="bg-white border-2 border-black w-full max-w-lg overflow-hidden shadow-2xl print:shadow-none print:border-none print:w-full my-auto">
        {/* Modal Header */}
        <div className="p-4 bg-[#6B0F3B] text-white border-b-2 border-black flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 bg-[#C5A059] border border-black" />
            <div>
              <h3 className="font-black text-sm uppercase tracking-tight text-white flex items-center gap-2">
                <span>Печать термоэтикетки ПВЗ</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-[#C5A059] text-black font-black uppercase">
                  {stickerFormat === '58x40' ? '58×40 мм' : stickerFormat === '58x30' ? '58×30 мм' : '75×120 мм'}
                </span>
              </h3>
              <p className="text-[10px] text-[#E5C378] font-bold uppercase tracking-wider">
                Бренд: {BRAND_CONFIG.brandName} • {BRAND_CONFIG.legalName}
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

        {/* Sticker Format Selector */}
        <div className="px-6 pt-4 pb-2 bg-neutral-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2 print:hidden text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black uppercase text-gray-500">Формат ленты:</span>
            <button
              onClick={() => setStickerFormat('58x40')}
              className={`px-2 py-1 text-[10px] font-black uppercase border transition-all cursor-pointer ${
                stickerFormat === '58x40'
                  ? 'bg-[#6B0F3B] text-white border-[#6B0F3B]'
                  : 'bg-white text-black border-black hover:bg-gray-100'
              }`}
            >
              58×40 мм (Стандарт)
            </button>
            <button
              onClick={() => setStickerFormat('58x30')}
              className={`px-2 py-1 text-[10px] font-black uppercase border transition-all cursor-pointer ${
                stickerFormat === '58x30'
                  ? 'bg-[#6B0F3B] text-white border-[#6B0F3B]'
                  : 'bg-white text-black border-black hover:bg-gray-100'
              }`}
            >
              58×30 мм
            </button>
            <button
              onClick={() => setStickerFormat('75x120')}
              className={`px-2 py-1 text-[10px] font-black uppercase border transition-all cursor-pointer ${
                stickerFormat === '75x120'
                  ? 'bg-[#6B0F3B] text-white border-[#6B0F3B]'
                  : 'bg-white text-black border-black hover:bg-gray-100'
              }`}
            >
              75×120 мм (WB MP)
            </button>
          </div>

          <button
            onClick={handleCopyBarcode}
            className="text-[10px] font-black uppercase px-2 py-1 bg-white hover:bg-gray-100 text-black border border-black flex items-center gap-1 cursor-pointer transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Скопировано!' : 'Копировать ШК'}</span>
          </button>
        </div>

        {/* Sticker Preview Container */}
        <div className="p-6 flex flex-col items-center justify-center bg-gray-200 print:bg-white print:p-0">
          <div
            id="printable-sticker"
            ref={stickerRef}
            className={`bg-white border-2 border-black p-3.5 shadow-lg flex flex-col items-center text-center font-sans print:border-none print:shadow-none ${
              stickerFormat === '75x120' ? 'w-[360px]' : stickerFormat === '58x30' ? 'w-[300px]' : 'w-[320px]'
            }`}
          >
            {/* Corporate Brand Header on Sticker */}
            <div className="w-full flex items-center justify-between text-[10px] font-black uppercase text-black border-b-2 border-black pb-1.5 mb-1.5">
              <BrandLogo variant="sticker" showSubtitle={true} />
              <span className="text-white bg-black px-1.5 py-0.5 font-mono font-black text-[9px] uppercase tracking-wider">
                ШТУЧНЫЙ УЧЁТ
              </span>
            </div>

            {/* Inventory Code Barcode */}
            <div className="my-1 w-full flex justify-center">
              <BarcodeRenderer
                value={inventoryNumber}
                height={stickerFormat === '58x30' ? 36 : 46}
                width={1.8}
                fontSize={13}
                lineColor="#000000"
              />
            </div>

            {/* SKU and Description Card */}
            {sku && (
              <div className="w-full text-left text-xs mt-1 bg-gray-50 p-2 border-2 border-black">
                <div className="font-mono font-black text-black uppercase truncate text-xs">
                  АРТ: {sku}
                </div>
                {title && (
                  <div className="text-[11px] font-bold text-gray-800 uppercase line-clamp-1 mt-0.5">
                    {title}
                  </div>
                )}
                {sellerName && (
                  <div className="text-[10px] font-bold text-gray-600 uppercase truncate mt-0.5">
                    Селлер: {sellerName}
                  </div>
                )}
              </div>
            )}

            {/* Wildberries Marketplace Sticker Block (if assembled) */}
            {wbMpSticker && (
              <div className="w-full mt-2 pt-2 border-t-2 border-black">
                <div className="text-[9px] font-black text-black uppercase bg-[#C5A059] p-0.5 border border-black mb-1">
                  СТИКЕР WILDBERRIES MP
                </div>
                <BarcodeRenderer value={wbMpSticker} height={35} width={1.5} fontSize={11} lineColor="#000000" />
                {orderNumber && (
                  <div className="text-[10px] font-mono font-black text-black mt-0.5">
                    Заказ: {orderNumber}
                  </div>
                )}
              </div>
            )}

            {/* Bottom Footer Info */}
            <div className="w-full flex justify-between items-center text-[9px] font-mono font-bold text-gray-500 uppercase mt-2 pt-1 border-t border-gray-300">
              <span>{new Date().toLocaleDateString('ru-RU')}</span>
              <span>{weightCategoryLabel || 'Прямой поток ПВЗ'}</span>
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 bg-white border-t-2 border-black flex flex-wrap items-center justify-between gap-2 print:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPNG}
              className="px-3 py-2 text-xs font-black uppercase tracking-wider text-black bg-gray-100 hover:bg-gray-200 border-2 border-black transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Скачать стикер в формате PNG для термопринтеров"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PNG Стикер</span>
            </button>
            <button
              onClick={() => handleOpenPrintWindow()}
              className="px-3 py-2 text-xs font-black uppercase tracking-wider text-black bg-gray-100 hover:bg-gray-200 border-2 border-black transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Открыть в отдельном окне браузера"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Окно печати</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-2 text-xs font-black uppercase tracking-wider text-black hover:bg-gray-100 border-2 border-black transition-colors cursor-pointer"
            >
              Закрыть
            </button>
            <button
              onClick={handlePrintDirect}
              className="px-5 py-2 text-xs bg-[#6B0F3B] hover:bg-[#851349] text-white border-2 border-black transition-all font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-md active:translate-y-px"
            >
              <Printer className="w-4 h-4 text-[#C5A059]" />
              <span>Печать (Термопринтер)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
