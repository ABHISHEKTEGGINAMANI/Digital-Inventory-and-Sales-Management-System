/**
 * ApexFlow Regular Customers & VIP Intelligence Controller
 */

class CustomerManager {
  constructor() {
    this.searchQuery = "";
    this.sortBy = "totalSpent"; // "totalSpent" | "maxPurchase" | "orderCount" | "recent"
    this.tierFilter = "all";    // "all" | "Platinum" | "Gold" | "Silver" | "Bronze"
    this.selectedCustomer = null;

    this.initElements();
    this.bindEvents();
    this.render();
  }

  initElements() {
    this.tableBody = document.getElementById("customer-table-body");
    this.searchInput = document.getElementById("cust-search-input");
    this.sortSelect = document.getElementById("cust-sort-select");
    this.tierSelect = document.getElementById("cust-tier-filter");

    // KPI Elements
    this.kpiTopCustomer = document.getElementById("cust-kpi-top-name");
    this.kpiTopPurchase = document.getElementById("cust-kpi-top-spend");
    this.kpiTotalCount = document.getElementById("cust-kpi-total-count");
    this.kpiAvgSpend = document.getElementById("cust-kpi-avg-spend");
    this.kpiRepeatRatio = document.getElementById("cust-kpi-repeat-ratio");

    // Podium Container
    this.podiumContainer = document.getElementById("customer-podium-cards");

    // Modals
    this.modalHistory = document.getElementById("modal-customer-history");
    this.historyNameEl = document.getElementById("cust-history-name");
    this.historyMetaEl = document.getElementById("cust-history-meta");
    this.historyListEl = document.getElementById("cust-history-invoices");

    this.modalAdd = document.getElementById("modal-add-customer");
    this.formAdd = document.getElementById("form-add-customer");
  }

