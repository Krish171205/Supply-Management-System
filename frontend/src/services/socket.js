import io from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const connectSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

export const onInquiryCreated = (callback) => {
  const sock = connectSocket();
  sock.on('inquiryCreated', callback);
};

export const onInquiryResponded = (callback) => {
  const sock = connectSocket();
  sock.on('inquiryResponded', callback);
};

export const onOrderCreated = (callback) => {
  const sock = connectSocket();
  sock.on('orderCreated', callback);
};

export const onOrderUpdated = (callback) => {
  const sock = connectSocket();
  sock.on('orderUpdated', callback);
};

export default {
  connectSocket,
  disconnectSocket,
  getSocket,
  onInquiryCreated,
  onInquiryResponded,
  onOrderCreated,
  onOrderUpdated
};
