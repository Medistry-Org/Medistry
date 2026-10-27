"use client";

import { useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { getSocket, disconnectSocket } from "@/Config/socket";
import { API_BASE_URL } from "@/config/env";
import styles from "./ChatPage.module.css";

export default function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  // Yahan routeParamId actual DoctorId hai
  const doctorIdParam = resolvedParams.id;

  const [sessionId, setSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const socketRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("medistry_auth_token") ||
        localStorage.getItem("token")
      : null;
  const currentUserId =
    typeof window !== "undefined" ? localStorage.getItem("userId") : null;
  const role =
    typeof window !== "undefined"
      ? (localStorage.getItem("role") || "PATIENT").toUpperCase()
      : "PATIENT";

  // 1. Controller ke exact format me doctorId bhejo
  useEffect(() => {
    if (!doctorIdParam || !token) {
      if (!token)
        setErrorMsg("Aap logged in nahi hain. Kripya pehle login karein.");
      setLoading(false);
      return;
    }

    const initChat = async () => {
      try {
        setLoading(true);
        setErrorMsg("");

        // Backend controller sirf doctorId expect kar raha hai:
        const payload = {
          doctorId: Number(doctorIdParam),
        };

        const res = await fetch(`${API_BASE_URL}/api/chat/init`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          // Backend ne active ya new sessionId return kiya
          setSessionId(data.sessionId);
        } else {
          setErrorMsg(
            data.message ||
              "Access Denied: Is doctor ke sath active appointment verify nahi hua.",
          );
        }
      } catch (err: any) {
        console.error("Chat Init Error:", err);
        setErrorMsg("Server error: Chat session connect nahi ho raha.");
      } finally {
        setLoading(false);
      }
    };

    initChat();
  }, [doctorIdParam, token]);

  // 2. Socket Connection & Listeners
  useEffect(() => {
    if (!sessionId || !token) return;

    const socket = getSocket(token);
    socketRef.current = socket;
    socket.connect();

    // Backend room join event
    socket.emit("join_consultation", sessionId);

    const handleReceiveMessage = (incomingMsg: any) => {
      setMessages((prev) => [...prev, incomingMsg]);
    };

    socket.on("receive_consultation_message", handleReceiveMessage);

    socket.on("error_message", (err: any) => {
      alert(`Chat Error: ${err.message}`);
    });

    return () => {
      socket.off("receive_consultation_message", handleReceiveMessage);
      socket.off("error_message");
      disconnectSocket();
    };
  }, [sessionId, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 3. Message Send Handler
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !socketRef.current || !sessionId) return;

    const payload = {
      sessionId: sessionId,
      senderUserId: Number(currentUserId),
      senderRole: role,
      messageType: "TEXT",
      messageText: inputText.trim(),
      fileUrl: null,
    };

    socketRef.current.emit("send_consultation_message", payload);
    setInputText("");
  };

  const handleBack = () => {
    if (role === "DOCTOR") {
      router.replace("/DoctorDasboard/clinician");
    } else {
      router.replace("/dashboard");
    }
  };

  if (loading) {
    return (
      <div className={styles.centerScreen}>
        <p className={styles.statusText}>Appointment verify ho raha hai...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className={styles.centerScreen}>
        <div className={styles.errorCard}>
          <h3 className={styles.errorTitle}>Access Denied</h3>
          <p className={styles.errorMessage}>{errorMsg}</p>
          <button onClick={handleBack} className={styles.errorBackBtn}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.chatContainer}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button onClick={handleBack} className={styles.backBtn}>
            ← Back
          </button>
          <div>
            <h2 className={styles.headerTitle}>
              {role === "DOCTOR"
                ? "Patient Consultation Chat"
                : "Doctor Consultation Chat"}
            </h2>
            <span className={styles.headerSubtitle}>
              Session ID: #{sessionId}
            </span>
          </div>
        </div>

        <div className={styles.liveIndicator}>
          <span className={styles.pulseDot}></span>
          Live
        </div>
      </div>

      {/* Messages */}
      <div className={styles.messagesArea}>
        {messages.length === 0 ? (
          <div className={styles.emptyState}>
            Consultation start karein. Pehla message bhejein.
          </div>
        ) : (
          messages.map((item, idx) => {
            const isMe = item.senderUserId === Number(currentUserId);
            return (
              <div
                key={idx}
                className={`${styles.messageRow} ${
                  isMe ? styles.rowSender : styles.rowReceiver
                }`}
              >
                <span className={styles.senderRole}>
                  {isMe ? "You" : item.senderRole}
                </span>
                <div
                  className={`${styles.messageBubble} ${
                    isMe ? styles.bubbleSender : styles.bubbleReceiver
                  }`}
                >
                  {item.messageText}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className={styles.inputContainer}>
        <form onSubmit={handleSendMessage} className={styles.inputForm}>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Apna message type karein (${role.toLowerCase()})...`}
            className={styles.messageInput}
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className={styles.sendBtn}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
