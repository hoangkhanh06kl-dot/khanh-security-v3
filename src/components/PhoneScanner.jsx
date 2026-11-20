import { useState } from "react";

import {
  ArrowLeft,
  Phone,
  Search,
  Flag,
  ShieldAlert,
  ShieldCheck
} from "lucide-react";

import {
  lookupPhone,
  submitPhoneReport,
  deletePhoneReport
} from "../services/phoneService";

import { saveHistory } from "../services/historyService";
import { nativeAndroid, CallProtection } from "../services/callProtection";

export default function PhoneScanner({ onBack }) {
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);

  function normalizePhone(value) {
    let number = value.replace(/[\s.-]/g, "");

    if (number.startsWith("+84")) {
      number = "0" + number.slice(3);
    }

    return number;
  }

  async function checkPhone() {
    setError("");
    setSuccess("");
    setResult(null);
    setShowReport(false);

    const number = normalizePhone(phone);

    if (!/^0[35789]\d{8}$/.test(number)) {
      setError("Số điện thoại di động không hợp lệ.");
      return;
    }

    setLoading(true);

    try {
      const data = await lookupPhone(number);

      setResult(data);

      saveHistory(
        "phone",
        "Kiểm tra số điện thoại",
        data.count > 0
          ? "Có báo cáo cộng đồng"
          : "Chưa có báo cáo"
      );

    } catch {
      setError("Không thể tra cứu cơ sở dữ liệu.");

    } finally {
      setLoading(false);
    }
  }

  async function reportPhone() {
    if (!result || !reason) {
      setError("Vui lòng chọn lý do báo cáo.");
      return;
    }

    if (!window.confirm(
      "Bạn xác nhận báo cáo số điện thoại này?"
    )) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await submitPhoneReport(
        result.phone,
        reason
      );

      const updated = await lookupPhone(result.phone);

      setResult(updated);
      setShowReport(false);
      setReason("");
      setSuccess("Đã gửi báo cáo thành công.");

    } catch (error) {
      setError(error.message);

    } finally {
      setLoading(false);
    }
  }

  async function withdrawReport() {
    if (!window.confirm(
      "Bạn muốn rút lại báo cáo của mình?"
    )) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await deletePhoneReport(result.phone);

      setResult(await lookupPhone(result.phone));
      setSuccess("Đã xử lý yêu cầu rút báo cáo.");

    } catch {
      setError("Không thể rút báo cáo.");

    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="scanner">

      <button className="back-btn" onClick={onBack}>
        <ArrowLeft size={20} />
        Quay lại
      </button>

      <div className="scanner-heading">

        <div className="feature-icon">
          <Phone size={28} />
        </div>

        <h2>Kiểm tra số điện thoại</h2>

        <p>
          Tra cứu dữ liệu báo cáo từ cộng đồng
          Khánh Security.
        </p>

      </div>

      <label className="input-label">
        Số điện thoại
      </label>

      <input
        type="tel"
        className="security-input"
        placeholder="Nhập số điện thoại..."
        value={phone}
        disabled={loading}
        onChange={(e) => {
          setPhone(e.target.value);
          setResult(null);
          setError("");
          setSuccess("");
          setShowReport(false);
        }}
      />

      <button
        className="scan-btn qr-action"
        onClick={checkPhone}
        disabled={loading || !phone.trim()}
      >
        <Search size={20} />

        {loading
          ? "Đang xử lý..."
          : "Tra cứu số điện thoại"}
      </button>

      {error && (
        <p className="error-text">{error}</p>
      )}

      {success && (
        <p className="auth-success">{success}</p>
      )}

      {result && (
        <div className="phone-result">

          <h3>Kết quả tra cứu</h3>

          <h2>{result.phone}</h2>

          <div className="phone-status">

            {result.count > 0 ? (
              <>
                <ShieldAlert
                  className="medium-risk"
                  size={28}
                />

                <strong className="medium-risk">
                  Có báo cáo cộng đồng
                </strong>
              </>
            ) : (
              <>
                <ShieldCheck
                  size={28}
                  color="#93c5fd"
                />

                Chưa có báo cáo
              </>
            )}

          </div>

          <div className="phone-row">

            <span>Số lượt báo cáo</span>

            <strong className="medium-risk">
              {result.count}
            </strong>

          </div>

          {Object.entries(result.reasons).map(
            ([name, count]) => (
              <div className="phone-row" key={name}>
                <span>{name}</span>
                <strong>{count}</strong>
              </div>
            )
          )}

          <p>
            Báo cáo cộng đồng chưa được xác minh,
            không phải kết luận lừa đảo.
          </p>
          {nativeAndroid && result.count > 0 && <button className="ai-btn" disabled={loading} onClick={async () => {
            if (!window.confirm("Lưu số này trên thiết bị trong 7 ngày để nhắc nhở khi có cuộc gọi đến?")) return;
            try { await CallProtection.remember({ phone: result.phone }); setSuccess("Đã đánh dấu trên thiết bị. Bật sàng lọc trong Cài đặt để nhận nhắc nhở."); } catch { setError("Không thể lưu dấu hiệu cuộc gọi."); }
          }}>Đánh dấu để cảnh báo cuộc gọi</button>}

          <button
            className="report-btn"
            disabled={loading}
            onClick={() => setShowReport(!showReport)}
          >
            <Flag size={18} />
            Báo cáo số điện thoại
          </button>

          {showReport && (
            <div className="report-form">

              <label>Lý do báo cáo</label>

              <select
                className="security-input"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                <option value="">Chọn lý do</option>
                <option>Giả mạo công an</option>
                <option>Giả mạo ngân hàng</option>
                <option>Yêu cầu chuyển tiền</option>
                <option>Yêu cầu mã OTP</option>
                <option>Cuộc gọi quấy rối</option>
                <option>Dấu hiệu lừa đảo khác</option>
              </select>

              <button
                className="scan-btn"
                onClick={reportPhone}
                disabled={loading || !reason}
              >
                Xác nhận báo cáo
              </button>

            </div>
          )}

          <button
            className="ai-btn"
            onClick={withdrawReport}
            disabled={loading}
          >
            Rút báo cáo của tôi
          </button>

        </div>
      )}

    </div>
  );
}
