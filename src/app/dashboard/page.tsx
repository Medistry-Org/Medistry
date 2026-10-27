// // "use client";

// // import { useEffect, useState } from "react";
// // import { useRouter } from "next/navigation";
// // import s from "./dashboard.module.css";

// // type DoctorData = {
// //   id: number;
// //   fullName: string;
// //   photoUrl: string | null;
// //   rating: number | null;
// //   consultationFee: number | null;
// //   professionalDetails: {
// //     specialization: string;
// //     qualifications: string;
// //     experience: string;
// //     languages: string[];
// //     about: string;
// //   };
// // };

// // type SubscriptionPlan = {
// //   PlanId: number;
// //   PlanName: string;
// //   DurationMonths: number;
// //   Price: number | null;
// //   IsActive: boolean;
// //   CreatedAt: string;
// //   Perks: string[];
// // };

// // type UserData = {
// //   userId?: number | string;
// //   UserId?: number | string;
// //   id?: number | string;
// //   Id?: number | string;
// //   name?: string;
// //   fullName?: string;
// //   mobile?: string;
// // };

// // export default function DashboardPage() {
// //   const router = useRouter();

// //   const [user, setUser] = useState<UserData | null>(null);
// //   const [doctors, setDoctors] = useState<DoctorData[]>([]);
// //   const [doctorLoading, setDoctorLoading] = useState(true);
// //   const [doctorError, setDoctorError] = useState("");

// //   const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
// //   const [plansLoading, setPlansLoading] = useState(true);
// //   const [plansError, setPlansError] = useState("");

// //   const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
// //   const [inputUserId, setInputUserId] = useState<string>("");
// //   const [subscribing, setSubscribing] = useState(false);
// //   const [modalError, setModalError] = useState("");

// //   useEffect(() => {
// //     try {
// //       const savedUser =
// //         localStorage.getItem("medistry_user") ||
// //         localStorage.getItem("medistry_customer") ||
// //         localStorage.getItem("auth_user");

// //       if (savedUser) {
// //         const parsed = JSON.parse(savedUser);
// //         setUser(parsed);
// //         const currentId =
// //           parsed?.userId || parsed?.UserId || parsed?.id || parsed?.Id;
// //         if (currentId) {
// //           setInputUserId(String(currentId));
// //         }
// //       }
// //     } catch (err) {
// //       console.error("Local storage error:", err);
// //     }
// //   }, []);

// //   useEffect(() => {
// //     let cancelled = false;

// //     const fetchDoctors = async () => {
// //       try {
// //         setDoctorLoading(true);
// //         setDoctorError("");
// //         const res = await fetch(
// //           "https://mediapi.unios.in/api/doctors/dashboard-list",
// //           {
// //             headers: { Accept: "application/json" },
// //           },
// //         );
// //         if (!res.ok) throw new Error(`Status: ${res.status}`);
// //         const result = await res.json();
// //         const list = Array.isArray(result)
// //           ? result
// //           : Array.isArray(result?.data)
// //             ? result.data
// //             : Array.isArray(result?.doctors)
// //               ? result.doctors
// //               : [];

// //         if (!cancelled) setDoctors(list);
// //       } catch {
// //         if (!cancelled) setDoctorError("Doctors load nahi ho paaye.");
// //       } finally {
// //         if (!cancelled) setDoctorLoading(false);
// //       }
// //     };

// //     const fetchPlans = async () => {
// //       try {
// //         setPlansLoading(true);
// //         setPlansError("");
// //         const res = await fetch(
// //           "https://mediapi.unios.in/api/subscriptions/plans",
// //           {
// //             headers: { Accept: "application/json" },
// //           },
// //         );
// //         const result = await res.json();

// //         if (
// //           !res.ok ||
// //           result?.success !== true ||
// //           !Array.isArray(result.data)
// //         ) {
// //           throw new Error(result?.message || "Plans load failed");
// //         }

// //         if (!cancelled) setPlans(result.data);
// //       } catch {
// //         if (!cancelled) setPlansError("Subscription plans load nahi ho paaye.");
// //       } finally {
// //         if (!cancelled) setPlansLoading(false);
// //       }
// //     };

// //     fetchDoctors();
// //     fetchPlans();

// //     return () => {
// //       cancelled = true;
// //     };
// //   }, []);

// //   const handleOpenBuyModal = (planId: number) => {
// //     setSelectedPlanId(planId);
// //     setModalError("");
// //   };

// //   const handleCloseModal = () => {
// //     setSelectedPlanId(null);
// //     setModalError("");
// //   };

// //   const handleBuyPlan = async () => {
// //     if (!selectedPlanId) return;

// //     const finalUserId = inputUserId.trim();
// //     if (!finalUserId) {
// //       setModalError("Kripya User ID fill karein.");
// //       return;
// //     }

// //     try {
// //       setSubscribing(true);
// //       setModalError("");

// //       // 1. LocalStorage se Auth Token uthao
// //       const token =
// //         localStorage.getItem("medistry_auth_token") ||
// //         localStorage.getItem("auth_token") ||
// //         localStorage.getItem("token");

// //       const payload = {
// //         targetUserId: isNaN(Number(finalUserId))
// //           ? finalUserId
// //           : Number(finalUserId),
// //         planId: selectedPlanId,
// //       };

// //       const headers: Record<string, string> = {
// //         "Content-Type": "application/json",
// //         Accept: "application/json",
// //       };

// //       if (token) {
// //         headers["Authorization"] = `Bearer ${token.replace(/^"|"$/g, "")}`;
// //       }

// //       const res = await fetch(
// //         "https://mediapi.unios.in/api/subscriptions/activate",
// //         {
// //           method: "POST",
// //           headers,
// //           body: JSON.stringify(payload),
// //         },
// //       );

// //       const data = await res.json();

// //       // 2. Agar backend ne NOT_AUTHORISED diya aur abhi sirf testing karni hai:
// //       if (!res.ok || data?.success === false) {
// //         if (data?.error === "NOT_AUTHORISED" && !token) {
// //           // Testing Bypass: Login token na hone par bhi testing flow continue hoga
// //           console.warn("Auth token missing, continuing in testing mode.");
// //         } else {
// //           throw new Error(data?.message || data?.error || "Plan buy failed.");
// //         }
// //       }

// //       // 3. User-wise Subscription local save karo
// //       const activeSubscriptions = JSON.parse(
// //         localStorage.getItem("medistry_subscribed_users") || "{}",
// //       );
// //       activeSubscriptions[String(finalUserId)] = {
// //         planId: selectedPlanId,
// //         activatedAt: new Date().toISOString(),
// //       };
// //       localStorage.setItem(
// //         "medistry_subscribed_users",
// //         JSON.stringify(activeSubscriptions),
// //       );
// //       localStorage.setItem("current_subscribed_user", String(finalUserId));

// //       handleCloseModal();

// //       // 4. Redirect to doctors page
// //       router.push(
// //         `/consultations/select-doctor?userId=${encodeURIComponent(finalUserId)}`,
// //       );
// //     } catch (err) {
// //       setModalError(err instanceof Error ? err.message : "Error buying plan.");
// //     } finally {
// //       setSubscribing(false);
// //     }
// //   };

// //   const displayName = user?.fullName || user?.name || "there";

// //   return (
// //     <main className={s.page}>
// //       <div className={s.container}>
// //         {/* Welcome */}
// //         <section className={s.welcome}>
// //           <h1>Good afternoon, {displayName}.</h1>
// //           <p>Welcome to Medistry</p>
// //         </section>

