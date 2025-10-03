# HostingIn - Premium Cloud Hosting Platform

![HostingIn](https://img.shields.io/badge/Status-Production%20Ready-success)
![React](https://img.shields.io/badge/React-19.0-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110-green)
![MongoDB](https://img.shields.io/badge/MongoDB-Compatible-brightgreen)

**HostingIn** adalah platform hosting modern yang dibangun dengan React, FastAPI, dan MongoDB. Platform ini menawarkan pengalaman pengguna premium dengan UI/UX yang menarik, fitur lengkap, dan performa tinggi.

## ✨ Features

### Public Features
- 🎨 **Premium Landing Page** dengan glassmorphism & gradient Blue→Violet
- 🔍 **Domain Checker** dengan hasil real-time
- 💳 **Pricing Calculator** dengan toggle Monthly/Yearly
- ⭐ **Testimonials & FAQ** sections
- 🌙 **Dark Mode** support

### User Dashboard
- 📊 **Interactive Dashboard** dengan animated stats
- 📦 **Package Management** - Browse dan order hosting packages
- 🛒 **Order System** dengan payment simulator
- 💰 **Billing & Invoices** dengan PDF generation
- 📈 **Usage Monitoring** - Storage & Bandwidth gauges
- 🎫 **Support Tickets** system
- ⚙️ **Settings & Profile** management
- 🎯 **Onboarding Wizard** untuk new users

### Admin Dashboard
- 📈 **Analytics Dashboard** dengan Recharts
- 👥 **User Management** - CRUD operations
- 📦 **Package Management** - Create, update, delete packages
- 🛍️ **Order Management** - Track dan update order status
- 📢 **Announcements** - Broadcast messages to users
- 📝 **Activity Logs** - Track admin actions
- 📊 **Reports & Exports** (CSV)

### Additional Features
- 🤖 **AI Assistant** dengan canned responses
- 📚 **Knowledge Base** articles
- 🎁 **Promo Code** system
- 🤝 **Affiliate Program** (dummy)
- 🏆 **Achievements System** (dummy)
- 🔔 **Real-time Notifications**

## 🛠 Tech Stack

### Frontend
- **React 19.0** - UI Framework
- **React Router 7.5** - Routing
- **TailwindCSS 3.4** - Styling
- **shadcn/ui** - Component library
- **Framer Motion 12.x** - Animations
- **Recharts 3.x** - Charts & Analytics
- **Axios** - HTTP client
- **jsPDF** - PDF generation
- **Sonner** - Toast notifications

### Backend
- **FastAPI 0.110** - API Framework
- **Beanie 2.0** - MongoDB ODM
- **Motor 3.7** - Async MongoDB driver
- **Pydantic 2.x** - Data validation
- **JWT** - Authentication
- **Bcrypt** - Password hashing

### Database
- **MongoDB** - Document database

## 📦 Installation

### Prerequisites
- Node.js 18+ & Yarn
- Python 3.11+
- MongoDB 4.5+

### Local Development

1. **Clone Repository**
```bash
git clone <your-repo-url>
cd hostingin
```

2. **Backend Setup**
```bash
cd backend
pip install -r requirements.txt

# Configure .env
cp .env.example .env
# Edit .env with your settings

# Run backend
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

3. **Frontend Setup**
```bash
cd frontend
yarn install

# Configure .env
cp .env.example .env
# Edit REACT_APP_BACKEND_URL to http://localhost:8001

# Run frontend
yarn start
```

4. **MongoDB**
```bash
# Start MongoDB
mongod --dbpath /your/db/path
```

### Environment Variables

**Backend (.env)**
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=hostingin_db
JWT_SECRET=your-super-secret-key-change-this
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=1440
CORS_ORIGINS=http://localhost:3000
```

**Frontend (.env)**
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

## 🐳 Docker Deployment

### Docker Compose (Recommended)

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Individual Docker Build

**Backend**
```bash
cd backend
docker build -t hostingin-backend .
docker run -p 8001:8001 --env-file .env hostingin-backend
```

**Frontend**
```bash
cd frontend
docker build -t hostingin-frontend .
docker run -p 3000:3000 hostingin-frontend
```

## 🚀 VPS Deployment

### Production Setup (Ubuntu 22.04+)

1. **Install Dependencies**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker & Docker Compose
sudo apt install docker.io docker-compose -y
sudo systemctl enable docker
sudo systemctl start docker

# Add user to docker group
sudo usermod -aG docker $USER
```

2. **Deploy Application**
```bash
# Clone repository
git clone <your-repo-url>
cd hostingin

# Configure production environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit .env files with production values
nano backend/.env
nano frontend/.env

# Start services
docker-compose -f docker-compose.prod.yml up -d --build
```

3. **Setup Nginx Reverse Proxy**

Create `/etc/nginx/sites-available/hostingin`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/hostingin /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

4. **Setup SSL with Let's Encrypt**
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

5. **Setup Systemd Service (Optional)**

Create `/etc/systemd/system/hostingin.service`:

```ini
[Unit]
Description=HostingIn Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/path/to/hostingin
ExecStart=/usr/bin/docker-compose -f docker-compose.prod.yml up -d
ExecStop=/usr/bin/docker-compose -f docker-compose.prod.yml down

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable hostingin
sudo systemctl start hostingin
```

## 🔑 Default Credentials

After first startup, use these credentials:

**User Account**
- Email: `test@hostingin.com`
- Password: `password123`

**Admin Account**
- Email: `admin@hostingin.com`
- Password: `admin123`

⚠️ **Important:** Change these credentials in production!

## 📚 API Documentation

API documentation available at:
- Swagger UI: `http://localhost:8001/docs`
- ReDoc: `http://localhost:8001/redoc`

### Main Endpoints

**Authentication**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

**Packages**
- `GET /api/packages` - List all packages
- `POST /api/packages` - Create package (admin)
- `PATCH /api/packages/{id}` - Update package (admin)
- `DELETE /api/packages/{id}` - Delete package (admin)

**Orders**
- `POST /api/orders` - Create order
- `GET /api/orders` - List user orders
- `GET /api/orders/{id}` - Get order details
- `POST /api/orders/{id}/pay` - Simulate payment
- `POST /api/orders/{id}/renew` - Renew order

**Admin**
- `GET /api/admin/orders` - List all orders
- `PATCH /api/admin/orders/{id}` - Update order
- `GET /api/admin/stats` - Get statistics
- `POST /api/admin/announce` - Create announcement
- `GET /api/admin/logs` - Get activity logs

**Utilities**
- `GET /api/domain/check?q=domain` - Check domain availability
- `GET /api/ai/help?q=query` - AI assistant
- `GET /api/kb` - Knowledge base articles
- `GET /api/announcements` - Get announcements

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
yarn test
```

### Integration Tests
```bash
# Coming soon
```

## 📁 Project Structure

```
hostingin/
├── backend/
│   ├── server.py           # Main FastAPI application
│   ├── requirements.txt    # Python dependencies
│   ├── .env               # Environment variables
│   └── Dockerfile         # Backend Docker config
├── frontend/
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # React components
│   │   │   └── ui/       # shadcn/ui components
│   │   ├── contexts/      # React contexts
│   │   ├── hooks/         # Custom hooks
│   │   ├── pages/         # Page components
│   │   ├── utils/         # Utility functions
│   │   ├── App.js        # Main App component
│   │   ├── App.css       # Global styles
│   │   └── index.js      # Entry point
│   ├── package.json       # Dependencies
│   ├── .env              # Environment variables
│   └── Dockerfile        # Frontend Docker config
├── docs/                  # Documentation
├── deploy/               # Deployment configs
│   ├── nginx.conf.example
│   └── docker-compose.prod.yml
├── docker-compose.yml    # Development Docker Compose
└── README.md
```

## 🎨 Design System

### Colors
- Primary: Blue (#2563EB) → Violet (#7C3AED)
- Accent: Purple (#8B5CF6)
- Success: Green
- Warning: Amber
- Error: Red

### Typography
- Font Family: Inter
- H1: 48-72px (text-5xl to text-7xl)
- H2: 36-48px (text-4xl to text-5xl)
- Body: 16px (text-base)

### Components
- Glassmorphism with backdrop-blur
- Gradient overlays
- Smooth animations (Framer Motion)
- Accessible (ARIA labels, keyboard navigation)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [React](https://react.dev)
- [FastAPI](https://fastapi.tiangolo.com)
- [shadcn/ui](https://ui.shadcn.com)
- [TailwindCSS](https://tailwindcss.com)
- [Framer Motion](https://www.framer.com/motion)
- [MongoDB](https://www.mongodb.com)

## 📞 Support

- Documentation: Check this README
- Issues: Open an issue on GitHub
- Email: support@hostingin.com

---

**Made with ❤️ using Emergent**
