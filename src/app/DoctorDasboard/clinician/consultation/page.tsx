"use client";

import { useEffect, useState } from "react";
import AppointmentCard from "../../../components/AppoinmentCard";
import { API_BASE_URL } from "@/config/env";

export default function ConsultationPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMyAppointments() {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("medistry_auth_token");
        if (!token) {
          setError("Aap logged in nahi hain. Kripya pehle login karein.");
          setLoading(false);
          return;
        }

        // Aapke backend ki appointments fetch karne wali API route
        const response = await fetch(
          `${API_BASE_URL}/api/appointments/doctor`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message || "Appointments fetch karne me dikkat aayi.",
          );
        }

        // Backend response se array nikalna
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data?.appointments)
              ? data.appointments
              : [];

        setAppointments(list);
      } catch (err: any) {
        console.error("Fetch appointments error:", err);
        setError(err.message || "Failed to load appointments");
      } finally {
        setLoading(false);
      }
    }

    fetchMyAppointments();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <p style={{ color: "#4b5563" }}>
          Aapki appointments load ho rahi hain...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <p style={{ color: "#dc2626" }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "30px", maxWidth: "800px", margin: "0 auto" }}>
      <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "20px" }}>
        My Appointments
      </h2>

      {appointments.length === 0 ? (
        <p style={{ color: "#6b7280" }}>Koi upcoming appointment nahi mili.</p>
      ) : (
        appointments.map((item) => (
          <AppointmentCard
            key={item.AppointmentId || item.id}
            appointment={item}
          />
        ))
      )}
    </div>
  );
}
