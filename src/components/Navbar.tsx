import React, { useState } from 'react';
import {
  Package,
  Layers,
  FileSpreadsheet,
  Receipt,
  TrendingUp,
  Settings,
  Scan,
  ShieldCheck,
  UserCheck,
  Building2,
  ChevronDown,
  Lock,
} from 'lucide-react';
import { BrandLogo, BRAND_CONFIG } from './BrandLogo';
import { Seller, UserRole, UserSession } from '../types';

export type NavTab = 'operator' | 'kanban' | 'registry' | 'billing' | 'reports' | 'settings';

interface NavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenScanner: () => void;
  itemsCount: number;
  totalRevenue: number;
  session: UserSession;
  sellers: Seller[];
  onUpdateSession: (newSession: UserSession) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenScanner,
  itemsCount,
  totalRevenue,
  session,
  sellers,
  onUpdateSession,
}) => {
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const handleRoleChange = (role: UserRole, sellerId?: string) => {
    let userName = 'Пузанова Т.Ю.';
    if (role === 'operator') {
      userName = 'Оператор ПВЗ';
    } else if (role === 'seller') {
      const activeSeller = sellers.find((s) => s.id === sellerId) || sellers[0];
      userName = activeSeller ? activeSeller.name : 'Селлер';
    }

    onUpdateSession({
      role,
      userName,
      sellerId: role === 'seller' ? sellerId || sellers[0]?.id : undefined,
    });
    setIsRoleDropdownOpen(false);

    // If switching to seller and on operator tab, redirect to registry
    if (role === 'seller' && (activeTab === 'operator' || activeTab === 'settings')) {
      onSelectTab('registry');
    }
  };

  const activeSeller = sellers.find((s) => s.id === session.sellerId) || sellers[0];

  return (
    <header className="bg-[#18181B] text-white border-b-2 border-black sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Header Section with Branding & Role Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between py-4 pb-3 border-b border-neutral-800 gap-4">
          {/* Corporate Brand Identity */}
          <div className="flex items-center justify-between">
            <BrandLogo variant="full" showSubtitle={true} />

            {/* Mobile Scanner Shortcut */}
            <button
              onClick={onOpenScanner}
              className="lg:hidden bg-[#C5A059] text-black font-black p-2 text-xs border border-black hover:bg-[#DFC386] cursor-pointer"
              title="Сканировать ШК"
            >
              <Scan className="w-4 h-4" />
            </button>
          </div>

          {/* Right Header Controls: Role Selector & Key Metrics */}
          <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 sm:gap-4">
            {/* RBAC Role Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                className={`px-3 py-1.5 border-2 text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                  session.role === 'admin'
                    ? 'bg-[#6B0F3B] text-white border-[#C5A059] hover:bg-[#831349]'
                    : session.role === 'operator'
                    ? 'bg-neutral-800 text-[#E5C378] border-[#C5A059] hover:bg-neutral-700'
                    : 'bg-neutral-900 text-sky-400 border-sky-400 hover:bg-neutral-800'
                }`}
              >
                {session.role === 'admin' && <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />}
                {session.role === 'operator' && <UserCheck className="w-3.5 h-3.5 text-[#C5A059]" />}
                {session.role === 'seller' && <Building2 className="w-3.5 h-3.5 text-sky-400" />}

                <div className="text-left">
                  <span className="block text-[9px] text-neutral-300 leading-tight">
                    {session.role === 'admin'
                      ? 'Владелец / Администратор'
                      : session.role === 'operator'
                      ? 'Оператор ПВЗ'
                      : 'Кабинет Селлера'}
                  </span>
                  <span className="block text-[11px] text-white font-mono font-bold leading-tight">
                    {session.role === 'seller' && activeSeller ? activeSeller.name : session.userName}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-70" />
              </button>

              {/* Role Switcher Menu */}
              {isRoleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white text-black border-2 border-black shadow-2xl z-50 p-2 space-y-1">
                  <div className="px-2 py-1 text-[10px] font-black uppercase text-gray-500 border-b border-gray-200">
                    Переключение прав доступа (RBAC):
                  </div>

                  {/* Admin Role */}
                  <button
                    type="button"
                    onClick={() => handleRoleChange('admin')}
                    className={`w-full text-left p-2 border transition-all flex items-start gap-2 cursor-pointer ${
                      session.role === 'admin'
                        ? 'bg-[#6B0F3B] text-white border-black font-black'
                        : 'bg-white hover:bg-neutral-100 text-black border-transparent'
                    }`}
                  >
                    <ShieldCheck className={`w-4 h-4 shrink-0 mt-0.5 ${session.role === 'admin' ? 'text-[#C5A059]' : 'text-[#6B0F3B]'}`} />
                    <div>
                      <div className="text-xs font-black uppercase">Администратор (ИП Пузанова)</div>
                      <div className={`text-[10px] font-medium leading-tight mt-0.5 ${session.role === 'admin' ? 'text-neutral-200' : 'text-gray-600'}`}>
                        Полный доступ: редактирование товаров, удаление записей, управление настройками и селлерами
                      </div>
                    </div>
                  </button>

                  {/* Operator Role */}
                  <button
                    type="button"
                    onClick={() => handleRoleChange('operator')}
                    className={`w-full text-left p-2 border transition-all flex items-start gap-2 cursor-pointer ${
                      session.role === 'operator'
                        ? 'bg-black text-white border-black font-black'
                        : 'bg-white hover:bg-neutral-100 text-black border-transparent'
                    }`}
                  >
                    <UserCheck className={`w-4 h-4 shrink-0 mt-0.5 ${session.role === 'operator' ? 'text-[#C5A059]' : 'text-black'}`} />
                    <div>
                      <div className="text-xs font-black uppercase">Оператор ПВЗ</div>
                      <div className={`text-[10px] font-medium leading-tight mt-0.5 ${session.role === 'operator' ? 'text-neutral-200' : 'text-gray-600'}`}>
                        Текущий функционал: приемка, регистрация, перемещение по этапам, печать стикеров
                      </div>
                    </div>
                  </button>

                  {/* Seller Role */}
                  <div className="pt-1 border-t border-gray-200">
                    <div className="px-2 py-0.5 text-[9px] font-black uppercase text-gray-500">
                      Селлер (Только просмотр своих товаров):
                    </div>
                    {sellers.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleRoleChange('seller', s.id)}
                        className={`w-full text-left p-1.5 border transition-all flex items-center justify-between text-xs cursor-pointer ${
                          session.role === 'seller' && session.sellerId === s.id
                            ? 'bg-sky-700 text-white font-black border-black'
                            : 'bg-white hover:bg-neutral-100 text-black border-transparent font-bold'
                        }`}
                      >
                        <div className="truncate text-[11px] uppercase">
                          <Building2 className="w-3 h-3 inline mr-1 opacity-70" />
                          {s.name}
                        </div>
                        <span className="text-[9px] uppercase px-1 py-0.2 bg-gray-200 text-black font-bold">
                          Read-Only
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="text-left sm:text-right hidden sm:block pl-2 border-l border-neutral-700">
              <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">
                Выручка услуг ПВЗ
              </p>
              <p className="text-lg sm:text-xl font-black tracking-tight text-[#E5C378] font-mono">
                {totalRevenue.toLocaleString('ru-RU')} ₽
              </p>
            </div>

            {/* Barcode Scanner Action */}
            <button
              onClick={onOpenScanner}
              className="bg-white hover:bg-neutral-200 text-black font-black px-3.5 py-2 text-xs uppercase tracking-wider hidden lg:flex items-center gap-1.5 transition-colors cursor-pointer border border-black"
              title="Сканировать или ввести инвентарный стикер"
            >
              <Scan className="w-4 h-4 text-[#6B0F3B]" />
              <span>Сканировать ШК</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav className="flex space-x-1.5 sm:space-x-2 overflow-x-auto py-2.5 scrollbar-none text-xs">
          {/* Operator Station (Disabled/Warning for Seller) */}
          {session.role !== 'seller' ? (
            <button
              onClick={() => onSelectTab('operator')}
              className={`px-3 py-1.5 font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5 text-xs ${
                activeTab === 'operator'
                  ? 'bg-white text-black'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Терминал оператора</span>
            </button>
          ) : (
            <div
              className="px-3 py-1.5 text-neutral-600 font-bold uppercase tracking-wider whitespace-nowrap flex items-center gap-1.5 text-xs cursor-not-allowed opacity-50"
              title="Недоступно в режиме Селлера (только просмотр)"
            >
              <Lock className="w-3 h-3" />
              <span>Терминал оператора</span>
            </div>
          )}

          <button
            onClick={() => onSelectTab('kanban')}
            className={`px-3 py-1.5 font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5 text-xs ${
              activeTab === 'kanban'
                ? 'bg-white text-black'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Канбан-поток</span>
          </button>

          <button
            onClick={() => onSelectTab('registry')}
            className={`px-3 py-1.5 font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5 text-xs ${
              activeTab === 'registry'
                ? 'bg-white text-black'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Реестр товаров</span>
          </button>

          <button
            onClick={() => onSelectTab('billing')}
            className={`px-3 py-1.5 font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5 text-xs ${
              activeTab === 'billing'
                ? 'bg-white text-black'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Счета и Биллинг</span>
          </button>

          <button
            onClick={() => onSelectTab('reports')}
            className={`px-3 py-1.5 font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5 text-xs ${
              activeTab === 'reports'
                ? 'bg-white text-black'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Услуги и Аналитика</span>
          </button>

          {/* Settings (Admin/Operator view, hidden or read-only for seller) */}
          <button
            onClick={() => onSelectTab('settings')}
            className={`px-3 py-1.5 font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5 text-xs ${
              activeTab === 'settings'
                ? 'bg-white text-black'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Настройки</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
