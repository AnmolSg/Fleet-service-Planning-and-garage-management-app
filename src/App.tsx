import React, { useState } from 'react';
import { useFleetStore } from './services/fleetStore';
import { FleetHeader } from './components/FleetHeader';
import { FleetSidebar } from './components/FleetSidebar';
import { NotificationsPanel } from './components/NotificationsPanel';
import { WorkflowColumns } from './components/WorkflowColumns';
import { ServicePlanningCalendar } from './components/ServicePlanningCalendar';
import { VehicleProfileSlideOver } from './components/VehicleProfileSlideOver';
import { BookingWizardModal } from './components/BookingWizardModal';
import { VehiclesManagementView } from './components/VehiclesManagementView';
import { ServiceEventsView } from './components/ServiceEventsView';
import { RegisterVehicleView } from './components/RegisterVehicleView';
import { InventoryView } from './components/InventoryView';
import { SuppliersView } from './components/SuppliersView';
import { StockMovementsView } from './components/StockMovementsView';
import { RepairJobConsumptionModal } from './components/RepairJobConsumptionModal';
import { InvoiceModal } from './components/InvoiceModal';
import { InvoicesView } from './components/InvoicesView';
import { GarageSettingsView } from './components/GarageSettingsView';
import { CalendarStatus, Invoice } from './types/fleet';
import {
  Search,
  ChevronDown,
  Wrench,
  Package,
  IndianRupee,
  AlertTriangle,
  XCircle,
  Phone,
  Building2,
  Eye,
  SlidersHorizontal,
  ArrowLeftRight,
  X,
} from 'lucide-react';

