import {
  collection,
  addDoc,
  serverTimestamp
} from "firebase/firestore";

import { auth, db } from "../firebase";
import { sendGuardianAlert } from "./alertService";

export async function saveHistory(
  type,
  title,
  result,
  score = null
) {
  const user = auth.currentUser;

  if (!user) return;

  try {
    await addDoc(
      collection(db, "users", user.uid, "history"),
      {
        type,
        title,
        result,
        score,
        createdAt: serverTimestamp()
      }
    );

  } catch (error) {
    console.error("Lỗi lưu lịch sử:", error.code);
  }

  const highRisk =
    score >= 60 || result === "Nguy cơ cao";

  if (highRisk && auth.currentUser?.uid === user.uid) {
    try {
      await sendGuardianAlert(type, score ?? 60);

    } catch (error) {
      console.error("Lỗi gửi cảnh báo:", error.code);
    }
  }
}