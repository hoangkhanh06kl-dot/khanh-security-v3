import { useEffect, useState } from "react";

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot
} from "firebase/firestore";

import {
  ArrowLeft,
  Bell,
  ShieldAlert
} from "lucide-react";

import { auth, db } from "../firebase";

export function useGuardianAlerts() {
  const [groups, setGroups] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [read, setRead] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`ks-read-${auth.currentUser?.uid}`)) || {}; } catch { return {}; }
  });
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    const uid = auth.currentUser?.uid;

    if (!uid) {
      setLoading(false);
      return;
    }

    const listeners = new Map();

    const q = query(
      collection(db, "guardianLinks"),
      where("guardianId", "==", uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const active = snapshot.docs.filter(
          (item) => item.data().status === "active"
        );

        const activeIds = new Set(
          active.map((item) => item.id)
        );

        for (const [id, stop] of listeners) {
          if (!activeIds.has(id)) {
            stop();
            listeners.delete(id);

            setGroups((previous) => {
              const next = { ...previous };
              delete next[id];
              return next;
            });
          }
        }

        active.forEach((item) => {
          if (listeners.has(item.id)) return;

          const alertQuery = query(
            collection(
              db,
              "guardianLinks",
              item.id,
              "alerts"
            ),
            orderBy("createdAt", "desc"),
            limit(30)
          );

          let previousServerIds = null;
          const stop = onSnapshot(
            alertQuery,
            { includeMetadataChanges: true },

            (alertSnapshot) => {
              const data = alertSnapshot.docs.map(
                (alert) => ({
                  ...alert.data(),
                  id: `${item.id}/${alert.id}`
                })
              );

              if (!alertSnapshot.metadata.fromCache) {
                if (previousServerIds) {
                  const added = alertSnapshot.docs.filter(doc => !previousServerIds.has(doc.id));
                  if (added.length) {
                    const latest = added[0];
                    setNotice({ ...latest.data(), id: `${item.id}/${latest.id}` });
                    try { navigator.vibrate?.([150, 80, 150]); } catch { /* optional */ }
                  }
                }
                previousServerIds = new Set(alertSnapshot.docs.map(doc => doc.id));
              }

              setGroups((previous) => ({
                ...previous,
                [item.id]: data
              }));
            },

            () => {
              setError("Không thể tải cảnh báo.");
            }
          );

          listeners.set(item.id, stop);
        });

        setLoading(false);
      },

      () => {
        setError("Không thể tải liên kết.");
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();

      listeners.forEach((stop) => stop());
    };
  }, []);

  const alerts = Object.values(groups)
    .flat()
    .sort(
      (a, b) =>
        (b.createdAt?.seconds || 0) -
        (a.createdAt?.seconds || 0)
    );

  function markRead(ids) {
    setRead(previous => {
      const next = { ...previous };
      ids.forEach(id => { next[id] = true; });
      try { localStorage.setItem(`ks-read-${auth.currentUser?.uid}`, JSON.stringify(next)); } catch { /* optional */ }
      return next;
    });
  }
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 10000);
    return () => clearTimeout(timer);
  }, [notice]);
  return { alerts, loading, error, read, markRead, notice, dismiss: () => setNotice(null), unread: alerts.filter(item => !read[item.id]).length };
}

export default function AlertPage({ onBack, feed }) {
  const { alerts, loading, error, read, markRead, unread } = feed;

  const types = {
    message: "Tin nhắn",
    link: "Đường dẫn",
    phone: "Số điện thoại",
    audio: "Giọng nói", qr: "Mã QR"
  };

  return (
    <div className="scanner">

      <button className="back-btn" onClick={onBack}>
        <ArrowLeft size={20} />
        Quay lại
      </button>

      <div className="scanner-heading">

        <div className="feature-icon">
          <Bell size={28} />
        </div>

        <h2>Trung tâm cảnh báo</h2>

        <p>
          Cảnh báo bảo mật từ người thân
          đã liên kết với bạn.
        </p>

      </div>

      {unread > 0 && <button type="button" className="ai-btn" onClick={() => markRead(alerts.map(item => item.id))}>Đánh dấu tất cả đã đọc ({unread})</button>}

      {loading && <p>Đang tải cảnh báo...</p>}

      {error && (
        <p className="error-text">{error}</p>
      )}

      {!loading && !error && alerts.length === 0 && (
        <div className="history-empty">
          <Bell size={45} />
          <p>Chưa có cảnh báo bảo mật.</p>
        </div>
      )}

      {alerts.map((item) => (
        <div className={`alert-card ${read[item.id] ? '' : 'ks-alert-unread'}`} key={item.id}>

          <div className="alert-heading">
            <ShieldAlert size={26} />
            <h3>{item.title}</h3>
            {!read[item.id] && <span className="ks-new-label">Mới</span>}
          </div>

          {!read[item.id] && <button type="button" className="ai-btn" onClick={() => markRead([item.id])}>Đánh dấu đã đọc</button>}

          <p>
            Loại kiểm tra: {types[item.type]}
          </p>

          <p>
            Người thân của bạn vừa phát hiện
            dấu hiệu nguy cơ cao.
          </p>

          <div className="alert-score">
            {item.score}/100
          </div>

          <small>
            {item.createdAt
              ?.toDate()
              .toLocaleString("vi-VN")}
          </small>

          <div className="alert-advice">
            Hãy liên hệ người thân để hỗ trợ
            xác minh trước khi thực hiện giao dịch.
          </div>

        </div>
      ))}

    </div>
  );
}
