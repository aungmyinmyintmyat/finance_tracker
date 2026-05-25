document.addEventListener('DOMContentLoaded', () => {
    // Fix Issue #21: Instantly intercept and validate historical cache states
    const token = localStorage.getItem('token');
    const currentPath = window.location.pathname;

    // 1. Route Shielding Gate
    if (!token && !currentPath.includes('login.html')) {
        // User has no session token but is trying to look at a dashboard page
        window.location.replace('login.html');
        return; // Kill execution early
    }

    if (token && currentPath.includes('login.html')) {
        // User is already logged in but manually went back to the login page
        window.location.replace('index.html');
        return;
    }

    // --- YOUR EXISTING AUTHENTICATION FORM LOGIC STARTS HERE ---
    const authForm = document.getElementById('auth-form');
    const toggleBtn = document.getElementById('toggle-auth');
    let isLogin = true;

    // Issue #25 Password Lookahead Pattern: Upper, Lower, Number, Symbol, Min 8 Length
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    function clearAlerts() {
        const errorDiv = document.getElementById('error-message');
        const successDiv = document.getElementById('success-message');
        if (errorDiv) errorDiv.style.display = 'none';
        if (successDiv) successDiv.style.display = 'none';
    }

    if (authForm && toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            isLogin = !isLogin;
            clearAlerts();

            document.getElementById('auth-title').innerText = isLogin ? 'Welcome Back' : 'Create Account';
            document.getElementById('register-fields').style.display = isLogin ? 'none' : 'block';
            document.getElementById('submit-btn').innerText = isLogin ? 'Login' : 'Register';
            toggleBtn.innerText = isLogin ? 'Sign Up' : 'Log In';
        });

        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearAlerts();

            const errorDiv = document.getElementById('error-message');

            // Extract values and trim potential accidental outer space wrappers
            const usernameValue = document.getElementById('username').value.trim();
            const passwordValue = document.getElementById('password').value;

            // --- ISSUE #25: STRICT VALIDATION CONTROLS ---

            // 1. Enforce mid-string space restriction
            if (/\s/.test(usernameValue)) {
                if (errorDiv) {
                    errorDiv.innerText = "Error: Usernames cannot contain spaces.";
                    errorDiv.style.display = "block";
                }
                return;
            }

            // 2. Enforce length baseline constraints
            if (usernameValue.length < 3 || usernameValue.length > 30) {
                if (errorDiv) {
                    errorDiv.innerText = "Error: Username must be between 3 and 30 characters.";
                    errorDiv.style.display = "block";
                }
                return;
            }

            // 3. Enforce strong lookahead strength requirements
            if (!passwordRegex.test(passwordValue)) {
                if (errorDiv) {
                    errorDiv.innerText = "Error: Password must be at least 8 characters long and contain an uppercase letter, lowercase letter, number, and special character (@$!%*?&).";
                    errorDiv.style.display = "block";
                }
                return;
            }

            // Assemble payload using sanitized local tracking variables
            const authData = {
                username: usernameValue,
                password: passwordValue,
            };

            if (!isLogin) {
                const incomeValue = parseFloat(document.getElementById('income').value);
                const accValue = document.getElementById('acc_number').value.trim();

                // Validation tracking for extended profile parameters during Sign Up
                if (isNaN(incomeValue) || incomeValue < 0) {
                    if (errorDiv) {
                        errorDiv.innerText = "Error: Please enter a valid, positive monthly income.";
                        errorDiv.style.display = "block";
                    }
                    return;
                }

                if (!accValue) {
                    if (errorDiv) {
                        errorDiv.innerText = "Error: Please enter an account identifier label.";
                        errorDiv.style.display = "block";
                    }
                    return;
                }

                authData.monthly_income = incomeValue;
                authData.account_number = accValue;
            }

            const endpoint = isLogin ? '/auth/login' : '/auth/register';

            try {
                const response = await FinanceAPI.request(endpoint, 'POST', authData);
                const successDiv = document.getElementById('success-message');

                if (response.token) {
                    localStorage.setItem('token', response.token);
                    localStorage.setItem('username', response.user.username);

                    if (successDiv) {
                        successDiv.innerText = "Welcome back! Logging you in...";
                        successDiv.style.display = "block";
                    }

                    setTimeout(() => {
                        // Fix Issue #21: Use replace instead of href so login page isn't kept in history
                        window.location.replace('index.html');
                    }, 1000);

                } else if (response.message) {
                    if (successDiv) {
                        successDiv.innerText = "🎉 Account created successfully! Preparing login...";
                        successDiv.style.display = "block";
                    }

                    setTimeout(() => {
                        location.reload();
                    }, 2000);
                }
            } catch (err) {
                if (errorDiv) {
                    // Pull custom message from backend if available, fallback to defaults
                    errorDiv.innerText = err.message || (isLogin
                        ? "Invalid username or password. Please try again."
                        : "Registration failed. Username might be taken.");
                    errorDiv.style.display = "block";
                } else {
                    alert("Authentication failed. Please try again.");
                }
            }
        });
    }
});