# Volunteer Smart

ระบบจัดการอาสาสมัครรับ-ส่งประชาชนไปโรงพยาบาล (`Volunteer E-Service`) สำหรับเชื่อมต่อประชาชน, ผู้ดูแล, อาสาสมัคร, และเจ้าหน้าที่เข้าด้วยกันในระบบเดียว

---

## ภาพรวมโปรเจกต์

`Volunteer Smart` เป็นระบบเว็บแอปแบบ full-stack ที่ออกแบบมาสำหรับงานบริการรับ-ส่งประชาชนไปโรงพยาบาล พร้อม workflow สำหรับการจองคิว, จัดการประชาชนในความดูแล, มอบหมายงาน, ติดตามสถานะ, แจ้งเตือน, และดูประวัติการใช้งาน

ระบบแบ่งการทำงานออกเป็น 6 บทบาทหลัก

| บทบาท | คำอธิบาย |
|--------|----------|
| **ประชาชน/ผู้สูงอายุ (USERS)** | จองคิวรับ-ส่ง, ดูสถานะการเดินทาง, ยืนยันงาน |
| **ผู้ดูแลประชาชน (CAREGIVER)** | จองคิวแทน, เพิ่ม/จัดการประชาชนในความดูแล |
| **อาสาสมัครขับรถ (DRIVE)** | รับงาน, เลือกรถ, ดูเส้นทาง, อัปเดตสถานะงาน |
| **ผู้ดูแลระหว่างเดินทาง (CAREU)** | ดูแลผู้ป่วยระหว่างเดินทาง |
| **เจ้าหน้าที่ (STAFF)** | อนุมัติคำขอ, จัดการคิว, มอบหมายงาน, ดูรายงาน, จัดการยานพาหนะ/อุปกรณ์ |
| **ผู้ดูแลระบบ (ADMIN)** | จัดการสิทธิ์, ดู logs, จัดการ portals, บริหารระบบระดับสูง |

---

## ฟีเจอร์หลัก

- 🏥 จองคิวรับ-ส่งประชาชนไปโรงพยาบาล (ผู้ใช้หรือผู้ดูแลจองแทนได้)
- 📋 จัดการคิวงานและการมอบหมายอาสาสมัคร / ผู้ดูแลระหว่างเดินทาง
- 📍 ติดตามตำแหน่งแบบ real-time ผ่าน Socket.IO + Mapbox
- 👥 ระบบ caregiver-patient relationship พร้อมเอกสารยืนยัน
- 🚗 จัดการยานพาหนะ (ข้อมูลรถ, สถานะ, ระยะทาง, ประเภทน้ำมัน)
- 🏆 ระบบคะแนน (points) และของรางวัล (rewards) สำหรับอาสาสมัคร
- ⭐ ระบบให้คะแนนและรีวิวบริการ (municipal rating)
- 🔔 ระบบแจ้งเตือนผ่าน LINE Messaging API และ Socket.IO
- 🩺 จัดการข้อมูลโรค, โรงพยาบาล, อุปกรณ์เสริม
- 📝 ระบบขอแก้ไขโปรไฟล์ (profile edit request) ผ่านการอนุมัติ
- 🏠 ระบบยืนยันที่พักอาศัย (residence claim) เชื่อมต่อ IAM
- 📊 Dashboard และรายงานสรุปต่าง ๆ (disbursement, job reports)
- 📸 อัปโหลดรูปภาพ/ไฟล์ประกอบ พร้อม image compression (sharp)
- 📅 ระบบจัดการ time slot สำหรับการจอง
- 🔒 ระบบ activity log สำหรับติดตามการใช้งาน
- ⏱️ Scheduler สำหรับงาน background (node-cron)
- 🔐 นโยบายความเป็นส่วนตัว (privacy policy acceptance)

---

## Tech Stack

### Frontend

