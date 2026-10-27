// // "use client";

// // import { useEffect, useMemo, useState } from "react";
// // import { CaretLeft, CaretRight } from "@phosphor-icons/react";
// // import { short, weekday } from "../account/bits";
// // import { ApptRow } from "./Today";
// // import { API_BASE_URL } from "@/config/env";
// // import c from "./Clinic.module.css";

// // const monthFmt = new Intl.DateTimeFormat("en-IN", {
// //   month: "long",
// //   year: "numeric",
// // });
// // const dayFmt = new Intl.DateTimeFormat("en-IN", {
// //   weekday: "long",
// //   day: "numeric",
// //   month: "long",
// // });
// // const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// // const formatToApiDate = (d: Date | string) => {
// //   const date = new Date(d);
// //   const year = date.getFullYear();
// //   const month = String(date.getMonth() + 1).padStart(2, "0");
// //   const day = String(date.getDate()).padStart(2, "0");
// //   return `${year}-${month}-${day}`;
// // };

// // export default function Schedule() {
// //   const [offset, setOffset] = useState<number>(0);
// //   const [picked, setPicked] = useState<string>(() => new Date().toDateString());
// //   const [appointments, setAppointments] = useState<any[]>([]);
// //   const [loading, setLoading] = useState<boolean>(false);
// //   const [error, setError] = useState<string | null>(null);

// //   const firstDay = useMemo(() => {
// //     const t = new Date();
// //     return new Date(t.getFullYear(), t.getMonth() + offset, 1);
// //   }, [offset]);

// //   const totalDaysInMonth = new Date(
// //     firstDay.getFullYear(),
// //     firstDay.getMonth() + 1,
// //     0,
// //   ).getDate();
// //   const leadingBlanks = (firstDay.getDay() + 6) % 7;
// //   const todayDateString = useMemo(() => new Date().toDateString(), []);

// //   useEffect(() => {
// //     const loadSchedule = async () => {
// //       try {
// //         setLoading(true);
// //         setError(null);

// //         const rawToken =
// //           localStorage.getItem("medistry_auth_token") ||
// //           localStorage.getItem("token") ||
// //           "";
// //         const token = rawToken.replace(/^"|"$/g, "").trim();

// //         if (!token) {
// //           throw new Error("Login token missing. Please log in.");
// //         }

// //         const dateParam = formatToApiDate(picked);

// //         const response = await fetch(
// //           `${API_BASE_URL}/api/appointments/doctor?date=${dateParam}`,
// //           {
// //             method: "GET",
// //             headers: {
// //               "Content-Type": "application/json",
// //               Authorization: `Bearer ${token}`,
// //             },
// //             cache: "no-store",
// //           },
// //         );

// //         const resData = await response.json();

// //         if (!response.ok || resData?.success === false) {
// //           throw new Error(
// //             resData?.message ||
// //               resData?.error ||
// //               `Failed to fetch schedule (${response.status})`,
// //           );
// //         }

// //         const dataList = Array.isArray(resData)
// //           ? resData
// //           : resData?.data?.queue ||
// //             resData?.data?.appointments ||
// //             resData?.queue ||
// //             resData?.data ||
// //             [];

// //         const formatted = dataList.map((item: any) => ({
// //           id: item.id || item._id || String(Math.random()),
// //           patient_id: item.patient_id || item.patientId || item.patient?._id,
// //           at:
// //             item.at ||
// //             item.appointmentDate ||
// //             item.date ||
// //             new Date(picked).toISOString(),
// //           type: item.type || item.appointmentType || "CONSULTATION",
// //           status: item.status || "BOOKED",
// //           patient: item.patient || { name: item.patientName || "Patient" },
// //         }));

// //         setAppointments(formatted);
// //       } catch (err: any) {
// //         console.error("Schedule error:", err);
// //         setError(err.message || "Failed to load schedule");
// //       } finally {
// //         setLoading(false);
// //       }
// //     };

// //     loadSchedule();
// //   }, [picked]);

// //   const handleMonthChange = (step: number) => {
// //     setOffset((prev) => prev + step);
// //     const t = new Date();
// //     const nextMonthFirst = new Date(
// //       t.getFullYear(),
// //       t.getMonth() + offset + step,
// //       1,
// //     );

