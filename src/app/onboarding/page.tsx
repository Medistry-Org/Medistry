// "use client";

// import { FormEvent, useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import s from "./onboarding.module.css";
// import { API_BASE_URL } from "@/config/env";

// // ==================================================
// // API CONFIG
// // ==================================================

// const ONBOARDING_ENDPOINT = `${API_BASE_URL}/api/onboarding/step`;

// const COMPLETE_ENDPOINT = `${API_BASE_URL}/api/onboarding/complete`;

// // ==================================================
// // API RESPONSE HELPER
// // ==================================================

// async function parseApiResponse(response: Response) {
//   const raw = await response.text();

//   console.log("API STATUS:", response.status);
//   console.log("API RAW RESPONSE:", raw);

//   if (!raw) {
//     return {};
//   }

//   try {
//     return JSON.parse(raw);
//   } catch {
//     return {
//       raw,
//     };
//   }
// }

// // ==================================================
// // MAIN COMPONENT
// // ==================================================

// export default function OnboardingPage() {
//   const router = useRouter();

//   // ==================================================
//   // FORM STATE
//   // ==================================================

//   const [mobile, setMobile] = useState("");
//   const [fullName, setFullName] = useState("");
//   const [email, setEmail] = useState("");
//   const [dateOfBirth, setDateOfBirth] = useState("");
//   const [gender, setGender] = useState("");

//   // New health information fields
//   const [weight, setWeight] = useState("");
//   const [height, setHeight] = useState("");

//   // ==================================================
//   // UI STATE
//   // ==================================================

//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   // ==================================================
//   // LOAD AUTH DATA
//   // ==================================================

//   useEffect(() => {
//     const token = localStorage.getItem("medistry_auth_token");

//     const savedMobile = localStorage.getItem("medistry_onboarding_mobile");

//     console.log("ONBOARDING TOKEN EXISTS:", !!token);

//     console.log("ONBOARDING MOBILE:", savedMobile);

//     // Redirect if user is not logged in
//     if (!token) {
//       router.replace("/");
//       return;
//     }

//     // Set mobile number from login flow
//     if (savedMobile) {
//       setMobile(savedMobile);
//     }
//   }, [router]);

//   // ==================================================
//   // GET API ERROR MESSAGE
//   // ==================================================

//   const getApiErrorMessage = (data: any, status: number, fallback: string) => {
//     if (!data) {
//       return fallback;
//     }

//     if (typeof data === "string") {
//       return data;
//     }

//     return (
//       data?.message ||
//       data?.error ||
//       data?.data?.message ||
//       data?.data?.error ||
//       data?.errors?.[0]?.message ||
//       data?.errors?.[0] ||
//       data?.raw ||
//       `${fallback} (${status})`
//     );
//   };

//   // ==================================================
//   // FORM SUBMIT
//   // ==================================================

//   const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
//     e.preventDefault();

//     setError("");

//     // ==================================================
//     // BASIC VALIDATION
//     // ==================================================

//     if (!fullName.trim()) {
//       setError("Please enter your full name.");
//       return;
//     }

//     if (!dateOfBirth) {
//       setError("Please select your date of birth.");
//       return;
//     }

//     if (!gender) {
//       setError("Please select your gender.");
//       return;
//     }

//     if (!weight) {
//       setError("Please enter your weight.");
//       return;
//     }

//     if (!height) {
//       setError("Please enter your height.");
//       return;
//     }

//     // ==================================================
//     // GET AUTH TOKEN
//     // ==================================================

//     const token = localStorage.getItem("medistry_auth_token");

//     if (!token) {
//       setError("Your login session has expired. Please login again.");

//       router.replace("/");
//       return;
//     }

//     // ==================================================
//     // ONBOARDING DATA
//     // ==================================================

//     const onboardingData = {
//       mobile,
//       fullName: fullName.trim(),
//       email: email.trim(),
//       dateOfBirth,
//       gender,

//       // Weight in kilograms
//       weight: Number(weight),

//       // Height in centimeters
//       height: Number(height),
//     };

//     console.log("====================================");

//     console.log("SUBMITTING ONBOARDING DATA:");

//     console.log(onboardingData);

//     console.log("====================================");

//     setLoading(true);

//     try {
//       // ==================================================
//       // STEP 1: SAVE ONBOARDING INFORMATION
//       // ==================================================

//       const stepResponse = await fetch(ONBOARDING_ENDPOINT, {
//         method: "PATCH",

