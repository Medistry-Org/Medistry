"use client";

import { useState } from "react";
import styles from "./care.module.css";

type FormType = "report" | "homeTest" | null;

export default function CarePage() {
  const [activeForm, setActiveForm] = useState<FormType>(null);
  const [loading, setLoading] = useState(false);

  const [reportForm, setReportForm] = useState({
    patientName: "",
    mobile: "",
    testName: "",
    doctorName: "",
    message: "",
    report: null as File | null,
  });

  const [homeTestForm, setHomeTestForm] = useState({
    patientName: "",
    mobile: "",
    testName: "",
    address: "",
    date: "",
    time: "",
  });

  const [success, setSuccess] = useState("");

  const closeForm = () => {
    setActiveForm(null);
    setSuccess("");
  };

  const handleReportSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!reportForm.report) {
      alert("Please select your report file.");
      return;
    }

    // Frontend validation complete.
    // Connect your report-upload API here.
    console.log("Report details:", reportForm);

    setSuccess("Report details validated successfully.");
  };

  const handleHomeTestSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Connect your home-test booking API here.
    console.log("Home test booking:", homeTestForm);

    setSuccess("Booking details validated successfully.");
  };

  return (
    <main className={styles.page}>
      <h1 className={styles.heading}>Your care</h1>

      <section className={styles.appointment}>
        <div className={styles.dateIcon}>▣</div>

        <div>
          <strong>Today, 5 pm</strong>
          <p>First consultation, by video</p>
        </div>

        <span className={styles.arrow}>›</span>
      </section>

      <section className={styles.cards}>
        <article className={styles.card}>
          <h3>Your programme</h3>
          <span className={styles.underline} />
          <p>
            Not on a programme yet. Your doctor suggests one after your first
            consultation, and a dietitian joins you once it starts.
          </p>
        </article>

        <article className={styles.card}>
          <h3>Blood tests</h3>
          <span className={styles.underline} />
          <p>
            Send a photo of a recent report in Chat, or book a home test. Your
            doctor reads it before your consultation.
          </p>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => setActiveForm("report")}
            >
              ♧ Share a report
            </button>

            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => setActiveForm("homeTest")}
            >
              ♧ Book a home test
            </button>
          </div>
        </article>
      </section>

      {activeForm && (
        <div
          className={styles.overlay}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeForm();
          }}
        >
          <section
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="form-title"
          >
            <div className={styles.modalHeader}>
              <div>
                <h2 id="form-title">
                  {activeForm === "report"
                    ? "Share your report"
                    : "Book a home test"}
                </h2>

                <p>
                  {activeForm === "report"
                    ? "Upload your recent blood test or medical report."
                    : "Enter your details to request a home blood test."}
                </p>
              </div>

              <button
                type="button"
                className={styles.closeButton}
                onClick={closeForm}
                aria-label="Close form"
              >
                ×
              </button>
            </div>

            {success ? (
              <div className={styles.success}>
                <h3>Details submitted</h3>
                <p>{success}</p>
                <p>
                  This is a frontend demonstration. No booking or report has
                  been saved to the server yet.
                </p>

                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={closeForm}
                >
                  Done
                </button>
              </div>
            ) : activeForm === "report" ? (
              <form onSubmit={handleReportSubmit}>
                <div className={styles.formGrid}>
                  <label>
                    Patient name *
                    <input
                      required
                      value={reportForm.patientName}
                      onChange={(e) =>
                        setReportForm({
                          ...reportForm,
                          patientName: e.target.value,
                        })
                      }
                      placeholder="Enter your full name"
                    />
                  </label>

                  <label>
                    Mobile number *
                    <input
                      required
                      type="tel"
                      pattern="[0-9]{10}"
                      maxLength={10}
                      value={reportForm.mobile}
                      onChange={(e) =>
                        setReportForm({
                          ...reportForm,
                          mobile: e.target.value.replace(/\D/g, ""),
                        })
                      }
                      placeholder="10-digit mobile number"
                    />
                  </label>

                  <label>
                    Test / report name *
                    <input
                      required
                      value={reportForm.testName}
                      onChange={(e) =>
                        setReportForm({
                          ...reportForm,
                          testName: e.target.value,
                        })
                      }
                      placeholder="e.g. CBC, Lipid Profile"
                    />
                  </label>

                  <label>
                    Doctor name
                    <input
                      value={reportForm.doctorName}
                      onChange={(e) =>
                        setReportForm({
                          ...reportForm,
                          doctorName: e.target.value,
                        })
                      }
                      placeholder="Enter doctor name"
                    />
                  </label>

                  <label className={styles.fullWidth}>
                    Upload report *
                    <input
                      required
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) =>
                        setReportForm({
                          ...reportForm,
                          report: e.target.files?.[0] ?? null,
                        })
                      }
                    />
                    <small>Accepted formats: PDF, JPG, PNG.</small>
                  </label>

                  <label className={styles.fullWidth}>
                    Message for doctor
                    <textarea
                      rows={3}
                      value={reportForm.message}
                      onChange={(e) =>
                        setReportForm({
                          ...reportForm,
                          message: e.target.value,
                        })
                      }
                      placeholder="Add any relevant details..."
                    />
                  </label>
                </div>

                <div className={styles.formActions}>
                  <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={closeForm}
                  >
                    Cancel
                  </button>

                  <button type="submit" className={styles.primaryButton}>
                    Submit report
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleHomeTestSubmit}>
                <div className={styles.formGrid}>
                  <label>
                    Patient name *
                    <input
                      required
                      value={homeTestForm.patientName}
                      onChange={(e) =>
                        setHomeTestForm({
                          ...homeTestForm,
                          patientName: e.target.value,
                        })
                      }
                      placeholder="Enter your full name"
                    />
                  </label>

                  <label>
                    Mobile number *
                    <input
                      required
                      type="tel"
                      pattern="[0-9]{10}"
                      maxLength={10}
                      value={homeTestForm.mobile}
                      onChange={(e) =>
                        setHomeTestForm({
                          ...homeTestForm,
                          mobile: e.target.value.replace(/\D/g, ""),
                        })
                      }
                      placeholder="10-digit mobile number"
                    />
                  </label>

                  <label className={styles.fullWidth}>
                    Select blood test *
                    <select
                      required
                      value={homeTestForm.testName}
                      onChange={(e) =>
                        setHomeTestForm({
                          ...homeTestForm,
                          testName: e.target.value,
                        })
                      }
                    >
                      <option value="">Choose a test</option>
                      <option value="Complete Blood Count (CBC)">
                        Complete Blood Count (CBC)
                      </option>
                      <option value="Blood Glucose">Blood Glucose</option>
                      <option value="Lipid Profile">Lipid Profile</option>
                      <option value="Thyroid Profile">Thyroid Profile</option>
                      <option value="Liver Function Test">
                        Liver Function Test
                      </option>
                      <option value="Kidney Function Test">
                        Kidney Function Test
                      </option>
                      <option value="Other">Other</option>
                    </select>
                  </label>

                  <label className={styles.fullWidth}>
                    Home address *
                    <textarea
                      required
                      rows={3}
                      value={homeTestForm.address}
                      onChange={(e) =>
                        setHomeTestForm({
                          ...homeTestForm,
                          address: e.target.value,
                        })
                      }
                      placeholder="House number, street, city and PIN code"
                    />
                  </label>

                  <label>
                    Preferred date *
                    <input
                      required
                      type="date"
                      min={new Date().toLocaleDateString("en-CA")}
                      value={homeTestForm.date}
                      onChange={(e) =>
                        setHomeTestForm({
                          ...homeTestForm,
                          date: e.target.value,
                        })
                      }
                    />
                  </label>

                  <label>
                    Preferred time *
                    <select
                      required
                      value={homeTestForm.time}
                      onChange={(e) =>
                        setHomeTestForm({
                          ...homeTestForm,
                          time: e.target.value,
                        })
                      }
                    >
                      <option value="">Choose a time</option>
                      <option value="07:00-09:00">7 AM – 9 AM</option>
                      <option value="09:00-11:00">9 AM – 11 AM</option>
                      <option value="11:00-13:00">11 AM – 1 PM</option>
                      <option value="15:00-17:00">3 PM – 5 PM</option>
                    </select>
                  </label>
                </div>

                <div className={styles.formActions}>
                  <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={closeForm}
                  >
                    Cancel
                  </button>

                  <button type="submit" className={styles.primaryButton}>
                    Request home test
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
