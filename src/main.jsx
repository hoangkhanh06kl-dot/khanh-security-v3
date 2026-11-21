import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { Users, ChevronRight } from "lucide-react";

import "./index.css";

import App from "./App.jsx";
import AuthGate from "./components/AuthGate";
import FamilyProtection from "./components/FamilyProtection";
import CommunityPage from "./components/CommunityPage";

function SecurityApplication() {
  const [community, setCommunity] = useState(false);

  return (
    <>
      <FamilyProtection />

      {community ? (
        <CommunityPage
          onBack={() => setCommunity(false)}
        />
      ) : (
        <>
          <button
            className="cm-entry"
            onClick={() => setCommunity(true)}
          >
            <Users size={25} />

            <span>
              <strong>Trung tâm cộng đồng</strong>
              <small>
                Cảnh báo và báo cáo lừa đảo
              </small>
            </span>

            <ChevronRight size={20} />
          </button>

          <App />
        </>
      )}
    </>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthGate>
      <SecurityApplication />
    </AuthGate>
  </StrictMode>
);