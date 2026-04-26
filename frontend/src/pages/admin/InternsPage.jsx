import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, TopBar } from '../../components/Layout'
import { StatusBadge } from '../../components/StatusBadge'
import { internshipApi } from '../../api'
import { useAuth } from '../../contexts/AuthContext'

export const InternsPage = () => {
  const navigate = useNavigate()
  const { role } = useAuth()
  const [interns, setInterns] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    internshipApi.interns().then(r => setInterns(r.data.results || r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleRowClick = (id) => {
    let prefix = '/team'
    if (role === 'admin' || role === 'super_admin') prefix = '/admin'
    if (role === 'team_head') prefix = '/team-head'
    navigate(`${prefix}/interns/${id}`)
  }

  return (
    <Layout>
      <TopBar title="Interns Directory" subtitle={`${interns.length} active interns registered`} />
      <div className="page slide-up">
        <div className="table-wrapper">
          <table className="interactive-table">
            <thead>
              <tr>
                <th>Intern Detail</th>
                <th>Focus Domain</th>
                <th>Assigned Mentor</th>
                <th>Task Progress</th>
                <th>Submission Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading records...</td></tr>
              ) : interns.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>No interns found.</td></tr>
              ) : interns.map(intern => {
                const pct = intern.tasks_count > 0 ? Math.round((intern.completed_tasks / intern.tasks_count) * 100) : 0
                return (
                  <tr key={intern.id} onClick={() => handleRowClick(intern.id)} style={{ cursor: 'pointer' }}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {intern.user ? `${intern.user.first_name} ${intern.user.last_name}` : (intern.application?.name || 'Unknown')}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {intern.user ? intern.user.email : intern.application?.email}
                      </div>
                    </td>
                    <td>
                        <span className="badge badge-submitted">{intern.domain || 'General'}</span>
                    </td>
                    <td>
                      {intern.mentor ? (
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                            {intern.mentor.first_name} {intern.mentor.last_name}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--red)', fontSize: 12, fontWeight: 700 }}>Unassigned</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="progress-bar" style={{ width: 100 }}>
                            <div className="progress-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{pct}%</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{intern.completed_tasks} of {intern.tasks_count} tasks done</div>
                    </td>
                    <td>
                      {intern.converted_at ? (
                        <StatusBadge status="completed" label="Converted" />
                      ) : intern.is_ready_for_team ? (
                        <StatusBadge status="reviewed" label="Ready" />
                      ) : (
                        <StatusBadge status="in_progress" label="Ongoing" />
                      )}
                    </td>
                    <td>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleRowClick(intern.id)}>View Profile →</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
