document.addEventListener('DOMContentLoaded', async () => {
    const historyList = document.getElementById('full-history-list');
    const searchInput = document.getElementById('history-search');

    if (!historyList) return;
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

        const render = (data) => {
            historyList.innerHTML = data.map(t => `
                <tr style="border-bottom: 1px solid var(--glass-border);">
                    <td style="padding: 1rem; opacity: 0.7;">${new Date(t.date).toLocaleDateString()}</td>
                    <td style="padding: 1rem;">${t.description}</td>
                    <td style="padding: 1rem;"><span class="mini-tag">${t.category_name || 'General'}</span></td>
                    <td style="padding: 1rem; text-align: right;" class="${t.type === 'income' ? 'positive' : 'negative'}">
                        ${t.type === 'income' ? '+' : '-'}$${Math.abs(t.amount).toFixed(2)}
                    </td>
                </tr>
            `).join('');
        };

        render(transactions);

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                const filtered = transactions.filter(t =>
                    (t.description && t.description.toLowerCase().includes(term)) ||
                    (t.category_name && t.category_name.toLowerCase().includes(term))
                );
                render(filtered);
            });
        }
    } catch (err) {
        console.error("History Load Error:", err);
    }
});