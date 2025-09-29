import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import LoadingSpinner from "../components/LoadingSpinner";
import HighlightTextBox from "../components/PrettyText";
import 'bootstrap/dist/css/bootstrap.min.css';
import '../index.css'
import Cookies from 'js-cookie'
export default function Render() {
  const { unique_id } = useParams(); // grab ID from URL
  const [paper, setPaper] = useState(null);
  const [link, setLink]=useState(null);
  const [loading, setLoading] = useState(true);
  const backendURL=import.meta.env.VITE_BACKEND_URL;
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
    <div className="paper-page relative min-h-screen bg-gradient-to-b from-sky-50 via-white to-orange-50">
      <div className="bg-dots absolute inset-0 pointer-events-none"></div>
      <NavBar />

      <section className="paper-section" style={{ padding: "2rem 3%", maxWidth: "100%", margin: 0, boxSizing: "border-box" }}>
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

        {/* PDF viewer */}
        <div className="bg-white/90 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-md p-4 sm:p-6 md:p-8 mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-800">Paper PDF</h2>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const iframe = document.querySelector(".paper-iframe");
                  if (iframe && iframe.requestFullscreen) {
                    iframe.requestFullscreen();
                  }
                }}
                className="bg-sky-600 hover:bg-sky-700 text-white px-3 py-1.5 rounded-md text-sm"
              >
                Fullscreen
              </button>
              {link && (
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-md text-sm border border-slate-300"
                >
                  Open PDF
                </a>
              )}
            </div>
          </div>
          <div className="rounded-xl overflow-hidden border border-slate-200">
            <iframe
              src={link}
              title="PDF of paper"
              className="paper-iframe w-full"
              style={{ height: "75vh", backgroundColor: "#f8fafc" }}
            ></iframe>
          </div>
          <p className="text-sm text-slate-500 mt-3">This PDF is embedded from <a href="https://arxiv.org" target="_blank" rel="noopener noreferrer" className="text-sky-700 underline">arXiv.org</a>.</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
