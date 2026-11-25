/**
 * ApexFlow ERP / POS - Data Defaults (Blank Slate)
 */

const DEFAULT_SETTINGS = {
  storeName: "Apex Retail & Tech Hub",
  tagline: "Smart POS & Inventory Management",
  address: "",
  phone: "",
  email: "",
  taxId: "",
  currency: "₹",
  taxRate: 8.5, // 8.5%
  lowStockThresholdDefault: 8,
  soundAlerts: true,
  autoPrintReceipt: false,
  theme: "dark"
};

const DEFAULT_CATEGORIES = [
  "All"
];

const DEFAULT_PRODUCTS = [];

// No seed transactions — returns empty array
function generateSeedTransactions() {
  return [];
}
