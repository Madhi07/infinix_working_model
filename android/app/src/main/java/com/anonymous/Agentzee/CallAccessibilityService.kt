package com.anonymous.Agentzee

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.media.MediaRecorder
import android.os.Build
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.telephony.TelephonyManager
import android.telephony.PhoneStateListener
import java.io.File
import java.io.IOException
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

import android.annotation.SuppressLint

@SuppressLint("MissingPermission")
class CallAccessibilityService : AccessibilityService() {

    private var mediaRecorder: MediaRecorder? = null
    private var isRecording = false
    private var currentOutputFile: String? = null
    
    private var telephonyManager: TelephonyManager? = null
    private var phoneStateListener: PhoneStateListener? = null

    companion object {
        var instance: CallAccessibilityService? = null
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // We only use this service to bypass audio restrictions
    }

    override fun onInterrupt() {
        Log.d("CallAccessibility", "Service Interrupted")
        stopRecording()
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        telephonyManager = getSystemService(TELEPHONY_SERVICE) as TelephonyManager
        Log.d("CallAccessibility", "Service Connected")
    }

    override fun onUnbind(intent: Intent?): Boolean {
        instance = null
        return super.onUnbind(intent)
    }

    private fun registerCallStateListener() {
        if (telephonyManager == null) {
            telephonyManager = getSystemService(TELEPHONY_SERVICE) as TelephonyManager
        }

        try {
            if (phoneStateListener == null) {
                phoneStateListener = object : PhoneStateListener() {
                    @Deprecated("Deprecated in Java")
                    override fun onCallStateChanged(state: Int, phoneNumber: String?) {
                        super.onCallStateChanged(state, phoneNumber)
                        if (state == TelephonyManager.CALL_STATE_IDLE) {
                            Log.d("CallAccessibility", "CallState changed to IDLE, stopping recording")
                            stopRecording()
                        }
                    }
                }
                telephonyManager?.listen(phoneStateListener, PhoneStateListener.LISTEN_CALL_STATE)
            }
        } catch (e: SecurityException) {
            Log.e("CallAccessibility", "Permission denied for registering CallStateListener", e)
        }
    }

    private fun unregisterCallStateListener() {
        try {
            phoneStateListener?.let {
                telephonyManager?.listen(it, PhoneStateListener.LISTEN_NONE)
            }
            phoneStateListener = null
        } catch (e: Exception) {
            Log.e("CallAccessibility", "Error unregistering CallStateListener", e)
        }
    }

    fun startRecording() {
        if (isRecording) return
        
        registerCallStateListener()

        // Delay starting the recorder by 1 second to give the Android audio system 
        // time to fully establish the VOICE_CALL streams. Starting too quickly on OFFHOOK 
        // can cause VOICE_CALL to be rejected, forcing a silent MIC fallback.
        android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(Runnable {
            // Check if call already ended
            if (telephonyManager?.callState != TelephonyManager.CALL_STATE_IDLE) {
                startMediaRecorder()
            }
        }, 1000)
    }

    private fun startMediaRecorder() {
        if (isRecording) return // double check

        val timestamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(Date())
        val outputDir = getExternalFilesDir(null)
        val file = File(outputDir, "CallRecord_$timestamp.m4a")
        currentOutputFile = file.absolutePath

        mediaRecorder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            MediaRecorder(this)
        } else {
            MediaRecorder()
        }

        try {
            mediaRecorder?.apply {
                // VOICE_RECOGNITION is the most reliable audio source for call recording on Android 10+
                // especially on Xiaomi/Redmi devices using the Google Dialer.
                setAudioSource(MediaRecorder.AudioSource.VOICE_RECOGNITION)
                setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
                setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
                setOutputFile(currentOutputFile)
                prepare()
                start()
            }
            isRecording = true
            Log.d("CallAccessibility", "Recording started with VOICE_RECOGNITION: $currentOutputFile")
        } catch (e: Exception) {
            Log.w("CallAccessibility", "VOICE_RECOGNITION rejected, falling back to VOICE_CALL", e)
            try {
                mediaRecorder?.reset()
                mediaRecorder?.apply {
                    setAudioSource(MediaRecorder.AudioSource.VOICE_CALL)
                    setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
                    setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
                    setOutputFile(currentOutputFile)
                    prepare()
                    start()
                }
                isRecording = true
                Log.d("CallAccessibility", "Recording started with VOICE_CALL: $currentOutputFile")
            } catch (fallbackEx: Exception) {
                Log.w("CallAccessibility", "VOICE_CALL rejected, falling back to MIC", fallbackEx)
                try {
                    mediaRecorder?.reset()
                    mediaRecorder?.apply {
                        setAudioSource(MediaRecorder.AudioSource.MIC)
                        setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
                        setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
                        setOutputFile(currentOutputFile)
                        prepare()
                        start()
                    }
                    isRecording = true
                    Log.d("CallAccessibility", "Recording started with MIC: $currentOutputFile")
                } catch (finalEx: Exception) {
                    Log.e("CallAccessibility", "All audio sources failed", finalEx)
                    mediaRecorder?.release()
                    mediaRecorder = null
                    isRecording = false
                }
            }
        }
    }

    fun stopRecording() {
        if (!isRecording) return

        unregisterCallStateListener()

        try {
            mediaRecorder?.apply {
                stop()
                reset()
                release()
            }
            Log.d("CallAccessibility", "Recording stopped: $currentOutputFile")
        } catch (e: RuntimeException) {
            Log.e("CallAccessibility", "Error stopping recording", e)
        } finally {
            mediaRecorder = null
            isRecording = false
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        instance = null
        stopRecording()
    }
}
