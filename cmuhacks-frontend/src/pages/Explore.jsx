import { useState, useEffect } from "react";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import ExplorePaper from "../components/ExplorePaper";
import LoadingSpinner from "../components/LoadingSpinner";

export default function Explore() {
  const [searchTerm, setSearchTerm] = useState(""); // user typing
  const [query, setQuery] = useState(""); // actual search query
  const [filter, setFilter] = useState("All");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [papers, setPapers] = useState([]); // fetched papers
  const [loading, setLoading] = useState(false); // loading state
  const backendURL="http://127.0.0.1:5000"
  // Simulated fetch/search function
const fetchPapers = async () => {
  try {
    // --- Step 1: Fetch recommended article IDs for a dummy user ---
    const recommendationsResponse = await fetch(`${backendURL}/get_random`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: 1 }),
    });

    if (!recommendationsResponse.ok) {
      throw new Error(`API error at /get_recommendations: ${recommendationsResponse.statusText}`);
    }

    const recommendationsData = await recommendationsResponse.json();
    const articleIds = recommendationsData.recommendations;
    console.log('recs')
    console.log(recommendationsData.recommendations)
    if (!articleIds || articleIds.length === 0) {
      return []; // Exit early if no recommendations
    }

    // --- Step 2: Fetch details for each paper ID concurrently ---
    
    // Create an array of promises, where each promise is a fetch request for one paper
    const paperPromises = articleIds.map(id => {
      return fetch(`${backendURL}/get_paper_title`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: id }), // Sending a single ID
      }).then(response => {
        if (!response.ok) {
          // Log an error for the failed ID but don't stop the others
          console.error(`Failed to fetch paper with ID ${id}: ${response.statusText}`);
          return null; // Return null for failed requests
        }
        return response.json(); // Parse the JSON for successful requests
      });
    });

    // Wait for all the fetch promises to resolve
    const papers = await Promise.all(paperPromises);

    // Filter out any null results from failed requests before returning
    return papers.filter(paper => paper !== null);

  } catch (error) {
    console.error("An error occurred while fetching papers:", error);
    // Return an empty array if a critical error occurs
    return [];
  }
};

  // Triggered when user clicks "Search"
  const handleSearch = async () => {
    setLoading(true);
    const results = await fetchPapers(searchTerm, filter);
    setPapers(results);
    setQuery(searchTerm);
    setLoading(false);
  };

  // Triggered whenever filter changes
  useEffect(() => {
    const filterPapers = async () => {
      setLoading(true);
      const results = await fetchPapers(query, filter);
      setPapers(results);
      setLoading(false);
    };
    filterPapers();
  }, [filter, query]);

  return (
    <div className="search-page">
      <NavBar />

      <section className="search-section fade-in-up">
        <h1 className="search-title">Find Research Papers</h1>

        <div className="search-controls">
          <input
            type="text"
            className="search-input"
            placeholder="Search papers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="search-button" onClick={handleSearch}>
            Search
          </button>

          {/* Custom dropdown */}
          <div className="custom-dropdown-wrapper">
            <button
              className="custom-dropdown-toggle"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              {filter || "Select Category"}
              <span className={`arrow ${dropdownOpen ? "open" : ""}`}>▼</span>
            </button>

            <ul className={`custom-dropdown-menu ${dropdownOpen ? "open" : ""}`}>
              {["All", "AI", "Climate", "Quantum", "Security"].map((option) => (
                <li
                  key={option}
                  onClick={() => {
                    setFilter(option);
                    setDropdownOpen(false);
                  }}
                >
                  {option}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {loading ? (
          <div className="loading-wrapper">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="papers-grid">
            {papers.map((paper, index) => (
              <ExplorePaper
                key={index}
                title={paper.paper_title}
                authors={paper.authors}
                summary={paper.summary}
                id={paper.unique_id}
              />
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
