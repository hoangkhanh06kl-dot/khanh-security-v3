package com.khanh.security;

import android.Manifest;
import android.app.role.RoleManager;
import android.content.pm.PackageManager;
import android.os.Build;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.ActivityCallback;

@CapacitorPlugin(name = "CallProtection")
public class CallProtectionPlugin extends Plugin {
    private RoleManager roles() { return getContext().getSystemService(RoleManager.class); }
    private JSObject state() {
        JSObject data = new JSObject();
        boolean supported = Build.VERSION.SDK_INT >= 29 && roles() != null && roles().isRoleAvailable(RoleManager.ROLE_CALL_SCREENING);
        data.put("supported", supported);
        data.put("enabled", supported && roles().isRoleHeld(RoleManager.ROLE_CALL_SCREENING));
        data.put("notifications", Build.VERSION.SDK_INT < 33 || getContext().checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED);
        return data;
    }
    @PluginMethod public void status(PluginCall call) { call.resolve(state()); }
    @PluginMethod public void enable(PluginCall call) {
        if (Build.VERSION.SDK_INT < 29 || roles() == null || !roles().isRoleAvailable(RoleManager.ROLE_CALL_SCREENING)) { call.reject("Thiết bị không hỗ trợ sàng lọc cuộc gọi."); return; }
        if (roles().isRoleHeld(RoleManager.ROLE_CALL_SCREENING)) { call.resolve(state()); return; }
        startActivityForResult(call, roles().createRequestRoleIntent(RoleManager.ROLE_CALL_SCREENING), "roleResult");
    }
    @ActivityCallback private void roleResult(PluginCall call, ActivityResult result) { if (call != null) call.resolve(state()); }
    @PluginMethod public void notifications(PluginCall call) {
        if (Build.VERSION.SDK_INT >= 33 && getContext().checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            getActivity().runOnUiThread(() -> getActivity().requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, 781));
        }
        call.resolve(state());
    }
    @PluginMethod public void remember(PluginCall call) {
        String number = ScreeningService.normalize(call.getString("phone", ""));
        if (!number.matches("0[35789][0-9]{8}")) { call.reject("Số không hợp lệ."); return; }
        getContext().getSharedPreferences("ks_call_flags", 0).edit().putLong(number, System.currentTimeMillis()).apply();
        call.resolve();
    }
    @PluginMethod public void clear(PluginCall call) {
        getContext().getSharedPreferences("ks_call_flags", 0).edit().clear().apply(); call.resolve();
    }
}
