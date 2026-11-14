import { useState, useEffect, useCallback } from 'react';
import {
  ActiveNavTab,
  CalendarStatus,
  FleetNotification,
  GarageConfig,
  InventoryItem,
  InventoryStockStatus,
  Invoice,
  InvoiceLineItem,
  InvoicePaymentMethod,
  InvoicePaymentStatus,
  JobActualMaterialLine,
  JobAdditionalMaterialLine,
  JobEstimatedMaterialLine,
  MaintenanceItem,
  RepairItem,
  ServiceBooking,
  ServiceHistoryRecord,
  ServiceTemplate,
  StockMovement,
  StockMovementType,
  Supplier,
  Vehicle,
  VehicleCategory,
} from '../types/fleet';
import {
  INITIAL_BOOKINGS,
  INITIAL_GARAGE_CONFIG,
  INITIAL_INVENTORY,
  INITIAL_NOTIFICATIONS,
  INITIAL_SERVICE_TEMPLATES,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_SUPPLIERS,
  INITIAL_VEHICLES,
  VEHICLE_CATEGORY_META,
} from '../data/initialFleetData';

const STORAGE_KEY_VEHICLES = 'fleet_garage_vehicles_v2';
const STORAGE_KEY_BOOKINGS = 'fleet_garage_bookings_v2';
const STORAGE_KEY_NOTIFS = 'fleet_garage_notifs_v2';
const STORAGE_KEY_GARAGE = 'fleet_garage_config_v2';
const STORAGE_KEY_INVENTORY = 'fleet_garage_inventory_v2';
const STORAGE_KEY_SUPPLIERS = 'fleet_garage_suppliers_v2';
const STORAGE_KEY_TEMPLATES = 'fleet_garage_templates_v2';
const STORAGE_KEY_INVOICES = 'fleet_garage_invoices_v2';
const STORAGE_KEY_MOVEMENTS = 'fleet_garage_movements_v2';

export function roundQty(val: number): number {
  return Math.round((Number(val) || 0) * 100) / 100;
}

export function roundMoney(val: number): number {
  return Math.round((Number(val) || 0) * 100) / 100;
}

export function getInventoryStatus(item: Pick<InventoryItem, 'quantityOnHand' | 'minimumStock'>): InventoryStockStatus {
  if (item.quantityOnHand <= 0) return 'Out of Stock';
  if (item.quantityOnHand < item.minimumStock) return 'Low Stock';
  return 'In Stock';
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error(`Failed to parse ${key}:`, e);
  }
  return fallback;
}

