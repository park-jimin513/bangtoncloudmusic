import React, { useState } from "react";
import './Login.css';
import ForgotPassword from "./ForgotPassword";
import { apiFetch } from "./api";

export default function Login({ onClose, onSwitch, onLoginSuccess }) {
  const [form, setForm] = useState({
    email: '',
    password: ''
  });
  const [showForgot, setShowForgot] = useState(false);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const user = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: form.email, password: form.password }),
        // credentials: 'include' // uncomment if backend uses cookies
      });
      alert('Login successful!');
      if (onLoginSuccess) onLoginSuccess(user);
      if (onClose) onClose();
    } catch (err) {
      alert('Login failed');
    }
  };

  if (showForgot) {
    return (
      <ForgotPassword
        onClose={() => setShowForgot(false)}
        onSwitch={(type) => {
          if (type === 'login') setShowForgot(false);
        }}
      />
    );
  }

  return (
    <div className="auth-modal">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Login</h2>
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
        />

        <div style={{ textAlign: 'right', marginBottom: '10px' }}>

          <span
            style={{ color: '#4b4bff', textDecoration: 'underline', fontSize: '0.95em', cursor: 'pointer' }}
            onClick={() => setShowForgot(true)}
          >
            Forgot Password?
          </span>
        </div>

        <button type="submit">Login</button>
        <button type="button" className="close-btn" onClick={onClose}>Cancel</button>
        <div className="auth-switch-msg" style={{marginTop: '1.2rem'}}>
          <p style={{color: 'red', marginBottom: '0.5rem'}}>If you don't have an account, you can register below.</p>
          <span>
            <span className="auth-link" onClick={() => { onClose && onClose(); onSwitch && onSwitch('register'); }}>
              Go to Register
            </span>
          </span>
        </div>
      </form>
    </div>
  );
}
