import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";

export default function Profile() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [preferences, setPreferences] = useState([]);
  const [articlesRead, setArticlesRead] = useState([]);
  const [articlesLiked, setArticlesLiked] = useState([]);

  const [showAllRead, setShowAllRead] = useState(false);
  const [showAllLiked, setShowAllLiked] = useState(false);

  const { unique_id } = useParams();

  useEffect(() => {
    fetch(`backend_url/profile_new/${unique_id}`)
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        setUsername(data[1]);
        setEmail(data[2]);
        setPreferences(data[5] || []);
        setArticlesRead(data[3] || []);
        setArticlesLiked(data[4] || []);
      })
      .catch((err) => {
        console.error("Error fetching profile:", err);
      });
  }, [unique_id]); // only refetch when id changes

  return (
    <div className="profile-page">
      <NavBar />

      <section className="profile-section">
        {/* User Info */}
        <h1 className="profile-title">Profile</h1>
        <div className="profile-info">
          <p><strong>Username:</strong> {username}</p>
          <p><strong>Email:</strong> {email}</p>
          <p>
            <a href="/reset" className="reset-password-link">
              Reset Password
            </a>
          </p>
        </div>

        {/* Preferences */}
        <h2 className="section-title">Preferences</h2>
        <div className="preferences">
          {preferences.map((pref) => (
            <span key={pref} className="preference-chip">{pref}</span>
          ))}
        </div>

        {/* Articles */}
        <ArticleSection
          title="Articles Read"
          articles={articlesRead}
          showAll={showAllRead}
          setShowAll={setShowAllRead}
        />
        <ArticleSection
          title="Articles Liked"
          articles={articlesLiked}
          showAll={showAllLiked}
          setShowAll={setShowAllLiked}
        />
      </section>

      <Footer />
    </div>
  );
}

function ArticleSection({ title, articles, showAll, setShowAll }) {
  const preview = articles.slice(0, 3);

  return (
    <div className="article-section">
      <h2 className="section-title">{title}</h2>
      <ul className="article-list">
        {(showAll ? articles : preview).map((article) => (
          <li key={article.id}>
            <a href={`/render/${article.id}`} className="article-link">
              {article.title}
            </a>
          </li>
        ))}
      </ul>
      {articles.length > 3 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="toggle-button"
        >
          {showAll ? "Show Less" : "Show All"}
        </button>
      )}
    </div>
  );
}
