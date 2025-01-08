package com.turboscrypt

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.Callback
import com.facebook.react.module.annotations.ReactModule
import org.bouncycastle.crypto.generators.SCrypt
import android.util.Base64
import com.nativescrypt.NativeScryptSpec
import android.util.Log

@ReactModule(name = NativeScryptModule.NAME)
class NativeScryptModule(reactContext: ReactApplicationContext) : NativeScryptSpec(reactContext) {
    
    override fun getName() = NAME

    override fun scrypt(
        passwd: String,
        salt: String,
        N: Double,
        r: Double,
        p: Double,
        dkLen: Double,
        onProgress: Callback?,
        promise: Promise
    ) {
        try {
            Log.d(NAME, "Starting scrypt computation with params: N=$N, r=$r, p=$p, dkLen=$dkLen")
            
            // Convert Double parameters to Int and validate
            val NInt = N.toInt()
            val rInt = r.toInt()
            val pInt = p.toInt()
            val dkLenInt = dkLen.toInt()

            // Input validation
            if (NInt <= 1 || !isPowerOfTwo(NInt)) {
                throw IllegalArgumentException("N must be > 1 and a power of 2")
            }
            if (rInt < 1) throw IllegalArgumentException("r must be >= 1")
            if (pInt < 1) throw IllegalArgumentException("p must be >= 1")
            if (dkLenInt < 1) throw IllegalArgumentException("dkLen must be >= 1")

            Log.d(NAME, "Parameters validated successfully")

            // Decode base64 inputs
            val passwdBytes: ByteArray
            val saltBytes: ByteArray
            try {
                passwdBytes = Base64.decode(passwd, Base64.DEFAULT)
                saltBytes = Base64.decode(salt, Base64.DEFAULT)
                Log.d(NAME, "Successfully decoded base64 inputs")
            } catch (e: IllegalArgumentException) {
                Log.e(NAME, "Failed to decode base64 input", e)
                throw IllegalArgumentException("Invalid base64 input")
            }

            // Run on background thread to avoid blocking the main thread
            Thread {
                try {
                    Log.d(NAME, "Starting SCrypt generation on background thread")
                    val derivedKey = SCrypt.generate(
                        passwdBytes,
                        saltBytes,
                        NInt,
                        rInt,
                        pInt,
                        dkLenInt
                    )
                    Log.d(NAME, "SCrypt generation completed")

                    // Convert to hex string
                    val hexResult = derivedKey.joinToString("") { 
                        "%02x".format(it) 
                    }
                    Log.d(NAME, "Hex conversion completed")
                    
                    // Resolve on JS thread
                    reactApplicationContext.runOnJSQueueThread {
                        try {
                            promise.resolve(hexResult)
                            Log.d(NAME, "Promise resolved successfully")
                        } catch (e: Exception) {
                            Log.e(NAME, "Failed to resolve promise", e)
                            promise.reject("SCRYPT_ERROR", "Failed to resolve promise: ${e.message}")
                        }
                    }
                } catch (e: Exception) {
                    Log.e(NAME, "Error in background thread", e)
                    reactApplicationContext.runOnJSQueueThread {
                        promise.reject("SCRYPT_ERROR", e.message, e)
                    }
                }
            }.start()
        } catch (e: Exception) {
            Log.e(NAME, "Error in main thread", e)
            promise.reject("SCRYPT_INVALID_PARAMS", e.message, e)
        }
    }

    private fun isPowerOfTwo(n: Int): Boolean {
        return n and (n - 1) == 0
    }

    companion object {
        const val NAME = "NativeScrypt"
    }
}