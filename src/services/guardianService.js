import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  runTransaction
} from "firebase/firestore";

import { auth, db } from "../firebase";

export async function createInvite() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Vui lòng đăng nhập.");
  }

  const code = crypto.randomUUID();

  await setDoc(
    doc(db, "guardianLinks", code),
    {
      ownerId: user.uid,
      guardianId: "",
      status: "waiting",
      createdAt: serverTimestamp()
    }
  );

  return code;
}

export async function joinGuardian(code) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Vui lòng đăng nhập.");
  }

  const ref = doc(
    db,
    "guardianLinks",
    code.trim()
  );

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref);

    if (!snapshot.exists()) {
      throw new Error("Mã liên kết không tồn tại.");
    }

    const data = snapshot.data();

    if (data.ownerId === user.uid) {
      throw new Error("Không thể liên kết với chính mình.");
    }

    if (data.status !== "waiting") {
      throw new Error("Mã liên kết đã được sử dụng.");
    }

    transaction.update(ref, {
      guardianId: user.uid,
      status: "pending"
    });
  });
}

export async function approveGuardian(code) {
  await updateDoc(
    doc(db, "guardianLinks", code),
    {
      status: "active"
    }
  );
}

export async function removeGuardian(code) {
  await deleteDoc(
    doc(db, "guardianLinks", code)
  );
}