//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },

//         body: JSON.stringify(onboardingData),
//       });

//       const stepData = await parseApiResponse(stepResponse);

//       console.log("====================================");

//       console.log("ONBOARDING STEP STATUS:", stepResponse.status);

//       console.log("ONBOARDING STEP RESPONSE:", stepData);

//       console.log("====================================");

//       // ==================================================
//       // HANDLE STEP API ERROR
//       // ==================================================

//       if (!stepResponse.ok) {
//         const message = getApiErrorMessage(
//           stepData,
//           stepResponse.status,
//           "Unable to save onboarding information.",
//         );

//         throw new Error(message);
//       }

//       console.log("Onboarding step saved successfully:", stepData);

//       // ==================================================
//       // STEP 2: COMPLETE ONBOARDING
//       // ==================================================

//       /*
//        * Complete API receives the fields directly.
//        * There is NO "answers" wrapper here.
//        */

//       const completePayload = {
//         mobile,
//         fullName: fullName.trim(),
//         email: email.trim(),
//         dateOfBirth,
//         gender,

//         // Weight in kilograms
//         weight: Number(weight),

//         // Height in centimeters
//         height: Number(height),
//       };

//       console.log("====================================");

//       console.log("COMPLETE ONBOARDING PAYLOAD:");

//       console.log(completePayload);

//       console.log("====================================");

//       // ==================================================
//       // COMPLETE API REQUEST
//       // ==================================================

//       const completeResponse = await fetch(COMPLETE_ENDPOINT, {
//         method: "POST",

//         headers: {
//           "Content-Type": "application/json",

//           Authorization: `Bearer ${token}`,
//         },

//         body: JSON.stringify(completePayload),
//       });

//       // ==================================================
//       // READ COMPLETE RESPONSE
//       // ==================================================

//       const completeData = await parseApiResponse(completeResponse);

//       // ==================================================
//       // DEBUG LOGS
//       // ==================================================

//       console.log("====================================");

//       console.log("COMPLETE ONBOARDING STATUS:", completeResponse.status);

//       console.log("COMPLETE ONBOARDING RESPONSE:", completeData);

//       console.log("COMPLETE ONBOARDING RAW:", completeData?.raw);

//       console.log("====================================");

//       // ==================================================
//       // HANDLE COMPLETE API ERROR
//       // ==================================================

//       if (!completeResponse.ok) {
//         const message = getApiErrorMessage(
//           completeData,
//           completeResponse.status,
//           "Unable to complete onboarding.",
//         );

//         throw new Error(message);
//       }

//       // ==================================================
//       // SAVE CUSTOMER DATA
//       // ==================================================

//       const customer = completeData?.data?.customer || completeData?.customer;

//       if (customer) {
//         localStorage.setItem("medistry_customer", JSON.stringify(customer));
//       }

//       // ==================================================
//       // SAVE USER DATA
//       // ==================================================

//       const user = completeData?.data?.user || completeData?.user;

//       if (user) {
//         localStorage.setItem("medistry_user", JSON.stringify(user));
//       }

//       // ==================================================
//       // SAVE COMPLETE API RESPONSE
//       // ==================================================

//       localStorage.setItem(
//         "medistry_onboarding_response",
//         JSON.stringify(completeData),
//       );

//       // ==================================================
//       // REMOVE TEMP MOBILE
//       // ==================================================

//       localStorage.removeItem("medistry_onboarding_mobile");

//       // ==================================================
//       // SUCCESS
//       // ==================================================

//       console.log("====================================");

//       console.log("ONBOARDING COMPLETED SUCCESSFULLY");

//       console.log("REDIRECTING TO DASHBOARD...");

//       console.log("====================================");

//       router.replace("/dashboard");
//     } catch (err: any) {
//       // ==================================================
//       // ERROR HANDLING
//       // ==================================================

//       console.error("====================================");

//       console.error("ONBOARDING ERROR:", err);

//       console.error("====================================");

//       setError(err?.message || "Something went wrong. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ==================================================
//   // JSX
//   // ==================================================

//   return (
//     <main className={s.page}>
//       <div className={s.container}>
//         {/* ==================================================
//             HEADER
//         ================================================== */}

//         <div className={s.header}>
//           <h1>Tell us about yourself</h1>

//           <p>
//             This information helps us create your personalized health journey.
//           </p>
//         </div>

