import { useState, useEffect } from "react";
import Login from "./Login";
import Register from "./Register";
import UserDashboard from "./UserDashboard";

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  // Load user from localStorage on first render
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem("user"));

  // Update localStorage whenever user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  const members = [
    "Rm.jpg",
    "jin.jpeg",
    "suga.jpeg",
    "jhope.jpeg",
    "jimin.jpeg",
    "Mr.v.jpeg",
    "jk.jpeg",
  ];

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <div className={`fullscreen-app${darkMode ? " dark" : ""}`}>
      {/* Top Bar */}
      <div className="top-bar">
        <div className="top-left">
          <span className="logo-text">BANGTON CLOUD</span>
        </div>
        <div className="top-center"></div>
        <div className="top-right">
          {!isLoggedIn && (
            <>
              <button className="login-btn" onClick={() => setShowLogin(true)}>Login</button>
              <button className="register-btn" onClick={() => setShowRegister(true)}>Register</button>
            </>
          )}
          <button
            className="toggle-mode-btn"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? "☀️ Light" : "🌙 Dark"}
          </button>
        </div>
      </div>

      {isLoggedIn ? (
        <UserDashboard user={user} onLogout={handleLogout} />
      ) : (
        <>
          {/* Login/Register Modals */}
          {showLogin && (
            <Login
              onClose={() => setShowLogin(false)}
              onSwitch={(type) => {
                setShowLogin(false);
                if (type === "register") setShowRegister(true);
              }}
              onLoginSuccess={(userObj) => {
                setShowLogin(false);
                setIsLoggedIn(true);
                setUser(userObj);
                localStorage.setItem("user", JSON.stringify(userObj));
              }}
            />
          )}
          {showRegister && (
            <Register
              onClose={() => setShowRegister(false)}
              onSwitch={(type) => {
                setShowRegister(false);
                if (type === "login") setShowLogin(true);
              }}
            />
          )}
        </>
      )}

      {/* BTS Members Carousel */}
      <div className="bts-carousel">
        <div className="bts-carousel-track">
          {members.map((img, idx) => (
            <div className="bts-img-frame" key={img + idx}>
              <img
                src={`/bts/${img}`} // ✅ Updated path for public folder
                alt={img.replace(/\.(jpg|jpeg)$/, "")}
                className="bts-img"
              />
            </div>
          ))}

          {/* Duplicate images for seamless loop */}
          {members.map((img, idx) => (
            <div className="bts-img-frame" key={img + "dup" + idx}>
              <img
                src={`/bts/${img}`} // ✅ Updated path
                alt={img.replace(/\.(jpg|jpeg)$/, "")}
                className="bts-img"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        © 2025 BANGTON CLOUD. All rights reserved.
      </footer>
    </div>
  );
}

export default App;
