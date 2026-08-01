"use client";

import { Info, Layers, ShieldCheck, Link2, Mail } from "lucide-react";

const APP_VERSION = "1.0.0"; // TODO: update per release

export default function AboutTab() {
  return (
    <div className="about-tab">
      <div className="about-card">
        <h2>IHT Rangpur Alumni & Student Network</h2>
        <div className="about-version">Version {APP_VERSION}</div>
        <p className="about-description">
          A platform for current and former students of the Institute of
          Health Technology, Rangpur to stay connected — maintain a verified
          profile, find each other by department or session, and coordinate
          blood donation across the alumni network.
        </p>
      </div>

      <div className="about-card">
        <h3><Layers size={16} /> What you can do here</h3>
        <ul className="about-list">
          <li>Keep a verified profile with your academic and contact details</li>
          <li>Browse the member directory, filterable by department, session, blood group, and location</li>
          <li>Log blood donations and track your next eligible donation date</li>
          <li>Bookmark members as favorites for quick access</li>
          <li>Receive announcements and direct notifications from admins</li>
        </ul>
      </div>

      <div className="about-card">
        <h3><Info size={16} /> Built with</h3>
        <ul className="about-list about-tech-list">
          <li><span className="about-tech-label">Frontend</span><span className="about-tech-detail">Next.js (App Router) + React</span></li>
          <li><span className="about-tech-label">Auth</span><span className="about-tech-detail">Firebase Authentication</span></li>
          <li><span className="about-tech-label">Database</span><span className="about-tech-detail">Cloud Firestore</span></li>
        </ul>
      </div>

      <div className="about-card">
        <h3>Developer</h3>
        {/* TODO: replace with actual developer info */}
        <div className="about-dev-name">Habibul Hasan</div>
        <div className="about-dev-links">
          <a href="https://github.com/habibulhaasan" target="_blank" rel="noopener noreferrer" className="about-dev-link">
            <Link2 size={15} /> github.com/habibulhaasan
          </a>
          <a href="mailto:contact@example.com" className="about-dev-link">
            <Mail size={15} /> contact@example.com
          </a>
        </div>
      </div>

      <div className="about-card about-security-note">
        <h3><ShieldCheck size={16} /> Privacy & data</h3>
        <p>
          Your directory visibility is controlled by you (per-field toggles
          in My Profile) and by institute admins. Locked fields — name,
          blood group, department, session, and similar — can only be
          changed by an admin to keep member records accurate; you can
          always see exactly what's stored on your profile from the My
          Profile tab.
        </p>
      </div>
    </div>
  );
}