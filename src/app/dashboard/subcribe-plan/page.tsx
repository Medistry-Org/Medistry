// "use client";

// import { useEffect, useState, Suspense } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import s from "./select-doctor.module.css";

// type DoctorData = {
//   id: number;
//   fullName: string;
//   photoUrl: string | null;
//   rating: number | null;
//   consultationFee: number | null;
//   professionalDetails: {
//     specialization: string;
//     qualifications: string;
//     experience: string;
//     languages: string[];
//     about: string;
//   };
// };

// function DoctorSelectionContent() {
//   const router = useRouter();
//   const searchParams = useSearchParams();

//   const [authorized, setAuthorized] = useState<boolean>(false);
//   const [checking, setChecking] = useState<boolean>(true);
//   const [doctors, setDoctors] = useState<DoctorData[]>([]);
//   const [loading, setLoading] = useState<boolean>(true);

//   useEffect(() => {
//     const queryUserId =
//       searchParams.get("userId") ||
//       localStorage.getItem("current_subscribed_user");

//     if (!queryUserId) {
//       router.replace("/dashboard");
//       return;
//     }

//     try {
//       const records = JSON.parse(
//         localStorage.getItem("medistry_subscribed_users") || "{}",
//       );

//       if (
//         !records[String(queryUserId)] ||
//         !records[String(queryUserId)].planId
//       ) {
//         router.replace("/dashboard");
//         return;
//       }

//       setAuthorized(true);
//     } catch {
//       router.replace("/dashboard");
//     } finally {
//       setChecking(false);
//     }
//   }, [router, searchParams]);

//   useEffect(() => {
//     if (!authorized) return;

//     const fetchDoctors = async () => {
//       try {
//         setLoading(true);
//         const res = await fetch(
//           "https://mediapi.unios.in/api/doctors/dashboard-list",
//           {
//             headers: { Accept: "application/json" },
//           },
//         );
//         const result = await res.json();
//         const list = Array.isArray(result)
//           ? result
//           : Array.isArray(result?.data)
//             ? result.data
//             : Array.isArray(result?.doctors)
//               ? result.doctors
//               : [];

//         setDoctors(list);
//       } catch (err) {
//         console.error("Doctors load error:", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchDoctors();
//   }, [authorized]);

//   if (checking || !authorized) {
//     return <div className={s.centerStatus}>Verifying user subscription...</div>;
//   }

//   return (
//     <main className={s.page}>
//       <div className={s.container}>
//         <header className={s.header}>
//           <span className={s.badge}>Subscribed</span>
//           <h1>Select Doctor</h1>
//           <p>Choose an available doctor for your consultation.</p>
//         </header>

//         {loading ? (
//           <div className={s.centerStatus}>Loading doctors...</div>
//         ) : doctors.length === 0 ? (
//           <div className={s.centerStatus}>No doctors available.</div>
//         ) : (
//           <div className={s.doctorGrid}>
//             {doctors.map((doctor) => {
//               const details = doctor.professionalDetails;
//               return (
//                 <article key={doctor.id} className={s.doctorCard}>
//                   <div className={s.imageWrapper}>
//                     {doctor.photoUrl ? (
//                       <img
//                         src={doctor.photoUrl}
//                         alt={doctor.fullName}
//                         className={s.doctorImage}
//                       />
//                     ) : (
//                       <div className={s.avatarFallback}>Doctor</div>
//                     )}
//                     <span className={s.specBadge}>
//                       {details?.specialization || "Specialist"}
//                     </span>
//                   </div>

//                   <div className={s.info}>
//                     <h3>{doctor.fullName}</h3>
//                     <p className={s.qualifications}>
//                       {details?.qualifications || "Specialist"}
//                     </p>

//                     <div className={s.metaRow}>
//                       <span>Exp: {details?.experience || "N/A"}</span>
//                       <span>
//                         ★{" "}
//                         {doctor.rating != null
//                           ? doctor.rating.toFixed(1)
//                           : "5.0"}
//                       </span>
//                     </div>

