import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Commands from './pages/Commands';
import Prompts from './pages/Prompts';
import VectorStores from './pages/VectorStores';
import Tables from './pages/Tables';
import TwoStepsChat from './pages/TwoStepsChat';
import ToastContainer from './components/ToastContainer';
import './App.css';

function App() {
  return (
    <>
      <ToastContainer />
      <Router basename="/botman">
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/commands" element={<Commands />} />
            <Route path="/prompts" element={<Prompts />} />
            <Route path="/vector-stores" element={<VectorStores />} />
            <Route path="/tables" element={<Tables />} />
            <Route path="/2steps-chat" element={<TwoStepsChat />} />
            <Route path="/commands/:commandId" element={<Commands />} />
            <Route path="/prompts/:promptId" element={<Prompts />} />
          </Route>
        </Routes>
      </Router>
    </>
  );
}

export default App;