// //     if (offset + step === 0) {
// //       setPicked(t.toDateString());
// //     } else {
// //       while (nextMonthFirst.getDay() === 0) {
// //         nextMonthFirst.setDate(nextMonthFirst.getDate() + 1);
// //       }
// //       setPicked(nextMonthFirst.toDateString());
// //     }
// //   };

// //   return (
// //     <main className={c.page}>
// //       <div className={c.hello}>
// //         <h1 className={c.h1}>Schedule</h1>
// //         <p className={c.sub}>
// //           <span className="num">{appointments.length}</span> consultations
// //           scheduled for {dayFmt.format(new Date(picked))}.
// //         </p>
// //       </div>

// //       <div className={c.schedGrid}>
// //         <section className={c.panel} aria-label="Month">
// //           <div className={c.monthHead}>
// //             <h2 className={c.h2}>{monthFmt.format(firstDay)}</h2>
// //             <div className={c.monthNav}>
// //               <button
// //                 type="button"
// //                 className={c.iconBtn}
// //                 onClick={() => handleMonthChange(-1)}
// //                 aria-label="Previous month"
// //               >
// //                 <CaretLeft size={16} />
// //               </button>
// //               {offset !== 0 && (
// //                 <button
// //                   type="button"
// //                   className={c.textBtn}
// //                   onClick={() => handleMonthChange(-offset)}
// //                 >
// //                   Today
// //                 </button>
// //               )}
// //               <button
// //                 type="button"
// //                 className={c.iconBtn}
// //                 onClick={() => handleMonthChange(1)}
// //                 aria-label="Next month"
// //               >
// //                 <CaretRight size={16} />
// //               </button>
// //             </div>
// //           </div>

// //           <div className={c.cal}>
// //             {WEEK.map((w) => (
// //               <span key={w} className={c.calHead}>
// //                 {w}
// //               </span>
// //             ))}
// //             {Array.from({ length: leadingBlanks }, (_, i) => (
// //               <span key={`blank-${i}`} />
// //             ))}
// //             {Array.from({ length: totalDaysInMonth }, (_, i) => {
// //               const currentDay = new Date(
// //                 firstDay.getFullYear(),
// //                 firstDay.getMonth(),
// //                 i + 1,
// //               );
// //               const dateStr = currentDay.toDateString();
// //               const isSunday = currentDay.getDay() === 0;

// //               return (
// //                 <button
// //                   key={dateStr}
// //                   type="button"
// //                   className={c.calDay}
// //                   aria-pressed={dateStr === picked}
// //                   data-today={dateStr === todayDateString}
// //                   data-off={isSunday}
// //                   onClick={() => setPicked(dateStr)}
// //                 >
// //                   <span className={`${c.calNum} num`}>{i + 1}</span>
// //                 </button>
// //               );
// //             })}
// //           </div>
// //           <p className={c.legend}>Sundays closed.</p>
// //         </section>

// //         <section className={c.panel}>
// //           <div className={c.panelHead}>
// //             <h2 className={c.h2}>
// //               {picked === todayDateString ? "Today, " : ""}
// //               {weekday(new Date(picked).toISOString())}{" "}
// //               {short(new Date(picked).toISOString())}
// //             </h2>
// //             <span className={`${c.count} num`}>{appointments.length}</span>
// //           </div>

// //           {loading && (
// //             <p className="p-4 text-center text-sm text-gray-500">
// //               Loading appointments...
// //             </p>
// //           )}

// //           {error && (
// //             <div className="m-4 rounded bg-red-50 p-3 text-center text-sm text-red-600">
// //               {error}
// //             </div>
// //           )}

// //           {!loading && !error && appointments.length > 0 && (
// //             <ol className={c.appts}>
// //               {appointments.map((appt) => (
// //                 <li key={appt.id}>
// //                   <ApptRow a={appt} patient={appt.patient} from="schedule" />
// //                 </li>
// //               ))}
// //             </ol>
// //           )}

// //           {!loading && !error && appointments.length === 0 && (
// //             <p className={c.empty}>No consultations booked for this day.</p>
// //           )}
// //         </section>
// //       </div>
// //     </main>
// //   );
// // }
// //=====

// "use client";

// import { useEffect, useMemo, useState } from "react";
// import { CaretLeft, CaretRight } from "@phosphor-icons/react";
// import { short, weekday } from "../account/bits";
// import { ApptRow } from "./Today";
// import { API_BASE_URL } from "@/config/env";
// import c from "./Clinic.module.css";

