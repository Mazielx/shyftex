#!/bin/bash
# SHYFTEX - Levanta el backend + túnel público para probar la app en el celular
# Uso: ./tunel.sh
# Esto expone tu backend a internet con una URL pública de Cloudflare (gratis)

set -e

echo "🚀 SHYFTEX - Backend + Túnel público"
echo "===================================="

# 1. Verificar que PostgreSQL está corriendo
if ! docker ps --format '{{.Names}}' | grep -q shopping-optimizer-db; then
  echo "⚠️  PostgreSQL no está corriendo. Iniciando..."
  docker start shopping-optimizer-db 2>/dev/null || echo "❌ No se encontró el contenedor shopping-optimizer-db"
fi

# 2. Compilar el backend
echo "📦 Compilando backend..."
cd "$(dirname "$0")/server"
npx tsc

# 3. Matar procesos previos
echo "🔄 Limpiando procesos previos..."
pkill -f "node dist/index.js" 2>/dev/null || true
pkill -f cloudflared 2>/dev/null || true
sleep 1

# 4. Arrancar el backend
echo "🖥️  Arrancando backend en puerto 4000..."
setsid nohup node dist/index.js > /tmp/shyftex-backend.log 2>&1 < /dev/null &
sleep 4

# Verificar backend
if curl -s http://localhost:4000/api/v1/health | grep -q '"ok"'; then
  echo "✅ Backend corriendo en http://localhost:4000"
else
  echo "❌ Backend no arrancó. Revisa /tmp/shyftex-backend.log"
  exit 1
fi

# 5. Arrancar el túnel
echo "🌐 Creando túnel público (Cloudflare)..."
setsid nohup cloudflared tunnel --url http://localhost:4000 --protocol http2 > /tmp/shyftex-tunnel.log 2>&1 < /dev/null &
sleep 10

# Obtener URL del túnel
TUNNEL_URL=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' /tmp/shyftex-tunnel.log | head -1)

if [ -n "$TUNNEL_URL" ]; then
  echo ""
  echo "🎉 ¡TODO LISTO!"
  echo "============================================"
  echo "  URL pública: $TUNNEL_URL"
  echo "  Health:      $TUNNEL_URL/api/v1/health"
  echo "============================================"
  echo ""
  echo "Para conectar la app React Native, actualiza EXPO_PUBLIC_API_URL"
  echo "en el archivo .env con la URL pública de arriba."
  echo ""
  echo "NOTA: Esta URL cambia cada vez que reinicias el túnel."
  echo "      El túnel se apaga si cierras la laptop."
else
  echo "❌ No se pudo obtener la URL del túnel. Revisa /tmp/shyftex-tunnel.log"
fi
