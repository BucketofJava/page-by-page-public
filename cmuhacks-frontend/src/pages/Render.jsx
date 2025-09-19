import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import LoadingSpinner from "../components/LoadingSpinner";
import HighlightTextBox from "../components/PrettyText";
import Cookies from 'js-cookie'
import { get } from "mongoose";
export default function Render() {
  const { unique_id } = useParams(); // grab ID from URL
  const [paper, setPaper] = useState(null);
  const [link, setLink]=useState(null);
  const [loading, setLoading] = useState(true);
  const backendURL="http://127.0.0.1:5000"
 useEffect(() => {
    // Don't try to fetch if the unique_id isn't available yet
    if (!unique_id) {
      setPaper(null);
      return;
    }

    const fetchPaper = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${backendURL}/get_paper_body`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: unique_id }),
        });

        if (!response.ok) {
          throw new Error(`API Error: ${response.statusText}`);
        }

        const data = await response.json();
        // The data object from the API should contain the 'paper_body' HTML string
        // It might also contain title, authors, etc.
        setPaper(data.paper_body[0]);
        setLink(data.paper_body[1])
        console.log("data", data);
      } catch (error) {
        console.error("Error fetching paper body:", error);
        setPaper(null); // Set to null on error to show a "Not Found" message
      } finally {
        setLoading(false);
      }
    };
  function get_id_safe(){
      
    try{
      if(Cookies.get('id') == null){return 1;}
      console.log(Cookies.get('id'))
      return parseInt(Cookies.get('id'))
    }catch{
      return 1;
    }
  }
    fetchPaper();
    const updateDB = async () => {
      //setLoading(true);
      try {
        const response = await fetch(`${backendURL}/update_user_profile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ user: get_id_safe(), article: unique_id }),
        });

        if (!response.ok) {
          throw new Error(`API Error: ${response.statusText}`);
        }

        const data = await response.json();
        // The data object from the API should contain the 'paper_body' HTML string
        // It might also contain title, authors, etc.
        console.log(data)
      } catch (error) {
        console.error("Error fetching paper body:", error);
        //setPaper(null); // Set to null on error to show a "Not Found" message
      } finally {
       // setLoading(false);
      }
    };
    updateDB()
  }, [unique_id]);

  if (loading) {
    return (
      <div className="paper-page">
        <NavBar />
        <div className="loading-wrapper" style={{ textAlign: "center", marginTop: "3rem" }}>
          <LoadingSpinner />
        </div>
        <Footer />
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="paper-page">
        <NavBar />
        <div style={{ textAlign: "center", marginTop: "3rem" }}>
          <h2>Paper not found</h2>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="paper-page">
      <NavBar />

      <section className="paper-section" style={{ padding: "2rem 5%", maxWidth: "900px", margin: "auto" }}>
        <HighlightTextBox text={paper} />
        {/* <h1 className="paper-title" style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "1rem" }}>
          {paper.title}
        </h1>
        <p className="paper-authors" style={{ fontStyle: "italic", marginBottom: "1.5rem" }}>
          {paper.authors}
        </p>
        <div className="paper-tags" style={{ marginBottom: "1rem" }}>
          {paper.tags.map((tag) => (
            <span
              key={tag}
              style={{
                display: "inline-block",
                backgroundColor: "#E0F2FF",
                color: "#0077CC",
                padding: "0.25rem 0.5rem",
                borderRadius: "5px",
                marginRight: "0.5rem",
                fontSize: "0.85rem",
              }}
            >
              {tag}
            </span>
          ))}
        </div> */}

        {/* Fullscreen toggle */}
        <div style={{ marginBottom: "1rem" }}>
        <button
            onClick={() => {
            const iframe = document.querySelector(".paper-iframe");
            if (iframe.requestFullscreen) {
                iframe.requestFullscreen();
            }
            }}
            style={{
            backgroundColor: "#0077CC",
            color: "#fff",
            padding: "0.5rem 1rem",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "0.9rem",
            }}
        >
            Expand to Fullscreen
        </button>
        </div>

        <iframe src={link} title="PDF of paper" className="paper-iframe"></iframe>
        <p style={{fontSize: "0.9rem", color: "#666", marginBottom: "1.5rem"}}>This paper PDF is embedded directly from <a href="https://arxiv.org" target="_blank" rel="noopener noreferrer" style={{ color: "#0077CC", textDecoration: "underline" }}>arXiv.org</a>.</p>
      </section>

      <Footer />
    </div>
  );
}
