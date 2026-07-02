#!/bin/bash
set -e

echo "===== Cool Cruze - Oracle Cloud Setup ====="
echo "Run as root or with sudo"

# Config - EDIT THESE
DOMAIN="coolcruze.in"
DB_PASSWORD="shadab100"
ADMIN_PASS="admin123"
WHATSAPP="917977471369"
SENDGRID_KEY="YOUR_SENDGRID_API_KEY"
NOTIFY_EMAIL="coolbreezeair01@gmail.com"

# -- Update system
apt update && apt upgrade -y

# -- Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs nginx certbot python3-certbot-nginx postgresql postgresql-contrib git

# -- Configure PostgreSQL
sudo -u postgres psql -c "CREATE USER coolcruze WITH PASSWORD '$DB_PASSWORD';"
sudo -u postgres psql -c "CREATE DATABASE coolcruze OWNER coolcruze;"
sudo -u postgres psql -c "ALTER USER coolcruze CREATEDB;"

# -- Clone repo
cd /opt
git clone https://github.com/ecoolbreeze/cool-cruze-rental.git
cd cool-cruze-rental
npm install --omit=dev

# -- Create .env
cat > .env << EOF
DATABASE_URL=postgresql://coolcruze:$DB_PASSWORD@localhost:5432/coolcruze
WHATSAPP_NUMBER=$WHATSAPP
ADMIN_USER=admin
ADMIN_PASS=$ADMIN_PASS
SENDGRID_API_KEY=$SENDGRID_KEY
SENDER_EMAIL=info@coolcruze.in
NOTIFY_EMAIL=$NOTIFY_EMAIL
SESSION_SECRET=$(openssl rand -hex 32)
EOF

# -- Open firewall
ufw allow 22
ufw allow 80
ufw allow 443
ufw --force enable

# -- Create systemd service
cat > /etc/systemd/system/coolcruze.service << 'SERVICE'
[Unit]
Description=Cool Cruze - AC Rental App
After=network.target postgresql.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/cool-cruze-rental
ExecStart=/usr/bin/node /opt/cool-cruze-rental/server.js
Restart=always
RestartSec=5
EnvironmentFile=/opt/cool-cruze-rental/.env

[Install]
WantedBy=multi-user.target
SERVICE

systemctl daemon-reload
systemctl enable coolcruze
systemctl start coolcruze

# -- Configure nginx
cat > /etc/nginx/sites-available/coolcruze << 'NGINX'
server {
    listen 80;
    server_name coolcruze.in www.coolcruze.in;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 50M;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/coolcruze /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# -- SSL via Let's Encrypt
certbot --nginx -d coolcruze.in -d www.coolcruze.in --non-interactive --agree-tos --email info@coolcruze.in

# -- Check status
echo "===== Status ====="
systemctl status coolcruze --no-pager | head -10
echo ""
echo "App running on port 3000, nginx on 443."
echo ""
echo "Next: Go to GoDaddy DNS and set an A record:"
curl -s ifconfig.me
echo ""
echo "Point coolcruze.in A record to the IP above"
echo "Then wait for DNS to propagate and visit https://coolcruze.in"