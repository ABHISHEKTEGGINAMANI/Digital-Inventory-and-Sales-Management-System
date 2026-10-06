/**
 * ApexFlow POS & Billing Terminal Controller
 */

class POSTerminal {
  constructor() {
    this.cart = [];
    this.activeCategory = "All";
    this.searchQuery = "";
    this.discountPercent = 0;
    this.paymentMethod = "Cash";
    this.cashTendered = 0;

    this.initElements();
    this.bindEvents();
    this.renderProducts();
    this.renderCart();
  }

  initElements() {
    this.productGrid = document.getElementById("pos-product-grid");
    this.categoryContainer = document.getElementById("pos-category-pills");
    this.cartItemsList = document.getElementById("pos-cart-items");
    this.barcodeInput = document.getElementById("pos-barcode-input");
    this.customerInput = document.getElementById("pos-customer-input");
    this.discountInput = document.getElementById("pos-discount-input");
    this.tenderInput = document.getElementById("pos-tender-input");
    this.changeDueDisplay = document.getElementById("pos-change-due");

    // Summary Elements
    this.subtotalEl = document.getElementById("pos-subtotal");
    this.taxEl = document.getElementById("pos-tax");
    this.discountEl = document.getElementById("pos-discount");
    this.grandTotalEl = document.getElementById("pos-grand-total");
    this.cartCountBadge = document.getElementById("pos-cart-count");

    // Custom Product Modal Elements
    this.btnCustomItem = document.getElementById("btn-pos-custom-item");
    this.modalCustomItem = document.getElementById("modal-custom-item");
    this.formCustomItem = document.getElementById("form-custom-item");
    this.customItemSaveCatalog = document.getElementById("custom-item-save-catalog");
    this.customItemCatalogFields = document.getElementById("custom-item-catalog-fields");
  }

