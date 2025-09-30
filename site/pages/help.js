import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import StartScreen from "@/components/StartScreen";
import HelpComponent from "@/components/HelpComponent";
import TopBar from "@/components/TopBar";

export default function HelpPage() {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [profile, setProfile] = useState(null);
  const [disableTopBar, setDisableTopBar] = useState(false);

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
    name: "Help",
    description: "Learn how to use Shiba.",
    backgroundImage: "HelpBottom.png",
    topImage: "HelpTop.png",
    bgColor: "rgba(255, 245, 214, 1)",
    gameClipAudio: "Help.mp3",
  };

  // Show login screen if not authenticated
  if (token === null) {
    return <StartScreen setToken={setToken} setProfile={setProfile} />;
  }

  return (
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
        <HelpComponent
          disableTopBar={disableTopBar}
          setDisableTopBar={setDisableTopBar}
          goHome={goHome}
          token={token}
          SlackId={profile?.slackId || null}
        />
      </div>
    </div>
  );
}
