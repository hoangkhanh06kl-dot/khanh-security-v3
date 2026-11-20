import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from "firebase/auth";

import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff
} from "lucide-react";

import { auth } from "../firebase";

export default function AuthPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function getErrorMessage(code) {
    const errors = {
      "auth/invalid-email": "Email không hợp lệ.",
      "auth/email-already-in-use": "Email đã được sử dụng.",
      "auth/weak-password": "Mật khẩu chưa đủ mạnh.",
      "auth/invalid-credential": "Email hoặc mật khẩu không đúng.",
      "auth/too-many-requests": "Vui lòng thử lại sau.",
      "auth/network-request-failed": "Không có kết nối mạng."
    };

    return errors[code] || "Đã xảy ra lỗi. Vui lòng thử lại.";
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
      } else {
        await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
      }

    } catch (error) {
      setError(getErrorMessage(error.code));

    } finally {
      setLoading(false);
    }
  }

  async function resetPassword() {
    if (!email.trim()) {
      setError("Vui lòng nhập địa chỉ email.");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await sendPasswordResetEmail(
        auth,
        email.trim()
      );

      setSuccess(
        "Nếu tài khoản tồn tại, email đặt lại mật khẩu sẽ được gửi."
      );

    } catch (error) {
      setError(getErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">

      <div className="auth-brand">

        <div className="auth-logo">
          <ShieldCheck size={48} strokeWidth={1.5} />
        </div>

        <h1>Khánh Security</h1>
        <p>SECURITY & PRIVACY</p>

      </div>

      <div className="auth-card">

        <h2>
          {isRegister
            ? "Tạo tài khoản"
            : "Chào mừng trở lại"}
        </h2>

        <p>
          {isRegister
            ? "Bắt đầu bảo vệ bạn và người thân."
            : "Đăng nhập vào tài khoản bảo mật."}
        </p>

        <form onSubmit={handleSubmit}>

          <label>Email</label>

          <div className="auth-input">
            <Mail size={20} />

            <input
              type="email"
              placeholder="Nhập địa chỉ email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <label>Mật khẩu</label>

          <div className="auth-input">

            <Lock size={20} />

            <input
              type={showPassword ? "text" : "password"}
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />

            <button
              type="button"
              className="password-toggle"
              aria-label="Ẩn hoặc hiện mật khẩu"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </button>

          </div>

          {!isRegister && (
            <button
              type="button"
              className="forgot-password"
              onClick={resetPassword}
              disabled={loading}
            >
              Quên mật khẩu?
            </button>
          )}

          {error && (
            <div className="auth-error">{error}</div>
          )}

          {success && (
            <div className="auth-success">{success}</div>
          )}

          <button
            className="scan-btn"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Đang xử lý..."
              : isRegister
              ? "Tạo tài khoản"
              : "Đăng nhập"}
          </button>

        </form>

        <div className="auth-switch">

          {isRegister
            ? "Đã có tài khoản?"
            : "Chưa có tài khoản?"}

          <button
            disabled={loading}
            onClick={() => {
              setIsRegister(!isRegister);
              setError("");
              setSuccess("");
            }}
          >
            {isRegister ? "Đăng nhập" : "Đăng ký ngay"}
          </button>

        </div>

      </div>

      <footer className="auth-footer">
        Khánh Security © 2026
      </footer>

    </div>
  );
}