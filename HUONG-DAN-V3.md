# Khánh Security 3.0 — hướng dẫn cài đặt và kiểm thử

## 1. Giữ nguyên dự án cũ

Giải nén file ZIP vào thư mục mới, ví dụ `C:\Users\KHANH\khanh-security-v3`. Mở thư mục `la-chan-ai` bên trong bằng VS Code. Không ghi đè dự án gốc. Bản này giữ mã dự án Firebase và Android `com.khanh.security`, không chứa API key Gemini/VirusTotal, khóa ký APK, node_modules hay dữ liệu Gradle đã build. Firebase web config là cấu hình công khai dùng cho SDK client, không thay thế Security Rules.

Nếu API key đã từng được gửi trong file nén, hãy thay key ở trang quản lý của nhà cung cấp. Không đưa key mới vào GitHub hoặc chat.

## 2. Cài đặt và chạy web

Terminal VS Code tại thư mục `la-chan-ai`:

```powershell
npm ci
cd server
npm ci
Copy-Item .env.example .env
```

Mở `server/.env`, nhập key Gemini và VirusTotal của bạn (nếu key cũ còn hiệu lực thì có thể dùng tạm, nên xoay key). `GEMINI_MODEL` phải là model được tài khoản Gemini cấp quyền; mặc định giữ tên model dự án gốc. `FIREBASE_WEB_API_KEY` là giá trị `apiKey` trong `src/firebase.js`; `FIREBASE_PROJECT_ID=antoankhanh`. Không dùng service account key thay cho web API key. Bật Email/Password trong Firebase Authentication nếu chưa bật. `HOST=127.0.0.1` và `PORT=5000` dành cho phát triển local.

Chạy terminal backend:

```powershell
node index.mjs
```

Mở terminal mới tại thư mục dự án (không phải server):

```powershell
npm run dev
```

Mở URL Vite in ra. Vite chuyển `/api` đến máy chủ local. Không cần bật CORS cho mọi domain. `/api/health` chỉ báo tiến trình backend đang chạy, không xác nhận Gemini/VirusTotal đã hoạt động.

## 3. Firebase Rules

File `firestore.rules` được soạn theo collection hiện tại: `users/{uid}/history`, `guardianLinks/{code}/alerts`, `phoneReports/{phone}/reports`. Sao lưu rules đang dùng trong Firebase Console trước; kiểm tra file mới với Rules Playground hoặc Emulator Suite. Sau khi kiểm thử, mới dán nội dung file vào Firestore Database > Rules và Publish. Các rules không tự triển khai khi giải nén ZIP. Người thân chỉ đọc cảnh báo sau khi liên kết active. Báo cáo điện thoại là dữ liệu cộng đồng chưa xác minh; client có thể đọc báo cáo khi đăng nhập, không được coi là danh sách lừa đảo chính thức. Cần moderation và chống spam server-side trước khi mở rộng công khai.

## 4. Máy chủ HTTPS thật (để APK và website hoạt động)

Triển khai thư mục `server` lên nhà cung cấp chạy Node.js. Build command `npm ci`, start command `node index.mjs`. Đặt biến môi trường phía host thay vì tải `.env` lên Git. Đặt `HOST=0.0.0.0`, dùng PORT do host cấp, `ALLOWED_ORIGINS` là URL website Vercel chính xác (nếu có nhiều origin, phân cách dấu phẩy). Giữ các khóa server-side. Kiểm tra `https://TEN-MAY-CHU/api/health`. Bản này xác thực token Firebase bằng Auth REST API, giới hạn theo UID/IP trong từng tiến trình; khi có nhiều instance cần quota dùng chung, giới hạn từ reverse proxy, giám sát chi phí và chống lạm dụng.

Tại thư mục dự án tạo `.env` từ `.env.example` và điền `VITE_API_URL=https://TEN-MAY-CHU` (không thêm `/api`). Trên Vercel cũng cấu hình biến frontend đó. Không đặt Gemini key hoặc VirusTotal key trong biến `VITE_*`. Android cần HTTPS thật; localhost trên điện thoại là chính điện thoại.

## 5. Build Android

```powershell
npm run build
npx cap sync android
npx cap open android
```