| เทคโนโลยี | เวอร์ชัน | ใช้สำหรับ |
|-----------|---------|----------|
| Next.js | ^16.1.6 | Framework หลัก |
| React | ^19.2.0 | UI library |
| TypeScript | ^5 | Type safety |
| Tailwind CSS | ^4.1.18 | Styling |
| MUI (Material UI) | ^9.0.0 | Component library |
| Emotion | ^11.14 | CSS-in-JS สำหรับ MUI |
| Mapbox GL / react-map-gl | ^3.22 / ^8.1.1 | แผนที่และ GPS tracking |
| Socket.IO Client | ^4.8.1 | Real-time communication |
| Chart.js / react-chartjs-2 | ^4.5 / ^5.3 | กราฟและ Dashboard |
| SweetAlert2 | ^11.14 | Dialog และ alert |
| LINE LIFF | ^2.27 | LINE Login ฝั่ง frontend |
| lucide-react | ^0.562 | Icons |
| xlsx | ^0.18 | Export ข้อมูล Excel |
| date-fns | ^4.1.0 | จัดการวันที่ |
| react-datepicker | ^9.1.0 | Date picker component |
| react-webcam | ^7.2.0 | ถ่ายรูปผ่าน webcam |
| thai-address-database | ^0.0.30 | ฐานข้อมูลที่อยู่ไทย |
| gov-layout / gov-sso-login | ^1.3.4 / ^1.3.2 | ระบบ SSO ภาครัฐ |

### Backend

| เทคโนโลยี | เวอร์ชัน | ใช้สำหรับ |
|-----------|---------|----------|
| NestJS | ^11.0.1 | Framework หลัก |
| Prisma | ^7.0.1 | ORM + database migration |
| PostgreSQL | 16 (Docker) | ฐานข้อมูลหลัก |
| Passport + JWT | ^0.7 / ^11.0.1 | Authentication |
| Socket.IO | ^4.8.1 | Real-time server |
| Swagger | ^11.2.6 | API documentation |
| class-validator / class-transformer | ^0.14 / ^0.5 | DTO validation |
| node-cron | ^4.2.1 | Scheduled tasks |
| sharp | ^0.34.5 | Image processing |
| bcrypt | ^6.0.0 | Password hashing |
| helmet | ^8.1.0 | Security headers |
| @nestjs/throttler | ^6.5.0 | Rate limiting |
| pg | ^8.20.0 | PostgreSQL driver |

### Integrations

- **LINE Login** — เข้าสู่ระบบผ่าน LINE
- **LINE Messaging API** — Push/Reply messages, Rich Menu
- **LINE LIFF** — Login ผ่าน LINE app
- **IAM-GOV SSO** — ระบบยืนยันตัวตนภาครัฐ (govcenter)
- **Geocoding** — แปลงที่อยู่เป็นพิกัด
- **Mapbox** — แสดงแผนที่และเส้นทาง
- **Residence Service** — ยืนยันที่พักอาศัยผ่าน IAM

---

## โครงสร้างโปรเจกต์

