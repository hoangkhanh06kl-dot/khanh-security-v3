import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  query,
  where,
  limit,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

import {
  ArrowLeft,
  ShieldAlert,
  Users,
  Search,
  Plus,
  Phone,
  Link,
  MessageSquare,
  ShieldCheck,
  FileText,
  X,
} from "lucide-react";

import { auth, db } from "../firebase";
import "./CommunityPage.css";

const categories = [
  { id: "phone", label: "Số điện thoại", icon: Phone },
  { id: "link", label: "Website", icon: Link },
  { id: "message", label: "Tin nhắn", icon: MessageSquare },
  { id: "other", label: "Khác", icon: ShieldAlert },
];

const initialForm = {
  type: "phone",
  target: "",
  title: "",
  description: "",
  level: "high",
};

export default function CommunityPage({ onBack }) {
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const q = query(
      collection(db, "communityReports"),
      where("status", "==", "approved"),
      limit(100)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));

        list.sort(
          (a, b) =>
            (b.createdAt?.seconds || 0) -
            (a.createdAt?.seconds || 0)
        );

        setReports(list);
        setLoading(false);
        setError("");
      },
      () => {
        setLoading(false);
        setError("Không thể tải dữ liệu cộng đồng.");
      }
    );
  }, []);

  const highRisk = reports.filter(
    (item) => item.level === "high"
  ).length;

  const filtered = reports.filter((item) => {
    const keyword = search.toLowerCase().trim();

    const content = [
      item.title,
      item.target,
      item.description,
    ]
      .join(" ")
      .toLowerCase();

    return (
      (filter === "all" || item.type === filter) &&
      content.includes(keyword)
    );
  });

  function updateForm(key, value) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  async function submitReport(event) {
    event.preventDefault();

    if (sending) return;

    const user = auth.currentUser;

    if (!user) {
      setNotice("Bạn cần đăng nhập.");
      return;
    }

    if (
      !form.target.trim() ||
      !form.title.trim() ||
      !form.description.trim()
    ) {
      setNotice("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    setSending(true);
    setNotice("");

    try {
      await addDoc(collection(db, "communityReports"), {
        ownerId: user.uid,
        type: form.type,
        target: form.target.trim(),
        title: form.title.trim(),
        description: form.description.trim(),
        level: form.level,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      setForm(initialForm);
      setShowForm(false);

      setNotice(
        "Gửi báo cáo thành công! Báo cáo đang chờ kiểm duyệt."
      );
    } catch (err) {
      console.error(err.code);
      setNotice("Không thể gửi báo cáo. Hãy kiểm tra Firebase Rules.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="community-page">
      <button className="cm-back" onClick={onBack}>
        <ArrowLeft size={20} />
        Quay lại
      </button>

      <section className="cm-hero">
        <div className="cm-hero-icon">
          <Users size={32} />
        </div>

        <small>KHÁNH SECURITY COMMUNITY</small>

        <h1>Cùng nhau chống lừa đảo.</h1>

        <p>
          Chia sẻ cảnh báo, nâng cao nhận thức và bảo vệ
          những người xung quanh bạn.
        </p>

        <button
          className="cm-primary"
          onClick={() => {
            setNotice("");
            setShowForm(true);
          }}
        >
          <Plus size={20} />
          Gửi báo cáo mới
        </button>
      </section>

      <section className="cm-stats">
        <div className="cm-stat">
          <FileText size={23} />
          <strong>{loading || error ? "—" : reports.length}</strong>
          <span>Báo cáo công khai</span>
        </div>

        <div className="cm-stat cm-danger">
          <ShieldAlert size={23} />
          <strong>{loading || error ? "—" : highRisk}</strong>
          <span>Nguy cơ cao</span>
        </div>

        <div className="cm-stat cm-safe">
          <ShieldCheck size={23} />
          <strong>{loading || error ? "—" : reports.length}</strong>
          <span>Đã kiểm duyệt</span>
        </div>
      </section>

      {notice && (
        <div className="cm-notice" role="status">
          {notice}
        </div>
      )}

      <div className="cm-search">
        <Search size={21} />

        <input
          placeholder="Tìm số điện thoại, website..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="cm-filters">
        <button
          className={filter === "all" ? "active" : ""}
          onClick={() => setFilter("all")}
        >
          Tất cả
        </button>

        {categories.map((item) => (
          <button
            key={item.id}
            className={filter === item.id ? "active" : ""}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="cm-heading">
        <h2>Cảnh báo cộng đồng</h2>
        <span>{filtered.length} kết quả</span>
      </div>

      <p className="cm-help">
        Hiển thị tối đa 100 báo cáo đã duyệt.
        Báo cáo không phải kết luận pháp lý.
      </p>

      {error && <div className="cm-notice">{error}</div>}

      {loading && <div className="cm-empty">Đang tải dữ liệu...</div>}

      {!loading && !error && filtered.length === 0 && (
        <div className="cm-empty">
          <ShieldCheck size={46} />
          <h3>Chưa có cảnh báo phù hợp</h3>
          <p>Báo cáo đã được duyệt sẽ xuất hiện tại đây.</p>
        </div>
      )}

      {filtered.map((item) => {
        const category = categories.find(
          (category) => category.id === item.type
        );

        const Icon = category?.icon || ShieldAlert;

        return (
          <article className="cm-report" key={item.id}>
            <div className="cm-report-top">
              <div className="cm-report-icon">
                <Icon size={23} />
              </div>

              <div className="cm-report-title">
                <h3>{item.title}</h3>
                <small>{category?.label}</small>
              </div>

              <span className={`cm-badge ${item.level}`}>
                {item.level === "high"
                  ? "Nguy cơ cao"
                  : "Cảnh giác"}
              </span>
            </div>

            <div className="cm-target">{item.target}</div>

            <p>{item.description}</p>

            <div className="cm-report-footer">
              <span>✓ Đã kiểm duyệt</span>

              <small>
                {item.createdAt
                  ?.toDate()
                  .toLocaleDateString("vi-VN")}
              </small>
            </div>
          </article>
        );
      })}

      {showForm && (
        <div className="cm-overlay">
          <form className="cm-modal" onSubmit={submitReport}>
            <div className="cm-heading">
              <h2>Gửi báo cáo</h2>

              <button
                type="button"
                className="cm-close"
                onClick={() => setShowForm(false)}
                disabled={sending}
              >
                <X size={23} />
              </button>
            </div>

            <label>Loại báo cáo</label>

            <select
              value={form.type}
              onChange={(e) => updateForm("type", e.target.value)}
            >
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>

            <label>Đối tượng đáng ngờ</label>

            <input
              required
              maxLength={250}
              placeholder="Số điện thoại hoặc tên miền..."
              value={form.target}
              onChange={(e) => updateForm("target", e.target.value)}
            />

            <label>Tiêu đề</label>

            <input
              required
              maxLength={100}
              placeholder="Ví dụ: Giả danh ngân hàng"
              value={form.title}
              onChange={(e) => updateForm("title", e.target.value)}
            />

            <label>Mô tả sự việc</label>

            <textarea
              required
              maxLength={1000}
              rows={5}
              placeholder="Mô tả dấu hiệu đáng ngờ..."
              value={form.description}
              onChange={(e) =>
                updateForm("description", e.target.value)
              }
            />

            <label>Mức độ nghi ngờ</label>

            <select
              value={form.level}
              onChange={(e) => updateForm("level", e.target.value)}
            >
              <option value="medium">Cảnh giác</option>
              <option value="high">Nguy cơ cao</option>
            </select>

            <p className="cm-help">
              Không cung cấp OTP, mật khẩu, CCCD hoặc
              thông tin cá nhân của nạn nhân.
              Báo cáo phải được xác minh trước khi công khai.
            </p>

            {notice && (
              <div className="cm-notice">{notice}</div>
            )}

            <button
              className="cm-primary"
              disabled={sending}
            >
              {sending ? "Đang gửi..." : "Gửi báo cáo"}
            </button>
          </form>
        </div>
      )}
    </main>
  );
}