import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";

export default function Logout() {
    const navigate = useNavigate();

    useEffect(() => {
        // Remove cookies
        Cookies.remove("authToken", { path: "/" });
        Cookies.remove("id", { path: "/" });

        // Navigate back to home
        navigate("/", { replace: true });
    }, [navigate]);

    // Optionally, show a message or nothing while redirecting
    return <p>Logging out...</p>;
}
