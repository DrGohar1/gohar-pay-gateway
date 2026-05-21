package com.goharpay.collector

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.security.MessageDigest
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

class IngestWorker(ctx: Context, params: WorkerParameters) : CoroutineWorker(ctx, params) {

    private val client = OkHttpClient()

    override suspend fun doWork(): Result {
        val prefs = applicationContext.getSharedPreferences("gohar", Context.MODE_PRIVATE)
        val apiUrl = prefs.getString("api_url", "https://gogpay.lovable.app") ?: return Result.failure()
        val deviceId = prefs.getString("device_id", null) ?: return Result.failure()
        val deviceToken = prefs.getString("device_token", null) ?: return Result.failure()
        val provider = prefs.getString("provider", null)

        val sender = inputData.getString("sender") ?: ""
        val body = inputData.getString("body") ?: return Result.success()
        val receivedAt = inputData.getLong("received_at", System.currentTimeMillis())

        val iso = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply {
            timeZone = TimeZone.getTimeZone("UTC")
        }.format(Date(receivedAt))

        val payload = JSONObject().apply {
            put("device_id", deviceId)
            if (provider != null) put("provider", provider)
            put("sender", sender)
            put("body", body)
            put("received_at", iso)
        }.toString()

        val idem = sha256("$deviceId|$body|$receivedAt")

        val req = Request.Builder()
            .url("$apiUrl/api/public/ingest")
            .header("X-Device-Token", deviceToken)
            .header("X-Idempotency-Key", idem)
            .post(payload.toRequestBody("application/json".toMediaType()))
            .build()

        return try {
            client.newCall(req).execute().use { resp ->
                if (resp.isSuccessful) Result.success() else Result.retry()
            }
        } catch (e: Exception) {
            Result.retry()
        }
    }

    private fun sha256(s: String): String {
        val md = MessageDigest.getInstance("SHA-256")
        return md.digest(s.toByteArray()).joinToString("") { "%02x".format(it) }
    }
}
