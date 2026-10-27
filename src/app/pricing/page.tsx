// "use client";

// import { useState, useRef, ChangeEvent } from "react";
// import { useRouter } from "next/navigation";
// import {
//   CheckCircle2,
//   FileText,
//   FlaskConical,
//   Stethoscope,
//   ArrowRight,
//   UploadCloud,
//   X,
//   FileCheck,
//   Calendar,
// } from "lucide-react";
// import styles from "./PricingConsultation.module.css";

// // Interface for consultation plan details
// interface ConsultationPlan {
//   id: string;
//   name: string;
//   badge: string;
//   price: number;
//   originalPrice: number;
//   features: string[];
//   recommended: boolean;
// }

// // Predefined plans for users requiring diagnostic tests along with doctor consultation
// const PLANS_WITHOUT_REPORT: ConsultationPlan[] = [
//   {
//     id: "doc-pro",
//     name: "Specialist Review",
//     badge: "Most Popular",
//     price: 899,
//     originalPrice: 1299,
//     features: [
//       "In-depth Report Evaluation",
//       "Senior Specialist (MD) Consultation",
//       "Detailed Diet & Lifestyle Guidance",
//       "Digital Prescription with Priority Care",
//       "14 Days Free Follow-up Support",
//     ],
//     recommended: false,
//   },
//   {
//     id: "combo-complete",
//     name: "Full Body Checkup Combo",
//     badge: "Best Value",
//     price: 1799,
//     originalPrice: 2999,
//     features: [
//       "Free Home Sample Collection",
//       "Comprehensive Package (Liver, Kidney, Lipid + CBC)",
//       "Certified NABL Lab Processing",
//       "Senior Doctor Consultation After Report",
//       "Personalized Health & Diet Roadmap",
//       "14 Days Follow-up Chat Support",
//     ],
//     recommended: true,
//   },
// ];

// export default function PricingConsultationPage() {
//   const router = useRouter();
//   const fileInputRef = useRef<HTMLInputElement | null>(null);

//   // Toggle state: whether user has existing lab test reports
//   const [hasLabReport, setHasLabReport] = useState<boolean>(true);

//   // Uploaded files state for existing lab reports
//   const [uploadedReports, setUploadedReports] = useState<File[]>([]);

//   // Handle file selection from local device
//   const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files) {
//       const selectedFiles = Array.from(e.target.files);
//       setUploadedReports((prev) => [...prev, ...selectedFiles]);
//     }
//   };

//   // Remove a specific uploaded report
//   const handleRemoveFile = (indexToRemove: number) => {
//     setUploadedReports((prev) =>
//       prev.filter((_, idx) => idx !== indexToRemove),
//     );
//   };

//   // Format file size in KB or MB
//   const formatFileSize = (bytes: number): string => {
//     if (bytes < 1024 * 1024) {
//       return `${(bytes / 1024).toFixed(1)} KB`;
//     }
//     return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
//   };

//   // Handle slot booking after report upload
//   const handleBookSlot = () => {
//     if (uploadedReports.length === 0) {
//       alert("Please upload at least one lab report before booking your slot.");
//       return;
//     }

//     // Direct user to slot selection page or open booking modal
//     alert(
//       `Proceeding to slot selection with ${uploadedReports.length} uploaded report(s).`,
//     );
//     // router.push("/book-slot");
//   };

//   // Handle plan checkout for combo packages
//   // const handleSelectPlan = (plan: ConsultationPlan) => {
//   //   alert(`Selected Plan: ${plan.name} (₹${plan.price})`);
//   //   // router.push(`/checkout?planId=${plan.id}`);
//   // };
//   const handleSelectPlan = (plan: ConsultationPlan) => {
//     // Query parameters ke sath checkout page par redirect
//     router.push(
//       `/checkout?planId=${encodeURIComponent(plan.id)}&name=${encodeURIComponent(
//         plan.name,
//       )}&price=${plan.price}`,
//     );
//   };

