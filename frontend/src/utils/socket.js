import { io } from 'socket.io-client';
import { API_ORIGIN } from './api';

const socket = io(API_ORIGIN, {
  autoConnect: false,
  withCredentials: true,
});

export default socket;