export default function App() {
  const store = useFleetStore();
  const {
    garageConfig,
    updateGarageConfig,
    vehicles,
    bookings,
    allBookingsRaw,
    notifications,
    suppliers,
    inventory,
    serviceTemplates,
    invoices,
    stockMovements,
    totalInventoryItems,
    totalInventoryValue,
    lowStockItems,
    outOfStockItems,
    alertInventoryItems,
    activeNavTab,
    setActiveNavTab,
    selectedVehicleId,
    setSelectedVehicleId,
    selectedVehicle,
    isBookingWizardOpen,
    setIsBookingWizardOpen,
    searchQuery,
    setSearchQuery,
    equipmentGroupFilter,
    setEquipmentGroupFilter,
    calendarFilterStatuses,
    setCalendarFilterStatuses,
    calendarViewMode,
    setCalendarViewMode,
    calendarDate,
    setCalendarDate,
    addSupplier,
    updateSupplier,
    addInventoryItem,
    updateInventoryItem,
    toggleInventoryItemActive,
    adjustInventoryStock,
    createServiceTemplate,
    buildEstimateFromTemplate,
    approvePreliminaryBooking,
    rejectPreliminaryBooking,
    startConfirmedBooking,
    completeInProgressBooking,
    updateJobActualMaterialQty,
    addJobAdditionalMaterial,
    updateJobAdditionalMaterial,
    removeJobAdditionalMaterial,
    updateJobChargesAndNotes,
    generateInvoiceForBooking,
    updateInvoicePayment,
    cancelInvoice,
    createBooking,
    updateBooking,
    cancelBooking,
    addUnplannedActivity,
    addUnplannedRepair,
    registerVehicle,
    dismissNotification,
    dismissAllNotifications,
    resetNotifications,
  } = store;

  const [preselectedVehicleForWizard, setPreselectedVehicleForWizard] = useState<string | undefined>(
    undefined
  );
  const [prefillDateForWizard, setPrefillDateForWizard] = useState<string | undefined>(undefined);
  const [prefillStartTimeForWizard, setPrefillStartTimeForWizard] = useState<string | undefined>(
    undefined
  );

  // Repair Job Material Consumption Modal state
  const [materialsModalBookingId, setMaterialsModalBookingId] = useState<string | null>(null);

  // Invoice Preview / Generation / View Modal state
  const [invoiceModalBookingId, setInvoiceModalBookingId] = useState<string | null>(null);
  const [invoiceModalRecord, setInvoiceModalRecord] = useState<Invoice | null>(null);

  // Cross-view deep links from Overview Low-Stock Alerts
  const [inventoryFocusItemId, setInventoryFocusItemId] = useState<string | null>(null);
  const [inventoryAdjustItemId, setInventoryAdjustItemId] = useState<string | null>(null);
  const [contactSupplierId, setContactSupplierId] = useState<string | null>(null);

  const handleOpenWizard = (vehId?: string, prefillDate?: string, prefillStartTime?: string) => {
    setPreselectedVehicleForWizard(vehId);
    setPrefillDateForWizard(prefillDate);
    setPrefillStartTimeForWizard(prefillStartTime);
    setIsBookingWizardOpen(true);
  };

  const handleToggleCalendarStatus = (status: CalendarStatus) => {
    setCalendarFilterStatuses((prev) => ({
      ...prev,
      [status]: !prev[status],
    }));
  };

  const handleOpenInvoiceForBooking = (bookingId: string) => {
    const existing = invoices.find((i) => i.repairJobId === bookingId && i.status === 'active');
    if (existing) {
      setInvoiceModalRecord(existing);
      setInvoiceModalBookingId(null);
    } else {
      setInvoiceModalRecord(null);
      setInvoiceModalBookingId(bookingId);
    }
    setMaterialsModalBookingId(null);
  };

  const unreadAlertsCount = notifications.filter((n) => !n.dismissed).length;
  const activeMaterialsBooking =
    allBookingsRaw.find((b) => b.id === materialsModalBookingId) || null;
  const activeMaterialsVehicle = activeMaterialsBooking
    ? vehicles.find((v) => v.id === activeMaterialsBooking.vehicleId) || null
    : null;

  const activeInvoiceBooking =
    allBookingsRaw.find((b) => b.id === invoiceModalBookingId) || null;
  const activeInvoiceVehicle = activeInvoiceBooking
    ? vehicles.find((v) => v.id === activeInvoiceBooking.vehicleId) || null
    : null;

  const contactSupplier = suppliers.find((s) => s.id === contactSupplierId) || null;

  return (
    <div className="min-h-screen bg-[#f7f9fc] flex flex-col font-sans text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Top Navy Navigation Bar (Access button removed) */}
      <FleetHeader
        activeTab={activeNavTab}
        onSelectTab={setActiveNavTab}
        unreadAlertsCount={unreadAlertsCount}
        garageName={garageConfig.garageName}
      />

      {/* Main Body with Left Rail + Viewport */}
      <div className="flex-1 flex overflow-hidden">
        <FleetSidebar
          activeTab={activeNavTab}
          onSelectTab={setActiveNavTab}
          lowStockCount={alertInventoryItems.length}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 max-w-[1720px] mx-auto w-full">
          {/* TAB 1: OVERVIEW DASHBOARD */}
          {activeNavTab === 'overview' && (
            <div className="space-y-5">
              {/* Notifications & Updates Panel */}
              <NotificationsPanel
                notifications={notifications}
                onDismiss={dismissNotification}
                onDismissAll={dismissAllNotifications}
                onReset={resetNotifications}
              />

              {/* Live Inventory & Garage KPI Strip */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <button
                  onClick={() => setActiveNavTab('inventory')}
                  className="bg-white rounded-md border border-slate-200 p-3.5 text-left hover:border-slate-300 shadow-2xs transition-all"
                >
                  <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                    <span>Total Inventory Items</span>
                    <Package className="w-4 h-4 text-[#0051a8]" />
                  </div>
                  <div className="mt-1.5 flex items-baseline justify-between">
                    <span className="text-xl font-black font-mono tabular-nums text-slate-900">
                      {totalInventoryItems}
                    </span>
                    <span className="text-[11px] text-slate-500">Active SKUs</span>
                  </div>
                </button>

                <button
                  onClick={() => setActiveNavTab('inventory')}
                  className="bg-white rounded-md border border-slate-200 p-3.5 text-left hover:border-slate-300 shadow-2xs transition-all"
                >
                  <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                    <span>Total Inventory Value</span>
                    <IndianRupee className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="mt-1.5 flex items-baseline justify-between">
                    <span className="text-xl font-black font-mono tabular-nums text-slate-900">
                      {garageConfig.currencySymbol}
                      {totalInventoryValue.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[11px] text-slate-500">At cost value</span>
                  </div>
                </button>

                <button
                  onClick={() => setActiveNavTab('inventory')}
                  className="bg-white rounded-md border border-slate-200 p-3.5 text-left hover:border-amber-300 shadow-2xs transition-all"
                >
                  <div className="flex items-center justify-between text-amber-700 text-[11px] font-bold uppercase tracking-wider">
                    <span>Low Stock Items</span>
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="mt-1.5 flex items-baseline justify-between">
                    <span className="text-xl font-black font-mono tabular-nums text-amber-700">
                      {lowStockItems.length}
                    </span>
                    <span className="text-[11px] text-amber-700 font-medium">
                      Below min threshold
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => setActiveNavTab('inventory')}
                  className="bg-white rounded-md border border-slate-200 p-3.5 text-left hover:border-rose-300 shadow-2xs transition-all"
                >
                  <div className="flex items-center justify-between text-rose-700 text-[11px] font-bold uppercase tracking-wider">
                    <span>Out of Stock Items</span>
                    <XCircle className="w-4 h-4 text-rose-600" />
                  </div>
                  <div className="mt-1.5 flex items-baseline justify-between">
                    <span className="text-xl font-black font-mono tabular-nums text-rose-700">
                      {outOfStockItems.length}
                    </span>
                    <span className="text-[11px] text-rose-700 font-medium">
                      Immediate reorder
                    </span>
                  </div>
                </button>
              </div>

              {/* Action Toolbar Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-1">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                    Overview
                  </h1>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="relative">
                    <select
                      value={equipmentGroupFilter}
                      onChange={(e) => setEquipmentGroupFilter(e.target.value)}
                      aria-label="Filter equipment groups"
                      className="appearance-none bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold py-2 pl-3 pr-8 rounded shadow-2xs focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="All equipment groups">All equipment groups</option>
                      <option value="SMA-AI-MODULES">SMA-AI-MODULES</option>
                      <option value="Intermodal Freight">Intermodal Freight</option>
                      <option value="Heavy Haulage">Heavy Haulage</option>
                      <option value="Urban Distribution">Urban Distribution</option>
                      <option value="Ready-Mix Infrastructure">Ready-Mix Infrastructure</option>
                      <option value="Hazardous & Bulk Liquid">Hazardous & Bulk Liquid</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search registration, model, ty..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-white border border-slate-200 hover:border-slate-300 text-slate-800 placeholder-slate-400 text-xs py-2 pl-3 pr-8 rounded shadow-2xs focus:outline-hidden focus:ring-1 focus:ring-blue-500 w-48 sm:w-60"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  <button
                    onClick={() => handleOpenWizard()}
                    className="flex items-center gap-1.5 bg-[#002f6c] hover:bg-[#00224f] text-white text-xs font-bold px-4 py-2 rounded shadow-2xs transition-colors whitespace-nowrap active:scale-98"
                  >
                    <span>Book a service</span>
                    <Wrench className="w-3.5 h-3.5 text-cyan-300" />
                  </button>
                </div>
              </div>

              {/* Four Dynamic Workflow Columns */}
              <WorkflowColumns
                bookings={bookings}
                onSelectVehicle={setSelectedVehicleId}
                onApprovePreliminary={approvePreliminaryBooking}
                onRejectPreliminary={rejectPreliminaryBooking}
                onStartConfirmed={startConfirmedBooking}
                onCompleteInProgress={completeInProgressBooking}
                onOpenBookingWizard={handleOpenWizard}
                onOpenJobMaterials={(bkId) => setMaterialsModalBookingId(bkId)}
                onOpenInvoicePreview={handleOpenInvoiceForBooking}
              />

              {/* Low Stock Alerts + Recent Stock Movements Row */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {/* Low Stock Alerts Widget */}
                <div className="bg-white rounded-md border border-slate-200 overflow-hidden shadow-2xs">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Low Stock &amp; Reorder Alerts ({alertInventoryItems.length})
                      </h2>
                    </div>
                    <button
                      onClick={() => setActiveNavTab('inventory')}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                    >
                      Open Inventory
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/60 border-b border-slate-100 text-[10px] font-bold uppercase text-slate-500">
                        <tr>
                          <th className="py-2 px-3">Item Name</th>
                          <th className="py-2 px-2 text-right">Available</th>
                          <th className="py-2 px-2 text-right">Min</th>
                          <th className="py-2 px-2">Supplier</th>
                          <th className="py-2 px-3 text-right">Quick Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {alertInventoryItems.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-slate-400">
                              All active spare parts are sufficiently stocked.
                            </td>
                          </tr>
                        ) : (
                          alertInventoryItems.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/70">
                              <td className="py-2.5 px-3">
                                <div className="font-bold text-slate-900">{item.partName}</div>
                                <span
                                  className={`inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                    item.quantityOnHand <= 0
                                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                                  }`}
                                >
                                  {item.quantityOnHand <= 0 ? 'Out of Stock' : 'Low Stock'}
                                </span>
                              </td>
                              <td className="py-2.5 px-2 text-right font-mono font-bold text-rose-700">
                                {item.quantityOnHand} {item.unit}
                              </td>
                              <td className="py-2.5 px-2 text-right font-mono text-slate-600">
                                {item.minimumStock}
                              </td>
                              <td className="py-2.5 px-2 text-slate-700">{item.supplierName}</td>
                              <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    onClick={() => {
                                      setInventoryFocusItemId(item.id);
                                      setActiveNavTab('inventory');
                                    }}
                                    className="px-2 py-1 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded"
                                    title="View Item"
                                  >
                                    <Eye className="w-3 h-3 inline mr-0.5" />
                                    Item
                                  </button>
                                  <button
                                    onClick={() => setActiveNavTab('suppliers')}
                                    className="px-2 py-1 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded"
                                    title="View Supplier"
                                  >
                                    <Building2 className="w-3 h-3 inline mr-0.5" />
                                    Supplier
                                  </button>
                                  <button
                                    onClick={() => setContactSupplierId(item.supplierId)}
                                    className="px-2 py-1 text-[10px] font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded"
                                    title="Contact Supplier"
                                  >
                                    <Phone className="w-3 h-3 inline mr-0.5" />
                                    Contact
                                  </button>
                                  <button
                                    onClick={() => {
                                      setInventoryAdjustItemId(item.id);
                                      setActiveNavTab('inventory');
                                    }}
                                    className="px-2 py-1 text-[10px] font-bold bg-[#0051a8] hover:bg-[#003d80] text-white rounded"
                                    title="Update Stock"
                                  >
                                    <SlidersHorizontal className="w-3 h-3 inline mr-0.5" />
                                    Restock
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recent Stock Movements Widget */}
                <div className="bg-white rounded-md border border-slate-200 overflow-hidden shadow-2xs">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ArrowLeftRight className="w-4 h-4 text-[#0051a8]" />
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Recent Stock Movements
                      </h2>
                    </div>
                    <button
                      onClick={() => setActiveNavTab('stock_movements')}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                    >
                      View Full Ledger
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {stockMovements.slice(0, 5).map((m) => (
                      <div key={m.id} className="px-4 py-2.5 flex items-center justify-between text-xs">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-700">
                              {m.transactionCode}
                            </span>
                            <span className="font-semibold text-slate-900 truncate">
                              {m.partName}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {m.transactionType.replace(/_/g, ' ')} · {m.remarks}
                          </p>
                        </div>
                        <div className="text-right font-mono shrink-0 ml-3">
                          <div
                            className={`font-bold ${
                              m.quantityDelta >= 0 ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {m.quantityDelta > 0 ? `+${m.quantityDelta}` : m.quantityDelta} {m.unit}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Bal: {m.updatedQuantity}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SERVICE PLANNING CALENDAR */}
          {activeNavTab === 'calendar' && (
            <ServicePlanningCalendar
              bookings={allBookingsRaw}
              vehicles={vehicles}
              calendarViewMode={calendarViewMode}
              onSetCalendarViewMode={setCalendarViewMode}
              calendarDate={calendarDate}
              onSetCalendarDate={setCalendarDate}
              statusFilters={calendarFilterStatuses}
              onToggleStatusFilter={handleToggleCalendarStatus}
              equipmentGroup={equipmentGroupFilter}
              onSetEquipmentGroup={setEquipmentGroupFilter}
              onSelectVehicle={setSelectedVehicleId}
              onUpdateBooking={updateBooking}
              onCancelBooking={cancelBooking}
              onOpenBookingWizard={handleOpenWizard}
              onOpenJobMaterials={(bkId) => setMaterialsModalBookingId(bkId)}
            />
          )}

          {/* TAB 3: SERVICE EVENTS / WORK ORDERS */}
          {activeNavTab === 'service_events' && (
            <ServiceEventsView
              bookings={allBookingsRaw}
              onSelectVehicle={setSelectedVehicleId}
              onOpenBookingWizard={handleOpenWizard}
              onApprovePreliminary={approvePreliminaryBooking}
              onStartConfirmed={startConfirmedBooking}
              onCompleteInProgress={completeInProgressBooking}
              onOpenJobMaterials={(bkId) => setMaterialsModalBookingId(bkId)}
              onOpenInvoicePreview={handleOpenInvoiceForBooking}
            />
          )}

          {/* TAB 4: INVENTORY MANAGEMENT */}
          {activeNavTab === 'inventory' && (
            <InventoryView
              inventory={inventory}
              suppliers={suppliers}
              stockMovements={stockMovements}
              garageConfig={garageConfig}
              initialFocusItemId={inventoryFocusItemId}
              initialOpenAdjustForItemId={inventoryAdjustItemId}
              onClearInitialFocus={() => {
                setInventoryFocusItemId(null);
                setInventoryAdjustItemId(null);
              }}
              onAddItem={addInventoryItem}
              onUpdateItem={updateInventoryItem}
              onToggleActive={toggleInventoryItemActive}
              onAdjustStock={adjustInventoryStock}
              onNavigateStockMovements={() => setActiveNavTab('stock_movements')}
              onNavigateSuppliers={() => setActiveNavTab('suppliers')}
            />
          )}

          {/* TAB 5: STOCK MOVEMENTS HISTORY */}
          {activeNavTab === 'stock_movements' && (
            <StockMovementsView
              stockMovements={stockMovements}
              garageConfig={garageConfig}
            />
          )}

          {/* TAB 6: SUPPLIERS DIRECTORY */}
          {activeNavTab === 'suppliers' && (
            <SuppliersView
              suppliers={suppliers}
              inventory={inventory}
              stockMovements={stockMovements}
              garageConfig={garageConfig}
              onAddSupplier={addSupplier}
              onUpdateSupplier={updateSupplier}
            />
          )}

          {/* TAB 7: INVOICES HISTORY */}
          {activeNavTab === 'invoices' && (
            <InvoicesView
              invoices={invoices}
              garageConfig={garageConfig}
              onInspectInvoice={(inv) => {
                setInvoiceModalBookingId(null);
                setInvoiceModalRecord(inv);
              }}
            />
          )}

          {/* TAB 8: VEHICLES FLEET REGISTRY */}
          {activeNavTab === 'vehicles' && (
            <VehiclesManagementView
              vehicles={vehicles}
              onSelectVehicle={setSelectedVehicleId}
              onOpenBookingWizard={handleOpenWizard}
              onNavigateAddVehicle={() => setActiveNavTab('add_vehicle')}
            />
          )}

          {/* TAB 9: REGISTER NEW COMMERCIAL VEHICLE */}
          {activeNavTab === 'add_vehicle' && (
            <div className="py-2">
              <RegisterVehicleView
                garageName={garageConfig.garageName}
                onRegister={registerVehicle}
                onCancel={() => setActiveNavTab('vehicles')}
                onSuccessNavigate={(vehId) => {
                  setSelectedVehicleId(vehId);
                  setActiveNavTab('overview');
                }}
              />
            </div>
          )}

          {/* TAB 10: SINGLE-GARAGE SETTINGS & SERVICE TEMPLATES */}
          {activeNavTab === 'garage_settings' && (
            <GarageSettingsView
              garageConfig={garageConfig}
              serviceTemplates={serviceTemplates}
              inventory={inventory}
              onUpdateGarageConfig={updateGarageConfig}
              onCreateTemplate={createServiceTemplate}
            />
          )}
        </main>
      </div>

      {/* Vehicle Profile Slide-Over with Service Material Consumption */}
      <VehicleProfileSlideOver
        vehicle={selectedVehicle}
        onClose={() => setSelectedVehicleId(null)}
        bookings={allBookingsRaw}
        garageConfig={garageConfig}
        onAddUnplannedActivity={addUnplannedActivity}
        onAddUnplannedRepair={addUnplannedRepair}
        onOpenBookingWizard={handleOpenWizard}
        onOpenJobMaterials={(bkId) => setMaterialsModalBookingId(bkId)}
        onOpenInvoicePreview={handleOpenInvoiceForBooking}
      />

      {/* 6-Step Service Booking Wizard Modal */}
      <BookingWizardModal
        isOpen={isBookingWizardOpen}
        onClose={() => setIsBookingWizardOpen(false)}
        vehicles={vehicles}
        garageConfig={garageConfig}
        serviceTemplates={serviceTemplates}
        inventory={inventory}
        suppliers={suppliers}
        buildEstimateFromTemplate={buildEstimateFromTemplate}
        preselectedVehicleId={preselectedVehicleForWizard}
        prefillDate={prefillDateForWizard}
        prefillStartTime={prefillStartTimeForWizard}
        onCreateBooking={(data) => {
          const res = createBooking(data);
          if (res.success) {
            setActiveNavTab('overview');
          }
          return res;
        }}
      />

      {/* Mechanic Service Material Consumption Modal */}
      <RepairJobConsumptionModal
        isOpen={Boolean(materialsModalBookingId)}
        onClose={() => setMaterialsModalBookingId(null)}
        booking={activeMaterialsBooking}
        vehicle={activeMaterialsVehicle}
        inventory={inventory}
        garageConfig={garageConfig}
        onUpdateActualQty={updateJobActualMaterialQty}
        onAddAdditionalMaterial={addJobAdditionalMaterial}
        onUpdateAdditionalMaterial={updateJobAdditionalMaterial}
        onRemoveAdditionalMaterial={removeJobAdditionalMaterial}
        onUpdateChargesAndNotes={updateJobChargesAndNotes}
        onOpenInvoicePreview={handleOpenInvoiceForBooking}
      />

      {/* Invoice Preview / Generation / Print / PDF Modal */}
      <InvoiceModal
        isOpen={Boolean(invoiceModalBookingId || invoiceModalRecord)}
        onClose={() => {
          setInvoiceModalBookingId(null);
          setInvoiceModalRecord(null);
        }}
        existingInvoice={invoiceModalRecord}
        booking={activeInvoiceBooking}
        vehicle={activeInvoiceVehicle}
        garageConfig={garageConfig}
        onConfirmGenerateInvoice={generateInvoiceForBooking}
        onUpdatePayment={updateInvoicePayment}
        onCancelInvoice={cancelInvoice}
      />

      {/* Quick Supplier Contact Modal from Overview Low Stock Alert */}
      {contactSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden text-xs">
            <div className="bg-[#071322] text-white px-5 py-3.5 flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Building2 className="w-4 h-4 text-cyan-400" />
                <span>Supplier Contact Card</span>
              </h3>
              <button
                onClick={() => setContactSupplierId(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-2.5">
              <p className="text-base font-bold text-slate-900">{contactSupplier.name}</p>
              <p className="text-slate-600">
                Contact Person: <span className="font-semibold text-slate-900">{contactSupplier.contactPerson}</span>
              </p>
              <p className="text-slate-600">
                Mobile: <span className="font-mono font-bold text-blue-700">{contactSupplier.mobile}</span>
              </p>
              <p className="text-slate-600">
                Email: <span className="font-semibold text-slate-900">{contactSupplier.email}</span>
              </p>
              <p className="text-slate-600">Address: {contactSupplier.address}</p>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => {
                  setContactSupplierId(null);
                  setActiveNavTab('suppliers');
                }}
                className="px-4 py-1.5 bg-[#0051a8] text-white font-bold rounded"
              >
                Open Suppliers Directory
              </button>
              <button
                onClick={() => setContactSupplierId(null)}
                className="px-4 py-1.5 border border-slate-300 rounded bg-white text-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
