import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import Header from './Header';

function Layout() {
  const location = useLocation();
  const { pathname } = location;

  return (
    <div className="layout">
      <Header />
      <div className="layout-container">
        {/* <nav className="sidebar">
          <ul>
            <li className={pathname === '/dashboard' ? 'active' : ''}>
              <Link to="/dashboard">Dashboard</Link>
            </li>
            <li className={pathname === '/commands' || pathname.startsWith('/commands/') ? 'active' : ''}>
              <Link to="/commands">Commands</Link>
            </li>
            <li className={pathname === '/prompts' || pathname.startsWith('/prompts/') ? 'active' : ''}>
              <Link to="/prompts">Prompts</Link>
            </li>
            <li className={pathname === '/vector-stores' ? 'active' : ''}>
              <Link to="/vector-stores">Vector Stores</Link>
            </li>
            <li className={pathname === '/tables' ? 'active' : ''}>
              <Link to="/tables">Tables</Link>
            </li>
          </ul>
        </nav> */}
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;