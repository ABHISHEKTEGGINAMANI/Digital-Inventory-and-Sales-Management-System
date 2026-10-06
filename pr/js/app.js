/**
 * ApexFlow Master Application Coordinator
 */

document.addEventListener("DOMContentLoaded", () => {
  // 1. Initialize Components
  window.initPOS();
  window.initInventory();
  window.initAnalytics();
  window.initCustomers();

  // 2. Tab Navigation
  const navItems = document.querySelectorAll(".nav-item[data-view]");
  const viewSections = document.querySelectorAll(".view-section");
  const pageTitle = document.getElementById("header-page-title");
  const pageSubtitle = document.getElementById("header-page-subtitle");

  const viewMeta = {
    dashboard: { title: "Executive Dashboard", subtitle: "Real-time store performance, revenue & inventory alerts" },
    pos: { title: "POS Billing Terminal", subtitle: "Scan items, apply discounts & generate tax invoices" },
    inventory: { title: "Inventory & Stock Catalog", subtitle: "Manage products, costs, profit margins & restock levels" },
    alerts: { title: "Low-Stock Alert & Procurement Center", subtitle: "Urgent inventory warnings and purchase reorder planning" },
    customers: { title: "Regular Customers & VIP Intelligence", subtitle: "Customer lifetime value, maximum purchases & loyalty rankings" },
    analytics: { title: "Sales Analytics & Reports", subtitle: "Revenue trends, best sellers & financial ledgers" },
    settings: { title: "Store Settings & Preferences", subtitle: "Configure store details, tax rates & backup data" }
  };

  function switchView(viewName) {
    navItems.forEach(item => {
      item.classList.toggle("active", item.dataset.view === viewName);
    });

    viewSections.forEach(sec => {
      const isTarget = sec.id === `view-${viewName}`;
      sec.classList.toggle("active", isTarget);
    });

    if (viewMeta[viewName]) {
      if (pageTitle) pageTitle.textContent = viewMeta[viewName].title;
      if (pageSubtitle) pageSubtitle.textContent = viewMeta[viewName].subtitle;
    }

    // Close mobile sidebar if open
    const sidebar = document.querySelector(".app-sidebar");
    if (sidebar) sidebar.classList.remove("open");

    // Contextual renders on tab activation
    if (viewName === "inventory") {
      window.inventoryManager.render();
    } else if (viewName === "analytics") {
      window.analyticsManager.render();
    } else if (viewName === "customers") {
      window.customerManager.render();
    } else if (viewName === "pos") {
      window.posTerminal.renderProducts();
      window.posTerminal.renderCart();
      const barcodeInput = document.getElementById("pos-barcode-input");
      if (barcodeInput) setTimeout(() => barcodeInput.focus(), 150);
    } else if (viewName === "dashboard") {
      window.inventoryManager.renderKPIs();
      window.inventoryManager.renderProcurementAlerts();
      window.analyticsManager.renderDashboardMirror();
      if (window.customerManager) window.customerManager.renderDashboardMirror();
    }
  }

  navItems.forEach(item => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const targetView = item.dataset.view;
      if (targetView) switchView(targetView);
    });
  });

  // Global links to specific views
  document.querySelectorAll("[data-navigate]").forEach(el => {
    el.addEventListener("click", () => {
      switchView(el.dataset.navigate);
    });
  });

  // Global action handlers (e.g. data-action="add-product")
  document.addEventListener("click", (e) => {
    const actionEl = e.target.closest("[data-action='add-product']");
    if (actionEl) {
      e.preventDefault();
      window.openAddProductModal();
    }
  });

  window.openAddProductModal = function(initialData = {}) {
    if (window.inventoryManager) {
      window.inventoryManager.openAddModal(initialData);
    }
  };

  // 3. Theme Toggle
  const themeToggleBtn = document.getElementById("btn-theme-toggle");
  const storedTheme = window.appStore.getSettings().theme || "dark";
  document.documentElement.setAttribute("data-theme", storedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") || "dark";
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      window.appStore.updateSettings({ theme: next });
      window.notifications.info("Theme Updated", `Switched to ${next} mode.`);
    });
  }

  // 4. Mobile Menu Toggle
  const menuToggleBtn = document.querySelector(".menu-toggle");
  const sidebar = document.querySelector(".app-sidebar");
  if (menuToggleBtn && sidebar) {
    menuToggleBtn.addEventListener("click", () => {
      sidebar.classList.toggle("open");
    });
  }

  // 5. Global Modal Closing
  document.querySelectorAll(".modal-close-btn, .modal-cancel-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".modal-overlay").forEach(m => m.classList.remove("active"));
    });
  });

  document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.classList.remove("active");
      }
    });
  });

  // 6. Settings Page Form Handlers
  const formSettings = document.getElementById("form-settings");
  if (formSettings) {
    const s = window.appStore.getSettings();
    document.getElementById("set-store-name").value = s.storeName || "";
    document.getElementById("set-tagline").value = s.tagline || "";
    document.getElementById("set-address").value = s.address || "";
    document.getElementById("set-phone").value = s.phone || "";
    document.getElementById("set-email").value = s.email || "";
    document.getElementById("set-tax-id").value = s.taxId || "";
    document.getElementById("set-currency").value = s.currency || "₹";
    document.getElementById("set-tax-rate").value = s.taxRate || 8.5;
    document.getElementById("set-reorder-threshold").value = s.lowStockThresholdDefault || 8;
    document.getElementById("set-sound-alerts").checked = s.soundAlerts !== false;

    formSettings.addEventListener("submit", (e) => {
      e.preventDefault();
      const updated = {
        storeName: document.getElementById("set-store-name").value.trim(),
        tagline: document.getElementById("set-tagline").value.trim(),
        address: document.getElementById("set-address").value.trim(),
        phone: document.getElementById("set-phone").value.trim(),
        email: document.getElementById("set-email").value.trim(),
        taxId: document.getElementById("set-tax-id").value.trim(),
        currency: document.getElementById("set-currency").value,
        taxRate: parseFloat(document.getElementById("set-tax-rate").value) || 0,
        lowStockThresholdDefault: parseInt(document.getElementById("set-reorder-threshold").value, 10) || 5,
        soundAlerts: document.getElementById("set-sound-alerts").checked
      };

      window.appStore.updateSettings(updated);
      window.notifications.success("Settings Saved", "Store configuration updated successfully.");

      // Refresh headers
      document.querySelectorAll(".currency-label").forEach(el => el.textContent = updated.currency);
      const brandName = document.querySelector(".brand-name");
      if (brandName) brandName.textContent = updated.storeName;
    });
  }

  // Backup & Restore Actions
  const btnExportBackup = document.getElementById("btn-export-backup");
  if (btnExportBackup) {
    btnExportBackup.addEventListener("click", () => {
      const json = window.appStore.exportBackupJSON();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ApexFlow_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.notifications.success("Backup Exported", "Complete database JSON backup downloaded.");
    });
  }

  const btnImportBackup = document.getElementById("btn-import-backup");
  const fileImportInput = document.getElementById("input-import-backup");
  if (btnImportBackup && fileImportInput) {
    btnImportBackup.addEventListener("click", () => fileImportInput.click());
    fileImportInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const success = window.appStore.importBackupJSON(event.target.result);
        if (success) {
          window.notifications.success("Data Restored", "All products, sales, and settings loaded.");
          setTimeout(() => location.reload(), 1000);
        } else {
          window.notifications.danger("Import Failed", "Invalid backup file.");
        }
      };
      reader.readAsText(file);
    });
  }

  const btnResetDemo = document.getElementById("btn-reset-demo");
  if (btnResetDemo) {
    btnResetDemo.addEventListener("click", () => {
      if (confirm("Reset everything back to default demo data? All new products and transactions will be re-initialized.")) {
        window.appStore.resetToDefaults();
        window.notifications.info("Reset Complete", "Default inventory and demo sales restored.");
        setTimeout(() => location.reload(), 800);
      }
    });
  }

  // Restock All button in Alert Center
  const btnRestockAll = document.getElementById("btn-restock-all-alerts");
  if (btnRestockAll) {
    btnRestockAll.addEventListener("click", () => {
      window.inventoryManager.restockAllLowItems();
    });
  }

  // Dedicated Print Receipt Engine
  window.printCurrentReceipt = function() {
    const receiptContainer = document.getElementById("receipt-preview-content");
    if (!receiptContainer || !receiptContainer.innerHTML.trim()) {
      window.notifications.warning("No Receipt", "There is no receipt content to print.");
      return;
    }

    const modalReceipt = document.getElementById("modal-receipt");
    if (modalReceipt) modalReceipt.classList.add("active");

    // Close any other modals
    document.querySelectorAll(".modal-overlay:not(#modal-receipt)").forEach(m => m.classList.remove("active"));

    // Create or reuse hidden isolated printing iframe for clean thermal/bill printing
    let printFrame = document.getElementById("apex-print-frame");
    if (!printFrame) {
      printFrame = document.createElement("iframe");
      printFrame.id = "apex-print-frame";
      printFrame.style.position = "fixed";
      printFrame.style.right = "0";
      printFrame.style.bottom = "0";
      printFrame.style.width = "0";
      printFrame.style.height = "0";
      printFrame.style.border = "0";
      printFrame.style.visibility = "hidden";
      document.body.appendChild(printFrame);
    }

    try {
      const doc = printFrame.contentWindow.document;
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Customer Receipt</title>
          <style>
            @page {
              margin: 4mm;
              size: auto;
            }
            body {
              margin: 0;
              padding: 0;
              background: #ffffff;
              color: #000000;
              font-family: 'JetBrains Mono', 'Courier New', Courier, monospace;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .printable-receipt {
              width: 80mm;
              max-width: 320px;
              margin: 0 auto;
              padding: 6mm 4mm;
              font-size: 11px;
              line-height: 1.4;
              color: #000000;
              box-sizing: border-box;
            }
            .receipt-header {
              text-align: center;
              border-bottom: 1px dashed #000;
              padding-bottom: 8px;
              margin-bottom: 8px;
            }
            .receipt-title {
              font-size: 15px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.04em;
            }
            .receipt-table {
              width: 100%;
              border-collapse: collapse;
              margin: 8px 0;
            }
            .receipt-table th {
              border-bottom: 1px solid #000;
              text-align: left;
              font-size: 10px;
              padding: 4px 0;
            }
            .receipt-table td {
              padding: 4px 0;
              font-size: 11px;
              vertical-align: top;
            }
            .receipt-totals {
              border-top: 1px dashed #000;
              padding-top: 6px;
              margin-top: 6px;
            }
            .receipt-line {
              display: flex;
              justify-content: space-between;
              margin-bottom: 3px;
            }
            .receipt-line.bold {
              font-weight: 800;
              font-size: 13px;
              border-top: 1px solid #000;
              padding-top: 5px;
              margin-top: 5px;
            }
            .receipt-footer {
              text-align: center;
              margin-top: 12px;
              font-size: 10px;
              border-top: 1px dashed #000;
              padding-top: 8px;
            }
          </style>
        </head>
        <body>
          ${receiptContainer.innerHTML}
        </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        printFrame.contentWindow.focus();
        printFrame.contentWindow.print();
      }, 200);
    } catch (e) {
      window.print();
    }
  };

  // Print Receipt Button in modal
  const btnPrintReceipt = document.getElementById("btn-print-receipt");
  if (btnPrintReceipt) {
    btnPrintReceipt.addEventListener("click", () => {
      window.printCurrentReceipt();
    });
  }

  // Keyboard Shortcuts
  window.addEventListener("keydown", (e) => {
    // Ctrl + P -> Print Receipt if modal open
    if ((e.ctrlKey || e.metaKey) && (e.key === "p" || e.key === "P")) {
      const modalReceipt = document.getElementById("modal-receipt");
      if (modalReceipt && modalReceipt.classList.contains("active")) {
        e.preventDefault();
        window.printCurrentReceipt();
        return;
      }
    }

    // ESC to close modal
    if (e.key === "Escape") {
      document.querySelectorAll(".modal-overlay").forEach(m => m.classList.remove("active"));
    }
    // F1 -> POS
    if (e.key === "F1") {
      e.preventDefault();
      switchView("pos");
    }
    // F2 -> Inventory
    if (e.key === "F2") {
      e.preventDefault();
      switchView("inventory");
    }
    // F3 -> Analytics
    if (e.key === "F3") {
      e.preventDefault();
      switchView("analytics");
    }
    // F4 -> Low Stock Alerts
    if (e.key === "F4") {
      e.preventDefault();
      switchView("alerts");
    }
    // F6 -> Regular Customers
    if (e.key === "F6") {
      e.preventDefault();
      switchView("customers");
    }
    // F7 or Alt+N -> Add New Product
    if (e.key === "F7" || (e.altKey && e.key.toLowerCase() === "n")) {
      e.preventDefault();
      window.openAddProductModal();
    }
  });

  // Initial checks and render
  window.inventoryManager.renderKPIs();
  window.inventoryManager.renderProcurementAlerts();
  window.analyticsManager.renderDashboardMirror();
  if (window.customerManager) window.customerManager.render();

  // Initial Welcome notification
  setTimeout(() => {
    const alerts = window.appStore.getAllAlerts();
    if (alerts.totalAlerts > 0) {
      window.notifications.warning(
        "Low Stock Notice",
        `Attention: ${alerts.totalAlerts} products are currently below reorder levels.`
      );
    }
  }, 1000);
});
