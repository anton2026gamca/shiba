import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import StartScreen from "@/components/StartScreen";
import GlobalGamesComponent from "@/components/GlobalGamesComponent";
import TopBar from "@/components/TopBar";
import PlaytestMode from "@/components/PlaytestMode";

export default function GlobalGamesPage() {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [profile, setProfile] = useState(null);
  const [disableTopBar, setDisableTopBar] = useState(false);
  const [playtestMode, setPlaytestMode] = useState(false);
  const [selectedPlaytestGame, setSelectedPlaytestGame] = useState(null);

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Authentication check
  useEffect(() => {
    const storedToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (storedToken) {
      setToken(storedToken);
      // Fetch profile
      const fetchProfile = async () => {
        try {
          const res = await fetch("/api/getMyProfile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: storedToken }),
          });
          const data = await res.json().catch(() => ({}));
          if (res.ok && data?.ok) {
            setProfile(data.profile || null);
          }
        } catch (e) {
          console.error(e);
        }
      };
      fetchProfile();
    } else {
      setToken(null);
    }
  }, []);

  const goHome = () => {
    router.push("/");
  };

  const gameData = {
    name: "Global Games",
    description: "View global activity & playtest games",
    backgroundImage: "PlayBottom.png",
    topImage: "PlayTop.png",
    bgColor: "rgba(214, 245, 255, 1)",
    gameClipAudio: "Global.mp3",
  };

  // Show login screen if not authenticated
  if (token === null) {
    return <StartScreen setToken={setToken} setProfile={setProfile} />;
  }

  // Render playtest mode if active
  if (playtestMode) {
    return (
      <PlaytestMode 
        onExit={() => {
          setPlaytestMode(false);
          setSelectedPlaytestGame(null);
        }}
        profile={profile}
        playtestGame={selectedPlaytestGame}
        token={token}
      />
    );
  }

  return (
    <>
      <Head>
        <meta httpEquiv="Cross-Origin-Embedder-Policy" content="credentialless" />
        <meta httpEquiv="Cross-Origin-Opener-Policy" content="same-origin" />
        <meta httpEquiv="Cross-Origin-Resource-Policy" content="cross-origin" />
      </Head>
      <div style={{ position: "relative", minHeight: "100vh" }}>
        {!disableTopBar && (
          <TopBar
            backgroundColor={gameData.bgColor}
            title={gameData.name}
            image={gameData.backgroundImage}
            onBack={goHome}
          />
        )}
        <div style={{ paddingTop: disableTopBar ? 0 : 64 }}>
          <GlobalGamesComponent
            disableTopBar={disableTopBar}
            setDisableTopBar={setDisableTopBar}
            goHome={goHome}
            token={token}
            SlackId={profile?.slackId || null}
            setPlaytestMode={setPlaytestMode}
            setSelectedPlaytestGame={setSelectedPlaytestGame}
          />
        </div>
      </div>
    </>
  );
}