// //         {/* Top Grid */}
// //         <section className={s.topGrid}>
// //           <article className={s.weightCard}>
// //             <div className={s.cardTop}>
// //               <span className={s.cardLabel}>Your weight</span>
// //               <button className={s.progressBtn}>
// //                 Progress <span>›</span>
// //               </button>
// //             </div>
// //             <div className={s.weightRow}>
// //               <strong>78.0</strong>
// //               <span className={s.kg}>kg</span>
// //               <span className={s.firstReading}>First reading, 8 Oct</span>
// //             </div>
// //             <p className={s.weightDescription}>
// //               Weigh twice a week, before breakfast, and your line starts here.
// //             </p>
// //             <div className={s.weightActions}>
// //               <button className={s.primaryBtn}>
// //                 <span>＋</span> Log weight
// //               </button>
// //               <button className={s.secondaryBtn}>
// //                 <span>⌁</span> Log a symptom
// //               </button>
// //             </div>
// //           </article>

// //           <div className={s.rightColumn}>
// //             <article className={s.appointmentCard}>
// //               <div className={s.appointmentIcon}>▣</div>
// //               <div className={s.appointmentInfo}>
// //                 <strong>Today, 5:00 pm</strong>
// //                 <span>Join opens at 4:50 pm</span>
// //               </div>
// //               <span className={s.arrow}>›</span>
// //             </article>

// //             <button className={s.chatButton}>
// //               <span>☏</span>
// //               <small>Chat</small>
// //             </button>
// //           </div>
// //         </section>

// //         {/* Doctors Section */}
// //         <section className={s.doctorsSection}>
// //           <div className={s.doctorsHeader}>
// //             <div>
// //               <span className={s.sectionEyebrow}>YOUR HEALTHCARE TEAM</span>
// //               <h2>Meet Our Doctors</h2>
// //               <p>Find the right specialist for your health.</p>
// //             </div>
// //             <span className={s.doctorCount}>{doctors.length} Doctors</span>
// //           </div>

// //           {doctorLoading ? (
// //             <div className={s.doctorMessage}>Loading doctors...</div>
// //           ) : doctorError ? (
// //             <div className={s.doctorMessage}>{doctorError}</div>
// //           ) : (
// //             <div className={s.doctorGrid}>
// //               {doctors.map((doctor) => {
// //                 const details = doctor.professionalDetails;
// //                 return (
// //                   <article className={s.doctorCard} key={doctor.id}>
// //                     <div className={s.doctorImageWrapper}>
// //                       {doctor.photoUrl ? (
// //                         <img
// //                           className={s.doctorImage}
// //                           src={doctor.photoUrl}
// //                           alt={doctor.fullName}
// //                           loading="lazy"
// //                         />
// //                       ) : (
// //                         <div className={s.imageFallback}>Doctor</div>
// //                       )}
// //                       <span className={s.specialtyBadge}>
// //                         {details?.specialization || "Specialist"}
// //                       </span>
// //                     </div>

// //                     <div className={s.doctorCardBody}>
// //                       <div className={s.doctorIdentity}>
// //                         <h3>{doctor.fullName}</h3>
// //                         <p className={s.doctorQualifications}>
// //                           {details?.qualifications || "Specialist"}
// //                         </p>
// //                       </div>

// //                       <div className={s.doctorStats}>
// //                         <div className={s.doctorStat}>
// //                           <span className={s.statLabel}>Experience</span>
// //                           <strong>{details?.experience || "N/A"}</strong>
// //                         </div>
// //                         <div className={s.doctorStat}>
// //                           <span className={s.statLabel}>Fee</span>
// //                           <strong>₹{doctor.consultationFee || 0}</strong>
// //                         </div>
// //                       </div>

// //                       <button
// //                         type="button"
// //                         className={s.viewDoctorButton}
// //                         onClick={() => router.push(`/doctors/${doctor.id}`)}
// //                       >
// //                         View Profile →
// //                       </button>
// //                     </div>
// //                   </article>
// //                 );
// //               })}
// //             </div>
// //           )}
// //         </section>

// //         {/* Subscription Plans Section */}
// //         <section className={s.subscriptionSection}>
// //           <div className={s.subscriptionHeader}>
// //             <div>
// //               <span className={s.subscriptionEyebrow}>MEMBERSHIP</span>
// //               <h2>Choose Your Subscription Plan</h2>
// //               <p>Select a plan to unlock full doctor consultations.</p>
// //             </div>
// //             <span className={s.planCount}>{plans.length} Plans</span>
// //           </div>

// //           {plansLoading ? (
// //             <div className={s.subscriptionMessage}>Loading plans...</div>
// //           ) : plansError ? (
// //             <div className={s.subscriptionMessage}>{plansError}</div>
// //           ) : (
// //             // <div className={s.subscriptionGrid}>
// //             //   {plans.map((plan) => (
// //             //     <article className={s.subscriptionCard} key={plan.PlanId}>
// //             //       <div className={s.subscriptionCardTop}>
// //             //         <h3>Plan ID: {plan.PlanId}</h3>
// //             //         <p className={s.planDuration}>
// //             //           {plan.DurationMonths}{" "}
// //             //           {plan.DurationMonths === 1 ? "Month" : "Months"}
// //             //         </p>
// //             //         <div className={s.planPrice}>
// //             //           {plan.Price != null
// //             //             ? `₹${plan.Price.toLocaleString("en-IN")}`
// //             //             : "Free"}
// //             //         </div>
// //             //       </div>

// //             //       <div className={s.planPerks}>
// //             //         <ul>
// //             //           {plan.Perks?.map((perk, idx) => (
// //             //             <li key={idx}>✓ {perk}</li>
// //             //           ))}
// //             //         </ul>
// //             //       </div>

// //             //       <button
// //             //         type="button"
// //             //         className={s.subscribeBtn}
// //             //         disabled={!plan.IsActive}
// //             //         onClick={() => handleOpenBuyModal(plan.PlanId)}
// //             //       >
// //             //         {!plan.IsActive ? "Inactive" : "Buy Plan →"}
// //             //       </button>
// //             //     </article>
// //             //   ))}
// //             // </div>

// //             <div className={s.subscriptionGrid}>
// //               {plans.map((plan) => (
// //                 <article className={s.subscriptionCard} key={plan.PlanId}>
// //                   <div className={s.subscriptionCardTop}>
// //                     <div className={s.planTitleRow}>
// //                       <div className={s.planIcon}>
// //                         {plan.DurationMonths >= 6 ? "✦" : "♡"}
// //                       </div>

// //                       <span
// //                         className={
// //                           plan.IsActive
// //                             ? s.activePlanBadge
// //                             : s.inactivePlanBadge
// //                         }
// //                       >
// //                         {plan.IsActive ? "Available" : "Unavailable"}
// //                       </span>
// //                     </div>

// //                     <h3>{plan.PlanName}</h3>

// //                     <p className={s.planDuration}>
// //                       {plan.DurationMonths}{" "}
// //                       {plan.DurationMonths === 1 ? "Month" : "Months"}
// //                     </p>

// //                     <div className={s.planPrice}>
// //                       {plan.Price != null
// //                         ? `₹${plan.Price.toLocaleString("en-IN")}`
// //                         : "Free"}
// //                     </div>

// //                     {plan.Price == null && (
// //                       <span className={s.priceCaption}>No price specified</span>
// //                     )}
// //                   </div>

// //                   <div className={s.planPerks}>
// //                     <h4>Plan Benefits</h4>

// //                     {plan.Perks?.length ? (
// //                       <ul>
// //                         {plan.Perks.map((perk, index) => (
// //                           <li key={`${plan.PlanId}-${index}`}>
// //                             <span className={s.perkCheck}>✓</span>
// //                             <span>{perk}</span>
// //                           </li>
// //                         ))}
// //                       </ul>
// //                     ) : (
// //                       <p>No benefits listed for this plan.</p>
// //                     )}
// //                   </div>

// //                   <div className={s.planCardFooter}>
// //                     <span>
// //                       {plan.IsActive
// //                         ? "Ready to get started?"
// //                         : "This plan is currently unavailable"}
// //                     </span>
// //                   </div>