//         {/* ==================================================
//             FORM
//         ================================================== */}

//         <form className={s.form} onSubmit={handleSubmit}>
//           {/* ==================================================
//               MOBILE
//           ================================================== */}

//           <div className={s.field}>
//             <label htmlFor="mobile">Mobile number</label>

//             <input
//               id="mobile"
//               type="tel"
//               value={mobile}
//               readOnly
//               placeholder="Mobile number"
//             />
//           </div>

//           {/* ==================================================
//               FULL NAME
//           ================================================== */}

//           <div className={s.field}>
//             <label htmlFor="fullName">Full name</label>

//             <input
//               id="fullName"
//               type="text"
//               value={fullName}
//               onChange={(e) => setFullName(e.target.value)}
//               placeholder="Enter your full name"
//               autoComplete="name"
//               required
//             />
//           </div>

//           {/* ==================================================
//               EMAIL
//           ================================================== */}

//           <div className={s.field}>
//             <label htmlFor="email">
//               Email
//               <span className={s.optional}> (optional)</span>
//             </label>

//             <input
//               id="email"
//               type="email"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               placeholder="Enter your email"
//               autoComplete="email"
//             />
//           </div>

//           {/* ==================================================
//               DATE OF BIRTH
//           ================================================== */}

//           <div className={s.field}>
//             <label htmlFor="dateOfBirth">Date of birth</label>

//             <input
//               id="dateOfBirth"
//               type="date"
//               value={dateOfBirth}
//               onChange={(e) => setDateOfBirth(e.target.value)}
//               required
//             />
//           </div>

//           {/* ==================================================
//               GENDER
//           ================================================== */}

//           <div className={s.field}>
//             <label htmlFor="gender">Gender</label>

//             <select
//               id="gender"
//               value={gender}
//               onChange={(e) => setGender(e.target.value)}
//               required
//             >
//               <option value="">Select gender</option>

//               <option value="Male">Male</option>

//               <option value="Female">Female</option>

//               <option value="Other">Other</option>
//             </select>
//           </div>

//           {/* ==================================================
//               WEIGHT
//           ================================================== */}

//           <div className={s.field}>
//             <label htmlFor="weight">Weight</label>

//             <div className={s.inputWithUnit}>
//               <input
//                 id="weight"
//                 type="number"
//                 value={weight}
//                 onChange={(e) => setWeight(e.target.value)}
//                 placeholder="Enter your weight"
//                 min="1"
//                 max="500"
//                 step="0.1"
//                 required
//               />

//               <span>kg</span>
//             </div>
//           </div>

//           {/* ==================================================
//               HEIGHT
//           ================================================== */}

//           <div className={s.field}>
//             <label htmlFor="height">Height</label>

//             <div className={s.inputWithUnit}>
//               <input
//                 id="height"
//                 type="number"
//                 value={height}
//                 onChange={(e) => setHeight(e.target.value)}
//                 placeholder="Enter your height"
//                 min="50"
//                 max="250"
//                 step="0.1"
//                 required
//               />

//               <span>cm</span>
//             </div>
//           </div>

//           {/* ==================================================
//               ERROR MESSAGE
//           ================================================== */}

//           {error && <div className={s.error}>{error}</div>}

//           {/* ==================================================
//               SUBMIT BUTTON
//           ================================================== */}

//           <button type="submit" className={s.button} disabled={loading}>
//             {loading ? "Saving..." : "Continue"}
//           </button>
//         </form>
//       </div>
//     </main>
//   );
// }
//===========

"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import s from "./onboarding.module.css";
import { API_BASE_URL } from "@/config/env";

// ==================================================
// API CONFIG
// ==================================================

const ONBOARDING_ENDPOINT = `${API_BASE_URL}/api/onboarding/step`;

const COMPLETE_ENDPOINT = `${API_BASE_URL}/api/onboarding/complete`;

// ==================================================
// API RESPONSE HELPER
// ==================================================

async function parseApiResponse(response: Response) {
  const raw = await response.text();

  console.log("API STATUS:", response.status);
  console.log("API RAW RESPONSE:", raw);

  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch {
    return {
      raw,
    };
  }
}

// ==================================================
// MAIN COMPONENT
// ==================================================

