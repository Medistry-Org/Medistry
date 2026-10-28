"use client";

/**
 * The app-wide error boundary: a screen that failed to render shows this, in the dashboards' kit,
 * with Try again (re-renders the failed screen) and Go home (the signed-in person's dashboard, or
 * the website).
 */

import { useEffect } from "react";
import Link from "next/link";
import { ArrowClockwise } from "@phosphor-icons/react";
import AppTheme from "@/components/ui/AppTheme";
import Card from "@/components/ui/Card";
import PageHead from "@/components/ui/PageHead";
import formStyles from "@/components/ui/styles/FormControls.module.css";
import layoutStyles from "@/components/ui/styles/PageLayout.module.css";
import { useSignedInHome } from "@/hooks/useSignedInHome";
import styles from "./error.module.css";

export default function AppError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const home = useSignedInHome() ?? "/";

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <AppTheme>
      <main
        className={`${layoutStyles.page} ${layoutStyles.narrow} ${styles.screen}`}
      >
        <PageHead
          title="Something went wrong"
          sub="This page did not load. Try again, or go home."
        />
        <Card>
          <div className={styles.actions}>
            <button
              type="button"
              className={`btn ${formStyles.go}`}
              onClick={retry}
            >
              <span>Try again</span>
              <span className="well" aria-hidden="true">
                <ArrowClockwise size={18} />
              </span>
            </button>
            <Link href={home} className={formStyles.link}>
              Go home
            </Link>
          </div>
        </Card>
      </main>
    </AppTheme>
  );
}
