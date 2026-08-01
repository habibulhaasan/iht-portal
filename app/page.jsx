"use client";

import Link from "next/link";
import Image from "next/image";
import { Users, Droplet, Bell, ShieldCheck, MapPin, Star } from "lucide-react";

const FEATURES = [
  {
    icon: Users,
    title: "সদস্য ডিরেক্টরি",
    desc: "ডিপার্টমেন্ট, সেশন, ব্লাড গ্রুপ ও অবস্থান অনুযায়ী ফিল্টার করে যেকোনো ব্যাচমেটকে খুঁজে বের করুন।",
  },
  {
    icon: Droplet,
    title: "রক্তদান ট্র্যাকিং",
    desc: "আপনার রক্তদানের তথ্য সংরক্ষণ করুন এবং পরবর্তী উপযুক্ত তারিখ স্বয়ংক্রিয়ভাবে জেনে নিন।",
  },
  {
    icon: ShieldCheck,
    title: "ভেরিফাইড প্রোফাইল",
    desc: "প্রতিটি প্রোফাইল যাচাইকৃত ও নিয়ন্ত্রিত — যাতে নেটওয়ার্কের তথ্য নির্ভরযোগ্য থাকে।",
  },
  {
    icon: MapPin,
    title: "অবস্থানভিত্তিক খোঁজ",
    desc: "বিভাগ, জেলা ও উপজেলা অনুযায়ী কাছাকাছি থাকা ব্যাচমেটদের সহজে খুঁজে নিন।",
  },
  {
    icon: Bell,
    title: "নোটিফিকেশন",
    desc: "গুরুত্বপূর্ণ তথ্যের জন্য রিয়ালটাইম নোটিফিকেশন।",
  },
  {
    icon: Star,
    title: "ফেভারিট তালিকা",
    desc: "দ্রুত অ্যাক্সেসের জন্য, প্রিয়দের বুকমার্ক করা।",
  },
];

export default function LandingPage() {
  return (
    <div className="landing-page">
    <div className="landing-shell">
      <header className="landing-nav">
        <div className="landing-nav-brand">
          <div className="landing-nav-logo-wrap">
            <Image src="/iht-rangpur-logo.png" alt="IHT Rangpur" fill className="landing-nav-logo" />
          </div>
          <span>আইএইচটি · রংপুর</span>
        </div>
        <div className="landing-nav-actions">
          <Link href="/login" className="landing-nav-link">লগ ইন</Link>
          <Link href="/register" className="btn landing-nav-cta">অ্যাকাউন্ট তৈরি করুন</Link>
        </div>
      </header>

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
      </section>

      <section className="landing-features">
        <h2 className="landing-section-title">যা যা পাবেন</h2>
        <div className="landing-features-grid">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div className="landing-feature-card" key={f.title}>
                <div className="landing-feature-icon"><Icon size={22} /></div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      <footer className="landing-footer">
        <p>© {new Date().getFullYear()} আইএইচটি রংপুর অ্যালামনাই নেটওয়ার্ক</p>
      </footer>
    </div>
    </div>
  );
}