import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Cookies from "js-cookie";
import logo from '../assets/logo.png'
export default function NavBar() {
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(Cookies.get("id")));
  const [id, setId] = useState("");

  useEffect(() => {
    const token = Cookies.get("authToken"); // or whatever cookie your server sets
    const userCookie = Cookies.get("username"); // optional, if you store username in cookie

    if (token) {
      setIsLoggedIn(true);
      setId(userCookie);
    } else {
      setIsLoggedIn(false);
      setId("");
    }
  }, []); // runs once when NavBar mounts

  return (
    <nav className="navbar">
      <h1 className="logo"><img className = "image-logo" src={logo} alt="" /><a href="/">PageByPage</a></h1>
      <div className="nav-links">
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/about" className="nav-link active">About</Link>
        <Link to="/explore" className="nav-link active">Explore</Link>
        <Link to="/digest" className="nav-link active">Digest</Link>
        {isLoggedIn ? (
          <>
            <Link to="/logout" className="nav-link">Logout</Link>
            <Link to={`/profile/${Cookies.get("id")}`} className="btn-primary">Profile</Link>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="btn-primary">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
}
