import { Route, Routes, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import About from './pages/About'
import Login from './pages/Login'
import Register from './pages/Register'
import Explore from './pages/Explore'
import Digest from './pages/Digest'
import Render from './pages/Render'
import Profile from './pages/Profile'
import Logout from './pages/Logout'
import Cookies from "js-cookie"

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="/about" element={<About />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/explore" element={<Explore />} />
      <Route path="/digest" element={<Digest />} />
      <Route path="/logout" element={<Logout />} />
      <Route path="/render/:unique_id" element={<Render />} />
      <Route path={`/profile/:unique_id`} element={<Profile />} />
    </Routes>
  )
}

export default App
