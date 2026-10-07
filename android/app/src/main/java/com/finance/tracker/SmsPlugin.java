package com.finance.tracker;

import android.Manifest;
import android.content.ContentResolver;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.provider.Settings;
import androidx.core.content.ContextCompat;
import androidx.annotation.NonNull;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.fragment.app.FragmentActivity;
import java.util.concurrent.Executor;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(
    name = "SmsPlugin",
    permissions = {
        @Permission(
            alias = "sms",
            strings = { Manifest.permission.RECEIVE_SMS, Manifest.permission.READ_SMS }
        )
    }
)
public class SmsPlugin extends Plugin {

    private static SmsPlugin instance;

    @Override
    public void load() {
        super.load();
        instance = this;
    }

    public static SmsPlugin getInstance() {
        return instance;
    }

    private boolean isSmsPermissionGranted() {
        boolean readGranted = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.READ_SMS) == PackageManager.PERMISSION_GRANTED;
        boolean receiveGranted = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.RECEIVE_SMS) == PackageManager.PERMISSION_GRANTED;
        return readGranted || receiveGranted;
    }

    @Override
    @PluginMethod
    public void checkPermissions(PluginCall call) {
        if (isSmsPermissionGranted()) {
            JSObject ret = new JSObject();
            ret.put("sms", "granted");
            ret.put("granted", true);
            ret.put("status", "GRANTED");
            call.resolve(ret);
        } else {
            JSObject ret = new JSObject();
            ret.put("sms", "denied");
            ret.put("granted", false);
            ret.put("status", "NOT_GRANTED");
            call.resolve(ret);
        }
    }

    @Override
    @PluginMethod
    public void requestPermissions(PluginCall call) {
        if (isSmsPermissionGranted()) {
            JSObject ret = new JSObject();
            ret.put("sms", "granted");
            ret.put("granted", true);
            ret.put("status", "GRANTED");
            call.resolve(ret);
        } else {
            requestPermissionForAlias("sms", call, "smsPermsCallback");
        }
    }

    @PluginMethod
    public void checkSmsPermissions(PluginCall call) {
        checkPermissions(call);
    }

    @PluginMethod
    public void requestSmsPermissions(PluginCall call) {
        requestPermissions(call);
    }

    @PermissionCallback
    private void smsPermsCallback(PluginCall call) {
        if (isSmsPermissionGranted()) {
            JSObject ret = new JSObject();
            ret.put("sms", "granted");
            ret.put("granted", true);
            ret.put("status", "GRANTED");
            call.resolve(ret);
        } else {
            JSObject ret = new JSObject();
            ret.put("sms", "denied");
            ret.put("granted", false);
            ret.put("status", "DENIED");
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void openAppSettings(PluginCall call) {
        try {
            Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            Uri uri = Uri.fromParts("package", getContext().getPackageName(), null);
            intent.setData(uri);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Could not open app settings", e);
        }
    }

    @PluginMethod
    public void readExistingSms(PluginCall call) {
        boolean readGranted = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.READ_SMS) == PackageManager.PERMISSION_GRANTED;
        if (!readGranted) {
            call.reject("READ_SMS permission is not granted on this device.");
            return;
        }

        JSArray messagesArray = new JSArray();
        ContentResolver cr = getContext().getContentResolver();
        Uri inboxUri = Uri.parse("content://sms/inbox");

        Cursor cursor = null;
        try {
            cursor = cr.query(
                inboxUri,
                new String[] { "_id", "address", "body", "date" },
                null,
                null,
                "date DESC LIMIT 500"
            );

            if (cursor != null && cursor.moveToFirst()) {
                int addressIdx = cursor.getColumnIndex("address");
                int bodyIdx = cursor.getColumnIndex("body");
                int dateIdx = cursor.getColumnIndex("date");

                do {
                    String address = cursor.getString(addressIdx);
                    String body = cursor.getString(bodyIdx);
                    long date = cursor.getLong(dateIdx);

                    JSObject smsObj = new JSObject();
                    smsObj.put("sender", address != null ? address : "");
                    smsObj.put("body", body != null ? body : "");
                    smsObj.put("timestamp", date);
                    messagesArray.put(smsObj);
                } while (cursor.moveToNext());
            }

            JSObject ret = new JSObject();
            ret.put("messages", messagesArray);
            ret.put("count", messagesArray.length());
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Error reading SMS inbox: " + e.getMessage(), e);
        } finally {
            if (cursor != null) {
                cursor.close();
            }
        }
    }

    public void onSmsReceived(String sender, String body) {
        JSObject data = new JSObject();
        data.put("sender", sender);
        data.put("body", body);
        data.put("timestamp", System.currentTimeMillis());
        notifyListeners("smsReceived", data);
    }

    @PluginMethod
    public void authenticateBiometric(final PluginCall call) {
        getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    BiometricManager biometricManager = BiometricManager.from(getContext());
                    int canAuthenticate = biometricManager.canAuthenticate(
                        BiometricManager.Authenticators.BIOMETRIC_STRONG | 
                        BiometricManager.Authenticators.BIOMETRIC_WEAK | 
                        BiometricManager.Authenticators.DEVICE_CREDENTIAL
                    );

                    if (canAuthenticate != BiometricManager.BIOMETRIC_SUCCESS) {
                        JSObject ret = new JSObject();
                        ret.put("success", false);
                        ret.put("reason", "Biometrics or screen lock device credential is not enrolled in Android Settings.");
                        call.resolve(ret);
                        return;
                    }

                    Executor executor = ContextCompat.getMainExecutor(getContext());
                    FragmentActivity activity = (FragmentActivity) getActivity();

                    BiometricPrompt biometricPrompt = new BiometricPrompt(activity, executor, new BiometricPrompt.AuthenticationCallback() {
                        @Override
                        public void onAuthenticationSucceeded(@NonNull BiometricPrompt.AuthenticationResult result) {
                            super.onAuthenticationSucceeded(result);
                            JSObject ret = new JSObject();
                            ret.put("success", true);
                            call.resolve(ret);
                        }

                        @Override
                        public void onAuthenticationError(int errorCode, @NonNull CharSequence errString) {
                            super.onAuthenticationError(errorCode, errString);
                            JSObject ret = new JSObject();
                            ret.put("success", false);
                            ret.put("reason", errString.toString());
                            call.resolve(ret);
                        }

                        @Override
                        public void onAuthenticationFailed() {
                            super.onAuthenticationFailed();
                        }
                    });

                    BiometricPrompt.PromptInfo promptInfo = new BiometricPrompt.PromptInfo.Builder()
                        .setTitle("Unlock FinanceTracker")
                        .setSubtitle("Touch fingerprint sensor or scan face to unlock vault")
                        .setAllowedAuthenticators(
                            BiometricManager.Authenticators.BIOMETRIC_STRONG | 
                            BiometricManager.Authenticators.BIOMETRIC_WEAK | 
                            BiometricManager.Authenticators.DEVICE_CREDENTIAL
                        )
                        .build();

                    biometricPrompt.authenticate(promptInfo);
                } catch (Exception e) {
                    JSObject ret = new JSObject();
                    ret.put("success", false);
                    ret.put("reason", "Biometric authentication error: " + e.getMessage());
                    call.resolve(ret);
                }
            }
        });
    }
}
