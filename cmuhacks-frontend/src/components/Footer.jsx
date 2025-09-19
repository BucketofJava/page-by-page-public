import { Link } from "react-router-dom";

export default function Footer() {
    return (
        <footer className="footer">
          © {new Date().getFullYear()} PageByPage. All rights reserved.
        </footer>
    )
}