"use client";

/** "What is tested" (Arhaan's fold): the package's tests by group, loaded the first time it opens. */

import { useState } from "react";
import { CaretDown } from "@phosphor-icons/react";
import { errorMessage } from "@/lib/http/apiClient";
import { getLabPackageTests } from "@/services/labTestService";
import type { LabPackage, LabPackageTests } from "@/types/labTest";
import styles from "./LabBookingSteps.module.css";

export default function PackageTestsDetails({ labPackage }: { labPackage: LabPackage }) {
  const [tests, setTests] = useState<LabPackageTests | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = (open: boolean) => {
    if (!open || tests) return;
    setMessage("Loading");
    getLabPackageTests(labPackage.code)
      .then((loaded) => {
        setTests(loaded);
        setMessage(null);
      })
      .catch((caught) => setMessage(errorMessage(caught)));
  };

  return (
    <details className={styles.tested} onToggle={(e) => load(e.currentTarget.open)}>
      <summary>
        What is tested (<span className="num">{labPackage.testCount}</span>)
        <CaretDown size={16} aria-hidden="true" />
      </summary>
      {message && <p>{message}</p>}
      {tests?.groups.map((group) => (
        <p key={group.name}>
          <strong className={styles.strong}>{group.name}:</strong> {group.tests.join(", ")}.
        </p>
      ))}
    </details>
  );
}
