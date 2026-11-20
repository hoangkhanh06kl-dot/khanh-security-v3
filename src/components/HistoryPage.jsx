import { useEffect, useState } from "react";

import {
  collection,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc
} from "firebase/firestore";

import {
  ArrowLeft,
  History,
  MessageSquare,
  Link,
  Phone,
  AudioLines,
  Trash2
} from "lucide-react";

import { auth, db } from "../firebase";

export default function HistoryPage({ onBack }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const user = auth.currentUser;

    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "users", user.uid, "history"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,

      (snapshot) => {
        setItems(
          snapshot.docs.map((item) => ({
            ...item.data(),
            id: item.id
          }))
        );

        setLoading(false);
      },

      () => {
        setError("Không thể tải lịch sử.");
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  async function removeHistory(id) {
    const user = auth.currentUser;

    if (!user) return;

    if (!window.confirm("Bạn muốn xóa lượt kiểm tra này?")) {
      return;
    }

    try {
      await deleteDoc(
        doc(db, "users", user.uid, "history", id)
      );

    } catch {
      setError("Không thể xóa lịch sử.");
    }
  }

  const icons = {
    message: MessageSquare,
    link: Link,
    phone: Phone,
    audio: AudioLines
  };

  const highRisk = items.filter(
    (item) =>
      item.score >= 60 ||
      item.result === "Nguy cơ cao"
  ).length;

  return (
    <div className="scanner">

      <button className="back-btn" onClick={onBack}>
        <ArrowLeft size={20} />
        Quay lại
      </button>

      <div className="scanner-heading">

        <div className="feature-icon">
          <History size={28} />
        </div>

        <h2>Lịch sử kiểm tra</h2>

        <p>Quản lý hoạt động bảo mật của bạn.</p>

      </div>

      <div className="history-stats">

        <div>
          <span>Lượt kiểm tra</span>
          <h2>{items.length}</h2>
        </div>

        <div>
          <span>Nguy cơ cao</span>
          <h2 className="high-risk">{highRisk}</h2>
        </div>

      </div>

      {loading && <p>Đang tải lịch sử...</p>}

      {error && (
        <p className="error-text">{error}</p>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="history-empty">
          <History size={45} />
          <p>Chưa có lịch sử kiểm tra.</p>
        </div>
      )}

      <div className="history-list">

        {items.map((item) => {
          const Icon = icons[item.type] || History;

          return (
            <div
              className="history-item"
              key={item.id}
            >

              <div className="feature-icon">
                <Icon size={23} />
              </div>

              <div className="history-info">

                <h3>{item.title}</h3>

                <p>{item.result}</p>

                <small>
                  {item.createdAt
                    ?.toDate()
                    .toLocaleString("vi-VN") ||
                    "Đang đồng bộ"}
                </small>

              </div>

              <button
                className="delete-history"
                aria-label="Xóa lịch sử"
                onClick={() => removeHistory(item.id)}
              >
                <Trash2 size={19} />
              </button>

            </div>
          );
        })}

      </div>

    </div>
  );
}