import React from 'react';
import { ActiveNavTab } from '../types/fleet';
import {
  LayoutGrid,
  Calendar,
  CheckSquare,
  Package,
  ArrowLeftRight,
  Building2,
  Receipt,
  Truck,
  Plus,
  Settings,
} from 'lucide-react';

interface FleetSidebarProps {
  activeTab: ActiveNavTab;
  onSelectTab: (tab: ActiveNavTab) => void;
  lowStockCount: number;
}

export const FleetSidebar: React.FC<FleetSidebarProps> = ({
  activeTab,
  onSelectTab,
  lowStockCount,
}) => {
  const navBtnClass = (tab: ActiveNavTab) =>
    `w-10 h-10 rounded-md flex items-center justify-center transition-all ${
      activeTab === tab
        ? 'bg-slate-900 text-white shadow-xs'
        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
    }`;

  return (
    <aside className="no-print w-14 lg:w-16 bg-white border-r border-slate-200 flex flex-col items-center py-3 justify-between shrink-0 select-none z-20">
      <div className="flex flex-col items-center gap-1.5 w-full">
        <button
          onClick={() => onSelectTab('overview')}
          className={navBtnClass('overview')}
          title="Overview Dashboard"
          aria-label="Overview Dashboard"
        >
          <LayoutGrid className="w-5 h-5 stroke-[1.75]" />
        </button>

        <button
          onClick={() => onSelectTab('calendar')}
          className={navBtnClass('calendar')}
          title="Service Planning Calendar"
          aria-label="Service Planning Calendar"
        >
          <Calendar className="w-5 h-5 stroke-[1.75]" />
        </button>

        <button
          onClick={() => onSelectTab('service_events')}
          className={navBtnClass('service_events')}
          title="Service Events & Repair Jobs"
          aria-label="Service Events & Repair Jobs"
        >
          <CheckSquare className="w-5 h-5 stroke-[1.75]" />
        </button>

        <div className="w-8 h-px bg-slate-200 my-1" />

        {/* Inventory with Low-Stock Badge */}
        <div className="relative">
          <button
            onClick={() => onSelectTab('inventory')}
            className={navBtnClass('inventory')}
            title="Spare Parts & Inventory"
            aria-label="Spare Parts & Inventory"
          >
            <Package className="w-5 h-5 stroke-[1.75]" />
          </button>
          {lowStockCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#e02424] text-white text-[10px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center ring-2 ring-white pointer-events-none">
              {lowStockCount}
            </span>
          )}
        </div>

        {/* Stock Movements Ledger */}
        <button
          onClick={() => onSelectTab('stock_movements')}
          className={navBtnClass('stock_movements')}
          title="Stock Movements History"
          aria-label="Stock Movements History"
        >
          <ArrowLeftRight className="w-5 h-5 stroke-[1.75]" />
        </button>

        {/* Centralized Suppliers */}
        <button
          onClick={() => onSelectTab('suppliers')}
          className={navBtnClass('suppliers')}
          title="Suppliers Directory"
          aria-label="Suppliers Directory"
        >
          <Building2 className="w-5 h-5 stroke-[1.75]" />
        </button>

        {/* Invoices */}
        <button
          onClick={() => onSelectTab('invoices')}
          className={navBtnClass('invoices')}
          title="Invoices & Billing History"
          aria-label="Invoices & Billing History"
        >
          <Receipt className="w-5 h-5 stroke-[1.75]" />
        </button>

        <div className="w-8 h-px bg-slate-200 my-1" />

        {/* Vehicles */}
        <button
          onClick={() => onSelectTab('vehicles')}
          className={navBtnClass('vehicles')}
          title="Vehicles Fleet Registry"
          aria-label="Vehicles Fleet Registry"
        >
          <Truck className="w-5 h-5 stroke-[1.75]" />
        </button>

        {/* Add Vehicle */}
        <button
          onClick={() => onSelectTab('add_vehicle')}
          className={`w-10 h-10 rounded-md flex items-center justify-center transition-all ${
            activeTab === 'add_vehicle'
              ? 'bg-[#0051a8] text-white shadow-xs'
              : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'
          }`}
          title="Register New Commercial Vehicle"
          aria-label="Register New Commercial Vehicle"
        >
          <Plus className="w-5 h-5 stroke-[2]" />
        </button>
      </div>

      {/* Bottom Garage Settings Icon */}
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={() => onSelectTab('garage_settings')}
          className={navBtnClass('garage_settings')}
          title="Single-Garage Settings & Service Templates"
          aria-label="Single-Garage Settings & Service Templates"
        >
          <Settings className="w-5 h-5 stroke-[1.75]" />
        </button>
      </div>
    </aside>
  );
};
