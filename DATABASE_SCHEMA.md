# Database Schema — Gohar Pay Gateway

## Enums

- `app_role` — `super_admin | internal_admin | merchant_owner | merchant_admin | operator | viewer`
- `payment_provider` — `vodafone_cash | etisalat_cash | orange_cash | we_pay | instapay | bank_sms`
- `txn_status` — `pending | confirmed | rejected | duplicate | manual_review`
- `order_status` — `awaiting_payment | confirmed | partially_matched | expired | manual_review | cancelled`
- `merchant_status` — `pending | active | suspended | closed`
- `source_status` — `active | paused | offline | limit_risk`
- `risk_level` — `low | medium | high | critical`
- `alert_severity` — `info | warning | error | critical`

## الجداول (22)

### النواة
1. **profiles** — id, email, full_name, phone, avatar_url, locale
2. **user_roles** — user_id, role, merchant_id
3. **merchants** — slug, legal_name, display_name, status, plan_id, contact_email, settings
4. **merchant_members** — merchant_id, user_id, role, joined_at
5. **plans** — code, name_ar, name_en, monthly_price_egp, max_devices, max_sources, features
6. **subscriptions** — merchant_id, plan_id, status, current_period_end

### التحصيل
7. **devices** — merchant_id, label, android_id, app_version, is_online, last_seen_at
8. **payment_sources** — merchant_id, device_id, provider, label, identifier, estimated_balance, status
9. **source_balances** — source_id, balance, detected_at, reason
10. **raw_messages** — merchant_id, device_id, source_id, body, sender, message_hash
11. **parsed_transactions** — merchant_id, source_id, provider, amount, reference, status, risk, confidence, balance_after
12. **ai_extractions** — raw_message_id, model, fields, confidence, classification, anomalies

### العمليات
13. **orders** — merchant_id, external_ref, amount, customer_label, status, expires_at
14. **order_matches** — order_id, transaction_id, amount_matched
15. **transaction_events** — transaction_id, event_type, actor_id, payload
16. **transfers** — merchant_id, kind, amount, status

### الأمان والتشغيل
17. **api_keys** — merchant_id, label, key_prefix, key_hash, scopes, revoked_at
18. **webhooks** — merchant_id, url, secret, events, is_active
19. **webhook_deliveries** — webhook_id, event_type, payload, status_code, attempts, succeeded
20. **alerts** — merchant_id, severity, code, message, resolved_at
21. **risk_reviews** — merchant_id, transaction_id, level, reason, resolved_by, resolved_at
22. **audit_logs** — merchant_id, actor_id, action, entity, entity_id, diff
23. **parser_templates / parser_rules** — قوالب تحليل الرسائل لكل مزود

## Helper Functions

| اسم | غرض |
|---|---|
| `has_role(user, role)` | تحقق دور |
| `is_internal_admin(user)` | admin أو super_admin |
| `is_merchant_member(user, merchant)` | عضو في tenant |
| `current_user_merchant_id()` | tenant الحالي |
| `bootstrap_demo_merchant(user)` | seed تاجر تجريبي |
| `handle_new_user()` | trigger على auth.users |
| `touch_updated_at()` | trigger للحقول الزمنية |

## RLS Pattern

كل جدول tenant-scoped:
```sql
USING (is_merchant_member(auth.uid(), merchant_id) OR is_internal_admin(auth.uid()))
```