```text
Volunteer_Smart/
├── backend/                          # NestJS API server
│   ├── src/
│   │   ├── main.ts                   # Bootstrap, CORS, Swagger, Helmet
│   │   ├── app.module.ts             # Root module (guards, throttler, static)
│   │   ├── app.controller.ts         # Health check, root endpoints
│   │   ├── common/
│   │   │   ├── constants/            # Shared constants
│   │   │   ├── decorators/           # @Public(), @Roles()
│   │   │   ├── filters/              # GlobalExceptionFilter
│   │   │   ├── guards/               # JwtAuthGuard, RolesGuard
│   │   │   ├── helpers/              # org-id helper
│   │   │   └── templates/            # Notification/message templates
│   │   ├── core/
│   │   │   ├── config/               # Environment config module
│   │   │   └── prisma/               # Prisma service + module
│   │   └── modules/
│   │       ├── business/             # โดเมนหลักทางธุรกิจ
│   │       │   ├── booking-time-slot/ # จัดการ time slot
│   │       │   ├── caregiver/        # ผู้ดูแล-ผู้ป่วย relationship
│   │       │   ├── disease/          # จัดการข้อมูลโรค
│   │       │   ├── equipment/        # อุปกรณ์เสริม
│   │       │   ├── hospital/         # โรงพยาบาล
│   │       │   ├── job/              # งาน (รับ-ส่ง)
│   │       │   ├── queue/            # คิวการจอง
│   │       │   └── vehicle/          # ยานพาหนะ
│   │       ├── core/                 # โมดูลแกนหลัก
│   │       │   ├── auth/             # Authentication (LINE, JWT, SSO)
│   │       │   └── user/             # User management
│   │       ├── features/             # ฟีเจอร์เสริม
│   │       │   ├── points/           # ระบบคะแนน
│   │       │   ├── profile-edit-request/ # ขอแก้ไขโปรไฟล์
│   │       │   ├── reward/           # ของรางวัล + redemption
│   │       │   └── upload/           # อัปโหลดไฟล์
│   │       ├── integration/          # เชื่อมต่อบริการภายนอก
│   │       │   ├── geocode/          # Geocoding service
│   │       │   ├── line-messaging/   # LINE Messaging API
│   │       │   ├── location/         # Location tracking (Socket.IO)
│   │       │   └── residence/        # Residence verification (IAM)
│   │       └── system/               # โมดูลระบบ
│   │           ├── activity-log/     # Activity logging
│   │           ├── history/          # ประวัติการใช้งาน
│   │           ├── notification/     # แจ้งเตือน (socket + LINE)
│   │           ├── scheduler/        # Cron jobs
│   │           └── settings/         # ตั้งค่าระบบ
│   ├── prisma/
│   │   ├── schema.prisma             # Database schema (20+ models)
│   │   ├── migrations/               # Migration files
│   │   ├── seed-all.ts               # Seed script
│   │   └── seed-diseases.ts          # Seed ข้อมูลโรค
│   ├── uploads/                      # ไฟล์ที่อัปโหลด
│   ├── Dockerfile                    # Production Docker build
│   └── package.json
│
├── frontend/                          # Next.js web application
│   ├── app/
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Landing page
│   │   ├── globals.css               # Global styles (Tailwind)
│   │   ├── login/                    # Login page (LINE + SSO)
│   │   ├── auth/                     # Auth callback, LIFF, onboarding
│   │   ├── select-role/              # เลือกบทบาทหลังล็อกอิน
│   │   ├── elderly/                  # 🧓 หน้าประชาชน/ผู้สูงอายุ
│   │   │   ├── home/                 #    หน้าหลัก
│   │   │   ├── booking/              #    จองคิว
│   │   │   ├── confirm/              #    ยืนยันงาน
│   │   │   ├── history/              #    ประวัติ
│   │   │   ├── profile/              #    โปรไฟล์
│   │   │   ├── register/             #    ลงทะเบียน
│   │   │   ├── verify/               #    ยืนยันตัวตน
│   │   │   └── settings/             #    ตั้งค่า
│   │   ├── caregiver/                # 👨‍⚕️ หน้าผู้ดูแล
│   │   │   ├── home/                 #    หน้าหลัก
│   │   │   ├── patients/             #    ผู้ป่วยในความดูแล
│   │   │   ├── add-patient/          #    เพิ่มผู้ป่วย
│   │   │   ├── booking/              #    จองคิวแทน
│   │   │   ├── register-elderly/     #    ลงทะเบียนผู้สูงอายุ
│   │   │   ├── notifications/        #    แจ้งเตือน
│   │   │   └── ...                   #    history, confirm, profile, settings
│   │   ├── volunteer/                # 🚗 หน้าอาสาสมัคร
│   │   │   ├── home/                 #    หน้าหลักรับงาน
│   │   │   ├── driver/               #    ข้อมูลคนขับ
│   │   │   ├── careu/                #    ข้อมูลผู้ดูแลระหว่างเดินทาง
│   │   │   ├── pending/              #    งานรอรับ
│   │   │   ├── calendar/             #    ปฏิทินงาน
│   │   │   ├── booking-history/      #    ประวัติงาน
│   │   │   ├── work-history/         #    ประวัติการทำงาน
│   │   │   ├── rewards/              #    ของรางวัล/แลกคะแนน
│   │   │   ├── verify/               #    ยืนยันตัวตน
│   │   │   └── ...                   #    profile, profile-editor, settings
│   │   ├── staff/                    # 👔 หน้าเจ้าหน้าที่
│   │   │   ├── dashboard/            #    Dashboard ภาพรวม
│   │   │   ├── petition/             #    อนุมัติคำขอจอง
│   │   │   ├── petition-edit/        #    อนุมัติแก้ไขโปรไฟล์
│   │   │   ├── caregiver-requests/   #    อนุมัติผู้ดูแล
│   │   │   ├── volunteers/           #    จัดการอาสาสมัคร
│   │   │   ├── personnel/            #    จัดการบุคลากร
│   │   │   ├── vehicles/             #    จัดการยานพาหนะ
│   │   │   ├── rewards/              #    จัดการของรางวัล
│   │   │   ├── reports/              #    รายงาน
│   │   │   ├── job-reports/          #    รายงานงาน
│   │   │   ├── disbursement-report/  #    รายงานการเบิกจ่าย
│   │   │   ├── history/              #    ประวัติ
│   │   │   ├── notifications/        #    แจ้งเตือน
│   │   │   └── settings/             #    ตั้งค่า (time slots, equipment, ...)
│   │   ├── admin/                    # 🛡️ หน้าผู้ดูแลระบบ
│   │   │   ├── roles/                #    จัดการสิทธิ์
│   │   │   ├── portals/              #    จัดการ portals
│   │   │   ├── logs/                 #    Activity logs
│   │   │   └── delete-users/         #    ลบผู้ใช้
│   │   ├── map/                      # แผนที่ (public)
│   │   ├── api/                      # Next.js API Routes
│   │   │   ├── auth/                 #    Auth callback
│   │   │   └── municipalities/       #    ข้อมูลเทศบาล
│   │   ├── debug/                    # Debug page (dev only)
│   │   └── server-error/             # Error page
│   ├── components/
│   │   ├── shared/                   # Shared components
│   │   │   ├── ProtectedRoute.tsx    #    Route guard ตาม role
│   │   │   ├── RoleHeader.tsx        #    Header ตามบทบาท
│   │   │   ├── RoleSidebar.tsx       #    Sidebar ตามบทบาท
│   │   │   ├── ThaiDatePicker.tsx    #    Date picker ภาษาไทย
│   │   │   ├── ThaiAddressAutocomplete.tsx
│   │   │   ├── ThaiAddressStepperModal.tsx
│   │   │   ├── DiseaseAutocomplete.tsx
│   │   │   ├── EquipmentSelector.tsx
│   │   │   ├── MunicipalityAutocomplete.tsx
│   │   │   ├── CameraCapture.tsx     #    ถ่ายรูป
│   │   │   ├── WebcamModal.tsx
│   │   │   ├── PrivacyPolicyModal.tsx
│   │   │   ├── LazyCharts.tsx
│   │   │   └── ...
│   │   ├── admin/                    # Admin-specific components
│   │   ├── caregiver/                # Caregiver components
│   │   ├── careu/                    # CareU components
│   │   ├── driver/                   # Driver components
│   │   ├── elderly/                  # Elderly components
│   │   ├── feedback/                 # Rating/feedback components
│   │   ├── icons/                    # Custom icon components
│   │   ├── maps/                     # Map components
│   │   ├── notification/             # Notification components
│   │   ├── profile/                  # Profile components
│   │   ├── residence/                # Residence components
│   │   ├── settings/                 # Settings components
│   │   ├── staff/                    # Staff-specific components
│   │   └── volunteer/                # Volunteer components
│   ├── contexts/
│   │   ├── AuthContext.tsx           # Authentication state
│   │   ├── SocketContext.tsx         # Socket.IO connection
│   │   └── SettingsContext.tsx       # App settings
│   ├── hooks/
│   │   ├── useApiQuery.ts            # Data fetching hook
│   │   ├── useApiMutation.ts         # Data mutation hook
│   │   ├── useJobStatus.ts           # Job status tracking
│   │   ├── useNotifications.ts       # Notification hook
│   │   ├── useSocketRefresh.ts       # Socket refresh hook
│   │   ├── useBodyScrollLock.ts      # Scroll lock utility
│   │   └── useDebouncedValue.ts      # Debounce utility
│   ├── lib/
│   │   ├── api-client.ts             # HTTP client wrapper
│   │   ├── api.ts                    # API base config
│   │   ├── auth.ts                   # Auth utilities
│   │   ├── liff.ts                   # LINE LIFF helper
│   │   ├── swal.ts                   # SweetAlert2 presets
│   │   └── image-utils.ts            # Image utilities
│   ├── utils/
│   │   ├── browserDetection.ts       # Browser detection
│   │   ├── fileValidation.ts         # File validation
│   │   ├── govNotificationHelpers.ts # Gov notification helpers
│   │   ├── jobHelpers.ts             # Job status helpers
│   │   ├── profileValidation.ts      # Profile validation
│   │   └── image.ts                  # Image utilities
│   ├── constants/
│   │   ├── diseases.ts               # รายชื่อโรค
│   │   ├── hospitals.ts              # รายชื่อโรงพยาบาล
│   │   └── roles.ts                  # Role constants
│   ├── types/
│   │   ├── user.ts                   # User types
│   │   └── common.ts                 # Common types
│   ├── middleware.ts                  # Auth middleware (JWT validation)
│   ├── next.config.ts                # Next.js configuration
│   ├── tailwind.config.ts            # Tailwind configuration
│   ├── Dockerfile                    # Production Docker build
│   └── package.json
│
├── docker-compose.yml                 # Production: postgres + backend + frontend
├── docker-compose.dev.yml             # Dev: postgres only
├── DOCKER.md                          # Docker documentation
├── PRIVACY_NOTICE.md                  # Privacy notice
├── .gitignore
└── README.md
```

