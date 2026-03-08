import { useEffect, useRef, useCallback } from 'react';
import { connectSocket, joinSession, leaveSession, onEvent } from '../services/socket';

const useSocket = (sessionId, eventHandlers = {}) => {
  const handlersRef = useRef(eventHandlers);
  handlersRef.current = eventHandlers;

  useEffect(() => {
    const socket = connectSocket();

    if (sessionId) {
      joinSession(sessionId);
    }

    const cleanupFns = Object.entries(handlersRef.current).map(([event, handler]) =>
      onEvent(event, handler)
    );

    return () => {
      cleanupFns.forEach((cleanup) => cleanup());
      if (sessionId) leaveSession(sessionId);
    };
  }, [sessionId]);
};

export default useSocket;
