import { useEffect } from "react";
import { useRouter } from "next/router";

export default function GamesPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to global-games page
    router.replace("/global-games");
  }, [router]);

  // Return a loading state while redirecting
  return (
    <div style={{ 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center", 
      height: "100vh",
      fontSize: "18px",
      color: "#666"
    }}>
      Redirecting to games...
    </div>
  );
}
