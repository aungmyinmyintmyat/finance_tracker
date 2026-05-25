const API_URL = '/api';
// const API_URL = 'http://ammm.website/api';
// window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api';

const FinanceAPI = {
    /**
     * Global fetch wrapper to handle tokens and errors
     * @param {string} endpoint - e.g., '/auth/login' or '/finance/transactions'
     * @param {string} method - 'GET', 'POST', 'PUT', 'DELETE'
     * @param {object} data - The body of the request
     */
    async request(endpoint, method = 'GET', data = null) {
        // Grab the "Pass" saved during login
        const token = localStorage.getItem('token');

        const headers = { 'Content-Type': 'application/json' };

        // If have a token, add it to the "Security Guard" (Middleware) header
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = { method, headers };

        if (data) config.body = JSON.stringify(data);

        try {
            // Add temporary log
            console.log(`🚀 Attempting fetch to: ${API_URL}${endpoint}`);
            const response = await fetch(`${API_URL}${endpoint}`, config);

            // If the Security Guard kicks us out (Expired/No Token)
            if (response.status === 401 && !endpoint.includes('/auth/login')) {
                this.logout();
                return;
            }

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'API Request Failed');
            }

            return result;
        } catch (error) {
            console.error("Fetch Error:", error.message);
            throw error;
        }
    },

    // Shortcut for logging out
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
        }
    },

    // --- FINANCE ENDPOINTS ---
    /** Get all transactions for the logged-in user */
    async getTransactions() {
        return await this.request('/finance', 'GET');
    },

    /** Add a new transaction */
    async addTransaction(data) {
        return await this.request('/finance', 'POST', data);
    },

    /*'getAnalytics' method to support your analytics.html view */
    async getAnalytics() {
        return await this.getTransactions();
    },

    /** Get user totals (Income, Expense, Balance) */
    async getTotals() {
        const transactions = await this.getTransactions();
        let income = 0;
        let expense = 0;

        transactions.forEach(t => {
            const amt = parseFloat(t.amount) || 0;
            if (t.type === 'income') income += amt;
            else expense += amt;
        });

        return { income, expense, balance: income - expense };
    },

    // --- BUDGET ENDPOINTS ---

    /** Get the user's current budget plan */
    async getBudget() {
        return await this.request('/budget/status', 'GET');
    },

    /** Save a full budget plan */
    async saveBudget(category_id, limit_amount) {
        return await this.request('/budget/save', 'POST', { category_id, limit_amount });
    }
};