// //                   <button
// //                     type="button"
// //                     className={s.subscribeBtn}
// //                     disabled={!plan.IsActive}
// //                     onClick={() => handleOpenBuyModal(plan.PlanId)}
// //                   >
// //                     {!plan.IsActive ? "Unavailable" : "Subscribe Now →"}
// //                   </button>
// //                 </article>
// //               ))}
// //             </div>
// //           )}
// //         </section>
// //       </div>

// //       {/* Modal with External CSS Module */}
// //       {selectedPlanId !== null && (
// //         <div className={s.modalOverlay}>
// //           <div className={s.modalBox}>
// //             <div className={s.modalHeader}>
// //               <strong className={s.modalTitle}>
// //                 Plan ID: {selectedPlanId}
// //               </strong>
// //               <button
// //                 type="button"
// //                 onClick={handleCloseModal}
// //                 className={s.modalCloseBtn}
// //               >
// //                 ✕
// //               </button>
// //             </div>

// //             <div className={s.modalFormGroup}>
// //               <label className={s.modalLabel}>User ID:</label>
// //               <input
// //                 type="text"
// //                 placeholder="Enter User ID"
// //                 value={inputUserId}
// //                 onChange={(e) => setInputUserId(e.target.value)}
// //                 className={s.modalInput}
// //               />
// //             </div>

// //             {modalError && <p className={s.modalError}>{modalError}</p>}

// //             <div className={s.modalActionRow}>
// //               <button
// //                 type="button"
// //                 onClick={handleCloseModal}
// //                 className={s.modalCancelBtn}
// //               >
// //                 Cancel
// //               </button>
// //               <button
// //                 type="button"
// //                 disabled={subscribing}
// //                 onClick={handleBuyPlan}
// //                 className={s.modalConfirmBtn}
// //               >
// //                 {subscribing ? "Activating..." : "Buy Plan"}
// //               </button>
// //             </div>
// //           </div>
// //         </div>
// //       )}
// //     </main>
// //   );
// // }
// //=========

// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import s from "./dashboard.module.css";
// import { API_BASE_URL } from "@/config/env";

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

// type SubscriptionPlan = {
//   PlanId: number;
//   PlanName: string;
//   DurationMonths: number;
//   Price: number | null;
//   IsActive: boolean;
//   CreatedAt: string;
//   Perks: string[];
// };

// type UserData = {
//   userId?: number | string;
//   UserId?: number | string;
//   id?: number | string;
//   Id?: number | string;
//   name?: string;
//   fullName?: string;
//   mobile?: string;
// };

// export default function DashboardPage() {
//   const router = useRouter();

//   const [user, setUser] = useState<UserData | null>(null);
//   const [doctors, setDoctors] = useState<DoctorData[]>([]);
//   const [doctorLoading, setDoctorLoading] = useState(true);
//   const [doctorError, setDoctorError] = useState("");

//   const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
//   const [plansLoading, setPlansLoading] = useState(true);
//   const [plansError, setPlansError] = useState("");

//   const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
//   const [inputUserId, setInputUserId] = useState<string>("");
//   const [subscribing, setSubscribing] = useState(false);
//   const [modalError, setModalError] = useState("");

//   // useEffect(() => {
//   //   try {
//   //     const savedUser =
//   //       localStorage.getItem("medistry_user") ||
//   //       localStorage.getItem("medistry_customer") ||
//   //       localStorage.getItem("auth_user");

//   //     if (savedUser) {
//   //       const parsed = JSON.parse(savedUser);
//   //       setUser(parsed);
//   //       const currentId =
//   //         parsed?.userId || parsed?.UserId || parsed?.id || parsed?.Id;
//   //       if (currentId) {
//   //         setInputUserId(String(currentId));
//   //       }
//   //     }
//   //   } catch (err) {
//   //     console.error("Local storage error:", err);
//   //   }
//   // }, []);

//   useEffect(() => {
//     try {
//       const savedUser =
//         localStorage.getItem("medistry_user") ||
//         localStorage.getItem("medistry_customer") ||
//         localStorage.getItem("auth_user");

//       if (savedUser) {
//         const parsed = JSON.parse(savedUser);
//         const currentId =
//           parsed?.userId || parsed?.UserId || parsed?.id || parsed?.Id;

//         setTimeout(() => {
//           setUser(parsed);
//           if (currentId) {
//             setInputUserId(String(currentId));
//           }
//         }, 0);
//       }
//     } catch (err) {
//       console.error("Local storage error:", err);
//     }
//   }, []);
//   useEffect(() => {
//     let cancelled = false;

//     const fetchDoctors = async () => {
//       try {
//         setDoctorLoading(true);
//         setDoctorError("");
//         const res = await fetch(`${API_BASE_URL}/api/doctors/dashboard-list`, {
//           headers: { Accept: "application/json" },
//         });
//         if (!res.ok) throw new Error(`Status: ${res.status}`);
//         const result = await res.json();
//         const list = Array.isArray(result)
//           ? result
//           : Array.isArray(result?.data)
//             ? result.data
//             : Array.isArray(result?.doctors)
//               ? result.doctors
//               : [];

//         if (!cancelled) setDoctors(list);
//       } catch {
//         if (!cancelled) setDoctorError("Doctors load nahi ho paaye.");
//       } finally {
//         if (!cancelled) setDoctorLoading(false);
//       }
//     };

//     const fetchPlans = async () => {
//       try {
//         setPlansLoading(true);
//         setPlansError("");
//         const res = await fetch(`${API_BASE_URL}/api/subscriptions/plans`, {
//           headers: { Accept: "application/json" },
//         });
//         const result = await res.json();

//         if (
//           !res.ok ||
//           result?.success !== true ||
//           !Array.isArray(result.data)
//         ) {
//           throw new Error(result?.message || "Plans load failed");
//         }

//         if (!cancelled) setPlans(result.data);
//       } catch {
//         if (!cancelled) setPlansError("Subscription plans load nahi ho paaye.");
//       } finally {
//         if (!cancelled) setPlansLoading(false);
//       }
//     };

//     fetchDoctors();
//     fetchPlans();

//     return () => {
//       cancelled = true;
//     };
//   }, []);

//   const handleOpenBuyModal = (planId: number) => {
//     setSelectedPlanId(planId);
//     setModalError("");
//   };

//   const handleCloseModal = () => {
//     setSelectedPlanId(null);
//     setModalError("");
//   };

//   const handleBuyPlan = async () => {
//     if (!selectedPlanId) return;

//     const finalUserId = inputUserId.trim();
//     if (!finalUserId) {
//       setModalError("Kripya User ID fill karein.");
//       return;
//     }

//     try {
//       setSubscribing(true);
//       setModalError("");

//       // 1. LocalStorage se Auth Token uthao
//       const token =
//         localStorage.getItem("medistry_auth_token") ||
//         localStorage.getItem("auth_token") ||
//         localStorage.getItem("token");

//       const payload = {
//         targetUserId: isNaN(Number(finalUserId))
//           ? finalUserId
//           : Number(finalUserId),
//         planId: selectedPlanId,
//       };

//       const headers: Record<string, string> = {
//         "Content-Type": "application/json",
//         Accept: "application/json",
//       };

//       if (token) {
//         headers["Authorization"] = `Bearer ${token.replace(/^"|"$/g, "")}`;
//       }

//       const res = await fetch(`${API_BASE_URL}/api/subscriptions/activate`, {
//         method: "POST",
//         headers,
//         body: JSON.stringify(payload),
//       });

//       const data = await res.json();

//       // 2. Agar backend ne NOT_AUTHORISED diya aur abhi sirf testing karni hai:
//       if (!res.ok || data?.success === false) {
//         if (data?.error === "NOT_AUTHORISED" && !token) {
//           // Testing Bypass: Login token na hone par bhi testing flow continue hoga
//           console.warn("Auth token missing, continuing in testing mode.");
//         } else {
//           throw new Error(data?.message || data?.error || "Plan buy failed.");
//         }
//       }

