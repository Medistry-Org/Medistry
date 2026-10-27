"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getSocket, disconnectSocket } from "@/config/socket";
import { API_BASE_URL } from "@/config/env";

export default function PatientMessagesPage() {
  const router = useRouter();

  const [appointments, setAppointments] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<any | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
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

  // 1. Patient ke active doctors/appointments fetch karo
  useEffect(() => {
    async function fetchDoctors() {
      if (!token) {
        setErrorMsg("Kripya pehle login karein.");
        setLoadingList(false);
        return;
      }

      try {
        setLoadingList(true);
        const res = await fetch(`${API_BASE_URL}/api/appointments/patient`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await res.json();
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data?.appointments)
              ? data.appointments
              : [];

        // Unique doctors filter out karo
        const uniqueDoctorsMap = new Map();
        list.forEach((item: any) => {
          const docId = item.DoctorId || item.doctorId || item.doctor?.id;
          if (docId && !uniqueDoctorsMap.has(docId)) {
            uniqueDoctorsMap.set(docId, {
              id: docId,
              name:
                item.DoctorName ||
                item.DoctorFullName ||
                item.doctor?.name ||
                `Dr. Consultant (#${docId})`,
              specialty:
                item.Specialization || item.specialty || "Medical Specialist",
            });
          }
        });

        const doctorList = Array.from(uniqueDoctorsMap.values());
        setAppointments(doctorList);

        if (doctorList.length > 0) {
          setSelectedDoctor(doctorList[0]);
        }
      } catch (err) {
        console.error("Fetch doctors error:", err);
      } finally {
        setLoadingList(false);
      }
    }

    fetchDoctors();
  }, [token]);

  // 2. Selected Doctor change hone par SessionId fetch/init karo
  useEffect(() => {
    if (!selectedDoctor?.id || !token) return;

    async function initSession() {
      try {
        setLoadingChat(true);
        setMessages([]);
        const res = await fetch(`${API_BASE_URL}/api/chat/init`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ doctorId: Number(selectedDoctor.id) }),
        });

        const data = await res.json();
        if (data.success) {
          setSessionId(data.sessionId);
        } else {
          setErrorMsg(data.message || "Chat connect nahi ho payi.");
        }
      } catch (err) {
        console.error("Chat init error:", err);
      } finally {
        setLoadingChat(false);
      }
    }

    initSession();
  }, [selectedDoctor, token]);

  // 3. Socket Connection & Listeners
  useEffect(() => {
    if (!sessionId || !token) return;

    const socket = getSocket(token);
    socketRef.current = socket;
    socket.connect();

    socket.emit("join_consultation", sessionId);

    const handleReceive = (incomingMsg: any) => {
      setMessages((prev) => [...prev, incomingMsg]);
    };

    socket.on("receive_consultation_message", handleReceive);

    return () => {
      socket.off("receive_consultation_message", handleReceive);
      disconnectSocket();
    };
  }, [sessionId, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 4. Send Message Handler
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !socketRef.current || !sessionId) return;

    const payload = {
      sessionId: sessionId,
      senderUserId: Number(currentUserId),
      senderRole: "PATIENT",
      messageType: "TEXT",
      messageText: inputText.trim(),
      fileUrl: null,
    };

    socketRef.current.emit("send_consultation_message", payload);
    setInputText("");
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-6xl">
        {/* Top Bar */}
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="mb-4 text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
        >
          ← Back to Dashboard
        </button>

        <div className="mb-4">
          <h1 className="text-xl font-bold text-slate-900">
            Consultation Messages
          </h1>
          <p className="text-xs text-slate-500">
            Apne doctors ke sath live consultation aur chat karein.
          </p>
        </div>

        {/* Chat UI Split View */}
        <div className="grid grid-cols-1 md:grid-cols-3 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden h-[620px]">
          {/* Left Column: Doctors List */}
          <div className="border-r border-slate-200 flex flex-col h-full bg-slate-50/50">
            <div className="p-3 border-b border-slate-200 font-semibold text-xs text-slate-700 bg-white">
              My Doctors ({appointments.length})
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {loadingList ? (
                <div className="p-4 text-xs text-slate-400 text-center">
                  Doctors load ho rahe hain...
                </div>
              ) : appointments.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  Koi active doctor nahi mila. Pehle appointment book karein.
                </div>
              ) : (
                appointments.map((doc) => {
                  const isSelected = selectedDoctor?.id === doc.id;
                  return (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => setSelectedDoctor(doc)}
                      className={`w-full text-left p-3 flex items-center gap-3 transition-colors ${
                        isSelected
                          ? "bg-blue-50/80 border-l-4 border-blue-600"
                          : "hover:bg-slate-100"
                      }`}
                    >
                      <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">
                        {doc.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {doc.name}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {doc.specialty}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Live Chat Screen */}
          <div className="col-span-2 flex flex-col h-full bg-white">
            {selectedDoctor ? (
              <>
                {/* Chat Header */}
                <div className="p-3 px-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
                  <div>
                    <h2 className="text-xs font-semibold">
                      {selectedDoctor.name}
                    </h2>
                    <p className="text-[10px] text-slate-400">
                      {selectedDoctor.specialty}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Connected
                  </div>
                </div>

                {/* Messages Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                  {loadingChat ? (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">
                      Chat room load ho raha hai...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                      <span className="text-2xl mb-1">💬</span>
                      Consultation start karein. Pehla message bhejein.
                    </div>
                  ) : (
                    messages.map((item, idx) => {
                      const isMe = item.senderUserId === Number(currentUserId);
                      return (
                        <div
                          key={idx}
                          className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                        >
                          <span className="text-[9px] text-slate-400 mb-0.5 px-1">
                            {isMe ? "You" : "Doctor"}
                          </span>
                          <div
                            className={`max-w-[75%] px-3.5 py-2 text-xs rounded-2xl shadow-sm ${
                              isMe
                                ? "bg-blue-600 text-white rounded-br-none"
                                : "bg-white text-slate-800 border border-slate-200 rounded-bl-none"
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

                {/* Input Bar */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 border-t border-slate-100 flex items-center gap-2 bg-white"
                >
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 bg-slate-100 rounded-xl px-4 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-medium px-4 py-2 rounded-xl text-xs transition"
                  >
                    Send
                  </button>
                </form>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Baatcheet ke liye koi doctor select karein.
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
