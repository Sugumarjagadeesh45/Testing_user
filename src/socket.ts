////live server link


// // D:\newapp\userapp-main 2\userapp-main\src\socket.ts
// import { io } from "socket.io-client";
// import { Alert } from "react-native";
// import { getBackendUrl } from "./util/backendConfig";

// // Get backend dynamically
// const BASE_URL = getBackendUrl().replace(/\/$/, ""); // remove trailing slash if any

// console.log("🔌 Connecting User Socket to:", BASE_URL);

// const socket = io(BASE_URL, {
//   transports: ["websocket"],   // Force WebSocket transport
//   autoConnect: true,           // Connect immediately
//   reconnection: true,          // Auto reconnect if dropped
//   reconnectionAttempts: 5,
//   reconnectionDelay: 1000,
//   timeout: 10000,
// });

// // Debugging logs
// socket.on("connect", () => {
//   console.log("🟢 User socket connected:", socket.id);
// });

// socket.on("connect_error", (err) => {
//   console.log("🔴 User socket error:", err.message);
//   Alert.alert("Socket Error", "Could not connect to server. Check network.");
// });

// socket.on("disconnect", (reason) => {
//   console.log("🔴 User socket disconnected:", reason);
// });

// export default socket;





















////local host



import { io } from "socket.io-client";
const socket = io("https://7bcca295a6d5.ngrok-free.app", {
  transports: ["websocket"],   // Force WebSocket transport
  autoConnect: true,           // Connect immediately when imported
  reconnection: true,          // Auto reconnect if connection drops
  reconnectionAttempts: 5,     // Retry max 5 times
  reconnectionDelay: 1000,     // Wait 1s between retries
});

// Debugging logs
socket.on("connect", () => {
  console.log("🟢 User socket connected:", socket.id);
});

socket.on("connect_error", (err) => {
  console.log("🔴 User socket error:", err.message);
});

socket.on("disconnect", (reason) => {
  console.log("🔴 User socket disconnected:", reason);
});

export default socket;



















































// import { io } from "socket.io-client";

//  const SOCKET_URL = "https://backend-code-a7ke.onrender.com";

// // const SOCKET_URL = "https://ba-esin.onrender.com";


// const socket = io(SOCKET_URL, {
//  transports: ["polling", "websocket"], 
//   autoConnect: true,
//   reconnection: true,
//   reconnectionAttempts: 5,
//   reconnectionDelay: 1000,
//   path: "/socket.io/", 
// });

// socket.on("connect", () => {
//   console.log("🟢 User socket connected:", socket.id);
// });
// socket.on("connect_error", (err) => {
//   console.log("🔴 User socket error:", err.message);
// });
// socket.on("disconnect", (reason) => {
//   console.log("🔴 User socket disconnected:", reason);
// });
// export default socket;




// // import { io } from "socket.io-client";
// // const socket = io("http://10.0.2.2:5001", {
// //   transports: ["websocket"],   // Force WebSocket transport
// //   autoConnect: true,           // Connect immediately when imported
// //   reconnection: true,          // Auto reconnect if connection drops
// //   reconnectionAttempts: 5,     // Retry max 5 times
// //   reconnectionDelay: 1000,     // Wait 1s between retries
// // });

// // // Debugging logs
// // socket.on("connect", () => {
// //   console.log("🟢 User socket connected:", socket.id);
// // });

// // socket.on("connect_error", (err) => {
// //   console.log("🔴 User socket error:", err.message);
// // });

// // socket.on("disconnect", (reason) => {
// //   console.log("🔴 User socket disconnected:", reason);
// // });

// // export default socket;