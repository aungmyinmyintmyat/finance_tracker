async function addTransaction(e) {
    e.preventDefault();

    const amountVal = document.getElementById('amount').value;
    const parsedAmount = parseFloat(amountVal);

    if (!amountVal || isNaN(parsedAmount) || parsedAmount <= 0) {
        alert("Please enter a valid amount greater than 0.");
        return;
    }

    const payload = {
        date: document.getElementById('date').value,
        description: document.getElementById('description').value,
        amount: parseFloat(document.getElementById('amount').value),
        category_id: document.getElementById('category').value,
        type: document.getElementById('type').value
    };

    try {
        // Your original API request handler
        await FinanceAPI.request('/finance', 'POST', payload);
        e.target.reset();

        if (typeof loadDashboardData === 'function') loadDashboardData();

        // --- ISSUE 2 IMPLEMENTATION START ---

        // 1. Create the alert banner dynamically on the DOM
        const notification = document.createElement('div');
        notification.className = 'toast-notification';
        notification.innerText = '✅ Transaction added successfully!';
        document.body.appendChild(notification);

        // 2. Trigger the slide-in CSS transition effect
        setTimeout(() => notification.classList.add('show'), 100);

        // 3. Wait 2.5 seconds for visibility, then redirect straight home
        setTimeout(() => {
            notification.classList.remove('show');
            window.location.href = 'index.html'; // Adjust this to match your exact home file name if different
        }, 2000);

        // --- ISSUE 2 IMPLEMENTATION END ---

    } catch (err) {
        alert("Failed to add transaction.");
    }
}

// Attach listener if form exists
const txForm = document.getElementById('transaction-form');
if (txForm) txForm.addEventListener('submit', addTransaction);