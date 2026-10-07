import { Route, Routes, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import LandingPage from './pages/LandingPage'
import OnboardingPage from './pages/OnboardingPage'
import AppLayout from './components/app/AppLayout'
import DashboardPage from './pages/app/DashboardPage'
import WebsitesPage from './pages/app/WebsitesPage'
import WebsiteDetailPage from './pages/app/WebsiteDetailPage'
import IssuesPage from './pages/app/IssuesPage'
import IssueDetailPage from './pages/app/IssueDetailPage'
import AgentsPage from './pages/app/AgentsPage'
import AutomationsPage from './pages/app/AutomationsPage'
import ReportsPage from './pages/app/ReportsPage'
import ActivityPage from './pages/app/ActivityPage'
import NotificationsPage from './pages/app/NotificationsPage'
import SettingsPage from './pages/app/SettingsPage'
import BillingPage from './pages/app/BillingPage'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="websites" element={<WebsitesPage />} />
          <Route path="websites/:siteId" element={<WebsiteDetailPage />} />
          <Route path="issues" element={<IssuesPage />} />
          <Route path="issues/:issueId" element={<IssueDetailPage />} />
          <Route path="agents" element={<AgentsPage />} />
          <Route path="automations" element={<AutomationsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="activity" element={<ActivityPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="billing" element={<BillingPage />} />
        </Route>
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </>
  )
}