//                     <button
//                       type="button"
//                       className={s.selectBtn}
//                       onClick={() => router.push(`/doctors/${doctor.id}`)}
//                     >
//                       Consult Now →
//                     </button>
//                   </div>
//                 </article>
//               );
//             })}
//           </div>
//         )}
//       </div>
//     </main>
//   );
// }

// export default function SelectDoctorPage() {
//   return (
//     <Suspense fallback={<div className={s.suspenseLoader}>Loading...</div>}>
//       <DoctorSelectionContent />
//     </Suspense>
//   );
// }

//===

"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import s from "./select-doctor.module.css";
import { API_BASE_URL } from "@/config/env";

type DoctorData = {
  id: number;
  fullName: string;
  photoUrl: string | null;
  rating: number | null;
  consultationFee: number | null;
  professionalDetails: {
    specialization: string;
    qualifications: string;
    experience: string;
    languages: string[];
    about: string;
  };
};

function DoctorSelectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [authorized, setAuthorized] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(true);
  const [doctors, setDoctors] = useState<DoctorData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const queryUserId =
      searchParams.get("userId") ||
      localStorage.getItem("current_subscribed_user");

    if (!queryUserId) {
      router.replace("/dashboard");
      return;
    }

    try {
      const records = JSON.parse(
        localStorage.getItem("medistry_subscribed_users") || "{}",
      );

      if (
        !records[String(queryUserId)] ||
        !records[String(queryUserId)].planId
      ) {
        router.replace("/dashboard");
        return;
      }

      // queueMicrotask se synchronous cascading re-render error resolve ho jata hai
      queueMicrotask(() => {
        setAuthorized(true);
        setChecking(false);
      });
    } catch {
      router.replace("/dashboard");
    }
  }, [router, searchParams]);

  useEffect(() => {
    if (!authorized) return;

    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/api/doctors/dashboard-list`, {
          headers: { Accept: "application/json" },
        });
        const result = await res.json();
        const list = Array.isArray(result)
          ? result
          : Array.isArray(result?.data)
            ? result.data
            : Array.isArray(result?.doctors)
              ? result.doctors
              : [];

        setDoctors(list);
      } catch (err) {
        console.error("Doctors load error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, [authorized]);

  if (checking || !authorized) {
    return <div className={s.centerStatus}>Verifying user subscription...</div>;
  }

  return (
    <main className={s.page}>
      <div className={s.container}>
        <header className={s.header}>
          <span className={s.badge}>Subscribed</span>
          <h1>Select Doctor</h1>
          <p>Choose an available doctor for your consultation.</p>
        </header>

        {loading ? (
          <div className={s.centerStatus}>Loading doctors...</div>
        ) : doctors.length === 0 ? (
          <div className={s.centerStatus}>No doctors available.</div>
        ) : (
          <div className={s.doctorGrid}>
            {doctors.map((doctor) => {
              const details = doctor.professionalDetails;
              return (
                <article key={doctor.id} className={s.doctorCard}>
                  <div className={s.imageWrapper}>
                    {doctor.photoUrl ? (
                      <img
                        src={doctor.photoUrl}
                        alt={doctor.fullName}
                        className={s.doctorImage}
                      />
                    ) : (
                      <div className={s.avatarFallback}>Doctor</div>
                    )}
                    <span className={s.specBadge}>
                      {details?.specialization || "Specialist"}
                    </span>
                  </div>

                  <div className={s.info}>
                    <h3>{doctor.fullName}</h3>
                    <p className={s.qualifications}>
                      {details?.qualifications || "Specialist"}
                    </p>

                    <div className={s.metaRow}>
                      <span>Exp: {details?.experience || "N/A"}</span>
                      <span>
                        ★{" "}
                        {doctor.rating != null
                          ? doctor.rating.toFixed(1)
                          : "5.0"}
                      </span>
                    </div>

                    <button
                      type="button"
                      className={s.selectBtn}
                      onClick={() => router.push(`/doctors/${doctor.id}`)}
                    >
                      Consult Now →
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

export default function SelectDoctorPage() {
  return (
    <Suspense fallback={<div className={s.suspenseLoader}>Loading...</div>}>
      <DoctorSelectionContent />
    </Suspense>
  );
}