export default function OnboardingPage() {
  const router = useRouter();

  // ==================================================
  // FORM STATE
  // ==================================================

  const [mobile, setMobile] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");

  // New health information fields
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");

  // ==================================================
  // UI STATE
  // ==================================================

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ==================================================
  // LOAD AUTH DATA
  // ==================================================

  useEffect(() => {
    const token = localStorage.getItem("medistry_auth_token");

    const savedMobile = localStorage.getItem("medistry_onboarding_mobile");

    console.log("ONBOARDING TOKEN EXISTS:", !!token);

    console.log("ONBOARDING MOBILE:", savedMobile);

    // Redirect if user is not logged in
    if (!token) {
      router.replace("/");
      return;
    }

    // Set mobile number from login flow
    if (savedMobile) {
      setMobile(savedMobile);
    }
  }, [router]);

  // ==================================================
  // GET API ERROR MESSAGE
  // ==================================================

  const getApiErrorMessage = (data: any, status: number, fallback: string) => {
    if (!data) {
      return fallback;
    }

    if (typeof data === "string") {
      return data;
    }

    return (
      data?.message ||
      data?.error ||
      data?.data?.message ||
      data?.data?.error ||
      data?.errors?.[0]?.message ||
      data?.errors?.[0] ||
      data?.raw ||
      `${fallback} (${status})`
    );
  };

  // ==================================================
  // FORM SUBMIT
  // ==================================================

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");

    // ==================================================
    // BASIC VALIDATION
    // ==================================================

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!dateOfBirth) {
      setError("Please select your date of birth.");
      return;
    }

    if (!gender) {
      setError("Please select your gender.");
      return;
    }

    if (!weight) {
      setError("Please enter your weight.");
      return;
    }

    if (!height) {
      setError("Please enter your height.");
      return;
    }

    // ==================================================
    // GET AUTH TOKEN
    // ==================================================

    const token = localStorage.getItem("medistry_auth_token");

    if (!token) {
      setError("Your login session has expired. Please login again.");

      router.replace("/");
      return;
    }

    // ==================================================
    // ONBOARDING DATA
    // ==================================================

    const onboardingData = {
      mobile,
      fullName: fullName.trim(),
      email: email.trim(),
      dateOfBirth,
      gender,

      // Names must match the backend saveStep controller
      weightKg: Number(weight),
      heightCm: Number(height),
    };

    console.log("====================================");

    console.log("SUBMITTING ONBOARDING DATA:");

    console.log(onboardingData);

    console.log("====================================");

    setLoading(true);

    try {
      // ==================================================
      // STEP 1: SAVE ONBOARDING INFORMATION
      // ==================================================

      const stepResponse = await fetch(ONBOARDING_ENDPOINT, {
        method: "PATCH",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify(onboardingData),
      });

      const stepData = await parseApiResponse(stepResponse);

      console.log("====================================");

      console.log("ONBOARDING STEP STATUS:", stepResponse.status);

      console.log("ONBOARDING STEP RESPONSE:", stepData);

      console.log("====================================");

      // ==================================================
      // HANDLE STEP API ERROR
      // ==================================================

      if (!stepResponse.ok) {
        const message = getApiErrorMessage(
          stepData,
          stepResponse.status,
          "Unable to save onboarding information.",
        );

        throw new Error(message);
      }

      console.log("Onboarding step saved successfully:", stepData);

      // ==================================================
      // STEP 2: COMPLETE ONBOARDING
      // ==================================================

      /*
       * Complete API receives the fields directly.
       * There is NO "answers" wrapper here.
       */

      const completePayload = {
        mobile,
        fullName: fullName.trim(),
        email: email.trim(),
        dateOfBirth,
        gender,

        // Keep payload consistent with the backend controller
        weightKg: Number(weight),
        heightCm: Number(height),
      };

      console.log("====================================");

      console.log("COMPLETE ONBOARDING PAYLOAD:");

      console.log(completePayload);

      console.log("====================================");

      // ==================================================
      // COMPLETE API REQUEST
      // ==================================================

      const completeResponse = await fetch(COMPLETE_ENDPOINT, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify(completePayload),
      });

      // ==================================================
      // READ COMPLETE RESPONSE
      // ==================================================

      const completeData = await parseApiResponse(completeResponse);

      // ==================================================
      // DEBUG LOGS
      // ==================================================

      console.log("====================================");

      console.log("COMPLETE ONBOARDING STATUS:", completeResponse.status);

      console.log("COMPLETE ONBOARDING RESPONSE:", completeData);

      console.log("COMPLETE ONBOARDING RAW:", completeData?.raw);

      console.log("====================================");

      // ==================================================
      // HANDLE COMPLETE API ERROR
      // ==================================================

      if (!completeResponse.ok) {
        const message = getApiErrorMessage(
          completeData,
          completeResponse.status,
          "Unable to complete onboarding.",
        );

        throw new Error(message);
      }

      // ==================================================
      // SAVE CUSTOMER DATA
      // ==================================================

      const customer = completeData?.data?.customer || completeData?.customer;

      if (customer) {
        localStorage.setItem("medistry_customer", JSON.stringify(customer));
      }

      // ==================================================
      // SAVE USER DATA
      // ==================================================

      const user = completeData?.data?.user || completeData?.user;

      if (user) {
        localStorage.setItem("medistry_user", JSON.stringify(user));
      }

      // ==================================================
      // SAVE COMPLETE API RESPONSE
      // ==================================================

      localStorage.setItem(
        "medistry_onboarding_response",
        JSON.stringify(completeData),
      );

      // ==================================================
      // REMOVE TEMP MOBILE
      // ==================================================

      localStorage.removeItem("medistry_onboarding_mobile");

      // ==================================================
      // SUCCESS
      // ==================================================

      console.log("====================================");

      console.log("ONBOARDING COMPLETED SUCCESSFULLY");

      console.log("REDIRECTING TO DASHBOARD...");

      console.log("====================================");

      router.replace("/dashboard");
    } catch (err: any) {
      // ==================================================
      // ERROR HANDLING
      // ==================================================

      console.error("====================================");

      console.error("ONBOARDING ERROR:", err);

      console.error("====================================");

      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ==================================================
  // JSX
  // ==================================================

  return (
    <main className={s.page}>
      <div className={s.container}>
        {/* ==================================================
            HEADER
        ================================================== */}

        <div className={s.header}>
          <h1>Tell us about yourself</h1>

          <p>
            This information helps us create your personalized health journey.
          </p>
        </div>

        {/* ==================================================
            FORM
        ================================================== */}

        <form className={s.form} onSubmit={handleSubmit}>
          {/* ==================================================
              MOBILE
          ================================================== */}

          <div className={s.field}>
            <label htmlFor="mobile">Mobile number</label>

            <input
              id="mobile"
              type="tel"
              value={mobile}
              readOnly
              placeholder="Mobile number"
            />
          </div>

          {/* ==================================================
              FULL NAME
          ================================================== */}

          <div className={s.field}>
            <label htmlFor="fullName">Full name</label>

            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              autoComplete="name"
              required
            />
          </div>

          {/* ==================================================
              EMAIL
          ================================================== */}

          <div className={s.field}>
            <label htmlFor="email">
              Email
              <span className={s.optional}> (optional)</span>
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              autoComplete="email"
            />
          </div>

          {/* ==================================================
              DATE OF BIRTH
          ================================================== */}

          <div className={s.field}>
            <label htmlFor="dateOfBirth">Date of birth</label>

            <input
              id="dateOfBirth"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              required
            />
          </div>

          {/* ==================================================
              GENDER
          ================================================== */}

          <div className={s.field}>
            <label htmlFor="gender">Gender</label>

            <select
              id="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              required
            >
              <option value="">Select gender</option>

              <option value="Male">Male</option>

              <option value="Female">Female</option>

              <option value="Other">Other</option>
            </select>
          </div>

          {/* ==================================================
              WEIGHT
          ================================================== */}

          <div className={s.field}>
            <label htmlFor="weight">Weight</label>

            <div className={s.inputWithUnit}>
              <input
                id="weight"
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Enter your weight"
                min="1"
                max="500"
                step="0.1"
                required
              />

              <span>kg</span>
            </div>
          </div>

          {/* ==================================================
              HEIGHT
          ================================================== */}

          <div className={s.field}>
            <label htmlFor="height">Height</label>

            <div className={s.inputWithUnit}>
              <input
                id="height"
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="Enter your height"
                min="50"
                max="250"
                step="0.1"
                required
              />

              <span>cm</span>
            </div>
          </div>

          {/* ==================================================
              ERROR MESSAGE
          ================================================== */}

          {error && <div className={s.error}>{error}</div>}

          {/* ==================================================
              SUBMIT BUTTON
          ================================================== */}

          <button type="submit" className={s.button} disabled={loading}>
            {loading ? "Saving..." : "Continue"}
          </button>
        </form>
      </div>
    </main>
  );
}
