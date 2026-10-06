/**
 * ApexFlow Sales Analytics, Ledger & Reports Controller
 */

class AnalyticsManager {
  constructor() {
    this.timeframe = "30d"; // "today" | "7d" | "30d" | "all"
    this.historySearch = "";

    this.initElements();
    this.bindEvents();
    this.render();
  }

  initElements() {
    // Analytics KPIs
    this.kpiRevenue = document.getElementById("analytics-revenue");
    this.kpiProfit = document.getElementById("analytics-profit");
    this.kpiMargin = document.getElementById("analytics-margin");
    this.kpiOrders = document.getElementById("analytics-orders");
    this.kpiAov = document.getElementById("analytics-aov");
    this.kpiTax = document.getElementById("analytics-tax");

    // History Table
    this.historyTableBody = document.getElementById("history-table-body");
    this.historySearchInput = document.getElementById("history-search-input");

    // Chart containers
    this.revenueChartContainer = document.getElementById("svg-revenue-chart");
    this.topProductsContainer = document.getElementById("analytics-top-products");
    this.categoryBreakdownContainer = document.getElementById("analytics-category-breakdown");
  }

  bindEvents() {
    // Timeframe selector buttons
    document.querySelectorAll(".date-filter-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".date-filter-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.timeframe = btn.dataset.range;
        this.render();
      });
    });

    // History search
    if (this.historySearchInput) {
      this.historySearchInput.addEventListener("input", (e) => {
        this.historySearch = e.target.value.trim().toLowerCase();
        this.renderHistoryTable();
      });
    }

    // Export Sales CSV
    const exportSalesBtn = document.getElementById("btn-export-sales-csv");
    if (exportSalesBtn) {
      exportSalesBtn.addEventListener("click", () => this.exportSalesCSV());
    }

    // Store update listeners
    window.appStore.on("sale:completed", () => this.render());
    window.appStore.on("transaction:refunded", () => this.render());
    window.appStore.on("store:reset", () => this.render());
  }

  getFilteredTransactions() {
    const all = window.appStore.getTransactions();
    const now = new Date();

    if (this.timeframe === "all") return all;

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (this.timeframe === "today") {
      return all.filter(t => new Date(t.timestamp) >= startOfToday);
    }

    if (this.timeframe === "7d") {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return all.filter(t => new Date(t.timestamp) >= sevenDaysAgo);
    }

    if (this.timeframe === "30d") {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return all.filter(t => new Date(t.timestamp) >= thirtyDaysAgo);
    }

    return all;
  }

  render() {
    this.renderKPIs();
    this.renderRevenueChart();
    this.renderTopProducts();
    this.renderCategoryBreakdown();
    this.renderHistoryTable();
    this.renderDashboardMirror();
  }

  renderKPIs() {
    const txns = this.getFilteredTransactions().filter(t => t.status !== "Refunded");
    const currency = window.appStore.getSettings().currency;

    const totalRevenue = txns.reduce((sum, t) => sum + t.grandTotal, 0);
    const totalProfit = txns.reduce((sum, t) => sum + (t.netProfit || 0), 0);
    const totalTax = txns.reduce((sum, t) => sum + (t.taxAmount || 0), 0);
    const orderCount = txns.length;
    const aov = orderCount > 0 ? totalRevenue / orderCount : 0;
    const margin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    if (this.kpiRevenue) this.kpiRevenue.textContent = `${currency}${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (this.kpiProfit) this.kpiProfit.textContent = `${currency}${totalProfit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (this.kpiMargin) this.kpiMargin.textContent = `${margin.toFixed(1)}%`;
    if (this.kpiOrders) this.kpiOrders.textContent = orderCount;
    if (this.kpiAov) this.kpiAov.textContent = `${currency}${aov.toFixed(2)}`;
    if (this.kpiTax) this.kpiTax.textContent = `${currency}${totalTax.toFixed(2)}`;
  }

  renderDashboardMirror() {
    // Updates the cards on the main Home Dashboard tab
    const txns = window.appStore.getTransactions().filter(t => t.status !== "Refunded");
    const currency = window.appStore.getSettings().currency;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayTxns = txns.filter(t => new Date(t.timestamp) >= startOfToday);
    const todaySales = todayTxns.reduce((sum, t) => sum + t.grandTotal, 0);
    const todayProfit = todayTxns.reduce((sum, t) => sum + (t.netProfit || 0), 0);

    const elTodaySales = document.getElementById("dash-today-sales");
    const elTodayOrders = document.getElementById("dash-today-orders");
    const elTodayProfit = document.getElementById("dash-today-profit");

    if (elTodaySales) elTodaySales.textContent = `${currency}${todaySales.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (elTodayOrders) elTodayOrders.textContent = `${todayTxns.length} Invoices`;
    if (elTodayProfit) elTodayProfit.textContent = `${currency}${todayProfit.toFixed(2)}`;

    // Mirror recent transactions on dashboard
    const dashRecent = document.getElementById("dash-recent-transactions");
    if (dashRecent) {
      const recents = txns.slice(0, 6);
      if (recents.length === 0) {
        dashRecent.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);">No sales recorded yet.</td></tr>`;
      } else {
        dashRecent.innerHTML = recents.map(t => `
          <tr>
            <td><strong>${t.invoiceNumber}</strong></td>
            <td>${t.customerName}</td>
            <td><span class="badge badge-secondary">${t.paymentMethod}</span></td>
            <td>${new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
            <td><strong>${currency}${t.grandTotal.toFixed(2)}</strong></td>
          </tr>
        `).join("");
      }
    }
  }

  renderRevenueChart() {
    if (!this.revenueChartContainer) return;
    const txns = this.getFilteredTransactions().filter(t => t.status !== "Refunded");
    const currency = window.appStore.getSettings().currency;

    // Group transactions by date buckets
    const bucketMap = {};
    const daysToShow = this.timeframe === "today" ? 12 : (this.timeframe === "7d" ? 7 : 14);

    const now = new Date();
    for (let i = daysToShow - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      bucketMap[key] = 0;
    }

    txns.forEach(t => {
      const d = new Date(t.timestamp);
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (bucketMap[key] !== undefined) {
        bucketMap[key] += t.grandTotal;
      }
    });

    const labels = Object.keys(bucketMap);
    const values = Object.values(bucketMap);
    const maxVal = Math.max(...values, 100);

    const width = 640;
    const height = 240;
    const padX = 45;
    const padY = 30;

    const chartW = width - padX * 2;
    const chartH = height - padY * 2;

    const points = values.map((val, idx) => {
      const x = padX + (idx / Math.max(1, values.length - 1)) * chartW;
      const y = height - padY - (val / maxVal) * chartH;
      return { x, y, val, label: labels[idx] };
    });

    // Generate smooth SVG path
    let pathD = "";
    if (points.length > 0) {
      pathD = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const cpX1 = prev.x + (curr.x - prev.x) / 2;
        const cpY1 = prev.y;
        const cpX2 = prev.x + (curr.x - prev.x) / 2;
        const cpY2 = curr.y;
        pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${curr.x} ${curr.y}`;
      }
    }

    const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padY} L ${points[0].x} ${height - padY} Z`;

    // Horizontal grid lines
    const gridLines = [0, 0.25, 0.5, 0.75, 1].map(pct => {
      const y = height - padY - pct * chartH;
      const valLabel = `${currency}${Math.round(pct * maxVal)}`;
      return `
        <line x1="${padX}" y1="${y}" x2="${width - padX}" y2="${y}" class="chart-grid-line" />
        <text x="${padX - 8}" y="${y + 4}" class="chart-axis-label" text-anchor="end">${valLabel}</text>
      `;
    }).join("");

    // X Axis Labels (sample 6 labels max)
    const labelStep = Math.max(1, Math.floor(labels.length / 6));
    const xLabels = points.filter((_, idx) => idx % labelStep === 0 || idx === points.length - 1).map(p => `
      <text x="${p.x}" y="${height - 8}" class="chart-axis-label" text-anchor="middle">${p.label}</text>
    `).join("");

    // Dots
    const dotsHtml = points.map(p => `
      <circle cx="${p.x}" cy="${p.y}" r="4" class="chart-dot">
        <title>${p.label}: ${currency}${p.val.toFixed(2)}</title>
      </circle>
    `).join("");

    this.revenueChartContainer.innerHTML = `
      <svg class="custom-svg-chart" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
        <defs>
          <linearGradient id="revenueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#6366f1" stop-opacity="0.45"/>
            <stop offset="100%" stop-color="#6366f1" stop-opacity="0.0"/>
          </linearGradient>
        </defs>
        ${gridLines}
        <path d="${areaD}" class="chart-area" />
        <path d="${pathD}" class="chart-line" />
        ${dotsHtml}
        ${xLabels}
      </svg>
    `;
  }

  renderTopProducts() {
    if (!this.topProductsContainer) return;
    const txns = this.getFilteredTransactions().filter(t => t.status !== "Refunded");
    const currency = window.appStore.getSettings().currency;

    const prodStats = {};
    txns.forEach(t => {
      t.items.forEach(item => {
        if (!prodStats[item.productId]) {
          prodStats[item.productId] = {
            name: item.name,
            qty: 0,
            revenue: 0
          };
        }
        prodStats[item.productId].qty += item.quantity;
        prodStats[item.productId].revenue += item.lineTotal;
      });
    });

    const sorted = Object.values(prodStats).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    if (sorted.length === 0) {
      this.topProductsContainer.innerHTML = `<div class="empty-state" style="padding:1.5rem;"><p>No sales data for this period.</p></div>`;
      return;
    }

    this.topProductsContainer.innerHTML = sorted.map((p, idx) => `
      <div class="rank-item">
        <div class="rank-badge">${idx + 1}</div>
        <div class="rank-details">
          <div class="rank-name">${p.name}</div>
          <div class="rank-sales-count">${p.qty} units sold</div>
        </div>
        <div class="rank-revenue">${currency}${p.revenue.toFixed(2)}</div>
      </div>
    `).join("");
  }

  renderCategoryBreakdown() {
    if (!this.categoryBreakdownContainer) return;
    const txns = this.getFilteredTransactions().filter(t => t.status !== "Refunded");
    const currency = window.appStore.getSettings().currency;

    const catStats = {};
    let totalCatRevenue = 0;

    txns.forEach(t => {
      t.items.forEach(item => {
        const cat = item.category || "General";
        catStats[cat] = (catStats[cat] || 0) + item.lineTotal;
        totalCatRevenue += item.lineTotal;
      });
    });

    const entries = Object.entries(catStats).sort((a, b) => b[1] - a[1]);
    const palette = ["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];

    if (entries.length === 0 || totalCatRevenue === 0) {
      this.categoryBreakdownContainer.innerHTML = `<div class="empty-state" style="padding:1.5rem;"><p>No category breakdown available.</p></div>`;
      return;
    }

    this.categoryBreakdownContainer.innerHTML = `
      <div style="display:flex; height: 16px; border-radius: var(--radius-full); overflow: hidden; margin-bottom: 1rem; background: var(--bg-glass);">
        ${entries.map(([cat, val], idx) => {
          const pct = ((val / totalCatRevenue) * 100).toFixed(1);
          const color = palette[idx % palette.length];
          return `<div style="width: ${pct}%; background: ${color};" title="${cat}: ${pct}%"></div>`;
        }).join("")}
      </div>
      <div class="donut-legend-list">
        ${entries.map(([cat, val], idx) => {
          const pct = ((val / totalCatRevenue) * 100).toFixed(1);
          const color = palette[idx % palette.length];
          return `
            <div class="legend-item">
              <div style="display:flex; align-items:center;">
                <span class="legend-color-dot" style="background:${color};"></span>
                <span>${cat}</span>
              </div>
              <div style="font-weight:600;">${currency}${val.toFixed(2)} (${pct}%)</div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  renderHistoryTable() {
    if (!this.historyTableBody) return;
    const transactions = window.appStore.getTransactions();
    const currency = window.appStore.getSettings().currency;

    let filtered = transactions;
    if (this.historySearch) {
      filtered = filtered.filter(t => 
        t.invoiceNumber.toLowerCase().includes(this.historySearch) ||
        t.customerName.toLowerCase().includes(this.historySearch) ||
        t.paymentMethod.toLowerCase().includes(this.historySearch) ||
        t.items.some(i => i.name.toLowerCase().includes(this.historySearch))
      );
    }

    if (filtered.length === 0) {
      this.historyTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding: 2.5rem; color: var(--text-muted);">
            No sales transactions found.
          </td>
        </tr>
      `;
      return;
    }

    this.historyTableBody.innerHTML = filtered.map(t => {
      const isRefunded = t.status === "Refunded";
      return `
        <tr style="${isRefunded ? "opacity: 0.6;" : ""}">
          <td><strong>${t.invoiceNumber}</strong></td>
          <td>${new Date(t.timestamp).toLocaleDateString()} ${new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
          <td>${t.customerName}</td>
          <td>
            <span class="badge badge-secondary">${t.paymentMethod}</span>
          </td>
          <td>
            <span class="badge ${isRefunded ? "badge-danger" : "badge-success"}">
              ${t.status}
            </span>
          </td>
          <td><strong>${currency}${t.grandTotal.toFixed(2)}</strong></td>
          <td>
            <div style="display:flex; gap:0.4rem;">
              <button class="btn btn-secondary btn-sm" onclick="analyticsManager.viewReceipt('${t.id}')" title="Reprint / View Receipt">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                Receipt
              </button>
              ${!isRefunded ? `
                <button class="btn btn-outline-danger btn-sm" onclick="analyticsManager.refundSale('${t.id}')" title="Refund Sale & Restock Inventory">
                  Refund
                </button>
              ` : ""}
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }

  viewReceipt(transactionId) {
    const txn = window.appStore.getTransactions().find(t => t.id === transactionId);
    if (!txn) return;
    window.posTerminal.showReceiptModal(txn, txn.grandTotal);
  }

  refundSale(transactionId) {
    const txn = window.appStore.getTransactions().find(t => t.id === transactionId);
    if (!txn) return;

    const currency = window.appStore ? window.appStore.getSettings().currency : "₹";
    if (confirm(`Refund ${txn.invoiceNumber} for ${currency}${txn.grandTotal.toFixed(2)}? This will restore sold quantities back to inventory.`)) {
      window.appStore.refundTransaction(transactionId);
      window.notifications.warning("Transaction Refunded", `${txn.invoiceNumber} marked as Refunded and inventory restored.`);
    }
  }

  exportSalesCSV() {
    const transactions = window.appStore.getTransactions();
    if (transactions.length === 0) {
      window.notifications.warning("Empty", "No transactions available to export.");
      return;
    }

    const headers = ["InvoiceNumber", "Date", "Customer", "PaymentMethod", "Status", "Subtotal", "Discount", "Tax", "GrandTotal", "NetProfit"];
    const rows = transactions.map(t => [
      `"${t.invoiceNumber}"`,
      `"${t.timestamp}"`,
      `"${t.customerName.replace(/"/g, '""')}"`,
      `"${t.paymentMethod}"`,
      `"${t.status}"`,
      t.subtotal,
      t.discountAmount,
      t.taxAmount,
      t.grandTotal,
      t.netProfit || 0
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ApexFlow_Sales_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.notifications.success("Export Complete", "Sales ledger CSV downloaded.");
  }
}

window.initAnalytics = function() {
  window.analyticsManager = new AnalyticsManager();
};
