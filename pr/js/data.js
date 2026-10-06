/**
 * ApexFlow ERP / POS - Realistic Seed Data
 */

const DEFAULT_SETTINGS = {
  storeName: "Apex Retail & Tech Hub",
  tagline: "Smart POS & Inventory Management",
  address: "742 Evergreen Terrace, Suite 101, Tech District",
  phone: "+1 (555) 234-5678",
  email: "support@apexflow.store",
  taxId: "TX-994827104",
  currency: "₹",
  taxRate: 8.5, // 8.5%
  lowStockThresholdDefault: 8,
  soundAlerts: true,
  autoPrintReceipt: false,
  theme: "dark"
};

const DEFAULT_CATEGORIES = [
  "All",
  "Electronics",
  "Audio & Accessories",
  "Office & Desk",
  "Beverages & Cafe",
  "Apparel"
];

const DEFAULT_PRODUCTS = [
  {
    id: "prod-101",
    sku: "ELEC-LOGI-MX3",
    barcode: "84000101",
    name: "Logitech MX Master 3S Wireless Mouse",
    category: "Electronics",
    costPrice: 65.00,
    sellingPrice: 99.99,
    stock: 14,
    reorderLevel: 6,
    unit: "pcs",
    supplier: "TechSupply Direct"
  },
  {
    id: "prod-102",
    sku: "AUD-SONY-WH",
    barcode: "84000102",
    name: "Sony WH-1000XM5 Noise Cancelling Headphones",
    category: "Audio & Accessories",
    costPrice: 240.00,
    sellingPrice: 349.99,
    stock: 4,
    reorderLevel: 5, // LOW STOCK TRIGGERED!
    unit: "pcs",
    supplier: "Global Audio Partners"
  },
  {
    id: "prod-103",
    sku: "ELEC-KEY-MECH",
    barcode: "84000103",
    name: "Keychron K2 Pro Mechanical Keyboard",
    category: "Electronics",
    costPrice: 70.00,
    sellingPrice: 119.00,
    stock: 9,
    reorderLevel: 5,
    unit: "pcs",
    supplier: "Keychron Tech"
  },
  {
    id: "prod-104",
    sku: "AUD-PODS-PRO",
    barcode: "84000104",
    name: "Apple AirPods Pro (2nd Gen, USB-C)",
    category: "Audio & Accessories",
    costPrice: 175.00,
    sellingPrice: 249.00,
    stock: 2,
    reorderLevel: 6, // LOW STOCK TRIGGERED!
    unit: "pcs",
    supplier: "Apple Authorized Dist."
  },
  {
    id: "prod-105",
    sku: "OFF-NOTE-MOLE",
    barcode: "84000105",
    name: "Moleskine Classic Hardcover Notebook (Dotted)",
    category: "Office & Desk",
    costPrice: 11.50,
    sellingPrice: 22.95,
    stock: 35,
    reorderLevel: 10,
    unit: "pcs",
    supplier: "Stationery World"
  },
  {
    id: "prod-106",
    sku: "OFF-PEN-LAMY",
    barcode: "84000106",
    name: "Lamy Safari Charcoal Fountain Pen (Fine)",
    category: "Office & Desk",
    costPrice: 16.00,
    sellingPrice: 29.50,
    stock: 0,
    reorderLevel: 8, // OUT OF STOCK!
    unit: "pcs",
    supplier: "Stationery World"
  },
  {
    id: "prod-107",
    sku: "BEV-COFF-ROAST",
    barcode: "84000107",
    name: "Artisan Single-Origin Ethiopian Coffee Beans (1kg)",
    category: "Beverages & Cafe",
    costPrice: 14.00,
    sellingPrice: 26.00,
    stock: 18,
    reorderLevel: 8,
    unit: "bag",
    supplier: "RoastMaster Import"
  },
  {
    id: "prod-108",
    sku: "BEV-MATCHA-CER",
    barcode: "84000108",
    name: "Uji Ceremonial Grade Japanese Matcha Tin (100g)",
    category: "Beverages & Cafe",
    costPrice: 18.50,
    sellingPrice: 34.00,
    stock: 3,
    reorderLevel: 5, // LOW STOCK!
    unit: "tin",
    supplier: "Kyoto Botanicals"
  },
  {
    id: "prod-109",
    sku: "ELEC-ANKER-65W",
    barcode: "84000109",
    name: "Anker GaNPrime 65W USB-C 3-Port Fast Charger",
    category: "Electronics",
    costPrice: 28.00,
    sellingPrice: 49.99,
    stock: 22,
    reorderLevel: 6,
    unit: "pcs",
    supplier: "Anker Wholesale"
  },
  {
    id: "prod-110",
    sku: "ELEC-CABLE-THUN",
    barcode: "84000110",
    name: "Braided Thunderbolt 4 / USB-4 Cable 2m",
    category: "Electronics",
    costPrice: 12.00,
    sellingPrice: 27.99,
    stock: 45,
    reorderLevel: 10,
    unit: "pcs",
    supplier: "Anker Wholesale"
  },
  {
    id: "prod-111",
    sku: "APP-HOODIE-TECH",
    barcode: "84000111",
    name: "Heavyweight Minimalist Tech Hoodie (Onyx Black)",
    category: "Apparel",
    costPrice: 32.00,
    sellingPrice: 68.00,
    stock: 12,
    reorderLevel: 6,
    unit: "pcs",
    supplier: "Urban Stitch Co."
  },
  {
    id: "prod-112",
    sku: "APP-CAP-WATER",
    barcode: "84000112",
    name: "Water-Resistant Technical 5-Panel Cap",
    category: "Apparel",
    costPrice: 14.00,
    sellingPrice: 32.00,
    stock: 5,
    reorderLevel: 6, // LOW STOCK!
    unit: "pcs",
    supplier: "Urban Stitch Co."
  },
  {
    id: "prod-113",
    sku: "OFF-DESK-MAT",
    barcode: "84000113",
    name: "Premium Vegan Leather Dual-Sided Desk Mat (90x40cm)",
    category: "Office & Desk",
    costPrice: 15.00,
    sellingPrice: 36.00,
    stock: 28,
    reorderLevel: 8,
    unit: "pcs",
    supplier: "OrbitCraft"
  },
  {
    id: "prod-114",
    sku: "AUD-MIC-YETI",
    barcode: "84000114",
    name: "Blue Yeti USB Studio Condenser Microphone",
    category: "Audio & Accessories",
    costPrice: 75.00,
    sellingPrice: 129.99,
    stock: 0,
    reorderLevel: 4, // OUT OF STOCK!
    unit: "pcs",
    supplier: "LogiTech Media"
  },
  {
    id: "prod-115",
    sku: "BEV-TUMBLER-ISO",
    barcode: "84000115",
    name: "Insulated Double-Wall Stainless Tumbler (600ml)",
    category: "Beverages & Cafe",
    costPrice: 9.50,
    sellingPrice: 24.50,
    stock: 31,
    reorderLevel: 10,
    unit: "pcs",
    supplier: "HydroFlask Group"
  }
];

