# Guía de Despliegue para Producción/SAAS

Esta guía explica cómo configurar el sistema para despliegue en producción (ej: DigitalOcean, AWS, etc.) como un servicio SAAS.

## 📋 Tabla de Contenidos

1. [Configuración del Frontend](#configuración-del-frontend)
2. [Configuración del Backend](#configuración-del-backend)
3. [Variables de Entorno](#variables-de-entorno)
4. [Ejemplo de Despliegue en DigitalOcean](#ejemplo-de-despliegue-en-digitalocean)
5. [Consideraciones de Seguridad](#consideraciones-de-seguridad)

---

## 🎨 Configuración del Frontend

### Variables de Entorno Requeridas

Crea un archivo `.env.production` o configura las variables en tu plataforma de despliegue:

```bash
# URL base del backend API
# IMPORTANTE: Debe ser la URL completa del backend en producción
NEXT_PUBLIC_API_BASE_URL=https://api.tudominio.com

# Si frontend y backend están en el mismo dominio pero diferentes puertos:
# NEXT_PUBLIC_API_BASE_URL=https://tudominio.com:8080

# Si están en el mismo dominio y puerto (usando proxy):
# NEXT_PUBLIC_API_BASE_URL=/api  # Path relativo (requiere configuración de proxy)
```

### Comportamiento

- **Si `NEXT_PUBLIC_API_BASE_URL` está configurada**: Se usa esa URL directamente (recomendado para producción)
- **Si NO está configurada**: El sistema detecta automáticamente el hostname (solo para desarrollo)

### Build para Producción

```bash
# Instalar dependencias
npm install

# Build de producción
npm run build

# Iniciar servidor de producción
npm start
```

---

## 🔧 Configuración del Backend

### Variables de Entorno Requeridas

Configura estas variables en tu servidor o archivo `.env`:

```bash
# Configuración de CORS para Producción
# Opción 1: Lista específica de orígenes permitidos (RECOMENDADO)
CORS_ALLOWED_ORIGINS=https://app.tudominio.com,https://www.tudominio.com

# Opción 2: Patrones de orígenes permitidos (para subdominios dinámicos)
# CORS_ALLOWED_ORIGIN_PATTERNS=https://*.tudominio.com,https://app-*.tudominio.com

# Si NO se configuran estas variables, se usa la configuración de desarrollo
# (permite localhost e IPs privadas - NO recomendado para producción)
```

### Configuración de Base de Datos

Actualiza `application.yml` o usa variables de entorno:

```yaml
spring:
  datasource:
    url: jdbc:mysql://${DB_HOST:localhost}:${DB_PORT:3306}/${DB_NAME:checador_db}?useSSL=true&serverTimezone=America/Mexico_City
    username: ${DB_USERNAME:root}
    password: ${DB_PASSWORD:root}
```

### Variables de Entorno del Backend

```bash
# Base de Datos
DB_HOST=tu-servidor-mysql.com
DB_PORT=3306
DB_NAME=checador_db
DB_USERNAME=usuario_db
DB_PASSWORD=password_seguro

# CORS (PRODUCCIÓN)
CORS_ALLOWED_ORIGINS=https://app.tudominio.com

# JWT Secret (IMPORTANTE: Cambiar en producción)
JWT_SECRET=tu-secret-key-super-largo-y-seguro-aqui
JWT_EXPIRATION=10800

# Puerto del servidor (opcional)
SERVER_PORT=8080
```

---

## 🌐 Ejemplo de Despliegue en DigitalOcean

### Opción 1: Frontend y Backend en el Mismo Droplet

```bash
# 1. Configurar variables de entorno del Frontend
export NEXT_PUBLIC_API_BASE_URL=http://localhost:8080

# 2. Configurar variables de entorno del Backend
export CORS_ALLOWED_ORIGINS=https://tudominio.com
export DB_HOST=localhost
export DB_USERNAME=usuario_db
export DB_PASSWORD=password_seguro

# 3. Usar Nginx como reverse proxy
# /etc/nginx/sites-available/tudominio.com
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;
    
    # Redirigir a HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tudominio.com www.tudominio.com;
    
    ssl_certificate /etc/letsencrypt/live/tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tudominio.com/privkey.pem;
    
    # Frontend (Next.js)
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
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # WebSocket para huellas dactilares
    location /ws-fingerprint {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

En este caso, configura:
```bash
# Frontend
NEXT_PUBLIC_API_BASE_URL=/api  # Path relativo

# Backend
CORS_ALLOWED_ORIGINS=https://tudominio.com
```

### Opción 2: Frontend y Backend en Diferentes Droplets/Servicios

```bash
# Frontend (Droplet 1)
NEXT_PUBLIC_API_BASE_URL=https://api.tudominio.com

# Backend (Droplet 2)
CORS_ALLOWED_ORIGINS=https://app.tudominio.com
```

---

## 🔒 Consideraciones de Seguridad

### ✅ Checklist de Seguridad para Producción

- [ ] **Cambiar JWT Secret**: Usa un secret largo y aleatorio en producción
- [ ] **HTTPS Obligatorio**: Configura SSL/TLS (Let's Encrypt es gratuito)
- [ ] **CORS Restrictivo**: Solo permite dominios específicos, no uses `*`
- [ ] **Variables de Entorno**: Nunca hardcodees credenciales en el código
- [ ] **Base de Datos**: Usa conexiones SSL y usuarios con permisos mínimos
- [ ] **Firewall**: Configura reglas de firewall para limitar acceso
- [ ] **Logs**: No expongas información sensible en logs
- [ ] **Rate Limiting**: Considera implementar límites de tasa para prevenir abusos

### Configuración de CORS Segura

**❌ NO HACER (Inseguro):**
```java
configuration.setAllowedOrigins(List.of("*")); // Permite cualquier origen
```

**✅ HACER (Seguro):**
```bash
# Variable de entorno
CORS_ALLOWED_ORIGINS=https://app.tudominio.com,https://www.tudominio.com
```

---

## 🚀 Pasos de Despliegue

### 1. Preparar el Backend

```bash
# Compilar el proyecto
mvn clean package

# Crear archivo .env con variables de entorno
cat > .env << EOF
DB_HOST=tu-servidor-mysql.com
DB_USERNAME=usuario_db
DB_PASSWORD=password_seguro
CORS_ALLOWED_ORIGINS=https://app.tudominio.com
JWT_SECRET=tu-secret-key-super-largo
EOF

# Ejecutar (usando las variables de entorno)
java -jar target/fingerprint-api.jar
```

### 2. Preparar el Frontend

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
echo "NEXT_PUBLIC_API_BASE_URL=https://api.tudominio.com" > .env.production

# Build de producción
npm run build

# Iniciar servidor
npm start
```

### 3. Verificar Despliegue

1. Accede a `https://app.tudominio.com`
2. Abre la consola del navegador (F12)
3. Verifica que las peticiones van a `https://api.tudominio.com` (no a localhost)
4. Verifica que no hay errores de CORS

---

## 📝 Notas Adicionales

### Desarrollo vs Producción

- **Desarrollo**: La detección automática funciona bien para desarrollo local y pruebas en red local
- **Producción**: SIEMPRE configura `NEXT_PUBLIC_API_BASE_URL` y `CORS_ALLOWED_ORIGINS` explícitamente

### Troubleshooting

**Problema**: Error de CORS en producción
- **Solución**: Verifica que `CORS_ALLOWED_ORIGINS` incluye exactamente el dominio del frontend (con protocolo y sin trailing slash)

**Problema**: Las peticiones van a localhost en producción
- **Solución**: Verifica que `NEXT_PUBLIC_API_BASE_URL` está configurada y que el build se hizo con esa variable

**Problema**: El frontend no puede conectarse al backend
- **Solución**: Verifica que ambos servicios están corriendo y que el firewall permite las conexiones necesarias

---

## 📞 Soporte

Si tienes problemas con el despliegue, verifica:
1. Variables de entorno configuradas correctamente
2. Logs del backend para errores de CORS
3. Consola del navegador para errores de red
4. Configuración de firewall y puertos


