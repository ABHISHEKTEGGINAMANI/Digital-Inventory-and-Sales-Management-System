# Digital Inventory and Sales Management System (ApexFlow)

An enterprise-grade, web-based business management system designed specifically for small businesses, retail shops, tech stores, and cafes. ApexFlow brings together real-time inventory tracking, lightning-fast POS billing, automated low-stock procurement alerts, and comprehensive financial sales analytics in a single unified, responsive web application.

---

## 🌟 Key Features

### 1. Executive Dashboard
- **Real-Time KPI Cards**: Today's Sales Revenue, Active Invoices, Net Profit, Total Inventory Valuation, and Low-Stock counts.
- **Critical Low-Stock Emergency Banner**: Instant alert highlighting items running dangerously low with direct one-click routing to the Procurement Center.
- **Interactive Revenue Trajectory**: Smooth SVG trend chart visualizing store revenue over time.
- **Live Sales Feed**: Recent transactions processed at the POS terminal.

### 2. High-Speed Point of Sale (POS) Billing Terminal
- **Barcode & SKU Scanner Simulation**: Instant product addition upon barcode scan or SKU input with realistic audio synthesizer feedback (`Web Audio API`).
- **Touch & Click Catalog**: Visual product grid with category pills, live stock levels, and instant click-to-cart.
- **Cart Management**: Real-time quantity adjustments, line item removal, and stock limit safeguards (prevents overselling).
- **Flexible Billing & Discounts**: Line item calculation, percentage discounts, and automatic configurable Tax/GST computation.
- **Multiple Payment Gateways**: Cash, Card, UPI / QR Code, and Online payments.
- **Tender Calculator**: Quick cash denominations (₹100, ₹200, ₹500, ₹2000, Exact) and real-time Change Due calculation.
- **Printable Invoices & Receipts**: Generates clean, professional thermal/A4 tax invoices with store branding, itemized breakdowns, and browser print integration (`Ctrl + P`).

### 3. Inventory & Stock Catalog Management
- **Complete Product Master**: Track Name, SKU, Barcode, Category, Cost Price, Selling Price, Profit Margin %, Unit, and Primary Supplier.
- **Live Margin Calculator**: Visual feedback displaying gross margin % and profit dollar amount in real-time when editing prices.
- **Multi-Filter & Search**: Instant search by product name, SKU, barcode, supplier, category, or stock status (Healthy, Low Stock, Out of Stock).
- **Quick Stock-In**: One-click replenishment modal (+5, +10, +25, +50 presets) for fast warehouse receiving.
- **CSV Data Export**: Single-click export of the entire inventory database to CSV.

### 4. Low-Stock Alert & Procurement Center
- **Automated Restock Intelligence**: Calculates suggested reorder quantities based on historical sales velocity and minimum thresholds.
- **Estimated Reorder Capital**: Real-time computation of cash required to replenish critical inventory.
- **Batch Procurement**: "Order & Restock All Critical Items" button to replenish all low items simultaneously.
- **Individual Instant Restock**: Quick one-click purchase receiving for individual items.

### 5. Sales Analytics & Financial Reporting
- **Dynamic Time Filters**: Analyze performance by Today, Last 7 Days, Last 30 Days, or All Time.
- **Core Financial Metrics**: Gross Sales Revenue, Net Profit, Profit Margin %, Total Orders, Average Order Value (AOV), and Tax Collected.
- **Category Sales Breakdown**: Visual distribution of revenue across product categories.
- **Best Sellers Ranking**: Top 5 products ranked by volume and revenue generated.
- **Audit Sales Ledger**: Full chronological transaction ledger with customer details, payment methods, reprint receipt capability, and return/refund processing (which automatically returns items to inventory).
- **Sales CSV Export**: Export sales ledger for accounting and tax compliance.

### 6. Settings, Customization & Data Sovereignty
- **Store Profile**: Store Name, Address, Contact details, Tax ID, Currency symbol ($, ₹, €, £, ¥, AED), and Tax rate %.
- **Audio Synthesizers**: Web Audio API generated sound effects for barcode scanning and alert tones.
- **Dark / Light Mode**: Seamless theme toggle with CSS variable design tokens.
- **Data Backup & Restore**: Full JSON database backup and restore capabilities with zero server lock-in.
- **Demo Data Reset**: One-click restore to preloaded sample inventory and sales transactions.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| **F1** | Open POS Billing Terminal |
| **F2** | Open Inventory Catalog |
| **F3** | Open Sales Analytics & Reports |
| **F4** | Open Low-Stock Alert Center |
| **Esc** | Close any open Modal / Dialog |
| **Enter** | In POS Barcode Box: Instantly scan & add item |

---

## 🚀 How to Run

ApexFlow is engineered with pure **HTML5, Vanilla CSS, and Modern JavaScript (ES6+)** with zero external runtime dependencies.

Simply open `index.html` in any modern web browser:
```bash
# Windows
start index.html

# Or open file:///c:/Users/Lenovo/pr/index.html in Chrome, Edge, Brave, or Firefox.
```

All data persists reliably in your browser's `localStorage`.
