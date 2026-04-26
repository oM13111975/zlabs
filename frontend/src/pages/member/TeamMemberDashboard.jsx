import { useState, useEffect } from 'react'
import { Layout, TopBar } from '../../components/Layout'
import { StatusBadge } from '../../components/StatusBadge'
import { taskApi, internshipApi, projectApi, teamApi } from '../../api'
import { toast } from '../../components/Toast'
import { useAuth } from '../../contexts/AuthContext'

export const TeamMemberDashboard = () => {
  const { user, role } = useAuth()
  const [tasks, setTasks] = useState([])
  const [interns, setInterns] = useState([])
  const [projects, setProjects] = useState([])
  const [meetings, setMeetings] = useState([])
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [meetingModal, setMeetingModal] = useState(false)
  const [meetingForm, setMeetingForm] = useState({ title: '', scheduled_at: '', meeting_link: '', team: '' })

  const loadAll = () => {
    setLoading(true)
    Promise.all([
      taskApi.list(),
      internshipApi.interns().catch(() => ({ data: [] })),
      projectApi.list().catch(() => ({ data: [] })),
      teamApi.listMeetings().catch(() => ({ data: [] })),
      teamApi.list().catch(() => ({ data: [] })), // Need teams for creation modal
    ]).then(([tr, ir, pr, mr, teamsRes]) => {
      setTasks(tr.data.results || tr.data)
      setInterns(ir.data.results || ir.data)
      setProjects(pr.data.results || pr.data)
      setMeetings(mr.data.results || mr.data)
      const myTeams = teamsRes.data.results || teamsRes.data
      setTeams(myTeams)
      // If team member is only in one team, pre-select it
      if (myTeams.length > 0 && !meetingForm.team) {
          setMeetingForm(prev => ({ ...prev, team: myTeams[0].id }))
      }
    }).finally(() => setLoading(false))
  }

  useEffect(() => { loadAll() }, [])

  const markReady = async (internId) => {
    if (!confirm('Mark this intern as ready for team conversion?')) return
    try { await internshipApi.markReady(internId); toast.success('Marked as ready'); loadAll() }
    catch (e) { toast.error(e.response?.data?.error || 'Failed') }
  }

  const handleCreateMeeting = async (e) => {
    e.preventDefault()
    try {
        await teamApi.createMeeting(meetingForm)
        toast.success('Meeting scheduled!')
        setMeetingModal(false)
        setMeetingForm({ title: '', scheduled_at: '', meeting_link: '', team: meetingForm.team })
        loadAll()
    } catch { toast.error('Failed to schedule meeting') }
  }

  const handleDeleteMeeting = async (id) => {
    if (!confirm('Delete this meeting?')) return
    try {
        await teamApi.deleteMeeting(id)
        toast.success('Meeting deleted')
        loadAll()
    } catch { toast.error('Failed to delete meeting') }
  }

  const myTasks = tasks.filter(t => t.assigned_to?.id === user?.id)
  const assignedByMe = tasks.filter(t => t.assigned_by?.id === user?.id && t.assigned_to?.id !== user?.id)
  const pending = myTasks.filter(t => t.status === 'pending').length
  const done = myTasks.filter(t => ['completed', 'reviewed'].includes(t.status)).length

  return (
    <Layout>
      <TopBar
        title={`Welcome, ${user?.first_name || user?.username}`}
        subtitle="Your workspace"
        actions={<a href="/team/tasks" className="btn btn-primary btn-sm">+ New Task</a>}
      />
      <div className="page slide-up">

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 22 }}>
          <div className="stat-card">
            <div className="stat-card-title">My Tasks</div>
            <div className="stat-card-value">{myTasks.length}</div>
            <div className="stat-card-sub">{pending} pending</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-title">Completed</div>
            <div className="stat-card-value" style={{ color: 'var(--green)' }}>{done}</div>
            <div className="stat-card-sub">of {myTasks.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-title">My Interns</div>
            <div className="stat-card-value">{interns.length}</div>
            <div className="stat-card-sub">{interns.filter(i => i.is_ready_for_team && !i.converted_at).length} ready</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-title">Projects</div>
            <div className="stat-card-value">{projects.length}</div>
            <div className="stat-card-sub">{projects.filter(p => p.status === 'active').length} active</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* My Tasks */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>My Tasks</div>
              <a href="/team/tasks" style={{ fontSize: 12, color: 'var(--blue)', textDecoration: 'none' }}>View all</a>
            </div>
            {loading ? <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading...</div> :
            myTasks.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '16px 0' }}>No tasks assigned yet</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {myTasks.slice(0, 6).map(t => (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--border-sub)' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{t.title}</div>
                      {t.deadline && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Due {new Date(t.deadline).toLocaleDateString()}</div>}
                    </div>
                    <StatusBadge status={t.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* My Interns */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>My Interns</div>
              <a href="/team/interns" style={{ fontSize: 12, color: 'var(--blue)', textDecoration: 'none' }}>Manage</a>
            </div>
            {loading ? <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading...</div> :
            interns.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '16px 0' }}>No interns assigned to you</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {interns.slice(0, 5).map(intern => (
                  <div key={intern.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--border-sub)' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                        {intern.user ? `${intern.user.first_name} ${intern.user.last_name}` : (intern.application?.name || 'New Intern')}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {intern.tasks_count || 0} tasks · {intern.completed_tasks || 0} done
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {intern.is_ready_for_team && !intern.converted_at && (
                        <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>Ready</span>
                      )}
                      {!intern.is_ready_for_team && !intern.converted_at && (
                        <button className="btn btn-ghost btn-sm" onClick={() => markReady(intern.id)}>Mark Ready</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assigned by me */}
          {assignedByMe.length > 0 && (
            <div className="card">
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 14 }}>Tasks I Assigned</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {assignedByMe.slice(0, 5).map(t => (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--border-sub)' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{t.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>→ {t.assigned_to?.first_name} {t.assigned_to?.last_name}</div>
                    </div>
                    <StatusBadge status={t.status} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Projects</div>
              <a href="/team/projects" style={{ fontSize: 12, color: 'var(--blue)', textDecoration: 'none' }}>View all</a>
            </div>
            {loading ? <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading...</div> :
            projects.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No projects assigned</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {projects.slice(0, 5).map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--border-sub)' }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{p.name}</div>
                    <StatusBadge status={p.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Meetings */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Team Meetings</div>
              <button className="btn btn-ghost btn-sm" onClick={() => setMeetingModal(true)} style={{ color: 'var(--blue)' }}>+ Schedule</button>
            </div>
            {loading ? <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading...</div> :
            meetings.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '16px 0' }}>No upcoming meetings</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {meetings.map(m => (
                        <div key={m.id} style={{ padding: 12, background: 'var(--bg-raised)', borderRadius: 8, border: '1px solid var(--border-sub)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{m.title}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                                        📅 {new Date(m.scheduled_at).toLocaleString()} · {m.team_name}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    {(user?.id === m.created_by?.id || ['admin', 'super_admin'].includes(role)) && (
                                        <button onClick={() => handleDeleteMeeting(m.id)} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--red)', cursor: 'pointer', opacity: 0.6, fontSize: 12 }} title="Delete Meeting">🗑️</button>
                                    )}
                                    {m.meeting_link && (
                                        new Date(m.scheduled_at) > new Date() ? (
                                            <a href={m.meeting_link} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm" style={{ padding: '4px 8px', fontSize: 11 }}>Join →</a>
                                        ) : (
                                            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', background: 'rgba(0,0,0,0.05)', padding: '2px 8px', borderRadius: 4 }}>ENDED</span>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
          </div>
        </div>
      </div>

      {/* Meeting Modal */}
      {meetingModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
              <div className="card slide-up" style={{ width: '100%', maxWidth: 400, padding: 24 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Schedule Meeting</h2>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>This will be visible to all members of the selected team.</p>
                  <form onSubmit={handleCreateMeeting} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div>
                          <label className="section-label">Meeting Title</label>
                          <input className="input" placeholder="e.g. Weekly Sync" value={meetingForm.title} onChange={e => setMeetingForm({...meetingForm, title: e.target.value})} required />
                      </div>
                      <div>
                          <label className="section-label">Topic / Description (optional)</label>
                          <textarea className="input" value={meetingForm.description} onChange={e => setMeetingForm({...meetingForm, description: e.target.value})} rows={2} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <div>
                              <label className="section-label">Schedule Date & Time</label>
                              <input type="datetime-local" className="input" value={meetingForm.scheduled_at} onChange={e => setMeetingForm({...meetingForm, scheduled_at: e.target.value})} required />
                          </div>
                          <div>
                              <label className="section-label">Meeting Team</label>
                              <select className="input" value={meetingForm.team} onChange={e => setMeetingForm({...meetingForm, team: e.target.value})} required>
                                  {teams.length === 0 && <option value="">No teams available</option>}
                                  {teams.map(t => (
                                      <option key={t.id} value={t.id}>{t.name}</option>
                                  ))}
                              </select>
                          </div>
                      </div>
                      <div>
                          <label className="section-label">Meeting Link (Zoom, Meet, etc.)</label>
                          <input className="input" placeholder="https://meet.google.com/..." value={meetingForm.meeting_link} onChange={e => setMeetingForm({...meetingForm, meeting_link: e.target.value})} />
                      </div>
                      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                          <button type="button" className="btn btn-ghost w-full" onClick={() => setMeetingModal(false)}>Cancel</button>
                          <button type="submit" className="btn btn-primary w-full">Schedule →</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </Layout>
  )
}
