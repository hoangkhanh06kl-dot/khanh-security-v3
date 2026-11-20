import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp
} from "firebase/firestore";

import { auth, db } from "../firebase";

export async function lookupPhone(phone) {
  const snapshot = await getDocs(
    collection(db, "phoneReports", phone, "reports")
  );

  const reasons = Object.create(null);

  snapshot.docs.forEach((item) => {
    const reason = item.data().reason;

    reasons[reason] = (reasons[reason] || 0) + 1;
  });

  return {
    phone,
    count: snapshot.size,
    reasons
  };
}

export async function submitPhoneReport(phone, reason) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Vui lòng đăng nhập.");
  }

  const ref = doc(
    db,
    "phoneReports",
    phone,
    "reports",
    user.uid
  );

  const existing = await getDoc(ref);

  if (existing.exists()) {
    throw new Error("Bạn đã báo cáo số điện thoại này.");
  }

  await setDoc(ref, {
    reason,
    createdAt: serverTimestamp()
  });
}

export async function deletePhoneReport(phone) {
  const user = auth.currentUser;

  if (!user) return;

  await deleteDoc(
    doc(
      db,
      "phoneReports",
      phone,
      "reports",
      user.uid
    )
  );
}
