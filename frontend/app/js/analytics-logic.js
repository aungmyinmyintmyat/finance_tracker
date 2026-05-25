document.addEventListener('DOMContentLoaded', async () => {
    function escapeHTML(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    try {
        const transactions = await FinanceAPI.getTransactions();

        // Group by Category
        const catData = {};
        transactions.forEach(t => {
            if (t.type === 'expense') {
                const catName = t.category_name || 'Uncategorized';
                catData[catName] = (catData[catName] || 0) + parseFloat(t.amount);
            }
        });

        // Pie Chart
        const pieCtx = document.getElementById('categoryPieChart');
        if (pieCtx) {
            new Chart(pieCtx, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(catData),
                    datasets: [{
                        data: Object.values(catData),
                        backgroundColor: ['#2ecc71', '#e74c3c', '#3498db', '#f1c40f', '#9b59b6'],
                        borderWidth: 0
                    }]
                },
                options: { maintainAspectRatio: false, plugins: { legend: { labels: { color: '#fff' } } } }
            });
        }

        // Income vs Expense Totals
        let inc = 0, exp = 0;
        transactions.forEach(t => {
            if (t.type === 'income') inc += parseFloat(t.amount);
            else exp += parseFloat(t.amount);
        });

        const barCtx = document.getElementById('comparisonChart');
        if (barCtx) {
            new Chart(barCtx, {
                type: 'bar',
                data: {
                    labels: ['Income', 'Expense'],
                    datasets: [{
                        data: [inc, exp],
                        backgroundColor: ['#2ecc71', '#e74c3c'],
                        borderRadius: 8
                    }]
                },
                options: { maintainAspectRatio: false, scales: { y: { ticks: { color: '#fff' } } } }
            });
        }

        //top spending list
        renderTopSpending(transactions);

    } catch (err) {
        console.error("Analytics Error:", err);
    }
});
function renderTopSpending(data) {
    const listEl = document.getElementById('top-spending-list');
    if (!listEl) return;

    // 1. Filter only expenses and sort by amount descending
    const topExpenses = data
        .filter(t => t.type === 'expense')
        .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
        .slice(0, 5); // Take the top 5

    // 2. Map to HTML
    listEl.innerHTML = topExpenses.map(tx => `
        <div class="transaction-item glass" style="margin-bottom: 0.8rem; display: flex; justify-content: space-between; align-items: center; padding: 1rem;">
            <div class="tx-info">
                <strong style="display: block;">${escapeHTML(tx.description)}</strong>
                <small style="opacity: 0.6;">${escapeHTML(tx.category_name || 'General')}</small>
            </div>
            <span class="negative" style="font-weight: bold;">
                -$${parseFloat(tx.amount).toFixed(2)}
            </span>
        </div>
    `).join('');
}