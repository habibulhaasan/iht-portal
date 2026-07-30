// File: functions/index.js
//
// Deploy with: firebase deploy --only functions
// (requires `firebase-tools` and a Blaze-plan Firebase project, since
// Firestore triggers need outbound network access)

const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { onDocumentWritten } = require("firebase-functions/v2/firestore");

initializeApp();
const db = getFirestore();

// Mirrors the mandatory-field checklist from app/onboarding/page.jsx.
// Keep these two in sync if you add/remove required fields later.
const REQUIRED_PERSONAL = ["name", "dob", "bloodGroup", "gender", "maritalStatus", "phone"];
const REQUIRED_ACADEMIC = ["department", "session", "passingYear"];

function isAddressFilled(a) {
  return !!a?.division && !!a?.zila && !!a?.upazila;
}

function isEmploymentFilled(e) {
  if (!e?.status) return false;
  if (e.status === "studying") return true;
  if (!e.jobType) return false;
  if (e.jobType === "non-govt") return !!e.officeName && !!e.officeLocation;
  if (e.jobType === "govt") return !!e.govtOrg && !!e.officeName;
  return false;
}

function isProfileComplete(data) {
  if (!data) return false;
  const personalOk = REQUIRED_PERSONAL.every((k) => !!data[k]);
  const academicOk = REQUIRED_ACADEMIC.every((k) => !!data[k]);
  const addressOk = isAddressFilled(data.permanentAddress) && isAddressFilled(data.currentAddress);
  const employmentOk = isEmploymentFilled(data.employment);
  return personalOk && academicOk && addressOk && employmentOk;
}

// Recalculates profileComplete server-side whenever a profile doc changes.
// The client (app/onboarding/page.jsx) no longer needs to — and per updated
// firestore.rules, no longer can — set this field itself.
exports.recalcProfileComplete = onDocumentWritten("profiles/{uid}", async (event) => {
  const uid = event.params.uid;
  const after = event.data?.after?.data();

  if (!after) return; // profile deleted — leave users/{uid}.profileComplete as-is

  const complete = isProfileComplete(after);

  const userRef = db.collection("users").doc(uid);
  const userSnap = await userRef.get();
  const current = userSnap.exists ? userSnap.data() : null;

  if (current?.profileComplete !== complete) {
    await userRef.set(
      { profileComplete: complete, updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
  }
});

// Recalculates lastDonationDate + donationCount whenever a donation is
// added/edited/removed, reading the full subcollection as the source of truth
// rather than trusting any client-sent aggregate.
exports.recalcDonationStats = onDocumentWritten(
  "profiles/{uid}/bloodDonations/{donationId}",
  async (event) => {
    const uid = event.params.uid;

    const donationsSnap = await db
      .collection("profiles")
      .doc(uid)
      .collection("bloodDonations")
      .orderBy("date", "desc")
      .get();

    const count = donationsSnap.size;
    const lastDonationDate = count > 0 ? donationsSnap.docs[0].data().date : null;

    await db.collection("profiles").doc(uid).set(
      { lastDonationDate, donationCount: count, updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
  }
);