//       // 3. User-wise Subscription local save karo
//       const activeSubscriptions = JSON.parse(
//         localStorage.getItem("medistry_subscribed_users") || "{}",
//       );
//       activeSubscriptions[String(finalUserId)] = {
//         planId: selectedPlanId,
//         activatedAt: new Date().toISOString(),
//       };
//       localStorage.setItem(
//         "medistry_subscribed_users",
//         JSON.stringify(activeSubscriptions),
//       );
//       localStorage.setItem("current_subscribed_user", String(finalUserId));

//       handleCloseModal();

//       // 4. Redirect to doctors page
//       router.push(
//         `/consultations/select-doctor?userId=${encodeURIComponent(finalUserId)}`,
//       );
//     } catch (err) {
//       setModalError(err instanceof Error ? err.message : "Error buying plan.");
//     } finally {
//       setSubscribing(false);
//     }
//   };

//   const displayName = user?.fullName || user?.name || "there";

//   return (
//     <main className={s.page}>
//       <div className={s.container}>
//         {/* Welcome */}
//         <section className={s.welcome}>
//           <h1>Good afternoon, {displayName}.</h1>
//           <p>Welcome to Medistry</p>
//         </section>

//         {/* Top Grid */}
//         <section className={s.topGrid}>
//           <article className={s.weightCard}>
//             <div className={s.cardTop}>
//               <span className={s.cardLabel}>Your weight</span>
//               <button className={s.progressBtn}>
//                 Progress <span>›</span>
//               </button>
//             </div>
//             <div className={s.weightRow}>
//               <strong>78.0</strong>
//               <span className={s.kg}>kg</span>
//               <span className={s.firstReading}>First reading, 8 Oct</span>
//             </div>
//             <p className={s.weightDescription}>
//               Weigh twice a week, before breakfast, and your line starts here.
//             </p>
//             <div className={s.weightActions}>
//               <button className={s.primaryBtn}>
//                 <span>＋</span> Log weight
//               </button>
//               <button className={s.secondaryBtn}>
//                 <span>⌁</span> Log a symptom
//               </button>
//             </div>
//           </article>

//           <div className={s.rightColumn}>
//             <article className={s.appointmentCard}>
//               <div className={s.appointmentIcon}>▣</div>
//               <div className={s.appointmentInfo}>
//                 <strong>Today, 5:00 pm</strong>
//                 <span>Join opens at 4:50 pm</span>
//               </div>
//               <span className={s.arrow}>›</span>
//             </article>

//             <button className={s.chatButton}>
//               <span>☏</span>
//               <small>Chat</small>
//             </button>
//           </div>
//         </section>

//         {/* Doctors Section */}
//         <section className={s.doctorsSection}>
//           <div className={s.doctorsHeader}>
//             <div>
//               <span className={s.sectionEyebrow}>YOUR HEALTHCARE TEAM</span>
//               <h2>Meet Our Doctors</h2>
//               <p>Find the right specialist for your health.</p>
//             </div>
//             <span className={s.doctorCount}>{doctors.length} Doctors</span>
//           </div>

//           {doctorLoading ? (
//             <div className={s.doctorMessage}>Loading doctors...</div>
//           ) : doctorError ? (
//             <div className={s.doctorMessage}>{doctorError}</div>
//           ) : (
//             <div className={s.doctorGrid}>
//               {doctors.map((doctor) => {
//                 const details = doctor.professionalDetails;
//                 return (
//                   <article className={s.doctorCard} key={doctor.id}>
//                     <div className={s.doctorImageWrapper}>
//                       {doctor.photoUrl ? (
//                         <img
//                           className={s.doctorImage}
//                           src={doctor.photoUrl}
//                           alt={doctor.fullName}
//                           loading="lazy"
//                         />
//                       ) : (
//                         <div className={s.imageFallback}>Doctor</div>
//                       )}
//                       <span className={s.specialtyBadge}>
//                         {details?.specialization || "Specialist"}
//                       </span>
//                     </div>

//                     <div className={s.doctorCardBody}>
//                       <div className={s.doctorIdentity}>
//                         <h3>{doctor.fullName}</h3>
//                         <p className={s.doctorQualifications}>
//                           {details?.qualifications || "Specialist"}
//                         </p>
//                       </div>

//                       <div className={s.doctorStats}>
//                         <div className={s.doctorStat}>
//                           <span className={s.statLabel}>Experience</span>
//                           <strong>{details?.experience || "N/A"}</strong>
//                         </div>
//                         <div className={s.doctorStat}>
//                           <span className={s.statLabel}>Fee</span>
//                           <strong>₹{doctor.consultationFee || 0}</strong>
//                         </div>
//                       </div>

//                       <button
//                         type="button"
//                         className={s.viewDoctorButton}
//                         onClick={() => router.push(`/doctors/${doctor.id}`)}
//                       >
//                         View Profile →
//                       </button>
//                     </div>
//                   </article>
//                 );
//               })}
//             </div>
//           )}
//         </section>

//         {/* Subscription Plans Section */}
//         <section className={s.subscriptionSection}>
//           <div className={s.subscriptionHeader}>
//             <div>
//               <span className={s.subscriptionEyebrow}>MEMBERSHIP</span>
//               <h2>Choose Your Subscription Plan</h2>
//               <p>Select a plan to unlock full doctor consultations.</p>
//             </div>
//             <span className={s.planCount}>{plans.length} Plans</span>
//           </div>

//           {plansLoading ? (
//             <div className={s.subscriptionMessage}>Loading plans...</div>
//           ) : plansError ? (
//             <div className={s.subscriptionMessage}>{plansError}</div>
//           ) : (
//             <div className={s.subscriptionGrid}>
//               {plans.map((plan) => (
//                 <article className={s.subscriptionCard} key={plan.PlanId}>
//                   <div className={s.subscriptionCardTop}>
//                     <div className={s.planTitleRow}>
//                       <div className={s.planIcon}>
//                         {plan.DurationMonths >= 6 ? "✦" : "♡"}
//                       </div>

//                       <span
//                         className={
//                           plan.IsActive
//                             ? s.activePlanBadge
//                             : s.inactivePlanBadge
//                         }
//                       >
//                         {plan.IsActive ? "Available" : "Unavailable"}
//                       </span>
//                     </div>

//                     <h3>{plan.PlanName}</h3>

//                     <p className={s.planDuration}>
//                       {plan.DurationMonths}{" "}
//                       {plan.DurationMonths === 1 ? "Month" : "Months"}
//                     </p>

//                     <div className={s.planPrice}>
//                       {plan.Price != null
//                         ? `₹${plan.Price.toLocaleString("en-IN")}`
//                         : "Free"}
//                     </div>

//                     {plan.Price == null && (
//                       <span className={s.priceCaption}>No price specified</span>
//                     )}
//                   </div>

//                   <div className={s.planPerks}>
//                     <h4>Plan Benefits</h4>

//                     {plan.Perks?.length ? (
//                       <ul>
//                         {plan.Perks.map((perk, index) => (
//                           <li key={`${plan.PlanId}-${index}`}>
//                             <span className={s.perkCheck}>✓</span>
//                             <span>{perk}</span>
//                           </li>
//                         ))}
//                       </ul>
//                     ) : (
//                       <p>No benefits listed for this plan.</p>
//                     )}
//                   </div>

//                   <div className={s.planCardFooter}>
//                     <span>
//                       {plan.IsActive
//                         ? "Ready to get started?"
//                         : "This plan is currently unavailable"}
//                     </span>
//                   </div>

