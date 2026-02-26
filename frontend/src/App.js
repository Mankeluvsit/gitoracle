import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import SearchPage from "@/pages/SearchPage";
import TrendingPage from "@/pages/TrendingPage";
import BookmarksPage from "@/pages/BookmarksPage";
import ComparePage from "@/pages/ComparePage";
import RepoDetailPage from "@/pages/RepoDetailPage";
import UserDetailPage from "@/pages/UserDetailPage";
import { NavBar } from "@/components/NavBar";

function App() {
  return (
    <div className="min-h-screen bg-background">
      <BrowserRouter>
        <NavBar />
        <Routes>
          <Route path="/" element={<SearchPage />} />
          <Route path="/trending" element={<TrendingPage />} />
          <Route path="/bookmarks" element={<BookmarksPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/repo/:owner/:name" element={<RepoDetailPage />} />
          <Route path="/user/:login" element={<UserDetailPage />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="bottom-right" />
    </div>
  );
}

export default App;
