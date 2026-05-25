// Fix: Centralized text encoder utility to sanitize raw strings against script injections
function escapeDashboardHTML(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

async function loadUserProfile() {
    try {
        const user = await FinanceAPI.request('/auth/profile');

        // Fix: Standardized property matching on user.account_number
        const accEl = document.getElementById('display-account-num');
        if (accEl) accEl.textContent = `**** ${user.account_number || '0000'}`;

        const banner = document.querySelector('.summary-banner h2');
        if (banner) banner.textContent = `Welcome back, ${escapeDashboardHTML(user.username)}!`;

    } catch (err) {
        console.error("Profile Load Error:", err);
    }
}

let monthlyChart = null;
let globalTransactionsCache = [];

document.addEventListener('DOMContentLoaded', () => {
    // Initialize profile metadata alongside primary data records
    loadUserProfile();
    loadDashboardData();

    const chartFilter = document.getElementById('chartTimeFilter');
    if (chartFilter) {
        chartFilter.addEventListener('change', () => {
            if (globalTransactionsCache.length > 0) {
                renderChart(globalTransactionsCache);
            }
        });
    }

    const navToggle = document.getElementById('nav-toggle');
    if (navToggle) {
        navToggle.addEventListener('change', () => {
            setTimeout(() => {
                if (monthlyChart) monthlyChart.resize();
            }, 100);
        });
    }

    const searchInput = document.querySelector('.search-bar input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const items = document.querySelectorAll('#transaction-list li');

            items.forEach(item => {
                const text = item.textContent.toLowerCase();
                item.style.display = text.includes(term) ? 'flex' : 'none';
            });
        });
    }
});

async function loadDashboardData() {
    try {
        if (!document.getElementById('monthlyChart') && !document.getElementById('transaction-list')) {
            return;
        }

        // 1. Fetch transaction updates asynchronously
        const transactions = await FinanceAPI.request('/finance');
        renderSummary(transactions);
        renderList(transactions);
        renderChart(transactions);

        // 2. Resolve account layout discrepancies with unified fallback keys
        const profile = await FinanceAPI.request('/auth/profile');
        const accEl = document.getElementById('display-account-num');
        if (profile && accEl) {
            accEl.textContent = `**** ${profile.account_number || profile.acc_number || '0000'}`;
        }

        // 3. Render contextual metric bars cleanly
        const budgets = await FinanceAPI.request('/budget/status');
        renderDashboardBudgets(budgets);
        updateBudgetAlert(budgets);

    } catch (err) {
        console.error('Dashboard Load Error:', err);
    }
}

function renderDashboardBudgets(budgets) {
    const container = document.getElementById('dashboard-budget-list');
    if (!container) return;

    const sortedBudgets = [...budgets].sort((a, b) => {
        const limA = parseFloat(a.limit_amount) || 0;
        const limB = parseFloat(b.limit_amount) || 0;
        const spentA = parseFloat(a.spent_amount) || 0;
        const spentB = parseFloat(b.spent_amount) || 0;

        const percentA = limA > 0 ? (spentA / limA) : 0;
        const percentB = limB > 0 ? (spentB / limB) : 0;

        return percentB - percentA;
    });

    container.innerHTML = sortedBudgets.slice(0, 3).map(b => {
        const limit = parseFloat(b.limit_amount) || 0;
        const spent = parseFloat(b.spent_amount) || 0;

        const percent = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
        const isOver = spent > limit;

        return `
            <div style="margin-bottom: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <!-- Fix: Injected properties pass through HTML isolation wrappers -->
                    <small style="font-weight: 500;">${escapeDashboardHTML(b.category_name)} (${Math.round(percent)}%)</small>
                    <small style="opacity: 0.7; font-size: 0.75rem;">$${spent.toFixed(0)}</small>
                </div>
                <div class="progress-bar" style="height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden; margin-top: 4px;">
                    <div style="width: ${percent}%; height: 100%; background: ${isOver ? 'var(--danger)' : 'var(--accent)'}; transition: width 0.4s ease;"></div>
                </div>
            </div>
        `;
    }).join('');
}