//                   <button
//                     type="button"
//                     className={s.subscribeBtn}
//                     disabled={!plan.IsActive}
//                     onClick={() => handleOpenBuyModal(plan.PlanId)}
//                   >
//                     {!plan.IsActive ? "Unavailable" : "Subscribe Now →"}
//                   </button>
//                 </article>
//               ))}
//             </div>
//           )}
//         </section>
//       </div>

//       {/* Modal with External CSS Module */}
//       {selectedPlanId !== null && (
//         <div className={s.modalOverlay}>
//           <div className={s.modalBox}>
//             <div className={s.modalHeader}>
//               <strong className={s.modalTitle}>
//                 Plan ID: {selectedPlanId}
//               </strong>
//               <button
//                 type="button"
//                 onClick={handleCloseModal}
//                 className={s.modalCloseBtn}
//               >
//                 ✕
//               </button>
//             </div>

//             <div className={s.modalFormGroup}>
//               <label className={s.modalLabel}>User ID:</label>
//               <input
//                 type="text"
//                 placeholder="Enter User ID"
//                 value={inputUserId}
//                 onChange={(e) => setInputUserId(e.target.value)}
//                 className={s.modalInput}
//               />
//             </div>

//             {modalError && <p className={s.modalError}>{modalError}</p>}

//             <div className={s.modalActionRow}>
//               <button
//                 type="button"
//                 onClick={handleCloseModal}
//                 className={s.modalCancelBtn}
//               >
//                 Cancel
//               </button>
//               <button
//                 type="button"
//                 disabled={subscribing}
//                 onClick={handleBuyPlan}
//                 className={s.modalConfirmBtn}
//               >
//                 {subscribing ? "Activating..." : "Buy Plan"}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </main>
//   );
// }

//====================================

// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import s from "./dashboard.module.css";
// import { API_BASE_URL } from "@/config/env";

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

// type SubscriptionPlan = {
//   PlanId: number;
//   PlanName: string;
//   DurationMonths: number;
//   Price: number | null;
//   IsActive: boolean;
//   CreatedAt: string;
//   Perks: string[];
// };

// type UserData = {
//   userId?: number | string;
//   UserId?: number | string;
//   id?: number | string;
//   Id?: number | string;
//   name?: string;
//   fullName?: string;
//   mobile?: string;
// };

// export default function DashboardPage() {
//   const router = useRouter();

//   const [user, setUser] = useState<UserData | null>(null);
//   const [doctors, setDoctors] = useState<DoctorData[]>([]);
//   const [doctorLoading, setDoctorLoading] = useState(true);
//   const [doctorError, setDoctorError] = useState("");

//   const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
//   const [plansLoading, setPlansLoading] = useState(true);
//   const [plansError, setPlansError] = useState("");

//   const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
//   const [inputUserId, setInputUserId] = useState<string>("");
//   const [subscribing, setSubscribing] = useState(false);
//   const [modalError, setModalError] = useState("");

//   useEffect(() => {
//     try {
//       const savedUser =
//         localStorage.getItem("medistry_user") ||
//         localStorage.getItem("medistry_customer") ||
//         localStorage.getItem("auth_user");

//       if (savedUser) {
//         const parsed = JSON.parse(savedUser);
//         const currentId =
//           parsed?.userId || parsed?.UserId || parsed?.id || parsed?.Id;

//         setTimeout(() => {
//           setUser(parsed);
//           if (currentId) {
//             setInputUserId(String(currentId));
//           }
//         }, 0);
//       }
//     } catch (err) {
//       console.error("Local storage error:", err);
//     }
//   }, []);

//   useEffect(() => {
//     let cancelled = false;

//     const fetchDoctors = async () => {
//       try {
//         setDoctorLoading(true);
//         setDoctorError("");
//         const res = await fetch(`${API_BASE_URL}/api/doctors/dashboard-list`, {
//           headers: { Accept: "application/json" },
//         });
//         if (!res.ok) throw new Error(`Status: ${res.status}`);
//         const result = await res.json();
//         const list = Array.isArray(result)
//           ? result
//           : Array.isArray(result?.data)
//             ? result.data
//             : Array.isArray(result?.doctors)
//               ? result.doctors
//               : [];

//         if (!cancelled) setDoctors(list);
//       } catch {
//         if (!cancelled) setDoctorError("Doctors load nahi ho paaye.");
//       } finally {
//         if (!cancelled) setDoctorLoading(false);
//       }
//     };

//     const fetchPlans = async () => {
//       try {
//         setPlansLoading(true);
//         setPlansError("");
//         const res = await fetch(`${API_BASE_URL}/api/subscriptions/plans`, {
//           headers: { Accept: "application/json" },
//         });
//         const result = await res.json();

//         if (
//           !res.ok ||
//           result?.success !== true ||
//           !Array.isArray(result.data)
//         ) {
//           throw new Error(result?.message || "Plans load failed");
//         }

//         if (!cancelled) setPlans(result.data);
//       } catch {
//         if (!cancelled) setPlansError("Subscription plans load nahi ho paaye.");
//       } finally {
//         if (!cancelled) setPlansLoading(false);
//       }
//     };

//     fetchDoctors();
//     fetchPlans();

//     return () => {
//       cancelled = true;
//     };
//   }, []);

//   const handleOpenBuyModal = (planId: number) => {
//     setSelectedPlanId(planId);
//     setModalError("");
//   };

//   const handleCloseModal = () => {
//     setSelectedPlanId(null);
//     setModalError("");
//   };

//   const handleBuyPlan = async () => {
//     if (!selectedPlanId) return;

//     const finalUserId = inputUserId.trim();
//     if (!finalUserId) {
//       setModalError("Kripya User ID fill karein.");
//       return;
//     }

//     try {
//       setSubscribing(true);
//       setModalError("");

//       // 1. LocalStorage se Auth Token uthao
//       const token =
//         localStorage.getItem("medistry_auth_token") ||
//         localStorage.getItem("auth_token") ||
//         localStorage.getItem("token");

//       const payload = {
//         targetUserId: isNaN(Number(finalUserId))
//           ? finalUserId
//           : Number(finalUserId),
//         planId: selectedPlanId,
//       };

//       const headers: Record<string, string> = {
//         "Content-Type": "application/json",
//         Accept: "application/json",
//       };

//       if (token) {
//         headers["Authorization"] = `Bearer ${token.replace(/^"|"$/g, "")}`;
//       }

//       const res = await fetch(`${API_BASE_URL}/api/subscriptions/activate`, {
//         method: "POST",
//         headers,
//         body: JSON.stringify(payload),
//       });

//       const data = await res.json();

//       // 2. Agar backend ne NOT_AUTHORISED diya aur abhi sirf testing karni hai:
//       if (!res.ok || data?.success === false) {
//         if (data?.error === "NOT_AUTHORISED" && !token) {
//           // Testing Bypass: Login token na hone par bhi testing flow continue hoga
//           console.warn("Auth token missing, continuing in testing mode.");
//         } else {
//           throw new Error(data?.message || data?.error || "Plan buy failed.");
//         }
//       }

//       // 3. User-wise Subscription local save karo
//       const activeSubscriptions = JSON.parse(
//         localStorage.getItem("medistry_subscribed_users") || "{}",
//       );
//       activeSubscriptions[String(finalUserId)] = {
//         planId: selectedPlanId,
//         activatedAt: new Date().toISOString(),
//       };
//       localStorage.setItem(
//         "medistry_subscribed_users",
//         JSON.stringify(activeSubscriptions),
//       );
//       localStorage.setItem("current_subscribed_user", String(finalUserId));

//       handleCloseModal();

//       // 4. Redirect to doctors page (Updated folder path under dashboard)
//       router.push(
//         `/dashboard/subcribePlan?userId=${encodeURIComponent(finalUserId)}`,
//       );
//     } catch (err) {
//       setModalError(err instanceof Error ? err.message : "Error buying plan.");
//     } finally {
//       setSubscribing(false);
//     }
//   };