  bindEvents() {
    // Custom Product / Item Button & Modal
    if (this.btnCustomItem) {
      this.btnCustomItem.addEventListener("click", () => this.openCustomItemModal());
    }

    if (this.customItemSaveCatalog && this.customItemCatalogFields) {
      this.customItemSaveCatalog.addEventListener("change", (e) => {
        this.customItemCatalogFields.style.display = e.target.checked ? "block" : "none";
      });
    }

    if (this.formCustomItem) {
      this.formCustomItem.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleCustomItemSubmit();
      });
    }

    // Barcode scanner / SKU input on Enter
    if (this.barcodeInput) {
      this.barcodeInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          this.handleBarcodeScan(this.barcodeInput.value.trim());
          this.barcodeInput.value = "";
        }
      });
      this.barcodeInput.addEventListener("input", (e) => {
        this.searchQuery = e.target.value.trim().toLowerCase();
        this.renderProducts();
      });
    }

    // Category click delegation
    if (this.categoryContainer) {
      this.categoryContainer.addEventListener("click", (e) => {
        const pill = e.target.closest(".category-pill");
        if (pill) {
          this.categoryContainer.querySelectorAll(".category-pill").forEach(p => p.classList.remove("active"));
          pill.classList.add("active");
          this.activeCategory = pill.dataset.category;
          this.renderProducts();
        }
      });
    }

    // Discount change
    if (this.discountInput) {
      this.discountInput.addEventListener("input", (e) => {
        const val = parseFloat(e.target.value);
        this.discountPercent = isNaN(val) ? 0 : Math.min(100, Math.max(0, val));
        this.renderCart();
      });
    }

    // Cash tender input
    if (this.tenderInput) {
      this.tenderInput.addEventListener("input", (e) => {
        this.cashTendered = parseFloat(e.target.value) || 0;
        this.updateChangeDue();
      });
    }

    // Quick cash pills
    document.querySelectorAll(".cash-pill").forEach(pill => {
      pill.addEventListener("click", () => {
        const amt = parseFloat(pill.dataset.val);
        const total = this.calculateTotals().grandTotal;
        if (pill.dataset.val === "exact") {
          this.cashTendered = total;
        } else {
          this.cashTendered = amt;
        }
        if (this.tenderInput) this.tenderInput.value = this.cashTendered.toFixed(2);
        this.updateChangeDue();
      });
    });

    // Payment method buttons
    document.querySelectorAll(".payment-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".payment-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.paymentMethod = btn.dataset.method;
        const tenderRow = document.getElementById("tender-row-container");
        if (tenderRow) {
          tenderRow.style.display = this.paymentMethod === "Cash" ? "flex" : "none";
        }
      });
    });

    // Checkout button
    const checkoutBtn = document.getElementById("btn-pos-checkout");
    if (checkoutBtn) {
      checkoutBtn.addEventListener("click", () => this.handleCheckout());
    }

    // Clear cart button
    const clearBtn = document.getElementById("btn-clear-cart");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        if (this.cart.length > 0) {
          this.cart = [];
          this.renderCart();
          window.notifications.info("Cart Cleared", "All items have been removed from the cart.");
        }
      });
    }

    // Store update listeners
    window.appStore.on("products:updated", () => {
      this.renderProducts();
      this.syncCartWithStore();
    });

    window.appStore.on("categories:updated", () => {
      this.renderCategoryPills();
    });
  }

  renderCategoryPills() {
    if (!this.categoryContainer) return;
    const categories = window.appStore.getCategories();
    this.categoryContainer.innerHTML = categories.map(cat => `
      <button class="category-pill ${cat === this.activeCategory ? "active" : ""}" data-category="${cat}">
        ${cat}
      </button>
    `).join("");
  }

  handleBarcodeScan(code) {
    if (!code) return;
    const products = window.appStore.getProducts();
    const clean = code.toLowerCase();
    const product = products.find(p => 
      p.barcode.toLowerCase() === clean || 
      p.sku.toLowerCase() === clean ||
      p.name.toLowerCase() === clean
    );

    if (product) {
      this.addToCart(product.id);
      window.notifications.playScanBeep();
      window.notifications.success("Item Scanned", `Added "${product.name}" to cart.`);
    } else {
      window.notifications.warning("Not Found", `No product matches barcode or SKU "${code}".`);
      setTimeout(() => {
        if (confirm(`Barcode or SKU "${code}" is not in catalog. Would you like to add it as a new product now?`)) {
          window.openAddProductModal({ barcode: code });
        }
      }, 250);
    }
  }

  quickAddMissingProduct() {
    window.openAddProductModal({
      name: this.searchQuery || "",
      category: this.activeCategory !== "All" ? this.activeCategory : ""
    });
  }

  renderProducts() {
    if (!this.productGrid) return;
    const products = window.appStore.getProducts();
    const currency = window.appStore.getSettings().currency;

    let filtered = products;

    if (this.activeCategory && this.activeCategory !== "All") {
      filtered = filtered.filter(p => p.category === this.activeCategory);
    }

    if (this.searchQuery) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(this.searchQuery) ||
        p.sku.toLowerCase().includes(this.searchQuery) ||
        p.barcode.toLowerCase().includes(this.searchQuery) ||
        p.category.toLowerCase().includes(this.searchQuery)
      );
    }

    if (filtered.length === 0) {
      const query = this.searchQuery ? `"${this.searchQuery}"` : "your filter";
      this.productGrid.innerHTML = `
        <div style="grid-column: 1 / -1;" class="empty-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color:var(--text-muted); margin-bottom:0.75rem;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <p style="font-size:0.95rem; font-weight:600; color:var(--text-primary); margin-bottom:0.25rem;">No products match ${query}</p>
          <p style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:1rem;">Can't find the item? Add it directly to the permanent inventory catalog.</p>
          <button type="button" class="btn btn-primary btn-sm empty-state-add-btn" onclick="posTerminal.quickAddMissingProduct()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            + Add New Product to Catalog
          </button>
        </div>
      `;
      return;
    }

    this.productGrid.innerHTML = filtered.map(p => {
      let stockClass = "pos-stock-healthy";
      let stockLabel = `${p.stock} in stock`;

      if (p.stock <= 0) {
        stockClass = "pos-stock-out";
        stockLabel = "Out of Stock";
      } else if (p.stock <= p.reorderLevel) {
        stockClass = "pos-stock-low";
        stockLabel = `Low (${p.stock} left)`;
      }

      return `
        <div class="pos-product-card ${p.stock <= 0 ? "out-of-stock" : ""}" onclick="posTerminal.addToCart('${p.id}')">
          <button type="button" class="pos-card-edit-btn" onclick="event.stopPropagation(); posTerminal.openProductEdit('${p.id}')" title="Customize Product & Price">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <div class="pos-card-sku">${p.sku}</div>
          <div class="pos-card-title">${p.name}</div>
          <div class="pos-card-bottom">
            <span class="pos-card-price">${currency}${p.sellingPrice.toFixed(2)}</span>
            <span class="pos-card-stock ${stockClass}">${stockLabel}</span>
          </div>
        </div>
      `;
    }).join("");
  }

  addToCart(productId) {
    const product = window.appStore.getProductById(productId);
    if (!product) return;

    if (product.stock <= 0) {
      window.notifications.danger("Out of Stock", `"${product.name}" is completely out of stock.`);
      return;
    }

    const existing = this.cart.find(item => item.productId === productId);
    if (existing) {
      if (existing.quantity >= product.stock) {
        window.notifications.warning("Stock Limit Reached", `Only ${product.stock} units available for "${product.name}".`);
        return;
      }
      existing.quantity += 1;
    } else {
      this.cart.push({
        productId: product.id,
        sku: product.sku,
        name: product.name,
        category: product.category,
        costPrice: product.costPrice,
        sellingPrice: product.sellingPrice,
        quantity: 1
      });
    }

    window.notifications.playScanBeep();
    this.renderCart();
  }

  updateQuantity(productId, delta) {
    const item = this.cart.find(i => i.productId === productId);
    if (!item) return;

    const product = window.appStore.getProductById(productId);
    const newQty = item.quantity + delta;

    if (newQty <= 0) {
      this.cart = this.cart.filter(i => i.productId !== productId);
    } else {
      if (product && newQty > product.stock) {
        window.notifications.warning("Max Stock Exceeded", `Only ${product.stock} available in stock.`);
        return;
      }
      item.quantity = newQty;
    }

    this.renderCart();
  }

  removeFromCart(productId) {
    this.cart = this.cart.filter(i => i.productId !== productId);
    this.renderCart();
  }

  syncCartWithStore() {
    const products = window.appStore.getProducts();
    this.cart.forEach(item => {
      if (item.productId && item.productId.startsWith("custom-")) return;
      const prod = products.find(p => p.id === item.productId);
      if (prod) {
        if (!item.isCustomPrice) {
          item.sellingPrice = prod.sellingPrice;
        }
        item.costPrice = prod.costPrice;
        if (item.quantity > prod.stock) {
          item.quantity = Math.max(0, prod.stock);
        }
      }
    });
    this.cart = this.cart.filter(i => i.quantity > 0);
    this.renderCart();
  }

  calculateTotals() {
    const settings = window.appStore.getSettings();
    let subtotal = 0;
    this.cart.forEach(item => {
      subtotal += item.sellingPrice * item.quantity;
    });

    const discountAmt = (subtotal * this.discountPercent) / 100;
    const taxable = Math.max(0, subtotal - discountAmt);
    const taxAmt = (taxable * settings.taxRate) / 100;
    const grandTotal = taxable + taxAmt;

    return {
      subtotal: Number(subtotal.toFixed(2)),
      discountAmount: Number(discountAmt.toFixed(2)),
      taxAmount: Number(taxAmt.toFixed(2)),
      grandTotal: Number(grandTotal.toFixed(2)),
      totalItems: this.cart.reduce((sum, i) => sum + i.quantity, 0)
    };
  }

  updateChangeDue() {
    if (!this.changeDueDisplay) return;
    const currency = window.appStore.getSettings().currency;
    const { grandTotal } = this.calculateTotals();
    const change = this.cashTendered - grandTotal;

    if (this.cashTendered <= 0) {
      this.changeDueDisplay.textContent = `${currency}0.00`;
      this.changeDueDisplay.style.color = "var(--text-secondary)";
    } else if (change >= 0) {
      this.changeDueDisplay.textContent = `${currency}${change.toFixed(2)}`;
      this.changeDueDisplay.style.color = "var(--accent-success)";
    } else {
      this.changeDueDisplay.textContent = `-${currency}${Math.abs(change).toFixed(2)}`;
      this.changeDueDisplay.style.color = "var(--accent-danger)";
    }
  }

  renderCart() {
    if (!this.cartItemsList) return;
    const currency = window.appStore.getSettings().currency;
    const totals = this.calculateTotals();

    if (this.cartCountBadge) {
      this.cartCountBadge.textContent = totals.totalItems;
    }

    if (this.cart.length === 0) {
      this.cartItemsList.innerHTML = `
        <div class="empty-state" style="padding: 2.5rem 1rem;">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
          <h3>Cart is Empty</h3>
          <p>Scan a barcode or tap products to build a bill.</p>
        </div>
      `;
    } else {
      this.cartItemsList.innerHTML = this.cart.map(item => {
        const itemLineTotal = (item.sellingPrice * item.quantity).toFixed(2);
        return `
          <div class="cart-item">
            <div class="cart-item-row1">
              <span class="cart-item-name" title="${item.name}">${item.name}</span>
              <button class="cart-item-del-btn" onclick="posTerminal.removeFromCart('${item.productId}')" title="Remove item">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div class="cart-item-row2">
              <div class="cart-item-price-wrap" id="cart-price-wrap-${item.productId}">
                <button type="button" class="btn-custom-price" onclick="posTerminal.startCartPriceEdit('${item.productId}')" title="Click to customize price for this bill">
                  <span>${currency}${item.sellingPrice.toFixed(2)}</span>
                  <span style="font-size:0.7rem; color:var(--text-muted);">each</span>
                  <svg class="edit-icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                ${item.isCustomPrice ? `<span class="badge-custom-price" title="Customized unit price">Custom</span>` : ''}
              </div>
              <div class="qty-control">
                <button class="qty-btn" onclick="posTerminal.updateQuantity('${item.productId}', -1)">-</button>
                <span class="qty-val">${item.quantity}</span>
                <button class="qty-btn" onclick="posTerminal.updateQuantity('${item.productId}', 1)">+</button>
              </div>
              <span class="cart-item-total">${currency}${itemLineTotal}</span>
            </div>
          </div>
        `;
      }).join("");
    }

    if (this.subtotalEl) this.subtotalEl.textContent = `${currency}${totals.subtotal.toFixed(2)}`;
    if (this.taxEl) this.taxEl.textContent = `${currency}${totals.taxAmount.toFixed(2)}`;
    if (this.discountEl) this.discountEl.textContent = `-${currency}${totals.discountAmount.toFixed(2)}`;
    if (this.grandTotalEl) this.grandTotalEl.textContent = `${currency}${totals.grandTotal.toFixed(2)}`;

    this.updateChangeDue();
  }

  handleCheckout() {
    if (this.cart.length === 0) {
      window.notifications.warning("Cart is Empty", "Add items to cart before checking out.");
      return;
    }

    const totals = this.calculateTotals();
    const customer = (this.customerInput && this.customerInput.value.trim()) || "Walk-in Customer";

    if (this.paymentMethod === "Cash" && this.cashTendered > 0 && this.cashTendered < totals.grandTotal) {
      window.notifications.warning("Insufficient Cash", "Amount tendered is less than Grand Total.");
      return;
    }

    try {
      const sale = window.appStore.createSale({
        items: this.cart,
        customerName: customer,
        paymentMethod: this.paymentMethod,
        discountPercent: this.discountPercent
      });

      window.notifications.playSuccessChime();
      window.notifications.success("Sale Completed!", `Invoice ${sale.invoiceNumber} generated.`);

      // Check if any low stock warnings resulted from this transaction
      const lowStockAlerts = window.appStore.getLowStockItems();
      const triggeredInSale = lowStockAlerts.filter(p => this.cart.some(c => c.productId === p.id));
      if (triggeredInSale.length > 0) {
        setTimeout(() => {
          window.notifications.warning(
            "Low Stock Alert!",
            `${triggeredInSale.map(p => `"${p.name}" (${p.stock} left)`).join(", ")}`
          );
        }, 500);
      }

      // Show Receipt Modal
      this.showReceiptModal(sale, this.cashTendered);

      // Reset cart
      this.cart = [];
      if (this.customerInput) this.customerInput.value = "";
      if (this.tenderInput) this.tenderInput.value = "";
      this.cashTendered = 0;
      this.renderCart();

    } catch (err) {
      window.notifications.danger("Checkout Failed", err.message);
    }
  }

  showReceiptModal(sale, tendered) {
    const modal = document.getElementById("modal-receipt");
    const container = document.getElementById("receipt-preview-content");
    if (!modal || !container) return;

    const settings = window.appStore.getSettings();
    const currency = settings.currency;
    const change = Math.max(0, (tendered || sale.grandTotal) - sale.grandTotal);

    container.innerHTML = `
      <div class="printable-receipt">
        <div class="receipt-header">
          <div class="receipt-title">${settings.storeName}</div>
          <div style="font-size: 11px; margin-top: 2px;">${settings.tagline}</div>
          <div style="font-size: 10px; margin-top: 2px;">${settings.address}</div>
          <div style="font-size: 10px;">Tel: ${settings.phone}</div>
          <div style="font-size: 10px;">Tax ID: ${settings.taxId}</div>
        </div>

        <div style="margin: 8px 0; font-size: 11px;">
          <div><strong>INVOICE:</strong> ${sale.invoiceNumber}</div>
          <div><strong>DATE:</strong> ${new Date(sale.timestamp).toLocaleString()}</div>
          <div><strong>CUSTOMER:</strong> ${sale.customerName}</div>
          <div><strong>PAYMENT:</strong> ${sale.paymentMethod}</div>
        </div>

        <table class="receipt-table">
          <thead>
            <tr>
              <th>ITEM</th>
              <th style="text-align:center;">QTY</th>
              <th style="text-align:right;">PRICE</th>
              <th style="text-align:right;">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${sale.items.map(item => `
              <tr>
                <td>${item.name}</td>
                <td style="text-align:center;">${item.quantity}</td>
                <td style="text-align:right;">${currency}${item.sellingPrice.toFixed(2)}</td>
                <td style="text-align:right;">${currency}${item.lineTotal.toFixed(2)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <div class="receipt-totals">
          <div class="receipt-line">
            <span>Subtotal:</span>
            <span>${currency}${sale.subtotal.toFixed(2)}</span>
          </div>
          ${sale.discountPercent > 0 ? `
            <div class="receipt-line">
              <span>Discount (${sale.discountPercent}%):</span>
              <span>-${currency}${sale.discountAmount.toFixed(2)}</span>
            </div>
          ` : ""}
          <div class="receipt-line">
            <span>Tax / GST (${sale.taxPercent}%):</span>
            <span>${currency}${sale.taxAmount.toFixed(2)}</span>
          </div>
          <div class="receipt-line bold">
            <span>TOTAL:</span>
            <span>${currency}${sale.grandTotal.toFixed(2)}</span>
          </div>
          ${sale.paymentMethod === "Cash" && tendered > 0 ? `
            <div class="receipt-line" style="margin-top: 4px; font-size: 11px;">
              <span>Cash Tendered:</span>
              <span>${currency}${tendered.toFixed(2)}</span>
            </div>
            <div class="receipt-line" style="font-size: 11px;">
              <span>Change Returned:</span>
              <span>${currency}${change.toFixed(2)}</span>
            </div>
          ` : ""}
        </div>

        <div class="receipt-footer">
          <div style="font-weight: bold; margin-bottom: 3px;">THANK YOU FOR YOUR BUSINESS!</div>
          <div>Please retain this receipt for warranty & returns.</div>
          <div style="margin-top: 8px; font-size: 9px; letter-spacing: 2px;">*** ${sale.invoiceNumber} ***</div>
        </div>
      </div>
    `;

    modal.classList.add("active");

    if (settings.autoPrintReceipt) {
      setTimeout(() => {
        if (window.printCurrentReceipt) {
          window.printCurrentReceipt();
        } else {
          window.print();
        }
      }, 350);
    }
  }

  // --- CUSTOM PRODUCT & PRICE ACTIONS ---
  openProductEdit(productId) {
    if (window.inventoryManager) {
      window.inventoryManager.openEditModal(productId);
    }
  }

  startCartPriceEdit(productId) {
    const item = this.cart.find(i => i.productId === productId);
    if (!item) return;

    const wrap = document.getElementById(`cart-price-wrap-${productId}`);
    if (!wrap) return;

    const currency = window.appStore.getSettings().currency;

    wrap.innerHTML = `
      <div class="cart-inline-price-editor" onclick="event.stopPropagation()">
        <span class="curr-prefix">${currency}</span>
        <input type="number" step="0.01" min="0" class="input-cart-price" id="input-cart-price-${productId}" value="${item.sellingPrice}">
        <button type="button" class="btn-save" onclick="posTerminal.saveCartCustomPrice('${productId}')" title="Apply price">✓</button>
        <button type="button" class="btn-cancel" onclick="posTerminal.renderCart()" title="Cancel">✕</button>
        ${item.isCustomPrice ? `<button type="button" class="btn-reset" onclick="posTerminal.resetCartPrice('${productId}')" title="Reset to original price">↺</button>` : ''}
      </div>
    `;

    const input = document.getElementById(`input-cart-price-${productId}`);
    if (input) {
      input.focus();
      input.select();
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          this.saveCartCustomPrice(productId);
        } else if (e.key === "Escape") {
          this.renderCart();
        }
      });
    }
  }

  saveCartCustomPrice(productId) {
    const input = document.getElementById(`input-cart-price-${productId}`);
    if (!input) return;

    const val = parseFloat(input.value);
    if (isNaN(val) || val < 0) {
      window.notifications.warning("Invalid Price", "Please enter a valid price amount.");
      return;
    }

    const item = this.cart.find(i => i.productId === productId);
    if (!item) return;

    item.sellingPrice = val;
    item.isCustomPrice = true;
    const currency = window.appStore.getSettings().currency;

    this.renderCart();
    window.notifications.success("Price Customized", `Unit price for "${item.name}" set to ${currency}${val.toFixed(2)} for this sale.`);
  }

  resetCartPrice(productId) {
    const item = this.cart.find(i => i.productId === productId);
    if (!item) return;

    const prod = window.appStore.getProductById(productId);
    if (prod) {
      item.sellingPrice = prod.sellingPrice;
      item.isCustomPrice = false;
      const currency = window.appStore.getSettings().currency;
      this.renderCart();
      window.notifications.info("Price Restored", `Reset "${item.name}" to catalog price ${currency}${prod.sellingPrice.toFixed(2)}.`);
    } else {
      this.renderCart();
    }
  }

  openCustomItemModal() {
    if (!this.modalCustomItem) return;

    // Reset form
    if (this.formCustomItem) this.formCustomItem.reset();
    if (this.customItemCatalogFields) this.customItemCatalogFields.style.display = "none";
    if (this.customItemSaveCatalog) this.customItemSaveCatalog.checked = false;

    // Populate categories
    const catSelect = document.getElementById("custom-item-category");
    if (catSelect) {
      const cats = window.appStore.getCategories().filter(c => c !== "All");
      catSelect.innerHTML = cats.map(c => `<option value="${c}">${c}</option>`).join("");
    }

    const currLabel = document.querySelectorAll("#modal-custom-item .currency-label");
    const currency = window.appStore.getSettings().currency;
    currLabel.forEach(el => el.textContent = currency);

    this.modalCustomItem.classList.add("active");
    const nameInput = document.getElementById("custom-item-name");
    if (nameInput) setTimeout(() => nameInput.focus(), 150);
  }

  handleCustomItemSubmit() {
    const name = document.getElementById("custom-item-name").value.trim();
    const price = parseFloat(document.getElementById("custom-item-price").value) || 0;
    const qty = parseInt(document.getElementById("custom-item-qty").value, 10) || 1;
    const category = document.getElementById("custom-item-category").value || "General";
    const saveToCatalog = this.customItemSaveCatalog && this.customItemSaveCatalog.checked;
    const cost = parseFloat(document.getElementById("custom-item-cost").value) || 0;
    const stock = parseInt(document.getElementById("custom-item-stock").value, 10) || 10;
    const currency = window.appStore.getSettings().currency;

    if (!name) {
      window.notifications.warning("Required Field", "Please enter a product or service name.");
      return;
    }

    if (saveToCatalog) {
      const newProd = window.appStore.addProduct({
        name: name,
        category: category,
        costPrice: cost,
        sellingPrice: price,
        stock: Math.max(stock, qty),
        unit: "pcs"
      });

      // Add to cart
      this.cart.push({
        productId: newProd.id,
        sku: newProd.sku,
        name: newProd.name,
        category: newProd.category,
        costPrice: newProd.costPrice,
        sellingPrice: newProd.sellingPrice,
        quantity: qty
      });

      window.notifications.success("Product Created", `Saved "${name}" (${currency}${price.toFixed(2)}) to Inventory and added to cart.`);
    } else {
      // One-off custom line item
      this.cart.push({
        productId: "custom-" + Date.now(),
        sku: "CUSTOM-" + Math.floor(100 + Math.random() * 900),
        name: name,
        category: category,
        costPrice: 0,
        sellingPrice: price,
        quantity: qty,
        isCustomPrice: true
      });

      window.notifications.success("Custom Item Added", `Added "${name}" (${currency}${price.toFixed(2)} x ${qty}) to current bill.`);
    }

    window.notifications.playScanBeep();
    this.closeModals();
    this.renderCart();
  }

  closeModals() {
    document.querySelectorAll(".modal-overlay").forEach(m => m.classList.remove("active"));
  }
}

window.initPOS = function() {
  window.posTerminal = new POSTerminal();
};
