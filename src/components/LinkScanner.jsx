import { useState } from "react";
import { saveHistory } from "../services/historyService";
import { apiPost } from "../services/api";
import {
  ArrowLeft,
  ShieldAlert,
  ShieldCheck,
  Link2
} from "lucide-react";

export default function LinkScanner({
  onBack,
  initialLink = ""
}) {
  const [link, setLink] = useState(initialLink);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [vtResult, setVtResult] = useState(null);
  const [vtLoading, setVtLoading] = useState(false);

  // KIỂM TRA CƠ BẢN
  function analyzeLink() {
    setError("");
    setResult(null);

    let url;

    try {
      url = new URL(link.trim());

      if (!["http:", "https:"].includes(url.protocol)) {
        throw new Error();
      }
    } catch {
      setError("Vui lòng nhập đường dẫn hợp lệ.");
      return;
    }

    const domain = url.hostname.toLowerCase();
    const content = url.href.toLowerCase();

    let score = 0;
    let reasons = [];

    function addRisk(points, reason) {
      score += points;
      reasons.push(reason);
    }

    if (url.protocol !== "https:") {
      addRisk(20, "Không sử dụng HTTPS");
    }

    if (domain.includes("xn--")) {
      addRisk(25, "Tên miền chứa ký tự mã hóa");
    }

    if (url.username || url.password) {
      addRisk(35, "Chứa thông tin đăng nhập bất thường");
    }

    if (domain.length > 40) {
      addRisk(15, "Tên miền dài bất thường");
    }

    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(domain)) {
      addRisk(25, "Sử dụng địa chỉ IP");
    }

    const shorteners = [
      "bit.ly",
      "tinyurl.com",
      "t.co"
    ];

    if (shorteners.includes(domain)) {
      addRisk(20, "Sử dụng đường dẫn rút gọn");
    }

    const keywords = [
      "verify",
      "password",
      "otp",
      "nhan-thuong",
      "xac-minh",
      "free-money"
    ];

    keywords.forEach((keyword) => {
      if (content.includes(keyword)) {
        addRisk(15, `Chứa từ khóa: ${keyword}`);
      }
    });

    score = Math.min(score, 100);
    saveHistory(
  "link",
  "Kiểm tra đường dẫn",
  score >= 60
    ? "Nguy cơ cao"
    : score >= 30
    ? "Đáng ngờ"
    : "Chưa phát hiện nhiều dấu hiệu",
  score
);

    setResult({
      domain,
      score,
      reasons,
      level:
        score >= 60
          ? "Nguy cơ cao"
          : score >= 30
          ? "Đáng ngờ"
          : "Chưa phát hiện nhiều dấu hiệu"
    });
  }

  // KIỂM TRA VIRUSTOTAL
  async function checkVirusTotal() {
    setVtLoading(true);
    setVtResult(null);
    setError("");

    try {
      const url = new URL(link.trim());

      if (!["http:", "https:"].includes(url.protocol)) {
        throw new Error("Đường dẫn không hợp lệ");
      }

      if (url.username || url.password) {
        throw new Error("Không gửi link chứa thông tin đăng nhập");
      }

      const agreed = window.confirm(
        "Đường dẫn sẽ được gửi tới VirusTotal. " +
        "Không gửi link chứa dữ liệu cá nhân. Tiếp tục?"
      );

      if (!agreed) return;

      const data = await apiPost("check-url", { url: link.trim() }, 30000);

      setVtResult(data);
      saveHistory(
  "link",
  "Kiểm tra VirusTotal",
  !data.found
    ? "Chưa có dữ liệu"
    : data.malicious > 0
    ? "Nguy cơ cao"
    : data.suspicious > 0
    ? "Đáng ngờ"
    : "Chưa có cảnh báo"
);

    } catch (error) {
      setVtResult({
        error:
          error.name === "TimeoutError"
            ? "VirusTotal phản hồi quá chậm."
            : error.message
      });

    } finally {
      setVtLoading(false);
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
          <Link2 size={28} />
        </div>

        <h2>Kiểm tra đường dẫn</h2>

        <p>
          Phát hiện nguy cơ lừa đảo trước khi truy cập.
        </p>

      </div>

      <label className="input-label">
        Địa chỉ website
      </label>

      <input
        type="url"
        className="security-input"
        placeholder="https://example.com"
        value={link}
        disabled={vtLoading}
        onChange={(e) => {
          setLink(e.target.value);
          setResult(null);
          setVtResult(null);
          setError("");
        }}
      />

      {error && (
        <p className="error-text">{error}</p>
      )}

      <button
        className="scan-btn"
        onClick={analyzeLink}
        disabled={!link.trim()}
      >
        Kiểm tra bảo mật
      </button>

      <button
        className="ai-btn"
        onClick={checkVirusTotal}
        disabled={vtLoading || !link.trim()}
      >
        {vtLoading
          ? "Đang tra cứu..."
          : "Kiểm tra với VirusTotal"}
      </button>

      {/* KẾT QUẢ CƠ BẢN */}

      {result && (
        <div className={`link-result ${
          result.score >= 60
            ? "high-risk"
            : result.score >= 30
            ? "medium-risk"
            : "low-risk"
        }`}>

          {result.score >= 30
            ? <ShieldAlert size={45} />
            : <ShieldCheck size={45} />
          }

          <h2>{result.level}</h2>

          <div className="risk-score">
            {result.score}/100
          </div>

          <p>Điểm rủi ro</p>

          <div className="risk-progress">
            <div style={{
              width: `${result.score}%`
            }} />
          </div>

          <div className="result-domain">
            {result.domain}
          </div>

          <div className="risk-reasons">
            {result.reasons.map((reason) => (
              <p key={reason}>• {reason}</p>
            ))}
          </div>

          <p>
            Kết quả chỉ mang tính tham khảo.
          </p>

        </div>
      )}

      {/* KẾT QUẢ VIRUSTOTAL */}

      {vtResult && (
        <div className="vt-result">

          <h3>Báo cáo VirusTotal</h3>

          {vtResult.error ? (
            <p className="error-text">
              {vtResult.error}
            </p>
          ) : !vtResult.found ? (
            <p>{vtResult.message}</p>
          ) : (
            <>

              <h1 className={
                vtResult.malicious > 0
                  ? "high-risk"
                  : "low-risk"
              }>
                {vtResult.malicious}/{vtResult.total}
              </h1>

              <p>Công cụ báo cáo nguy hiểm</p>

              <div className="vt-grid">

                <div>
                  <strong className="high-risk">
                    {vtResult.malicious}
                  </strong>
                  <small>Nguy hiểm</small>
                </div>

                <div>
                  <strong className="medium-risk">
                    {vtResult.suspicious}
                  </strong>
                  <small>Đáng ngờ</small>
                </div>

                <div>
                  <strong style={{ color: "#34d399" }}>
                    {vtResult.harmless}
                  </strong>
                  <small>Không độc hại</small>
                </div>

                <div>
                  <strong>
                    {vtResult.undetected}
                  </strong>
                  <small>Chưa xác định</small>
                </div>

              </div>

              <p>
                Không có cảnh báo không đồng nghĩa
                với website hoàn toàn an toàn.
              </p>

            </>
          )}

        </div>
      )}

    </div>
  );
}