function renderSummary(data) {
    let income = 0, expense = 0;
    data.forEach(t => {
        const val = parseFloat(t.amount) || 0;
        t.type === 'income' ? income += val : expense += val;
    });

    const incEl = document.getElementById('total-income');
    const expEl = document.getElementById('total-expense');
    const netEl = document.getElementById('net-balance');

    if (incEl) incEl.textContent = `+$${income.toFixed(2)}`;
    if (expEl) expEl.textContent = `-$${expense.toFixed(2)}`;
    if (netEl) netEl.textContent = `$${(income - expense).toFixed(2)}`;
}

function renderList(data) {
    const listEl = document.getElementById('transaction-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    const recent = [...data]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

    recent.forEach(tx => {
        const amt = parseFloat(tx.amount) || 0;
        const li = document.createElement('li');
        li.className = 'transaction-item';
        li.innerHTML = `
            <div class="tx-info">
                <!-- Fix: Added escape security to dynamically created list configurations -->
                <strong>${escapeDashboardHTML(tx.description)}</strong>
                <small>${new Date(tx.date).toLocaleDateString()}</small>
            </div>
            <span class="tx-amount ${tx.type}">
                ${tx.type === 'income' ? '+' : '-'}$${amt.toFixed(2)}
            </span>
        `;
        listEl.appendChild(li);
    });
}

function renderChart(data) {
    const chartCanvas = document.getElementById('monthlyChart');
    if (!chartCanvas) return;
    const ctx = chartCanvas.getContext('2d');

    globalTransactionsCache = data;

    const filterEl = document.getElementById('chartTimeFilter');
    const filterType = filterEl ? filterEl.value : 'months';

    const dataMap = {};
    const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));

    sortedData.forEach(t => {
        const dateObj = new Date(t.date);
        let timeKey = '';

        if (filterType === 'days') {
            timeKey = dateObj.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' });
        } else if (filterType === 'weeks') {
            const startOfYear = new Date(dateObj.getFullYear(), 0, 1);
            const pastDaysOfYear = (dateObj - startOfYear) / 86400000;
            const weekNum = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
            timeKey = `W${weekNum} - ${dateObj.getFullYear()}`;
        } else {
            timeKey = dateObj.toLocaleString('default', { month: 'short', year: 'numeric' });
        }

        if (!dataMap[timeKey]) dataMap[timeKey] = { inc: 0, exp: 0 };

        const amt = parseFloat(t.amount) || 0;
        if (t.type === 'income') {
            dataMap[timeKey].inc += amt;
        } else {
            dataMap[timeKey].exp += amt;
        }
    });

    if (monthlyChart) monthlyChart.destroy();

    monthlyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Object.keys(dataMap),
            datasets: [{
                label: 'Net Cash Flow',
                data: Object.values(dataMap).map(d => d.inc - d.exp),
                borderColor: '#2ec4b6',
                backgroundColor: 'rgba(46, 196, 182, 0.1)',
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            resizeDelay: 100,
            plugins: { legend: { display: false } },
            scales: {
                y: { display: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.5)' } },
                x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.5)' } }
            }
        }
    });
}

function updateBudgetAlert(budgets) {
    const alertContainer = document.getElementById('budget-alert-zone');
    if (!alertContainer) return;

    // Fix: Filter with numeric fallback values to prevent NaN propagation
    const atRisk = budgets.filter(b => {
        const lim = parseFloat(b.limit_amount) || 0;
        const spent = parseFloat(b.spent_amount) || 0;
        return lim > 0 && (spent / lim) >= 0.9;
    });

    if (atRisk.length > 0) {
        alertContainer.innerHTML = `
            <div class="alert-banner error" style="margin-top: 1rem; padding: 0.75rem; border-radius: 6px; background: rgba(231,76,60,0.1); border: 1px solid var(--danger);">
                ⚠️ <span style="color: #e74c3c; font-weight: bold;">Alert:</span> You have ${atRisk.length} budget(s) near the limit!
            </div>
        `;
    } else {
        alertContainer.innerHTML = `
            <div class="alert-banner success" style="margin-top: 1rem; padding: 0.75rem; border-radius: 6px; background: rgba(46,196,182,0.1); opacity: 0.8;">
                Your spending is currently within your planned limits. Great job!
            </div>
        `;
    }
}