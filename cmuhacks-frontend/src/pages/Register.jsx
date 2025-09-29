import { useState } from "react";
import Cookies from "js-cookie";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import LoadingSpinner from "../components/LoadingSpinner";
import { useNavigate } from "react-router-dom";

export default function Register() {
  require('dotenv').config();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [errorColor, setErrorColor] = useState("red");
  const [showError, setShowError] = useState(false);

  const navigate = useNavigate();

  const registerUser = async (event) => {
    event.preventDefault();
    setLoading(true);
    
    try {
      if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
        throw Error("Invalid email, try again.");
      }

      const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      };

      const res = await fetch(process.env.BACKEND_URL, requestOptions);
      const data = await res.json();

      if (data["status"] == "SUCCESS") {
        Cookies.set("id", data.id, { expires: 0.0416 });
        Cookies.set("authToken", "True", { expires: 0.0416 });
        setErrorMessage("Success! Signing you up...");
        setErrorColor("green");
        setShowError(false);
        navigate("/", { replace: true });
      } else {
        setErrorMessage(data["message"]);
        setErrorColor("red");
        setShowError(true);
      }
    } catch (err) {
        setErrorMessage(err.message);
        setErrorColor("red");
        setShowError(true);
    }
    setLoading(false);
  };

  return (
    <div className="register-page bubble-background">
      <NavBar />

      <section className="register-section" style={{ position: "relative" }}>
        {/* Loading overlay */}
        {loading && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(255,255,255,0.8)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 10,
            }}
          >
            <LoadingSpinner />
          </div>
        )}
        <div className="register-container fade-in-up">
          <h1 className="register-title">Create an Account</h1>
          <p className="register-subtitle">Join the community of simplified research.</p>

          <form className="register-form" onSubmit={registerUser}>
            <div className="form-group">
              <label htmlFor="username" className="form-label">Username</label>
              <input
                type="text"
                id="registerUsername"
                className="form-input"
                placeholder="Choose a username"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                type="text"
                id="registerEmail"
                className="form-input"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                type="password"
                id="registerPassword"
                className="form-input"
                placeholder="Create a password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <p
                style={{
                    color: errorColor,
                    display: showError ? "block" : "none",
                    margin: 0,
                    padding: 0,
                }}
            >{errorMessage}</p>
            <button type="submit" className="btn-primary">Sign Up</button>
          </form>

          <p className="register-footer-text">
            Already have an account? <a href="/login" className="link-text">Log in</a>
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
