import React, { createContext, useContext, useState, useCallback } from 'react';
import { sessionAPI } from '../services/api';

const SessionContext = createContext(null);

export const SessionProvider = ({ children }) => {
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 });

  const fetchSessions = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const res = await sessionAPI.getAll(params);
      setSessions(res.data.sessions);
      setPagination({ page: params.page || 1, total: res.total, pages: res.pages });
    } catch (err) {
      console.error('Failed to fetch sessions:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createSession = useCallback(async (data) => {
    const res = await sessionAPI.create(data);
    setSessions((prev) => [res.data.session, ...prev]);
    setCurrentSession(res.data.session);
    return res.data.session;
  }, []);

  const updateCurrentSession = useCallback((updatedSession) => {
    setCurrentSession(updatedSession);
    setSessions((prev) => prev.map((s) => s._id === updatedSession._id ? updatedSession : s));
  }, []);

  return (
    <SessionContext.Provider value={{
      sessions, currentSession, loading, pagination,
      fetchSessions, createSession, setCurrentSession, updateCurrentSession,
    }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
};
