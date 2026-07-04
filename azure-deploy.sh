#!/bin/bash
# Azure App Service deployment script for Cool Cruze
# Prerequisites: az CLI installed, logged in (az login), GitHub repo connected

set -e

RESOURCE_GROUP="coolcruze-rg"
APP_NAME="coolcruze"
LOCATION="eastus"  # Change to your nearest region: westus, westeurope, southeastasia, etc.
SKU="F1"           # Free tier (F1). For production: B1 (basic) or S1 (standard)

echo "=== Creating Resource Group ==="
az group create --name $RESOURCE_GROUP --location $LOCATION

echo "=== Creating App Service Plan (Free) ==="
az appservice plan create \
  --name "${APP_NAME}-plan" \
  --resource-group $RESOURCE_GROUP \
  --sku $SKU \
  --is-linux

echo "=== Creating Web App with Node.js 20 ==="
az webapp create \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --plan "${APP_NAME}-plan" \
  --runtime "NODE:20-lts" \
  --startup-file "node server.js"

echo "=== Configuring Environment Variables ==="
az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    NODE_ENV=production \
    SESSION_SECRET="cool-cruze-secret-$(openssl rand -hex 16)" \
    ADMIN_USER=admin \
    ADMIN_PASS=admin123 \
    SENDER_EMAIL=info@coolcruze.in \
    NOTIFY_EMAIL=coolbreezeair01@gmail.com \
    WHATSAPP_NUMBER=917977471369

echo "=== Configuring CORS (if needed) ==="
az webapp cors add \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --allowed-origins "https://${APP_NAME}.azurewebsites.net"

echo "=== Enabling HTTPS-only ==="
az webapp update \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --https-only true

echo ""
echo "=== Deployment Complete ==="
echo "Site URL: https://${APP_NAME}.azurewebsites.net"
echo ""
echo "Next steps:"
echo "1. Set up custom domain: az webapp config hostname add --webapp-name $APP_NAME --resource-group $RESOURCE_GROUP --hostname coolcruze.in"
echo "2. Add SSL certificate: az webapp config ssl upload --certificate-file ... or use Azure Key Vault"
echo "3. For PostgreSQL, create Azure Database for PostgreSQL Flexible Server"
echo "4. Connect GitHub Actions: Add AZURE_WEBAPP_PUBLISH_PROFILE secret from Azure Portal -> App Service -> Get Publish Profile"
echo ""
echo "SendGrid API Key: az webapp config appsettings set --name $APP_NAME --resource-group $RESOURCE_GROUP --settings SENDGRID_API_KEY=your_key_here"
echo "Database URL: az webapp config appsettings set --name $APP_NAME --resource-group $RESOURCE_GROUP --settings DATABASE_URL=postgresql://..."
