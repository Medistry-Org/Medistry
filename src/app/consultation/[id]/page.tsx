"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/config/env";

export default function ConsultationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const appointmentId = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [joinLink, setJoinLink] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isEnding, setIsEnding] = useState(false);

  const checkAndJoinCall = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const token = localStorage.getItem("medistry_auth_token");
      if (!token) {
        setErrorMessage("Aap logged in nahi hain. Kripya login karein.");
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/video/appointments/${appointmentId}/join`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        setErrorMessage(
          result.message || "Consultation room open karne me samasya aayi.",
        );
        return;
      }

      if (result.data?.joinLink) {
        setJoinLink(result.data.joinLink);
        setUserRole(result.data.role);
      } else {
        setErrorMessage("Video link nahi mila.");
      }
    } catch (err: any) {
      setErrorMessage("Network error: Server se judne me samasya aayi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (appointmentId) {
      checkAndJoinCall();
    }
  }, [appointmentId]);

  // Doctor jab call complete karega
  const handleDoctorEndCall = async () => {
    if (
      !window.confirm(
        "Kya aap consultation ko sabhi ke liye end karna chahte hain?",
      )
    ) {
      return;
    }

    try {
      setIsEnding(true);
      const token = localStorage.getItem("medistry_auth_token");

      const response = await fetch(
        `${API_BASE_URL}/api/video/appointments/${appointmentId}/end`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const resData = await response.json();

      if (response.ok && resData.success) {
        alert("Consultation complete ho gaya.");
        router.replace("/DoctorDasboard/clinician");
      } else {
        alert(resData.message || "Meeting end karne me issue aaya.");
      }
    } catch (error) {
      console.error("End call error:", error);
    } finally {
      setIsEnding(false);
    }
  };

  // Back button
  const handleLeaveCall = () => {
    if (userRole === "doctor") {
      router.replace("/DoctorDasboard/clinician");
    } else {
      router.replace("/dashboard");
    }
  };

  if (loading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f9fafb",
        }}
      >
        <p style={{ fontSize: "18px", color: "#374151" }}>
          Meeting room verify ho raha hai...
        </p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f9fafb",
          padding: "20px",
        }}
      >
        <div
          style={{
            background: "#fff",
            padding: "30px",
            borderRadius: "10px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            textAlign: "center",
            maxWidth: "450px",
          }}
        >
          <h3 style={{ color: "#dc2626", marginBottom: "12px" }}>Alert</h3>
          <p style={{ color: "#4b5563", marginBottom: "20px" }}>
            {errorMessage}
          </p>
          <div
            style={{ display: "flex", gap: "10px", justifyContent: "center" }}
          >
            <button
              onClick={checkAndJoinCall}
              style={{
                background: "#0d9488",
                color: "#fff",
                border: "none",
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Retry
            </button>
            <button
              onClick={handleLeaveCall}
              style={{
                background: "#9ca3af",
                color: "#fff",
                border: "none",
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        display: "flex",
        flexDirection: "column",
        background: "#000",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          height: "55px",
          background: "#111827",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
        }}
      >
        <span style={{ color: "#fff", fontWeight: 600 }}>
          {userRole === "doctor"
            ? "Doctor Consultation Portal"
            : "Patient Consultation Portal"}
        </span>
        <div style={{ display: "flex", gap: "10px" }}>
          {userRole === "doctor" && (
            <button
              onClick={handleDoctorEndCall}
              disabled={isEnding}
              style={{
                background: "#dc2626",
                color: "#fff",
                border: "none",
                padding: "6px 14px",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              {isEnding ? "Ending..." : "End Call For All"}
            </button>
          )}
          <button
            onClick={handleLeaveCall}
            style={{
              background: "#4b5563",
              color: "#fff",
              border: "none",
              padding: "6px 14px",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Leave
          </button>
        </div>
      </div>

      {joinLink && (
        <iframe
          title="100ms Video Consultation"
          src={joinLink}
          allow="camera; microphone; display-capture; autoplay; clipboard-write"
          style={{
            width: "100%",
            height: "calc(100vh - 55px)",
            border: "none",
          }}
        />
      )}
    </div>
  );
}
