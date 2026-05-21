# Android Collector — Gohar Pay (v1.0)

تطبيق أندرويد خفيف يلتقط رسائل SMS من المحافظ والبنوك ويرفعها لمنصة جوهر باي.

## محتوى المشروع

```
android-collector/
├── build.gradle.kts          ← root project
├── settings.gradle.kts
├── gradle.properties
└── app/
    ├── build.gradle.kts      ← compileSdk 34, minSdk 24
    └── src/main/
        ├── AndroidManifest.xml
        └── java/com/goharpay/collector/
            ├── MainActivity.kt         ← شاشة الإعداد (UI كامل)
            ├── SmsBroadcastReceiver.kt ← يلتقط SMS_RECEIVED_ACTION
            ├── IngestWorker.kt         ← يرفع للسيرفر مع retry
            └── HeartbeatWorker.kt      ← periodic ping كل 15 دقيقة
```

## بناء وتشغيل APK

### المتطلبات
- Android Studio Hedgehog (2023.1) أو أحدث، أو JDK 17 + Android SDK 34.

### الطريقة الأسرع (Android Studio)
1. افتح Android Studio → **Open** → اختر مجلد `android-collector/`.
2. انتظر Gradle sync.
3. **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
4. هيظهر مسار الـ APK في الإشعار — اضغط **locate**.

### من الـ Terminal
```bash
cd android-collector
./gradlew assembleDebug
# APK: app/build/outputs/apk/debug/app-debug.apk
```

> أول مرة: شغّل `gradle wrapper --gradle-version 8.7` لو الـ wrapper مش موجود.

## تثبيت وتشغيل
1. انقل `app-debug.apk` للهاتف (USB أو أي طريقة).
2. فعّل "السماح بتثبيت من مصادر غير معروفة" ثم ثبّت.
3. افتح التطبيق → اظهرلك شاشة الإعداد.
4. من لوحة جوهر باي: **/app/sources** → سجّل جهاز جديد → انسخ `device_id` و `device_token`.
5. الصق القيم في التطبيق + (اختياري) اختر المزوّد → **ابدأ التحصيل**.
6. اقبل أذونات SMS و Notifications.

## التدفق التقني

```
رسالة جديدة → SmsBroadcastReceiver
             ↓
        WorkManager(IngestWorker)
             ↓
    POST /api/public/ingest
    Headers: X-Device-Token, X-Idempotency-Key
    Body: { device_id, sender, body, received_at }
             ↓
   raw_messages → parser_engine
             ↓
   parsed_transactions (status, confidence, risk)
             ↓
   webhook_deliveries (لو confirmed)
```

## الأمان
- التوكن مخزّن كـ SHA-256 hash في `devices.device_token_hash`.
- Idempotency-Key يمنع التكرار حتى مع إعادة محاولات WorkManager.
- التطبيق ما بيرفعش بيانات شخصية إضافية — بس نص الرسالة + المُرسِل.

## الخطوة التالية
- شاشة backfill لاستيراد رسائل قديمة (Phase 6.1).
- Foreground service لإشعار دائم "التحصيل نشط".
