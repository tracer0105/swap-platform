import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { WebSocketProvider } from "./contexts/WebSocketContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ItemDetail from "./pages/ItemDetail";
import PublishItem from "./pages/PublishItem";
import Exchanges from "./pages/Exchanges";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";

export default function App() {
  return (
    <BrowserRouter>
      <WebSocketProvider>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/items/:id" element={<ItemDetail />} />
              <Route
                path="/publish"
                element={
                  <ProtectedRoute>
                    <PublishItem />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/items/:id/edit"
                element={
                  <ProtectedRoute>
                    <PublishItem />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/exchanges"
                element={
                  <ProtectedRoute>
                    <Exchanges />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chat"
                element={
                  <ProtectedRoute>
                    <Chat />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
        </div>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: { borderRadius: "12px", fontSize: "14px" },
          }}
        />
      </WebSocketProvider>
    </BrowserRouter>
  );
}
