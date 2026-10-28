"use client";

/** "What is tested" (Arhaan's fold): a Redcliffe package's tests by group, loaded the first time it opens. */

import { useState } from "react";
import { CaretDown } from "@phosphor-icons/react";
import { errorMessage } from "@/lib/http/apiClient";
import { getLabPackageTests } from "@/services/labTestService";
import type { LabPackageTests } from "@/types/labTest";
import styles from "../LabBookingFlow.module.css";

/** `testCount` is shown in the summary when known (the care package card does not know it before loading). */
export default function PackageTestsDetails({
  code,
  testCount,
}: {
  code: string;
  testCount?: number;
}) {
  const [tests, setTests] = useState<LabPackageTests | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const count =
    testCount ??
    tests?.groups.reduce((sum, group) => sum + group.tests.length, 0);

  const load = (open: boolean) => {
    if (!open || tests) return;
    setMessage("Loading");
    getLabPackageTests(code)
      .then((loaded) => {
        setTests(loaded);
        setMessage(null);
      })
      .catch((caught) => setMessage(errorMessage(caught)));
  };

  return (
    <details
      className={styles.tested}
      onToggle={(event) => load(event.currentTarget.open)}
    >
      <summary>
        <span>
          What is tested
          {count !== undefined && <span className="num"> ({count})</span>}
        </span>
        <CaretDown size={16} aria-hidden="true" />
      </summary>
      {message && <p>{message}</p>}
      {tests?.groups.map((group) => (
        <p key={group.name}>
          <strong className={styles.strong}>{group.name}:</strong>{" "}
          {group.tests.join(", ")}.
        </p>
      ))}
    </details>
  );
}
