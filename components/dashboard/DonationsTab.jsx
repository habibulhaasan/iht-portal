"use client";

import { useEffect, useState } from "react";
import {
  collection, addDoc, deleteDoc, doc, onSnapshot,
  query, orderBy, serverTimestamp,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { getLastDonation, getCountdown, sortDonations } from "../../lib/donationUtils";

export default function DonationsTab() {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [newDate, setNewDate] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "profiles", user.uid, "bloodDonations"), orderBy("date", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setDonations(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          date: d.data().date?.toDate?.() ?? new Date(d.data().date),
        }))
      );
    });
    return () => unsub();
  }, [user]);

  // lastDonationDate/donationCount on the parent profile doc are recomputed
  // authoritatively by the recalcDonationStats Cloud Function whenever this
  // subcollection changes — we don't write those fields from the client.
  const addDonation = async (e) => {
    e.preventDefault();
    if (!newDate) return;
    setBusy(true);
    await addDoc(collection(db, "profiles", user.uid, "bloodDonations"), {
      date: new Date(newDate),
      note: note || null,
      createdAt: serverTimestamp(),
    });
    setNewDate("");
    setNote("");
    setBusy(false);
  };

  const removeDonation = async (id) => {
    await deleteDoc(doc(db, "profiles", user.uid, "bloodDonations", id));
  };

  const last = getLastDonation(donations);
  const countdown = getCountdown(last?.date);

  return (
    <div>
      <h2>Blood donation log</h2>

      <div className="donation-summary">
        <div className="donation-stat">
          <span className="donation-stat-value">{donations.length}</span>
          <span className="donation-stat-label">Total donations</span>
        </div>
        <div className="donation-stat">
          <span className="donation-stat-value">{last ? last.date.toLocaleDateString() : "—"}</span>
          <span className="donation-stat-label">Last donation</span>
        </div>
        <div className="donation-stat">
          <span className="donation-stat-value">
            {countdown.eligible ? "Eligible now" : `${countdown.daysLeft} days`}
          </span>
          <span className="donation-stat-label">
            {countdown.eligible ? "You can donate again" : "Until next eligible date"}
          </span>
        </div>
      </div>

      <form onSubmit={addDonation} className="donation-form">
        <div className="field-row">
          <div className="field">
            <label>Donation date</label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              required
            />
          </div>
          <div className="field">
            <label>Note (optional)</label>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Red Crescent camp" />
          </div>
        </div>
        <button className="btn" type="submit" disabled={busy} style={{ width: "auto" }}>
          {busy ? "Adding…" : "Add donation"}
        </button>
      </form>

      <ul className="donation-list">
        {sortDonations(donations).map((d) => (
          <li key={d.id}>
            <span>{d.date.toLocaleDateString()}</span>
            {d.note && <span className="donation-note">{d.note}</span>}
            <button onClick={() => removeDonation(d.id)} className="link-danger">Remove</button>
          </li>
        ))}
        {donations.length === 0 && <li className="helper-text">No donations logged yet.</li>}
      </ul>
    </div>
  );
}
