"use client";

import Link from "next/link";
import Image from "next/image";
// Added Download and Smartphone icons
import { Users, Droplet, Bell, ShieldCheck, MapPin, Star, Download, Smartphone } from "lucide-react";

// ... [FEATURES array remains the same] ...

export default function LandingPage() {
  return (
    <div className="landing-page">
      {/* ... [nav and header remain the same] ... */}

      <section className="landing-hero">
        <div className="landing-hero-logo-wrap">
          <Image src="/iht-rangpur-logo.png" alt="IHT Rangpur" fill className="landing-hero-logo" />
        </div>
        <h1 className="landing-hero-title">
          আইএইচটি, রংপুর এলামনাই নেটওয়ার্ক
          <br />
          ব্যাচমেট,সিনিয়র ও জুনিয়র সব এক জায়গায়।
        </h1>
        <p className="landing-hero-sub">
          ইনস্টিটিউট অফ হেলথ টেকনোলজি, রংপুর-এর বর্তমান ও প্রাক্তন শিক্ষার্থীদের
          জন্য একটি অভিন্ন প্ল্যাটফর্ম।
        </p>
        
        <div className="landing-hero-actions">
          <Link href="/register" className="btn landing-hero-btn">রেজিস্টার করুন</Link>
          <Link href="/login" className="btn-ghost btn landing-hero-btn">লগ ইন করুন</Link>
        </div>

        {/* Separated the Download Button for emphasis */}
        <div className="landing-hero-app-download">
          <a href="/IHT_Rangpur.apk" download className="app-download-btn">
            <div className="app-download-icon">
              <Smartphone size={28} />
              <div className="download-badge">
                <Download size={12} strokeWidth={3} />
              </div>
            </div>
            <div className="app-download-text">
              <span>অ্যান্ড্রয়েড অ্যাপ</span>
              <strong>ডাউনলোড করুন</strong>
            </div>
          </a>
        </div>
      </section>

      {/* ... [features and footer remain the same] ... */}
    </div>
  );
}