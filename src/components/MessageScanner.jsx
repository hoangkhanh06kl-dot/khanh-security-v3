import { useState } from "react";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { saveHistory } from "../services/historyService";
import { apiPost } from "../services/api";

export default function MessageScanner({ onBack }) {
  const [message, setMessage] = useState("");
  const [result, setResult] = useState(null);
  const [aiResult, setAiResult] = useState("");
  const [loading, setLoading] = useState(false);
  async function analyzeWithAI() {
  if (!message.trim() || loading) return;
  if (!window.confirm("Tin nhắn sẽ được gửi tới Gemini. Hãy xóa OTP, mật khẩu và dữ liệu cá nhân trước khi tiếp tục.")) return;
  setLoading(true);
  setAiResult("");

  try {
    const data = await apiPost("analyze", { message });

    setAiResult(data.result);

    saveHistory(
  "message",
  "Phân tích Gemini",
  data.score >= 60 ? "Nguy cơ cao" : data.score == null ? "Đã phân tích" : data.score >= 30 ? "Đáng ngờ" : "Chưa phát hiện nhiều dấu hiệu",
  data.score ?? null
);


  } catch (error) {
    setAiResult(
      error.message
    );

  } finally {
    setLoading(false);
  }
}

  function analyzeMessage() {
    const rules = [
      { keyword: "chuyển tiền", score: 30 },
      { keyword: "otp", score: 35 },
      { keyword: "trúng thưởng", score: 30 },
      { keyword: "nhận quà", score: 20 },
      { keyword: "công an", score: 15 },
      { keyword: "khóa tài khoản", score: 25 },
      { keyword: "xác minh tài khoản", score: 25 },
      { keyword: "mật khẩu", score: 30 },
      { keyword: "khẩn cấp", score: 15 },
      { keyword: "mã xác thực", score: 35 },
      { keyword: "phí nhận", score: 25 },
      { keyword: "cập nhật sinh trắc", score: 25 },
      { keyword: "cài ứng dụng", score: 20 },
      { keyword: "http", score: 15 }
    ];

    const content = message.toLowerCase();
    let score = 0;
    let reasons = [];

    rules.forEach((rule) => {
      if (content.includes(rule.keyword)) {
        score += rule.score;
        reasons.push(rule.keyword);
      }
    });

    score = Math.min(score, 100);

    saveHistory(
  "message",
  "Phân tích tin nhắn",
  score >= 60
    ? "Nguy cơ cao"
    : score >= 30
    ? "Đáng ngờ"
    : "Chưa phát hiện nhiều dấu hiệu",
  score
);

    setResult({
      score,
      reasons,
      level:
        score >= 60
          ? "Nguy hiểm cao"
          : score >= 30
          ? "Đáng ngờ"
          : "Chưa phát hiện nhiều dấu hiệu"
    });
  }

  return (
    <div className="scanner">
      <button className="back-btn" onClick={onBack}>
        <ArrowLeft size={20} /> Quay lại
      </button>

      <h2>Phân tích tin nhắn</h2>

      <p>Nhập tin nhắn bạn nghi ngờ có dấu hiệu lừa đảo.</p>

      <textarea
        maxLength={10000}
        disabled={loading}
        placeholder="Dán nội dung tin nhắn tại đây..."
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
          setResult(null);
          setAiResult("");
        }}
      />

      <button
        className="scan-btn"
        onClick={analyzeMessage}
        disabled={!message.trim() || loading}
      >
        Phân tích tin nhắn
      </button>
        <button
  className="ai-btn"
  onClick={analyzeWithAI}
  disabled={loading || !message.trim()}
>
  {loading
    ? "Đang phân tích..."
    : "Phân tích nâng cao với Gemini"}
</button>

{aiResult && (
  <div className="ai-result">
    <h3>Báo cáo phân tích AI</h3>
    <div>{aiResult}</div>
  </div>
)}
      {result && (
        <div className={`scan-result ${result.score >= 60 ? "high-risk" : result.score >= 30 ? "medium-risk" : "low-risk"}`}>
          <ShieldAlert size={40} />

          <h2>{result.level}</h2>

          <h1>{result.score}/100</h1>

          <p>Điểm rủi ro</p>

          {result.reasons.map((reason) => (
            <p key={reason}>⚠️ Phát hiện: {reason}</p>
          ))}

          <p>
            Không cung cấp OTP, mật khẩu hoặc chuyển tiền
            khi chưa xác minh người gửi.
          </p>
        </div>
      )}
    </div>
  );
}
