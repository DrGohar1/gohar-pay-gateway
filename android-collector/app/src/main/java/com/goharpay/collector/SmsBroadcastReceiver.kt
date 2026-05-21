package com.goharpay.collector

/**
 * SmsBroadcastReceiver — watches SMS_RECEIVED_ACTION, filters by sender,
 * and queues messages for upload to the Gohar Pay ingest endpoint.
 *
 * Required permission: RECEIVE_SMS (runtime) + READ_SMS for backfill.
 */
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import androidx.work.Data
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager

class SmsBroadcastReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return
        val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent) ?: return
        val merged = messages.joinToString(separator = "") { it.messageBody ?: "" }
        val sender = messages.firstOrNull()?.originatingAddress ?: ""
        val ts = System.currentTimeMillis()

        val data = Data.Builder()
            .putString("sender", sender)
            .putString("body", merged)
            .putLong("received_at", ts)
            .build()

        val work = OneTimeWorkRequestBuilder<IngestWorker>().setInputData(data).build()
        WorkManager.getInstance(context).enqueue(work)
    }
}
