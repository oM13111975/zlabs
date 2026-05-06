import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'

// Public pages
import LoginPage from './pages/LoginPage'
import CareersPage from './pages/CareersPage'
import { PublicSubmitPage } from './pages/PublicSubmitPage'
import { LandingPage } from './pages/LandingPage'

// Admin pages
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { ApplicantsPage } from './pages/admin/ApplicantsPage'
import { InternsPage } from './pages/admin/InternsPage'
import { InternProfilePage } from './pages/admin/InternProfilePage'
import { TeamsPage } from './pages/admin/TeamsPage'
import { ProjectsPage } from './pages/admin/ProjectsPage'
import { ActivityLogsPage } from './pages/admin/ActivityLogsPage'
import { UsersPage } from './pages/admin/UsersPage'
import { MembersPage } from './pages/admin/MembersPage'
import { MemberProfilePage } from './pages/admin/MemberProfilePage'
import HierarchyPage from './pages/admin/HierarchyPage'
import { EnrollPage } from './pages/admin/EnrollPage'

// Shared
import { TasksPage } from './pages/TasksPage'
import { ProfilePage } from './pages/ProfilePage'
import { ChatPage } from './pages/ChatPage'

// Team Member & Team Head
import { TeamMemberDashboard } from './pages/member/TeamMemberDashboard'
import { TeamHeadDashboard } from './pages/teamhead/TeamHeadDashboard'

// ── Protected Route ─────────────────────────────────────────────────────────
const Protected = ({ children, roles }) => {
  const { user, loading, role } = useAuth()
  
  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', color: '#64748b', fontSize: 14 }}>
      Verifying session...
    </div>
  )

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (roles && !roles.includes(role)) {
    return <Navigate to="/" replace />
  }

  return children
}

const HomeRedirect = () => {
  const { user, loading, role } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  const routes = { super_admin: '/admin', admin: '/admin', mentor: '/team', team_member: '/team', team_head: '/team-head', intern: '/intern-portal' }
  return <Navigate to={routes[role] || '/login'} replace />
}

// Intern pages
import { InternDashboard } from './pages/intern/InternDashboard'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/profile" element={<Protected><ProfilePage /></Protected>} />
          <Route path="/chat" element={<Protected><ChatPage /></Protected>} />
          <Route path="/zportal" element={<LandingPage />} />
          <Route path="/home" element={<HomeRedirect />} />
          <Route path="/careers" element={<CareersPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/submit/:token" element={<PublicSubmitPage />} />

          {/* ── Admin ──────────────────────────────────────────────── */}
          <Route path="/admin" element={<Protected roles={['admin', 'super_admin']}><AdminDashboard /></Protected>} />
          <Route path="/admin/applicants" element={<Protected roles={['admin', 'super_admin']}><ApplicantsPage /></Protected>} />
          <Route path="/admin/interns" element={<Protected roles={['admin', 'super_admin']}><InternsPage /></Protected>} />
          <Route path="/admin/members" element={<Protected roles={['admin', 'super_admin']}><MembersPage /></Protected>} />
          <Route path="/admin/members/:id" element={<Protected roles={['admin', 'super_admin']}><MemberProfilePage /></Protected>} />
          <Route path="/admin/interns/:id" element={<Protected roles={['admin', 'super_admin']}><InternProfilePage /></Protected>} />
          <Route path="/admin/teams" element={<Protected roles={['admin', 'super_admin']}><TeamsPage /></Protected>} />
          <Route path="/admin/projects" element={<Protected roles={['admin', 'super_admin']}><ProjectsPage /></Protected>} />
          <Route path="/admin/tasks/interns" element={<Protected roles={['admin', 'super_admin']}><TasksPage role="admin" taskType="intern" /></Protected>} />
          <Route path="/admin/tasks/projects" element={<Protected roles={['admin', 'super_admin']}><TasksPage role="admin" taskType="project" /></Protected>} />
          <Route path="/admin/users" element={<Protected roles={['admin', 'super_admin']}><UsersPage /></Protected>} />
          <Route path="/admin/hierarchy" element={<Protected roles={['admin', 'super_admin']}><HierarchyPage /></Protected>} />
          <Route path="/admin/logs" element={<Protected roles={['admin', 'super_admin']}><ActivityLogsPage /></Protected>} />
          <Route path="/admin/enroll" element={<Protected roles={['admin', 'super_admin']}><EnrollPage /></Protected>} />

          {/* ── Team Member / Mentor ───────────────────────────────── */}
          <Route path="/team" element={<Protected roles={['team_member', 'mentor']}><TeamMemberDashboard /></Protected>} />
          <Route path="/team/interns" element={<Protected roles={['team_member', 'mentor']}><InternsPage /></Protected>} />
          <Route path="/team/interns/:id" element={<Protected roles={['team_member', 'mentor']}><InternProfilePage /></Protected>} />
          <Route path="/team/tasks/interns" element={<Protected roles={['team_member', 'mentor']}><TasksPage role="team_member" taskType="intern" /></Protected>} />
          <Route path="/team/tasks/projects" element={<Protected roles={['team_member', 'mentor']}><TasksPage role="team_member" taskType="project" /></Protected>} />
          <Route path="/team/projects" element={<Protected roles={['team_member', 'mentor']}><ProjectsPage role="team_member" /></Protected>} />

          {/* ── Team Head ──────────────────────────────────────────── */}
          <Route path="/team-head" element={<Protected roles={['team_head']}><TeamHeadDashboard /></Protected>} />
          <Route path="/team-head/tasks/interns" element={<Protected roles={['team_head']}><TasksPage role="team_head" taskType="intern" /></Protected>} />
          <Route path="/team-head/tasks/projects" element={<Protected roles={['team_head']}><TasksPage role="team_head" taskType="project" /></Protected>} />
          <Route path="/team-head/members" element={<Protected roles={['team_head']}><TeamsPage /></Protected>} />
          <Route path="/team-head/interns" element={<Protected roles={['team_head']}><InternsPage /></Protected>} />
          <Route path="/team-head/interns/:id" element={<Protected roles={['team_head']}><InternProfilePage /></Protected>} />
          <Route path="/team-head/projects" element={<Protected roles={['team_head']}><ProjectsPage role="team_head" /></Protected>} />

          <Route path="/intern-portal" element={<Protected roles={['intern']}><InternDashboard /></Protected>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
