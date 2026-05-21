package com.goharpay.collector

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject

/**
 * HeartbeatWorker — periodic ping إلى /api/public/ingest برسالة فاضية
 * عشان يحدّث devices.last_seen_at و is_online = true.
 */
class HeartbeatWorker(ctx: Context, params: WorkerParameters) : CoroutineWorker(ctx, params) {
    private val client = OkHttpClient()
    override suspend fun doWork(): Result {
        val prefs = applicationContext.getSharedPreferences("gohar", Context.MODE_PRIVATE)
        if (!prefs.getBoolean("active", false)) return Result.success()
        val apiUrl = prefs.getString("api_url", null) ?: return Result.failure()
        val deviceId = prefs.getString("device_id", null) ?: return Result.failure()
        val token = prefs.getString("device_token", null) ?: return Result.failure()

        val payload = JSONObject().apply {
            put("device_id", deviceId)
            put("sender", "__heartbeat__")
            put("body", "ping")
        }.toString()

        val req = Request.Builder()
            .url("$apiUrl/api/public/heartbeat")
            .header("X-Device-Token", token)
            .post(payload.toRequestBody("application/json".toMediaType()))
            .build()
        return try {
            client.newCall(req).execute().use { Result.success() }
        } catch (_: Exception) { Result.retry() }
    }
}
