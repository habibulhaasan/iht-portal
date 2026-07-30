import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export const LOCKED_FIELDS = [
  "name", "dob", "bloodGroup", "gender", "maritalStatus",
  "department", "session", "passingYear", "finalYearRoll", "permanentAddress",
];

export async function logProfileEdits(targetUid, editedByUid, oldData, newData) {
  const writes = [];
  for (const fieldName of LOCKED_FIELDS) {
    const oldVal = oldData?.[fieldName] ?? null;
    const newVal = newData?.[fieldName] ?? null;
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      writes.push(
        addDoc(collection(db, "auditLogs"), {
          targetUid,
          editedBy: editedByUid,
          field: fieldName,
          oldValue: oldVal,
          newValue: newVal,
          timestamp: serverTimestamp(),
        })
      );
    }
  }
  await Promise.all(writes);
}
