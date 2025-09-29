import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import LoadingSpinner from "../components/LoadingSpinner";

export default function Login() {
  require('dotenv').config();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const [errorMessage, setErrorMessage] = useState("");
    const [errorColor, setErrorColor] = useState("red");
    const [showError, setShowError] = useState(false);

    const navigate = useNavigate();

    const loginUser = async (event) => {
        event.preventDefault();
        setLoading(true);

        try {
            if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
                throw Error("Invalid email, try again.");
            }

            const requestOptions = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            };

            const res = await fetch(process.env.BACKEND_URL, requestOptions);
            const data = await res.json();

            if (data["status"] == "SUCCESS") {
                Cookies.set("id", data.id, { expires: 0.0416 });
                Cookies.set("authToken", "True", { expires: 0.0416 });
                setErrorMessage("");
                setErrorColor("green");
                setShowError(false);
                setLoading(false);
                navigate("/", { replace: true });
            } else {
                setErrorMessage(data[message]);
                setErrorColor("red");
                setShowError(true);
                setLoading(false);
            }
        } catch (err) {
            setErrorMessage(err.message);
            setErrorColor("red");
            setShowError(true);
            setLoading(false);
        }
        };

  return (
    <div className="login-page bubble-background">
      <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
      <NavBar />

      <section className="login-section">
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
<div className="login-container fade-in-up">
          <h1 className="login-title">Welcome Back</h1>
          <p className="login-subtitle">Log in to continue exploring research made simple.</p>

          <form className="login-form" onSubmit={loginUser}>
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                type="text"
                id="email"
                className="form-input"
                placeholder="Enter your email"
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                type="password"
                id="password"
                className="form-input"
                placeholder="Enter your password"
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
            <button type="submit" className="btn-primary">Log In</button>
          </form>

          <p className="login-footer-text">
            Don’t have an account? <a href="/register" className="link-text">Sign up</a>
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}