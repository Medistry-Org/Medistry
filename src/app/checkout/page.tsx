"use client";

import { useState } from "react";
import {
  CreditCard,
  Smartphone,
  Building,
  Wallet,
  ShieldCheck,
  Lock,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import styles from "./RazorpayModal.module.css";

// Dummy Order Payload
const DUMMY_ORDER = {
  id: "order_Qz98xLmN284",
  businessName: "Medistry Healthcare Pvt Ltd",
  description: "Comprehensive Lab Test + Consultation",
  amount: 899,
  currency: "₹",
};

export default function RazorpayPaymentUI() {
  const [activeMethod, setActiveMethod] = useState<
    "upi" | "card" | "netbanking" | "wallet"
  >("upi");

  // Dummy form states
  const [upiId, setUpiId] = useState("vikas@okhdfcbank");
  const [cardNumber, setCardNumber] = useState("4532 •••• •••• 8821");
  const [cardExpiry, setCardExpiry] = useState("08/28");
  const [cardCvv, setCardCvv] = useState("•••");
  const [selectedBank, setSelectedBank] = useState("HDFC Bank");
  const [isProcessing, setIsProcessing] = useState(false);

  // Trigger dummy payment action
  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      alert(
        `Payment Successful!\n\nOrder ID: ${DUMMY_ORDER.id}\nAmount: ${DUMMY_ORDER.currency}${DUMMY_ORDER.amount}\nMethod: ${activeMethod.toUpperCase()}`,
      );
    }, 1500);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modalContainer}>
        {/* Razorpay Top Header */}
        <div className={styles.modalHeader}>
          <div className={styles.brandWrapper}>
            <div className={styles.brandLogo}>M</div>
            <div>
              <h2 className={styles.businessName}>
                {DUMMY_ORDER.businessName}
              </h2>
              <p className={styles.orderIdText}>{DUMMY_ORDER.id}</p>
            </div>
          </div>
          <div className={styles.amountBox}>
            <span className={styles.amountLabel}>Amount Due</span>
            <span className={styles.amountValue}>
              {DUMMY_ORDER.currency}
              {DUMMY_ORDER.amount}.00
            </span>
          </div>
        </div>

        {/* Modal Center: Left Tabs & Right Form */}
        <div className={styles.modalBody}>
          {/* Method Selector Sidebar */}
          <nav className={styles.methodSidebar} aria-label="Payment Options">
            <button
              type="button"
              onClick={() => setActiveMethod("upi")}
              className={`${styles.navItem} ${
                activeMethod === "upi" ? styles.navItemActive : ""
              }`}
            >
              <Smartphone size={18} />
              <span>UPI / QR</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMethod("card")}
              className={`${styles.navItem} ${
                activeMethod === "card" ? styles.navItemActive : ""
              }`}
            >
              <CreditCard size={18} />
              <span>Card</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMethod("netbanking")}
              className={`${styles.navItem} ${
                activeMethod === "netbanking" ? styles.navItemActive : ""
              }`}
            >
              <Building size={18} />
              <span>Netbanking</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMethod("wallet")}
              className={`${styles.navItem} ${
                activeMethod === "wallet" ? styles.navItemActive : ""
              }`}
            >
              <Wallet size={18} />
              <span>Wallet</span>
            </button>
          </nav>

          {/* Dynamic Payment Form View */}
          <form className={styles.formPane} onSubmit={handlePayment}>
            <div>
              {/* 1. UPI Tab */}
              {activeMethod === "upi" && (
                <div>
                  <h3 className={styles.paneTitle}>Pay via UPI Apps</h3>
                  <div className={styles.upiAppGrid}>
                    <button type="button" className={styles.upiAppBtn}>
                      <span>Google Pay</span>
                    </button>
                    <button type="button" className={styles.upiAppBtn}>
                      <span>PhonePe</span>
                    </button>
                    <button type="button" className={styles.upiAppBtn}>
                      <span>Paytm</span>
                    </button>
                  </div>

                  <div className={styles.divider}>OR ENTER UPI ID</div>

                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>
                      Virtual Payment Address (VPA)
                    </label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="mobile-number@upi"
                      className={styles.textInput}
                      required
                    />
                  </div>
                </div>
              )}

              {/* 2. Card Tab */}
              {activeMethod === "card" && (
                <div>
                  <h3 className={styles.paneTitle}>Enter Card Details</h3>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Card Number</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4000 1234 5678 9010"
                      className={styles.textInput}
                      required
                    />
                  </div>

                  <div className={styles.cardRow}>
                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel}>
                        Expiry (MM/YY)
                      </label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="MM / YY"
                        className={styles.textInput}
                        required
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel}>CVV</label>
                      <input
                        type="password"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        maxLength={4}
                        placeholder="123"
                        className={styles.textInput}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Netbanking Tab */}
              {activeMethod === "netbanking" && (
                <div>
                  <h3 className={styles.paneTitle}>Popular Banks</h3>
                  <div className={styles.bankGrid}>
                    {["HDFC Bank", "SBI", "ICICI Bank", "Axis Bank"].map(
                      (bank) => (
                        <button
                          key={bank}
                          type="button"
                          onClick={() => setSelectedBank(bank)}
                          className={`${styles.bankPill} ${
                            selectedBank === bank ? styles.bankPillActive : ""
                          }`}
                        >
                          {bank}
                        </button>
                      ),
                    )}
                  </div>
                </div>
              )}

              {/* 4. Wallet Tab */}
              {activeMethod === "wallet" && (
                <div>
                  <h3 className={styles.paneTitle}>Select Digital Wallet</h3>
                  <div className={styles.bankGrid}>
                    {[
                      "Paytm Wallet",
                      "Amazon Pay",
                      "Mobikwik",
                      "Freecharge",
                    ].map((wallet) => (
                      <button
                        key={wallet}
                        type="button"
                        onClick={() => setSelectedBank(wallet)}
                        className={`${styles.bankPill} ${
                          selectedBank === wallet ? styles.bankPillActive : ""
                        }`}
                      >
                        {wallet}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isProcessing}
              className={styles.paySubmitBtn}
            >
              <Lock size={16} />
              <span>
                {isProcessing
                  ? "Processing Payment..."
                  : `Pay ${DUMMY_ORDER.currency}${DUMMY_ORDER.amount}`}
              </span>
              {!isProcessing && <ArrowRight size={15} />}
            </button>
          </form>
        </div>

        {/* Razorpay Trust Footer */}
        <div className={styles.securityBanner}>
          <div className={styles.secureBadge}>
            <ShieldCheck size={14} />
            <span>256-Bit SSL Secured</span>
          </div>
          <div>
            Powered by <span className={styles.razorpayTag}>Razorpay</span>
          </div>
        </div>
      </div>
    </div>
  );
}
