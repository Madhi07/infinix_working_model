package com.anonymous.Agentzee

import android.content.Context
import android.content.Intent
import android.media.AudioManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import android.telephony.PhoneStateListener
import android.telephony.TelephonyManager
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import android.provider.MediaStore
import android.util.Log
import android.os.Environment
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream

import android.annotation.SuppressLint

@SuppressLint("MissingPermission")
class CallStateModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private var telephonyManager: TelephonyManager? = null
    private var phoneStateListener: PhoneStateListener? = null
    private var audioManager: AudioManager? = null
    private var isAppInitiatedCall = false

    override fun getName(): String {
        return "CallStateModule"
    }

    @ReactMethod
    fun startListening() {
        if (telephonyManager == null) {
            telephonyManager = reactApplicationContext.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
        }
        if (audioManager == null) {
            audioManager = reactApplicationContext.getSystemService(Context.AUDIO_SERVICE) as AudioManager
        }

        if (phoneStateListener == null) {
            phoneStateListener = object : PhoneStateListener() {
                @Deprecated("Deprecated in Java")
                override fun onCallStateChanged(state: Int, phoneNumber: String?) {
                    super.onCallStateChanged(state, phoneNumber)
                    emitState(state)
                }
            }
            telephonyManager?.listen(phoneStateListener, PhoneStateListener.LISTEN_CALL_STATE)
        }
    }

    private fun emitState(state: Int) {
        val stateString = when (state) {
            TelephonyManager.CALL_STATE_IDLE -> {
                manageRecordingService(false)
                audioManager?.isSpeakerphoneOn = false // Turn off speakerphone
                isAppInitiatedCall = false // Reset the flag for the next call
                "IDLE"
            }
            TelephonyManager.CALL_STATE_RINGING -> "RINGING"
            TelephonyManager.CALL_STATE_OFFHOOK -> {
                if (isAppInitiatedCall) {
                    val manufacturer = Build.MANUFACTURER.lowercase(java.util.Locale.getDefault())
                    if (manufacturer.contains("infinix") || manufacturer.contains("tecno") || manufacturer.contains("itel")) {
                        // On Transsion devices, setting the mode is required before speakerphone takes effect
                        audioManager?.mode = AudioManager.MODE_IN_CALL
                        audioManager?.isSpeakerphoneOn = true // Force speakerphone for audio capture
                        
                        // Maximize the volume to ensure the loudest possible audio for the recording
                        val maxVolume = audioManager?.getStreamMaxVolume(AudioManager.STREAM_VOICE_CALL) ?: 0
                        audioManager?.setStreamVolume(AudioManager.STREAM_VOICE_CALL, maxVolume, 0)
                    }

                    manageRecordingService(true)
                }
                "OFFHOOK"
            }
            else -> "UNKNOWN"
        }
        sendEvent("onCallStateChanged", stateString)
    }

    private fun manageRecordingService(start: Boolean) {
        if (start) {
            CallAccessibilityService.instance?.startRecording()
        } else {
            CallAccessibilityService.instance?.stopRecording()
        }
    }

    @ReactMethod
    fun requestBatteryOptimization() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                data = Uri.parse("package:${reactApplicationContext.packageName}")
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            reactApplicationContext.startActivity(intent)
        }
    }

    @ReactMethod
    fun checkBatteryOptimizationStatus(promise: Promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            try {
                val powerManager = reactApplicationContext.getSystemService(Context.POWER_SERVICE) as android.os.PowerManager
                val isIgnoring = powerManager.isIgnoringBatteryOptimizations(reactApplicationContext.packageName)
                promise.resolve(isIgnoring)
            } catch (e: Exception) {
                promise.reject("ERROR", e.message)
            }
        } else {
            promise.resolve(true) // Not applicable on older versions
        }
    }

    @ReactMethod
    fun markNextCallAsAppInitiated() {
        isAppInitiatedCall = true
    }

    @ReactMethod
    fun checkAccessibilityStatus(promise: Promise) {
        try {
            var isEnabled = false
            val enabledServices = Settings.Secure.getString(
                reactApplicationContext.contentResolver,
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
            )
            
            if (enabledServices != null) {
                val componentName = "${reactApplicationContext.packageName}/${CallAccessibilityService::class.java.name}"
                isEnabled = enabledServices.contains(componentName) || enabledServices.contains(CallAccessibilityService::class.java.simpleName)
            }
            promise.resolve(isEnabled)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun openAccessibilitySettings() {
        val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        reactApplicationContext.startActivity(intent)
    }

    @ReactMethod
    fun getRecordings(promise: Promise) {
        try {
            syncSystemRecordings()

            val outputDir = reactApplicationContext.getExternalFilesDir(null)
            val files = outputDir?.listFiles { file -> 
                file.name.endsWith(".m4a") || file.name.endsWith(".mp3") || file.name.endsWith(".amr") || file.name.endsWith(".wav") || file.name.endsWith(".ogg") || file.name.endsWith(".aac")
            }
            
            val recordingsArray = Arguments.createArray()
            
            files?.forEach { file ->
                val map = Arguments.createMap()
                map.putString("filename", file.name)
                map.putString("path", file.absolutePath)
                map.putDouble("size", file.length().toDouble())
                map.putDouble("timestamp", file.lastModified().toDouble())
                recordingsArray.pushMap(map)
            }
            
            promise.resolve(recordingsArray)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    private fun syncSystemRecordings() {
        val outputDir = reactApplicationContext.getExternalFilesDir(null) ?: return

        // 1. Find all internal recordings to use as anchor timestamps
        val internalRecordings = outputDir.listFiles { file -> 
            file.name.startsWith("CallRecord_") && file.name.endsWith(".m4a")
        } ?: arrayOf()

        if (internalRecordings.isEmpty()) {
            return // No recent app calls, skip syncing system recordings to protect privacy
        }

        val processPotentialSystemRecording = { name: String, sysLastModifiedMs: Long, copyAction: (File) -> Unit ->
            var matchedInternal: File? = null
            for (internal in internalRecordings) {
                // If the system recording ended within 90 seconds of our internal recording
                if (Math.abs(internal.lastModified() - sysLastModifiedMs) < 90000) {
                    matchedInternal = internal
                    break
                }
            }

            if (matchedInternal != null) {
                val safeName = name.replace(" ", "_")
                val targetFile = File(outputDir, "System_$safeName")
                if (!targetFile.exists()) {
                    try {
                        copyAction(targetFile)
                        Log.d("CallStateModule", "Imported matching system recording: $name")
                        if (matchedInternal.exists()) {
                            matchedInternal.delete()
                            Log.d("CallStateModule", "Deleted inferior internal recording: ${matchedInternal.name}")
                        }
                    } catch (e: Exception) {
                        Log.e("CallStateModule", "Failed to copy system recording: $name", e)
                    }
                } else {
                    // Already imported, just ensure internal is deleted
                    if (matchedInternal.exists()) {
                        matchedInternal.delete()
                    }
                }
            }
        }

        // 2. MediaStore Scan (General fallback for most devices)
        try {
            val contentResolver = reactApplicationContext.contentResolver
            val uri = MediaStore.Audio.Media.EXTERNAL_CONTENT_URI
            val projection = arrayOf(
                MediaStore.Audio.Media._ID,
                MediaStore.Audio.Media.DISPLAY_NAME,
                MediaStore.Audio.Media.DATA,
                MediaStore.Audio.Media.DATE_ADDED
            )
            
            val timeThreshold = (System.currentTimeMillis() / 1000) - 7200
            val selection = "${MediaStore.Audio.Media.DATE_ADDED} >= ?"
            val selectionArgs = arrayOf(timeThreshold.toString())
            val sortOrder = "${MediaStore.Audio.Media.DATE_ADDED} DESC"

            contentResolver.query(uri, projection, selection, selectionArgs, sortOrder)?.use { cursor ->
                val idColumn = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media._ID)
                val nameColumn = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DISPLAY_NAME)
                val dataColumn = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DATA)

                while (cursor.moveToNext()) {
                    val id = cursor.getLong(idColumn)
                    val name = cursor.getString(nameColumn) ?: continue
                    val data = cursor.getString(dataColumn) ?: continue
                    val lowerPath = data.lowercase()

                    if (lowerPath.contains(reactApplicationContext.packageName.lowercase())) continue

                    if (lowerPath.contains("call") || lowerPath.contains("phonerecord") || lowerPath.contains("record")) {
                        val file = File(data)
                        if (file.exists() && file.length() < 10240) {
                            Log.w("CallStateModule", "System recording from MediaStore is too small (${file.length()} bytes), skipping.")
                            continue
                        }
                        
                        val lastModifiedMs = if (file.exists()) file.lastModified() else (cursor.getLong(cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DATE_ADDED)) * 1000)
                        
                        processPotentialSystemRecording(name, lastModifiedMs) { targetFile ->
                            val fileUri = android.content.ContentUris.withAppendedId(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, id)
                            contentResolver.openInputStream(fileUri)?.use { input ->
                                FileOutputStream(targetFile).use { output ->
                                    input.copyTo(output)
                                }
                            }
                        }
                    }
                }
            }
        } catch (e: Exception) {
            Log.e("CallStateModule", "Error syncing system recordings via MediaStore", e)
        }

        // 3. Direct File Scan for specific devices (e.g., Infinix) where MediaStore delays indexing
        try {
            val musicDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_MUSIC)
            val phoneRecordDirMusic = File(musicDir, "PhoneRecord")
            if (phoneRecordDirMusic.exists() && phoneRecordDirMusic.isDirectory) {
                scanDirectoryForRecordings(phoneRecordDirMusic, outputDir, internalRecordings)
            }
            
            val rootDir = Environment.getExternalStorageDirectory()
            val phoneRecordDirRoot = File(rootDir, "PhoneRecord")
            if (phoneRecordDirRoot.exists() && phoneRecordDirRoot.isDirectory) {
                scanDirectoryForRecordings(phoneRecordDirRoot, outputDir, internalRecordings)
            }
        } catch (e: Exception) {
            Log.e("CallStateModule", "Error scanning directories directly", e)
        }
    }

    private fun scanDirectoryForRecordings(directory: File, outputDir: File?, internalRecordings: Array<File>) {
        if (outputDir == null) return
        val files = directory.listFiles() ?: return
        val twoHoursAgo = System.currentTimeMillis() - (2 * 60 * 60 * 1000)

        for (file in files) {
            if (file.isDirectory) {
                scanDirectoryForRecordings(file, outputDir, internalRecordings)
            } else if (file.isFile && file.lastModified() > twoHoursAgo) {
                val name = file.name.lowercase()
                if (name.endsWith(".m4a") || name.endsWith(".mp3") || name.endsWith(".amr") || name.endsWith(".wav") || name.endsWith(".ogg") || name.endsWith(".aac")) {
                    if (file.length() < 10240) {
                        Log.w("CallStateModule", "System recording from direct scan is too small (${file.length()} bytes), skipping.")
                        continue
                    }
                    val sysLastModifiedMs = file.lastModified()
                    
                    var matchedInternal: File? = null
                    for (internal in internalRecordings) {
                        if (Math.abs(internal.lastModified() - sysLastModifiedMs) < 90000) {
                            matchedInternal = internal
                            break
                        }
                    }

                    if (matchedInternal != null) {
                        val safeName = file.name.replace(" ", "_")
                        val targetFile = File(outputDir, "System_$safeName")
                        if (!targetFile.exists()) {
                            try {
                                FileInputStream(file).use { input ->
                                    FileOutputStream(targetFile).use { output ->
                                        input.copyTo(output)
                                    }
                                }
                                Log.d("CallStateModule", "Imported matching system recording directly: ${file.name}")
                                if (matchedInternal.exists()) {
                                    matchedInternal.delete()
                                    Log.d("CallStateModule", "Deleted inferior internal recording: ${matchedInternal.name}")
                                }
                            } catch (e: Exception) {
                                Log.e("CallStateModule", "Failed to copy system recording directly: ${file.name}", e)
                            }
                        } else {
                            if (matchedInternal.exists()) {
                                matchedInternal.delete()
                            }
                        }
                    }
                }
            }
        }
    }

    @ReactMethod
    fun stopListening() {
        phoneStateListener?.let {
            telephonyManager?.listen(it, PhoneStateListener.LISTEN_NONE)
        }
        phoneStateListener = null
    }

    private fun sendEvent(eventName: String, eventData: String) {
        if (reactApplicationContext.hasActiveCatalystInstance()) {
            reactApplicationContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(eventName, eventData)
        }
    }

    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}
}
