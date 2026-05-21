package com.goharpay.collector

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.text.method.LinkMovementMethod
import android.view.View
import android.widget.*
import androidx.activity.ComponentActivity
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.work.*
import java.util.concurrent.TimeUnit

/**
 * MainActivity — شاشة الإعداد:
 * - إدخال device_id + device_token + اختياري api_url + provider
 * - حفظ في SharedPreferences
 * - طلب أذونات RECEIVE_SMS / READ_SMS / POST_NOTIFICATIONS
 * - زر "ابدأ التحصيل" يفعّل الـ receiver ويعمل WorkManager periodic heartbeat
 * - زر "إيقاف" يلغي العمل
 */
class MainActivity : ComponentActivity() {

    private lateinit var prefs: android.content.SharedPreferences
    private lateinit var statusText: TextView
    private lateinit var deviceIdInput: EditText
    private lateinit var tokenInput: EditText
    private lateinit var apiUrlInput: EditText
    private lateinit var providerSpinner: Spinner
    private lateinit var startBtn: Button
    private lateinit var stopBtn: Button

    private val permsLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { result ->
        val allGranted = result.values.all { it }
        if (allGranted) startCollecting() else toast("الأذونات مرفوضة — لا يمكن قراءة الرسائل")
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        prefs = getSharedPreferences("gohar", Context.MODE_PRIVATE)
        buildUi()
        loadPrefs()
        refreshStatus()
    }

    private fun buildUi() {
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(48, 64, 48, 48)
            layoutDirection = View.LAYOUT_DIRECTION_RTL
        }

        TextView(this).apply {
            text = "جوهر باي — جهاز التحصيل"
            textSize = 22f
            setTypeface(typeface, android.graphics.Typeface.BOLD)
            root.addView(this)
        }
        TextView(this).apply {
            text = "اربط الجهاز بحساب التاجر، ثم ابدأ التحصيل."
            textSize = 13f
            alpha = 0.7f
            setPadding(0, 8, 0, 24)
            root.addView(this)
        }

        root.addView(label("Device ID (UUID)"))
        deviceIdInput = EditText(this).apply { hint = "xxxxxxxx-xxxx-..." }
        root.addView(deviceIdInput)

        root.addView(label("Device Token"))
        tokenInput = EditText(this).apply {
            hint = "التوكن الذي حصلت عليه من لوحة /app/sources"
            inputType = android.text.InputType.TYPE_CLASS_TEXT or
                android.text.InputType.TYPE_TEXT_VARIATION_PASSWORD
        }
        root.addView(tokenInput)

        root.addView(label("API URL"))
        apiUrlInput = EditText(this).apply { hint = "https://gogpay.lovable.app" }
        root.addView(apiUrlInput)

        root.addView(label("المزوّد (اختياري)"))
        providerSpinner = Spinner(this)
        val providers = arrayOf(
            "auto (يحدد تلقائياً)",
            "vodafone_cash", "etisalat_cash", "orange_cash",
            "we_pay", "instapay", "bank_sms"
        )
        providerSpinner.adapter = ArrayAdapter(this, android.R.layout.simple_spinner_dropdown_item, providers)
        root.addView(providerSpinner)

        val row = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            setPadding(0, 32, 0, 0)
        }
        startBtn = Button(this).apply {
            text = "ابدأ التحصيل"
            setOnClickListener { onStartClick() }
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
        }
        stopBtn = Button(this).apply {
            text = "إيقاف"
            setOnClickListener { stopCollecting() }
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
        }
        row.addView(startBtn); row.addView(stopBtn)
        root.addView(row)

        statusText = TextView(this).apply {
            setPadding(0, 32, 0, 0)
            textSize = 13f
            movementMethod = LinkMovementMethod.getInstance()
        }
        root.addView(statusText)

        val scroll = ScrollView(this).apply { addView(root) }
        setContentView(scroll)
    }

    private fun label(s: String) = TextView(this).apply {
        text = s
        setPadding(0, 16, 0, 4)
        alpha = 0.8f
        textSize = 12f
    }

    private fun loadPrefs() {
        deviceIdInput.setText(prefs.getString("device_id", ""))
        tokenInput.setText(prefs.getString("device_token", ""))
        apiUrlInput.setText(prefs.getString("api_url", "https://gogpay.lovable.app"))
        val saved = prefs.getString("provider", null)
        if (!saved.isNullOrEmpty()) {
            val items = (providerSpinner.adapter as ArrayAdapter<*>)
            for (i in 0 until items.count) {
                if (items.getItem(i) == saved) { providerSpinner.setSelection(i); break }
            }
        }
    }

    private fun savePrefs() {
        val sel = providerSpinner.selectedItem?.toString() ?: ""
        prefs.edit()
            .putString("device_id", deviceIdInput.text.toString().trim())
            .putString("device_token", tokenInput.text.toString().trim())
            .putString("api_url", apiUrlInput.text.toString().trim().trimEnd('/'))
            .putString("provider", if (sel.startsWith("auto")) null else sel)
            .putBoolean("active", true)
            .apply()
    }

    private fun onStartClick() {
        val id = deviceIdInput.text.toString().trim()
        val tk = tokenInput.text.toString().trim()
        if (id.length < 8 || tk.length < 8) { toast("أدخل Device ID و Token صحيحين"); return }
        savePrefs()

        val needed = mutableListOf(Manifest.permission.RECEIVE_SMS, Manifest.permission.READ_SMS)
        if (Build.VERSION.SDK_INT >= 33) needed.add(Manifest.permission.POST_NOTIFICATIONS)
        val missing = needed.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }
        if (missing.isNotEmpty()) permsLauncher.launch(missing.toTypedArray())
        else startCollecting()
    }

    private fun startCollecting() {
        prefs.edit().putBoolean("active", true).apply()
        // Periodic heartbeat (every 15 دقيقة) — يتأكد إن السيرفر شايف الجهاز online
        val heartbeat = PeriodicWorkRequestBuilder<HeartbeatWorker>(15, TimeUnit.MINUTES)
            .setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build())
            .build()
        WorkManager.getInstance(this).enqueueUniquePeriodicWork(
            "gohar-heartbeat", ExistingPeriodicWorkPolicy.UPDATE, heartbeat
        )
        toast("بدأ التحصيل ✓")
        refreshStatus()
    }

    private fun stopCollecting() {
        prefs.edit().putBoolean("active", false).apply()
        WorkManager.getInstance(this).cancelUniqueWork("gohar-heartbeat")
        toast("تم الإيقاف")
        refreshStatus()
    }

    private fun refreshStatus() {
        val active = prefs.getBoolean("active", false)
        statusText.text = if (active)
            "الحالة: نشط ✓\nالرسائل الجديدة تُرسل تلقائياً إلى السيرفر."
        else
            "الحالة: متوقف.\nاضغط 'ابدأ التحصيل' لتفعيل الاستماع لرسائل المحافظ."
    }

    private fun toast(s: String) = Toast.makeText(this, s, Toast.LENGTH_SHORT).show()
}
