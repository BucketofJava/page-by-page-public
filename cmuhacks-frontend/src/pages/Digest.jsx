import { useState, useEffect, useRef, useCallback } from "react";
import FeedPapers from "../components/FeedPaper";
import NavBar from "../components/NavBar";
import Cookies from 'js-cookie'
// --- Helper Components (Previously Imported) ---

// A simple loading spinner component
const LoadingSpinner = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .spinner {
        border: 4px solid rgba(0, 0, 0, 0.1);
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border-left-color: #09f;
        animation: spin 1s ease infinite;
      }
    `}</style>
    <div className="spinner"></div>
  </div>
);

// A simple navigation bar component
// const NavBar = () => (
//   <nav style={{ 
//     padding: '1rem 2rem', 
//     backgroundColor: 'rgba(255, 255, 255, 0.8)',
//     backdropFilter: 'blur(10px)',
//     borderBottom: '1px solid #eee',
//     position: 'sticky',
//     top: '0',
//     zIndex: '10'
//     }}>
//     <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Paper Digest</h2>
//   </nav>
// );

// A simple footer component
const Footer = () => (
  <footer style={{ textAlign: 'center', padding: '2rem', color: '#888', borderTop: '1px solid #eee' }}>
    <p>&copy; 2024 Paper Digest. All rights reserved.</p>
  </footer>
);

// Component to display a single paper in the feed
// const FeedPaper = ({ title, summary }) => (
//   <div style={{
//     backgroundColor: 'white',
//     border: '1px solid #e0e0e0',
//     borderRadius: '8px',
//     padding: '1.5rem',
//     marginBottom: '1rem',
//     boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
//   }}>
//     <h3 style={{ marginTop: 0, marginBottom: '0.5rem' }}>{title}</h3>
//     <p style={{ margin: 0, color: '#555' }}>{summary}</p>
//   </div>
// );


export default function Digest() {
  // --- Configuration ---
  const BATCH_SIZE = 1; // How many paper IDs to fetch at a time
  const backendURL = "https://968ee4ce63a7.ngrok-free.app";

  // --- State Management ---
  const [feedData, setFeedData] = useState([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loadingRef = useRef(false);
  const [loaded, setLoaded] = useState(false);
  /**
   * Fetches a batch of recommended paper IDs, then fetches the title for each ID concurrently.
   */
  useEffect(() => {
    setLoaded(true);
  }, []);
  function get_id_safe(){
    try{
      if(Cookies.get('id') == null){return 1;}
      console.log(Cookies.get('id'))
      return parseInt(Cookies.get('id'))
    }catch{
      return 1;
    }
  }
  const loadMorePapers = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;

    loadingRef.current = true;
    setIsLoading(true);

    try {
      // --- Step 1: Fetch a batch of recommended paper IDs ---
      const recommendationsResponse = await fetch(`${backendURL}/get_feed_papers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({id: get_id_safe(),  page: page, batch_size: BATCH_SIZE }),
      });

      if (!recommendationsResponse.ok) {
        throw new Error(`API error at /get_recommendations: ${recommendationsResponse.statusText}`);
      }

      const recommendationsData = await recommendationsResponse.json();
      const paperPromises = recommendationsData.recommendations.map(id => {
        return fetch(`${backendURL}/get_complete_summary`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: id }),
        }).then(response => {
          if (!response.ok) {
            console.error(`Failed to fetch title for ID ${id}: ${response.statusText}`);
            return null; // Return null for failed requests so Promise.all doesn't fail
          }
          // Assuming the response is JSON like { unique_id: '...', paper_title: '...' }
          return response.json();
    })});
      const papers = await Promise.all(paperPromises);
      const newPapers = papers.filter(paper => paper !== null); // Filter out failed requests
      // Append new papers to the feed and increment the page
      setFeedData(prevData => [...prevData, ...newPapers]);
      setPage(prevPage => prevPage + 1);

    } catch (error) {
     // console.log(recommendationsData)
      console.error("An error occurred while loading more papers:", error);
      setHasMore(false); // Stop trying on critical failure
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, [page, hasMore]);

  // --- Effects ---

  // Fetch initial papers on component mount
  useEffect(() => {
    loadMorePapers();
  }, []); // Empty array ensures this runs only once

  // Set up the scroll listener for infinite scrolling
  useEffect(() => {
    const handleScroll = () => {
      const isAtBottom = window.innerHeight + document.documentElement.scrollTop >= document.documentElement.scrollHeight - 100;
      if (isAtBottom && !loadingRef.current) {
        loadMorePapers();
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loadMorePapers]); // Dependency ensures the latest function is used

  // --- Rendering ---
  return (
    <div className="feed-page" style={{ backgroundColor: '#f9f9f9', minHeight: '100vh' }}>
      {/* These bubble divs are for styling from the original, assuming they exist in your CSS */}
      <div className="bubble"></div>
      <div className="bubble"></div>
      <div className="bubble"></div>
      <div className="bubble"></div>
      <NavBar />
      <section className="feed-section fade-in-up" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <h1 className={`feed-page-title ${loaded ? "loaded" : ""}`} style={{ marginBottom: '2rem' }} >Your Feed</h1>
        <div className="feed-container">
          {feedData.map((paper, i) => (
            // The key should be a unique identifier from the paper object
            <FeedPapers
              key={i}
              //authors={paper.authors} 
              title={paper.paper_title[0]}
              id={paper.unique_id}
              summary={paper.paper_title[1].substring(3, paper.paper_title[1].length - 4) || ""} // Provide a fallback for summary
              likes={10}
              //tags={paper.tags}
            />
          ))}
        </div>
        
        {isLoading && <LoadingSpinner />}
        
        {!hasMore && !isLoading && (
          <p style={{ textAlign: 'center', marginTop: '2rem', color: '#666' }}>
            You've reached the end! 🎉
          </p>
        )}
      </section>
      <Footer />
    </div>
  );
}

