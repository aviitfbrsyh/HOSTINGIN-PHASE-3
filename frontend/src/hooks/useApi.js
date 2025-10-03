import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const useApi = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = async (method, endpoint, data = null) => {
    setLoading(true);
    setError(null);
    
    try {
      const config = {
        method,
        url: `${API}${endpoint}`,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        ...(data && { data })
      };
      
      const response = await axios(config);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || 'An error occurred';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return { request, loading, error };
};