//   const displayName = user?.fullName || user?.name || "there";

//   return (
//     <main className={s.page}>
//       <div className={s.container}>
//         {/* Welcome */}
//         <section className={s.welcome}>
//           <h1>Good afternoon, {displayName}.</h1>
//           <p>Welcome to Medistry</p>
//         </section>

//         {/* Top Grid */}
//         <section className={s.topGrid}>
//           <article className={s.weightCard}>
//             <div className={s.cardTop}>
//               <span className={s.cardLabel}>Your weight</span>
//               <button className={s.progressBtn}>
//                 Progress <span>›</span>
//               </button>
//             </div>
//             <div className={s.weightRow}>
//               <strong>78.0</strong>
//               <span className={s.kg}>kg</span>
//               <span className={s.firstReading}>First reading, 8 Oct</span>
//             </div>
//             <p className={s.weightDescription}>
//               Weigh twice a week, before breakfast, and your line starts here.
//             </p>
//             <div className={s.weightActions}>
//               <button className={s.primaryBtn}>
//                 <span>＋</span> Log weight
//               </button>
//               <button className={s.secondaryBtn}>
//                 <span>⌁</span> Log a symptom
//               </button>
//             </div>
//           </article>

//           <div className={s.rightColumn}>
//             <article className={s.appointmentCard}>
//               <div className={s.appointmentIcon}>▣</div>
//               <div className={s.appointmentInfo}>
//                 <strong>Today, 5:00 pm</strong>
//                 <span>Join opens at 4:50 pm</span>
//               </div>
//               <span className={s.arrow}>›</span>
//             </article>

//             <button className={s.chatButton}>
//               <span>☏</span>
//               <small>Chat</small>
//             </button>
//           </div>
//         </section>

//         {/* Doctors Section */}
//         <section className={s.doctorsSection}>
//           <div className={s.doctorsHeader}>
//             <div>
//               <span className={s.sectionEyebrow}>YOUR HEALTHCARE TEAM</span>
//               <h2>Meet Our Doctors</h2>
//               <p>Find the right specialist for your health.</p>
//             </div>
//             <span className={s.doctorCount}>{doctors.length} Doctors</span>
//           </div>

//           {doctorLoading ? (
//             <div className={s.doctorMessage}>Loading doctors...</div>
//           ) : doctorError ? (
//             <div className={s.doctorMessage}>{doctorError}</div>
//           ) : (
//             <div className={s.doctorGrid}>
//               {doctors.map((doctor) => {
//                 const details = doctor.professionalDetails;
//                 return (
//                   <article className={s.doctorCard} key={doctor.id}>
//                     <div className={s.doctorImageWrapper}>
//                       {doctor.photoUrl ? (
//                         <img
//                           className={s.doctorImage}
//                           src={doctor.photoUrl}
//                           alt={doctor.fullName}
//                           loading="lazy"
//                         />
//                       ) : (
//                         <div className={s.imageFallback}>Doctor</div>
//                       )}
//                       <span className={s.specialtyBadge}>
//                         {details?.specialization || "Specialist"}
//                       </span>
//                     </div>

//                     <div className={s.doctorCardBody}>
//                       <div className={s.doctorIdentity}>
//                         <h3>{doctor.fullName}</h3>
//                         <p className={s.doctorQualifications}>
//                           {details?.qualifications || "Specialist"}
//                         </p>
//                       </div>

//                       <div className={s.doctorStats}>
//                         <div className={s.doctorStat}>
//                           <span className={s.statLabel}>Experience</span>
//                           <strong>{details?.experience || "N/A"}</strong>
//                         </div>
//                         <div className={s.doctorStat}>
//                           <span className={s.statLabel}>Fee</span>
//                           <strong>₹{doctor.consultationFee || 0}</strong>
//                         </div>
//                       </div>

//                       <button
//                         type="button"
//                         className={s.viewDoctorButton}
//                         onClick={() => router.push(`/doctors/${doctor.id}`)}
//                       >
//                         View Profile →
//                       </button>
//                     </div>
//                   </article>
//                 );
//               })}
//             </div>
//           )}
//         </section>

//         {/* Subscription Plans Section */}
//         <section className={s.subscriptionSection}>
//           <div className={s.subscriptionHeader}>
//             <div>
//               <span className={s.subscriptionEyebrow}>MEMBERSHIP</span>
//               <h2>Choose Your Subscription Plan</h2>
//               <p>Select a plan to unlock full doctor consultations.</p>
//             </div>
//             <span className={s.planCount}>{plans.length} Plans</span>
//           </div>

//           {plansLoading ? (
//             <div className={s.subscriptionMessage}>Loading plans...</div>
//           ) : plansError ? (
//             <div className={s.subscriptionMessage}>{plansError}</div>
//           ) : (
//             <div className={s.subscriptionGrid}>
//               {plans.map((plan) => (
//                 <article className={s.subscriptionCard} key={plan.PlanId}>
//                   <div className={s.subscriptionCardTop}>
//                     <div className={s.planTitleRow}>
//                       <div className={s.planIcon}>
//                         {plan.DurationMonths >= 6 ? "✦" : "♡"}
//                       </div>

//                       <span
//                         className={
//                           plan.IsActive
//                             ? s.activePlanBadge
//                             : s.inactivePlanBadge
//                         }
//                       >
//                         {plan.IsActive ? "Available" : "Unavailable"}
//                       </span>
//                     </div>

//                     <h3>{plan.PlanName}</h3>

//                     <p className={s.planDuration}>
//                       {plan.DurationMonths}{" "}
//                       {plan.DurationMonths === 1 ? "Month" : "Months"}
//                     </p>

//                     <div className={s.planPrice}>
//                       {plan.Price != null
//                         ? `₹${plan.Price.toLocaleString("en-IN")}`
//                         : "Free"}
//                     </div>

//                     {plan.Price == null && (
//                       <span className={s.priceCaption}>No price specified</span>
//                     )}
//                   </div>

//                   <div className={s.planPerks}>
//                     <h4>Plan Benefits</h4>

//                     {plan.Perks?.length ? (
//                       <ul>
//                         {plan.Perks.map((perk, index) => (
//                           <li key={`${plan.PlanId}-${index}`}>
//                             <span className={s.perkCheck}>✓</span>
//                             <span>{perk}</span>
//                           </li>
//                         ))}
//                       </ul>
//                     ) : (
//                       <p>No benefits listed for this plan.</p>
//                     )}
//                   </div>

//                   <div className={s.planCardFooter}>
//                     <span>
//                       {plan.IsActive
//                         ? "Ready to get started?"
//                         : "This plan is currently unavailable"}
//                     </span>
//                   </div>

//                   <button
//                     type="button"
//                     className={s.subscribeBtn}
//                     disabled={!plan.IsActive}
//                     onClick={() => handleOpenBuyModal(plan.PlanId)}
//                   >
//                     {!plan.IsActive ? "Unavailable" : "Subscribe Now →"}
//                   </button>
//                 </article>
//               ))}
//             </div>
//           )}
//         </section>
//       </div>

//       {/* Modal with External CSS Module */}
//       {selectedPlanId !== null && (
//         <div className={s.modalOverlay}>
//           <div className={s.modalBox}>
//             <div className={s.modalHeader}>
//               <strong className={s.modalTitle}>
//                 Plan ID: {selectedPlanId}
//               </strong>
//               <button
//                 type="button"
//                 onClick={handleCloseModal}
//                 className={s.modalCloseBtn}
//               >
//                 ✕
//               </button>
//             </div>

//             <div className={s.modalFormGroup}>
//               <label className={s.modalLabel}>User ID:</label>
//               <input
//                 type="text"
//                 placeholder="Enter User ID"
//                 value={inputUserId}
//                 onChange={(e) => setInputUserId(e.target.value)}
//                 className={s.modalInput}
//               />
//             </div>

