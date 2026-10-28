/** The tests on one home blood test, each with where the lab has got to with it. */

import Card from "@/components/ui/Card";
import type { LabBooking, LabTestStatus } from "@/types/labTest";
import styles from "../LabTestsPage.module.css";

const TEST_WORDS: Record<LabTestStatus, string> = {
  PENDING: "In progress",
  COMPLETED: "Done",
  REJECTED: "Sample rejected",
  DISMISSED: "Not done",
};

export default function LabBookingTestsCard({
  tests,
}: {
  tests: LabBooking["tests"];
}) {
  return (
    <Card title="Tests" className={styles.card}>
      <ul className={styles.tests}>
        {tests.map((test) => (
          <li key={test.code}>
            {test.name}
            <span>{TEST_WORDS[test.status]}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
