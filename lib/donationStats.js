import { collection, doc, updateDoc, serverTimestamp, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "./firebase";

// Client-side counterpart to functions/index.js's recalcDonationStats.
// Needed because that's a 2nd-gen Cloud Function (Blaze-plan only) and may
// not be deployed on this project — same situation recalcProfileComplete
// was in before it got moved into firestore.rules. Donation stats don't
// gate any feature the way profileComplete does, so trusting a
// client-computed value here is fine (a member already fully owns their
// own bloodDonations subcollection per firestore.rules, so this doesn't
// grant any new capability — just lets the summary catch up to data they
// already control).
export async function recalcDonationStats(uid) {
  const q = query(collection(db, "profiles", uid, "bloodDonations"), orderBy("date", "desc"));
  const snap = await getDocs(q);
  const count = snap.size;
  const lastDonationDate = count > 0 ? snap.docs[0].data().date : null;

  await updateDoc(doc(db, "profiles", uid), {
    donationCount: count,
    lastDonationDate,
    updatedAt: serverTimestamp(),
  });
}