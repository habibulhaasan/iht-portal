"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import ProgressBar from "../../components/ProgressBar";
import PersonalStep from "../../components/steps/PersonalStep";
import AddressStep from "../../components/steps/AddressStep";
import AcademicStep from "../../components/steps/AcademicStep";
import EmploymentStep from "../../components/steps/EmploymentStep";
import PhotoStep from "../../components/steps/PhotoStep";

const STEPS = [
  { key: "personal", label: "Personal", Component: PersonalStep },
  { key: "address", label: "Address", Component: AddressStep },
  { key: "academic", label: "Academic", Component: AcademicStep },
  { key: "employment", label: "Current status", Component: EmploymentStep },
  { key: "photo", label: "Photo", Component: PhotoStep },
];

function isAddressFilled(a) {
  return !!a?.divisionId && !!a?.districtId && !!a?.upazilaId;
}

function isEmploymentFilled(e) {
  if (!e?.status) return false;
  if (e.status === "studying") return true;
  if (!e.jobType) return false;
  if (e.jobType === "non-govt") return !!e.officeName && !!e.officeLocation;
  if (e.jobType === "govt") {
    if (!e.govtOrg) return false;
    return !!e.officeName;
  }
  return false;
}

function isStepValid(stepKey, data) {
  switch (stepKey) {
    case "personal":
      return !!data.name && !!data.dob && !!data.bloodGroup && !!data.gender && !!data.maritalStatus && !!data.phone;
    case "address":
      return isAddressFilled(data.permanentAddress) && isAddressFilled(data.currentAddress);
    case "academic":
      return !!data.department && !!data.session && !!data.passingYear;
    case "employment":
      return isEmploymentFilled(data.employment);
    case "photo":
      return true; // optional
    default:
      return false;
  }
}

function computeOverallPercent(data) {
  // Score = fraction of required field-groups filled, evenly weighted per group
  let filled = 0;
  let total = 0;

  total += 6; // personal fields
  filled += ["name", "dob", "bloodGroup", "gender", "maritalStatus", "phone"].filter((k) => !!data[k]).length;

  total += 2;
  filled += (isAddressFilled(data.permanentAddress) ? 1 : 0) + (isAddressFilled(data.currentAddress) ? 1 : 0);

  total += 3;
  filled += ["department", "session", "passingYear"].filter((k) => !!data[k]).length;

  total += 1;
  filled += isEmploymentFilled(data.employment) ? 1 : 0;

  return Math.round((filled / total) * 100);
}

export default function OnboardingPage() {
  const { user, userDoc } = useAuth();
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [data, setData] = useState({});
  const [saving, setSaving] = useState(false);
  const [waitingForConfirmation, setWaitingForConfirmation] = useState(false);
  const [error, setError] = useState("");

  // Once the profile doc is submitted, recalcProfileComplete (Cloud Function)
  // flips users/{uid}.profileComplete server-side — usually within a second
  // or two. AuthContext's onSnapshot listener picks that up automatically,
  // so we just watch for it here and redirect once it lands.
  useEffect(() => {
    if (waitingForConfirmation && userDoc?.profileComplete) {
      router.replace("/dashboard");
    }
  }, [waitingForConfirmation, userDoc, router]);

  const percent = useMemo(() => computeOverallPercent(data), [data]);
  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;
  const canProceed = isStepValid(step.key, data);

  const goNext = () => {
    if (!canProceed) {
      setError("Please fill in all required fields before continuing.");
      return;
    }
    setError("");
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  };

  const goBack = () => {
    setError("");
    setStepIndex((i) => Math.max(i - 1, 0));
  };

  const handleFinish = async () => {
    if (!canProceed) {
      setError("Please complete this step first.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      // profileComplete, lastDonationDate, and donationCount are no longer
      // written from the client — recalcProfileComplete /
      // recalcDonationStats (Cloud Functions) are the sole authority on
      // those now, so a user editing their own doc directly can't spoof them.
      await setDoc(
        doc(db, "profiles", user.uid),
        {
          ...data,
          visibility: { phone: false, email: false, currentAddress: true, employment: true },
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setSaving(false);
      setWaitingForConfirmation(true);
    } catch (err) {
      setError("Couldn't save your profile — please try again.");
      setSaving(false);
    }
  };

  const StepComponent = step.Component;

  return (
    <div className="onboarding-shell">
      <div className="onboarding-container">
        <div className="onboarding-header">
          <h1>Complete your profile</h1>
          <p>This is required once, so the directory and blood donation features stay accurate for everyone.</p>
          <ProgressBar percent={percent} stepLabel={`Step ${stepIndex + 1} of ${STEPS.length} · ${step.label}`} />
        </div>

        <div className="step-card">
          {error && <div className="error-banner">{error}</div>}
          <StepComponent data={data} setData={setData} />

          <div className="step-nav">
            <button type="button" className="btn-ghost" onClick={goBack} disabled={stepIndex === 0}>
              Back
            </button>
            {isLast ? (
              <button type="button" className="btn" onClick={handleFinish} disabled={saving || waitingForConfirmation}>
                {waitingForConfirmation ? "Confirming…" : saving ? "Saving…" : "Finish & go to dashboard"}
              </button>
            ) : (
              <button type="button" className="btn" onClick={goNext}>
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
