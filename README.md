# artupski.com — Portfolio CMS

Website portfolio personal CMS dinamis untuk **Angga Dwy Saputra** (Web Developer & SEO Specialist).

**Stack:** Node.js 24.14.0 LTS · Express.js · EJS · TailwindCSS · Supabase (PostgreSQL) · Vanilla JavaScript  
**Deployment:** Vercel (serverless) · PM2 (VPS)

---

## Fitur

- Admin panel CMS berbasis Tabler untuk mengelola semua konten
- Halaman publik: Homepage, About, Portfolio, Services, Blog, Contact
- Dark/light mode dengan localStorage persistence (dark default)
- SEO meta tags dan Open Graph untuk setiap halaman
- Upload dan kompresi gambar via multer + sharp
- Autentikasi admin dengan bcrypt + express-session
- Rate limiting untuk login dan form kontak
- Desain mobile-first dengan TailwindCSS

---

## Instalasi

### Prasyarat

- Node.js 24.14.0 LTS ([download](https://nodejs.org/))
- Akun Supabase ([supabase.com](https://supabase.com))
- npm 10+

### Langkah Instalasi

```bash
# 1. Clone repository
git clone https://github.com/tupski/artupski.com.git
cd artupski.com

# 2. Install dependencies
npm install

# 3. Salin file environment
cp .env.example .env

# 4. Edit .env dengan nilai yang sesuai (lihat bagian Setup Environment)
```

---

## Setup Environment

Salin `.env.example` ke `.env` dan isi semua variabel:

```env
PORT=3000
SESSION_SECRET=your-very-long-random-secret-string-here
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-secure-admin-password
```

### Cara Mendapatkan Supabase Credentials

1. Buat project baru di [supabase.com](https://supabase.com)
2. Buka **Settings → API**
3. Salin **Project URL** → `SUPABASE_URL`
4. Salin **anon public** key → `SUPABASE_ANON_KEY`
5. Buka **Settings → Database** untuk mendapatkan `DATABASE_URL`

---

## Development Server

```bash
# Jalankan development server dengan auto-reload
npm run dev

# Server berjalan di http://localhost:3000
# Admin panel: http://localhost:3000/admin
```

Saat pertama kali dijalankan, aplikasi akan:
1. Menjalankan migrasi database secara otomatis
2. Membuat akun admin dari `ADMIN_EMAIL` dan `ADMIN_PASSWORD`
3. Mengisi data default pada tabel `settings`

### Build CSS (TailwindCSS)

```bash
# Build CSS sekali
npm run build:css

# Watch mode (jalankan bersamaan dengan dev server)
npx tailwindcss -i src/public/css/app.css -o src/public/css/output.css --watch
```

---

## Testing

```bash
# Jalankan semua tests
npm test

# Unit tests saja (utils, models, middlewares)
npm run test:unit

# Integration tests saja
npm run test:integration

# Test spesifik
npm test -- tests/utils/slugGenerator.test.js
```

---

## Deployment ke Vercel

### Prasyarat

- Akun Vercel ([vercel.com](https://vercel.com))
- Vercel CLI: `npm i -g vercel`

### Langkah Deployment

```bash
# 1. Login ke Vercel
vercel login

# 2. Deploy (pertama kali)
vercel

# 3. Set environment variables di Vercel Dashboard
# Settings → Environment Variables → tambahkan semua variabel dari .env
# (jangan deploy .env ke Vercel — gunakan dashboard)

# 4. Deploy ke production
vercel --prod
```

### Konfigurasi Environment Variables di Vercel

Buka **Vercel Dashboard → Project → Settings → Environment Variables** dan tambahkan:

| Variable | Environment |
|---|---|
| `SESSION_SECRET` | Production, Preview |
| `DATABASE_URL` | Production, Preview |
| `SUPABASE_URL` | Production, Preview |
| `SUPABASE_ANON_KEY` | Production, Preview |
| `SUPABASE_STORAGE_BUCKET` | Production, Preview |
| `ADMIN_EMAIL` | Production |
| `ADMIN_PASSWORD` | Production |
| `NODE_ENV` | Production → `production` |

> **Catatan:** Upload file di Vercel bersifat ephemeral (hilang saat redeploy). Untuk media yang persisten, gunakan Supabase Storage atau layanan object storage eksternal.

---

## Deployment ke VPS dengan PM2

### Instalasi PM2

```bash
npm install -g pm2
```

### Konfigurasi PM2

Buat file `ecosystem.config.js` di root project:

```javascript
module.exports = {
  apps: [
    {
      name: 'artupski-portfolio',
      script: 'src/app.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};
```

### Menjalankan dengan PM2

```bash
# Start aplikasi
pm2 start ecosystem.config.js --env production

# Lihat status
pm2 status

# Lihat logs
pm2 logs artupski-portfolio

# Restart
pm2 restart artupski-portfolio

# Stop
pm2 stop artupski-portfolio

# Auto-start saat server reboot
pm2 startup
pm2 save
```

---

## Konfigurasi Nginx (Reverse Proxy)

Contoh konfigurasi Nginx untuk domain `artupski.com`:

```nginx
server {
    listen 80;
    server_name artupski.com www.artupski.com;

    # Redirect HTTP ke HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name artupski.com www.artupski.com;

    # SSL Certificate (gunakan Certbot/Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/artupski.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/artupski.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Static files — serve langsung dari Nginx
    location /css/ {
        alias /var/www/artupski.com/src/public/css/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location /js/ {
        alias /var/www/artupski.com/src/public/js/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location /images/ {
        alias /var/www/artupski.com/src/public/images/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location /uploads/ {
        alias /var/www/artupski.com/src/public/uploads/;
        expires 7d;
        add_header Cache-Control "public";
    }

    # Proxy semua request lain ke Node.js
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
        proxy_read_timeout 60s;
    }

    # Upload size limit
    client_max_body_size 10M;
}
```

### Install SSL dengan Certbot

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d artupski.com -d www.artupski.com

# Auto-renewal (sudah otomatis, tapi bisa test dengan)
sudo certbot renew --dry-run
```

---

## Struktur Project

```
artupski.com/
├── src/
│   ├── app.js                    # Entry point Express
│   ├── routes/                   # Route handlers
│   ├── controllers/              # Request handlers
│   ├── models/                   # Database models (Supabase)
│   ├── middlewares/              # Auth, rate limiter, error handler
│   ├── config/                   # Database, session, multer config
│   ├── database/                 # Migrations, seed
│   ├── utils/                    # Slug, SEO, settings, media utilities
│   ├── views/                    # EJS templates
│   │   ├── layouts/              # main.ejs, admin.ejs
│   │   ├── partials/             # head, navbar, footer, sidebar, alerts
│   │   ├── pages/                # Public pages
│   │   └── admin/                # Admin panel pages
│   └── public/                   # Static assets
│       ├── css/                  # Compiled TailwindCSS
│       ├── js/                   # theme.js, app.js, admin.js
│       ├── images/               # Static images
│       └── uploads/              # User-uploaded media
├── tests/                        # Test files
├── .env.example
├── .gitignore
├── package.json
├── tailwind.config.js
├── vercel.json
├── PLAN.md
├── CHANGELOG.md
└── README.md
```

---

## Lisensi

Proyek ini dilisensikan di bawah [MIT License](LICENSE).

Copyright (c) 2026 Angga Dwy Saputra