> **หมายเหตุ:** โฟลเดอร์ `backend/dist`, `frontend/.next`, และ `node_modules` เป็นไฟล์ที่สร้างอัตโนมัติ ไม่ใช่ source code หลัก

---

## Data Models (Prisma Schema)

ระบบมีทั้งหมด 20+ models หลัก:

| Model | คำอธิบาย |
|-------|----------|
| `Organization` | องค์กร/เทศบาลที่ใช้ระบบ |
| `User` | ประชาชนทุกบทบาท (USERS, CAREGIVER, DRIVE, CAREU, STAFF, ADMIN) |
| `Queue` | คิวการจองรับ-ส่ง |
| `Job` | งานที่มอบหมาย (ผูกกับ Queue 1:1) |
| `CaregiverPatient` | ความสัมพันธ์ผู้ดูแล-ผู้ป่วย |
| `Hospital` | โรงพยาบาล |
| `Disease` / `UserDisease` | โรคและโรคของผู้ใช้ |
| `Vehicle` / `VehicleMileageLog` | ยานพาหนะและบันทึกระยะทาง |
| `Equipment` | อุปกรณ์เสริม |
| `Notification` | การแจ้งเตือน |
| `ProfileEditRequest` | คำขอแก้ไขโปรไฟล์ |
| `Reward` / `Redemption` / `RewardStockHistory` | ระบบของรางวัลและการแลกคะแนน |
| `MunicipalRating` | การให้คะแนนบริการ (6 เกณฑ์) |
| `BookingTimeSlot` | ช่วงเวลาจอง |
| `ResourceTimeSlot` | จองทรัพยากร (รถ, คนขับ, CareU) |
| `ActivityLog` | บันทึกกิจกรรม |
| `Settings` | ตั้งค่าระบบ (key-value) |
| `ResidenceClaim` / `IamUserResidence` | ข้อมูลที่พักอาศัย + IAM |

