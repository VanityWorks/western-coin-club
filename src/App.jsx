import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import { AuthProvider } from './lib/AuthContext'
import './App.css'

const Home        = lazy(() => import('./pages/Home'))
const About       = lazy(() => import('./pages/About'))
const Membership  = lazy(() => import('./pages/Membership'))
const Join        = lazy(() => import('./pages/Join'))
const News        = lazy(() => import('./pages/News'))
const Consulting  = lazy(() => import('./pages/Consulting'))
const Forum       = lazy(() => import('./pages/Forum'))
const Contact     = lazy(() => import('./pages/Contact'))
const Admin       = lazy(() => import('./pages/Admin'))
const MemberLogin = lazy(() => import('./pages/MemberLogin'))
const Profile     = lazy(() => import('./pages/Profile'))
const Settings    = lazy(() => import('./pages/Settings'))

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
        <div className="app">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route element={<MainLayout />}>
                <Route path="/"           element={<Home />} />
                <Route path="/about"      element={<About />} />
                <Route path="/membership" element={<Membership />} />
                <Route path="/join"       element={<Join />} />
                <Route path="/news"       element={<News />} />
                <Route path="/consulting" element={<Consulting />} />
                <Route path="/forum"      element={<Forum />} />
                <Route path="/contact"    element={<Contact />} />
                <Route path="/profile/:id" element={<Profile />} />
                <Route path="/settings"   element={<Settings />} />
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
