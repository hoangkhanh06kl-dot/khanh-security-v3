import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  ShieldCheck,
  Camera,
  Volume2,
  Sparkles
} from "lucide-react";

import { apiPost } from "../services/api";

export default function ScamAssistant({ onBack }) {
  const [story, setStory] = useState("");
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  const fileInput = useRef(null);

  useEffect(() => {
    if (!photo) {
      setPreview("");
      return;
    }

    const url = URL.createObjectURL(photo);
    setPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [photo]);

  useEffect(() => {
    return () => window.speechSynthesis?.cancel();
  }, []);

  function selectImage(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    if (
      !["image/jpeg", "image/png", "image/webp"]
        .includes(file.type) ||
      file.size > 8 * 1024 * 1024
    ) {
      setError("Ảnh không hợp lệ hoặc lớn hơn 8 MB.");
      setPhoto(null);
      e.target.value = "";
      return;
    }

    setError("");
    setReport(null);
    setPhoto(file);
  }

  async function analyze() {
    if (loading || !consent) return;
    if (!story.trim() && !photo) return;

    setLoading(true);
    setReport(null);
    setError("");

    try {
      let data;

      if (photo) {
        const form = new FormData();

        form.append("image", photo);
        form.append("context", story.trim());

        data = await apiPost(
          "analyze-image",
          form,
          120000
        );
      } else {
        data = await apiPost(
          "analyze",
          { message: story.trim() },
          120000
        );
      }

      setReport(data);
    } catch (err) {
      setError(
        err.message || "Không thể kết nối dịch vụ AI."
      );
    } finally {
      setLoading(false);
    }
  }

  function speak() {
    if (!window.speechSynthesis) {
      setError("Thiết bị không hỗ trợ đọc văn bản.");
      return;
    }

    const voice = window.speechSynthesis
      .getVoices()
      .find(v => v.lang.toLowerCase().startsWith("vi"));

    if (!voice) {
      setError("Thiết bị chưa cài giọng đọc tiếng Việt.");
      return;
    }

    const speech = new SpeechSynthesisUtterance(
      report.result
    );

    speech.lang = "vi-VN";
    speech.voice = voice;
    speech.rate = 0.85;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(speech);
  }

  function clearImage() {
    setPhoto(null);
    setReport(null);

    if (fileInput.current) {
      fileInput.current.value = "";
    }
  }

  return (
    <div className="scanner ks-assistant">

      <button className="back-btn" onClick={onBack}>
        <ArrowLeft size={20} />
        Quay lại
      </button>

      <section className="assistant-header">
        <ShieldCheck size={46} />

        <h2>Khánh Security AI</h2>

        <p>
          Trợ lý thông minh hỗ trợ nhận diện lừa đảo.
        </p>
      </section>

      <label className="input-label">
        Bạn đang gặp vấn đề gì?
      </label>

      <textarea
        value={story}
        maxLength={10000}
        disabled={loading}
        onChange={e => {
          setStory(e.target.value);
          setReport(null);
        }}
        placeholder="Ví dụ: Có người tự xưng là công an yêu cầu tôi chuyển tiền..."
      />

      <label className="assistant-upload">
        <Camera size={36} />

        <strong>Chọn ảnh chụp màn hình</strong>

        <span>Zalo, Messenger, SMS...</span>

        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={loading}
          onChange={selectImage}
        />
      </label>

      {preview && (
        <div className="assistant-preview">
          <img src={preview} alt="Ảnh cần phân tích" />

          <button
            className="ai-btn"
            disabled={loading}
            onClick={clearImage}
          >
            Xóa ảnh
          </button>
        </div>
      )}

      <label className="assistant-consent">
        <input
          type="checkbox"
          checked={consent}
          disabled={loading}
          onChange={e => setConsent(e.target.checked)}
        />

        <span>
          Tôi đồng ý gửi nội dung đến Gemini để phân tích.
          Tôi đã che OTP, mật khẩu và thông tin cá nhân.
        </span>
      </label>

      <button
        className="scan-btn"
        onClick={analyze}
        disabled={
          loading ||
          !consent ||
          (!story.trim() && !photo)
        }
      >
        <Sparkles size={20} />

        {loading
          ? "AI đang phân tích..."
          : "Phân tích ngay"}
      </button>

      {loading && (
        <div className="assistant-loading">
          <div className="assistant-spinner" />
          Đang kiểm tra dấu hiệu lừa đảo...
        </div>
      )}

      {error && (
        <p role="alert" className="assistant-error">
          {error}
        </p>
      )}

      {report && (
        <div className="ai-result">

          <h3>Báo cáo phân tích AI</h3>

          {Number.isInteger(report.score) && (
            <div
              className={`assistant-score ${
                report.score >= 60
                  ? "high-risk"
                  : report.score >= 30
                    ? "medium-risk"
                    : "low-risk"
              }`}
            >
              {report.score}/100
            </div>
          )}

          <p style={{ whiteSpace: "pre-wrap" }}>
            {report.result}
          </p>

          <button className="ai-btn" onClick={speak}>
            <Volume2 size={20} />
            Đọc kết quả
          </button>

          <button
            className="ai-btn"
            onClick={() =>
              window.speechSynthesis?.cancel()
            }
          >
            Dừng đọc
          </button>

          <small>
            AI có thể nhận định sai. Luôn xác minh thông
            tin trước khi chuyển tiền.
          </small>

        </div>
      )}
    </div>
  );
}