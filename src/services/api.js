import { Capacitor } from "@capacitor/core";
import { auth } from "../firebase";

export async function apiPost(path, payload, timeout = 60000) {
  const base = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
  if (!base && (Capacitor.isNativePlatform() || !import.meta.env.DEV)) {
    throw new Error("Chưa cấu hình máy chủ HTTPS (VITE_API_URL).");
  }
  if (base && !base.startsWith("https://") && !import.meta.env.DEV) throw new Error("Máy chủ phải sử dụng HTTPS.");
  const user = auth.currentUser;
  if (!user) throw new Error("Vui lòng đăng nhập lại.");
  const token = await user.getIdToken();
  const multipart = payload instanceof FormData;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(`${base}/api/${path}`, {
      method: "POST", signal: controller.signal,
      headers: { Authorization: `Bearer ${token}`, ...(multipart ? {} : { "Content-Type": "application/json" }) },
      body: multipart ? payload : JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Máy chủ trả lỗi ${response.status}.`);
    return data;
  } catch (error) {
    if (error.name === "AbortError") throw new Error("Quá thời gian phản hồi. Vui lòng thử lại.");
    if (error instanceof TypeError) throw new Error("Không thể kết nối máy chủ. Kiểm tra mạng và cấu hình API.");
    throw error;
  } finally { clearTimeout(timer); }
}
