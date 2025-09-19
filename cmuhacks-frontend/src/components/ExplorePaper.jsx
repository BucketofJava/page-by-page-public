import { Link } from "react-router-dom";

export default function ExplorePaper({ title, authors, summary, id }) {
  return (
    <div className="paper-card">
      <Link to={"/render/"+id}><h2 className="paper-title">{title}</h2></Link>
      {/* <p className="paper-authors">By {authors}</p>
      <p className="paper-summary">{summary}</p> */}
      <div className="paper-tags">
        {/* {tags.map((tag, index) => (
          <span key={index} className="paper-tag">{tag}</span>
        ))} */}
      </div>
    </div>
  );
}