// const monthFmt = new Intl.DateTimeFormat("en-IN", {
//   month: "long",
//   year: "numeric",
// });
// const dayFmt = new Intl.DateTimeFormat("en-IN", {
//   weekday: "long",
//   day: "numeric",
//   month: "long",
// });
// const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// const formatToApiDate = (d: Date | string) => {
//   const date = new Date(d);
//   const year = date.getFullYear();
//   const month = String(date.getMonth() + 1).padStart(2, "0");
//   const day = String(date.getDate()).padStart(2, "0");
//   return `${year}-${month}-${day}`;
// };

// export default function Schedule() {
//   const [offset, setOffset] = useState<number>(0);
//   const [picked, setPicked] = useState<string>(() => new Date().toDateString());
//   const [appointments, setAppointments] = useState<any[]>([]);
//   const [loading, setLoading] = useState<boolean>(false);
//   const [error, setError] = useState<string | null>(null);

//   // Month navigation logic
//   const firstDay = useMemo(() => {
//     const t = new Date();
//     return new Date(t.getFullYear(), t.getMonth() + offset, 1);
//   }, [offset]);

//   const totalDaysInMonth = new Date(
//     firstDay.getFullYear(),
//     firstDay.getMonth() + 1,
//     0,
//   ).getDate();
//   const leadingBlanks = (firstDay.getDay() + 6) % 7;
//   const todayDateString = useMemo(() => new Date().toDateString(), []);

//   // Backend API Call
//   useEffect(() => {
//     const loadSchedule = async () => {
//       try {
//         setLoading(true);
//         setError(null);

//         const rawToken =
//           localStorage.getItem("medistry_auth_token") ||
//           localStorage.getItem("token") ||
//           "";
//         const token = rawToken.replace(/^"|"$/g, "").trim();

//         if (!token) {
//           throw new Error("Login token missing. Please log in.");
//         }

//         const dateParam = formatToApiDate(picked);

//         const response = await fetch(
//           `${API_BASE_URL}/api/appointments/doctor?date=${dateParam}`,
//           {
//             method: "GET",
//             headers: {
//               "Content-Type": "application/json",
//               Authorization: `Bearer ${token}`,
//             },
//             cache: "no-store",
//           },
//         );

//         const resData = await response.json();

//         if (!response.ok || resData?.success === false) {
//           throw new Error(
//             resData?.message ||
//               resData?.error ||
//               `Failed to fetch schedule (${response.status})`,
//           );
//         }

//         const rawList = Array.isArray(resData?.data)
//           ? resData.data
//           : Array.isArray(resData)
//             ? resData
//             : [];

//         // Backend response ko ApptRow ke format me map karna
//         const formatted = rawList.map((item: any) => {
//           // Date + StartTime ("10:30") se proper ISO Date string banana
//           let apptDateTime = new Date(picked);
//           if (item.StartTime) {
//             const [hours, minutes] = item.StartTime.split(":").map(Number);
//             apptDateTime.setHours(hours || 0, minutes || 0, 0, 0);
//           }

//           const patientDisplayName =
//             item.FirstName ||
//             (item.PatientPhone
//               ? `Patient (${item.PatientPhone.slice(-4)})`
//               : null) ||
//             `Patient #${item.PatientId || ""}`;

//           return {
//             id: String(item.AppointmentId || Math.random()),
//             patient_id: item.PatientId ? String(item.PatientId) : null,
//             name: patientDisplayName,
//             at: apptDateTime.toISOString(),
//             type:
//               item.ConsultationType?.toUpperCase() === "FIRST_CONSULTATION"
//                 ? "FIRST_CONSULTATION"
//                 : "FOLLOW_UP",
//             status: (item.Status || "BOOKED").toUpperCase(),
//             reason: item.Reason || "Consultation",
//             patient: {
//               id: String(item.PatientId || ""),
//               name: patientDisplayName,
//               age: item.Age || "N/A",
//               sex: item.Gender || "N/A",
//               mobile: item.PatientPhone || "",
//             },
//           };
//         });

//         setAppointments(formatted);
//       } catch (err: any) {
//         console.error("Schedule error:", err);
//         setError(err.message || "Failed to load schedule");
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadSchedule();
//   }, [picked]);

//   const handleMonthChange = (step: number) => {
//     setOffset((prev) => prev + step);
//     const t = new Date();
//     const nextMonthFirst = new Date(
//       t.getFullYear(),
//       t.getMonth() + offset + step,
//       1,
//     );

