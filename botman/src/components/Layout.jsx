import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';

const Layout = () => {
  return (
    <div style={{ 
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh'
    }}>
      <Header />
      <main style={{ 
        flex: 1, 
        backgroundColor: '#ffffff',
      }}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;