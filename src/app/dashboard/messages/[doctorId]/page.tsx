/**
 * The chat with one doctor, /dashboard/messages/[doctorId]. The screen is a client component;
 * this server page only reads the doctor's id from the URL.
 */

import ChatScreen from "./components/ChatScreen";

export default async function ChatPage({ params }: { params: Promise<{ doctorId: string }> }) {
  const { doctorId } = await params;
  return <ChatScreen doctorId={doctorId} />;
}
