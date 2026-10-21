import { redirect } from "next/navigation";

/* this package holds only the clinician portal, so the root opens it */
export default function Page() {
  redirect("/clinician");
}
