import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Header = () => {
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname === path;
  };
  
  const navLinkStyle = {
    padding: '10px 15px',
    textDecoration: 'none',
    fontWeight: 500,
    color: '#333333',
    display: 'inline-block',
    position: 'relative'
  };
  
  const activeStyle = {
    color: '#0066cc'
  };

  return (
    <header style={{
      backgroundColor: '#ffffff',
      padding: '10px 20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        fontSize: '1.5rem',
        fontWeight: 600,
        color: '#222222'
      }}>
        {/* <img
          src="/botman/botkhenect.png"
          alt="Logo"
          style={{
            width: '40px',
            height: '40px',
            marginRight: '10px'
          }}
        /> */}
        <span style={{ fontSize: '1.5rem', fontWeight: 600, color: '#222222' }}>Bot Manager</span>
        {/* <h1 style={{ fontSize: '1.5rem', margin: 0, color: '#222222' }}>Bot Manager</h1> */}
      </div>
      <nav>
        <Link 
          to="/dashboard" 
          style={{ 
            ...navLinkStyle,
            ...(isActive('/dashboard') ? activeStyle : {})
          }}
        >
          Dashboard
        </Link>
        <Link 
          to="/tables" 
          style={{ 
            ...navLinkStyle,
            ...(isActive('/tables') ? activeStyle : {})
          }}
        >
          Tables
        </Link>
        <Link 
          to="/2steps-chat" 
          style={{ 
            ...navLinkStyle,
            ...(isActive('/2steps-chat') ? activeStyle : {})
          }}
        >
          2Steps Chat
        </Link>
        {/* <Link 
          to="/commands" 
          style={{ 
            ...navLinkStyle,
            ...(isActive('/commands') ? activeStyle : {})
          }}
        >
          Commands
        </Link>
        <Link 
          to="/prompts" 
          style={{ 
            ...navLinkStyle,
            ...(isActive('/prompts') ? activeStyle : {})
          }}
        >
          Prompts
        </Link>
        <Link 
          to="/vector-stores" 
          style={{ 
            ...navLinkStyle,
            ...(isActive('/vector-stores') ? activeStyle : {})
          }}
        >
          Vector Stores
        </Link> */}
      </nav>
    </header>
  );
};

export default Header;