import React, { useState } from 'react';
import {
  GarageConfig,
  InventoryItem,
  InventoryStockStatus,
  StockMovement,
  StockMovementType,
  Supplier,
} from '../types/fleet';
import { getInventoryStatus } from '../services/fleetStore';
import {
  Search,
  Plus,
  SlidersHorizontal,
  X,
  AlertCircle,
  CheckCircle2,
  Eye,
  Edit3,
  Power,
  Building2,
  Phone,
  Mail,
  MapPin,
  ArrowLeftRight,
} from 'lucide-react';

interface InventoryViewProps {
  inventory: InventoryItem[];
  suppliers: Supplier[];
  stockMovements: StockMovement[];
  garageConfig: GarageConfig;
  initialFocusItemId?: string | null;
  initialOpenAdjustForItemId?: string | null;
  onClearInitialFocus?: () => void;
  onAddItem: (data: {
    partName: string;
    sku: string;
    category: string;
    description: string;
    unit: string;
    initialQuantity: number;
    minimumStock: number;
    purchaseCost: number;
    sellingPrice: number;
    storageLocation: string;
    supplierName: string;
    supplierContactPerson?: string;
    supplierMobile: string;
    supplierEmail: string;
    supplierAddress: string;
  }) => { success: boolean; error?: string; item?: InventoryItem };
  onUpdateItem: (
    id: string,
    updates: {
      partName?: string;
      sku?: string;
      category?: string;
      description?: string;
      unit?: string;
      minimumStock?: number;
      purchaseCost?: number;
      sellingPrice?: number;
      storageLocation?: string;
      supplierId?: string;
      supplierName?: string;
    }
  ) => { success: boolean; error?: string };
  onToggleActive: (id: string) => void;
  onAdjustStock: (params: {
    inventoryItemId: string;
    transactionType: Extract<StockMovementType, 'stock_in' | 'manual_adjustment' | 'purchase_return'>;
    mode: 'delta' | 'set';
    value: number;
    remarks: string;
  }) => { success: boolean; error?: string };
  onNavigateStockMovements: () => void;
  onNavigateSuppliers: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  inventory,
  suppliers,
  stockMovements,
  garageConfig,
  initialFocusItemId,
  initialOpenAdjustForItemId,
  onClearInitialFocus,
  onAddItem,
  onUpdateItem,
  onToggleActive,
  onAdjustStock,
  onNavigateStockMovements,
  onNavigateSuppliers,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | InventoryStockStatus | 'inactive'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [supplierFilter, setSupplierFilter] = useState<string>('all');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [viewingItem, setViewingItem] = useState<InventoryItem | null>(() =>
    initialFocusItemId ? inventory.find((i) => i.id === initialFocusItemId) || null : null
  );
  const [adjustTargetId, setAdjustTargetId] = useState<string | null>(
    initialOpenAdjustForItemId || null
  );
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState<boolean>(
    Boolean(initialOpenAdjustForItemId)
  );

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Add Item 14-Field State
  const [addForm, setAddForm] = useState({
    partName: '',
    sku: '',
    category: 'Filters',
    description: '',
    unit: 'Pieces',
    initialQuantity: '10',
    minimumStock: '3',
    purchaseCost: '0',
    sellingPrice: '0',
    storageLocation: 'B-05',
    supplierName: suppliers[0]?.name || '',
    supplierMobile: suppliers[0]?.mobile || '',
    supplierEmail: suppliers[0]?.email || '',
    supplierAddress: suppliers[0]?.address || '',
  });

  // Edit Item State
  const [editForm, setEditForm] = useState({
    partName: '',
    sku: '',
    category: '',
    description: '',
    unit: '',
    minimumStock: '0',
    purchaseCost: '0',
    sellingPrice: '0',
    storageLocation: '',
    supplierName: '',
  });

  // Adjust Stock State
  const [adjustTxnType, setAdjustTxnType] = useState<
    Extract<StockMovementType, 'stock_in' | 'manual_adjustment' | 'purchase_return'>
  >('stock_in');
  const [adjustMode, setAdjustMode] = useState<'delta' | 'set'>('delta');
  const [adjustValue, setAdjustValue] = useState<string>('5');
  const [adjustRemarks, setAdjustRemarks] = useState<string>('');
  const [adjustError, setAdjustError] = useState<string | null>(null);

