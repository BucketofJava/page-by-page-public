import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import lightning from '../assets/lightning-bolt.svg';
import search from '../assets/search-web.svg';
import fire from '../assets/fire.svg';
import cog from '../assets/cog.svg';
import Cookies from "js-cookie";

export default function Landing() {
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
      <div className="landing-page bubble-background">
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

        {/* Hero Section */}
        <section className="hero">
          <h2 className="hero-title"><div className="hero-title-header fade-in-up">Research.</div> <div className="hero-title-body fade-in">Made Understandable.</div></h2>
          <p className="hero-text cursor typewriter-animation fade-in">
            Discover research papers like never before. Read summaries, follow trends, and
            understand complex topics with AI-powered explanations.
          </p>
          {isLoggedIn ? (
            <>
                <Link to="/explore" className="btn-shiny">Explore</Link>
            </>
            ) : (
            <>
                <Link to="/register" className="btn-shiny  getStarted">Get Started</Link>
            </>
          )}
          
        </section>

        {/* Features Section */}
        <section id="features" className="features">
          <h3 className="section-title">Features Built for <span className="hero-title-header">You.</span></h3>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon"><img src={lightning} alt="A" /></div>
              <h4 className="feature-title">AI Summaries</h4>
              <p className="feature-text">
                Turn complex papers into simple, engaging summaries anyone can understand.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon"><img src={search} alt="G" /></div>
              <h4 className="feature-title">Smart Glossary</h4>
              <p className="feature-text">
                Highlight and look up technical terms instantly while reading.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon"><img src={fire} alt="T" /></div>
              <h4 className="feature-title">Trending Papers</h4>
              <p className="feature-text">
                Stay updated with trending research on the hottest topics.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon"><img src={cog} alt="P" /></div>
              <h4 className="feature-title">Personalized Page</h4>
              <p className="feature-text">
                Discover new articles tailored to your interests.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta">
          <h3 className="cta-title">Ready to explore research like never before?</h3>
          {isLoggedIn ? (
            <>
                <Link to="/explore" className="btn-shiny">Explore</Link>
            </>
            ) : (
            <>
                <Link to="/register" className="btn-shiny">Register Now</Link>
            </>
          )}
        </section>

        <Footer />
      </div>
  );
}