// Helper to generate seed historical transactions for analytics
function generateSeedTransactions() {
  const transactions = [];
  const now = new Date();
  
  const paymentMethods = ["Card", "Cash", "UPI", "Online"];
  const customerNames = [
    "Alex Mercer", "Samantha Reed", "David Chen", "Elena Rostova",
    "Marcus Vance", "Olivia Bennett", "Liam Gallagher", "Sophia Patel",
    "Noah Williams", "Emma Taylor", "Walk-in Customer"
  ];

  // Helper date offset
  const getDate = (daysAgo, hourOffset = 0) => {
    const d = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    d.setHours(9 + (hourOffset % 10), Math.floor(Math.random() * 59), 0);
    return d.toISOString();
  };

  const seedSales = [
    // Today
    { daysAgo: 0, hour: 1, customer: "Samantha Reed", items: [{ prodId: "prod-101", qty: 1 }, { prodId: "prod-110", qty: 2 }], method: "Card", discount: 5 },
    { daysAgo: 0, hour: 3, customer: "Walk-in Customer", items: [{ prodId: "prod-107", qty: 2 }, { prodId: "prod-115", qty: 1 }], method: "Cash", discount: 0 },
    { daysAgo: 0, hour: 5, customer: "David Chen", items: [{ prodId: "prod-103", qty: 1 }], method: "UPI", discount: 0 },
    { daysAgo: 0, hour: 7, customer: "Liam Gallagher", items: [{ prodId: "prod-108", qty: 1 }], method: "Card", discount: 0 },
    
    // Yesterday
    { daysAgo: 1, hour: 2, customer: "Elena Rostova", items: [{ prodId: "prod-102", qty: 1 }, { prodId: "prod-109", qty: 1 }], method: "Card", discount: 10 },
    { daysAgo: 1, hour: 4, customer: "Walk-in Customer", items: [{ prodId: "prod-105", qty: 3 }], method: "Cash", discount: 0 },
    { daysAgo: 1, hour: 6, customer: "Sophia Patel", items: [{ prodId: "prod-111", qty: 1 }, { prodId: "prod-112", qty: 1 }], method: "Online", discount: 0 },
    
    // 2 days ago
    { daysAgo: 2, hour: 1, customer: "Marcus Vance", items: [{ prodId: "prod-104", qty: 1 }], method: "Card", discount: 0 },
    { daysAgo: 2, hour: 5, customer: "Alex Mercer", items: [{ prodId: "prod-113", qty: 2 }, { prodId: "prod-101", qty: 1 }], method: "Card", discount: 8 },
    
    // 3 days ago
    { daysAgo: 3, hour: 3, customer: "Walk-in Customer", items: [{ prodId: "prod-107", qty: 1 }, { prodId: "prod-105", qty: 1 }], method: "Cash", discount: 0 },
    { daysAgo: 3, hour: 7, customer: "Emma Taylor", items: [{ prodId: "prod-109", qty: 2 }, { prodId: "prod-110", qty: 1 }], method: "UPI", discount: 0 },

    // 4 days ago
    { daysAgo: 4, hour: 2, customer: "Noah Williams", items: [{ prodId: "prod-103", qty: 1 }, { prodId: "prod-113", qty: 1 }], method: "Card", discount: 5 },

    // 5 days ago
    { daysAgo: 5, hour: 4, customer: "Walk-in Customer", items: [{ prodId: "prod-108", qty: 2 }], method: "Cash", discount: 0 },
    { daysAgo: 5, hour: 6, customer: "Samantha Reed", items: [{ prodId: "prod-104", qty: 1 }, { prodId: "prod-110", qty: 1 }], method: "Card", discount: 0 },

    // 6 days ago
    { daysAgo: 6, hour: 3, customer: "David Chen", items: [{ prodId: "prod-111", qty: 2 }], method: "UPI", discount: 10 },

    // 8-14 days ago
    { daysAgo: 8, hour: 2, customer: "Liam Gallagher", items: [{ prodId: "prod-102", qty: 1 }], method: "Card", discount: 0 },
    { daysAgo: 10, hour: 5, customer: "Walk-in Customer", items: [{ prodId: "prod-107", qty: 3 }, { prodId: "prod-115", qty: 2 }], method: "Cash", discount: 0 },
    { daysAgo: 12, hour: 1, customer: "Sophia Patel", items: [{ prodId: "prod-101", qty: 2 }, { prodId: "prod-103", qty: 1 }], method: "Online", discount: 15 },
    { daysAgo: 14, hour: 4, customer: "Elena Rostova", items: [{ prodId: "prod-109", qty: 3 }], method: "Card", discount: 0 },

    // 16-25 days ago
    { daysAgo: 18, hour: 3, customer: "Alex Mercer", items: [{ prodId: "prod-105", qty: 5 }, { prodId: "prod-113", qty: 1 }], method: "Card", discount: 5 },
    { daysAgo: 22, hour: 2, customer: "Marcus Vance", items: [{ prodId: "prod-104", qty: 1 }, { prodId: "prod-102", qty: 1 }], method: "Card", discount: 20 },
    { daysAgo: 25, hour: 6, customer: "Walk-in Customer", items: [{ prodId: "prod-107", qty: 2 }, { prodId: "prod-108", qty: 1 }], method: "Cash", discount: 0 }
  ];

  let invoiceCounter = 1042;
  const prodLookup = {};
  DEFAULT_PRODUCTS.forEach(p => { prodLookup[p.id] = p; });

  seedSales.forEach((sale, idx) => {
    invoiceCounter++;
    const invoiceNumber = `INV-2026-${invoiceCounter}`;
    const timestamp = getDate(sale.daysAgo, sale.hour);

    let subtotal = 0;
    let totalCost = 0;
    const saleItems = sale.items.map(item => {
      const p = prodLookup[item.prodId];
      const lineSubtotal = p.sellingPrice * item.qty;
      const lineCost = p.costPrice * item.qty;
      subtotal += lineSubtotal;
      totalCost += lineCost;
      return {
        productId: p.id,
        sku: p.sku,
        name: p.name,
        category: p.category,
        costPrice: p.costPrice,
        sellingPrice: p.sellingPrice,
        quantity: item.qty,
        lineTotal: lineSubtotal
      };
    });

    const discountAmount = Number(((subtotal * sale.discount) / 100).toFixed(2));
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = Number(((taxableAmount * DEFAULT_SETTINGS.taxRate) / 100).toFixed(2));
    const grandTotal = Number((taxableAmount + taxAmount).toFixed(2));
    const netProfit = Number((taxableAmount - totalCost).toFixed(2));

    transactions.push({
      id: `txn-${invoiceCounter}`,
      invoiceNumber: invoiceNumber,
      timestamp: timestamp,
      customerName: sale.customer,
      items: saleItems,
      subtotal: Number(subtotal.toFixed(2)),
      discountPercent: sale.discount,
      discountAmount: discountAmount,
      taxPercent: DEFAULT_SETTINGS.taxRate,
      taxAmount: taxAmount,
      grandTotal: grandTotal,
      totalCost: Number(totalCost.toFixed(2)),
      netProfit: netProfit,
      paymentMethod: sale.method,
      status: "Completed" // "Completed" | "Refunded"
    });
  });

  return transactions;
}
