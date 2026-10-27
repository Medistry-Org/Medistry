// import { API_BASE_URL } from "@/config/env";

// const getAuthHeaders = (): HeadersInit => {
//   const token =
//     typeof window !== "undefined"
//       ? localStorage.getItem("medistry_auth_token") ||
//         localStorage.getItem("token") ||
//         ""
//       : "";

//   return {
//     "Content-Type": "application/json",
//     Authorization: `Bearer ${token}`,
//   };
// };

// export const doctorService = {
//   // 1. Doctor Schedule API: GET /api/appointments/doctor?date=YYYY-MM-DD
//   getScheduleByDate: async (dateStr: string) => {
//     const response = await fetch(
//       `${API_BASE_URL}/api/appointments/doctor?date=${dateStr}`,
//       {
//         method: "GET",
//         headers: getAuthHeaders(),
//       },
//     );

//     if (!response.ok) {
//       throw new Error(`Schedule fetch error: ${response.status}`);
//     }

//     const resData = await response.json();
//     return (
//       resData?.data?.queue ||
//       resData?.data?.appointments ||
//       resData?.queue ||
//       resData?.data ||
//       (Array.isArray(resData) ? resData : [])
//     );
//   },

//   // 2. Doctor Patients API: GET /api/doctor/patients
//   getPatientsList: async () => {
//     const response = await fetch(`${API_BASE_URL}/api/doctor/patients`, {
//       method: "GET",
//       headers: getAuthHeaders(),
//     });

//     if (!response.ok) {
//       throw new Error(`Patients fetch error: ${response.status}`);
//     }

//     const resData = await response.json();
//     return (
//       resData?.data?.patients ||
//       resData?.data ||
//       (Array.isArray(resData) ? resData : [])
//     );
//   },

//   // 3. Logged-in Doctor Profile: GET /api/doctor/me
//   getDoctorProfile: async () => {
//     const response = await fetch(`${API_BASE_URL}/api/doctor/me`, {
//       method: "GET",
//       headers: getAuthHeaders(),
//     });

//     if (!response.ok) {
//       throw new Error(`Profile fetch error: ${response.status}`);
//     }

//     const resData = await response.json();
//     return resData?.data || resData;
//   },
// };
