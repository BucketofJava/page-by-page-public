import { Link } from "react-router-dom";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";

export default function About() {
  return (
    
      <div className="about-page">
        
        <NavBar />

        {/* Hero Section */}
        <div className="diagonal-stripe stripe-1"></div>
  <div className="diagonal-stripe stripe-2"></div>

        <section className="about-hero fade-in-up">
          <h2 className="about-title">About PageByPage</h2>
          <p className="about-subtitle">
            Making research accessible, understandable, and engaging for everyone.
          </p>
        </section>

        {/* Content Section */}
        <section className="about-content">
          <div className="about-container">
            <h3 className="about-heading fade-in-up">Our Mission</h3>
            <p className="about-text fade-in">
              At PageByPage, we believe research should be accessible to all people. Access to knowledge is a universal right
              and complex ideas shouldn’t be locked behind jargon or paywalls. Our goal is to build an online
              space where anyone can learn, discover, and engage with cutting-edge
              research. 
            </p>

            <h3 className="about-heading fade-in-up">What We Do</h3>
            <p className="about-text fade-in">
              We transform academic papers into digestible summaries that provide intuitive and simple explanations for complex topics with little loss 
              of detail. Our tools simplify technical terms and allow users to quickly retrieve and explore trending research topics, breaking down barriers of entry to the world of academia.
              For just a few minutes a day, you can have access to publications by the top researchers in the world, and understand it with minimal effort.

            </p>

            <h3 className="about-heading fade-in-up">Why It Matters</h3>
            <p className="about-text fade-in">
              We aim to make knowledge universally accessible. By bridging the gap
              between researchers and the world, we empower individuals to stay informed
              and inspired by the latest discoveries. From students to researchers to any curious individual, we provide support in their academic endeavors, saving time and increasing efficiency.
              In this manner, we can slowly change the world–page by page.
            </p>
          </div>
        </section>

        <Footer />
      </div>
  );
}