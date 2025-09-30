import { useEffect, useRef, useState } from "react";

export default function CreateGameModal({ isOpen, onClose, token, onCreated }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [shouldRender, setShouldRender] = useState(Boolean(isOpen));
  const [isExiting, setIsExiting] = useState(false);
  const nameInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // allow next paint to switch to enter state
      requestAnimationFrame(() => setIsExiting(false));
    } else if (shouldRender) {
      setIsExiting(true);
      const t = setTimeout(() => {
        setShouldRender(false);
        setIsExiting(false);
      }, 260); // match CSS transition duration
      return () => clearTimeout(t);
    }
  }, [isOpen, shouldRender]);

  // Focus name input when modal opens
  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => {
      nameInputRef.current?.focus();
      nameInputRef.current?.select?.();
    }, 0);
    return () => clearTimeout(t);
  }, [isOpen]);

  if (!shouldRender) return null;

  const handleCreate = async () => {
    if (!token || !name.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/CreateNewGame", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name: name.trim(), description }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok) {
        setName("");
        setDescription("");
        onClose?.();
        onCreated?.();
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={`modal-overlay ${isExiting ? 'exit' : 'enter'}`}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10000,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        className={`modal-card ${isExiting ? 'exit' : 'enter'}`}
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.92)",
          padding: 20,
          borderRadius: 12,
          minWidth: 320,
          maxWidth: 480,
          width: "90%",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          border: "1px solid rgba(0, 0, 0, 0.12)",
        }}
      >
        {/* Header HSTACK */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <p style={{ margin: 0, fontWeight: 600 }}>Create Game</p>
          <button
            onClick={onClose}
            className="icon-btn"
            aria-label="Close"
            title="Close"
            style={{
              appearance: "none",
              border: "1px solid rgba(0,0,0,0.12)",
              background: "rgba(255,255,255,0.7)",
              width: 32,
              height: 32,
              borderRadius: 9999,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "rgba(0,0,0,0.65)",
              fontSize: 18,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Body VStack */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <input
            type="text"
            placeholder="Game Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleCreate();
              }
            }}
            ref={nameInputRef}
            style={{
              padding: 10,
              borderRadius: 10,
              border: "1px solid rgba(0,0,0,0.18)",
              background: "rgba(255,255,255,0.8)",
              outline: "none",
            }}
          />
          <textarea
            rows={4}
            placeholder="Game Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{
              resize: "vertical",
              padding: 10,
              borderRadius: 10,
              border: "1px solid rgba(0,0,0,0.18)",
              background: "rgba(255,255,255,0.8)",
              outline: "none",
            }}
          />
          <button
            disabled={submitting || !name.trim()}
            onClick={handleCreate}
            className="big-cta-btn"
          >
            {submitting ? "Creating..." : "Create Game"}
          </button>
        </div>
      </div>
      <style jsx>{`
        .modal-overlay {
          background-color: rgba(255, 255, 255, 0);
          backdrop-filter: blur(0px);
          -webkit-backdrop-filter: blur(0px);
          transition: backdrop-filter 240ms ease, -webkit-backdrop-filter 240ms ease, background-color 240ms ease;
        }
        .modal-overlay.enter {
          background-color: rgba(255, 255, 255, 0.3);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
        }
        .modal-overlay.exit {
          background-color: rgba(255, 255, 255, 0);
          backdrop-filter: blur(0px);
          -webkit-backdrop-filter: blur(0px);
        }

        .modal-card {
          transform: translateY(6px) scale(0.98);
          opacity: 0;
          transition: transform 260ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 220ms ease;
        }
        .modal-card.enter {
          transform: translateY(0) scale(1);
          opacity: 1;
        }
        .modal-card.exit {
          transform: translateY(6px) scale(0.98);
          opacity: 0;
        }
        .icon-btn:hover { opacity: 0.95; color: rgba(0,0,0,0.85); }
        .big-cta-btn {
          appearance: none;
          width: 100%;
          padding: 14px 16px;
          border-radius: 14px;
          border: 0;
          cursor: pointer;
          color: #fff;
          font-weight: 800;
          font-size: 16px;
          letter-spacing: 0.2px;
          background: linear-gradient(180deg, #ff8ec3 0%, #ff6fa5 100%);
          transform: translateY(0);
          transition: transform 120ms ease, opacity 120ms ease;
        }
        .big-cta-btn:hover { transform: translateY(-1px); }
        .big-cta-btn:active { transform: translateY(1px); }
        .big-cta-btn:disabled {
          opacity: 0.8;
          cursor: not-allowed;
          transform: none;
          color: rgba(255,255,255,0.9);
          background: linear-gradient(180deg, rgba(219, 37, 112, 0.45) 0%, rgba(176, 22, 89, 0.45) 100%);
        }
      `}</style>
    </div>
  );
}


