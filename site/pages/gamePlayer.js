import React from "react";
import AppHead from "@/components/AppHead";
import dynamic from "next/dynamic";

const PlayGameComponent = dynamic(() => import("@/components/utils/playGameComponent"), { ssr: false });

//ok
function GamePlayerNoSSR() {
  const params = new URLSearchParams(window.location.search);
  const gameId = params.get("gameId") || "";
  const w = params.get("w") || "100%";
  const h = params.get("h") || "600";
  return (
    <>
      <AppHead title={gameId ? `Play ${gameId}` : "Game Player"} />
      <div style={{ padding: 16 }}>
        <h1>Game Player</h1>
        {!gameId ? (
          <p>Provide a gameId via query string, e.g. <code>?gameId=your-game-id</code></p>
        ) : (
          <PlayGameComponent gameId={gameId} width={w} height={h} />
        )}
      </div>
    </>
  );
}

export default dynamic(() => Promise.resolve(GamePlayerNoSSR), { ssr: false });


