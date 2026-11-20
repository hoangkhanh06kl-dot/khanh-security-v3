import { useEffect, useRef, useState } from "react";
import { saveHistory } from "../services/historyService";
import { apiPost } from "../services/api";

import {
  ArrowLeft,
  AudioLines,
  Upload,
  FileAudio,
  ShieldAlert
} from "lucide-react";

export default function DeepfakeScanner({ onBack }) {
  const fileRef = useRef(null);

  const [file, setFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!file) return;

    const url = URL.createObjectURL(file);

    setAudioUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  function selectFile(event) {
    const selected = event.target.files[0];

    if (!selected) return;

    setError("");
    setResult("");

    if (selected.size > 10 * 1024 * 1024) {
      setError("Tệp không được vượt quá 10 MB.");
      return;
    }

    if (!/\.(mp3|wav)$/i.test(selected.name)) {
      setError("Chỉ hỗ trợ tệp MP3 và WAV.");
      return;
    }

    setFile(selected);
  }

  async function analyzeAudio() {
    if (!file) return;

    const agreed = window.confirm(
      "Tệp âm thanh sẽ được gửi tới Gemini. " +
      "Bạn cần có quyền và sự đồng ý để chia sẻ bản ghi. " +
      "Bạn có muốn tiếp tục?"
    );

    if (!agreed) return;

    setLoading(true);
    setError("");
    setResult("");

    try {
      const formData = new FormData();

      formData.append("audio", file);

      const data = await apiPost("analyze-audio", formData, 90000);

      setResult(data.result);
      saveHistory(
  "audio",
  "Phân tích giọng nói",
  data.score >= 60 ? "Nguy cơ cao" : data.score == null ? "Đã phân tích" : data.score >= 30 ? "Đáng ngờ" : "Chưa phát hiện nhiều dấu hiệu",
  data.score ?? null
);

    } catch (error) {
      setError(
        error.name === "TimeoutError"
          ? "Quá thời gian phân tích."
          : error.message
      );

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
          <AudioLines size={28} />
        </div>

        <h2>Phân tích giọng nói</h2>

        <p>
          Kiểm tra dấu hiệu lừa đảo trong đoạn ghi âm.
        </p>

      </div>

      <input
        type="file"
        accept=".mp3,.wav"
        ref={fileRef}
        onChange={selectFile}
        hidden
      />

      <button
        className="audio-upload"
        onClick={() => fileRef.current.click()}
        disabled={loading}
      >
        <Upload size={36} />

        <strong>Chọn tệp âm thanh</strong>

        <span>MP3, WAV · Tối đa 10 MB</span>
      </button>

      {file && (
        <div className="audio-file">

          <FileAudio size={25} />

          <div>
            <strong>{file.name}</strong>

            <p>
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>

        </div>
      )}

      {file && audioUrl && (
        <audio
          controls
          src={audioUrl}
          className="audio-player"
        />
      )}

      <button
        className="scan-btn"
        onClick={analyzeAudio}
        disabled={!file || loading}
      >
        {loading
          ? "Đang phân tích âm thanh..."
          : "Phân tích giọng nói"}
      </button>

      {error && (
        <p className="error-text">{error}</p>
      )}

      {result && (
        <div className="ai-result">

          <h3>
            <ShieldAlert size={23} />
            Báo cáo phân tích âm thanh
          </h3>

          <div>{result}</div>

        </div>
      )}

      <p className="qr-note">
        Kết quả không phải bằng chứng xác thực
        giọng nói thật hay Deepfake.
      </p>

    </div>
  );
}