  const notifyToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };

  const uniqueCategories = Array.from(new Set(inventory.map((i) => i.category))).sort();
  const uniqueSuppliers = Array.from(new Set(inventory.map((i) => i.supplierName))).sort();

  const filteredItems = inventory.filter((item) => {
    const stockStatus = getInventoryStatus(item);
    const matchesSearch =
      search.trim() === '' ||
      item.partName.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase()) ||
      item.supplierName.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'all'
        ? item.isActive
        : statusFilter === 'inactive'
        ? !item.isActive
        : item.isActive && stockStatus === statusFilter;

    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesSupplier = supplierFilter === 'all' || item.supplierName === supplierFilter;

    return matchesSearch && matchesStatus && matchesCategory && matchesSupplier;
  });

  const handleOpenAdd = () => {
    setFormError(null);
    const firstSup = suppliers[0];
    setAddForm({
      partName: '',
      sku: '',
      category: 'Filters',
      description: '',
      unit: 'Pieces',
      initialQuantity: '10',
      minimumStock: '4',
      purchaseCost: '250',
      sellingPrice: '390',
      storageLocation: 'A-06',
      supplierName: firstSup?.name || '',
      supplierMobile: firstSup?.mobile || '',
      supplierEmail: firstSup?.email || '',
      supplierAddress: firstSup?.address || '',
    });
    setIsAddModalOpen(true);
  };

  const handleSupplierPresetChange = (supName: string) => {
    const matched = suppliers.find((s) => s.name === supName);
    setAddForm((prev) => ({
      ...prev,
      supplierName: supName,
      supplierMobile: matched?.mobile || prev.supplierMobile,
      supplierEmail: matched?.email || prev.supplierEmail,
      supplierAddress: matched?.address || prev.supplierAddress,
    }));
  };

  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const res = onAddItem({
      partName: addForm.partName,
      sku: addForm.sku,
      category: addForm.category,
      description: addForm.description,
      unit: addForm.unit,
      initialQuantity: parseFloat(addForm.initialQuantity) || 0,
      minimumStock: parseFloat(addForm.minimumStock) || 0,
      purchaseCost: parseFloat(addForm.purchaseCost) || 0,
      sellingPrice: parseFloat(addForm.sellingPrice) || 0,
      storageLocation: addForm.storageLocation,
      supplierName: addForm.supplierName,
      supplierMobile: addForm.supplierMobile,
      supplierEmail: addForm.supplierEmail,
      supplierAddress: addForm.supplierAddress,
    });

    if (!res.success) {
      setFormError(res.error || 'Could not add inventory item.');
      return;
    }

    setIsAddModalOpen(false);
    notifyToast(`Added "${addForm.partName}" (${addForm.sku.toUpperCase()}) to inventory.`);
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setFormError(null);
    setEditingItem(item);
    setEditForm({
      partName: item.partName,
      sku: item.sku,
      category: item.category,
      description: item.description,
      unit: item.unit,
      minimumStock: String(item.minimumStock),
      purchaseCost: String(item.purchaseCost),
      sellingPrice: String(item.sellingPrice),
      storageLocation: item.storageLocation,
      supplierName: item.supplierName,
    });
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setFormError(null);
    const matchedSup = suppliers.find(
      (s) => s.name.toLowerCase() === editForm.supplierName.trim().toLowerCase()
    );
    const res = onUpdateItem(editingItem.id, {
      partName: editForm.partName,
      sku: editForm.sku,
      category: editForm.category,
      description: editForm.description,
      unit: editForm.unit,
      minimumStock: parseFloat(editForm.minimumStock) || 0,
      purchaseCost: parseFloat(editForm.purchaseCost) || 0,
      sellingPrice: parseFloat(editForm.sellingPrice) || 0,
      storageLocation: editForm.storageLocation,
      supplierId: matchedSup?.id || editingItem.supplierId,
      supplierName: editForm.supplierName.trim() || editingItem.supplierName,
    });

    if (!res.success) {
      setFormError(res.error || 'Failed to update item.');
      return;
    }
    setEditingItem(null);
    notifyToast(`Updated "${editForm.partName}".`);
  };

  const handleOpenAdjust = (itemId?: string) => {
    setAdjustError(null);
    setAdjustTargetId(itemId || inventory.find((i) => i.isActive)?.id || inventory[0]?.id || null);
    setAdjustTxnType('stock_in');
    setAdjustMode('delta');
    setAdjustValue('5');
    setAdjustRemarks('');
    setIsAdjustModalOpen(true);
  };

  const handleSubmitAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTargetId) return;
    setAdjustError(null);

    const val = parseFloat(adjustValue);
    if (isNaN(val)) {
      setAdjustError('Enter a valid numeric quantity.');
      return;
    }

    const res = onAdjustStock({
      inventoryItemId: adjustTargetId,
      transactionType: adjustTxnType,
      mode: adjustMode,
      value: val,
      remarks:
        adjustRemarks.trim() ||
        (adjustTxnType === 'stock_in'
          ? 'Supplier purchase stock replenishment'
          : adjustTxnType === 'purchase_return'
          ? 'Returned defective batch to supplier'
          : 'Manual physical stock audit'),
    });

    if (!res.success) {
      setAdjustError(res.error || 'Stock adjustment failed.');
      return;
    }

    setIsAdjustModalOpen(false);
    if (onClearInitialFocus) onClearInitialFocus();
    notifyToast('Stock level updated and logged to Stock Movements ledger.');
  };

  const renderStatusPill = (item: InventoryItem) => {
    if (!item.isActive) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
          Inactive
        </span>
      );
    }
    const status = getInventoryStatus(item);
    if (status === 'In Stock') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          In stock
        </span>
      );
    }
    if (status === 'Low Stock') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          Low stock
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
        Out of stock
      </span>
    );
  };

  const activeCount = inventory.filter((i) => i.isActive).length;

  return (
    <div className="space-y-4">
      {toastMsg && (
        <div className="fixed top-14 right-6 z-50 bg-[#071322] text-white px-4 py-2.5 rounded-lg shadow-xl border border-slate-700 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold">{toastMsg}</span>
        </div>
      )}

      {/* Header matching Inventory reference screenshot */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            PARTS / CATALOGUE · {garageConfig.garageName.toUpperCase()}
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-0.5">
            Inventory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {activeCount} active catalogued parts · searchable stock levels, pricing and rack locations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onNavigateStockMovements}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold px-3 py-2 rounded-md shadow-2xs transition-colors"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-slate-500" />
            <span>Stock Movements</span>
          </button>

          <button
            onClick={() => handleOpenAdjust()}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-bold px-3.5 py-2 rounded-md shadow-2xs transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600" />
            <span>Adjust stock</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold px-4 py-2 rounded-md shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add item</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-2xs flex flex-wrap items-center gap-2.5">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search part name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs py-2 pl-9 pr-3 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          aria-label="Filter by stock status"
          className="text-xs font-medium py-2 px-3 border border-slate-200 rounded-md bg-white text-slate-700 cursor-pointer"
        >
          <option value="all">All stock (Active)</option>
          <option value="In Stock">In Stock</option>
          <option value="Low Stock">Low Stock</option>
          <option value="Out of Stock">Out of Stock</option>
          <option value="inactive">Deactivated / Discontinued</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          aria-label="Filter by category"
          className="text-xs font-medium py-2 px-3 border border-slate-200 rounded-md bg-white text-slate-700 cursor-pointer"
        >
          <option value="all">All categories</option>
          {uniqueCategories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={supplierFilter}
          onChange={(e) => setSupplierFilter(e.target.value)}
          aria-label="Filter by supplier"
          className="text-xs font-medium py-2 px-3 border border-slate-200 rounded-md bg-white text-slate-700 cursor-pointer"
        >
          <option value="all">All suppliers</option>
          {uniqueSuppliers.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Main Inventory Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-3 px-4">Part</th>
              <th className="py-3 px-3">Category</th>
              <th className="py-3 px-3">On Hand</th>
              <th className="py-3 px-3">Location</th>
              <th className="py-3 px-3">Price / Unit</th>
              <th className="py-3 px-3">Supplier</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-slate-400">
                  No inventory items match the selected filters.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr
                  key={item.id}
                  className={`hover:bg-slate-50/70 transition-colors ${
                    !item.isActive ? 'opacity-60 bg-slate-50/50' : ''
                  }`}
                >
                  <td className="py-3 px-4">
                    <button
                      onClick={() => setViewingItem(item)}
                      className="font-bold text-slate-900 hover:text-blue-700 text-left block"
                    >
                      {item.partName}
                    </button>
                    <span className="text-[11px] font-mono text-slate-400">{item.sku}</span>
                  </td>

                  <td className="py-3 px-3">
                    <div className="font-medium text-slate-800">{item.category}</div>
                    <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                      {item.description}
                    </div>
                  </td>

                  <td className="py-3 px-3 font-mono tabular-nums">
                    <div className="font-bold text-slate-900">
                      {item.quantityOnHand}{' '}
                      <span className="font-sans font-normal text-slate-500">{item.unit}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">min {item.minimumStock}</div>
                  </td>

                  <td className="py-3 px-3 font-mono font-semibold text-slate-700">
                    {item.storageLocation}
                  </td>

                  <td className="py-3 px-3 font-mono tabular-nums">
                    <div className="font-bold text-slate-900">
                      {garageConfig.currencySymbol}
                      {item.sellingPrice.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Cost {garageConfig.currencySymbol}
                      {item.purchaseCost.toLocaleString('en-IN')}
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <button
                      onClick={onNavigateSuppliers}
                      className="text-slate-700 hover:text-blue-600 font-medium text-left"
                    >
                      {item.supplierName}
                    </button>
                  </td>

                  <td className="py-3 px-3">{renderStatusPill(item)}</td>

                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-2.5 text-xs font-semibold">
                      <button
                        onClick={() => setViewingItem(item)}
                        className="text-slate-600 hover:text-slate-900"
                        title="View Details"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleOpenAdjust(item.id)}
                        className="text-blue-700 hover:text-blue-900"
                        title="Update Stock"
                      >
                        Stock
                      </button>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="text-emerald-700 hover:text-emerald-900"
                        title="Edit Item"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          onToggleActive(item.id);
                          notifyToast(
                            `${item.partName} ${item.isActive ? 'deactivated' : 'reactivated'}.`
                          );
                        }}
                        className={
                          item.isActive
                            ? 'text-rose-600 hover:text-rose-800'
                            : 'text-emerald-700 hover:text-emerald-900'
                        }
                      >
                        {item.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ADD NEW ITEM MODAL (14 Fields + Unique SKU check) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-[#071322] text-white px-5 py-3.5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide">
                  Add New Spare Part / Consumable
                </h3>
                <p className="text-[11px] text-slate-400">
                  SKU / Part Number must be unique across {garageConfig.garageName}
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAdd} className="p-5 overflow-y-auto space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-800 flex items-center gap-2 font-semibold">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Part Name *</label>
                  <input
                    type="text"
                    required
                    value={addForm.partName}
                    onChange={(e) => setAddForm({ ...addForm, partName: e.target.value })}
                    placeholder="e.g. Hydraulic Seal Kit"
                    className="w-full p-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    SKU / Part Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={addForm.sku}
                    onChange={(e) => setAddForm({ ...addForm, sku: e.target.value.toUpperCase() })}
                    placeholder="e.g. HYD-SEAL-90"
                    className="w-full p-2 border border-slate-300 rounded font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category *</label>
                  <input
                    type="text"
                    required
                    list="inv-categories"
                    value={addForm.category}
                    onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded"
                  />
                  <datalist id="inv-categories">
                    <option value="Oils & Fluids" />
                    <option value="Filters" />
                    <option value="Braking System" />
                    <option value="Clutch & Transmission" />
                    <option value="Electrical" />
                    <option value="Engine & Ignition" />
                    <option value="Lubricants" />
                  </datalist>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Unit of Measurement *
                  </label>
                  <select
                    value={addForm.unit}
                    onChange={(e) => setAddForm({ ...addForm, unit: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded bg-white"
                  >
                    <option value="Pieces">Pieces</option>
                    <option value="Litres">Litres</option>
                    <option value="Sets">Sets</option>
                    <option value="Bottles">Bottles</option>
                    <option value="Kilograms">Kilograms</option>
                    <option value="Boxes">Boxes</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Storage Location *</label>
                  <input
                    type="text"
                    required
                    value={addForm.storageLocation}
                    onChange={(e) => setAddForm({ ...addForm, storageLocation: e.target.value })}
                    placeholder="Rack / Bin e.g. C-04"
                    className="w-full p-2 border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={addForm.description}
                  onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                  placeholder="Part specification & compatibility notes"
                  className="w-full p-2 border border-slate-300 rounded"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Initial Quantity *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    required
                    value={addForm.initialQuantity}
                    onChange={(e) => setAddForm({ ...addForm, initialQuantity: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Min Stock Threshold *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    required
                    value={addForm.minimumStock}
                    onChange={(e) => setAddForm({ ...addForm, minimumStock: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Purchase Cost ({garageConfig.currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={addForm.purchaseCost}
                    onChange={(e) => setAddForm({ ...addForm, purchaseCost: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Selling Price ({garageConfig.currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={addForm.sellingPrice}
                    onChange={(e) => setAddForm({ ...addForm, sellingPrice: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Supplier Information (Select existing or enter new)</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Supplier Name *</label>
                    <input
                      type="text"
                      required
                      list="supplier-names"
                      value={addForm.supplierName}
                      onChange={(e) => handleSupplierPresetChange(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded bg-white"
                    />
                    <datalist id="supplier-names">
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.name} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Supplier Contact Number
                    </label>
                    <input
                      type="text"
                      value={addForm.supplierMobile}
                      onChange={(e) => setAddForm({ ...addForm, supplierMobile: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Supplier Email</label>
                    <input
                      type="email"
                      value={addForm.supplierEmail}
                      onChange={(e) => setAddForm({ ...addForm, supplierEmail: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Supplier Address</label>
                    <input
                      type="text"
                      value={addForm.supplierAddress}
                      onChange={(e) => setAddForm({ ...addForm, supplierAddress: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 border border-slate-300 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-[#166534] hover:bg-[#14532d] rounded"
                >
                  Save Inventory Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ITEM MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden">
            <div className="bg-[#071322] text-white px-5 py-3.5 flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-cyan-400" />
                <span>Edit Part: {editingItem.partName}</span>
              </h3>
              <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEdit} className="p-5 space-y-3 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-800 font-semibold">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Part Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.partName}
                    onChange={(e) => setEditForm({ ...editForm, partName: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">SKU *</label>
                  <input
                    type="text"
                    required
                    value={editForm.sku}
                    onChange={(e) => setEditForm({ ...editForm, sku: e.target.value.toUpperCase() })}
                    className="w-full p-2 border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    required
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unit</label>
                  <input
                    type="text"
                    required
                    value={editForm.unit}
                    onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rack Location</label>
                  <input
                    type="text"
                    required
                    value={editForm.storageLocation}
                    onChange={(e) => setEditForm({ ...editForm, storageLocation: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Minimum Stock</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={editForm.minimumStock}
                    onChange={(e) => setEditForm({ ...editForm, minimumStock: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Purchase Cost ({garageConfig.currencySymbol})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editForm.purchaseCost}
                    onChange={(e) => setEditForm({ ...editForm, purchaseCost: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Selling Price ({garageConfig.currencySymbol})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editForm.sellingPrice}
                    onChange={(e) => setEditForm({ ...editForm, sellingPrice: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Supplier</label>
                <select
                  value={editForm.supplierName}
                  onChange={(e) => setEditForm({ ...editForm, supplierName: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded bg-white"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 border border-slate-300 rounded text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0051a8] hover:bg-[#003d80] text-white font-bold rounded"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADJUST STOCK / PURCHASE / RETURN MODAL */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="bg-[#071322] text-white px-5 py-3.5 flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
                <span>Adjust / Restock Inventory</span>
              </h3>
              <button
                onClick={() => {
                  setIsAdjustModalOpen(false);
                  if (onClearInitialFocus) onClearInitialFocus();
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAdjust} className="p-5 space-y-4 text-xs">
              {adjustError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-800 font-semibold">
                  {adjustError}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Spare Part *</label>
                <select
                  value={adjustTargetId || ''}
                  onChange={(e) => setAdjustTargetId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded bg-white font-medium"
                >
                  {inventory.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.partName} ({i.sku}) — Current: {i.quantityOnHand} {i.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Transaction Type *</label>
                <select
                  value={adjustTxnType}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    setAdjustTxnType(val);
                    if (val !== 'manual_adjustment') setAdjustMode('delta');
                  }}
                  className="w-full p-2 border border-slate-300 rounded bg-white font-semibold"
                >
                  <option value="stock_in">Stock Purchase / Stock In (+)</option>
                  <option value="manual_adjustment">Manual Stock Audit / Adjustment</option>
                  <option value="purchase_return">Purchase Return to Supplier (-)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {adjustTxnType === 'manual_adjustment' && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Entry Mode</label>
                    <select
                      value={adjustMode}
                      onChange={(e) => setAdjustMode(e.target.value as 'delta' | 'set')}
                      className="w-full p-2 border border-slate-300 rounded bg-white"
                    >
                      <option value="delta">Add / Subtract (+/-)</option>
                      <option value="set">Set Exact Count</option>
                    </select>
                  </div>
                )}

                <div className={adjustTxnType === 'manual_adjustment' ? '' : 'col-span-2'}>
                  <label className="block font-bold text-slate-700 mb-1">
                    {adjustMode === 'set' ? 'New Total Quantity *' : 'Quantity *'}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={adjustValue}
                    onChange={(e) => setAdjustValue(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Remarks / PO Reference</label>
                <input
                  type="text"
                  value={adjustRemarks}
                  onChange={(e) => setAdjustRemarks(e.target.value)}
                  placeholder="e.g. Supplier delivery challan #DC-491"
                  className="w-full p-2 border border-slate-300 rounded"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdjustModalOpen(false);
                    if (onClearInitialFocus) onClearInitialFocus();
                  }}
                  className="px-4 py-2 border border-slate-300 rounded text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0051a8] hover:bg-[#003d80] text-white font-bold rounded"
                >
                  Commit Stock Movement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW PART DETAILS MODAL (with Supplier Info & Recent Part History) */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[88vh]">
            <div className="bg-[#071322] text-white px-5 py-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">
                  {viewingItem.sku} · {viewingItem.category}
                </span>
                <h3 className="text-base font-bold mt-0.5">{viewingItem.partName}</h3>
              </div>
              <button
                onClick={() => {
                  setViewingItem(null);
                  if (onClearInitialFocus) onClearInitialFocus();
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">On Hand</span>
                  <span className="font-mono font-bold text-sm text-slate-900">
                    {viewingItem.quantityOnHand} {viewingItem.unit}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Min Threshold</span>
                  <span className="font-mono font-bold text-sm text-slate-900">
                    {viewingItem.minimumStock} {viewingItem.unit}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Selling Price</span>
                  <span className="font-mono font-bold text-sm text-slate-900">
                    {garageConfig.currencySymbol}
                    {viewingItem.sellingPrice}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Rack Location</span>
                  <span className="font-mono font-bold text-sm text-slate-900">
                    {viewingItem.storageLocation}
                  </span>
                </div>
              </div>

              {(() => {
                const sup = suppliers.find((s) => s.id === viewingItem.supplierId);
                return (
                  <div className="p-3.5 bg-white rounded-lg border border-slate-200">
                    <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      <span>Primary Supplier: {sup?.name || viewingItem.supplierName}</span>
                    </h4>
                    {sup && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-mono">{sup.mobile}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{sup.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{sup.address}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div>
                <h4 className="font-bold text-slate-900 mb-2">Recent Stock Movements</h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase">
                      <tr>
                        <th className="py-2 px-2.5">Code</th>
                        <th className="py-2 px-2.5">Type</th>
                        <th className="py-2 px-2.5 text-right">Prev</th>
                        <th className="py-2 px-2.5 text-right">Change</th>
                        <th className="py-2 px-2.5 text-right">Updated</th>
                        <th className="py-2 px-2.5">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {stockMovements
                        .filter((m) => m.inventoryItemId === viewingItem.id)
                        .slice(0, 8)
                        .map((m) => (
                          <tr key={m.id}>
                            <td className="py-2 px-2.5 font-mono font-bold text-slate-700">
                              {m.transactionCode}
                            </td>
                            <td className="py-2 px-2.5 capitalize">
                              {m.transactionType.replace(/_/g, ' ')}
                            </td>
                            <td className="py-2 px-2.5 text-right font-mono">{m.previousQuantity}</td>
                            <td
                              className={`py-2 px-2.5 text-right font-mono font-bold ${
                                m.quantityDelta >= 0 ? 'text-emerald-700' : 'text-rose-700'
                              }`}
                            >
                              {m.quantityDelta > 0 ? `+${m.quantityDelta}` : m.quantityDelta}
                            </td>
                            <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-900">
                              {m.updatedQuantity}
                            </td>
                            <td className="py-2 px-2.5 text-slate-600">{m.remarks}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between">
              <button
                onClick={() => {
                  const id = viewingItem.id;
                  setViewingItem(null);
                  handleOpenAdjust(id);
                }}
                className="px-4 py-1.5 text-xs font-bold bg-[#0051a8] hover:bg-[#003d80] text-white rounded"
              >
                Update Stock
              </button>
              <button
                onClick={() => {
                  setViewingItem(null);
                  if (onClearInitialFocus) onClearInitialFocus();
                }}
                className="px-4 py-1.5 text-xs font-semibold border border-slate-300 rounded bg-white text-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
