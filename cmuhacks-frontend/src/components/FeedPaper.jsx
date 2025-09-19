import like from '../assets/like.svg';
import star from '../assets/comment.svg'
import { Link } from 'react-router-dom';
export default function FeedPapers({ title, id, authors, summary, tags, likes }) {
  console.log(id)
  return (
    <div className="feed-card">
      
      <h2 className="feed-title"><Link to={'/render/'+`${id}`}>{title}</Link></h2>
      {/*<p className="feed-authors">By {authors}</p>*/}
      <p className="feed-summary">{summary}</p>

      {/*<div className="feed-tags">
        {tags.map((tag, index) => (
          <span key={index} className="feed-tag">{tag}</span>
        ))}
      </div>*/}

      <div className="feed-actions">
        <span className="feed-likes"><img className = "feed-icon likesIcon" src={like} alt="Likes: " /> {likes}</span>
        {/* <span className="feed-favorite"><img src={star} className = "feed-icon starIcon" alt="" /> {favorites}</span> */}
      </div>
      
    </div>
  );
}