  bindEvents() {
    // Search input
    if (this.searchInput) {
      this.searchInput.addEventListener("input", (e) => {
        this.searchQuery = e.target.value.trim().toLowerCase();
        this.renderTable();
      });
    }

    // Sort select
    if (this.sortSelect) {
      this.sortSelect.addEventListener("change", (e) => {
        this.sortBy = e.target.value;
        this.render();
      });
    }

    // Tier filter
    if (this.tierSelect) {
      this.tierSelect.addEventListener("change", (e) => {
        this.tierFilter = e.target.value;
        this.renderTable();
      });
    }

    // Add Customer Button
    const btnAdd = document.getElementById("btn-add-customer");
    if (btnAdd) {
      btnAdd.addEventListener("click", () => this.openAddCustomerModal());
    }

    // Export CSV Button
    const btnExport = document.getElementById("btn-export-customers-csv");
    if (btnExport) {
      btnExport.addEventListener("click", () => this.exportCSV());
    }

    // Form Add Customer Submit
    if (this.formAdd) {
      this.formAdd.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = document.getElementById("add-cust-name").value.trim();
        const phone = document.getElementById("add-cust-phone").value.trim();
        const email = document.getElementById("add-cust-email").value.trim();
        const notes = document.getElementById("add-cust-notes").value.trim();

        if (!name) {
          window.notifications.warning("Required", "Please enter customer name.");
          return;
        }

        window.appStore.addCustomer({ name, phone, email, notes });
        window.notifications.success("Customer Registered", `"${name}" added to regular client roster.`);
        this.closeModals();
        this.render();
      });
    }

    // Store update listeners
    window.appStore.on("sale:completed", () => {
      this.render();
      this.syncPOSCustomerDatalist();
    });

    window.appStore.on("customers:updated", () => {
      this.render();
      this.syncPOSCustomerDatalist();
    });

    window.appStore.on("store:reset", () => {
      this.render();
      this.syncPOSCustomerDatalist();
    });
  }

  render() {
    const customers = window.appStore.getCustomerLeaderboard(this.sortBy);
    this.renderKPIs(customers);
    this.renderPodium(customers);
    this.renderTable(customers);
    this.syncPOSCustomerDatalist(customers);
    this.renderDashboardMirror(customers);
  }

  renderKPIs(customers) {
    if (!customers) customers = window.appStore.getCustomerLeaderboard(this.sortBy);
    const currency = window.appStore.getSettings().currency;

    const nonWalkIn = customers.filter(c => c.name.toLowerCase() !== "walk-in customer");
    const topCustomer = nonWalkIn.length > 0 ? nonWalkIn[0] : (customers[0] || null);

    const totalRegulars = nonWalkIn.length;
    const totalRevenueFromRegulars = nonWalkIn.reduce((sum, c) => sum + c.totalSpent, 0);
    const totalTransactions = window.appStore.getTransactions();
    const grossStoreRevenue = totalTransactions.reduce((sum, t) => sum + (t.status !== "Refunded" ? t.grandTotal : 0), 0);

    const avgSpend = totalRegulars > 0 ? (totalRevenueFromRegulars / totalRegulars) : 0;
    const repeatRatio = grossStoreRevenue > 0 ? ((totalRevenueFromRegulars / grossStoreRevenue) * 100) : 0;

    if (this.kpiTopCustomer && topCustomer) {
      this.kpiTopCustomer.textContent = topCustomer.name;
    }
    if (this.kpiTopPurchase && topCustomer) {
      this.kpiTopPurchase.textContent = `${currency}${topCustomer.totalSpent.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (this.kpiTotalCount) {
      this.kpiTotalCount.textContent = totalRegulars;
    }
    if (this.kpiAvgSpend) {
      this.kpiAvgSpend.textContent = `${currency}${avgSpend.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (this.kpiRepeatRatio) {
      this.kpiRepeatRatio.textContent = `${repeatRatio.toFixed(1)}%`;
    }

    // Sidebar badge
    const sidebarVipBadge = document.getElementById("sidebar-vip-count");
    if (sidebarVipBadge) {
      sidebarVipBadge.textContent = totalRegulars;
    }
  }

  renderPodium(customers) {
    if (!this.podiumContainer) return;
    if (!customers) customers = window.appStore.getCustomerLeaderboard(this.sortBy);
    const currency = window.appStore.getSettings().currency;

    const nonWalkIn = customers.filter(c => c.name.toLowerCase() !== "walk-in customer");
    const top3 = nonWalkIn.slice(0, 3);

    if (top3.length === 0) {
      this.podiumContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align:center; padding: 2rem; color:var(--text-muted);">
          No customer purchase transactions recorded yet. Complete sales at POS to build the VIP leaderboard.
        </div>
      `;
      return;
    }

    const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;
    const rankBadges = {
      0: { label: "#1 TOP PURCHASER", icon: "👑", class: "rank-1" },
      1: { label: "#2 TOP PURCHASER", icon: "🥈", class: "rank-2" },
      2: { label: "#3 TOP PURCHASER", icon: "🥉", class: "rank-3" }
    };

    this.podiumContainer.innerHTML = podiumOrder.map((c, idx) => {
      if (!c) return "";
      const actualRank = top3.indexOf(c);
      const meta = rankBadges[actualRank] || { label: `#${actualRank + 1}`, icon: "⭐", class: "" };
      const initials = c.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

      return `
        <div class="card podium-card ${meta.class}">
          <div class="podium-header">
            <span class="podium-badge">${meta.icon} ${meta.label}</span>
            <span class="badge ${c.tierBadgeClass}">${c.tierLabel}</span>
          </div>
          <div class="podium-avatar-wrap">
            <div class="podium-avatar">${initials}</div>
            <div>
              <h4 class="podium-name">${c.name}</h4>
              <div class="podium-orders">${c.orderCount} Order${c.orderCount !== 1 ? "s" : ""} Placed</div>
            </div>
          </div>
          <div class="podium-stats">
            <div class="podium-stat-item">
              <span class="podium-stat-label">Total Purchased</span>
              <span class="podium-stat-val primary">${currency}${c.totalSpent.toFixed(2)}</span>
            </div>
            <div class="podium-stat-item">
              <span class="podium-stat-label">Max Single Bill</span>
              <span class="podium-stat-val">${currency}${c.maxPurchase.toFixed(2)}</span>
            </div>
            <div class="podium-stat-item">
              <span class="podium-stat-label">Average Order</span>
              <span class="podium-stat-val">${currency}${c.aov.toFixed(2)}</span>
            </div>
          </div>
          <div class="podium-actions">
            <button class="btn btn-primary btn-sm" onclick="customerManager.quickBill('${c.name.replace(/'/g, "\\'")}')" title="Start new bill for ${c.name}">
              ⚡ New POS Bill
            </button>
            <button class="btn btn-secondary btn-sm" onclick="customerManager.viewHistory('${c.name.replace(/'/g, "\\'")}')" title="View past invoices">
              📜 History
            </button>
          </div>
        </div>
      `;
    }).join("");
  }

  renderTable(customers) {
    if (!this.tableBody) return;
    if (!customers) customers = window.appStore.getCustomerLeaderboard(this.sortBy);
    const currency = window.appStore.getSettings().currency;

    let filtered = customers;

    if (this.tierFilter !== "all") {
      filtered = filtered.filter(c => c.tier === this.tierFilter);
    }

    if (this.searchQuery) {
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(this.searchQuery) ||
        (c.phone && c.phone.toLowerCase().includes(this.searchQuery)) ||
        (c.email && c.email.toLowerCase().includes(this.searchQuery))
      );
    }

    if (filtered.length === 0) {
      this.tableBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align:center; padding: 2.5rem; color: var(--text-muted);">
            No customer accounts found matching your filters.
          </td>
        </tr>
      `;
      return;
    }

    const maxLifetimeSpend = Math.max(...customers.map(c => c.totalSpent), 1);

    this.tableBody.innerHTML = filtered.map((c, idx) => {
      const rank = idx + 1;
      let rankHtml = `<span class="rank-number">${rank}</span>`;
      if (rank === 1) rankHtml = `<span class="rank-medal gold">👑 #1</span>`;
      else if (rank === 2) rankHtml = `<span class="rank-medal silver">🥈 #2</span>`;
      else if (rank === 3) rankHtml = `<span class="rank-medal bronze">🥉 #3</span>`;

      const initials = c.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
      const spendPercent = Math.min(100, Math.max(5, (c.totalSpent / maxLifetimeSpend) * 100));

      const lastVisitStr = c.lastPurchaseDate 
        ? new Date(c.lastPurchaseDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : "No purchases";

      return `
        <tr>
          <td style="width:75px;">${rankHtml}</td>
          <td>
            <div style="display:flex; align-items:center; gap:0.75rem;">
              <div class="cust-table-avatar">${initials}</div>
              <div>
                <div style="font-weight:600; color:var(--text-primary);">${c.name}</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">
                  ${c.phone ? `Tel: ${c.phone} | ` : ""}${c.orderCount} bill${c.orderCount !== 1 ? "s" : ""}
                </div>
              </div>
            </div>
          </td>
          <td>
            <span class="badge ${c.tierBadgeClass}">${c.tierIcon} ${c.tierLabel}</span>
          </td>
          <td style="min-width:160px;">
            <div style="font-weight:700; color:var(--text-primary);">${currency}${c.totalSpent.toFixed(2)}</div>
            <div class="cust-spend-progress-wrap" title="${spendPercent.toFixed(1)}% of top purchaser">
              <div class="cust-spend-progress-bar" style="width:${spendPercent}%;"></div>
            </div>
          </td>
          <td><strong>${currency}${c.maxPurchase.toFixed(2)}</strong></td>
          <td>${c.orderCount}</td>
          <td>${currency}${c.aov.toFixed(2)}</td>
          <td><span style="font-size:0.8rem; color:var(--text-secondary);">${lastVisitStr}</span></td>
          <td>
            <div style="display:flex; gap:0.4rem;">
              <button class="btn btn-secondary btn-sm" onclick="customerManager.quickBill('${c.name.replace(/'/g, "\\'")}')" title="Ring up new sale for ${c.name}">
                ⚡ Bill
              </button>
              <button class="btn btn-secondary btn-sm" onclick="customerManager.viewHistory('${c.name.replace(/'/g, "\\'")}')" title="View Invoices">
                📜
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }

  renderDashboardMirror(customers) {
    const listEl = document.getElementById("dash-top-customers-list");
    if (!listEl) return;
    if (!customers) customers = window.appStore.getCustomerLeaderboard("totalSpent");
    const currency = window.appStore.getSettings().currency;

    const nonWalkIn = customers.filter(c => c.name.toLowerCase() !== "walk-in customer").slice(0, 4);
    if (nonWalkIn.length === 0) {
      listEl.innerHTML = `<p style="padding:1rem; color:var(--text-muted); font-size:0.825rem;">No customer records yet.</p>`;
      return;
    }

    listEl.innerHTML = nonWalkIn.map((c, i) => `
      <div style="display:flex; align-items:center; justify-content:space-between; padding:0.6rem 0; border-bottom:1px solid var(--border-subtle);">
        <div style="display:flex; align-items:center; gap:0.6rem;">
          <span style="font-size:0.8rem; font-weight:700; color:var(--text-muted); width:20px;">#${i+1}</span>
          <div>
            <div style="font-size:0.85rem; font-weight:600; color:var(--text-primary);">${c.name}</div>
            <div style="font-size:0.72rem; color:var(--text-muted);">${c.orderCount} Orders | Max Bill: ${currency}${c.maxPurchase.toFixed(2)}</div>
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:0.85rem; font-weight:700; color:var(--accent-secondary);">${currency}${c.totalSpent.toFixed(2)}</div>
          <span class="badge ${c.tierBadgeClass}" style="font-size:0.65rem; padding:1px 5px;">${c.tierLabel}</span>
        </div>
      </div>
    `).join("");
  }

  syncPOSCustomerDatalist(customers) {
    const datalist = document.getElementById("pos-customer-datalist");
    if (!datalist) return;
    if (!customers) customers = window.appStore.getCustomerLeaderboard("totalSpent");

    const nonWalkIn = customers.filter(c => c.name.toLowerCase() !== "walk-in customer");
    datalist.innerHTML = nonWalkIn.map(c => `
      <option value="${c.name}">${c.tierIcon} ${c.tierLabel} (Spent: ₹${c.totalSpent.toFixed(2)})</option>
    `).join("");
  }

  quickBill(customerName) {
    const custInput = document.getElementById("pos-customer-input");
    if (custInput) {
      custInput.value = customerName;
    }

    // Switch view to POS
    const posNav = document.getElementById("nav-pos");
    if (posNav) posNav.click();

    window.notifications.info("Customer Selected", `POS Terminal prepared for regular client: "${customerName}".`);
  }

  viewHistory(customerName) {
    const leaderboard = window.appStore.getCustomerLeaderboard("totalSpent");
    const c = leaderboard.find(cust => cust.name === customerName);
    if (!c) return;

    this.selectedCustomer = c;
    const currency = window.appStore.getSettings().currency;

    if (this.historyNameEl) this.historyNameEl.textContent = `${c.name} — Customer Ledger`;
    if (this.historyMetaEl) {
      this.historyMetaEl.innerHTML = `
        <span class="badge ${c.tierBadgeClass}">${c.tierIcon} ${c.tierLabel}</span>
        <span>• Total Lifetime Purchase: <strong>${currency}${c.totalSpent.toFixed(2)}</strong></span>
        <span>• Max Single Bill: <strong>${currency}${c.maxPurchase.toFixed(2)}</strong></span>
        <span>• Orders: <strong>${c.orderCount}</strong></span>
      `;
    }

    if (this.historyListEl) {
      if (c.invoices.length === 0) {
        this.historyListEl.innerHTML = `<p style="padding:2rem; text-align:center; color:var(--text-muted);">No invoices recorded for this customer.</p>`;
      } else {
        this.historyListEl.innerHTML = c.invoices.map(inv => `
          <div style="background:var(--bg-secondary); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:0.85rem; margin-bottom:0.75rem; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:0.5rem;">
            <div>
              <div style="font-weight:700; color:var(--text-primary); font-family:var(--font-mono);">${inv.invoiceNumber}</div>
              <div style="font-size:0.75rem; color:var(--text-muted);">${new Date(inv.timestamp).toLocaleString()} • ${inv.paymentMethod}</div>
              <div style="font-size:0.8rem; color:var(--text-secondary); margin-top:0.25rem;">
                ${inv.items.map(i => `${i.name} (x${i.quantity})`).join(", ")}
              </div>
            </div>
            <div style="display:flex; align-items:center; gap:0.85rem;">
              <div style="text-align:right;">
                <div style="font-size:1.05rem; font-weight:700; color:var(--accent-secondary);">${currency}${inv.grandTotal.toFixed(2)}</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">${inv.items.length} items</div>
              </div>
              <button class="btn btn-secondary btn-sm" onclick="analyticsManager.viewReceipt('${inv.id}')" title="Print Invoice">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                Bill
              </button>
            </div>
          </div>
        `).join("");
      }
    }

    if (this.modalHistory) this.modalHistory.classList.add("active");
  }

  openAddCustomerModal() {
    if (this.formAdd) this.formAdd.reset();
    if (this.modalAdd) this.modalAdd.classList.add("active");
    const nameInput = document.getElementById("add-cust-name");
    if (nameInput) setTimeout(() => nameInput.focus(), 150);
  }

  exportCSV() {
    const customers = window.appStore.getCustomerLeaderboard(this.sortBy);
    if (customers.length === 0) {
      window.notifications.warning("Empty", "No customer records available to export.");
      return;
    }

    const headers = ["Rank", "CustomerName", "LoyaltyTier", "TotalPurchases", "MaxPurchaseBill", "TotalOrders", "AOV", "Phone", "Email", "LastPurchaseDate"];
    const rows = customers.map((c, idx) => [
      idx + 1,
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.tierLabel}"`,
      c.totalSpent,
      c.maxPurchase,
      c.orderCount,
      c.aov,
      `"${c.phone}"`,
      `"${c.email}"`,
      `"${c.lastPurchaseDate || ""}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ApexFlow_VIP_Customers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.notifications.success("Export Complete", "Customer leaderboard CSV downloaded.");
  }

  closeModals() {
    document.querySelectorAll(".modal-overlay").forEach(m => m.classList.remove("active"));
  }
}

window.initCustomers = function() {
  window.customerManager = new CustomerManager();
};
