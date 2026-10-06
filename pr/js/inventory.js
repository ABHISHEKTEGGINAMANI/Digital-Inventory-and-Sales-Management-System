/**
 * ApexFlow Inventory & Stock Management Controller
 */

class InventoryManager {
  constructor() {
    this.searchQuery = "";
    this.selectedCategory = "All";
    this.stockFilter = "all"; // "all" | "low" | "out" | "healthy"
    this.currentEditId = null;

    this.initElements();
    this.bindEvents();
    this.render();
  }

  initElements() {
    this.tableBody = document.getElementById("inventory-table-body");
    this.searchInput = document.getElementById("inv-search-input");
    this.categorySelect = document.getElementById("inv-category-filter");
    this.stockFilterSelect = document.getElementById("inv-status-filter");
    this.totalValuationEl = document.getElementById("inv-total-valuation");
    this.totalSkuCountEl = document.getElementById("inv-sku-count");
    this.lowStockCountEl = document.getElementById("inv-low-stock-count");
    this.outOfStockCountEl = document.getElementById("inv-out-of-stock-count");

    // Product Modal Elements
    this.modalProduct = document.getElementById("modal-product");
    this.formProduct = document.getElementById("form-product");
    this.modalTitle = document.getElementById("modal-product-title");

    // Quick Stock-In Modal Elements
    this.modalStockIn = document.getElementById("modal-stock-in");
    this.stockInProdName = document.getElementById("stock-in-prod-name");
    this.stockInCurrentStock = document.getElementById("stock-in-current-stock");
    this.stockInQtyInput = document.getElementById("stock-in-qty");
    this.stockInTargetId = null;
  }

