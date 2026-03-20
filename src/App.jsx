import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import { AuthProvider } from './lib/AuthContext'
import { prefetchForum } from './lib/preload'
import './App.css'

// Kick off forum data fetching immediately — resolved before user navigates there
prefetchForum()

const Home        = lazy(() => import('./pages/Home'))
const About       = lazy(() => import('./pages/About'))
const Membership  = lazy(() => import('./pages/Membership'))
const Join        = lazy(() => import('./pages/Join'))
const News        = lazy(() => import('./pages/News'))
const Consulting  = lazy(() => import('./pages/Consulting'))
const Forum       = lazy(() => import('./pages/Forum'))
const Contact     = lazy(() => import('./pages/Contact'))
const Admin       = lazy(() => import('./pages/Admin'))
const NewsArticle = lazy(() => import('./pages/NewsArticle'))
const MemberLogin = lazy(() => import('./pages/MemberLogin'))
const Profile     = lazy(() => import('./pages/Profile'))
const Settings    = lazy(() => import('./pages/Settings'))
const Leaderboard = lazy(() => import('./pages/Leaderboard'))

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function PageLoader() {
  return (
    <div className="page-loader">
      <span className="page-loader-spinner" />
    </div>
  )
}

function MainLayout() {
  return (
    <>
      <Header />
      <Outlet />
      <Footer />
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <div className="app">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route element={<MainLayout />}>
                <Route path="/"           element={<Home />} />
                <Route path="/about"      element={<About />} />
                <Route path="/membership" element={<Membership />} />
                <Route path="/join"       element={<Join />} />
                <Route path="/news"       element={<News />} />
                <Route path="/news/:id"  element={<NewsArticle />} />
                <Route path="/consulting" element={<Consulting />} />
                <Route path="/forum"      element={<Forum />} />
                <Route path="/contact"    element={<Contact />} />
                <Route path="/profile/:id" element={<Profile />} />
                <Route path="/settings"    element={<Settings />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
              </Route>
              <Route path="/login" element={<MemberLogin />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </Suspense>
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
