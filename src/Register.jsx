import React, { useState } from "react";
import './Register.css';

export default function Register({ onClose, onSwitch }) {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    phone: ''
  });

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Registered!');
        if (onClose) onClose();
      } else {
        alert(data.message || 'Registration failed');
      }
    } catch (err) {
      alert('Registration error');
    }
  };

  return (
    <div className="auth-modal">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Register</h2>
        <input name="username" type="text" placeholder="Username" value={form.username} onChange={handleChange} required />
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
        <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />
        <input name="phone" type="tel" placeholder="Phone Number" value={form.phone} onChange={handleChange} required />
        <button type="submit">Register</button>
        <button type="button" className="close-btn" onClick={onClose}>Cancel</button>
        <div className="auth-switch-msg" style={{marginTop: '1.2rem'}}>
          <p style={{color: 'red', marginBottom: '0.5rem'}}>If you already have an account, you can log in below.</p>
          <span>
            <span className="auth-link" onClick={() => { onClose && onClose(); onSwitch && onSwitch('login'); }}>
              Go to Login
            </span>
          </span>
        </div>
      </form>
    </div>
  );
}
