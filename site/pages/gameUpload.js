import React from "react";
import AppHead from "@/components/AppHead";
import dynamic from "next/dynamic";

const UploadGameComponent = dynamic(() => import("@/components/utils/UploadGameComponent"), { ssr: false });

export default function GameUploadPage() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || "";
  return (
    <>
      <AppHead title="Upload Game" />
      <div style={{ padding: 16 }}>
        <h1>Upload Game</h1>
        <UploadGameComponent apiBase={apiBase} />
      </div>
    </>
  );
}


