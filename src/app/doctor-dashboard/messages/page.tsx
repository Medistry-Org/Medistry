/*
  /doctor-dashboard/messages. The inbox reads the open chat from the address (?p=), so it renders
  inside a Suspense boundary as Next.js requires for useSearchParams.
*/

import { Suspense } from "react";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import MessagesInbox from "./components/MessagesInbox";

export default function MessagesPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <MessagesInbox />
    </Suspense>
  );
}
