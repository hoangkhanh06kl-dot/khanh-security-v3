package com.khanh.security;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.os.Build;
import android.telecom.Call;
import android.telecom.CallScreeningService;

public class ScreeningService extends CallScreeningService {
    static String normalize(String value) {
        String number = value == null ? "" : value.replaceAll("[\\s.()\\-]", "");
        return number.startsWith("+84") ? "0" + number.substring(3) : number;
    }
    @Override public void onScreenCall(Call.Details details) {
        if (Build.VERSION.SDK_INT < 29 || details.getCallDirection() != Call.Details.DIRECTION_INCOMING) return;
        // Respond immediately; never block a call or send its number to an external service.
        respondToCall(details, new CallResponse.Builder().setDisallowCall(false).build());
        if (details.getHandle() == null) return;
        String number = normalize(details.getHandle().getSchemeSpecificPart());
        long stored = getSharedPreferences("ks_call_flags", Context.MODE_PRIVATE).getLong(number, 0);
        if (stored <= 0 || System.currentTimeMillis() - stored > 7L*24*60*60*1000) return;
        try {
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager == null || !manager.areNotificationsEnabled()) return;
            String channel = "ks_call_warning";
            manager.createNotificationChannel(new NotificationChannel(channel, "Cảnh báo cuộc gọi", NotificationManager.IMPORTANCE_HIGH));
            manager.notify(570, new Notification.Builder(this, channel).setSmallIcon(android.R.drawable.ic_dialog_alert).setContentTitle("Khánh Security: số cần chú ý").setContentText("Số này từng có báo cáo cộng đồng và được bạn đánh dấu. Hãy xác minh trước khi giao dịch.").setVisibility(Notification.VISIBILITY_PRIVATE).setAutoCancel(true).build());
        } catch (SecurityException ignored) {}
    }
}
