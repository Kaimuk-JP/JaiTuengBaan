# Docker Setup Instructions 🐳

## Prerequisites
- Docker Desktop installed
- Docker Compose installed

## 🔧 Environment Variables

สร้างไฟล์ `.env` ที่ root directory พร้อมค่าต่อไปนี้:

```env
# ===========================================
# DATABASE (Local PostgreSQL)
# ===========================================
POSTGRES_USER=volunteer
POSTGRES_PASSWORD=volunteer_secret
POSTGRES_DB=volunteer_smart
DATABASE_URL="postgresql://volunteer:volunteer_secret@postgres:5432/volunteer_smart?schema=public"

# ===========================================
# JWT
# ===========================================
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# ===========================================
# FRONTEND
# ===========================================
FRONTEND_URL="https://your-frontend-domain.com"
NEXT_PUBLIC_API_URL="https://your-api-domain.com"
NEXT_PUBLIC_FRONTEND_URL="https://your-frontend-domain.com"

# ===========================================
# SWAGGER (Production Protection)
# ===========================================
SWAGGER_USER="admin"
SWAGGER_PASSWORD="your-secure-password"
```

## 🚀 Quick Start

### วิธีที่ 1: รัน Dev บนเครื่อง (แนะนำสำหรับ Development)

ใช้ Docker รันเฉพาะ PostgreSQL ส่วน backend/frontend รันบนเครื่องตามปกติ:

```bash
# 1. รัน PostgreSQL
docker compose -f docker-compose.dev.yml up -d

# 2. Migrate database (ครั้งแรก หรือ เมื่อ schema เปลี่ยน)
cd backend
npx prisma migrate dev

# 3. Seed ข้อมูล (ถ้าต้องการ)
npx ts-node prisma/seed-all.ts

# 4. รัน backend
npm run start:dev

# 5. รัน frontend (terminal ใหม่)
cd ../frontend
npm run dev
```

### วิธีที่ 2: รันทุกอย่างบน Docker (Production-like)

```bash
# รันพร้อม build
docker compose up --build

# รันแบบ background
docker compose up -d --build
```

### หยุด Services

```bash
# Docker Dev (PostgreSQL เท่านั้น)
docker compose -f docker-compose.dev.yml down

# Docker Full Stack
docker compose down

# หยุดพร้อมลบ data (⚠️ ข้อมูลใน DB จะหาย)
docker compose down -v
```

## 🗄️ Database Management

### Prisma Studio (GUI สำหรับดูข้อมูล)
```bash
cd backend
npx prisma studio
# เปิดที่ http://localhost:5555
```

### สร้าง Migration ใหม่
```bash
cd backend
npx prisma migrate dev --name your_migration_name
```

### Deploy Migration (Production)
```bash
cd backend
npx prisma migrate deploy
```

### Reset Database (⚠️ ลบข้อมูลทั้งหมด)
```bash
cd backend
npx prisma migrate reset
```

### เชื่อมต่อ PostgreSQL ด้วย CLI
```bash
# ผ่าน Docker
docker exec -it volunteer-smart-db psql -U volunteer -d volunteer_smart

# หรือใช้ psql จากเครื่อง
psql -h localhost -U volunteer -d volunteer_smart
```

## 🔨 Individual Docker Builds

### Backend
```bash
cd backend
docker build -t volunteer-smart-backend .
docker run -p 3001:3001 --env-file ../.env volunteer-smart-backend
```

### Frontend
```bash
cd frontend
docker build -t volunteer-smart-frontend \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:3001 \
  --build-arg NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000 .
docker run -p 3000:3000 volunteer-smart-frontend
```

## 🌐 Access the Application

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001 |
| Health Check | http://localhost:3001/health |
| Swagger Docs | http://localhost:3001/api/docs |
| Prisma Studio | http://localhost:5555 |
| PostgreSQL | localhost:5432 |

## 📋 Logs

```bash
# ดู logs ทั้งหมด
docker compose logs -f

# ดู logs เฉพาะ service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres

# ดู logs 100 บรรทัดล่าสุด
docker compose logs --tail=100
```

## 🔄 Rebuild เฉพาะ Service

```bash
# Rebuild เฉพาะ backend
docker compose up -d --build backend

# Rebuild เฉพาะ frontend
docker compose up -d --build frontend
```

## 🧹 Cleanup

```bash
# ลบ containers ที่หยุดทำงาน
docker container prune

# ลบ images ที่ไม่ได้ใช้
docker image prune

# ลบทุกอย่างที่ไม่ได้ใช้
docker system prune -a
```

## ⚠️ Troubleshooting

### Database เชื่อมต่อไม่ได้
```bash
# ตรวจสอบว่า postgres container รันอยู่
docker ps | findstr postgres

# ดู logs ของ postgres
docker compose logs postgres

# ลอง restart
docker compose -f docker-compose.dev.yml restart postgres
```

### Port ถูกใช้งานอยู่
```bash
# ตรวจสอบ port ที่ใช้งาน
netstat -ano | findstr :3000
netstat -ano | findstr :3001
netstat -ano | findstr :5432

# หยุด process ที่ใช้ port
taskkill /PID <PID> /F
```

### Container ไม่ start
```bash
# ดู logs ของ container
docker compose logs backend

# เข้าไปใน container
docker exec -it volunteer-smart-backend sh
```

### Migration ล้มเหลว
```bash
# ลอง reset database (⚠️ ลบข้อมูลทั้งหมด)
cd backend
npx prisma migrate reset

# หรือ mark migration as applied
npx prisma migrate resolve --applied <migration_name>
```
