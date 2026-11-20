import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp
} from "firebase/firestore";

import { auth, db } from "../firebase";

export async function sendGuardianAlert(type, score) {
  const user = auth.currentUser;

  if (!user || !Number.isInteger(score) || score < 60) {
    return;
  }

  const q = query(
    collection(db, "guardianLinks"),
    where("ownerId", "==", user.uid)
  );

  const snapshot = await getDocs(q);

  const activeLinks = snapshot.docs.filter(
    (item) => item.data().status === "active"
  );

  await Promise.all(
    activeLinks.map((item) =>
      addDoc(
        collection(
          db,
          "guardianLinks",
          item.id,
          "alerts"
        ),
        {
          type,
          title: "Phát hiện nguy cơ cao",
          score,
          createdAt: serverTimestamp()
        }
      )
    )
  );
}