//   return (
//     <main className={styles.pageContainer}>
//       <div className={styles.contentWrapper}>
//         {/* Header Section */}
//         <header className={styles.headerSection}>
//           <h1 className={styles.heading}>Choose Your Consultation Plan</h1>
//           <p className={styles.subHeading}>
//             Select the most suitable plan. If you already possess test reports,
//             upload them to book your slot directly.
//           </p>
//         </header>

//         {/* Toggle Switch */}
//         <section
//           className={styles.toggleWrapper}
//           aria-label="Plan Category Selection"
//         >
//           <div className={styles.toggleContainer}>
//             <button
//               type="button"
//               onClick={() => setHasLabReport(true)}
//               className={`${styles.toggleBtn} ${
//                 hasLabReport
//                   ? styles.toggleBtnActiveDoctor
//                   : styles.toggleBtnInactive
//               }`}
//             >
//               <FileText size={16} />
//               <span>Yes, I have Lab Reports</span>
//             </button>

//             <button
//               type="button"
//               onClick={() => setHasLabReport(false)}
//               className={`${styles.toggleBtn} ${
//                 !hasLabReport
//                   ? styles.toggleBtnActiveLab
//                   : styles.toggleBtnInactive
//               }`}
//             >
//               <FlaskConical size={16} />
//               <span>No, I need Lab Tests + Doctor</span>
//             </button>
//           </div>
//         </section>

//         {/* Dynamic Context Banner */}
//         <section
//           className={`${styles.banner} ${
//             hasLabReport ? styles.bannerDoctor : styles.bannerLab
//           }`}
//         >
//           <div className={styles.bannerLeft}>
//             {hasLabReport ? (
//               <Stethoscope size={18} />
//             ) : (
//               <FlaskConical size={18} />
//             )}
//             <span>
//               {hasLabReport
//                 ? "Upload your existing lab reports below and proceed to choose an available doctor slot."
//                 : "Home sample collection and doctor consultation are included together."}
//             </span>
//           </div>
//           <span className={styles.bannerBadge}>
//             {hasLabReport ? "Direct Doctor Review" : "Lab + Doctor Combo"}
//           </span>
//         </section>

//         {/* Case 1: User has reports -> Upload & Book Your Slots UI */}
//         {hasLabReport ? (
//           <section className={styles.uploadCard}>
//             <div className={styles.uploadHeader}>
//               <h3 className={styles.uploadTitle}>
//                 Upload Your Medical Reports
//               </h3>
//               <p className={styles.uploadSubtext}>
//                 Upload existing CBC, Sugar, Lipid, or prescription files (PDF,
//                 PNG, JPG)
//               </p>
//             </div>

//             <input
//               type="file"
//               ref={fileInputRef}
//               onChange={handleFileChange}
//               multiple
//               accept=".pdf,image/png,image/jpeg"
//               className={styles.hiddenInput}
//             />

//             <div
//               className={styles.dropZone}
//               onClick={() => fileInputRef.current?.click()}
//             >
//               <UploadCloud size={32} className={styles.uploadIcon} />
//               <p className={styles.dropText}>
//                 Click to browse or drop reports here
//               </p>
//               <span className={styles.dropHint}>Max file size: 10MB each</span>
//             </div>

//             {/* List of uploaded files */}
//             {uploadedReports.length > 0 && (
//               <div className={styles.fileList}>
//                 {uploadedReports.map((file, index) => (
//                   <div key={index} className={styles.fileItem}>
//                     <div className={styles.fileDetails}>
//                       <FileCheck size={16} style={{ color: "#059669" }} />
//                       <span>{file.name}</span>
//                       <span className={styles.fileSize}>
//                         ({formatFileSize(file.size)})
//                       </span>
//                     </div>
//                     <button
//                       type="button"
//                       onClick={() => handleRemoveFile(index)}
//                       className={styles.removeFileBtn}
//                       title="Remove file"
//                     >
//                       <X size={16} />
//                     </button>
//                   </div>
//                 ))}
//               </div>
//             )}