export function useFleetStore() {
  const [garageConfig, setGarageConfig] = useState<GarageConfig>(() =>
    loadFromStorage(STORAGE_KEY_GARAGE, INITIAL_GARAGE_CONFIG)
  );
  const [vehicles, setVehicles] = useState<Vehicle[]>(() =>
    loadFromStorage(STORAGE_KEY_VEHICLES, INITIAL_VEHICLES)
  );
  const [bookings, setBookings] = useState<ServiceBooking[]>(() =>
    loadFromStorage(STORAGE_KEY_BOOKINGS, INITIAL_BOOKINGS)
  );
  const [notifications, setNotifications] = useState<FleetNotification[]>(() =>
    loadFromStorage(STORAGE_KEY_NOTIFS, INITIAL_NOTIFICATIONS)
  );
  const [suppliers, setSuppliers] = useState<Supplier[]>(() =>
    loadFromStorage(STORAGE_KEY_SUPPLIERS, INITIAL_SUPPLIERS)
  );
  const [inventory, setInventory] = useState<InventoryItem[]>(() =>
    loadFromStorage(STORAGE_KEY_INVENTORY, INITIAL_INVENTORY)
  );
  const [serviceTemplates, setServiceTemplates] = useState<ServiceTemplate[]>(() =>
    loadFromStorage(STORAGE_KEY_TEMPLATES, INITIAL_SERVICE_TEMPLATES)
  );
  const [invoices, setInvoices] = useState<Invoice[]>(() =>
    loadFromStorage(STORAGE_KEY_INVOICES, [])
  );
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() =>
    loadFromStorage(STORAGE_KEY_MOVEMENTS, INITIAL_STOCK_MOVEMENTS)
  );

  const [activeNavTab, setActiveNavTab] = useState<ActiveNavTab>('overview');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [selectedBookingForJobId, setSelectedBookingForJobId] = useState<string | null>(null);
  const [isBookingWizardOpen, setIsBookingWizardOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [equipmentGroupFilter, setEquipmentGroupFilter] = useState('All equipment groups');

  const [calendarFilterStatuses, setCalendarFilterStatuses] = useState<Record<CalendarStatus, boolean>>({
    delayed: true,
    due: true,
    preliminary: true,
    performed: true,
    confirmed: true,
    planned: true,
  });

  const [calendarViewMode, setCalendarViewMode] = useState<'week' | 'month'>('week');
  const [calendarDate, setCalendarDate] = useState<Date>(new Date('2023-09-26T12:00:00'));

  // Persist all stores
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_GARAGE, JSON.stringify(garageConfig));
  }, [garageConfig]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_VEHICLES, JSON.stringify(vehicles));
  }, [vehicles]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(bookings));
  }, [bookings]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(notifications));
  }, [notifications]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SUPPLIERS, JSON.stringify(suppliers));
  }, [suppliers]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(inventory));
  }, [inventory]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(serviceTemplates));
  }, [serviceTemplates]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(invoices));
  }, [invoices]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_MOVEMENTS, JSON.stringify(stockMovements));
  }, [stockMovements]);

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) || null;

  // Low-stock alert helper (deduplicated)
  const pushLowStockNotificationIfNeeded = useCallback(
    (item: InventoryItem) => {
      if (!item.isActive || item.quantityOnHand >= item.minimumStock) return;
      const statusLabel = item.quantityOnHand <= 0 ? 'Out of Stock' : 'Low Stock';
      setNotifications((prev) => {
        const alreadyActive = prev.some(
          (n) => !n.dismissed && n.type === 'low_stock' && n.inventoryItemId === item.id
        );
        if (alreadyActive) return prev;
        const alert: FleetNotification = {
          id: `alert-low-${item.id}-${Date.now()}`,
          type: 'low_stock',
          title: `${statusLabel}: ${item.partName}`,
          message: `${item.partName} (${item.sku}) has ${item.quantityOnHand} ${item.unit} left (Min: ${item.minimumStock} ${item.unit}). Primary supplier: ${item.supplierName}.`,
          workshop: garageConfig.garageName,
          inventoryItemId: item.id,
          timeAgo: 'Just now',
          timestamp: new Date().toISOString(),
          dismissed: false,
        };
        return [alert, ...prev];
      });
    },
    [garageConfig.garageName]
  );

  // Update Single-Garage Configuration
  const updateGarageConfig = (updated: Partial<GarageConfig>) => {
    setGarageConfig((prev) => ({
      ...prev,
      ...updated,
    }));
  };

  // ==========================================================
  // SUPPLIER MANAGEMENT
  // ==========================================================
  const addSupplier = (data: Omit<Supplier, 'id' | 'createdAt' | 'isActive'>): Supplier => {
    const newSup: Supplier = {
      ...data,
      id: `sup-${Date.now()}`,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    setSuppliers((prev) => [newSup, ...prev]);
    return newSup;
  };

  const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    setSuppliers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
    if (updates.name) {
      setInventory((prev) =>
        prev.map((item) =>
          item.supplierId === id ? { ...item, supplierName: updates.name! } : item
        )
      );
    }
  };

  // ==========================================================
  // INVENTORY MANAGEMENT & STOCK MOVEMENTS
  // ==========================================================
  const addInventoryItem = (data: {
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
  }): { success: boolean; error?: string; item?: InventoryItem } => {
    const cleanSku = data.sku.trim().toUpperCase();
    if (!cleanSku) return { success: false, error: 'SKU / Part Number is required.' };
    if (!data.partName.trim()) return { success: false, error: 'Part Name is required.' };

    const duplicate = inventory.some((i) => i.sku.toUpperCase() === cleanSku);
    if (duplicate) {
      return { success: false, error: `SKU "${cleanSku}" already exists in inventory.` };
    }

    const cleanSupName = data.supplierName.trim();
    if (!cleanSupName) return { success: false, error: 'Supplier name is required.' };

    let supplierObj = suppliers.find(
      (s) => s.name.toLowerCase() === cleanSupName.toLowerCase()
    );

    if (!supplierObj) {
      supplierObj = {
        id: `sup-${Date.now()}`,
        name: cleanSupName,
        contactPerson: data.supplierContactPerson?.trim() || cleanSupName,
        mobile: data.supplierMobile.trim() || '-',
        email: data.supplierEmail.trim() || '-',
        address: data.supplierAddress.trim() || '-',
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      setSuppliers((prev) => [supplierObj!, ...prev]);
    } else if (data.supplierMobile || data.supplierEmail || data.supplierAddress) {
      supplierObj = {
        ...supplierObj,
        mobile: data.supplierMobile.trim() || supplierObj.mobile,
        email: data.supplierEmail.trim() || supplierObj.email,
        address: data.supplierAddress.trim() || supplierObj.address,
      };
      setSuppliers((prev) => prev.map((s) => (s.id === supplierObj!.id ? supplierObj! : s)));
    }

    const initQty = Math.max(0, roundQty(data.initialQuantity));
    const minStock = Math.max(0, roundQty(data.minimumStock));
    const newItem: InventoryItem = {
      id: `inv-${Date.now()}`,
      partName: data.partName.trim(),
      sku: cleanSku,
      category: data.category.trim() || 'General',
      description: data.description.trim(),
      unit: data.unit.trim() || 'Pieces',
      quantityOnHand: initQty,
      minimumStock: minStock,
      storageLocation: data.storageLocation.trim() || 'UNASSIGNED',
      purchaseCost: Math.max(0, roundMoney(data.purchaseCost)),
      sellingPrice: Math.max(0, roundMoney(data.sellingPrice)),
      supplierId: supplierObj.id,
      supplierName: supplierObj.name,
      isActive: true,
      updatedAt: new Date().toISOString(),
    };

    setInventory((prev) => [newItem, ...prev]);

    if (initQty > 0) {
      const txn: StockMovement = {
        id: `txn-${Date.now()}`,
        transactionCode: `TXN-${1000 + stockMovements.length + 1}`,
        inventoryItemId: newItem.id,
        partName: newItem.partName,
        sku: newItem.sku,
        unit: newItem.unit,
        transactionType: 'stock_in',
        previousQuantity: 0,
        quantityDelta: initQty,
        updatedQuantity: initQty,
        supplierId: supplierObj.id,
        supplierName: supplierObj.name,
        timestamp: new Date().toISOString(),
        performedBy: 'Garage Manager',
        remarks: 'Initial stock added during part catalogue registration',
      };
      setStockMovements((prev) => [txn, ...prev]);
    }

    pushLowStockNotificationIfNeeded(newItem);
    return { success: true, item: newItem };
  };

  const updateInventoryItem = (
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
  ): { success: boolean; error?: string } => {
    if (updates.sku) {
      const cleanSku = updates.sku.trim().toUpperCase();
      const dup = inventory.some((i) => i.id !== id && i.sku.toUpperCase() === cleanSku);
      if (dup) {
        return { success: false, error: `SKU "${cleanSku}" is already assigned to another part.` };
      }
      updates.sku = cleanSku;
    }

    let updatedTarget: InventoryItem | null = null;
    setInventory((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const next: InventoryItem = {
          ...item,
          ...updates,
          minimumStock:
            updates.minimumStock !== undefined ? Math.max(0, roundQty(updates.minimumStock)) : item.minimumStock,
          purchaseCost:
            updates.purchaseCost !== undefined ? Math.max(0, roundMoney(updates.purchaseCost)) : item.purchaseCost,
          sellingPrice:
            updates.sellingPrice !== undefined ? Math.max(0, roundMoney(updates.sellingPrice)) : item.sellingPrice,
          updatedAt: new Date().toISOString(),
        };
        updatedTarget = next;
        return next;
      })
    );

    if (updatedTarget) {
      pushLowStockNotificationIfNeeded(updatedTarget);
    }

    return { success: true };
  };

  const toggleInventoryItemActive = (id: string) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isActive: !item.isActive, updatedAt: new Date().toISOString() } : item
      )
    );
  };

  const adjustInventoryStock = (params: {
    inventoryItemId: string;
    transactionType: Extract<StockMovementType, 'stock_in' | 'manual_adjustment' | 'purchase_return'>;
    mode: 'delta' | 'set';
    value: number;
    remarks: string;
    performedBy?: string;
  }): { success: boolean; error?: string } => {
    const item = inventory.find((i) => i.id === params.inventoryItemId);
    if (!item) return { success: false, error: 'Inventory item not found.' };

    const val = roundQty(params.value);
    const prevQty = roundQty(item.quantityOnHand);
    let nextQty = prevQty;
    let delta = 0;

    if (params.mode === 'set') {
      if (val < 0) return { success: false, error: 'Stock quantity cannot be negative.' };
      nextQty = val;
      delta = roundQty(nextQty - prevQty);
    } else {
      if (params.transactionType === 'purchase_return') {
        delta = -Math.abs(val);
      } else if (params.transactionType === 'stock_in') {
        delta = Math.abs(val);
      } else {
        delta = val;
      }
      nextQty = roundQty(prevQty + delta);
    }

    if (nextQty < 0) {
      return {
        success: false,
        error: `Insufficient quantity on hand (${prevQty} ${item.unit}). Resulting stock cannot be negative.`,
      };
    }

    if (delta === 0) {
      return { success: false, error: 'Quantity adjustment cannot be zero.' };
    }

    const updatedItem: InventoryItem = {
      ...item,
      quantityOnHand: nextQty,
      updatedAt: new Date().toISOString(),
    };

    const txn: StockMovement = {
      id: `txn-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      transactionCode: `TXN-${1000 + stockMovements.length + 1}`,
      inventoryItemId: item.id,
      partName: item.partName,
      sku: item.sku,
      unit: item.unit,
      transactionType: params.transactionType,
      previousQuantity: prevQty,
      quantityDelta: delta,
      updatedQuantity: nextQty,
      supplierId: params.transactionType === 'stock_in' || params.transactionType === 'purchase_return' ? item.supplierId : undefined,
      supplierName: params.transactionType === 'stock_in' || params.transactionType === 'purchase_return' ? item.supplierName : undefined,
      timestamp: new Date().toISOString(),
      performedBy: params.performedBy || 'Garage Manager',
      remarks: params.remarks.trim() || 'Stock updated',
    };

    setInventory((prev) => prev.map((i) => (i.id === item.id ? updatedItem : i)));
    setStockMovements((prev) => [txn, ...prev]);

    if (nextQty < item.minimumStock) {
      pushLowStockNotificationIfNeeded(updatedItem);
    }

    return { success: true };
  };

  // ==========================================================
  // SERVICE TEMPLATES & PRELIMINARY MATERIAL ESTIMATION
  // ==========================================================
  const createServiceTemplate = (tpl: Omit<ServiceTemplate, 'id' | 'isCustom'>) => {
    const newTpl: ServiceTemplate = {
      ...tpl,
      id: `tpl-${Date.now()}`,
      isCustom: true,
    };
    setServiceTemplates((prev) => [...prev, newTpl]);
    return newTpl;
  };

  const updateServiceTemplate = (id: string, updates: Partial<ServiceTemplate>) => {
    setServiceTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const buildEstimateFromTemplate = (serviceTypeName: string): {
    estimatedMaterials: JobEstimatedMaterialLine[];
    actualMaterials: JobActualMaterialLine[];
    defaultLabour: number;
  } => {
    const tpl = serviceTemplates.find((t) => t.name === serviceTypeName);
    if (!tpl) {
      return { estimatedMaterials: [], actualMaterials: [], defaultLabour: 1200 };
    }

    const estimatedMaterials: JobEstimatedMaterialLine[] = tpl.materials.map((m, idx) => {
      const invItem = inventory.find((i) => i.id === m.inventoryItemId);
      return {
        id: `est-${Date.now()}-${idx}`,
        inventoryItemId: m.inventoryItemId,
        partName: invItem?.partName || m.partName,
        sku: invItem?.sku || m.sku,
        unit: invItem?.unit || m.unit,
        estimatedQuantity: roundQty(m.defaultQuantity),
        unitPrice: invItem?.sellingPrice || 0,
      };
    });

    const actualMaterials: JobActualMaterialLine[] = estimatedMaterials.map((em, idx) => ({
      id: `act-${Date.now()}-${idx}`,
      inventoryItemId: em.inventoryItemId,
      partName: em.partName,
      sku: em.sku,
      unit: em.unit,
      estimatedQuantity: em.estimatedQuantity,
      actualQuantity: em.estimatedQuantity,
      unitPrice: em.unitPrice,
    }));

    return {
      estimatedMaterials,
      actualMaterials,
      defaultLabour: tpl.defaultLabourCharge,
    };
  };

  // ==========================================================
  // BOOKING & REPAIR JOB WORKFLOW
  // ==========================================================
  const approvePreliminaryBooking = (bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              workflowColumn: 'confirmed_bookings',
              calendarStatus: 'confirmed',
              badgeType: 'drop_off',
              badgeDateStr: 'Ready for Drop off',
            }
          : b
      )
    );

    const newAlert: FleetNotification = {
      id: `alert-${Date.now()}`,
      type: 'confirmed',
      title: 'Confirmed booking',
      message: `Preliminary booking approved by Workshop Supervisor. Bay allocation confirmed at ${garageConfig.garageName}.`,
      workshop: garageConfig.garageName,
      timeAgo: 'Just now',
      timestamp: new Date().toISOString(),
      dismissed: false,
    };
    setNotifications((prev) => [newAlert, ...prev]);
  };

  const rejectPreliminaryBooking = (bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              workflowColumn: 'service_events_to_book',
              calendarStatus: 'delayed',
              badgeType: 'delayed',
              badgeDateStr: 'Rejected - Reschedule Required',
            }
          : b
      )
    );
  };

  const startConfirmedBooking = (bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              workflowColumn: 'in_progress',
              calendarStatus: 'planned',
              badgeType: 'pick_up',
              badgeDateStr: 'In Bay - Service Active',
            }
          : b
      )
    );
  };

  // Complete repair job without immediate invoice OR after invoice generation
  const completeInProgressBooking = (
    bookingId: string,
    technicianNotes: string = 'Service completed according to garage inspection guidelines.',
    invoiceNumber?: string,
    invoiceTotalStr?: string
  ) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    const historyItem: ServiceHistoryRecord = {
      id: `hist-${Date.now()}`,
      serviceTitle: booking.serviceActivities,
      workshopLocation: garageConfig.garageName,
      completedDate: new Date().toLocaleDateString('en-GB'),
      performedBy: 'Certified Master Tech',
      odometerAtService: vehicles.find((v) => v.id === booking.vehicleId)?.odometer || 85000,
      costEstimate: invoiceTotalStr || `${garageConfig.currencySymbol} ${booking.labourCharges.toFixed(2)}`,
      invoiceNumber,
      status: 'completed',
      notes: technicianNotes,
    };

    setVehicles((prev) =>
      prev.map((v) =>
        v.id === booking.vehicleId
          ? {
              ...v,
              serviceHistory: [historyItem, ...v.serviceHistory],
              nextServiceDate: '24/12/2026',
            }
          : v
      )
    );

    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              workflowColumn: 'service_events_to_book',
              calendarStatus: 'performed',
              badgeType: 'accepted',
              badgeDateStr: invoiceNumber ? `Invoiced (${invoiceNumber})` : 'Completed - Ready for Invoice',
            }
          : b
      )
    );

    const newAlert: FleetNotification = {
      id: `alert-${Date.now()}`,
      type: 'performed',
      title: 'Performed',
      message: `${garageConfig.garageName} completed ${booking.serviceType || 'service'} for ${booking.vehicleReg}.${invoiceNumber ? ` Invoice ${invoiceNumber} generated.` : ''}`,
      workshop: garageConfig.garageName,
      bookingRef: booking.bookingRef,
      timeAgo: 'Just now',
      timestamp: new Date().toISOString(),
      dismissed: false,
    };
    setNotifications((prev) => [newAlert, ...prev]);
  };

  // Mechanic Material Consumption Mutators (DOES NOT DEDUCT INVENTORY)
  const updateJobEstimatedMaterials = (
    bookingId: string,
    estimatedMaterials: JobEstimatedMaterialLine[]
  ) => {
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id !== bookingId || b.invoiceStatus === 'generated') return b;
        // Sync actualMaterials entries while preserving any existing mechanic-entered actuals
        const nextActuals: JobActualMaterialLine[] = estimatedMaterials.map((em) => {
          const existing = b.actualMaterials.find(
            (a) => a.inventoryItemId === em.inventoryItemId
          );
          return {
            id: existing?.id || `act-${Date.now()}-${em.inventoryItemId}`,
            inventoryItemId: em.inventoryItemId,
            partName: em.partName,
            sku: em.sku,
            unit: em.unit,
            estimatedQuantity: em.estimatedQuantity,
            actualQuantity: existing ? existing.actualQuantity : em.estimatedQuantity,
            unitPrice: em.unitPrice,
          };
        });
        return { ...b, estimatedMaterials, actualMaterials: nextActuals };
      })
    );
  };

  const updateJobActualMaterialQty = (
    bookingId: string,
    actualLineId: string,
    actualQuantity: number
  ) => {
    const qty = Math.max(0, roundQty(actualQuantity));
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id !== bookingId || b.invoiceStatus === 'generated') return b;
        return {
          ...b,
          actualMaterials: b.actualMaterials.map((a) =>
            a.id === actualLineId ? { ...a, actualQuantity: qty } : a
          ),
        };
      })
    );
  };

  const addJobAdditionalMaterial = (
    bookingId: string,
    payload: {
      inventoryItemId: string;
      quantity: number;
      unitPrice?: number;
      reason: string;
    }
  ): { success: boolean; error?: string } => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return { success: false, error: 'Repair job not found.' };
    if (booking.invoiceStatus === 'generated') {
      return { success: false, error: 'Cannot modify materials after invoice is generated.' };
    }

    const invItem = inventory.find((i) => i.id === payload.inventoryItemId);
    if (!invItem) return { success: false, error: 'Selected spare part not found in inventory.' };

    const qty = roundQty(payload.quantity);
    if (qty <= 0) return { success: false, error: 'Quantity must be greater than zero.' };

    const price = payload.unitPrice !== undefined ? roundMoney(payload.unitPrice) : invItem.sellingPrice;

    const newLine: JobAdditionalMaterialLine = {
      id: `add-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      inventoryItemId: invItem.id,
      partName: invItem.partName,
      sku: invItem.sku,
      unit: invItem.unit,
      quantity: qty,
      unitPrice: price,
      reason: payload.reason.trim() || 'Additional repair requirement found during inspection',
    };

    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? { ...b, additionalMaterials: [...b.additionalMaterials, newLine] }
          : b
      )
    );

    return { success: true };
  };

  const updateJobAdditionalMaterial = (
    bookingId: string,
    lineId: string,
    updates: Partial<Pick<JobAdditionalMaterialLine, 'quantity' | 'unitPrice' | 'reason'>>
  ) => {
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id !== bookingId || b.invoiceStatus === 'generated') return b;
        return {
          ...b,
          additionalMaterials: b.additionalMaterials.map((m) =>
            m.id === lineId
              ? {
                  ...m,
                  quantity: updates.quantity !== undefined ? Math.max(0, roundQty(updates.quantity)) : m.quantity,
                  unitPrice: updates.unitPrice !== undefined ? Math.max(0, roundMoney(updates.unitPrice)) : m.unitPrice,
                  reason: updates.reason !== undefined ? updates.reason : m.reason,
                }
              : m
          ),
        };
      })
    );
  };

  const removeJobAdditionalMaterial = (bookingId: string, lineId: string) => {
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id !== bookingId || b.invoiceStatus === 'generated') return b;
        return {
          ...b,
          additionalMaterials: b.additionalMaterials.filter((m) => m.id !== lineId),
        };
      })
    );
  };

  const updateJobChargesAndNotes = (
    bookingId: string,
    updates: {
      labourCharges?: number;
      additionalServiceCharges?: number;
      discountAmount?: number;
      workPerformedDescription?: string;
      customerName?: string;
      customerPhone?: string;
      customerEmail?: string;
    }
  ) => {
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id !== bookingId || b.invoiceStatus === 'generated') return b;
        return {
          ...b,
          ...updates,
          labourCharges:
            updates.labourCharges !== undefined ? Math.max(0, roundMoney(updates.labourCharges)) : b.labourCharges,
          additionalServiceCharges:
            updates.additionalServiceCharges !== undefined
              ? Math.max(0, roundMoney(updates.additionalServiceCharges))
              : b.additionalServiceCharges,
          discountAmount:
            updates.discountAmount !== undefined ? Math.max(0, roundMoney(updates.discountAmount)) : b.discountAmount,
        };
      })
    );
  };

  // ==========================================================
  // INVOICE GENERATION (ATOMIC STOCK DEDUCTION + IDEMPOTENCY)
  // ==========================================================
  const generateInvoiceForBooking = (params: {
    bookingId: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    odometerReading: number;
    workPerformed: string;
    labourCharges: number;
    additionalServiceCharges: number;
    discountAmount: number;
    paymentStatus: InvoicePaymentStatus;
    amountPaid: number;
    paymentMethod: InvoicePaymentMethod;
  }): { success: boolean; error?: string; invoice?: Invoice } => {
    const booking = bookings.find((b) => b.id === params.bookingId);
    if (!booking) {
      return { success: false, error: 'Repair job not found.' };
    }

    // 1. Idempotency Guard: Prevent double invoicing / double deduction
    const existingActiveInvoice = invoices.find(
      (inv) => inv.repairJobId === booking.id && inv.status === 'active'
    );
    if (existingActiveInvoice || booking.invoiceStatus === 'generated') {
      return {
        success: false,
        error: `Invoice ${existingActiveInvoice?.invoiceNumber || booking.invoiceNumber} has already been generated for this repair job. Duplicate stock deduction prevented.`,
      };
    }

    // 2. Gather all line items (Actual Estimated + Additional)
    const lineItems: InvoiceLineItem[] = [];
    for (const act of booking.actualMaterials || []) {
      const qty = roundQty(act.actualQuantity);
      if (qty <= 0) continue;
      const unitPrice = roundMoney(act.unitPrice);
      lineItems.push({
        id: `ili-est-${act.id}`,
        inventoryItemId: act.inventoryItemId,
        partName: act.partName,
        sku: act.sku,
        unit: act.unit,
        materialSource: 'estimated_actual',
        estimatedQuantity: act.estimatedQuantity,
        quantity: qty,
        unitPrice,
        lineTotal: roundMoney(qty * unitPrice),
      });
    }

    for (const add of booking.additionalMaterials || []) {
      const qty = roundQty(add.quantity);
      if (qty <= 0) continue;
      const unitPrice = roundMoney(add.unitPrice);
      lineItems.push({
        id: `ili-add-${add.id}`,
        inventoryItemId: add.inventoryItemId,
        partName: add.partName,
        sku: add.sku,
        unit: add.unit,
        materialSource: 'additional',
        quantity: qty,
        unitPrice,
        lineTotal: roundMoney(qty * unitPrice),
        reason: add.reason,
      });
    }

    // 3. Aggregate quantities per inventoryItemId for atomic validation
    const totalConsumedByItem = new Map<string, number>();
    for (const li of lineItems) {
      const curr = totalConsumedByItem.get(li.inventoryItemId) || 0;
      totalConsumedByItem.set(li.inventoryItemId, roundQty(curr + li.quantity));
    }

    for (const [invId, reqQty] of totalConsumedByItem.entries()) {
      const invItem = inventory.find((i) => i.id === invId);
      if (!invItem) {
        return {
          success: false,
          error: `Inventory record missing for item ID "${invId}". Transaction rolled back.`,
        };
      }
      if (roundQty(invItem.quantityOnHand) < reqQty) {
        return {
          success: false,
          error: `Insufficient stock for "${invItem.partName}" (${invItem.sku}). Required: ${reqQty} ${invItem.unit}, Available: ${invItem.quantityOnHand} ${invItem.unit}. Transaction rolled back — please restock or adjust actual quantity.`,
        };
      }
    }

    // 4. Financial Calculations (Integer/Decimal safe)
    const materialsSubtotal = roundMoney(
      lineItems.reduce((sum, li) => sum + li.lineTotal, 0)
    );
    const labour = Math.max(0, roundMoney(params.labourCharges));
    const additionalSvc = Math.max(0, roundMoney(params.additionalServiceCharges));
    const discount = Math.max(0, roundMoney(params.discountAmount));
    const preTaxTotal = Math.max(
      0,
      roundMoney(materialsSubtotal + labour + additionalSvc - discount)
    );
    const taxAmount = garageConfig.taxEnabled
      ? roundMoney((preTaxTotal * garageConfig.taxRatePercent) / 100)
      : 0;
    const finalPayableAmount = roundMoney(preTaxTotal + taxAmount);

    const invoiceSeq = garageConfig.nextInvoiceSequence;
    const invoiceNumber = `${garageConfig.invoicePrefix}-${invoiceSeq}`;
    const invoiceId = `inv-doc-${Date.now()}`;
    const nowIso = new Date().toISOString();

    let amountPaid = 0;
    if (params.paymentStatus === 'Paid') amountPaid = finalPayableAmount;
    else if (params.paymentStatus === 'Partially Paid') {
      amountPaid = Math.min(finalPayableAmount, Math.max(0, roundMoney(params.amountPaid)));
    }

    const newInvoice: Invoice = {
      id: invoiceId,
      invoiceNumber,
      repairJobId: booking.id,
      bookingRef: booking.bookingRef,
      invoiceDate: nowIso.slice(0, 10),
      createdAt: nowIso,
      customerName: params.customerName.trim() || booking.customerName || 'Fleet Customer',
      customerPhone: params.customerPhone.trim() || booking.customerPhone || '-',
      customerEmail: params.customerEmail?.trim() || booking.customerEmail || '',
      vehicleId: booking.vehicleId,
      vehicleReg: booking.vehicleReg,
      vehicleMakeModel: booking.vehicleModel,
      odometerReading: params.odometerReading,
      serviceType: booking.serviceType || 'General Service',
      workPerformed:
        params.workPerformed.trim() ||
        booking.workPerformedDescription ||
        booking.serviceActivities,
      lineItems,
      materialsSubtotal,
      labourCharges: labour,
      additionalServiceCharges: additionalSvc,
      discountAmount: discount,
      taxEnabled: garageConfig.taxEnabled,
      taxRatePercent: garageConfig.taxEnabled ? garageConfig.taxRatePercent : 0,
      taxAmount,
      finalPayableAmount,
      paymentStatus: params.paymentStatus,
      amountPaid,
      paymentMethod: params.paymentMethod,
      status: 'active',
      garageSnapshot: { ...garageConfig },
    };

    // 5. Commit Inventory Deductions + Stock Movement Transactions together
    const newMovements: StockMovement[] = [];
    const newlyLowItems: InventoryItem[] = [];
    let txnCounter = stockMovements.length + 1;

    // Build running inventory map so duplicate SKU across estimated+additional deducts sequentially with exact previous/updated quantities
    const updatedInventory = inventory.map((item) => ({ ...item }));

    for (const li of lineItems) {
      const target = updatedInventory.find((i) => i.id === li.inventoryItemId);
      if (!target) continue;
      const prevQty = roundQty(target.quantityOnHand);
      const nextQty = roundQty(prevQty - li.quantity);
      target.quantityOnHand = nextQty;
      target.updatedAt = nowIso;

      newMovements.push({
        id: `txn-${Date.now()}-${txnCounter}`,
        transactionCode: `TXN-${1000 + txnCounter}`,
        inventoryItemId: target.id,
        partName: target.partName,
        sku: target.sku,
        unit: target.unit,
        transactionType: 'service_consumption',
        previousQuantity: prevQty,
        quantityDelta: -li.quantity,
        updatedQuantity: nextQty,
        repairJobId: booking.bookingRef,
        invoiceNumber,
        timestamp: nowIso,
        performedBy: 'Workshop Billing & Mechanic',
        remarks:
          li.materialSource === 'additional'
            ? `Additional part used: ${li.reason || 'Unplanned repair'}`
            : `Actual consumption for ${booking.serviceType || 'service'}`,
      });
      txnCounter++;
    }

    for (const item of updatedInventory) {
      if (item.isActive && item.quantityOnHand < item.minimumStock && totalConsumedByItem.has(item.id)) {
        newlyLowItems.push(item);
      }
    }

    // Apply all state updates atomically
    setInventory(updatedInventory);
    setStockMovements((prev) => [...newMovements.reverse(), ...prev]);
    setInvoices((prev) => [newInvoice, ...prev]);
    setGarageConfig((prev) => ({ ...prev, nextInvoiceSequence: prev.nextInvoiceSequence + 1 }));

    // Log Service History & mark booking completed/invoiced
    const historyItem: ServiceHistoryRecord = {
      id: `hist-${Date.now()}`,
      serviceTitle: `${booking.serviceType || booking.serviceActivities}`,
      workshopLocation: garageConfig.garageName,
      completedDate: new Date().toLocaleDateString('en-GB'),
      performedBy: 'Certified Garage Tech',
      odometerAtService: params.odometerReading,
      costEstimate: `${garageConfig.currencySymbol}${finalPayableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      invoiceNumber,
      status: 'completed',
      notes: newInvoice.workPerformed,
    };

    setVehicles((prev) =>
      prev.map((v) =>
        v.id === booking.vehicleId
          ? {
              ...v,
              odometer: Math.max(v.odometer, params.odometerReading),
              customerName: newInvoice.customerName,
              customerPhone: newInvoice.customerPhone,
              customerEmail: newInvoice.customerEmail,
              serviceHistory: [historyItem, ...v.serviceHistory],
            }
          : v
      )
    );

    setBookings((prev) =>
      prev.map((b) =>
        b.id === booking.id
          ? {
              ...b,
              labourCharges: labour,
              additionalServiceCharges: additionalSvc,
              discountAmount: discount,
              workPerformedDescription: newInvoice.workPerformed,
              customerName: newInvoice.customerName,
              customerPhone: newInvoice.customerPhone,
              customerEmail: newInvoice.customerEmail,
              invoiceId,
              invoiceNumber,
              invoiceStatus: 'generated',
              workflowColumn: 'service_events_to_book',
              calendarStatus: 'performed',
              badgeType: 'accepted',
              badgeDateStr: `Invoiced · ${invoiceNumber}`,
            }
          : b
      )
    );

    // Push performed alert + low stock notifications
    const perfAlert: FleetNotification = {
      id: `alert-inv-${Date.now()}`,
      type: 'performed',
      title: 'Performed',
      message: `Invoice ${invoiceNumber} (${garageConfig.currencySymbol}${finalPayableAmount.toFixed(2)}) generated for ${booking.vehicleReg}. Inventory deducted.`,
      workshop: garageConfig.garageName,
      bookingRef: booking.bookingRef,
      timeAgo: 'Just now',
      timestamp: nowIso,
      dismissed: false,
    };
    setNotifications((prev) => [perfAlert, ...prev]);

    newlyLowItems.forEach((item) => pushLowStockNotificationIfNeeded(item));

    return { success: true, invoice: newInvoice };
  };

  const updateInvoicePayment = (
    invoiceId: string,
    updates: {
      paymentStatus: InvoicePaymentStatus;
      amountPaid: number;
      paymentMethod: InvoicePaymentMethod;
    }
  ) => {
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id !== invoiceId) return inv;
        let paid = updates.amountPaid;
        if (updates.paymentStatus === 'Paid') paid = inv.finalPayableAmount;
        else if (updates.paymentStatus === 'Unpaid') paid = 0;
        else paid = Math.min(inv.finalPayableAmount, Math.max(0, roundMoney(updates.amountPaid)));
        return {
          ...inv,
          paymentStatus: updates.paymentStatus,
          amountPaid: paid,
          paymentMethod: updates.paymentMethod,
        };
      })
    );
  };

  const cancelInvoice = (
    invoiceId: string,
    reason: string = 'Cancelled by authorized garage manager'
  ): { success: boolean; error?: string } => {
    const inv = invoices.find((i) => i.id === invoiceId);
    if (!inv) return { success: false, error: 'Invoice not found.' };
    if (inv.status === 'cancelled') {
      return { success: false, error: 'Invoice is already cancelled and stock was previously restored.' };
    }

    const nowIso = new Date().toISOString();
    const updatedInventory = inventory.map((item) => ({ ...item }));
    const reversalMovements: StockMovement[] = [];
    let txnCounter = stockMovements.length + 1;

    for (const li of inv.lineItems) {
      const target = updatedInventory.find((i) => i.id === li.inventoryItemId);
      if (!target) continue;
      const prevQty = roundQty(target.quantityOnHand);
      const nextQty = roundQty(prevQty + li.quantity);
      target.quantityOnHand = nextQty;
      target.updatedAt = nowIso;

      reversalMovements.push({
        id: `txn-rev-${Date.now()}-${txnCounter}`,
        transactionCode: `TXN-${1000 + txnCounter}`,
        inventoryItemId: target.id,
        partName: target.partName,
        sku: target.sku,
        unit: target.unit,
        transactionType: 'invoice_reversal',
        previousQuantity: prevQty,
        quantityDelta: li.quantity,
        updatedQuantity: nextQty,
        repairJobId: inv.bookingRef,
        invoiceNumber: inv.invoiceNumber,
        timestamp: nowIso,
        performedBy: 'Garage Manager',
        remarks: `Stock restored from cancelled invoice ${inv.invoiceNumber}: ${reason}`,
      });
      txnCounter++;
    }

    setInventory(updatedInventory);
    setStockMovements((prev) => [...reversalMovements.reverse(), ...prev]);
    setInvoices((prev) =>
      prev.map((i) =>
        i.id === invoiceId
          ? { ...i, status: 'cancelled', cancelledAt: nowIso, cancelReason: reason }
          : i
      )
    );

    setBookings((prev) =>
      prev.map((b) =>
        b.id === inv.repairJobId
          ? {
              ...b,
              invoiceStatus: 'cancelled',
              invoiceId: undefined,
              invoiceNumber: undefined,
              workflowColumn: 'in_progress',
              calendarStatus: 'planned',
              badgeType: 'pick_up',
              badgeDateStr: `Invoice ${inv.invoiceNumber} Cancelled`,
            }
          : b
      )
    );

    return { success: true };
  };

  // ==========================================================
  // CONFLICT VALIDATION & EXISTING BOOKING ACTIONS
  // ==========================================================
  const validateBookingConflict = (
    vehicleId: string,
    date: string,
    startTime: string,
    endTime: string,
    ignoreBookingId?: string
  ): string | null => {
    const conflicts = bookings.filter((b) => {
      if (b.id === ignoreBookingId) return false;
      if (b.vehicleId !== vehicleId) return false;
      if (b.date !== date) return false;
      return startTime < b.endTime && endTime > b.startTime;
    });

    if (conflicts.length > 0) {
      const c = conflicts[0];
      return `Conflict: Vehicle ${c.vehicleReg} already has a scheduled service (${c.startTime} - ${c.endTime}) on ${date}.`;
    }
    return null;
  };

  const createBooking = (
    newBookingData: Omit<
      ServiceBooking,
      | 'id'
      | 'bookingRef'
      | 'actualMaterials'
      | 'additionalMaterials'
      | 'additionalServiceCharges'
      | 'discountAmount'
    > & {
      estimatedMaterials?: JobEstimatedMaterialLine[];
      labourCharges?: number;
    }
  ): { success: boolean; error?: string } => {
    const conflictError = validateBookingConflict(
      newBookingData.vehicleId,
      newBookingData.date,
      newBookingData.startTime,
      newBookingData.endTime
    );

    if (conflictError) {
      return { success: false, error: conflictError };
    }

    const id = `bk-${Date.now()}`;
    const bookingRef = String(Math.floor(2178700 + Math.random() * 900));

    const estimatedList = newBookingData.estimatedMaterials || [];
    const actualList: JobActualMaterialLine[] = estimatedList.map((em, idx) => ({
      id: `act-${Date.now()}-${idx}`,
      inventoryItemId: em.inventoryItemId,
      partName: em.partName,
      sku: em.sku,
      unit: em.unit,
      estimatedQuantity: em.estimatedQuantity,
      actualQuantity: em.estimatedQuantity,
      unitPrice: em.unitPrice,
    }));

    const veh = vehicles.find((v) => v.id === newBookingData.vehicleId);

    const newBooking: ServiceBooking = {
      ...newBookingData,
      id,
      bookingRef,
      workshopLocation: garageConfig.garageName,
      workflowColumn: 'preliminary_bookings',
      calendarStatus: 'preliminary',
      badgeType: 'pending',
      badgeDateStr: `${newBookingData.date}, ${newBookingData.startTime}`,
      customerName: newBookingData.customerName || veh?.customerName || 'Fleet Client',
      customerPhone: newBookingData.customerPhone || veh?.customerPhone || '-',
      customerEmail: newBookingData.customerEmail || veh?.customerEmail || '',
      estimatedMaterials: estimatedList,
      actualMaterials: actualList,
      additionalMaterials: [],
      labourCharges: newBookingData.labourCharges ?? 1800,
      additionalServiceCharges: 0,
      discountAmount: 0,
      invoiceStatus: 'none',
    };

    setBookings((prev) => [newBooking, ...prev]);

    const newAlert: FleetNotification = {
      id: `alert-${Date.now()}`,
      type: 'proposal',
      title: 'Proposal',
      message: `${garageConfig.garageName} logged ${newBooking.serviceType || 'service'} booking for ${newBooking.vehicleReg} on ${newBooking.date} at ${newBooking.startTime}. Moved to Preliminary Bookings.`,
      workshop: garageConfig.garageName,
      bookingRef,
      timeAgo: 'Just now',
      timestamp: new Date().toISOString(),
      dismissed: false,
    };
    setNotifications((prev) => [newAlert, ...prev]);

    return { success: true };
  };

  const registerVehicle = (data: {
    registrationNumber: string;
    category: VehicleCategory;
    manufacturer: string;
    model: string;
    manufacturingYear: number;
    odometer: number;
    engineRunningHours: number;
    equipmentGroup: string;
    maintenancePlan: string;
    nextServiceDate: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    notes?: string;
  }): { success: boolean; error?: string; vehicleId?: string } => {
    const trimmedReg = data.registrationNumber.trim().toUpperCase();
    if (!trimmedReg) {
      return { success: false, error: 'Registration number is required.' };
    }

    const exists = vehicles.some((v) => v.registrationNumber.toUpperCase() === trimmedReg);
    if (exists) {
      return {
        success: false,
        error: `Vehicle with registration ${trimmedReg} is already registered in the fleet.`,
      };
    }

    const meta = VEHICLE_CATEGORY_META[data.category];
    const newVehId = `veh-${Date.now()}`;

    const newVehicle: Vehicle = {
      id: newVehId,
      registrationNumber: trimmedReg,
      manufacturer: data.manufacturer || 'Scania',
      model: data.model || 'R 500 A6x2NA',
      manufacturingYear: data.manufacturingYear || 2024,
      category: data.category,
      categoryLabel: meta.label,
      imagePath: meta.imagePath,
      odometer: data.odometer || 0,
      engineRunningHours: data.engineRunningHours || 0,
      equipmentGroup: data.equipmentGroup || 'Heavy Haulage',
      maintenancePlan: data.maintenancePlan || 'Flexible Maintenance, M inspection',
      nextServiceDate: data.nextServiceDate || '15-11-2026',
      assignedGarage: garageConfig.garageName,
      customerName: data.customerName?.trim() || 'Commercial Fleet Account',
      customerPhone: data.customerPhone?.trim() || '-',
      customerEmail: data.customerEmail?.trim() || '',
      otherServiceActivities: '-',
      notes: data.notes || '',
      maintenanceChecklist: [
        {
          id: `m-init-${Date.now()}`,
          name: 'Factory Pre-Delivery Inspection & Flexible Maintenance',
          status: 'ok',
          dueDate: data.nextServiceDate || '15-11-2026',
          required: true,
        },
      ],
      repairChecklist: [],
      serviceHistory: [],
    };

    setVehicles((prev) => [newVehicle, ...prev]);

    const newAlert: FleetNotification = {
      id: `alert-${Date.now()}`,
      type: 'confirmed',
      title: 'Confirmed booking',
      message: `Commercial vehicle ${trimmedReg} (${meta.label}) registered into ${garageConfig.garageName}. Ready for service planning.`,
      workshop: garageConfig.garageName,
      timeAgo: 'Just now',
      timestamp: new Date().toISOString(),
      dismissed: false,
    };
    setNotifications((prev) => [newAlert, ...prev]);

    return { success: true, vehicleId: newVehId };
  };

  const updateBooking = (updatedBooking: ServiceBooking): { success: boolean; error?: string } => {
    const conflictError = validateBookingConflict(
      updatedBooking.vehicleId,
      updatedBooking.date,
      updatedBooking.startTime,
      updatedBooking.endTime,
      updatedBooking.id
    );

    if (conflictError) {
      return { success: false, error: conflictError };
    }

    setBookings((prev) =>
      prev.map((b) => (b.id === updatedBooking.id ? updatedBooking : b))
    );

    if (updatedBooking.calendarStatus === 'confirmed') {
      const newAlert: FleetNotification = {
        id: `alert-${Date.now()}`,
        type: 'confirmed',
        title: 'Confirmed booking',
        message: `Slot confirmed for ${updatedBooking.vehicleReg} (${updatedBooking.date} ${updatedBooking.startTime}-${updatedBooking.endTime}). Moved to Confirmed Bookings.`,
        workshop: garageConfig.garageName,
        bookingRef: updatedBooking.bookingRef,
        timeAgo: 'Just now',
        timestamp: new Date().toISOString(),
        dismissed: false,
      };
      setNotifications((prev) => [newAlert, ...prev]);
    }

    return { success: true };
  };

  const cancelBooking = (bookingId: string) => {
    const booking = bookings.find((b) => b.id === bookingId);
    setBookings((prev) => prev.filter((b) => b.id !== bookingId));

    if (booking) {
      const newAlert: FleetNotification = {
        id: `alert-${Date.now()}`,
        type: 'delayed',
        title: 'Service delayed',
        message: `Appointment #${booking.bookingRef} for vehicle ${booking.vehicleReg} was cancelled.`,
        workshop: garageConfig.garageName,
        bookingRef: booking.bookingRef,
        timeAgo: 'Just now',
        timestamp: new Date().toISOString(),
        dismissed: false,
      };
      setNotifications((prev) => [newAlert, ...prev]);
    }
  };

  const addUnplannedActivity = (vehicleId: string, name: string) => {
    const newItem: MaintenanceItem = {
      id: `m-unplanned-${Date.now()}`,
      name,
      status: 'due',
      dueDate: 'Scheduled Next Bay',
      required: false,
    };

    setVehicles((prev) =>
      prev.map((v) =>
        v.id === vehicleId ? { ...v, maintenanceChecklist: [...v.maintenanceChecklist, newItem] } : v
      )
    );
  };

  const addUnplannedRepair = (
    vehicleId: string,
    issue: string,
    severity: 'major' | 'minor' | 'critical'
  ) => {
    const newItem: RepairItem = {
      id: `r-unplanned-${Date.now()}`,
      issue,
      severity,
      reportedDate: new Date().toLocaleDateString('en-GB'),
      reportedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      resolved: false,
    };

    setVehicles((prev) =>
      prev.map((v) =>
        v.id === vehicleId ? { ...v, repairChecklist: [...v.repairChecklist, newItem] } : v
      )
    );
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, dismissed: true } : n)));
  };

  const dismissAllNotifications = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, dismissed: true })));
  };

  const resetNotifications = () => {
    setNotifications(INITIAL_NOTIFICATIONS);
  };

  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      b.vehicleReg.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.vehicleModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.vehicleCategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.serviceActivities.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.serviceType || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.equipmentGroup.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesGroup =
      equipmentGroupFilter === 'All equipment groups' || b.equipmentGroup === equipmentGroupFilter;

    return matchesSearch && matchesGroup;
  });

  // Live Inventory KPIs computed dynamically
  const activeInventory = inventory.filter((i) => i.isActive);
  const totalInventoryItems = activeInventory.length;
  const totalInventoryValue = roundMoney(
    activeInventory.reduce((sum, i) => sum + i.quantityOnHand * i.purchaseCost, 0)
  );
  const lowStockItems = activeInventory.filter(
    (i) => i.quantityOnHand > 0 && i.quantityOnHand < i.minimumStock
  );
  const outOfStockItems = activeInventory.filter((i) => i.quantityOnHand <= 0);
  const alertInventoryItems = activeInventory.filter((i) => i.quantityOnHand < i.minimumStock);

  return {
    garageConfig,
    updateGarageConfig,
    vehicles,
    bookings: filteredBookings,
    allBookingsRaw: bookings,
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
    selectedBookingForJobId,
    setSelectedBookingForJobId,
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
    updateServiceTemplate,
    buildEstimateFromTemplate,
    approvePreliminaryBooking,
    rejectPreliminaryBooking,
    startConfirmedBooking,
    completeInProgressBooking,
    updateJobEstimatedMaterials,
    updateJobActualMaterialQty,
    addJobAdditionalMaterial,
    updateJobAdditionalMaterial,
    removeJobAdditionalMaterial,
    updateJobChargesAndNotes,
    generateInvoiceForBooking,
    updateInvoicePayment,
    cancelInvoice,
    validateBookingConflict,
    createBooking,
    updateBooking,
    cancelBooking,
    addUnplannedActivity,
    addUnplannedRepair,
    registerVehicle,
    dismissNotification,
    dismissAllNotifications,
    resetNotifications,
  };
}

export type FleetStore = ReturnType<typeof useFleetStore>;