  bindEvents() {
    // Search input
    if (this.searchInput) {
      this.searchInput.addEventListener("input", (e) => {
        this.searchQuery = e.target.value.trim().toLowerCase();
        this.renderTable();
      });
    }

    // Category filter
    if (this.categorySelect) {
      this.categorySelect.addEventListener("change", (e) => {
        this.selectedCategory = e.target.value;
        this.renderTable();
      });
    }

    // Stock status filter
    if (this.stockFilterSelect) {
      this.stockFilterSelect.addEventListener("change", (e) => {
        this.stockFilter = e.target.value;
        this.renderTable();
      });
    }

    // Add Product button
    const addBtn = document.getElementById("btn-add-product");
    if (addBtn) {
      addBtn.addEventListener("click", () => this.openAddModal());
    }

    // SKU & Barcode Auto-Regenerate Buttons
    const regenSkuBtn = document.getElementById("btn-regen-sku");
    if (regenSkuBtn) {
      regenSkuBtn.addEventListener("click", () => {
        const skuEl = document.getElementById("prod-sku");
        if (skuEl) skuEl.value = `SKU-${Math.floor(1000 + Math.random() * 9000)}`;
      });
    }

    const regenBarcodeBtn = document.getElementById("btn-regen-barcode");
    if (regenBarcodeBtn) {
      regenBarcodeBtn.addEventListener("click", () => {
        const barEl = document.getElementById("prod-barcode");
        if (barEl) barEl.value = `${Math.floor(10000000 + Math.random() * 90000000)}`;
      });
    }

    // Export CSV button
    const exportBtn = document.getElementById("btn-export-csv");
    if (exportBtn) {
      exportBtn.addEventListener("click", () => this.exportCSV());
    }

    // Product Form submission
    if (this.formProduct) {
      this.formProduct.addEventListener("submit", (e) => {
        e.preventDefault();
        this.saveProductForm();
      });

      // Live Profit Margin Calculation
      const costEl = document.getElementById("prod-cost");
      const priceEl = document.getElementById("prod-price");
      const marginPreview = document.getElementById("prod-margin-preview");

      const updateMargin = () => {
        const cost = parseFloat(costEl.value) || 0;
        const price = parseFloat(priceEl.value) || 0;
        const currency = window.appStore ? window.appStore.getSettings().currency : "₹";
        if (price > 0) {
          const profit = price - cost;
          const margin = (profit / price) * 100;
          const markup = cost > 0 ? (profit / cost) * 100 : 0;
          if (profit < 0) {
            marginPreview.innerHTML = `⚠️ <strong>Loss: -${currency}${Math.abs(profit).toFixed(2)}</strong> (Margin: ${margin.toFixed(1)}%) — Selling price is below cost!`;
            marginPreview.style.color = "var(--accent-danger)";
            marginPreview.style.background = "var(--accent-danger-bg)";
          } else {
            marginPreview.innerHTML = `Margin: <strong>${margin.toFixed(1)}%</strong> | Markup: <strong>${markup.toFixed(1)}%</strong> | Profit: <strong>${currency}${profit.toFixed(2)}</strong>`;
            marginPreview.style.color = margin >= 30 ? "var(--accent-success)" : "var(--accent-warning)";
            marginPreview.style.background = "var(--bg-glass)";
          }
        } else {
          marginPreview.textContent = "Margin: 0% | Profit: ₹0.00";
          marginPreview.style.color = "var(--text-secondary)";
          marginPreview.style.background = "var(--bg-glass)";
        }
      };

      if (costEl && priceEl && marginPreview) {
        costEl.addEventListener("input", updateMargin);
        priceEl.addEventListener("input", updateMargin);
      }

      // Category Quick-Add Handlers
      const toggleNewCatBtn = document.getElementById("btn-toggle-new-cat");
      const newCatGroup = document.getElementById("new-cat-input-group");
      const saveNewCatBtn = document.getElementById("btn-save-new-cat");
      const newCatInput = document.getElementById("input-new-cat-name");

      if (toggleNewCatBtn && newCatGroup) {
        toggleNewCatBtn.addEventListener("click", () => {
          const isHidden = newCatGroup.style.display === "none";
          newCatGroup.style.display = isHidden ? "block" : "none";
          if (isHidden && newCatInput) setTimeout(() => newCatInput.focus(), 100);
        });
      }

      if (saveNewCatBtn && newCatInput) {
        const handleAddCategory = () => {
          const name = newCatInput.value.trim();
          if (!name) {
            window.notifications.warning("Empty Name", "Please enter a category name.");
            return;
          }
          const added = window.appStore.addCategory(name);
          if (added) {
            window.notifications.success("Category Created", `Category "${name}" is now available.`);
            this.updateCategoryOptions();
            const modalCat = document.getElementById("prod-category");
            if (modalCat) modalCat.value = name;
            newCatInput.value = "";
            if (newCatGroup) newCatGroup.style.display = "none";
          } else {
            window.notifications.info("Category Exists", `Category "${name}" already exists.`);
            const modalCat = document.getElementById("prod-category");
            if (modalCat) modalCat.value = name;
          }
        };

        saveNewCatBtn.addEventListener("click", handleAddCategory);
        newCatInput.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleAddCategory();
          }
        });
      }
    }

    // Quick Stock-In Form submission
    const formStockIn = document.getElementById("form-stock-in");
    if (formStockIn) {
      formStockIn.addEventListener("submit", (e) => {
        e.preventDefault();
        const qty = parseInt(this.stockInQtyInput.value, 10);
        if (qty > 0 && this.stockInTargetId) {
          const prod = window.appStore.restockProduct(this.stockInTargetId, qty);
          window.notifications.success("Stock Replenished", `Added +${qty} units to "${prod.name}".`);
          this.closeModals();
        }
      });
    }

    // Store update listeners
    window.appStore.on("products:updated", () => {
      this.render();
    });

    window.appStore.on("categories:updated", () => {
      this.updateCategoryOptions();
    });
  }

  render() {
    this.updateCategoryOptions();
    this.renderKPIs();
    this.renderTable();
    this.renderProcurementAlerts();
  }

  updateCategoryOptions() {
    if (!this.categorySelect) return;
    const categories = window.appStore.getCategories();
    this.categorySelect.innerHTML = categories.map(c => `
      <option value="${c}" ${this.selectedCategory === c ? "selected" : ""}>${c === "All" ? "All Categories" : c}</option>
    `).join("");

    // Also update modal category options
    const modalCat = document.getElementById("prod-category");
    if (modalCat) {
      modalCat.innerHTML = categories.filter(c => c !== "All").map(c => `
        <option value="${c}">${c}</option>
      `).join("");
    }
  }

  renderKPIs() {
    const products = window.appStore.getProducts();
    const currency = window.appStore.getSettings().currency;

    const totalValuation = products.reduce((sum, p) => sum + (p.costPrice * p.stock), 0);
    const lowStock = products.filter(p => p.stock > 0 && p.stock <= p.reorderLevel).length;
    const outOfStock = products.filter(p => p.stock <= 0).length;

    if (this.totalValuationEl) this.totalValuationEl.textContent = `${currency}${totalValuation.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (this.totalSkuCountEl) this.totalSkuCountEl.textContent = products.length;
    if (this.lowStockCountEl) this.lowStockCountEl.textContent = lowStock;
    const lowStock2 = document.getElementById("inv-low-stock-count-2");
    if (lowStock2) lowStock2.textContent = lowStock;
    if (this.outOfStockCountEl) this.outOfStockCountEl.textContent = outOfStock;

    // Update global sidebar low-stock badge
    const badge = document.getElementById("sidebar-low-stock-count");
    if (badge) {
      const totalAlerts = lowStock + outOfStock;
      badge.textContent = totalAlerts;
      badge.style.display = totalAlerts > 0 ? "inline-flex" : "none";
    }

    const quickStatBadge = document.getElementById("quick-stock-count");
    if (quickStatBadge) {
      quickStatBadge.textContent = lowStock + outOfStock;
    }
  }

  renderTable() {
    if (!this.tableBody) return;
    const products = window.appStore.getProducts();
    const currency = window.appStore.getSettings().currency;

    let filtered = products;

    if (this.selectedCategory && this.selectedCategory !== "All") {
      filtered = filtered.filter(p => p.category === this.selectedCategory);
    }

    if (this.stockFilter === "low") {
      filtered = filtered.filter(p => p.stock > 0 && p.stock <= p.reorderLevel);
    } else if (this.stockFilter === "out") {
      filtered = filtered.filter(p => p.stock <= 0);
    } else if (this.stockFilter === "healthy") {
      filtered = filtered.filter(p => p.stock > p.reorderLevel);
    }

    if (this.searchQuery) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(this.searchQuery) ||
        p.sku.toLowerCase().includes(this.searchQuery) ||
        p.barcode.toLowerCase().includes(this.searchQuery) ||
        p.supplier.toLowerCase().includes(this.searchQuery)
      );
    }

    if (filtered.length === 0) {
      this.tableBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align:center; padding: 2.5rem; color: var(--text-muted);">
            No inventory items found matching your filters.
          </td>
        </tr>
      `;
      return;
    }

    this.tableBody.innerHTML = filtered.map(p => {
      let badgeHtml = "";
      if (p.stock <= 0) {
        badgeHtml = `<span class="badge badge-danger">Out of Stock</span>`;
      } else if (p.stock <= p.reorderLevel) {
        badgeHtml = `<span class="badge badge-warning">Low Stock (${p.stock})</span>`;
      } else {
        badgeHtml = `<span class="badge badge-success">Healthy (${p.stock})</span>`;
      }

      const margin = p.sellingPrice > 0 ? (((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100).toFixed(1) : 0;
      const valuation = (p.costPrice * p.stock).toFixed(2);

      return `
        <tr>
          <td>
            <div style="font-weight:600; color:var(--text-primary);">${p.name}</div>
            <div style="font-size:0.75rem; color:var(--text-muted); font-family:var(--font-mono);">${p.sku} | Barcode: ${p.barcode}</div>
          </td>
          <td><span class="badge badge-secondary">${p.category}</span></td>
          <td id="cell-cost-${p.id}">
            <button type="button" class="price-edit-trigger" onclick="inventoryManager.startInlinePriceEdit('${p.id}', 'cost')" title="Click to customize Cost Price">
              <span>${currency}${p.costPrice.toFixed(2)}</span>
              <svg class="edit-hint-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
          </td>
          <td id="cell-selling-${p.id}">
            <button type="button" class="price-edit-trigger" onclick="inventoryManager.startInlinePriceEdit('${p.id}', 'selling')" title="Click to customize Selling Price">
              <strong>${currency}${p.sellingPrice.toFixed(2)}</strong>
              <svg class="edit-hint-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
          </td>
          <td style="color:${margin >= 30 ? "var(--accent-success)" : "var(--accent-warning)"}; font-weight:600;">
            ${margin}%
          </td>
          <td>
            ${badgeHtml}
            <div style="font-size:0.725rem; color:var(--text-muted); margin-top:2px;">Reorder at: ${p.reorderLevel} ${p.unit}</div>
          </td>
          <td>${currency}${valuation}</td>
          <td>
            <div style="display:flex; gap:0.4rem;">
              <button class="btn btn-secondary btn-sm" onclick="inventoryManager.openStockInModal('${p.id}')" title="Quick Stock-In / Restock">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
                +Stock
              </button>
              <button class="btn btn-secondary btn-sm" onclick="inventoryManager.openEditModal('${p.id}')" title="Edit Product">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="btn btn-outline-danger btn-sm" onclick="inventoryManager.deleteProduct('${p.id}')" title="Delete Product">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }

  renderProcurementAlerts() {
    const procurementList = document.getElementById("procurement-items-list");
    const bannerCount = document.getElementById("banner-alert-count");
    const bannerItemsPreview = document.getElementById("banner-alert-preview");
    const alertBanner = document.getElementById("low-stock-alert-banner");

    const alerts = window.appStore.getAllAlerts();
    const currency = window.appStore.getSettings().currency;
    const combined = [...alerts.outOfStock, ...alerts.lowStock];

    // Update Alert Banner on Dashboard
    if (alertBanner) {
      if (combined.length > 0) {
        alertBanner.style.display = "flex";
        if (bannerCount) bannerCount.textContent = `${combined.length} Item${combined.length > 1 ? "s" : ""} Require Attention`;
        if (bannerItemsPreview) {
          const names = combined.slice(0, 3).map(p => `<strong>${p.name}</strong> (${p.stock <= 0 ? "Out of Stock" : `${p.stock} left`})`).join(", ");
          bannerItemsPreview.innerHTML = `${names} ${combined.length > 3 ? `and +${combined.length - 3} more` : ""}.`;
        }
      } else {
        alertBanner.style.display = "none";
      }
    }

    // Render Procurement Reorder Center Table
    if (procurementList) {
      if (combined.length === 0) {
        procurementList.innerHTML = `
          <tr>
            <td colspan="7" style="text-align:center; padding: 2rem; color: var(--accent-success);">
              <strong>All inventory stock levels are healthy!</strong> No procurement actions required right now.
            </td>
          </tr>
        `;
        return;
      }

      procurementList.innerHTML = combined.map(p => {
        const suggestedOrder = Math.max(10, (p.reorderLevel * 2) - p.stock);
        const estCost = (suggestedOrder * p.costPrice).toFixed(2);
        const isOut = p.stock <= 0;

        return `
          <tr>
            <td>
              <strong>${p.name}</strong>
              <div style="font-size:0.75rem; color:var(--text-muted);">${p.sku} | ${p.supplier}</div>
            </td>
            <td>
              <span class="badge ${isOut ? "badge-danger" : "badge-warning"}">
                ${isOut ? "Out of Stock (0)" : `${p.stock} left`}
              </span>
            </td>
            <td>${p.reorderLevel} ${p.unit}</td>
            <td><strong>+${suggestedOrder} ${p.unit}</strong></td>
            <td>${currency}${p.costPrice.toFixed(2)}</td>
            <td><strong>${currency}${estCost}</strong></td>
            <td>
              <button class="btn btn-success btn-sm" onclick="inventoryManager.quickProcure('${p.id}', ${suggestedOrder})">
                Instant Restock
              </button>
            </td>
          </tr>
        `;
      }).join("");
    }
  }

  quickProcure(productId, quantity) {
    const prod = window.appStore.restockProduct(productId, quantity);
    window.notifications.success("Restock Complete", `Received +${quantity} units of "${prod.name}".`);
  }

  restockAllLowItems() {
    const alerts = window.appStore.getAllAlerts();
    const combined = [...alerts.outOfStock, ...alerts.lowStock];
    if (combined.length === 0) {
      window.notifications.info("No Actions", "All products are currently at healthy stock levels.");
      return;
    }

    let restockedCount = 0;
    combined.forEach(p => {
      const suggestedOrder = Math.max(10, (p.reorderLevel * 2) - p.stock);
      window.appStore.restockProduct(p.id, suggestedOrder);
      restockedCount++;
    });

    window.notifications.success("Batch Restocked!", `Successfully replenished ${restockedCount} items to optimal stock levels.`);
  }

  openAddModal(initialData = {}) {
    this.currentEditId = null;
    this.modalTitle.textContent = "Add New Product";
    this.formProduct.reset();
    this.updateCategoryOptions();

    const skuEl = document.getElementById("prod-sku");
    const barcodeEl = document.getElementById("prod-barcode");
    const nameEl = document.getElementById("prod-name");
    const catEl = document.getElementById("prod-category");
    const costEl = document.getElementById("prod-cost");
    const priceEl = document.getElementById("prod-price");
    const stockEl = document.getElementById("prod-stock");
    const reorderEl = document.getElementById("prod-reorder");
    const unitEl = document.getElementById("prod-unit");
    const supplierEl = document.getElementById("prod-supplier");

    if (skuEl) skuEl.value = initialData.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`;
    if (barcodeEl) barcodeEl.value = initialData.barcode || `${Math.floor(10000000 + Math.random() * 90000000)}`;
    if (nameEl && initialData.name) nameEl.value = initialData.name;
    if (catEl && initialData.category) catEl.value = initialData.category;
    if (costEl && initialData.cost) costEl.value = initialData.cost;
    if (priceEl && initialData.price) priceEl.value = initialData.price;
    if (stockEl) stockEl.value = initialData.stock !== undefined ? initialData.stock : 10;
    if (reorderEl) reorderEl.value = initialData.reorderLevel || window.appStore.getSettings().lowStockThresholdDefault;
    if (unitEl) unitEl.value = initialData.unit || "pcs";
    if (supplierEl) supplierEl.value = initialData.supplier || "Direct Vendor";

    const marginPreview = document.getElementById("prod-margin-preview");
    if (marginPreview) marginPreview.textContent = "Margin: 0%";

    this.modalProduct.classList.add("active");
    setTimeout(() => {
      if (nameEl) nameEl.focus();
    }, 150);
  }

  openEditModal(id) {
    const p = window.appStore.getProductById(id);
    if (!p) return;

    this.currentEditId = p.id;
    this.modalTitle.textContent = `Edit Product: ${p.name}`;

    document.getElementById("prod-name").value = p.name;
    document.getElementById("prod-sku").value = p.sku;
    document.getElementById("prod-barcode").value = p.barcode;
    document.getElementById("prod-category").value = p.category;
    document.getElementById("prod-cost").value = p.costPrice;
    document.getElementById("prod-price").value = p.sellingPrice;
    document.getElementById("prod-stock").value = p.stock;
    document.getElementById("prod-reorder").value = p.reorderLevel;
    document.getElementById("prod-unit").value = p.unit;
    document.getElementById("prod-supplier").value = p.supplier;

    // Trigger margin update
    const cost = p.costPrice;
    const price = p.sellingPrice;
    const profit = price - cost;
    const margin = price > 0 ? (profit / price) * 100 : 0;
    const marginPreview = document.getElementById("prod-margin-preview");
    if (marginPreview) {
      const currency = window.appStore ? window.appStore.getSettings().currency : "₹";
      marginPreview.textContent = `Margin: ${margin.toFixed(1)}% (Profit: ${currency}${profit.toFixed(2)})`;
    }

    this.modalProduct.classList.add("active");
  }

  openStockInModal(id) {
    const p = window.appStore.getProductById(id);
    if (!p) return;

    this.stockInTargetId = p.id;
    this.stockInProdName.textContent = p.name;
    this.stockInCurrentStock.textContent = `${p.stock} ${p.unit}`;
    this.stockInQtyInput.value = p.reorderLevel || 10;
    this.modalStockIn.classList.add("active");
  }

  saveProductForm() {
    const payload = {
      name: document.getElementById("prod-name").value,
      sku: document.getElementById("prod-sku").value,
      barcode: document.getElementById("prod-barcode").value,
      category: document.getElementById("prod-category").value,
      costPrice: document.getElementById("prod-cost").value,
      sellingPrice: document.getElementById("prod-price").value,
      stock: document.getElementById("prod-stock").value,
      reorderLevel: document.getElementById("prod-reorder").value,
      unit: document.getElementById("prod-unit").value,
      supplier: document.getElementById("prod-supplier").value
    };

    if (this.currentEditId) {
      window.appStore.updateProduct(this.currentEditId, payload);
      window.notifications.success("Updated", `Product "${payload.name}" updated successfully.`);
    } else {
      window.appStore.addProduct(payload);
      window.notifications.success("Created", `New product "${payload.name}" added to inventory.`);
    }

    this.closeModals();
  }

  deleteProduct(id) {
    const p = window.appStore.getProductById(id);
    if (!p) return;

    if (confirm(`Are you sure you want to delete "${p.name}"? This action cannot be undone.`)) {
      window.appStore.deleteProduct(id);
      window.notifications.warning("Deleted", `Product "${p.name}" has been removed.`);
    }
  }

  startInlinePriceEdit(id, type) {
    const p = window.appStore.getProductById(id);
    if (!p) return;
    const cell = document.getElementById(`cell-${type}-${id}`);
    if (!cell) return;

    const currency = window.appStore.getSettings().currency;
    const currentVal = type === 'cost' ? p.costPrice : p.sellingPrice;

    cell.innerHTML = `
      <div class="inline-price-editor" onclick="event.stopPropagation()">
        <span style="font-size:0.75rem; color:var(--text-muted);">${currency}</span>
        <input type="number" step="0.01" min="0" class="inline-price-input" id="input-inline-${id}-${type}" value="${currentVal}">
        <button type="button" class="btn-inline-save" onclick="inventoryManager.saveInlinePriceEdit('${id}', '${type}')" title="Save Price">✓</button>
        <button type="button" class="btn-inline-cancel" onclick="inventoryManager.renderTable()" title="Cancel">✕</button>
      </div>
    `;

    const input = document.getElementById(`input-inline-${id}-${type}`);
    if (input) {
      input.focus();
      input.select();
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          this.saveInlinePriceEdit(id, type);
        } else if (e.key === "Escape") {
          this.renderTable();
        }
      });
    }
  }

  saveInlinePriceEdit(id, type) {
    const input = document.getElementById(`input-inline-${id}-${type}`);
    if (!input) return;

    const val = parseFloat(input.value);
    if (isNaN(val) || val < 0) {
      window.notifications.warning("Invalid Price", "Please enter a valid price amount.");
      return;
    }

    const p = window.appStore.getProductById(id);
    if (!p) return;

    const currency = window.appStore.getSettings().currency;
    if (type === 'cost') {
      window.appStore.updateProductPrice(id, null, val);
      window.notifications.success("Cost Price Customized", `Cost for "${p.name}" updated to ${currency}${val.toFixed(2)}.`);
    } else {
      window.appStore.updateProductPrice(id, val, null);
      window.notifications.success("Selling Price Customized", `Selling price for "${p.name}" updated to ${currency}${val.toFixed(2)}.`);
    }

    this.renderTable();
  }

  exportCSV() {
    const products = window.appStore.getProducts();
    if (products.length === 0) {
      window.notifications.warning("Empty", "No products available to export.");
      return;
    }

    const headers = ["ID", "SKU", "Barcode", "Name", "Category", "CostPrice", "SellingPrice", "Stock", "ReorderLevel", "Unit", "Supplier"];
    const rows = products.map(p => [
      `"${p.id}"`,
      `"${p.sku}"`,
      `"${p.barcode}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.category}"`,
      p.costPrice,
      p.sellingPrice,
      p.stock,
      p.reorderLevel,
      `"${p.unit}"`,
      `"${p.supplier.replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ApexFlow_Inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.notifications.success("Export Complete", "Inventory CSV file downloaded.");
  }

  closeModals() {
    document.querySelectorAll(".modal-overlay").forEach(m => m.classList.remove("active"));
  }
}

window.initInventory = function() {
  window.inventoryManager = new InventoryManager();
};