---

## การติดตั้งและเริ่มใช้งาน

### 1) Clone โปรเจกต์

```bash
git clone https://github.com/Jakprim-2004/Volunteer_Smart.git
cd Volunteer_Smart
```

### 2) ติดตั้ง dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3) ตั้งค่า environment variables

#### Backend `.env`

สร้างไฟล์ `backend/.env`:

```env
# Database
DATABASE_URL="prisma+postgres://..."

# JWT
JWT_SECRET="your-secret-key"

# Frontend URL (CORS)
FRONTEND_URL="http://localhost:3000"

# IAM-GOV SSO
IAM_GOV_API_URL="https://api-auth.govcenter.co"
E_SERVICE_API_KEY="your-api-key"
E_SERVICE_CODE="your-service-code"

# Swagger (Production only)
SWAGGER_USER="admin"
SWAGGER_PASSWORD="your-password"
```

#### Frontend `.env`

สร้างไฟล์ `frontend/.env`:

```env
# API
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_FRONTEND_URL="http://localhost:3000"

# E-Service
NEXT_PUBLIC_E_SERVICE_CODE="your-service-code"

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN="your-mapbox-token"
NEXT_PUBLIC_MAPBOX_STYLE="mapbox://styles/..."

# Server-side (Next.js API Routes)
GOV_API_URL="https://api-volunteer-eservice.govcenter.co/"
IAM_GOV_API_URL="https://api-auth.govcenter.co"
E_SERVICE_API_KEY="your-api-key"
E_SERVICE_CODE="your-service-code"
```

