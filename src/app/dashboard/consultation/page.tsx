// "use client";

// import { useEffect, useState } from "react";
// import AppointmentCard from "../../components/AppoinmentCard";
// import { API_BASE_URL } from "@/config/env";

// export default function ConsultationPage() {
//   const [appointments, setAppointments] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     async function fetchMyAppointments() {
//       try {
//         setLoading(true);
//         setError(null);

//         const token = localStorage.getItem("medistry_auth_token");
//         if (!token) {
//           setError("Aap logged in nahi hain. Kripya pehle login karein.");
//           setLoading(false);
//           return;
//         }

//         // Aapke backend ki appointments fetch karne wali API route
//         const response = await fetch(
//           `${API_BASE_URL}/api/appointments/patient`,
//           {
//             method: "GET",
//             headers: {
//               Authorization: `Bearer ${token}`,
//               "Content-Type": "application/json",
//             },
//           },
//         );

//         const data = await response.json();

//         if (!response.ok) {
//           throw new Error(
//             data?.message || "Appointments fetch karne me dikkat aayi.",
//           );
//         }

//         // Backend response se array nikalna
//         const list = Array.isArray(data)
//           ? data
//           : Array.isArray(data?.data)
//             ? data.data
//             : Array.isArray(data?.appointments)
//               ? data.appointments
//               : [];

//         setAppointments(list);
//       } catch (err: any) {
//         console.error("Fetch appointments error:", err);
//         setError(err.message || "Failed to load appointments");
//       } finally {
//         setLoading(false);
//       }
//     }

//     fetchMyAppointments();
//   }, []);

//   if (loading) {
//     return (
//       <div style={{ padding: "40px", textAlign: "center" }}>
//         <p style={{ color: "#4b5563" }}>
//           Aapki appointments load ho rahi hain...
//         </p>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div style={{ padding: "40px", textAlign: "center" }}>
//         <p style={{ color: "#dc2626" }}>{error}</p>
//       </div>
//     );
//   }

//   return (
//     <div style={{ padding: "30px", maxWidth: "800px", margin: "0 auto" }}>
//       <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "20px" }}>
//         My Appointments
//       </h2>

//       {appointments.length === 0 ? (
//         <p style={{ color: "#6b7280" }}>Koi upcoming appointment nahi mili.</p>
//       ) : (
//         appointments.map((item) => (
//           <AppointmentCard
//             key={item.AppointmentId || item.id}
//             appointment={item}
//           />
//         ))
//       )}

//       <button onClick={() => router.push(`/chat/${doctor.DoctorId}`)}>
//   Chat with Doctor
// </button>
//     </div>
//   );
// }

//=====

"use client";

import { useEffect, useState, useMemo } from "react";
import AppointmentCard, {
  AppointmentItem,
} from "../../components/AppoinmentCard";
import { API_BASE_URL } from "@/config/env";
import { CalendarCheck2, Clock, Calendar, Sparkles } from "lucide-react";
import styles from "./ConsultationPage.module.css";

export default function ConsultationPage() {
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

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

        const response = await fetch(
          `${API_BASE_URL}/api/appointments/patient`,
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

        const list: AppointmentItem[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data?.appointments)
              ? data.appointments
              : [];

        // Sort: Latest appointment date upar rahe
        const sortedList = [...list].sort((a, b) => {
          const dateA = new Date(a.SlotDate || a.BookedAt || 0).getTime();
          const dateB = new Date(b.SlotDate || b.BookedAt || 0).getTime();
          return dateB - dateA;
        });

        setAppointments(sortedList);
      } catch (err: any) {
        console.error("Fetch appointments error:", err);
        setError(err.message || "Failed to load appointments");
      } finally {
        setLoading(false);
      }
    }

    fetchMyAppointments();
  }, []);

  // Last / Latest appointment extract karna
  const lastAppointment = useMemo(() => {
    return appointments.length > 0 ? appointments[0] : null;
  }, [appointments]);

  // Pagination calculations
  const totalPages = Math.ceil(appointments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAppointments = appointments.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  if (loading) {
    return (
      <div className={styles.centerContainer}>
        <div className={styles.spinner}></div>
        <p className={styles.loadingText}>
          Aapki consultations load ho rahi hain...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.centerContainer}>
        <div className={styles.errorCard}>
          <p className={styles.errorHeading}>Dhyan Dein</p>
          <p className={styles.errorDesc}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className={styles.retryBtn}
          >
            Retry Karein
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.contentWrapper}>
        {/* Page Header */}
        {/* <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>
              My Consultations & Appointments
            </h1>
            <p className={styles.pageSubtitle}>
              Apni upcoming meetings join karein aur direct doctor se chat
              karein.
            </p>
          </div>
          <span className={styles.totalBadge}>
            Total: {appointments.length}
          </span>
        </div> */}

        {/* 🌟 Last / Upcoming Appointment Summary Card */}
        {lastAppointment && (
          <div className={styles.highlightBanner}>
            <div className={styles.bannerContent}>
              <div className={styles.bannerInfo}>
                <div className={styles.pillBadge}>
                  <Sparkles size={12} />
                  <span>Recent / Latest Appointment</span>
                </div>
                <h2 className={styles.doctorHeading}>
                  {lastAppointment.DoctorName || "Doctor Consultation"}
                </h2>
                <p className={styles.specializationSubtext}>
                  Specialization: {lastAppointment.Specialization || "General"}
                </p>
              </div>

              <div className={styles.bannerSchedulePill}>
                <div className={styles.scheduleDetail}>
                  <Calendar size={14} className={styles.blueIcon} />
                  <span>{lastAppointment.SlotDate || "Date TBD"}</span>
                </div>
                <span className={styles.scheduleDivider}>|</span>
                <div className={styles.scheduleDetail}>
                  <Clock size={14} className={styles.blueIcon} />
                  <span>{lastAppointment.StartTime || "Time TBD"}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Appointments List Section */}
        {appointments.length === 0 ? (
          <div className={styles.emptyStateCard}>
            <div className={styles.emptyStateIcon}>
              <CalendarCheck2 size={24} />
            </div>
            <p className={styles.emptyStateTitle}>
              Koi upcoming appointment nahi mili.
            </p>
            <p className={styles.emptyStateSubtitle}>
              Naye doctor ke sath appointment schedule karne ke liye booking
              portal par jayein.
            </p>
          </div>
        ) : (
          <div className={styles.appointmentsList}>
            {paginatedAppointments.map((item) => (
              <AppointmentCard
                key={item.AppointmentId || item.id}
                appointment={item}
              />
            ))}
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className={styles.paginationBar}>
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className={styles.paginationBtn}
            >
              ← Previous
            </button>
            <span className={styles.pageInfoText}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className={styles.paginationBtn}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
