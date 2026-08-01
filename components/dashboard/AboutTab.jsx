"use client";

import { Info, Layers, ShieldCheck, Link2, Mail } from "lucide-react";

const APP_VERSION = "1.0.0"; // TODO: রিলিজ অনুযায়ী আপডেট করুন

export default function AboutTab() {
  return (
    <div className="about-tab">
      <div className="about-card">
        <h2>আইএইচটি রংপুর অ্যালামনাই নেটওয়ার্ক</h2>
        <div className="about-version">ভার্সন {APP_VERSION}</div>
        <p className="about-description">
          ইনস্টিটিউট অফ হেলথ টেকনোলজি (IHT), রংপুর-এর বর্তমান ও প্রাক্তন
          শিক্ষার্থীদের পরস্পরের সাথে যুক্ত থাকার একটি প্ল্যাটফর্ম।
        </p>
      </div>

      <div className="about-card">
        <h3><Layers size={16} /> আপনি এখানে যা করতে পারবেন</h3>
        <ul className="about-list">
          <li>প্রাক্তন ও বর্তমান শিক্ষার্থীদের তথ্য</li>
          <li>ডিপার্টমেন্ট, সেশন, ব্লাড গ্রুপ ও ঠিকানা অনুযায়ী ফিল্টার করে সদস্য ডিরেক্টরি ব্রাউজ করার সুবিধা</li>
          <li>আপনার রক্তদানের তথ্য যোগ করতে পারবেন। পরবর্তী রক্তদানের তারিখ ট্র্যাক করা যাবে</li>
          <li>দ্রুত খুজে পাওয়ার জন্য সদস্যদের ফেভারিটে যুক্ত করুন</li>
          <li>রিয়াল টাইম নোটিফিকেশন সুবিধা</li>
        </ul>
      </div>

      <div className="about-card">
        <h3>ডেভেলপার</h3>
        {/* TODO: প্রকৃত ডেভেলপার তথ্য দিয়ে প্রতিস্থাপন করুন */}
        <div className="about-dev-name">Habibul Hasan Hasib</div>
        <div className="about-dev-role">Ex-Student</div>
        <div className="about-dev-links">
          <a href="https://facebook.com/habibulhaasan" target="_blank" rel="noopener noreferrer" className="about-dev-link">
            <Link2 size={15} /> facebook.com/habibulhaasan
          </a>
          <a href="mailto:hasanthp@gmail.com" className="about-dev-link">
            <Mail size={15} /> hasanthp@gmail.com
          </a>
        </div>
      </div>

      <div className="about-card about-security-note">
        <h3><ShieldCheck size={16} /> গোপনীয়তা ও তথ্য নিরাপত্তা</h3>
        <p>
          ডিরেক্টরিতে আপনার প্রয়োজনীয় তথ্য আপনি নিজে (মাই প্রোফাইলের
          প্রাইভেসি টগল থেকে) অন/অফ করতে পারবেন। নাম,
          ব্লাড গ্রুপ, ডিপার্টমেন্ট, সেশনের মতো লকড ফিল্ডগুলো সদস্যদের তথ্যের
          সঠিকতা বজায় রাখতে শুধুমাত্র অ্যাডমিন পরিবর্তন করতে পারেন — আপনার
          প্রোফাইলে ঠিক কী তথ্য সংরক্ষিত আছে তা সবসময় মাই প্রোফাইল ট্যাব থেকে
          দেখতে পারবেন। আপনার সংরক্ষিত তথ্য শুধুমাত্র তৃতীয় পক্ষের নিকট শেয়ার করা হবে না।
        </p>
      </div>
    </div>
  );
}