### 4) ตั้งค่า Database

```bash
# วิธีที่ 1: ใช้ Docker สำหรับ PostgreSQL (แนะนำ)
docker compose -f docker-compose.dev.yml up -d

# วิธีที่ 2: ใช้ PostgreSQL ที่ติดตั้งเอง
# แก้ DATABASE_URL ใน backend/.env ให้ตรงกับ server ของคุณ
```

### 5) ตั้งค่า Prisma

```bash
cd backend
npx prisma generate    # สร้าง Prisma Client
npx prisma db push     # Push schema ไป database
```

### 6) รันโปรเจกต์

```bash
# Backend (port 3001)
cd backend
npm run start:dev

# Frontend (port 3000) — เปิด terminal ใหม่
cd frontend
npm run dev
```

เข้าใช้งานที่ `http://localhost:3000`

---

## Docker

### Development (PostgreSQL อย่างเดียว)

```bash
docker compose -f docker-compose.dev.yml up -d
```

### Production (ทั้งระบบ)

```bash
# สร้าง network (ครั้งแรก)
docker network create web-network

# รัน services ทั้งหมด (postgres + backend + frontend)
docker-compose up --build

# หยุด services
docker-compose down
```

> ดูรายละเอียดเพิ่มเติมที่ `DOCKER.md`

---

## API Documentation

| Method | Endpoint | คำอธิบาย |
|--------|----------|----------|
| `GET` | `/` | ทดสอบ API |
| `GET` | `/health` | ตรวจสอบการเชื่อมต่อฐานข้อมูล |
| `GET` | `/api` | Swagger Documentation |

### Swagger API Tags

| Tag | คำอธิบาย |
|-----|----------|
| Auth | Authentication & Authorization |
| Users | User Management |
| Queues | Queue/Booking Management |
| Jobs | Job Management |
| Notifications | Notification Management |
| Upload | File Upload |
| ProfileEditRequest | Profile Edit Request Management |
| LINE Messaging | LINE Messaging API — Push, Reply, Rich Menu |

> **Production:** Swagger ถูกป้องกันด้วย HTTP Basic Auth (`SWAGGER_USER` / `SWAGGER_PASSWORD`)

---

## Security

- **Helmet** — Security headers (CSP, CORP, etc.)
- **JWT** — Access token + refresh token (cookie-based)
- **CORS** — จำกัด origin ตาม `FRONTEND_URL`
- **Rate Limiting** — 3 tiers: default (100/min), strict (5/15min), relaxed (300/min)
- **Global Guards** — `JwtAuthGuard` + `RolesGuard` + `ThrottlerGuard`
- **@Public()** decorator — ยกเว้น endpoints ที่ไม่ต้อง auth
- **@Roles()** decorator — จำกัดการเข้าถึงตาม role
- **Middleware** — Frontend middleware ตรวจสอบ JWT expiration ก่อนเข้า protected routes
- **Activity Log** — บันทึกทุกการกระทำสำคัญ (AUTH, QUEUE, JOB, VEHICLE, ...)
- **Input Validation** — class-validator + whitelist + forbidNonWhitelisted

---

## สถาปัตยกรรมที่สำคัญ

### Backend Architecture

```
AppModule
├── Global Guards: JwtAuth → Roles → Throttler
├── Global Filters: GlobalExceptionFilter
├── Global Pipes: ValidationPipe (whitelist, transform)
│
├── modules/core/          → Auth (LINE + JWT), User management
├── modules/business/      → Queue, Job, Hospital, Vehicle, Equipment, etc.
├── modules/features/      → Points, Rewards, Upload, Profile edit
├── modules/integration/   → LINE Messaging, Geocode, Location (Socket), Residence
└── modules/system/        → Notification, Scheduler, Activity Log, History, Settings
```

