import { useEffect, useState } from "react";

import {
  collection,
  query,
  where,
  onSnapshot
} from "firebase/firestore";

import {
  ArrowLeft,
  Users,
  Copy,
  ShieldCheck,
  UserPlus,
  Unlink
} from "lucide-react";

import { auth, db } from "../firebase";

import {
  createInvite,
  joinGuardian,
  approveGuardian,
  removeGuardian
} from "../services/guardianService";

export default function GuardianPage({ onBack }) {
  const [code, setCode] = useState("");
  const [createdCode, setCreatedCode] = useState("");
  const [owned, setOwned] = useState([]);
  const [joined, setJoined] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) return;

    const ref = collection(db, "guardianLinks");

    const unsubOwner = onSnapshot(
      query(ref, where("ownerId", "==", uid)),
      (snapshot) => {
        setOwned(
          snapshot.docs.map((item) => ({
            ...item.data(),
            id: item.id
          }))
        );
      },
      () => setError("Không thể tải liên kết.")
    );

    const unsubGuardian = onSnapshot(
      query(ref, where("guardianId", "==", uid)),
      (snapshot) => {
        setJoined(
          snapshot.docs.map((item) => ({
            ...item.data(),
            id: item.id
          }))
        );
      },
      () => setError("Không thể tải liên kết.")
    );

    return () => {
      unsubOwner();
      unsubGuardian();
    };
  }, [uid]);

  async function execute(action) {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await action();

    } catch (error) {
      setError(error.message);

    } finally {
      setLoading(false);
    }
  }

  const statuses = {
    waiting: "Chờ người thân nhập mã",
    pending: "Chờ xác nhận",
    active: "Đã liên kết"
  };

  function renderLink(item, isOwner) {
    return (
      <div className="guardian-item" key={item.id}>

        <div className="guardian-item-header">

          <ShieldCheck size={25} />

          <div>
            <h3>
              {isOwner
                ? "Người giám hộ của tôi"
                : "Người tôi bảo vệ"}
            </h3>

            <p>{statuses[item.status]}</p>
          </div>

        </div>

        {item.status === "waiting" && isOwner && (
          <div className="guardian-code">
            {item.id}
          </div>
        )}

        {item.status !== "waiting" && (
          <p>
            ID người thân: {
              isOwner
                ? item.guardianId
                : item.ownerId
            }
          </p>
        )}

        {isOwner && item.status === "pending" && (
          <button
            className="scan-btn"
            disabled={loading}
            onClick={() => {
              if (!window.confirm(
                "Bạn đồng ý cho tài khoản này làm người giám hộ?"
              )) return;

              execute(async () => {
                await approveGuardian(item.id);
                setSuccess("Đã xác nhận liên kết.");
              });
            }}
          >
            Xác nhận người giám hộ
          </button>
        )}

        <button
          className="report-btn"
          disabled={loading}
          onClick={() => {
            if (!window.confirm(
              "Bạn muốn hủy liên kết này?"
            )) return;

            execute(async () => {
              await removeGuardian(item.id);

              if (createdCode === item.id) {
                setCreatedCode("");
              }

              setSuccess("Đã hủy liên kết.");
            });
          }}
        >
          <Unlink size={18} />
          Hủy liên kết
        </button>

      </div>
    );
  }

  return (
    <div className="scanner">

      <button className="back-btn" onClick={onBack}>
        <ArrowLeft size={20} />
        Quay lại
      </button>

      <div className="scanner-heading">

        <div className="feature-icon">
          <Users size={28} />
        </div>

        <h2>Người giám hộ</h2>

        <p>
          Kết nối với người thân để chia sẻ
          cảnh báo bảo mật.
        </p>
        <p className="qr-note">Chỉ chia sẻ loại kiểm tra và điểm nguy cơ cao sau khi hai bên xác nhận. Không theo dõi giao dịch ngân hàng hoặc nội dung riêng tư.</p>

      </div>

      <div className="guardian-card">

        <h3>Thêm người giám hộ</h3>

        <p>
          Tạo mã liên kết và gửi riêng cho
          người thân đáng tin cậy.
        </p>

        <button
          className="scan-btn"
          disabled={loading}
          onClick={() => execute(async () => {
            const newCode = await createInvite();
            setCreatedCode(newCode);
          })}
        >
          Tạo mã liên kết
        </button>

        {createdCode && (
          <>
            <div className="guardian-code">
              {createdCode}
            </div>

            <button
              className="ai-btn qr-action"
              onClick={() => execute(async () => {
                await navigator.clipboard.writeText(
                  createdCode
                );
                setSuccess("Đã sao chép mã.");
              })}
            >
              <Copy size={18} />
              Sao chép mã
            </button>
          </>
        )}

      </div>

      <div className="guardian-card">

        <h3>Trở thành người giám hộ</h3>

        <p>
          Nhập mã liên kết do người thân cung cấp.
        </p>

        <input
          className="security-input"
          placeholder="Nhập mã liên kết..."
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />

        <button
          className="scan-btn qr-action"
          disabled={loading || !code.trim()}
          onClick={() => execute(async () => {
            await joinGuardian(code);
            setCode("");
            setSuccess(
              "Đã gửi yêu cầu. Vui lòng chờ xác nhận."
            );
          })}
        >
          <UserPlus size={20} />
          Gửi yêu cầu liên kết
        </button>

      </div>

      {error && (
        <p className="auth-error">{error}</p>
      )}

      {success && (
        <p className="auth-success">{success}</p>
      )}

      <h3>Liên kết của tôi</h3>

      {owned.length === 0 && joined.length === 0 && (
        <p>Chưa có liên kết gia đình.</p>
      )}

      {owned.map((item) => renderLink(item, true))}
      {joined.map((item) => renderLink(item, false))}

    </div>
  );
}
