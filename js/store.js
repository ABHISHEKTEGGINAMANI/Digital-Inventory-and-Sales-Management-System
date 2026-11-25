class Store {
  constructor() {
    this.STORAGE_KEYS = {
      PRODUCTS: "apex_products_v1",
      TRANSACTIONS: "apex_transactions_v1",
      SETTINGS: "apex_settings_v1",
      CATEGORIES: "apex_categories_v1",
      CUSTOMERS: "apex_customers_v1"
    };

    this.listeners = {};
    this.init();
  }

  init() {
    if (!localStorage.getItem(this.STORAGE_KEYS.PRODUCTS)) {
      this.resetToDefaults();
    } else {
      const settings = this.getSettings();
      if (!settings.currency || settings.currency === "$") {
        settings.currency = "₹";
        this.updateSettings(settings);
      }
    }
  }

  resetToDefaults() {
    localStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    localStorage.setItem(this.STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
    localStorage.setItem(this.STORAGE_KEYS.PRODUCTS, JSON.stringify(DEFAULT_PRODUCTS));

    const seedTxns = generateSeedTransactions();
    localStorage.setItem(this.STORAGE_KEYS.TRANSACTIONS, JSON.stringify(seedTxns));

    localStorage.setItem(this.STORAGE_KEYS.CUSTOMERS, JSON.stringify([]));

    this.emit("store:reset", null);
  }

  // Event Pub/Sub
  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => {
        try {
          cb(data);
        } catch (err) {
          console.error(`Error in listener for ${event}:`, err);
        }
      });
    }
  }

  // --- SETTINGS ---
  getSettings() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.SETTINGS);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  }

  updateSettings(newSettings) {
    const current = this.getSettings();
    const updated = { ...current, ...newSettings };
    localStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    this.emit("settings:updated", updated);
    return updated;
  }

  // --- CATEGORIES ---
  getCategories() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.CATEGORIES);
      return data ? JSON.parse(data) : DEFAULT_CATEGORIES;
    } catch (e) {
      return DEFAULT_CATEGORIES;
    }
  }

  addCategory(categoryName) {
    const trimmed = categoryName.trim();
    if (!trimmed) return false;
    const cats = this.getCategories();
    if (!cats.includes(trimmed)) {
      cats.push(trimmed);
      localStorage.setItem(this.STORAGE_KEYS.CATEGORIES, JSON.stringify(cats));
      this.emit("categories:updated", cats);
      return true;
    }
    return false;
  }

  // --- PRODUCTS ---
  getProducts() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.PRODUCTS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  getProductById(id) {
    const products = this.getProducts();
    return products.find(p => p.id === id || p.sku === id || p.barcode === id) || null;
  }

  addProduct(productData) {
    const products = this.getProducts();
    const id = "prod-" + Date.now();
    const newProduct = {
      id: id,
      sku: productData.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      barcode: productData.barcode || `${Math.floor(10000000 + Math.random() * 90000000)}`,
      name: productData.name.trim(),
      category: productData.category || "General",
      costPrice: parseFloat(productData.costPrice) || 0,
      sellingPrice: parseFloat(productData.sellingPrice) || 0,
      stock: parseInt(productData.stock, 10) || 0,
      reorderLevel: parseInt(productData.reorderLevel, 10) || this.getSettings().lowStockThresholdDefault,
      unit: productData.unit || "pcs",
      supplier: productData.supplier || "Direct Vendor"
    };

    products.unshift(newProduct);
    localStorage.setItem(this.STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    this.emit("products:updated", products);
    this.emit("product:added", newProduct);
    return newProduct;
  }

  updateProduct(id, updatedFields) {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return null;

    products[index] = {
      ...products[index],
      ...updatedFields,
      costPrice: parseFloat(updatedFields.costPrice !== undefined ? updatedFields.costPrice : products[index].costPrice),
      sellingPrice: parseFloat(updatedFields.sellingPrice !== undefined ? updatedFields.sellingPrice : products[index].sellingPrice),
      stock: parseInt(updatedFields.stock !== undefined ? updatedFields.stock : products[index].stock, 10),
      reorderLevel: parseInt(updatedFields.reorderLevel !== undefined ? updatedFields.reorderLevel : products[index].reorderLevel, 10)
    };

    localStorage.setItem(this.STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    this.emit("products:updated", products);
    this.emit("product:updated", products[index]);
    return products[index];
  }

  updateProductPrice(id, newSellingPrice, newCostPrice = null) {
    const updates = {};
    if (newSellingPrice !== null && newSellingPrice !== undefined) {
      updates.sellingPrice = parseFloat(newSellingPrice);
    }
    if (newCostPrice !== null && newCostPrice !== undefined) {
      updates.costPrice = parseFloat(newCostPrice);
    }
    return this.updateProduct(id, updates);
  }

  deleteProduct(id) {
    const products = this.getProducts();
    const filtered = products.filter(p => p.id !== id);
    localStorage.setItem(this.STORAGE_KEYS.PRODUCTS, JSON.stringify(filtered));
    this.emit("products:updated", filtered);
    return true;
  }

  adjustStock(id, qtyDelta) {
    const products = this.getProducts();
    const prod = products.find(p => p.id === id);
    if (!prod) return null;

    prod.stock = Math.max(0, prod.stock + qtyDelta);
    localStorage.setItem(this.STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    this.emit("products:updated", products);
    this.emit("stock:adjusted", { product: prod, delta: qtyDelta });
    return prod;
  }

  restockProduct(id, quantityToAdd) {
    return this.adjustStock(id, Math.abs(quantityToAdd));
  }

  // --- LOW STOCK & OUT OF STOCK QUERIES ---
  getLowStockItems() {
    const products = this.getProducts();
    return products.filter(p => p.stock > 0 && p.stock <= p.reorderLevel);
  }

  getOutOfStockItems() {
    const products = this.getProducts();
    return products.filter(p => p.stock <= 0);
  }

  getAllAlerts() {
    const lowStock = this.getLowStockItems();
    const outOfStock = this.getOutOfStockItems();
    return {
      totalAlerts: lowStock.length + outOfStock.length,
      outOfStock: outOfStock,
      lowStock: lowStock
    };
  }

  // --- TRANSACTIONS / SALES ---
  getTransactions() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.TRANSACTIONS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  createSale({ items, customerName, paymentMethod, discountPercent = 0 }) {
    if (!items || items.length === 0) {
      throw new Error("Cannot checkout an empty cart");
    }

    const products = this.getProducts();
    const settings = this.getSettings();

    // Verify stock availability
    for (const item of items) {
      if (item.productId && item.productId.startsWith("custom-")) {
        continue;
      }
      const prod = products.find(p => p.id === item.productId);
      if (!prod) throw new Error(`Product ${item.name} not found`);
      if (prod.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${prod.name}. Available: ${prod.stock}`);
      }
    }

    // Deduct stock
    const lowStockTriggered = [];
    let inventoryModified = false;
    items.forEach(item => {
      if (item.productId && item.productId.startsWith("custom-")) return;
      const prod = products.find(p => p.id === item.productId);
      if (prod) {
        prod.stock -= item.quantity;
        inventoryModified = true;
        if (prod.stock <= prod.reorderLevel) {
          lowStockTriggered.push(prod);
        }
      }
    });

    if (inventoryModified) {
      localStorage.setItem(this.STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
      this.emit("products:updated", products);
    }

    let subtotal = 0;
    let totalCost = 0;

    const saleItems = items.map(item => {
      const lineSubtotal = item.sellingPrice * item.quantity;
      const lineCost = item.costPrice * item.quantity;
      subtotal += lineSubtotal;
      totalCost += lineCost;
      return {
        productId: item.productId,
        sku: item.sku,
        name: item.name,
        category: item.category,
        costPrice: item.costPrice,
        sellingPrice: item.sellingPrice,
        quantity: item.quantity,
        lineTotal: lineSubtotal
      };
    });

    const discountAmount = Number(((subtotal * discountPercent) / 100).toFixed(2));
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = Number(((taxableAmount * settings.taxRate) / 100).toFixed(2));
    const grandTotal = Number((taxableAmount + taxAmount).toFixed(2));
    const netProfit = Number((taxableAmount - totalCost).toFixed(2));

    const transactions = this.getTransactions();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${1000 + transactions.length + 1}`;

    const newTxn = {
      id: "txn-" + Date.now(),
      invoiceNumber: invoiceNumber,
      timestamp: new Date().toISOString(),
      customerName: customerName || "Walk-in Customer",
      items: saleItems,
      subtotal: Number(subtotal.toFixed(2)),
      discountPercent: discountPercent,
      discountAmount: discountAmount,
      taxPercent: settings.taxRate,
      taxAmount: taxAmount,
      grandTotal: grandTotal,
      totalCost: Number(totalCost.toFixed(2)),
      netProfit: netProfit,
      paymentMethod: paymentMethod || "Cash",
      status: "Completed"
    };

    transactions.unshift(newTxn);
    localStorage.setItem(this.STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));

    this.emit("sale:completed", {
      transaction: newTxn,
      lowStockWarnings: lowStockTriggered
    });

    return newTxn;
  }

  refundTransaction(transactionId) {
    const transactions = this.getTransactions();
    const txn = transactions.find(t => t.id === transactionId);
    if (!txn || txn.status === "Refunded") return false;


    const products = this.getProducts();
    txn.items.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      if (prod) {
        prod.stock += item.quantity;
      }
    });

    txn.status = "Refunded";
    localStorage.setItem(this.STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    localStorage.setItem(this.STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));

    this.emit("products:updated", products);
    this.emit("transaction:refunded", txn);
    return true;
  }

  getRegisteredCustomers() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.CUSTOMERS);
      if (data) return JSON.parse(data);
      localStorage.setItem(this.STORAGE_KEYS.CUSTOMERS, JSON.stringify([]));
      return [];
    } catch (e) {
      return [];
    }
  }

  addCustomer(customerData) {
    const list = this.getRegisteredCustomers();
    const id = "cust-" + Date.now();
    const newCust = {
      id: id,
      name: customerData.name.trim(),
      phone: customerData.phone || "",
      email: customerData.email || "",
      notes: customerData.notes || "",
      createdAt: new Date().toISOString()
    };
    list.unshift(newCust);
    localStorage.setItem(this.STORAGE_KEYS.CUSTOMERS, JSON.stringify(list));
    this.emit("customers:updated", list);
    return newCust;
  }

  getCustomerLeaderboard(sortBy = "totalSpent") {
    const transactions = this.getTransactions();
    const registered = this.getRegisteredCustomers();
    const customerMap = {};

    registered.forEach(rc => {
      customerMap[rc.name] = {
        id: rc.id,
        name: rc.name,
        phone: rc.phone,
        email: rc.email,
        notes: rc.notes,
        totalSpent: 0,
        maxPurchase: 0,
        orderCount: 0,
        invoices: [],
        lastPurchaseDate: null,
        firstPurchaseDate: null,
        paymentMethods: {},
        isRegistered: true
      };
    });


    transactions.forEach(t => {
      if (t.status === "Refunded") return;
      const rawName = (t.customerName || "Walk-in Customer").trim();
      if (!customerMap[rawName]) {
        customerMap[rawName] = {
          id: "cust-gen-" + rawName.toLowerCase().replace(/[^a-z0-9]/g, "-"),
          name: rawName,
          phone: "",
          email: "",
          notes: "",
          totalSpent: 0,
          maxPurchase: 0,
          orderCount: 0,
          invoices: [],
          lastPurchaseDate: null,
          firstPurchaseDate: null,
          paymentMethods: {},
          isRegistered: false
        };
      }

      const c = customerMap[rawName];
      const amount = Number(t.grandTotal || 0);
      c.totalSpent += amount;
      if (amount > c.maxPurchase) {
        c.maxPurchase = amount;
      }
      c.orderCount += 1;
      c.invoices.push(t);

      if (!c.lastPurchaseDate || new Date(t.timestamp) > new Date(c.lastPurchaseDate)) {
        c.lastPurchaseDate = t.timestamp;
      }
      if (!c.firstPurchaseDate || new Date(t.timestamp) < new Date(c.firstPurchaseDate)) {
        c.firstPurchaseDate = t.timestamp;
      }

      const method = t.paymentMethod || "Cash";
      c.paymentMethods[method] = (c.paymentMethods[method] || 0) + 1;
    });

    const customers = Object.values(customerMap).map(c => {
      const aov = c.orderCount > 0 ? (c.totalSpent / c.orderCount) : 0;

      let tier = "Bronze";


      if (c.totalSpent >= 3500) {
        tier = "Platinum";

      } else if (c.totalSpent >= 1800) {
        tier = "Gold";
      } else if (c.totalSpent >= 800) {
        tier = "Silver";
      }

      return {
        ...c,
        totalSpent: Number(c.totalSpent.toFixed(2)),
        maxPurchase: Number(c.maxPurchase.toFixed(2)),
        aov: Number(aov.toFixed(2)),
        tier,
      };
    });

    if (sortBy === "maxPurchase") {
      customers.sort((a, b) => b.maxPurchase - a.maxPurchase || b.totalSpent - a.totalSpent);
    } else if (sortBy === "orderCount") {
      customers.sort((a, b) => b.orderCount - a.orderCount || b.totalSpent - a.totalSpent);
    } else if (sortBy === "recent") {
      customers.sort((a, b) => new Date(b.lastPurchaseDate || 0) - new Date(a.lastPurchaseDate || 0));
    } else {

      customers.sort((a, b) => b.totalSpent - a.totalSpent || b.maxPurchase - a.maxPurchase);
    }

    return customers;
  }

  exportBackupJSON() {
    const backup = {
      timestamp: new Date().toISOString(),
      settings: this.getSettings(),
      categories: this.getCategories(),
      products: this.getProducts(),
      transactions: this.getTransactions(),
      customers: this.getRegisteredCustomers()
    };
    return JSON.stringify(backup, null, 2);
  }

  importBackupJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (!data.products || !data.transactions) {
        throw new Error("Invalid backup JSON format");
      }
      if (data.settings) localStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
      if (data.categories) localStorage.setItem(this.STORAGE_KEYS.CATEGORIES, JSON.stringify(data.categories));
      localStorage.setItem(this.STORAGE_KEYS.PRODUCTS, JSON.stringify(data.products));
      localStorage.setItem(this.STORAGE_KEYS.TRANSACTIONS, JSON.stringify(data.transactions));
      if (data.customers) localStorage.setItem(this.STORAGE_KEYS.CUSTOMERS, JSON.stringify(data.customers));

      this.emit("store:reset", null);
      return true;
    } catch (e) {
      console.error("Backup restore failed:", e);
      return false;
    }
  }
}

window.appStore = new Store();
