# FANCY LEAGUE
**تطوير وتصميم: Mohsen ~ Danial — © 2026 جميع الحقوق محفوظة**

لعبة كورة سيارات PvP (أونلاين + محلي + بوتات) — تشتغل على الكمبيوتر والآيفون والأندرويد.

## تشغيل السيرفر (للأونلاين) — مجانًا على Render
1. سوّ حساب في **github.com** ثم **New repository** باسم `fancy-league` (خلّه Private لو تبي).
2. اضغط **uploading an existing file** واسحب كل الملفات اللي في هذا المجلد (server.js, package.json, render.yaml, مجلد public) واضغط **Commit**.
3. ادخل **render.com** وسجّل دخول بحساب GitHub.
4. **New → Web Service** → اختر الريبو `fancy-league`.
   - Runtime: **Node** • Build: `npm install` • Start: `node server.js` • Plan: **Free**
5. بعد دقيقتين يعطيك رابط مثل `https://fancy-league.onrender.com` — هذا رابط اللعبة + السيرفر.

> السيرفر المجاني ينام بعد 15 دقيقة بدون لاعبين، وأول دخول بعدها ياخذ ~50 ثانية يصحى.

## تنزيل اللعبة على الأجهزة
- **آيفون:** افتح الرابط من Safari ← زر المشاركة ⬆️ ← «إضافة إلى الشاشة الرئيسية».
- **سامسونج / أندرويد:** افتح الرابط من Chrome ← ⋮ ← «تثبيت التطبيق».
- **كمبيوتر:** شغّل `FancyLeague.exe` ← الإعدادات ← الشبكة ← حط رابط السيرفر ← حفظ واختبار.
  (أو عدّل `public/config.js` وحط الرابط فيه قبل الرفع.)
- تبي ملف APK؟ حط رابطك في **pwabuilder.com** ويطلع لك APK جاهز.

## التشغيل على جهازك
```
npm install
npm start        # http://localhost:8080
```
