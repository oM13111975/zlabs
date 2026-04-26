import { useState, useEffect } from 'react'
import { Layout, TopBar } from '../../components/Layout'
import { internshipApi } from '../../api'
import { toast } from '../../components/Toast'

export const MentorDashboard = () => {
  const [interns, setInterns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    internshipApi.interns().then(r => setInterns(r.data.results || r.data)).finally(() => setLoading(false))
  }, [])

  const markReady = async (id) => {
    if (!confirm('Mark this intern as ready for team conversion?')) return
    try {
      await internshipApi.markReady(id)
      toast.success('Intern marked as ready for team!')
      internshipApi.interns().then(r => setInterns(r.data.results || r.data))
    } catch (e) { toast.error(e.response?.data?.error || 'Failed') }
  }

  return (
    <Layout>
      <TopBar title="Mentor Dashboard" subtitle="Your assigned interns" />
      <div className="page slide-up">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
          <div className="stat-card">
            <div className="stat-card-title">My Interns</div>
            <div className="stat-card-value" style={{ color: '#60a5fa' }}>{interns.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-title">Ready for Team</div>
            <div className="stat-card-value" style={{ color: '#34d399' }}>{interns.filter(i => i.is_ready_for_team && !i.converted_at).length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-title">Converted</div>
            <div className="stat-card-value" style={{ color: '#a78bfa' }}>{interns.filter(i => i.converted_at).length}</div>
          </div>
        </div>

        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>My Interns</h2>
        {loading ? <div style={{ color: '#64748b' }}>Loading...</div> :
        interns.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👨‍🏫</div>
            <p style={{ color: '#64748b' }}>No interns assigned to you yet. Contact the admin.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {interns.map(intern => {
              const pct = intern.tasks_count > 0 ? Math.round((intern.completed_tasks / intern.tasks_count) * 100) : 0
              return (
                <div key={intern.id} className="card card-hover">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: 'white' }}>
                      {intern.user?.first_name?.[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700 }}>{intern.user?.first_name} {intern.user?.last_name}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{intern.user?.email}</div>
                    </div>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span style={{ color: '#64748b' }}>Tasks completed</span>
                      <span style={{ color: '#f1f5f9' }}>{intern.completed_tasks}/{intern.tasks_count}</span>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 999, height: 6 }}>
                      <div style={{ width: `${pct}%`, background: '#3b82f6', borderRadius: 999, height: '100%', transition: 'width 1s ease' }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>
                      {intern.is_ready_for_team
                        ? <span style={{ fontSize: 12, color: '#34d399' }}>✓ Ready for team</span>
                        : intern.converted_at
                          ? <span style={{ fontSize: 12, color: '#a78bfa' }}>✓ Converted</span>
                          : <span style={{ fontSize: 12, color: '#64748b' }}>In progress</span>}
                    </span>
                    {!intern.is_ready_for_team && !intern.converted_at && (
                      <button className="btn btn-success btn-sm" onClick={() => markReady(intern.id)}>
                        Mark Ready →
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}
