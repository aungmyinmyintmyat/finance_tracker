personal-finance-tracker/
├── backend/                        
│   ├── Dockerfile                  # Setup for the Node container
│   ├── package.json                # Dependencies: express, mysql2, jsonwebtoken, bcryptjs
│   ├── .dockerignore               
│   └── src/
│       ├── server.js               # Entry point (app.listen)
│       ├── config/
│       │   └── db.js               # MySQL connection pool
│       ├── middleware/
│       │   └── auth.js             # JWT verification (Gatekeeper)
│       └── routes/
│           ├── auth.js             # /api/auth (Login/Register)
│           ├── finance.js          # /api/finance (Transactions)
│           └── budget.js           # /api/budget (Presets & Custom plans)
│
├── frontend/                       # THE UI (User Interface)
│   ├── Dockerfile                  # Setup for the nginx container
│   ├── .dockerignore               
│   ├── nginx.conf                  # connect front and back
│   └── app                         # all UI implementation
│       ├── index.html              # Home / Dashboard
│       ├── login.html              # Login & Register page
│       ├── budget.html             # Budgeting Templates & Builder
│       ├── history.html            # All transactions list
│       ├── analytics.html          # Charts and data visualization
│       ├── transaction.html        # Add new transaction
│       ├── style.css               # Unified Bento/Glassmorphism CSS
│       └── js/                     # Modular JavaScript
│           ├── api.js              # SHARED: API fetch helper (FinanceAPI)
│           ├── auth.js             # Logic for login.html
│           ├── dashboard.js        # Logic for index.html
│           ├── history-logic.js    # Logic for history.html
│           ├── analytics-logic.js  # Logic for analytics.html
│           ├── transactions.js     # Logic for transaction.html
│           └── budget-logic.js     # Logic for budget.html
│
├── db/                             # DATABASE SETUP
|    └── init.sql                   # SQL commands to build your tables
│
├── finance-chart/                  # helm chart for configuration
│    ├── charts
│    ├── Chart.yaml                 # helm chart info
│    ├── values.yaml                # variables for yaml files
│    └── templates                  # templates for storing yamls
│          ├── 01-secrets.yaml      # To store keys
│          ├── 02-mysql.yaml        # For mysql db
│          ├── 03-backend.yaml      # for backend service
│          ├── 04-frontend.yaml     # For frontend service
│          ├── 05-pvc.yaml          # For persistent storage and claim
│          ├── 06-configmap.yaml    # For mysql - db/init.sql inject
│          └── 07-ingress.yaml      # ingress controller
│          
├── .dockerignore
└── kind-config.yaml                # Config file for kind cluster creation