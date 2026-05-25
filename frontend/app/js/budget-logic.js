function escapeBudgetHTML(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

async function renderBudgetProgress() {
    const container = document.getElementById('budget-progress-container');
    if (!container) return;

    try {
        const budgets = await FinanceAPI.request('/budget/status');
        container.innerHTML = ''; // Clear old bars

        budgets.forEach(b => {
            // Fix: Guard against division-by-zero errors if limit_amount is 0
            const limit = parseFloat(b.limit_amount) || 0;
            const spent = parseFloat(b.spent_amount) || 0;
            const percent = Math.min((b.spent_amount / b.limit_amount) * 100, 100);
            const isOver = b.spent_amount > b.limit_amount;

            const budgetHtml = `
                <div class="glass-card budget-item">
                    <div class="budget-meta">
                        <strong>${b.category_name}</strong>
                        <span>$${b.spent_amount} / $${b.limit_amount}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress" style="width: ${percent}%; background: ${isOver ? 'var(--danger)' : 'var(--accent)'}"></div>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', budgetHtml);
        });
    } catch (err) {
        console.error("Error loading progress bars:", err);
    }
}

// Run this when the page loads
document.addEventListener('DOMContentLoaded', renderBudgetProgress);

let customPlanDraft = [];

const budgetRatios = {
    Student: [
        { category_id: 1, ratio: 0.50 }, // 50% Housing
        { category_id: 2, ratio: 0.20 }, // 20% Groceries
        { category_id: 8, ratio: 0.30 }  // 30% Misc/Learning
    ],
    Freelancer: [
        { category_id: 4, ratio: 0.10 }, // 10% Utilities/Software
        { category_id: 7, ratio: 0.30 }, // 30% Savings (Taxes)
        { category_id: 3, ratio: 0.15 }  // 15% Transport
    ],
    Professional: [
        { category_id: 1, ratio: 0.30 }, // 30% Housing
        { category_id: 7, ratio: 0.20 }, // 20% Investments
        { category_id: 6, ratio: 0.10 }  // 10% Healthcare
    ]
};

async function applyPreset(planName) {
    try {
        // A. Get the user's profile to see their monthly income
        // We'll assume you have an endpoint /api/auth/profile
        const profile = await FinanceAPI.request('/auth/profile');
        const income = parseFloat(profile.monthly_income);

        if (!income || income <= 0) {
            alert("Please set your monthly income in settings before applying a plan!");
            return;
        }

        const plan = budgetRatios[planName];

        // B. Loop through the ratios and calculate real numbers
        await Promise.all(plan.map(item => {
            const calculatedLimit = income * item.ratio;
            return FinanceAPI.request('/budget/save', 'POST', {
                category_id: item.category_id,
                limit_amount: calculatedLimit
            });
        }));

        alert(`Success! Applied the ${planName} plan based on your $${income} income.`);

        // Refresh the progress bars if they exist
        if (typeof renderBudgetProgress === 'function') renderBudgetProgress();

        if (typeof loadDashboardData === 'function') {
            loadDashboardData();
        }

    } catch (err) {
        console.error("Preset Error:", err);
        alert("Failed to sync preset values.");
    }
}

function toggleCustomForm() {
    const form = document.getElementById('custom-budget-form');
    if (form) form.classList.toggle('hidden');
}

function addToDraft() {
    const catSelect = document.getElementById('cust-cat');
    const limInput = document.getElementById('cust-lim');

    const catId = catSelect.value;
    const catName = catSelect.options[catSelect.selectedIndex].text;
    const limit = parseFloat(limInput.value);

    if (!limit || limit <= 0) return alert("Please enter a valid limit.");

    // Add to our temporary array
    customPlanDraft.push({ category_id: catId, name: catName, limit_amount: limit });

    // Update the UI
    updateDraftUI();

    // Clear input and show the Save button
    limInput.value = '';
    document.getElementById('save-plan-action').classList.remove('hidden');
}

function updateDraftUI() {
    const list = document.getElementById('draft-list');
    list.innerHTML = customPlanDraft.map((item, index) => `
        <li class="transaction-item glass" style="margin-bottom: 0.5rem; border-left: 4px solid var(--accent);">
            <div class="tx-info">
                <strong>${item.name}</strong>
                <small>Monthly Limit</small>
            </div>
            <span class="tx-amount positive">$${item.limit_amount.toFixed(2)}</span>
        </li>
    `).join('');
}

async function saveCustomPlan() {
    if (customPlanDraft.length === 0) return;

    try {
        // Send each drafted item to the backend
        await Promise.all(customPlanDraft.map(item =>
            FinanceAPI.request('/budget/save', 'POST', {
                category_id: item.category_id,
                limit_amount: item.limit_amount
            })
        ));

        alert("Plan synced successfully!");
        customPlanDraft = []; // Reset draft
        updateDraftUI();
        toggleCustomForm();

        // If you have the progress bars on this page, refresh them!
        if (typeof renderBudgetProgress === 'function') renderBudgetProgress();

        if (typeof loadDashboardData === 'function') {
            loadDashboardData();
        }

    } catch (err) {
        console.error("Failed to save plan:", err);
        alert("Error saving your plan. Plese try again.");
    }
}