Android Studio cần SDK/platform tương thích với cấu hình Gradle 36 và JDK 21 như máy bạn đã thiết lập. Nếu báo SDK location, chọn đường dẫn SDK đã cài. Chọn `Pixel 7 D3` hoặc điện thoại thật, Run. APK debug ở `android/app/build/outputs/apk/debug/app-debug.apk`. Bản v3 giữ applicationId gốc, tăng versionCode lên 3; nếu đã cài phiên bản khác chữ ký, không tự gỡ app vì có thể mất dữ liệu local, hãy kiểm tra chữ ký trước. Khi phát hành, tạo signed AAB/APK bằng khóa do bạn quản lý riêng; không commit khóa.

### Kiểm tra sàng lọc cuộc gọi

Trong APK: đăng nhập > Cài đặt > Bật sàng lọc cuộc gọi > chọn Khánh Security nếu Android hiển thị lựa chọn > Cho phép thông báo. Tra cứu một số có báo cáo cộng đồng và chủ động bấm Đánh dấu để cảnh báo. Mã native lưu dấu trên thiết bị tối đa 7 ngày và nhắc khi cuộc gọi đến đủ điều kiện hệ thống chuyển đến dịch vụ. Không tự chặn, không thu âm, không gửi số cuộc gọi đến máy chủ. Có nút xóa danh sách và xóa khi đăng xuất. Kiểm tra bằng cuộc gọi thử trên thiết bị hỗ trợ Android 10 trở lên; không phải mọi cuộc gọi đều được Android chuyển tới dịch vụ. Tắt bằng phần ứng dụng mặc định/sàng lọc cuộc gọi của Android.

## 6. Danh sách kiểm thử trước khi phát hành

- Đăng nhập, đăng ký, đặt lại mật khẩu, đăng xuất; thử một tài khoản khác.
- Kiểm tra tin nhắn với rule, Gemini, mất mạng, request hết hạn; nội dung gửi Gemini phải có đồng ý và đã bỏ thông tin nhạy cảm.
- URL hợp lệ, URL không hợp lệ, URL chưa có dữ liệu VirusTotal; không gửi link có token hoặc dữ liệu riêng tư.
- QR: cấp/từ chối quyền camera, quét ảnh, chuyển qua LinkScanner; không tự mở URL.
- MP3/WAV dưới 10 MB, tệp sai định dạng; chỉ phân tích nội dung, không kết luận deepfake.
- Lịch sử và thống kê: số lượt phát hiện cao khớp, ngày Việt Nam, xóa lịch sử, tài khoản khác không đọc dữ liệu người dùng trước.
- Người giám hộ: tạo mã, nhập mã bằng tài khoản khác, người chủ xác nhận, quét nguy cơ cao, rồi hủy liên kết; không chia sẻ nội dung riêng tư.
- Sàng lọc/thông báo Android: thử có quyền và không có quyền; báo cáo cộng đồng chưa xác minh không đồng nghĩa lừa đảo.
- Kiểm thử dark/light ở cả màn hình điện thoại và desktop. Kiểm thử lại sau khi publish Rules.

## 7. Giới hạn & công việc triển khai còn lại

Đã tích hợp giao diện Premium, lịch sử thật, bảo mật API, rules mẫu, phân tích điểm rủi ro AI, kiểm tra QR/đường dẫn, liên kết giám hộ, nhắc cuộc gọi native theo danh sách đánh dấu, theme, icon và splash. Điểm do AI/rule là ước lượng, không phải xác suất. Thông báo giám hộ hiện vẫn là Firestore trong ứng dụng; FCM push khi đóng ứng dụng cần đăng ký ứng dụng Android Firebase, cấu hình token thiết bị, backend gửi FCM có quyền xác thực server và triển khai riêng. Chưa có xác thực deepfake chuyên dụng, đọc SMS/call audio tự động, giám sát giao dịch ngân hàng, hay APK Release đã ký. Các tính năng đó không nên được quảng cáo là đã hoạt động. Đã kiểm tra cú pháp module backend và thử health/401 local; build web/Android đầy đủ và API thật cần chạy trên máy của bạn với dependency và cấu hình đúng. Không nên phát hành công khai trước khi kiểm thử và rà soát quy tắc bảo mật.
