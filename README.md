# Ustozlar kuni 2026 — Registon O'quv Markazi

Telegram bot + sayt + admin panel. Ustozlarga 5 ta nominatsiya bo'yicha ovoz berish,
referal orqali qo'shimcha ovoz, filial kesimida g'oliblar.

## Qanday ishlaydi

1. O'quvchi botga `/start` bosadi (yoki do'stining referal havolasi orqali kiradi)
2. Telefon raqamini ulashadi — bir raqam = bir akkaunt
3. Kanalga obuna bo'ladi (tekshiriladi)
4. Bot bir martalik havola beradi → saytga kiradi
5. Filial → ustoz → nominatsiya → ixtiyoriy iliq so'z → ovoz
6. Har kimda **3 ta asosiy ovoz**, har biri boshqa ustozga
7. Referal orqali kelgan do'st ovoz bersa → **+1 bonus ovoz** (ko'pi bilan 10 ta)

Reyting ovoz berish davomida **yopiq** — faqat admin panelda ko'rinadi.

## O'rnatish

### 1. Telegram bot

@BotFather da bot yarating, tokenni oling. Botni kanalga **admin** qilib qo'shing
(obunani tekshirish uchun shart).

### 2. Vercel loyihasi

```bash
npm install
vercel link
```

Storage bo'limida ikkitasini ulang:
- **Neon Postgres** → `DATABASE_URL` avtomatik qo'shiladi
- **Blob** → `BLOB_READ_WRITE_TOKEN` avtomatik qo'shiladi

### 3. Muhit o'zgaruvchilari

`.env.example` dagi barcha qiymatlarni Vercel → Settings → Environment Variables
ga kiriting. Mahalliy ish uchun `.env.local` yarating.

`SESSION_SECRET` uchun: `openssl rand -base64 32`

### 4. Ma'lumotlar bazasi

```bash
npm run db:setup   # jadvallarni yaratadi
npm run db:seed    # 2 ta filialni qo'shadi
```

### 5. Deploy va webhook

```bash
vercel --prod
npm run bot:webhook   # APP_URL to'g'ri bo'lishi kerak
```

### 6. Ustozlarni kiritish

`/admin` → parol (`ADMIN_PASSWORD`) → **Ustozlar** bo'limi.

Tez usul: "Ro'yxat bilan qo'shish" maydoniga har qatorga bittadan yozing:

```
Aziza Karimova | Ingliz tili
Bobur Ergashev | Matematika
```

Rasmlar keyin bittalab yuklanadi — rasmsiz ustoz ham ro'yxatda chiroyli
ko'rinadi (bosh harflardan avatar chiqadi).

## Sozlamalar

Barcha qoidalar bitta faylda: `src/lib/config.ts`

| O'zgaruvchi | Ma'nosi | Hozirgi qiymat |
| --- | --- | --- |
| `MAIN_VOTES` | Asosiy ovozlar soni | 3 |
| `MAX_BONUS_VOTES` | Maksimal referal bonusi | 10 |
| `BONUS_ALLOWS_SAME_TEACHER` | Bonusni bitta ustozga yig'ish mumkinmi | `true` |
| `VOTING_ENDS_AT` | Ovoz berish tugashi | 1-okt 12:00 |
| `RESULTS_AT` | Natijalar e'loni | 1-okt 18:00 |
| `NOMINATIONS` | 5 ta nominatsiya matni | — |

Nominatsiya nomini o'zgartirish uchun `NOMINATIONS` massividagi `title` ni
tahrirlang — ovozlar `key` bo'yicha saqlangani uchun mavjud ovozlar yo'qolmaydi.

## Admin panel

| Sahifa | Nima uchun |
| --- | --- |
| `/admin` | Jonli statistika, filial va nominatsiya kesimida top-5, 24 soatlik grafik |
| `/admin/ustozlar` | Ustoz qo'shish, tahrirlash, rasm yuklash, yashirish |
| `/admin/filiallar` | Filiallar |
| `/admin/shubhali` | Yirik referal daraxtlari, bitta IP dan ko'p akkaunt, juda tez ovozlar |
| `/admin/soz` | Iliq so'zlar — ustozlar bo'yicha guruhlangan, albom uchun CSV |

## Anti-fraud

- Bir telefon raqami = bir akkaunt (`phone_norm` unique)
- Referal faqat taklif qilingan odam **ovoz bergandan keyin** hisoblanadi
- Bonus ovozlar 10 ta bilan cheklangan
- Ovoz berish davomida reyting yopiq
- IP hash, ro'yxatdan o'tish → ovoz orasidagi vaqt, referal daraxti jamlanishi —
  hammasi `/admin/shubhali` da
- Shubhali ovozlarni `is_valid = false` qilib bekor qilish mumkin, ustoz jarima olmaydi

## Ishlab chiqish

```bash
npm run dev
```

Mahalliy webhook uchun `ngrok http 3000` ishlating va `APP_URL` ni o'zgartiring.
