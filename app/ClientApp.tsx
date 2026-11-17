"use client";

import dynamic from "next/dynamic";

const Experience = dynamic(() => import("@/Experience"), {
  ssr: false,
  loading: () => (
    <div className="loading">
      <div className="loading-heart">♥</div>
      <p>Building your castle…</p>
    </div>
  ),
});

export default function ClientApp() {
  return <Experience />;
}
