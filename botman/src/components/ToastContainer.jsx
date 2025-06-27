import React, { useEffect, useState } from 'react';
import { subscribeToast } from '../services/toastService';
import './ToastContainer.css';

const TOAST_DURATION = 3500;

const ToastContainer = () => {
  const [toast, setToast] = useState(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const unsubscribe = subscribeToast((message) => {
      setToast(message);
      setVisible(true);
      setTimeout(() => setVisible(false), TOAST_DURATION);
    });
    return unsubscribe;
  }, []);

  if (!toast || !visible) return null;
  return (
    <div className="toast-notification-global">{toast}</div>
  );
};

export default ToastContainer;
