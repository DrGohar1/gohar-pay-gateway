# Android Collector (Kotlin) — Gohar Pay

تطبيق أندرويد خفيف يلتقط إشعارات SMS من المحافظ والبنوك ويرفعها لـ Gohar Pay عبر `/api/public/ingest`.

## البنية

```
android-collector/
└── app/src/main/
    ├── AndroidManifest.xml        ← يطلب RECEIVE_SMS + INTERNET
    ├── java/com/goharpay/collector/
    │   ├── SmsBroadcastReceiver.kt ← يلتقط SMS_RECEIVED_ACTION
    │   ├── IngestWorker.kt         ← WorkManager: يرفع للسيرفر مع retry
    │   └── MainActivity.kt         ← شاشة الربط (Device ID + Token)
    └── res/                        ← strings_ar.xml + layout
```

## التشغيل

1. افتح المشروع في Android Studio Hedgehog أو أحدث.
2. عدّل `applicationId` في `app/build.gradle.kts`.
3. شغّل التطبيق على جهاز فيه شريحة فودافون/اتصالات/أورنج/InstaPay.
4. سجّل الجهاز من لوحة `/app/sources` في Gohar Pay → احصل على `device_id` + `device_token`.
5. الصقهم في شاشة التطبيق الأولى ثم اضغط "ابدأ التحصيل".

## التدفق

```
[SMS] → SmsBroadcastReceiver → WorkManager(IngestWorker)
     → POST /api/public/ingest
       Headers: X-Device-Token, X-Idempotency-Key
       Body: { device_id, provider, sender, body, received_at }
     → Server: parser_engine → parsed_transactions → webhook_deliveries
```

## الأمان

- التوكن مخزّن hashed في `devices.device_token_hash` (SHA-256).
- Idempotency-Key يمنع التكرار حتى لو أعاد الـ Worker الإرسال.
- الـ payload لا يحتوي بيانات شخصية إضافية — فقط نص الـ SMS و المرسل.

## ما زال يحتاج كود (Phase 6.1)

- شاشة MainActivity (واجهة الإعداد).
- شاشة backfill لاستيراد رسائل قديمة بعد التثبيت.
- تحديث Foreground Service لإظهار إشعار "التحصيل نشط".
