import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import StartScreen from "@/components/StartScreen";
import ShopComponent from "@/components/ShopComponent";
import TopBar from "@/components/TopBar";

export default function ShopPage() {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [profile, setProfile] = useState(null);

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
    name: "Shop",
    description: "Purchase items from the shop.",
    backgroundImage: "ShopBottom.png",
    topImage: "ShopTop.png",
    bgColor: "rgba(214, 255, 214, 1)",
    gameClipAudio: "Shop.mp3",
  };

  // Show login screen if not authenticated
  if (token === null) {
    return <StartScreen setToken={setToken} setProfile={setProfile} />;
  }

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <TopBar
        backgroundColor={gameData.bgColor}
        title={gameData.name}
        image={gameData.backgroundImage}
        onBack={goHome}
      />
      <div style={{ paddingTop: 64 }}>
        <ShopComponent 
          profile={profile}
          token={token}
          setProfile={setProfile}
        />
      </div>
    </div>
  );
}