//     if (offset + step === 0) {
//       setPicked(t.toDateString());
//     } else {
//       while (nextMonthFirst.getDay() === 0) {
//         nextMonthFirst.setDate(nextMonthFirst.getDate() + 1);
//       }
//       setPicked(nextMonthFirst.toDateString());
//     }
//   };

//   return (
//     <main className={c.page}>
//       <div className={c.hello}>
//         <h1 className={c.h1}>Schedule</h1>
//         <p className={c.sub}>
//           <span className="num">{appointments.length}</span> consultations
//           scheduled for {dayFmt.format(new Date(picked))}.
//         </p>
//       </div>

//       <div className={c.schedGrid}>
//         {/* Calendar Column */}
//         <section className={c.panel} aria-label="Month">
//           <div className={c.monthHead}>
//             <h2 className={c.h2}>{monthFmt.format(firstDay)}</h2>
//             <div className={c.monthNav}>
//               <button
//                 type="button"
//                 className={c.iconBtn}
//                 onClick={() => handleMonthChange(-1)}
//                 aria-label="Previous month"
//               >
//                 <CaretLeft size={16} />
//               </button>
//               {offset !== 0 && (
//                 <button
//                   type="button"
//                   className={c.textBtn}
//                   onClick={() => handleMonthChange(-offset)}
//                 >
//                   Today
//                 </button>
//               )}
//               <button
//                 type="button"
//                 className={c.iconBtn}
//                 onClick={() => handleMonthChange(1)}
//                 aria-label="Next month"
//               >
//                 <CaretRight size={16} />
//               </button>
//             </div>
//           </div>

//           <div className={c.cal}>
//             {WEEK.map((w) => (
//               <span key={w} className={c.calHead}>
//                 {w}
//               </span>
//             ))}
//             {Array.from({ length: leadingBlanks }, (_, i) => (
//               <span key={`blank-${i}`} />
//             ))}
//             {Array.from({ length: totalDaysInMonth }, (_, i) => {
//               const currentDay = new Date(
//                 firstDay.getFullYear(),
//                 firstDay.getMonth(),
//                 i + 1,
//               );
//               const dateStr = currentDay.toDateString();
//               const isSunday = currentDay.getDay() === 0;
//               const isPicked = dateStr === picked;

//               // Selected date ke liye booked count display karna
//               const bookedCount = isPicked ? appointments.length : 0;

//               return (
//                 <button
//                   key={dateStr}
//                   type="button"
//                   className={c.calDay}
//                   aria-pressed={isPicked}
//                   data-today={dateStr === todayDateString}
//                   data-off={isSunday}
//                   onClick={() => setPicked(dateStr)}
//                 >
//                   <span className={`${c.calNum} num`}>{i + 1}</span>
//                   {!isSunday && bookedCount > 0 && (
//                     <span className={`${c.calCount} num`}>
//                       {bookedCount}
//                       <span className={c.calWord}> booked</span>
//                     </span>
//                   )}
//                 </button>
//               );
//             })}
//           </div>
//           <p className={c.legend}>Sundays closed.</p>
//         </section>

//         {/* Selected Day Queue Column */}
//         <section className={c.panel}>
//           <div className={c.panelHead}>
//             <h2 className={c.h2}>
//               {picked === todayDateString ? "Today, " : ""}
//               {weekday(new Date(picked).toISOString())}{" "}
//               {short(new Date(picked).toISOString())}
//             </h2>
//             <span className={`${c.count} num`}>{appointments.length}</span>
//           </div>

//           {loading && (
//             <p className="p-4 text-center text-sm text-gray-500">
//               Loading appointments...
//             </p>
//           )}

//           {error && (
//             <div className="m-4 rounded bg-red-50 p-3 text-center text-sm text-red-600">
//               {error}
//             </div>
//           )}

//           {!loading && !error && appointments.length > 0 && (
//             <ol className={c.appts}>
//               {appointments.map((appt) => (
//                 <li key={appt.id}>
//                   <ApptRow a={appt} patient={appt.patient} from="schedule" />
//                 </li>
//               ))}
//             </ol>
//           )}

//           {!loading && !error && appointments.length === 0 && (
//             <p className={c.empty}>No consultations booked for this day.</p>
//           )}
//         </section>
//       </div>
//     </main>
//   );
// }
//=================