//             {/* Book Your Slots Action Button */}
//             <div className={styles.slotActionWrapper}>
//               <button
//                 type="button"
//                 onClick={handleBookSlot}
//                 disabled={uploadedReports.length === 0}
//                 className={styles.bookSlotBtn}
//               >
//                 <Calendar size={18} />
//                 <span>Book your slots</span>
//                 <ArrowRight size={16} />
//               </button>
//               {uploadedReports.length === 0 && (
//                 <p className={styles.slotWarning}>
//                   * Please upload at least one report to unlock slot booking.
//                 </p>
//               )}
//             </div>
//           </section>
//         ) : (
//           /* Case 2: User needs diagnostic test + consultation combo plans */
//           <section
//             className={styles.cardsGrid}
//             aria-label="Available Consultation Packages"
//           >
//             {PLANS_WITHOUT_REPORT.map((plan) => (
//               <article
//                 key={plan.id}
//                 className={`${styles.card} ${
//                   plan.recommended ? styles.cardRecommended : styles.cardNormal
//                 }`}
//               >
//                 <div>
//                   <div className={styles.cardHeader}>
//                     <span className={styles.badge}>{plan.badge}</span>
//                     <span className={styles.originalPrice}>
//                       ₹{plan.originalPrice}
//                     </span>
//                   </div>

//                   <h2 className={styles.planName}>{plan.name}</h2>
//                   <div className={styles.priceWrapper}>
//                     <span className={styles.planPrice}>₹{plan.price}</span>
//                     <span className={styles.priceInterval}>/ package</span>
//                   </div>

//                   <ul className={styles.featureList}>
//                     {plan.features.map((feature, idx) => (
//                       <li key={idx} className={styles.featureItem}>
//                         <CheckCircle2 size={16} className={styles.checkIcon} />
//                         <span>{feature}</span>
//                       </li>
//                     ))}
//                   </ul>
//                 </div>

//                 <button
//                   type="button"
//                   onClick={() => handleSelectPlan(plan)}
//                   className={`${styles.ctaBtn} ${
//                     plan.recommended ? styles.ctaBtnRecommended : ""
//                   }`}
//                 >
//                   <span>Select & Proceed</span>
//                   <ArrowRight size={15} />
//                 </button>
//               </article>
//             ))}
//           </section>
//         )}

//         {/* Footer Support Information */}
//         <footer className={styles.footerText}>
//           Instant appointment confirmation and slot allocation are issued
//           immediately following successful booking.
//         </footer>
//       </div>
//     </main>
//   );
// }

//===
"use client";

import { useState, useRef, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  FlaskConical,
  UploadCloud,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  MessageCircle,
  Clock,
  ShieldCheck,
} from "lucide-react";
import styles from "./PricingConsultation.module.css";

interface PlanOption {
  id: string;
  name: string;
  type: "lab_only" | "combo";
  badge: string;
  price: number;
  features: string[];
  recommended: boolean;
}

const NO_REPORT_PLANS: PlanOption[] = [
  {
    id: "plan-lab-basic",
    name: "Essential Diagnostic Lab Test",
    type: "lab_only",
    badge: "Lab Test Only",
    price: 999,
    features: [
      "Home Sample Collection Phlebotomist",
      "CBC, Blood Sugar & Lipid Profile",
      "Smart WhatsApp Report in 5 Hours",
      "NABL Certified Quality Check",
    ],
    recommended: false,
  },
  {
    id: "plan-lab-doctor-combo",
    name: "Full Body Checkup + Doctor Combo",
    type: "combo",
    badge: "Best Value",
    price: 1799,
    features: [
      "Free Home Sample Collection",
      "Full Body Screening (60+ Parameters)",
      "WhatsApp Delivery in 5 Hours",
      "Senior MD Doctor Consultation Included",
      "Digital Prescription & Diet Chart",
    ],
    recommended: true,
  },
];

