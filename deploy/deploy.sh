#!/bin/bash

# HostingIn VPS Deployment Script
# Usage: ./deploy.sh

set -e

echo "====================================="
echo "HostingIn VPS Deployment"
echo "====================================="
echo ""

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root or with sudo" 
   exit 1
fi

# Update system
echo "[1/6] Updating system..."
apt update && apt upgrade -y

# Install Docker
echo "[2/6] Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    systemctl enable docker
    systemctl start docker
else
    echo "Docker already installed"
fi

# Install Docker Compose
echo "[3/6] Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    apt install docker-compose -y
else
    echo "Docker Compose already installed"
fi

# Install Nginx
echo "[4/6] Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    apt install nginx -y
    systemctl enable nginx
    systemctl start nginx
else
    echo "Nginx already installed"
fi

# Setup environment
echo "[5/6] Setting up environment..."
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo "Created backend/.env - Please configure it!"
fi

if [ ! -f frontend/.env ]; then
    cp frontend/.env.example frontend/.env
    echo "Created frontend/.env - Please configure it!"
fi

# Build and start containers
echo "[6/6] Starting services..."
docker-compose -f deploy/docker-compose.prod.yml up -d --build

echo ""
echo "====================================="
echo "Deployment Complete!"
echo "====================================="
echo ""
echo "Next steps:"
echo "1. Configure backend/.env with production values"
echo "2. Configure frontend/.env with production URL"
echo "3. Setup Nginx reverse proxy:"
echo "   sudo cp deploy/nginx.conf.example /etc/nginx/sites-available/hostingin"
echo "   sudo ln -s /etc/nginx/sites-available/hostingin /etc/nginx/sites-enabled/"
echo "   sudo nginx -t && sudo systemctl reload nginx"
echo "4. Setup SSL:"
echo "   sudo apt install certbot python3-certbot-nginx -y"
echo "   sudo certbot --nginx -d yourdomain.com"
echo ""
echo "Default credentials:"
echo "User: test@hostingin.com / password123"
echo "Admin: admin@hostingin.com / admin123"
echo ""
echo "Access your application at http://localhost:3000"