### Frontend Architecture

```
Next.js App Router
├── middleware.ts           → JWT validation, route protection
├── contexts/               → Auth, Socket.IO, Settings (global state)
├── hooks/                  → useApiQuery, useApiMutation, useJobStatus, etc.
├── lib/                    → API client, LIFF, SweetAlert presets
├── components/shared/      → ProtectedRoute, RoleHeader, ThaiDatePicker, etc.
└── app/[role]/             → Route pages แยกตามบทบาท
```

### จุดเด่น

- ✅ Backend แยก module ตาม layer (business / features / integration / system / core)
- ✅ Frontend แยก route และ component ตามบทบาทผู้ใช้
- ✅ มี shared components จำนวนมาก ลดการเขียนซ้ำ
- ✅ Real-time layer ผ่าน Socket.IO สำหรับ location tracking + notification
- ✅ มี integration layer สำหรับเชื่อมต่อบริการภายนอก (LINE, IAM, Geocode)
- ✅ Multi-organization support (data scoped by `organizationId`)
- ✅ Resource time slot สำหรับป้องกันการจองซ้ำ (รถ, คนขับ, CareU)

---

## คำสั่งที่ใช้บ่อย

### Backend Development

```bash
npm run start:dev          # รัน dev mode (hot reload)
npm run start:debug        # รัน debug mode
npm run build              # Build production
npm run start:prod         # รัน production
npm run lint               # Lint code
npm run format             # Format code (Prettier)
npm run test               # Run tests
npm run test:e2e           # Run e2e tests
```

### Prisma

```bash
npx prisma generate        # สร้าง Prisma Client
npx prisma db push         # Push schema ไป database
npx prisma studio          # เปิด Prisma Studio (GUI)
npx prisma migrate dev     # สร้าง migration
npx prisma migrate deploy  # Deploy migrations (production)
npx prisma format          # Format schema file
npx prisma validate        # Validate schema
```

### Frontend Development

```bash
npm run dev                # รัน dev mode (hot reload)
npm run build              # Build production
npm run start              # รัน production server
npm run lint               # Lint code
```

### Docker

```bash
docker compose -f docker-compose.dev.yml up -d    # Dev: PostgreSQL only
docker-compose up --build                          # Production: ทั้งระบบ
docker-compose down                                # หยุด services
docker-compose logs -f                             # ดู logs
docker-compose logs -f backend                     # ดู logs เฉพาะ backend
```

---

## เอกสารประกอบ

| ไฟล์ | คำอธิบาย |
|------|----------|
| `README.md` | ภาพรวมโปรเจกต์และคู่มือติดตั้ง (ไฟล์นี้) |
| `DOCKER.md` | รายละเอียดการ deploy ด้วย Docker |
| `PRIVACY_NOTICE.md` | นโยบายความเป็นส่วนตัว |
| `backend/README.md` | รายละเอียดฝั่ง backend |
| `frontend/README.md` | รายละเอียดฝั่ง frontend |
| `/api` (Swagger) | API documentation แบบ interactive |

---

## หมายเหตุ

- ค่าจริงของ environment variables ต้องตั้งตามสภาพแวดล้อมที่ใช้งาน — **ห้าม commit ไฟล์ `.env` ขึ้น git**
- บาง integration เช่น LINE / IAM-GOV / Geocode / Residence อาจต้องเปิดใช้งาน service ภายนอกและมี API key
- ไฟล์ generated เช่น `backend/dist` และ `frontend/.next` ควรถูกสร้างจากคำสั่ง build แทนการแก้ไขตรง ๆ
- ระบบรองรับ multi-organization — ข้อมูลหลายส่วนถูก scope ตาม `organizationId`
- Mapbox token ต้องสมัครจาก [mapbox.com](https://www.mapbox.com/)
- LINE Login / LIFF / Messaging API ต้องตั้งค่าที่ [LINE Developers Console](https://developers.line.biz/)
