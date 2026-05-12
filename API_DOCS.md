# Alpha CIMS — API Documentation

> Base URL: `https://your-domain.com`  
> Barcha so'rovlar `Authorization: Bearer <token>` header talab qiladi (login endpointlaridan tashqari).  
> Barcha javoblar `{"data": ..., "meta": ...}` formatida qaytadi.

---

## Autentifikatsiya

### POST `/auth/login`
Login qilish, token olish.

**Body (JSON):**
```json
{ "phone_or_email": "+998901234567", "password": "secret" }
```
**Javob:**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}
```

### POST `/auth/refresh`
Access tokenni yangilash.

**Body:** `{ "refresh_token": "eyJ..." }`  
**Javob:** Yangi `access_token` va `refresh_token`.

### GET `/auth/me`
Joriy foydalanuvchi ma'lumotlari.

**Javob:**
```json
{
  "data": {
    "id": 1, "phone": "+998901234567", "email": "a@b.com",
    "full_name": "Admin", "is_super_admin": true, "status": "active",
    "permissions": ["students:view", "contracts:edit", "..."]
  }
}
```

---

## Foydalanuvchilar `/users`

> Kerakli permission: `users:manage`

### GET `/users`
Barcha foydalanuvchilar ro'yxati (pagination bilan).

**Query params:** `page`, `page_size`  
**Javob:** `data: [UserWithRoles[]]`

```json
{
  "data": [
    {
      "id": 1, "phone": "+998901234567", "email": "a@b.com",
      "full_name": "Admin", "is_super_admin": true,
      "status": "active", "created_at": "2026-01-01T00:00:00Z",
      "roles": [{ "id": 1, "name": "Admin", "description": "..." }]
    }
  ],
  "meta": { "page": 1, "page_size": 20, "total": 5, "total_pages": 1 }
}
```

### GET `/users/coaches`
Faqat Coach rolidagi foydalanuvchilar (guruhlari bilan).

**Javob:** `data: [{ ...user, groups: [GroupRead[]] }]`

### GET `/users/{id}`
Bitta foydalanuvchi (rollari bilan).

### POST `/users`
Yangi foydalanuvchi yaratish.

**Body:**
```json
{
  "full_name": "Ism Familiya",
  "phone": "+998901234567",
  "password": "secret",
  "email": "optional@mail.com",
  "is_super_admin": false,
  "status": "active"
}
```
**Javob:** `data: UserRead`

### PATCH `/users/{id}`
Foydalanuvchini yangilash (faqat o'zgartiriladigan fieldlar).

**Body:** `{ "full_name"?, "phone"?, "email"?, "password"?, "status"? }`  
**Javob:** `data: UserRead`

### PATCH `/users/{id}/roles`
Foydalanuvchiga rollar biriktirish.

**Body:** `{ "role_ids": [1, 2] }`  
**Javob:** `data: UserWithRoles`

### DELETE `/users/{id}`
Foydalanuvchini o'chirish (super admin o'chirilmaydi).

**Javob:** `{ "data": { "message": "User deleted successfully" } }`

### POST `/users/bulk-delete`
Ko'p foydalanuvchini bir vaqtda o'chirish.

**Body:** `[1, 2, 3]` (ID lar ro'yxati)  
**Javob:** `{ "data": { "deleted_count": 2, "errors": null } }`

---

## Rollar `/roles`

> Kerakli permission: `roles:manage`

### GET `/roles`
Barcha rollar (permissionlari bilan).

**Javob:**
```json
{
  "data": [
    {
      "id": 1, "name": "Admin", "description": "...",
      "permissions": [{ "id": 1, "code": "students:view", "description": "..." }]
    }
  ]
}
```

### GET `/roles/permissions`
Tizimda mavjud barcha permissionlar ro'yxati (autentifikatsiya talab qilinadi).

**Javob:** `data: [{ "id", "code", "description" }]`

### POST `/roles`
Yangi rol yaratish.

**Body:** `{ "name": "Yangi Rol", "description": "...", "permission_ids": [1, 2] }`  
**Javob:** `data: RoleWithPermissions`

### PATCH `/roles/{id}`
Rolni yangilash.

**Body:** `{ "name"?, "description"?, "permission_ids"? }`  
**Javob:** `data: RoleWithPermissions`

### DELETE `/roles/{id}`
Rolni o'chirish.

---

## O'quvchilar `/students`

### GET `/students`
O'quvchilar ro'yxati (filterlash va pagination).

**Query params:**
| Param | Turi | Izoh |
|---|---|---|
| `page` | int | Sahifa raqami (default: 1) |
| `page_size` | int | Sahifadagi yozuvlar (default: 20, max: 100) |
| `status` | string | `active`, `inactive`, `deleted`, `archived` |
| `group_id` | int | Guruh bo'yicha filter |
| `birth_year` | int | Tug'ilish yili bo'yicha filter |
| `archive_year` | int | Arxiv yili |

**Javob:**
```json
{
  "data": [{
    "id": 1, "first_name": "Ali", "last_name": "Karimov",
    "date_of_birth": "2015-03-10", "height": 140, "weight": 35,
    "pnfl": "12345678901234", "phone": "+998901234567",
    "address": "Toshkent", "ampula": null, "millati": "O'zbek",
    "photo_url": "/students/files/TOKEN",
    "passport_url": "/students/files/TOKEN",
    "extra_file_url": "/students/files/TOKEN",
    "status": "active", "group_id": 1,
    "created_at": "2026-01-01T00:00:00Z"
  }],
  "meta": { "page": 1, "page_size": 20, "total": 100, "total_pages": 5 }
}
```

### GET `/students/search?query=Ali`
O'quvchilarni qidirish (ism, familiya, telefon, PNFL bo'yicha).

**Query params:** `query` (majburiy), `page`, `page_size`

### GET `/students/comprehensive-export`
Barcha o'quvchilarni Excel formatda yuklab olish (`.xlsx`).

### GET `/students/attendances/all`
Barcha davomat yozuvlari (filterlash bilan).

**Query params:** `from_date`, `to_date`, `group_id`, `student_id`, `page`, `page_size`

### POST `/students`
Yangi o'quvchi yaratish (multipart/form-data).

> Shu endpoint birdan student ham, contract ham yaratadi.

**Form fields:**
| Field | Turi | Majburiy |
|---|---|---|
| `first_name` | string | ✅ |
| `last_name` | string | ✅ |
| `date_of_birth` | date `YYYY-MM-DD` | ✅ |
| `height` | int (sm) | ✅ |
| `weight` | int (kg) | ✅ |
| `pnfl` | string (14 ta raqam) | ✅ |
| `customer_full_name` | string | ✅ |
| `customer_passport_number` | string | ✅ |
| `customer_address` | string | ✅ |
| `monthly_fee_amount` | int (so'm) | ✅ |
| `phone` | string | ❌ |
| `address` | string | ❌ |
| `ampula` | string | ❌ |
| `millati` | string | ❌ |
| `group_id` | int | ❌ |
| `uniform_fee_amount` | int | ❌ |
| `contract_start_date` | date | ❌ |
| `contract_end_date` | date | ❌ |
| `photo` | file (rasm) | ❌ |
| `passport` | file | ❌ |
| `extra_file` | file | ❌ |

**Javob:**
```json
{
  "data": {
    "student": { ...StudentRead },
    "contract": { ...ContractRead }
  }
}
```

### GET `/students/{id}`
Bitta o'quvchi ma'lumotlari.

### GET `/students/fullinfo/{id}`
O'quvchi to'liq ma'lumot (guruh, murabbiy, davomat, shartnoma bilan).

**Javob:**
```json
{
  "data": {
    "student": { ...StudentRead },
    "group": { ...GroupRead } | null,
    "coach": { ...UserRead } | null,
    "attendances": [ ...AttendanceRead[] ],
    "contract": { ...ContractRead } | null
  }
}
```

### GET `/students/{id}/contract`
O'quvchining shartnomasi.

### GET `/students/{id}/transactions`
O'quvchining to'lovlar tarixi.

### GET `/students/{id}/attendance`
O'quvchining davomat yozuvlari.

### GET `/students/{id}/gatelogs`
O'quvchining darvoza kirish/chiqish loglari.

### PATCH `/students/{id}`
O'quvchi ma'lumotlarini yangilash (multipart/form-data).

**Form fields:** Barchasi ixtiyoriy — `first_name`, `last_name`, `date_of_birth`, `height`, `weight`, `pnfl`, `phone`, `address`, `ampula`, `millati`, `status`, `group_id`

### PATCH `/students/{id}/group?group_id=1`
O'quvchiga guruh biriktirish (bir martalik, o'zgartirish mumkin emas).

**Query param:** `group_id` (majburiy)  
**Xatolar:** `400` — guruh allaqachon biriktirilgan; `409` — guruh to'la

### POST `/students/{id}/photo`
Profil rasmi yuklash (multipart).

**Form:** `photo` (image file)

### POST `/students/{id}/passport`
Pasport fayli yuklash (multipart).

**Form:** `passport` (file)

### POST `/students/{id}/extra-file`
Qo'shimcha fayl yuklash (multipart).

**Form:** `extra_file` (file)

### GET `/students/files/{token}`
Maxfiy fayl yuklab olish (token `/students/files/TOKEN` URLdan olinadi).

### DELETE `/students/{id}`
O'quvchini o'chirish (soft delete — status `deleted` bo'ladi).

### DELETE `/students/{id}/hard-delete`
O'quvchini bazadan butunlay o'chirish.

### POST `/students/bulk-delete`
Ko'p o'quvchini bir vaqtda o'chirish.

**Body:** `[1, 2, 3]`

---

## Shartnomalar `/contracts`

> `contracts:view` — ko'rish; `contracts:edit` — tahrirlash

### GET `/contracts`
Shartnomalar ro'yxati.

**Query params:** `search`, `status` (ACTIVE/TERMINATED/EXPIRED/ARCHIVED), `archive_year`, `page`, `page_size`

**Javob:**
```json
{
  "data": [{
    "id": 1, "student_id": 1, "contract_number": "1-2026",
    "sequence_number": 1, "contract_year": 2026, "archive_year": 2026,
    "birth_year": 2015, "status": "ACTIVE",
    "monthly_fee": 500000.0,
    "start_date": "2026-01-01", "end_date": "2026-12-31",
    "termination_reason": null, "terminated_at": null,
    "terminated_by_user_id": null, "terminated_by_full_name": null,
    "pdf_url": "/students/files/TOKEN",
    "custom_fields": { ... },
    "created_at": "...", "updated_at": "..."
  }],
  "meta": { ... }
}
```

### GET `/contracts/stats`
Shartnomalar statistikasi.

**Query params:** `archive_year`  
**Javob:**
```json
{
  "data": {
    "total": 100, "active": 80, "terminated": 10,
    "expired": 5, "archived": 5, "total_monthly_fee": 40000000.0
  }
}
```

### GET `/contracts/terminated`
Bekor qilingan shartnomalar (o'quvchi ma'lumotlari bilan).

**Query params:** `search`, `archive_year`, `page`, `page_size`  
**Javob:** `ContractWithStudentRead[]` — `student_first_name`, `student_last_name`, `student_phone` qo'shimcha.

### GET `/contracts/{id}`
Bitta shartnoma.

### PATCH `/contracts/{id}`
Shartnomani yangilash (PDF qayta yaratiladi).

**Body:**
```json
{
  "monthly_fee_amount": 600000,
  "contract_start_date": "2026-01-01",
  "contract_end_date": "2026-12-31",
  "customer_full_name": "Yangi Ism",
  "customer_passport_number": "AB1234567",
  "customer_address": "Yangi manzil",
  "status": "ACTIVE"
}
```

### PATCH `/contracts/{id}/monthly-fee`
Oylik to'lovni o'zgartirish.

**Body:** `{ "monthly_fee_amount": 600000 }`

### PATCH `/contracts/{id}/dates`
Shartnoma sanalarini o'zgartirish.

**Body:** `{ "start_date": "2026-01-01", "end_date": "2026-12-31" }`

### PATCH `/contracts/{id}/status`
Shartnoma statusini o'zgartirish.

**Body:** `{ "status": "ACTIVE" | "EXPIRED" | "ARCHIVED" | "TERMINATED" }`

### POST `/contracts/{id}/terminate`
Shartnomani bekor qilish.

> Shartnoma raqami `{raqam}-T-{yyyymmdd}` ga o'zgaradi. O'quvchi `INACTIVE` bo'ladi.

**Body:** `{ "termination_reason": "Sabab", "terminated_at": "2026-05-11T10:00:00" (ixtiyoriy) }`  
**Javob:** Yangilangan `ContractRead`

### POST `/contracts/{id}/regenerate-pdf`
PDFni qayta yaratish (ma'lumotlar o'zgargandan keyin).

### GET `/contracts/{id}/pdf`
Shartnoma PDFini yuklab olish.

**Javob:** `application/pdf` file (inline)

---

## Guruhlar `/groups`

> `groups:view` — ko'rish; `groups:edit` — tahrirlash

### GET `/groups`
Guruhlar ro'yxati.

**Query params:** `page`, `page_size`, `status`, `birth_year`, `coach_id`  
**Javob:**
```json
{
  "data": [{
    "id": 1, "name": "Yashlar-2015", "identifier": "Y1",
    "birth_year": 2015, "capacity": 20,
    "coach_id": 2, "coach_name": "Murabbiy Ism",
    "status": "active",
    "created_at": "..."
  }]
}
```

### GET `/groups/statistics`
Guruhlar umumiy statistikasi.

**Javob:**
```json
{
  "data": {
    "total_groups": 5, "total_capacity": 100,
    "total_used": 60, "total_available": 40,
    "filled_groups_count": 1,
    "by_birth_year": [{ "birth_year": 2015, "total_groups": 2, ... }]
  }
}
```

### GET `/groups/grouped-by-year`
Guruhlar yil bo'yicha guruhlangan.

**Javob:** `[{ "birth_year": 2015, "groups": [...] }]`

### GET `/groups/{id}`
Bitta guruh.

### GET `/groups/{id}/students`
Guruhdagi o'quvchilar ro'yxati.

### GET `/groups/{id}/capacity`
Guruh sig'imi ma'lumotlari.

**Javob:**
```json
{
  "data": {
    "group_id": 1, "group_name": "Yashlar", "capacity": 20,
    "active_students": 15, "available_slots": 5,
    "waiting_list_count": 3,
    "by_birth_year": { "2015": { "used": 15, "available": 5 } }
  }
}
```

### GET `/groups/{id}/export-students`
Guruh o'quvchilarini Excel formatda yuklab olish (`.xlsx`).

### POST `/groups`
Yangi guruh yaratish.

**Body:**
```json
{
  "name": "Yashlar-2015", "identifier": "Y1",
  "birth_year": 2015, "capacity": 20,
  "coach_id": 2
}
```

### PATCH `/groups/{id}`
Guruhni yangilash.

**Body:** `{ "name"?, "capacity"?, "coach_id"?, "status"? }`

### DELETE `/groups/{id}`
Guruhni o'chirish.

### POST `/groups/bulk-delete`
Ko'p guruhni o'chirish.

**Body:** `[1, 2, 3]`

---

## Murabbiy `/coach`

> Kerakli permission: `attendance:coach:mark`

### GET `/coach/groups`
Murabbiyga biriktirilgan guruhlar.

### GET `/coach/sessions`
Murabbiy guruhlari uchun trening sессiyalari.

**Query params:** `date` (YYYY-MM-DD), `from_date`, `to_date`

### GET `/coach/sessions/{id}`
Bitta sessiya (davomat yozuvlari bilan).

**Javob:**
```json
{
  "data": {
    "id": 1, "session_date": "2026-05-11", "topic": "Yugurish",
    "start_time": "10:00", "end_time": "11:30",
    "station": "Maydon", "group_id": 1,
    "attendances": [
      { "id": 1, "student_id": 5, "status": "present", "comment": null }
    ]
  }
}
```

### POST `/coach/sessions/{id}/attendance`
Bir o'quvchi davomatini belgilash.

**Body:** `{ "student_id": 5, "status": "present" | "absent" | "late", "comment": null }`  
**Javob:** `{ "message": "Attendance marked successfully", "attendance_id": 1 }`

### POST `/coach/sessions/{id}/bulk-attendance`
Ko'p o'quvchi davomatini bir vaqtda belgilash.

**Body:**
```json
{
  "session_id": 1,
  "attendances": [
    { "student_id": 5, "status": "present" },
    { "student_id": 6, "status": "absent", "comment": "Kasal" }
  ]
}
```

### GET `/coach/groups/{id}/attendance-stats`
Guruh uchun davomat statistikasi.

**Javob:** `{ "total_sessions", "present_count", "absent_count", "late_count", "attendance_rate" }`

### GET `/coach/students/{id}/attendance-stats`
O'quvchi uchun davomat statistikasi.

### GET `/coach/my-attendances`
Murabbiy belgilagan barcha davomat yozuvlari.

### GET `/coach/groups/{id}/performance-table`
Guruh natijaviy jadvali.

**Query params:** `season_year` (default: joriy yil)

### PUT `/coach/groups/{id}/performance-table`
Natijaviy jadvalni saqlash/yangilash.

**Body:**
```json
{
  "season_year": 2026, "title": "2026 Mavsumi",
  "matches": [{ "opponent": "FC Test", "match_date": "2026-05-01", "location": "Toshkent", "is_home": true }],
  "rows": [{ "student_id": 5, "cells": [{ "result": "win" }] }]
}
```

### POST `/coach/groups/{id}/performance-table/columns`
Natijaviy jadvalga yangi ustun (match) qo'shish.

**Body:** `{ "season_year": 2026, "opponent": "FC Test", "match_date": "2026-05-01", "location": "Toshkent", "is_home": true }`

### DELETE `/coach/groups/{id}/performance-table/columns/{col_id}?season_year=2026`
Ustunni o'chirish.

### PATCH `/coach/groups/{id}/performance-table/columns-reorder`
Ustunlar tartibini o'zgartirish.

**Body:** `{ "season_year": 2026, "match_ids": [3, 1, 2] }`

### GET `/coach/groups/{id}/performance-table/export?season_year=2026`
Natijaviy jadvalni Excel formatda yuklab olish (`.xlsx`).

### POST `/coach/sessions/{id}/upload-konspekt`
Sessiya konspektini yuklash.

**Form:** `file` (PDF/image fayl)

---

## Bosh murabbiy `/head-coach`

> `sessions:create` — sessiya yaratish; `sessions:manage` — boshqarish

### GET `/head-coach/groups`
Barcha aktiv guruhlar.

**Query params:** `birth_year`

### POST `/head-coach/sessions`
Yangi trening sessiyasi yaratish.

**Body:**
```json
{
  "group_id": 1,
  "session_date": "2026-05-11",
  "topic": "Yugurish mashqlari",
  "start_time": "10:00",
  "end_time": "11:30",
  "station": "Maydon 1",
  "description": "Izoh"
}
```

### POST `/head-coach/sessions/bulk`
Ko'p sessiyani bir vaqtda yaratish.

**Body:** `{ "sessions": [ ...SessionCreate[] ] }`

### GET `/head-coach/sessions`
Barcha sessiyalar.

**Query params:** `date`, `from_date`, `to_date`, `group_id`

### GET `/head-coach/sessions/{id}`
Bitta sessiya (davomat yozuvlari bilan).

### PUT `/head-coach/sessions/{id}`
Sessiyani yangilash (SessionCreate formatida).

### DELETE `/head-coach/sessions/{id}`
Sessiyani o'chirish (davomat yozuvlari ham o'chadi).

---

## Hisobotlar `/reports`

### GET `/reports/dashboard`
Dashboard umumiy statistika.

> Permission: `reports:dashboard:view`

**Javob:** O'quvchilar, guruhlar, to'lovlar, davomat umumiy ko'rsatkichlari.

### GET `/reports/attendance`
Davomat hisoboti.

> Permission: `reports:attendance:view`

**Query params:** `from_date`, `to_date`, `group_id`

---

## Darvoza `/gate`

> Permission: `gate:logs:view`

### GET `/gate/logs`
Darvoza kirish/chiqish loglari.

**Query params:** `student_id`, `from_date`, `to_date`, `page`, `page_size`

### POST `/gate/callback`
Darvoza tizimidan callback (face recognition).

**Body:** `{ "student_id": 5 }` yoki `{ "face_id": "abc123" }`  
**Javob:** `{ "allowed": true, "reason": "OK", "student_id": 5 }`

---

## Kutish ro'yxati `/waiting-list`

### GET `/waiting-list`
Kutish ro'yxatidagi o'quvchilar.

### GET `/waiting-list/{id}`
Bitta yozuv.

### POST `/waiting-list`
Kutish ro'yxatiga qo'shish.

### PATCH `/waiting-list/{id}`
Yozuvni yangilash.

### DELETE `/waiting-list/{id}`
O'chirish.

### GET `/waiting-list/group/{group_id}/next`
Guruh uchun navbatdagi o'quvchi.

---

## Sozlamalar `/settings`

### GET `/settings/system`
Tizim sozlamalari ro'yxati.

> Permission: `settings:system:view`

### PATCH `/settings/system`
Sozlamalarni yangilash.

> Permission: `settings:system:edit`

**Body:** `[{ "key": "sozlama_nomi", "value": "qiymat" }]`

---

## To'lovlar (Payme / Click)

### POST `/payme/payment`
Payme JSON-RPC callback. Payme serveridan keladi.

**Metodlar:** `CheckPerformTransaction`, `CreateTransaction`, `PerformTransaction`, `CancelTransaction`, `CheckTransaction`, `GetStatement`, `ChangePassword`

### POST `/click/payment`
Click callback (action-based).

**Actions:** `0` — tekshirish, `1` — tayyorlash (prepare), `2` — tasdiqlash (complete)

---

## Umumiy javob formati

```json
{ "data": <natija>, "meta": <pagination yoki null> }
```

**Pagination meta:**
```json
{ "page": 1, "page_size": 20, "total": 100, "total_pages": 5 }
```

**Xato javobi:**
```json
{ "detail": "Xato xabari" }
```

---

## Permission kodlari

| Kod | Izoh |
|---|---|
| `students:view` | O'quvchilarni ko'rish |
| `students:edit` | O'quvchilarni tahrirlash |
| `groups:view` | Guruhlarni ko'rish |
| `groups:edit` | Guruhlarni tahrirlash |
| `attendance:coach:mark` | Davomat belgilash |
| `attendance:view` | Davomatni ko'rish |
| `sessions:create` | Sessiya yaratish |
| `sessions:manage` | Sessiyalarni boshqarish |
| `reports:attendance:view` | Davomat hisobotlari |
| `reports:dashboard:view` | Dashboard |
| `settings:system:view` | Sozlamalarni ko'rish |
| `settings:system:edit` | Sozlamalarni tahrirlash |
| `roles:manage` | Rollarni boshqarish |
| `users:manage` | Foydalanuvchilarni boshqarish |
| `gate:logs:view` | Darvoza loglarini ko'rish |
| `contracts:view` | Shartnomalarni ko'rish |
| `contracts:edit` | Shartnomalarni tahrirlash |
| `finance:transactions:view` | To'lovlarni ko'rish |
| `finance:transactions:manual` | Qo'lda to'lov kiritish |
| `finance:transactions:cancel` | To'lovni bekor qilish |
| `finance:unassigned:view` | Biriktirilmagan to'lovlar |
| `finance:unassigned:assign` | To'lovlarni biriktirish |

---

## Default rollar va permissionlar

| Rol | Permissionlar |
|---|---|
| **Super Admin** | Barchasi (cheklovsiz) |
| **Director** | students:view, groups:view, attendance:view, reports:*, gate:logs:view, settings:system:view, contracts:view, finance:transactions:view, finance:unassigned:view |
| **Accountant** | students:view, reports:dashboard:view, contracts:view, finance:* (barchasi) |
| **Admin** | students:*, groups:*, attendance:view, gate:logs:view, reports:dashboard:view, contracts:* |
| **Head Coach** | students:view, groups:view/edit, attendance:*, sessions:* |
| **Coach** | students:view, groups:view, attendance:* |