"use client";

import { useEffect, useMemo, useState } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { short, weekday } from "../account/bits";
import { ApptRow } from "./Today";
import { API_BASE_URL } from "@/config/env";
import c from "./Clinic.module.css";

const monthFmt = new Intl.DateTimeFormat("en-IN", {
  month: "long",
  year: "numeric",
});

const dayFmt = new Intl.DateTimeFormat("en-IN", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const formatToApiDate = (d: Date | string) => {
  const date = new Date(d);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Types for Appointments and API Response
interface RawApptItem {
  AppointmentId?: string | number;
  id?: string | number;
  _id?: string | number;
  PatientId?: string | number;
  patient_id?: string | number;
  patientId?: string | number;
  StartTime?: string;
  FirstName?: string;
  PatientPhone?: string;
  ConsultationType?: string;
  appointmentType?: string;
  type?: string;
  Status?: string;
  status?: string;
  Reason?: string;
  Age?: number | string;
  Gender?: string;
  at?: string;
  appointmentDate?: string;
  date?: string;
  patientName?: string;
  patient?: {
    id?: string;
    _id?: string;
    name?: string;
    age?: number | string;
    sex?: string;
    mobile?: string;
  };
}

interface FormattedPatient {
  id: string;
  name: string;
  age: number | string;
  sex: string;
  mobile: string;
}

interface FormattedAppointment {
  id: string;
  patient_id: string | null;
  name: string;
  at: string;
  type: string;
  status: string;
  reason: string;
  patient: FormattedPatient;
}

export default function Schedule() {
  const [offset, setOffset] = useState<number>(0);
  const [picked, setPicked] = useState<string>(() => new Date().toDateString());
  const [appointments, setAppointments] = useState<FormattedAppointment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Month navigation logic
  const firstDay = useMemo(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth() + offset, 1);
  }, [offset]);

  const totalDaysInMonth = new Date(
    firstDay.getFullYear(),
    firstDay.getMonth() + 1,
    0,
  ).getDate();
  const leadingBlanks = (firstDay.getDay() + 6) % 7;
  const todayDateString = useMemo(() => new Date().toDateString(), []);

  // Backend API Call
  useEffect(() => {
    const loadSchedule = async () => {
      try {
        setLoading(true);
        setError(null);

        const rawToken =
          localStorage.getItem("medistry_auth_token") ||
          localStorage.getItem("token") ||
          "";
        const token = rawToken.replace(/^"|"$/g, "").trim();

        if (!token) {
          throw new Error("Login token missing. Please log in.");
        }

        const dateParam = formatToApiDate(picked);

        const response = await fetch(
          `${API_BASE_URL}/api/appointments/doctor?date=${dateParam}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          },
        );

        const resData = await response.json();

        if (!response.ok || resData?.success === false) {
          throw new Error(
            resData?.message ||
              resData?.error ||
              `Failed to fetch schedule (${response.status})`,
          );
        }

        const rawList: RawApptItem[] = Array.isArray(resData?.data)
          ? resData.data
          : Array.isArray(resData)
            ? resData
            : [];

        // Backend response ko ApptRow ke format me map karna
        const formatted: FormattedAppointment[] = rawList.map(
          (item: RawApptItem) => {
            // Date + StartTime ("10:30") se proper ISO Date string banana
            const apptDateTime = new Date(picked);
            if (item.StartTime) {
              const [hours, minutes] = item.StartTime.split(":").map(Number);
              apptDateTime.setHours(hours || 0, minutes || 0, 0, 0);
            }

            const patientDisplayName =
              item.FirstName ||
              (item.PatientPhone
                ? `Patient (${item.PatientPhone.slice(-4)})`
                : null) ||
              `Patient #${item.PatientId || ""}`;

            return {
              id: String(item.AppointmentId || Math.random()),
              patient_id: item.PatientId ? String(item.PatientId) : null,
              name: patientDisplayName,
              at: apptDateTime.toISOString(),
              type:
                item.ConsultationType?.toUpperCase() === "FIRST_CONSULTATION"
                  ? "FIRST_CONSULTATION"
                  : "FOLLOW_UP",
              status: (item.Status || "BOOKED").toUpperCase(),
              reason: item.Reason || "Consultation",
              patient: {
                id: String(item.PatientId || ""),
                name: patientDisplayName,
                age: item.Age || "N/A",
                sex: item.Gender || "N/A",
                mobile: item.PatientPhone || "",
              },
            };
          },
        );

        setAppointments(formatted);
      } catch (err: unknown) {
        console.error("Schedule error:", err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to load schedule");
        }
      } finally {
        setLoading(false);
      }
    };

    loadSchedule();
  }, [picked]);

  const handleMonthChange = (step: number) => {
    setOffset((prev) => prev + step);
    const t = new Date();
    const nextMonthFirst = new Date(
      t.getFullYear(),
      t.getMonth() + offset + step,
      1,
    );

    if (offset + step === 0) {
      setPicked(t.toDateString());
    } else {
      while (nextMonthFirst.getDay() === 0) {
        nextMonthFirst.setDate(nextMonthFirst.getDate() + 1);
      }
      setPicked(nextMonthFirst.toDateString());
    }
  };

  return (
    <main className={c.page}>
      <div className={c.hello}>
        <h1 className={c.h1}>Schedule</h1>
        <p className={c.sub}>
          <span className="num">{appointments.length}</span> consultations
          scheduled for {dayFmt.format(new Date(picked))}.
        </p>
      </div>

      <div className={c.schedGrid}>
        {/* Calendar Column */}
        <section className={c.panel} aria-label="Month">
          <div className={c.monthHead}>
            <h2 className={c.h2}>{monthFmt.format(firstDay)}</h2>
            <div className={c.monthNav}>
              <button
                type="button"
                className={c.iconBtn}
                onClick={() => handleMonthChange(-1)}
                aria-label="Previous month"
              >
                <CaretLeft size={16} />
              </button>
              {offset !== 0 && (
                <button
                  type="button"
                  className={c.textBtn}
                  onClick={() => handleMonthChange(-offset)}
                >
                  Today
                </button>
              )}
              <button
                type="button"
                className={c.iconBtn}
                onClick={() => handleMonthChange(1)}
                aria-label="Next month"
              >
                <CaretRight size={16} />
              </button>
            </div>
          </div>

          <div className={c.cal}>
            {WEEK.map((w) => (
              <span key={w} className={c.calHead}>
                {w}
              </span>
            ))}
            {Array.from({ length: leadingBlanks }, (_, i) => (
              <span key={`blank-${i}`} />
            ))}
            {Array.from({ length: totalDaysInMonth }, (_, i) => {
              const currentDay = new Date(
                firstDay.getFullYear(),
                firstDay.getMonth(),
                i + 1,
              );
              const dateStr = currentDay.toDateString();
              const isSunday = currentDay.getDay() === 0;
              const isPicked = dateStr === picked;

              // Selected date ke liye booked count display karna
              const bookedCount = isPicked ? appointments.length : 0;

              return (
                <button
                  key={dateStr}
                  type="button"
                  className={c.calDay}
                  aria-pressed={isPicked}
                  data-today={dateStr === todayDateString}
                  data-off={isSunday}
                  onClick={() => setPicked(dateStr)}
                >
                  <span className={`${c.calNum} num`}>{i + 1}</span>
                  {!isSunday && bookedCount > 0 && (
                    <span className={`${c.calCount} num`}>
                      {bookedCount}
                      <span className={c.calWord}> booked</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <p className={c.legend}>Sundays closed.</p>
        </section>

        {/* Selected Day Queue Column */}
        <section className={c.panel}>
          <div className={c.panelHead}>
            <h2 className={c.h2}>
              {picked === todayDateString ? "Today, " : ""}
              {weekday(new Date(picked).toISOString())}{" "}
              {short(new Date(picked).toISOString())}
            </h2>
            <span className={`${c.count} num`}>{appointments.length}</span>
          </div>

          {loading && (
            <p className="p-4 text-center text-sm text-gray-500">
              Loading appointments...
            </p>
          )}

          {error && (
            <div className="m-4 rounded bg-red-50 p-3 text-center text-sm text-red-600">
              {error}
            </div>
          )}

          {!loading && !error && appointments.length > 0 && (
            <ol className={c.appts}>
              {appointments.map((appt) => (
                <li key={appt.id}>
                  <ApptRow a={appt} patient={appt.patient} from="schedule" />
                </li>
              ))}
            </ol>
          )}

          {!loading && !error && appointments.length === 0 && (
            <p className={c.empty}>No consultations booked for this day.</p>
          )}
        </section>
      </div>
    </main>
  );
}
