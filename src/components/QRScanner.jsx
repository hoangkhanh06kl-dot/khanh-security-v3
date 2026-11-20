import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

import {
  ArrowLeft,
  ScanLine,
  Camera,
  Image,
  ShieldCheck,
  X
} from "lucide-react";

export default function QRScanner({
  onBack,
  onCheckLink
}) {
  const scannerRef = useRef(null);
  const fileRef = useRef(null);
  const busy = useRef(false);

  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [camera, setCamera] = useState(false);
  const [loading, setLoading] = useState(false);
  useEffect(() => () => {
    const scanner = scannerRef.current;
    if (scanner?.isScanning) scanner.stop().then(() => scanner.clear()).catch(() => {});
  }, []);

  function getScanner() {
    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode("qr-reader");
    }

    return scannerRef.current;
  }

  async function stopCamera() {
    const scanner = scannerRef.current;

    if (scanner?.isScanning) {
      await scanner.stop();
      scanner.clear();
    }

    setCamera(false);
  }

  async function startCamera() {
    setError("");
    setResult("");
    setLoading(true);

    try {
      const scanner = getScanner();

      scanner.clear();
      busy.current = false;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: 220
        },

        async (decodedText) => {
          if (busy.current) return;

          busy.current = true;
          setResult(decodedText);
          await stopCamera();
        },

        () => {}
      );

      setCamera(true);

    } catch {
      setError(
        "Không thể mở camera. Vui lòng kiểm tra quyền truy cập."
      );
    } finally {
      setLoading(false);
    }
  }

  async function scanImage(event) {
    const file = event.target.files[0];

    if (!file) return;

    setError("");
    setResult("");
    setLoading(true);

    try {
      await stopCamera();

      const scanner = getScanner();

      const decodedText = await scanner.scanFile(
        file,
        true
      );

      setResult(decodedText);

    } catch {
      setError(
        "Không tìm thấy mã QR trong ảnh."
      );
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  }

  function checkLink() {
    try {
      const url = new URL(result);

      if (!["http:", "https:"].includes(url.protocol)) {
        throw new Error();
      }

      onCheckLink(url.href);

    } catch {
      setError(
        "Mã QR không chứa đường dẫn website hợp lệ."
      );
    }
  }

  async function goBack() {
    await stopCamera();
    onBack();
  }

  return (
    <div className="scanner">

      <button
        className="back-btn"
        onClick={goBack}
        disabled={loading}
      >
        <ArrowLeft size={20} />
        Quay lại
      </button>

      <div className="scanner-heading">

        <div className="feature-icon">
          <ScanLine size={28} />
        </div>

        <h2>Quét mã QR</h2>

        <p>
          Kiểm tra mã QR trước khi truy cập
          hoặc thực hiện giao dịch.
        </p>

      </div>

      <div className="qr-frame">

        {!camera && !result && (
          <div className="qr-placeholder">
            <ScanLine size={100} strokeWidth={1} />
            <p>Chưa có mã QR được quét</p>
          </div>
        )}

        <div id="qr-reader" />

      </div>

      {!camera ? (
        <button
          className="scan-btn qr-action"
          onClick={startCamera}
          disabled={loading}
        >
          <Camera size={21} />
          {loading ? "Đang xử lý..." : "Mở camera"}
        </button>
      ) : (
        <button
          className="ai-btn qr-action"
          onClick={stopCamera}
        >
          <X size={21} />
          Tắt camera
        </button>
      )}

      <input
        type="file"
        accept="image/*"
        ref={fileRef}
        onChange={scanImage}
        hidden
      />

      <button
        className="ai-btn qr-action"
        onClick={() => fileRef.current.click()}
        disabled={loading}
      >
        <Image size={21} />
        Chọn ảnh từ thiết bị
      </button>

      {error && (
        <p className="error-text">{error}</p>
      )}

      {result && (
        <div className="qr-result">

          <ShieldCheck size={40} />

          <h3>Đã đọc mã QR thành công</h3>

          <p>Nội dung mã QR:</p>

          <div className="result-domain">
            {result}
          </div>

          <button
            className="scan-btn"
            onClick={checkLink}
          >
            Kiểm tra độ an toàn
          </button>

          <button
            className="ai-btn"
            onClick={() => {
              scannerRef.current?.clear();
              setResult("");
              setError("");
            }}
          >
            Quét lại
          </button>

        </div>
      )}

      <p className="qr-note">
        Khánh Security không tự động truy cập
        đường dẫn sau khi quét.
      </p>

    </div>
  );
}