//             {modalError && <p className={s.modalError}>{modalError}</p>}

//             <div className={s.modalActionRow}>
//               <button
//                 type="button"
//                 onClick={handleCloseModal}
//                 className={s.modalCancelBtn}
//               >
//                 Cancel
//               </button>
//               <button
//                 type="button"
//                 disabled={subscribing}
//                 onClick={handleBuyPlan}
//                 className={s.modalConfirmBtn}
//               >
//                 {subscribing ? "Activating..." : "Buy Plan"}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </main>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import s from "./dashboard.module.css";
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

type SubscriptionPlan = {
  PlanId: number;
  PlanName: string;
  DurationMonths: number;
  Price: number | null;
  IsActive: boolean;
  CreatedAt: string;
  Perks: string[];
};

type UserData = {
  userId?: number | string;
  UserId?: number | string;
  id?: number | string;
  Id?: number | string;
  name?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  mobile?: string;
};

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<UserData | null>(null);
  const [patientName, setPatientName] = useState<string>("there");

  const [doctors, setDoctors] = useState<DoctorData[]>([]);
  const [doctorLoading, setDoctorLoading] = useState(true);
  const [doctorError, setDoctorError] = useState("");

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState("");

  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [inputUserId, setInputUserId] = useState<string>("");
  const [subscribing, setSubscribing] = useState(false);
  const [modalError, setModalError] = useState("");

  // Patient Name & User ID resolution from localStorage
  useEffect(() => {
    try {
      // 1. Direct saved name check
      const savedName = localStorage.getItem("medistry_user_name");
      if (savedName) {
        setPatientName(savedName);
      }

      // 2. Saved user details check
      const savedUser =
        localStorage.getItem("medistry_user") ||
        localStorage.getItem("medistry_customer") ||
        localStorage.getItem("auth_user");

      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        const currentId =
          parsed?.userId || parsed?.UserId || parsed?.id || parsed?.Id;

        setUser(parsed);

        if (!savedName) {
          const resolved =
            parsed?.fullName ||
            parsed?.name ||
            (parsed?.firstName
              ? `${parsed.firstName} ${parsed.lastName || ""}`.trim()
              : "");
          if (resolved) {
            setPatientName(resolved);
          }
        }

        if (currentId) {
          setInputUserId(String(currentId));
        }
      }
    } catch (err) {
      console.error("Local storage error:", err);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchDoctors = async () => {
      try {
        setDoctorLoading(true);
        setDoctorError("");
        const res = await fetch(`${API_BASE_URL}/api/doctors/dashboard-list`, {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(`Status: ${res.status}`);
        const result = await res.json();
        const list = Array.isArray(result)
          ? result
          : Array.isArray(result?.data)
            ? result.data
            : Array.isArray(result?.doctors)
              ? result.doctors
              : [];

        if (!cancelled) setDoctors(list);
      } catch {
        if (!cancelled) setDoctorError("Doctors load nahi ho paaye.");
      } finally {
        if (!cancelled) setDoctorLoading(false);
      }
    };

    const fetchPlans = async () => {
      try {
        setPlansLoading(true);
        setPlansError("");
        const res = await fetch(`${API_BASE_URL}/api/subscriptions/plans`, {
          headers: { Accept: "application/json" },
        });
        const result = await res.json();

        if (
          !res.ok ||
          result?.success !== true ||
          !Array.isArray(result.data)
        ) {
          throw new Error(result?.message || "Plans load failed");
        }

        if (!cancelled) setPlans(result.data);
      } catch {
        if (!cancelled) setPlansError("Subscription plans load nahi ho paaye.");
      } finally {
        if (!cancelled) setPlansLoading(false);
      }
    };

    fetchDoctors();
    fetchPlans();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleOpenBuyModal = (planId: number) => {
    setSelectedPlanId(planId);
    setModalError("");
  };

  const handleCloseModal = () => {
    setSelectedPlanId(null);
    setModalError("");
  };

  // const handleBuyPlan = async () => {
  //   if (!selectedPlanId) return;

  //   const finalUserId = inputUserId.trim();
  //   if (!finalUserId) {
  //     setModalError("Kripya User ID fill karein.");
  //     return;
  //   }

  //   try {
  //     setSubscribing(true);
  //     setModalError("");

  //     const token =
  //       localStorage.getItem("medistry_auth_token") ||
  //       localStorage.getItem("auth_token") ||
  //       localStorage.getItem("token");

  //     const payload = {
  //       targetUserId: isNaN(Number(finalUserId))
  //         ? finalUserId
  //         : Number(finalUserId),
  //       planId: selectedPlanId,
  //     };

  //     const headers: Record<string, string> = {
  //       "Content-Type": "application/json",
  //       Accept: "application/json",
  //     };

  //     if (token) {
  //       headers["Authorization"] = `Bearer ${token.replace(/^"|"$/g, "")}`;
  //     }

  //     const res = await fetch(`${API_BASE_URL}/api/subscriptions/activate`, {
  //       method: "POST",
  //       headers,
  //       body: JSON.stringify(payload),
  //     });

  //     const data = await res.json();

  //     if (!res.ok || data?.success === false) {
  //       if (data?.error === "NOT_AUTHORISED" && !token) {
  //         console.warn("Auth token missing, continuing in testing mode.");
  //       } else {
  //         throw new Error(data?.message || data?.error || "Plan buy failed.");
  //       }
  //     }

  //     const activeSubscriptions = JSON.parse(
  //       localStorage.getItem("medistry_subscribed_users") || "{}",
  //     );
  //     activeSubscriptions[String(finalUserId)] = {
  //       planId: selectedPlanId,
  //       activatedAt: new Date().toISOString(),
  //     };
  //     localStorage.setItem(
  //       "medistry_subscribed_users",
  //       JSON.stringify(activeSubscriptions),
  //     );
  //     localStorage.setItem("current_subscribed_user", String(finalUserId));

  //     handleCloseModal();

  //     router.push(
  //       `/dashboard/subcribePlan?userId=${encodeURIComponent(finalUserId)}`,
  //     );
  //   } catch (err) {
  //     setModalError(err instanceof Error ? err.message : "Error buying plan.");
  //   } finally {
  //     setSubscribing(false);
  //   }
  // };
  const handleBuyPlan = async () => {
    if (!selectedPlanId) return;

    const cleanUserId = inputUserId.trim();
    if (!cleanUserId) {
      setModalError("Kripya User ID fill karein.");
      return;
    }

    const numericUserId = Number(cleanUserId);
    if (isNaN(numericUserId)) {
      setModalError("User ID ek valid number honi chahiye.");
      return;
    }

    try {
      setSubscribing(true);
      setModalError("");

      // 1. Token retrieve karein
      const token =
        localStorage.getItem("medistry_auth_token") ||
        localStorage.getItem("auth_token") ||
        localStorage.getItem("token");

      // 2. Exact payload format (Dono values strictly Numbers honi chahiye)
      const payload = {
        targetUserId: numericUserId,
        planId: Number(selectedPlanId),
      };

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token.replace(/^"|"$/g, "")}`;
      }

      // 3. API request call
      const res = await fetch(`${API_BASE_URL}/api/subscriptions/activate`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || data?.success === false) {
        if (data?.error === "NOT_AUTHORISED" && !token) {
          console.warn("Auth token missing, continuing in testing mode.");
        } else {
          throw new Error(data?.message || data?.error || "Plan buy failed.");
        }
      }

      // 4. LocalStorage update (Navbar & protected routes check ke liye)
      const activeSubscriptions = JSON.parse(
        localStorage.getItem("medistry_subscribed_users") || "{}",
      );
      activeSubscriptions[String(numericUserId)] = {
        planId: Number(selectedPlanId),
        activatedAt: new Date().toISOString(),
      };
      localStorage.setItem(
        "medistry_subscribed_users",
        JSON.stringify(activeSubscriptions),
      );
      localStorage.setItem("current_subscribed_user", String(numericUserId));

      handleCloseModal();

      // 5. Valid Page par Redirect karein (404 wale URL ko hata diya gaya hai)
      alert("Plan successfully activate ho gaya hai!");
      router.push("/dashboard/subcribe-plan");
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Error buying plan.");
    } finally {
      setSubscribing(false);
    }
  };
  return (
    <main className={s.page}>
      <div className={s.container}>
        {/* Welcome Section */}
        <section className={s.welcome}>
          <h1>Good afternoon, {patientName}.</h1>
          <p>Welcome to Medistry</p>
        </section>

        {/* Top Grid */}
        <section className={s.topGrid}>
          <article className={s.weightCard}>
            <div className={s.cardTop}>
              <span className={s.cardLabel}>Your weight</span>
              <button className={s.progressBtn}>
                Progress <span>›</span>
              </button>
            </div>
            <div className={s.weightRow}>
              <strong>78.0</strong>
              <span className={s.kg}>kg</span>
              <span className={s.firstReading}>First reading, 8 Oct</span>
            </div>
            <p className={s.weightDescription}>
              Weigh twice a week, before breakfast, and your line starts here.
            </p>
            <div className={s.weightActions}>
              <button className={s.primaryBtn}>
                <span>＋</span> Log weight
              </button>
              <button className={s.secondaryBtn}>
                <span>⌁</span> Log a symptom
              </button>
            </div>
          </article>

          <div className={s.rightColumn}>
            <article className={s.appointmentCard}>
              <div className={s.appointmentIcon}>▣</div>
              <div className={s.appointmentInfo}>
                <strong>Today, 5:00 pm</strong>
                <span>Join opens at 4:50 pm</span>
              </div>
              <span className={s.arrow}>›</span>
            </article>

            <button className={s.chatButton}>
              <span>☏</span>
              <small>Chat</small>
            </button>
          </div>
        </section>

        {/* Doctors Section */}
        <section className={s.doctorsSection}>
          <div className={s.doctorsHeader}>
            <div>
              <span className={s.sectionEyebrow}>YOUR HEALTHCARE TEAM</span>
              <h2>Meet Our Doctors</h2>
              <p>Find the right specialist for your health.</p>
            </div>
            <span className={s.doctorCount}>{doctors.length} Doctors</span>
          </div>

          {doctorLoading ? (
            <div className={s.doctorMessage}>Loading doctors...</div>
          ) : doctorError ? (
            <div className={s.doctorMessage}>{doctorError}</div>
          ) : (
            <div className={s.doctorGrid}>
              {doctors.map((doctor) => {
                const details = doctor.professionalDetails;
                return (
                  <article className={s.doctorCard} key={doctor.id}>
                    <div className={s.doctorImageWrapper}>
                      {doctor.photoUrl ? (
                        <img
                          className={s.doctorImage}
                          src={doctor.photoUrl}
                          alt={doctor.fullName}
                          loading="lazy"
                        />
                      ) : (
                        <div className={s.imageFallback}>Doctor</div>
                      )}
                      <span className={s.specialtyBadge}>
                        {details?.specialization || "Specialist"}
                      </span>
                    </div>

                    <div className={s.doctorCardBody}>
                      <div className={s.doctorIdentity}>
                        <h3>{doctor.fullName}</h3>
                        <p className={s.doctorQualifications}>
                          {details?.qualifications || "Specialist"}
                        </p>
                      </div>

                      <div className={s.doctorStats}>
                        <div className={s.doctorStat}>
                          <span className={s.statLabel}>Experience</span>
                          <strong>{details?.experience || "N/A"}</strong>
                        </div>
                        <div className={s.doctorStat}>
                          <span className={s.statLabel}>Fee</span>
                          <strong>₹{doctor.consultationFee || 0}</strong>
                        </div>
                      </div>

                      <button
                        type="button"
                        className={s.viewDoctorButton}
                        onClick={() => router.push(`/doctors/${doctor.id}`)}
                      >
                        View Profile →
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Subscription Plans Section */}
        <section className={s.subscriptionSection}>
          <div className={s.subscriptionHeader}>
            <div>
              <span className={s.subscriptionEyebrow}>MEMBERSHIP</span>
              <h2>Choose Your Subscription Plan</h2>
              <p>Select a plan to unlock full doctor consultations.</p>
            </div>
            <span className={s.planCount}>{plans.length} Plans</span>
          </div>

          {plansLoading ? (
            <div className={s.subscriptionMessage}>Loading plans...</div>
          ) : plansError ? (
            <div className={s.subscriptionMessage}>{plansError}</div>
          ) : (
            <div className={s.subscriptionGrid}>
              {plans.map((plan) => (
                <article className={s.subscriptionCard} key={plan.PlanId}>
                  <div className={s.subscriptionCardTop}>
                    <div className={s.planTitleRow}>
                      <div className={s.planIcon}>
                        {plan.DurationMonths >= 6 ? "✦" : "♡"}
                      </div>

                      <span
                        className={
                          plan.IsActive
                            ? s.activePlanBadge
                            : s.inactivePlanBadge
                        }
                      >
                        {plan.IsActive ? "Available" : "Unavailable"}
                      </span>
                    </div>

                    <h3>{plan.PlanName}</h3>

                    <p className={s.planDuration}>
                      {plan.DurationMonths}{" "}
                      {plan.DurationMonths === 1 ? "Month" : "Months"}
                    </p>

                    <div className={s.planPrice}>
                      {plan.Price != null
                        ? `₹${plan.Price.toLocaleString("en-IN")}`
                        : "Free"}
                    </div>

                    {plan.Price == null && (
                      <span className={s.priceCaption}>No price specified</span>
                    )}
                  </div>

                  <div className={s.planPerks}>
                    <h4>Plan Benefits</h4>

                    {plan.Perks?.length ? (
                      <ul>
                        {plan.Perks.map((perk, index) => (
                          <li key={`${plan.PlanId}-${index}`}>
                            <span className={s.perkCheck}>✓</span>
                            <span>{perk}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No benefits listed for this plan.</p>
                    )}
                  </div>

                  <div className={s.planCardFooter}>
                    <span>
                      {plan.IsActive
                        ? "Ready to get started?"
                        : "This plan is currently unavailable"}
                    </span>
                  </div>

                  <button
                    type="button"
                    className={s.subscribeBtn}
                    disabled={!plan.IsActive}
                    onClick={() => handleOpenBuyModal(plan.PlanId)}
                  >
                    {!plan.IsActive ? "Unavailable" : "Subscribe Now →"}
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Modal with External CSS Module */}
      {selectedPlanId !== null && (
        <div className={s.modalOverlay}>
          <div className={s.modalBox}>
            <div className={s.modalHeader}>
              <strong className={s.modalTitle}>
                Plan ID: {selectedPlanId}
              </strong>
              <button
                type="button"
                onClick={handleCloseModal}
                className={s.modalCloseBtn}
              >
                ✕
              </button>
            </div>

            <div className={s.modalFormGroup}>
              <label className={s.modalLabel}>User ID:</label>
              <input
                type="text"
                placeholder="Enter User ID"
                value={inputUserId}
                onChange={(e) => setInputUserId(e.target.value)}
                className={s.modalInput}
              />
            </div>

            {modalError && <p className={s.modalError}>{modalError}</p>}

            <div className={s.modalActionRow}>
              <button
                type="button"
                onClick={handleCloseModal}
                className={s.modalCancelBtn}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={subscribing}
                onClick={handleBuyPlan}
                className={s.modalConfirmBtn}
              >
                {subscribing ? "Activating..." : "Buy Plan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
