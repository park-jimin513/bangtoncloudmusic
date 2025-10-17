import React, { useState } from "react";
import './Login.css';

export default function ForgotPassword({ onClose, onSwitch }) {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleSend = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setStep(2); // Move to OTP step
      } else {
        alert(data.message || "Failed to send OTP");
      }
    } catch (err) {
      alert("Network error");
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        if (onClose) onClose();
      } else {
        alert(data.message || "Failed to reset password");
      }
    } catch (err) {
      alert("Network error");
    }
  };

  return (
    <div className="auth-modal">
      {step === 1 ? (
        <form className="auth-form" onSubmit={handleSend}>
          <h2>Forgot Password</h2>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <button type="submit">Send</button>
          <button type="button" className="close-btn" onClick={onClose}>Cancel</button>
          <div style={{marginTop: '1.2rem', textAlign: 'center'}}>
            <span
              className="auth-link"
              style={{color: '#4b4bff', textDecoration: 'underline', cursor: 'pointer'}}
              onClick={() => { onClose && onClose(); onSwitch && onSwitch('login'); }}
            >
              Go to Login
            </span>
          </div>
        </form>
      ) : (
        <form className="auth-form" onSubmit={handleReset}>
          <h2>Reset Password</h2>
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={e => setOtp(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Enter new password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            required
          />
          <button type="submit">Reset Password</button>
          <button type="button" className="close-btn" onClick={onClose}>Cancel</button>
        </form>
      )}
    </div>
  );
}