export default function PricingConsultationPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Tab State: 'yes' (Has Report) or 'no' (Needs Test)
  const [reportTab, setReportTab] = useState<"yes" | "no">("yes");

  // Report Date & Validation States
  const [reportDate, setReportDate] = useState<string>("");
  const [isReportValid, setIsReportValid] = useState<boolean | null>(null);
  const [validationMessage, setValidationMessage] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Dummy Fee Status: whether consultation fee is already paid
  const [hasPaidConsultationFee, setHasPaidConsultationFee] =
    useState<boolean>(false);

  // Validate report age (Must be within 3 months / ~90 days)
  const handleDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.value;
    setReportDate(selected);

    if (!selected) {
      setIsReportValid(null);
      setValidationMessage("");
      return;
    }

    const testDate = new Date(selected);
    const currentDate = new Date(); // Present system date
    const diffTime = currentDate.getTime() - testDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      setIsReportValid(false);
      setValidationMessage("Report date cannot be in the future.");
    } else if (diffDays <= 90) {
      setIsReportValid(true);
      setValidationMessage(
        `Report verified (${diffDays} days old). Valid for consultation (Within 3 months limit).`,
      );
    } else {
      setIsReportValid(false);
      setValidationMessage(
        `Report is ${diffDays} days old (>90 days). Doctor consultation requires a report under 3 months. Please select "I have no report" to order a fresh test.`,
      );
    }
  };

  // Handle report file selection
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  // Case 1 Proceed: Slot Booking or Consultation Fee
  const handleProceedWithReport = () => {
    if (!isReportValid || !uploadedFile) return;

    if (hasPaidConsultationFee) {
      // User has already paid doctor consultation fees -> Direct Slot Booking
      alert(
        "Consultation fee is verified. Redirecting directly to book your doctor slot!",
      );
      router.push("/book-slot?mode=doctor_direct");
    } else {
      // User needs to clear consultation fees first -> Razorpay Checkout
      alert(
        "Report verified. Redirecting to pay Doctor Consultation Fee (₹499).",
      );
      router.push(
        `/checkout?planId=doc_consult_fee&name=Doctor+Consultation+Fee&price=499&next=/book-slot`,
      );
    }
  };

  // Case 2 Proceed: No Report -> Buy Plan & Redirect to Razorpay Checkout
  const handleSelectPlan = (plan: PlanOption) => {
    // Redirects to Razorpay payment UI; after payment callback redirects to /lab-booking
    router.push(
      `/checkout?planId=${plan.id}&name=${encodeURIComponent(plan.name)}&price=${plan.price}&type=${plan.type}&next=/lab-booking`,
    );
  };

  return (
    <main className={styles.container}>
      <div className={styles.wrapper}>
        <header className={styles.header}>
          <h1 className={styles.title}>Consultation & Diagnostics Flow</h1>
          <p className={styles.subtitle}>
            Upload existing medical reports or book a certified lab test
            package.
          </p>
        </header>

        {/* Toggle Switch */}
        <div className={styles.toggleWrapper}>
          <div className={styles.toggleContainer}>
            <button
              type="button"
              onClick={() => setReportTab("yes")}
              className={`${styles.toggleBtn} ${
                reportTab === "yes" ? styles.toggleBtnActiveBlue : ""
              }`}
            >
              <FileText size={16} />
              <span>Yes, I have a Report</span>
            </button>

            <button
              type="button"
              onClick={() => setReportTab("no")}
              className={`${styles.toggleBtn} ${
                reportTab === "no" ? styles.toggleBtnActiveGreen : ""
              }`}
            >
              <FlaskConical size={16} />
              <span>No, I have no Report</span>
            </button>
          </div>
        </div>

        {/* SCENARIO A: User has a Report */}
        {reportTab === "yes" && (
          <section className={styles.card}>
            <div>
              <h2 className={styles.cardTitle}>
                Verify & Upload Existing Lab Report
              </h2>
              <p className={styles.cardSubtitle}>
                Our medical team only reviews diagnostic reports conducted
                within the last 3 months.
              </p>
            </div>

            {/* Date Validation Block */}
            <div className={styles.validationBox}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  Select Report Issue Date:
                </label>
                <input
                  type="date"
                  value={reportDate}
                  onChange={handleDateChange}
                  className={styles.dateInput}
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>

              {isReportValid === true && (
                <div className={styles.statusMessageValid}>
                  <CheckCircle2 size={16} />
                  <span>{validationMessage}</span>
                </div>
              )}

              {isReportValid === false && (
                <div className={styles.statusMessageInvalid}>
                  <XCircle size={16} />
                  <span>{validationMessage}</span>
                </div>
              )}
            </div>

            {/* File Upload Box (Active only when date is valid) */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".pdf,image/png,image/jpeg"
              className={styles.hiddenInput}
            />

            <div
              className={`${styles.dropZone} ${!isReportValid ? styles.dropZoneDisabled : ""}`}
              onClick={() => isReportValid && fileInputRef.current?.click()}
            >
              <UploadCloud size={32} color="#2563eb" />
              <strong>
                {uploadedFile
                  ? uploadedFile.name
                  : "Click to upload report (PDF / Image)"}
              </strong>
              <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                {isReportValid
                  ? "Max size 10MB"
                  : "Please provide a valid report date (<= 3 months) first"}
              </span>
            </div>

            {/* Submission / Permission CTA */}
            <button
              type="button"
              onClick={handleProceedWithReport}
              disabled={!isReportValid || !uploadedFile}
              className={styles.primaryBtn}
            >
              <ShieldCheck size={18} />
              <span>
                {hasPaidConsultationFee
                  ? "Book Your Doctor Slot (Fee Paid)"
                  : "Pay Doctor Consultation Fee & Book Slot"}
              </span>
              <ArrowRight size={16} />
            </button>
          </section>
        )}

        {/* SCENARIO B: User has NO Report */}
        {reportTab === "no" && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
          >
            {/* Information Notice */}
            <div className={styles.whatsappNotice}>
              <Clock size={20} style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>
                <strong>How it works:</strong> Book a lab test package below.
                Once the home phlebotomist collects your sample, your report
                will be generated and{" "}
                <strong>sent directly to your WhatsApp within 5 hours</strong>.
                You can then use that fresh report under{" "}
                <em>"Yes, I have a report"</em> to schedule your doctor review!
              </div>
            </div>

            {/* Two Packages: Lab Only & Lab + Doctor Combo */}
            <div className={styles.planGrid}>
              {NO_REPORT_PLANS.map((plan) => (
                <article
                  key={plan.id}
                  className={`${styles.planCard} ${
                    plan.recommended ? styles.planCardRecommended : ""
                  }`}
                >
                  <div>
                    <span className={styles.badge}>{plan.badge}</span>
                    <h2
                      className={styles.planName}
                      style={{ marginTop: "0.75rem" }}
                    >
                      {plan.name}
                    </h2>
                    <div style={{ margin: "0.75rem 0" }}>
                      <span className={styles.price}>₹{plan.price}</span>
                      <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                        {" "}
                        / package
                      </span>
                    </div>

                    <ul className={styles.features}>
                      {plan.features.map((feat, idx) => (
                        <li key={idx}>
                          <CheckCircle2 size={15} color="#059669" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectPlan(plan)}
                    className={styles.primaryBtn}
                    style={{
                      backgroundColor: plan.recommended ? "#059669" : "#0f172a",
                    }}
                  >
                    <span>Choose Plan & Proceed</span>
                    <ArrowRight size={15} />
                  </button>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
