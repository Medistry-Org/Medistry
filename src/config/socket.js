import { io } from "socket.io-client";
// Yahan apne config/env file ka sahi path do (jaise '@/config/env' ya '@/lib/config')
import { SOCKET_URL } from "@/config/env";

let socketInstance = null;

export const getSocket = (token) => {
  // Agar pehle se socket bana hua hai aur token same hai, wahi return karo (Singleton)
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      autoConnect: false,
      transports: ["websocket"],
      auth: {
        token: token, // Backend middleware io.use(...) yehi token verify karega
      },
    });
  } else {
    // Agar token update hua ho toh auth update karo
    socketInstance.auth = { token };
  }

  return socketInstance;
};

// Disconnect karne ke liye helper
export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};
