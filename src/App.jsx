import { useEffect, useState } from "react";
import HistoryPage from "./components/HistoryPage";
import {
  ShieldCheck,
  MessageSquare,
  Link,
  ScanLine,
  Phone,
  AudioLines,
  Users,
  Bell,
  House,
  History,
  Settings,
  ChevronRight,
  LogOut,
  Info,
  ArrowLeft,
  ArrowRight,
  ShieldAlert,
  Activity
} from "lucide-react";

import MessageScanner from "./components/MessageScanner";
import LinkScanner from "./components/LinkScanner";
import QRScanner from "./components/QRScanner";
import PhoneScanner from "./components/PhoneScanner";
import DeepfakeScanner from "./components/DeepfakeScanner";

import { signOut, onAuthStateChanged, sendPasswordResetEmail } from "firebase/auth";
import { nativeAndroid, CallProtection } from "./services/callProtection";
import { collection, onSnapshot } from "firebase/firestore";
import { auth, db } from "./firebase";

import GuardianPage from "./components/GuardianPage";

import AlertPage, { useGuardianAlerts } from "./components/AlertPage";

import "./App.css";

function App() {
  const [page, setPage] = useState("home");
  const feed = useGuardianAlerts();
  const badge = feed.unread > 0 ? <span className="ks-alert-badge">{feed.unread > 99 ? '99+' : feed.unread}</span> : null;
  return <>
    <AppScreens page={page} setPage={setPage} feed={feed} badge={badge} />
    {feed.notice && <aside className="ks-alert-toast" role="alert">
      <ShieldAlert size={26} />
      <button type="button" className="ks-toast-content" onClick={() => { feed.dismiss(); setPage('alerts'); }}><strong>Cảnh báo nguy cơ cao</strong><span>Người thân vừa phát hiện nguy cơ · {feed.notice.score}/100</span><small>Nhấn để xem chi tiết</small></button>
      <button type="button" className="ks-toast-close" aria-label="Đóng thông báo" onClick={feed.dismiss}>×</button>
    </aside>}
  </>;
}

