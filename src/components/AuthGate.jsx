import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";

import {
  doc,
  setDoc
} from "firebase/firestore";

import { auth, db } from "../firebase";
import AuthPage from "./AuthPage";

export default function AuthGate({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setLoading(false);

        if (currentUser) {
          setDoc(
            doc(db, "users", currentUser.uid),
            {
              uid: currentUser.uid,
              email: currentUser.email
            },
            { merge: true }
          ).catch((error) => {
            console.error("Firestore:", error.code);
          });
        }
      }
    );

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="auth-container">
        <h3>Đang tải Khánh Security...</h3>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return children;
}