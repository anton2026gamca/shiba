import React, { useEffect, useState, useRef } from "react";
import useAudioManager from "./useAudioManager";

export default function HelpComponent() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [openItems, setOpenItems] = useState(new Set());
  const itemsRefs = useRef([]);
  const { play: playSound } = useAudioManager(["popSound.mp3", "next.mp3", "prev.mp3"]);

  const toggleDetails = (event) => {
    const details = event.currentTarget.querySelector('details');
    if (details) {
      details.open = !details.open;
    }
  };

  const handleSummaryClick = (event) => {
    event.preventDefault(); // Prevent default summary behavior
    event.stopPropagation(); // Prevent the div click from also firing
    const details = event.currentTarget.closest('details');
    if (details) {
      details.open = !details.open;
    }
  };

     // FAQ items data
   const faqItems = [
     {
       question: "What is Shiba Arcade?",
       answer: (
         <div style={{ marginTop: "16px", lineHeight: "1.6" }}>
           <p style={{ marginBottom: "16px" }}>
             Shiba Arcade is a game development jam where teenagers create games in Godot Engine, get feedback from other players, and earn SSS currency. The best creators can win a trip to Tokyo to build a real arcade from November 5-12th!
           </p>
           <div style={{ 
             display: "flex", 
             justifyContent: "center", 
             marginTop: "20px" 
           }}>
             <iframe 
               width="560" 
               height="315" 
               src="https://www.youtube.com/embed/MdnJ_neHE7Q?si=nIfh4vvYxhBMYyGI" 
               title="YouTube video player" 
               frameBorder="0" 
               allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
               referrerPolicy="strict-origin-when-cross-origin" 
               allowFullScreen
               credentialless
               style={{ maxWidth: "100%", borderRadius: "8px" }}
             ></iframe>
           </div>
         </div>
       ),
       backgroundColor: "#FFE5E5",
       borderColor: "#8B0000"
     },
     {
       question: "How much does it cost?",
       answer: (
         <p style={{ marginTop: "16px", lineHeight: "1.6" }}>
           The event is totally free to participate in! We provide flight stipends of up to $750 for those outside of Asia and $250 for those within Asia for those who get enough SSS to get their ticket to build the Shiba Arcade in Japan. Housing, food, etc. is covered for your time in Japan from November 5-12th.
         </p>
       ),
       backgroundColor: "#E8F5E8",
       borderColor: "#2E7D32"
     },
    {
      question: "How do I create and upload a game?",
      answer: (
        <p style={{ marginTop: "16px", lineHeight: "1.6" }}>
          To create a game, you&apos;ll need to use Godot Engine. Once your game is ready, you can upload it through the &quot;Upload Game&quot; section. Make sure your game is exported as a web build (.html, .js, .wasm files) and packaged as a .zip file.
        </p>
      ),
      backgroundColor: "#E5F3FF",
      borderColor: "#0066CC"
    },
    {
      question: "How do I earn SSS (Shiba Arcade currency)?",
      answer: (
        <p style={{ marginTop: "16px", lineHeight: "1.6" }}>
          You earn SSS when people play your game and give it ratings. Players rate games on a scale of 1-5 across five categories: Fun, Art, Creativity, Audio, and Mood. The maximum SSS you can earn from a single play is 25 SSS (5 points × 5 categories).
        </p>
      ),
      backgroundColor: "#E5FFE5",
      borderColor: "#006600"
    },
    {
      question: "How do I get playtest tickets?",
      answer: (
        <p style={{ marginTop: "16px", lineHeight: "1.6" }}>
          You earn playtest tickets by uploading your game demo and getting approved for time spent making your game through Hackatime. The more time you log working on your game, the more playtest tickets you&apos;ll receive.
        </p>
      ),
      backgroundColor: "#FFF2E5",
      borderColor: "#CC6600"
    },

    {
      question: "How do I qualify for the Tokyo trip?",
      answer: (
        <p style={{ marginTop: "16px", lineHeight: "1.6" }}>
          To qualify for the Tokyo trip, you need to earn enough SSS by creating a great game that receives high ratings from other players. The SSS you earn can be used to purchase a ticket to Tokyo, where you&apos;ll help build the arcade from November 5-12th.
        </p>
      ),
      backgroundColor: "#FFE5F0",
      borderColor: "#CC0066"
    },
    {
      question: "How do I log my time in Hackatime?",
      answer: (
        <div style={{ marginTop: "16px", lineHeight: "1.6" }}>
          <p style={{ marginBottom: "16px" }}>
            To log your time working on your game, you&apos;ll need to:
          </p>
          <ol style={{ marginBottom: "16px", paddingLeft: "20px" }}>
            <li style={{ marginBottom: "8px" }}>
              <strong>Join the Slack:</strong> You should have received an invite at signup. Check your email for the Slack invitation.
            </li>
            <li style={{ marginBottom: "8px" }}>
              <strong>Login to Hackatime:</strong> Go to <a href="http://hackatime.hackclub.com/" target="_blank" rel="noopener noreferrer" style={{ color: "#0066CC", textDecoration: "underline" }}>hackatime.hackclub.com</a> and login with your Slack account.
            </li>
            <li style={{ marginBottom: "8px" }}>
              <strong>Add the Godot Extension:</strong> Install the <a href="https://github.com/BudzioT/Godot_Super-Wakatime" target="_blank" rel="noopener noreferrer" style={{ color: "#0066CC", textDecoration: "underline" }}>Godot Super-Wakatime extension</a> to automatically track your time while working in Godot Engine. If you&apos;re having trouble, head over to <a href="https://hackatime.hackclub.com/docs/editors/godot" target="_blank" rel="noopener noreferrer" style={{ color: "#0066CC", textDecoration: "underline" }}>hackatime.hackclub.com/docs/editors/godot</a> for detailed instructions.
            </li>
            <li style={{ marginBottom: "8px" }}>
              <strong>Log some time:</strong> Work on your game in Godot for a bit so that some time gets logged.
            </li>
            <li style={{ marginBottom: "8px" }}>
              <strong>Go to My Games:</strong> Navigate to the &quot;My Games&quot; section and select the name of your Hackatime project (it will appear after you&apos;ve logged some time).
            </li>
          </ol>
          <p>
            Once set up, your time will be automatically logged when you&apos;re working in Godot, and this will help you earn playtest tickets! For every playtest ticket you earn, someone will play your game and you&apos;ll get to play someone else&apos;s game. You&apos;ll both earn SSS from the playtest.
          </p>
        </div>
      ),
      backgroundColor: "#FFFFE5",
      borderColor: "#666600"
    },
    {
      question: "Have y'all done this before?",
      answer: (
        <div style={{ marginTop: "16px", lineHeight: "1.6" }}>
          <p style={{ marginBottom: "16px" }}>
            No, we&apos;ve never done an event in Japan before, but here are two of our past adventures!
          </p>
          <div style={{ 
            display: "flex", 
            flexDirection: "column",
            gap: "20px",
            alignItems: "center", 
            marginTop: "20px" 
          }}>
            <iframe 
              width="560" 
              height="315" 
              src="https://www.youtube.com/embed/fuTlToZ1SX8?si=RfWUueM7CbAI6zdZ" 
              title="YouTube video player" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
              referrerPolicy="strict-origin-when-cross-origin" 
              allowFullScreen
              credentialless
              style={{ maxWidth: "100%", borderRadius: "8px" }}
            ></iframe>
            <iframe 
              width="560" 
              height="315" 
              src="https://www.youtube.com/embed/ufMUJ9D1fi8?si=iTnugdsJkbgCWQl1" 
              title="YouTube video player" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
              referrerPolicy="strict-origin-when-cross-origin" 
              allowFullScreen
              credentialless
              style={{ maxWidth: "100%", borderRadius: "8px" }}
            ></iframe>
          </div>
        </div>
      ),
      backgroundColor: "#E5FFFF",
      borderColor: "#006666"
    },
         {
       question: "I&apos;m new to game development. Can I still participate?",
       answer: (
         <p style={{ marginTop: "16px", lineHeight: "1.6" }}>
           Absolutely! Beginners are welcome and encouraged to participate. We&apos;ll be running workshops to teach you how to make games in Godot. You&apos;ll also get plenty of feedback on your games and the chance to make multiple iterations to improve them.
         </p>
       ),
       backgroundColor: "#F0F8FF",
       borderColor: "#0066CC"
     }
  ];

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      const total = faqItems.length;
      if (total <= 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        try { playSound('next.mp3'); } catch (_) {}
        const next = (selectedIndex + 1) % total;
        setSelectedIndex(next);
        // scroll into view
        const node = itemsRefs.current[next];
        if (node && typeof node.scrollIntoView === 'function') {
          node.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        try { playSound('prev.mp3'); } catch (_) {}
        const prev = (selectedIndex - 1 + total) % total;
        setSelectedIndex(prev);
        const node = itemsRefs.current[prev];
        if (node && typeof node.scrollIntoView === 'function') {
          node.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        try { playSound('popSound.mp3'); } catch (_) {}
        const details = itemsRefs.current[selectedIndex]?.querySelector('details');
        if (details) {
          details.open = !details.open;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, faqItems.length, playSound]);

  return (
    <div style={{
      backgroundColor: "rgb(255, 245, 214)",
      minHeight: "100vh",
      padding: "20px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center"
    }}>
      <div style={{
        width: "1000px",
        maxWidth: "100%"
      }}>
        <div style={{
          textAlign: "center",
          marginBottom: "30px",
          color: "#2d5a27"
        }}>
          <p style={{ fontSize: "0.9em", opacity: 0.6, marginTop: "8px" }}>Use arrow keys to navigate, Enter to open/close</p>
        </div>

        {/* Quick Start Guide - Always Open */}
        <div style={{
          border: "3px solid #2d5a27",
          borderRadius: "12px",
          padding: "24px",
          backgroundColor: "#f8f9fa",
          marginBottom: "30px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
        }}>
          <h2 style={{ 
            fontSize: "1.8em", 
            marginBottom: "20px", 
            color: "#2d5a27",
            textAlign: "center"
          }}>
            Quick Start Guide
          </h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <div style={{ 
                backgroundColor: "#2d5a27", 
                color: "white", 
                borderRadius: "50%", 
                width: "24px", 
                height: "24px", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                fontSize: "14px", 
                fontWeight: "bold",
                flexShrink: 0,
                marginTop: "2px"
              }}>
                1
              </div>
              <div>
                <h3 style={{ margin: "0 0 8px 0", fontSize: "1.1em", color: "#2d5a27" }}>
                  Set Up Hackatime Tracking
                </h3>
                <p style={{ margin: 0, lineHeight: "1.5", fontSize: "14px" }}>
                  Join the <a href="https://slack.hackclub.com" target="_blank" rel="noopener noreferrer" style={{ color: "#0066CC", textDecoration: "underline" }}>Hack Club Slack</a>, 
                  log into <a href="https://hackatime.hackclub.com" target="_blank" rel="noopener noreferrer" style={{ color: "#0066CC", textDecoration: "underline" }}>Hackatime</a> with your Slack account, 
                  and install the <a href="https://github.com/BudzioT/Godot_Super-Wakatime" target="_blank" rel="noopener noreferrer" style={{ color: "#0066CC", textDecoration: "underline" }}>Godot Super-Wakatime extension</a>. 
                  Work on your game for a bit, then go to &quot;My Games&quot; and select your Hackatime project name.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <div style={{ 
                backgroundColor: "#2d5a27", 
                color: "white", 
                borderRadius: "50%", 
                width: "24px", 
                height: "24px", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                fontSize: "14px", 
                fontWeight: "bold",
                flexShrink: 0,
                marginTop: "2px"
              }}>
                2
              </div>
              <div>
                <h3 style={{ margin: "0 0 8px 0", fontSize: "1.1em", color: "#2d5a27" }}>
                  Create Your Game in Godot
                </h3>
                                 <p style={{ margin: 0, lineHeight: "1.5", fontSize: "14px" }}>
                   Build your game using Godot Engine. When ready, export it as a <strong>web build</strong> (.html, .js, .wasm files) and package it as a .zip file. 
                   Make sure the main file is named <strong>index.html</strong>. This is the format that can be uploaded to the Shiba interface.
                 </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <div style={{ 
                backgroundColor: "#2d5a27", 
                color: "white", 
                borderRadius: "50%", 
                width: "24px", 
                height: "24px", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                fontSize: "14px", 
                fontWeight: "bold",
                flexShrink: 0,
                marginTop: "2px"
              }}>
                3
              </div>
              <div>
                <h3 style={{ margin: "0 0 8px 0", fontSize: "1.1em", color: "#2d5a27" }}>
                  Add Your Game to Shiba
                </h3>
                <p style={{ margin: 0, lineHeight: "1.5", fontSize: "14px" }}>
                  Go to the &quot;My Games&quot; section and click the &quot;+&quot; button to create a new game. Add your game details, 
                  upload a thumbnail image, and link your GitHub repository.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <div style={{ 
                backgroundColor: "#2d5a27", 
                color: "white", 
                borderRadius: "50%", 
                width: "24px", 
                height: "24px", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                fontSize: "14px", 
                fontWeight: "bold",
                flexShrink: 0,
                marginTop: "2px"
              }}>
                4
              </div>
              <div>
                <h3 style={{ margin: "0 0 8px 0", fontSize: "1.1em", color: "#2d5a27" }}>
                  Post Regular Updates
                </h3>
                                 <p style={{ margin: 0, lineHeight: "1.5", fontSize: "14px" }}>
                   <strong>Every 3-4 hours:</strong> Post a &quot;Devlog&quot; with a screenshot/GIF/video showing what you added and a short description. 
                   <strong>Every ~10 hours:</strong> Ship a new demo by uploading your Godot web build (.zip file) with a description of what&apos;s new. 
                   Every 10 hours you log will be turned into up to 3 playtest tickets!
                 </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <div style={{ 
                backgroundColor: "#2d5a27", 
                color: "white", 
                borderRadius: "50%", 
                width: "24px", 
                height: "24px", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                fontSize: "14px", 
                fontWeight: "bold",
                flexShrink: 0,
                marginTop: "2px"
              }}>
                5
              </div>
              <div>
                <h3 style={{ margin: "0 0 8px 0", fontSize: "1.1em", color: "#2d5a27" }}>
                  Earn SSS & Playtest Others
                </h3>
                <p style={{ margin: 0, lineHeight: "1.5", fontSize: "14px" }}>
                  Use your playtest tickets to play other people&apos;s games and rate them (Fun, Art, Creativity, Audio, Mood). 
                  Each rating earns you SSS currency. The more SSS you earn, the closer you get to winning a trip to Tokyo!
                </p>
              </div>
            </div>
          </div>
        </div>

        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "20px"
        }}>
          {faqItems.map((item, idx) => (
            <div 
              key={idx}
              onClick={toggleDetails}
              ref={(el) => { itemsRefs.current[idx] = el; }}
              onMouseEnter={() => setSelectedIndex(idx)}
                             style={{
                 color: "black",
                 padding: "20px",
                 backgroundColor: item.backgroundColor,
                 borderRadius: "8px",
                 border: selectedIndex === idx ? `3px solid ${item.borderColor}` : `3px solid ${item.borderColor}`,
                 outline: selectedIndex === idx ? `2px solid #000` : "none",
                 outlineOffset: selectedIndex === idx ? "2px" : "0px",
                 cursor: "pointer",
                 transition: "outline 0.2s ease, outlineOffset 0.2s ease"
               }}
            >
              <details style={{ margin: 0 }}>
                <summary 
                  onClick={handleSummaryClick}
                  style={{ 
                    fontWeight: "bold", 
                    cursor: "pointer",
                    color: selectedIndex === idx ? "#000" : "#333"
                  }}
                >
                  {item.question}
                </summary>
                {item.answer}
              </details>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