function AppScreens({ page, setPage, feed, badge }) {
  const [qrLink, setQrLink] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const [historyState, setHistoryState] = useState({ status: "loading", items: [], cached: false });
  const [day, setDay] = useState(() => new Date());
  const [callState, setCallState] = useState(null);
  const [settingsMessage, setSettingsMessage] = useState("");
  const [theme, setTheme] = useState(() => localStorage.getItem("ks-theme") === "light" ? "light" : "dark");
  useEffect(() => {
    document.documentElement.dataset.ksTheme = theme;
    localStorage.setItem("ks-theme", theme);
    return () => { delete document.documentElement.dataset.ksTheme; };
  }, [theme]);
  useEffect(() => {
    if (page !== "settings" || !nativeAndroid) return;
    const refresh = () => CallProtection.status().then(setCallState).catch(() => setCallState(null));
    refresh(); window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [page]);

  useEffect(() => {
    if (page !== "home") return;
    let stopHistory = () => {};
    const stopAuth = onAuthStateChanged(auth, (user) => {
      stopHistory();
      setHistoryState({ status: user ? "loading" : "signed-out", items: [], cached: false });
      if (!user) return;
      stopHistory = onSnapshot(collection(db, "users", user.uid, "history"), { includeMetadataChanges: true },
        (snapshot) => setHistoryState({ status: "ready", items: snapshot.docs.map((item) => item.data()), cached: snapshot.metadata.fromCache }),
        () => setHistoryState({ status: "error", items: [], cached: false })
      );
    });
    setDay(new Date());
    const timer = setInterval(() => setDay(new Date()), 60000);
    return () => { stopAuth(); stopHistory(); clearInterval(timer); };
  }, [page]);

  const dateKey = (date) => date.toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
  const today = dateKey(day);
  const highRisk = (item) => item.score >= 60 || item.result === "Nguy cơ cao";
  const stats = {
    total: historyState.items.length,
    high: historyState.items.filter(highRisk).length,
    low: historyState.items.filter((item) => !highRisk(item) && typeof item.score === "number" && Number.isFinite(item.score) && item.score >= 0 && item.score < 30).length,
    today: historyState.items.filter((item) => {
      const date = item.createdAt?.toDate?.();
      return date instanceof Date && !Number.isNaN(date.getTime()) && dateKey(date) === today;
    }).length
  };
  const hasStats = historyState.status === "ready";

  async function logout() {
    if (signingOut || !window.confirm("Bạn muốn đăng xuất?")) return;
    setSigningOut(true);
    try {
      if (nativeAndroid) await CallProtection.clear().catch(() => {});
      await signOut(auth);
      goHome();
    } catch {
      alert("Không thể đăng xuất. Vui lòng thử lại.");
    } finally {
      setSigningOut(false);
    }
  }

  const features = [
    {
      icon: MessageSquare,
      name: "Tin nhắn",
      desc: "Phát hiện nội dung lừa đảo",
      id: "message"
    },
    {
      icon: Link,
      name: "Đường dẫn",
      desc: "Kiểm tra website đáng ngờ",
      id: "link"
    },
    {
      icon: ScanLine,
      name: "Mã QR",
      desc: "Kiểm tra trước khi truy cập",
      id: "qr"
    },
    {
      icon: Phone,
      name: "Số điện thoại",
      desc: "Tra cứu số đáng ngờ",
      id: "phone"
    },
    {
      icon: AudioLines,
      name: "Giọng nói",
      desc: "Phân tích dấu hiệu đáng ngờ",
      id: "deepfake"
    },
    {
      icon: Users,
      name: "Người giám hộ",
      desc: "Bảo vệ người thân",
      id: "guardian"
    }
  ];

  // QUAY VỀ TRANG CHỦ

  function goHome() {
    setQrLink("");
    setPage("home");
  }

  // CHUYỂN TRANG

  function openFeature(id) {
  if ([
    "message",
    "link",
    "qr",
    "phone",
    "deepfake",
    "history",
    "guardian",
    "alerts",
    "settings"
  ].includes(id)) {
    setQrLink("");
    setPage(id);
  } else {
    alert("Chức năng đang được phát triển.");
  }
}

  // TRANG TIN NHẮN

  if (page === "message") {
    return (
      <div className="app">
        <MessageScanner onBack={goHome} />
      </div>
    );
  }

  // TRANG ĐƯỜNG DẪN

  if (page === "link") {
    return (
      <div className="app">
        <LinkScanner
          initialLink={qrLink}
          onBack={goHome}
        />
      </div>
    );
  }

  // TRANG QUÉT MÃ QR

  if (page === "qr") {
    return (
      <div className="app">
        <QRScanner
          onBack={goHome}
          onCheckLink={(url) => {
            setQrLink(url);
            setPage("link");
          }}
        />
      </div>
    );
  }

  // TRANG SỐ ĐIỆN THOẠI

  if (page === "phone") {
    return (
      <div className="app">
        <PhoneScanner onBack={goHome} />
      </div>
    );
  }
  if (page === "settings") {
    return (
      <div className="app ks-settings">
        <button type="button" className="back-btn" onClick={goHome}><ArrowLeft size={20} /> Quay lại</button>
        <h2>Cài đặt</h2>
        <p className="ks-muted">Quản lý tài khoản và ứng dụng.</p>
        <section className="ks-account">
          <div className="feature-icon"><Users size={24} /></div>
          <div><h3>Tài khoản</h3><p>{auth.currentUser?.email || "Người dùng"}</p></div>
        </section>
        <section className="ks-account">
          <div className="feature-icon"><Info size={24} /></div>
          <div><h3>Khánh Security 3.0</h3><p>Công cụ hỗ trợ nhận diện nguy cơ lừa đảo.</p></div>
        </section>
        <button className="ai-btn" onClick={async () => { try { if (!auth.currentUser?.email) throw new Error(); await sendPasswordResetEmail(auth, auth.currentUser.email); setSettingsMessage("Đã yêu cầu email đặt lại mật khẩu."); } catch { setSettingsMessage("Không thể gửi email đặt lại mật khẩu."); } }}>Đặt lại mật khẩu</button>
        <button className="ai-btn" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>Giao diện: {theme === "dark" ? "Tối — chuyển sang sáng" : "Sáng — chuyển sang tối"}</button>
        <section className="guardian-card ks-settings-card">
          <h3>Sàng lọc cuộc gọi Android</h3>
          <p>Nhắc nhở khi số có báo cáo cộng đồng đã được bạn đánh dấu trên thiết bị gọi đến. Không tự động chặn cuộc gọi.</p>
          {nativeAndroid ? <><p>{callState?.enabled ? "Đã được cấp vai trò sàng lọc" : "Chưa bật vai trò sàng lọc"}</p><button className="scan-btn" onClick={async () => { try { setCallState(await CallProtection.enable()); } catch(e) { setSettingsMessage(e.message); } }}>Bật sàng lọc cuộc gọi</button><button className="ai-btn" onClick={async () => { try { await CallProtection.notifications(); setSettingsMessage("Cho phép thông báo trong hộp thoại Android, nếu được hỏi."); } catch { setSettingsMessage("Không thể yêu cầu quyền thông báo."); } }}>Cho phép thông báo</button><button className="ai-btn" onClick={async () => { try { await CallProtection.clear(); setSettingsMessage("Đã xóa danh sách đánh dấu trên thiết bị."); } catch { setSettingsMessage("Không thể xóa danh sách."); } }}>Xóa số đã đánh dấu</button></> : <p>Chỉ khả dụng trong ứng dụng Android từ Android 10.</p>}
        </section>
        {settingsMessage && <p role="status" className="ks-muted">{settingsMessage}</p>}
        <button type="button" className="ks-logout" onClick={logout} disabled={signingOut}><LogOut size={20} /> {signingOut ? "Đang đăng xuất…" : "Đăng xuất"}</button>
      </div>
    );
  }

if (page === "deepfake") {
  return (
    <div className="app">
      <DeepfakeScanner onBack={goHome} />
    </div>
  );
}

if (page === "history") {
  return (
    <div className="app">
      <HistoryPage onBack={goHome} />
    </div>
  );
}

if (page === "alerts") {
  return (
    <div className="app">
      <AlertPage onBack={goHome} feed={feed} />
    </div>
  );
}
  // TRANG CHỦ

  if (page === "guardian") {
  return (
    <div className="app">
      <GuardianPage onBack={goHome} />
    </div>
  );
}

  return (
    <div className="app ks-home">

      <header className="header">

        <div className="brand">

          <div className="brand-icon">
            <ShieldCheck size={30} />
          </div>

          <div>
            <h1>Khánh Security</h1>
            <p>TRUNG TÂM AN NINH SỐ</p>
          </div>

        </div>

        <button
  type="button"
  className="icon-btn ks-bell"
  aria-label={`Xem cảnh báo (${feed.unread} chưa đọc)`}
  onClick={() => openFeature("alerts")}
>
  <Bell size={23} />
  {badge}
</button>

      </header>

      <section className="protection ks-command">

        <div className="ks-radar" aria-hidden="true">
          <div className="ks-radar-grid" />
          <div className="ks-radar-ring ks-ring-outer" />
          <div className="ks-radar-ring ks-ring-middle" />
          <div className="ks-radar-ring ks-ring-inner" />
          <div className="ks-radar-sweep" />
          <div className="ks-radar-axis" />
          <div className="ks-radar-core"><ShieldCheck size={56} strokeWidth={1.55} /></div>
          <span className="ks-radar-point ks-point-one" /><span className="ks-radar-point ks-point-two" />
        </div>

        <div className="protection-info">

          <span className="eyebrow">
            KHÁNH SECURITY / 02
          </span>

          <h2>Kiểm tra trước.<br />An tâm hơn.</h2>

          <p>
            Chủ động nhận diện dấu hiệu lừa đảo trước khi hành động.
          </p>

          <div className="status">
            <span className="status-dot"></span>
            Sẵn sàng kiểm tra
          </div>
          <button type="button" className="ks-primary" onClick={() => openFeature("message")}><ScanLine size={19} /> Kiểm tra ngay <ArrowRight size={17} /></button>
        </div>

      </section>

      <div className="ks-overview-heading"><span>THỐNG KÊ BẢO MẬT</span><button type="button" className="ks-text-link" onClick={() => openFeature("history")}>Xem lịch sử <ChevronRight size={14}/></button></div>
      <div className="ks-stats-grid" aria-label="Thống kê lịch sử kiểm tra">
        {[
          { label: "Lượt kiểm tra", value: stats.total, Icon: History, tone: "blue" },
          { label: "Nguy cơ cao", value: stats.high, Icon: ShieldAlert, tone: "red" },
          { label: "Điểm dưới 30", value: stats.low, Icon: ShieldCheck, tone: "green" },
          { label: "Hôm nay", value: stats.today, Icon: Activity, tone: "amber" }
        ].map(({ label, value, Icon, tone }) => (
          <button type="button" key={label} className={`ks-metric ks-stat ks-stat-${tone}`} onClick={() => openFeature("history")}><Icon size={21}/><strong>{hasStats ? value.toLocaleString("vi-VN") : "—"}</strong><span>{label}</span></button>
        ))}
      </div>
      <p className="ks-stats-note" role="status">{historyState.status === "loading" ? "Đang tải lịch sử…" : historyState.status === "error" ? "Không thể tải thống kê. Kiểm tra kết nối hoặc quyền truy cập." : historyState.status === "signed-out" ? "Đăng nhập để xem thống kê." : historyState.cached ? "Dữ liệu đã lưu trên thiết bị; đang chờ đồng bộ." : "Dữ liệu lịch sử của bạn, cập nhật tự động."}</p>
      <div className="ks-risk-summary">
        <div><span>Tỷ lệ lượt kiểm tra nguy cơ cao</span><strong>{hasStats && stats.total ? `${Math.round(stats.high / stats.total * 100)}%` : "—"}</strong></div>
        <div className="ks-risk-track" aria-hidden="true"><span style={{ width: `${hasStats && stats.total ? stats.high / stats.total * 100 : 0}%` }} /></div>
        <small>Điểm thấp không đảm bảo nội dung an toàn.</small>
      </div>

      <div className="ks-tools-heading"><h2 className="section-title">Công cụ bảo mật</h2><span>06 công cụ</span></div>

      <div className="features">

        {features.map((item) => (
          <button
            type="button"
            className={`feature ks-feature-${item.id}`}
            key={item.id}
            onClick={() => openFeature(item.id)}
          >

            <div className="feature-icon">
              <item.icon
                size={24}
                strokeWidth={1.8}
              />
            </div>

            <div className="feature-text">
              <h3>{item.name}</h3>
              <p>{item.desc}</p>
            </div>

            <ChevronRight size={18} />

          </button>
        ))}

      </div>

      <button type="button" className="ks-family" onClick={() => openFeature("guardian")}><span className="ks-family-icon"><Users size={24}/></span><span><strong>An toàn cùng gia đình</strong><small>Kết nối người giám hộ của bạn</small></span><ArrowRight size={19}/></button>

      <aside className="ks-tip">
        <Info size={20} />
        <div><strong>Ghi nhớ an toàn</strong><p>Không chia sẻ mã OTP, mật khẩu hoặc chuyển tiền khi chưa xác minh người nhận.</p></div>
      </aside>

      <nav className="bottom-nav">

        <button
          className="active" aria-current="page"
          onClick={goHome}
        >
          <House size={23} />
          <span>Trang chủ</span>
        </button>

        <button onClick={() => openFeature("history")}>
          <History size={23} />
          <span>Lịch sử</span>
        </button>

        <button className="ks-bell" onClick={() => openFeature("alerts")} aria-label={`Cảnh báo (${feed.unread} chưa đọc)`}>
          <Bell size={23} />
          {badge}
          <span>Cảnh báo</span>
        </button>

        <button onClick={() => openFeature("settings")}>
          <Settings size={23} />
          <span>Cài đặt</span>
        </button>

      </nav>

    </div>
  );
}

export default App;
