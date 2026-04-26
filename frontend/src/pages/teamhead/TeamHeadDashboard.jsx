import { useState, useEffect } from 'react'
import { Layout, TopBar } from '../../components/Layout'
import { StatusBadge } from '../../components/StatusBadge'
import { Modal } from '../../components/Modal'
import { FileUpload } from '../../components/FileUpload'
import { toast } from '../../components/Toast'
import { taskApi, teamApi, projectApi, authApi } from '../../api'
import { useAuth } from '../../contexts/AuthContext'

export const TeamHeadDashboard = () => {
  const { user, role } = useAuth()
  const [tasks, setTasks] = useState([])
  const [teams, setTeams] = useState([])
  const [projects, setProjects] = useState([])
  const [members, setMembers] = useState([]) // all users I can assign to
  const [loading, setLoading] = useState(true)
  const [assignModal, setAssignModal] = useState(false)
  const [taskForm, setTaskForm] = useState({
    title: '', description: '', deadline: '', assigned_to_id: '', team: '', project: '',
  })
  const [taskFile, setTaskFile] = useState(null)
  const [acting, setActing] = useState(false)
  const [meetings, setMeetings] = useState([])
  const [meetingModal, setMeetingModal] = useState(false)
  const [meetingForm, setMeetingForm] = useState({ title: '', scheduled_at: '', meeting_link: '', team: '' })

  const loadAll = () => {
    setLoading(true)
    Promise.all([
      taskApi.list(),
      teamApi.list(),
      projectApi.list(),
      authApi.users(),
      teamApi.listMeetings(),
    ]).then(([tr, teamr, projr, usersr, meetingsr]) => {
      setTasks(tr.data.results || tr.data)
      const teamList = teamr.data.results || teamr.data
      setTeams(teamList)
      setProjects(projr.data.results || projr.data)
      setMembers(usersr.data.results || usersr.data)
      setMeetings(meetingsr.data.results || meetingsr.data)
      if (teamList.length > 0) {
          setMeetingForm(prev => ({ ...prev, team: String(teamList[0].id) }))
      }
    }).finally(() => setLoading(false))
  }

  useEffect(() => { loadAll() }, [])

  const createTask = async (e) => {
    e.preventDefault()
    setActing(true)
    const fd = new FormData()
    Object.entries(taskForm).forEach(([k, v]) => v && fd.append(k, v))
    if (taskFile) fd.append('attachment', taskFile)
    try {
      await taskApi.create(fd)
      toast.success('Task assigned and email sent!')
      setAssignModal(false)
      setTaskForm({ title: '', description: '', deadline: '', assigned_to_id: '', team: '', project: '' })
      setTaskFile(null)
      loadAll()
    } catch (e) {
      const errs = e.response?.data
      if (errs) Object.values(errs).forEach(v => toast.error(Array.isArray(v) ? v[0] : v))
      else toast.error('Failed to create task')
    } finally { setActing(false) }
  }

  const updateStatus = async (taskId, status) => {
    try { await taskApi.updateStatus(taskId, status); toast.success('Updated'); loadAll() }
    catch { toast.error('Failed') }
  }

  const copyLink = (task) => {
    navigator.clipboard.writeText(`${window.location.origin}/submit/${task.submission_token}`)
    toast.success('Submission link copied!')
  }

  const handleCreateMeeting = async (e) => {
    e.preventDefault()
    setActing(true)
    try {
        await teamApi.createMeeting(meetingForm)
        toast.success('Meeting scheduled!')
        setMeetingModal(false)
        setMeetingForm({ title: '', scheduled_at: '', meeting_link: '', team: meetingForm.team })
        loadAll()
    } catch { toast.error('Failed to schedule meeting') }
    finally { setActing(false) }
  }

  const handleDeleteMeeting = async (id) => {
    if (!confirm('Delete this meeting?')) return
    try {
        await teamApi.deleteMeeting(id)
        toast.success('Meeting deleted')
        loadAll()
    } catch { toast.error('Failed to delete meeting') }
  }

  const myTeam = teams[0]
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => ['completed', 'reviewed'].includes(t.status)).length

  return (
    <Layout>
      <TopBar
        title="Team Head Dashboard"
        subtitle={myTeam ? `Managing: ${myTeam.name}` : 'Your team workspace'}
        actions={
          <button className="btn btn-primary" onClick={() => setAssignModal(true)}>
            + Assign Task to Member
          </button>
        }
      />
      <div className="page slide-up">

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-card-title">Team Members</div>
            <div className="stat-card-value" style={{ color: '#a78bfa' }}>{myTeam?.member_count || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-title">Total Tasks</div>
            <div className="stat-card-value" style={{ color: '#60a5fa' }}>{totalTasks}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-title">Completed</div>
            <div className="stat-card-value" style={{ color: '#34d399' }}>{completedTasks}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-title">In Progress</div>
            <div className="stat-card-value" style={{ color: '#fb923c' }}>
              {tasks.filter(t => t.status === 'in_progress').length}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

          {/* Team Members breakdown */}
          <div className="card">
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>👥 Team Members</h3>
            {!myTeam ? (
              <div style={{ color: '#64748b', fontSize: 13 }}>No team assigned yet</div>
            ) : (myTeam.members || []).length === 0 ? (
              <div style={{ color: '#64748b', fontSize: 13 }}>No members in your team</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {myTeam.members.map(m => {
                  const memberTasks = tasks.filter(t => t.assigned_to?.id === m.id)
                  const done = memberTasks.filter(t => ['completed', 'reviewed'].includes(t.status)).length
                  return (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', fontSize: 13, flexShrink: 0 }}>
                        {m.full_name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{m.full_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{memberTasks.length} tasks · {done} done</div>
                        {memberTasks.length > 0 && (
                          <div style={{ marginTop: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 999, height: 4 }}>
                            <div style={{ width: memberTasks.length > 0 ? `${Math.round(done / memberTasks.length * 100)}%` : '0%', background: '#3b82f6', borderRadius: 999, height: '100%' }} />
                          </div>
                        )}
                      </div>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          setTaskForm(f => ({ ...f, assigned_to_id: String(m.id), team: String(myTeam.id) }))
                          setAssignModal(true)
                        }}
                        title="Assign a task to this member"
                      >
                        + Task
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Task list */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>✅ Recent Tasks</h3>
              <a href="/team-head/tasks" style={{ color: '#60a5fa', fontSize: 13, textDecoration: 'none' }}>All tasks →</a>
            </div>
            {loading ? <div style={{ color: '#64748b', fontSize: 13 }}>Loading...</div> :
            tasks.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px 0', fontSize: 13 }}>
                No tasks yet. Use "Assign Task" to get started.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {tasks.slice(0, 6).map(t => (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', background: 'var(--bg-raised)', borderRadius: 8 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>→ {t.assigned_to?.first_name} {t.assigned_to?.last_name}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <StatusBadge status={t.status} />
                      <button onClick={() => copyLink(t)} style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', fontSize: 13 }}>🔗</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Projects overview */}
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>🗂 Projects</h3>
              <a href="/team-head/projects" style={{ color: '#60a5fa', fontSize: 13, textDecoration: 'none' }}>View all →</a>
            </div>
            {projects.length === 0 ? (
              <div style={{ color: '#64748b', fontSize: 13 }}>No projects assigned to your team</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
                {projects.map(p => (
                  <div key={p.id} style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</div>
                      <StatusBadge status={p.status} />
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>
                      {(p.task_counts?.total || 0)} tasks · {(p.task_counts?.completed || 0)} done
                    </div>
                    <div style={{ marginTop: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 999, height: 4 }}>
                      <div style={{
                        width: p.task_counts?.total > 0 ? `${Math.round((p.task_counts.completed / p.task_counts.total) * 100)}%` : '0%',
                        background: '#3b82f6', borderRadius: 999, height: '100%',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Meetings */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>📅 Team Meetings</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setMeetingModal(true)} style={{ color: '#60a5fa' }}>+ Schedule</button>
            </div>
            {loading ? <div style={{ color: '#64748b', fontSize: 13 }}>Loading...</div> :
            meetings.length === 0 ? (
              <div style={{ color: '#64748b', fontSize: 13, padding: '16px 0' }}>No upcoming team meetings</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {meetings.map(m => (
                        <div key={m.id} style={{ padding: 12, background: 'var(--bg-raised)', borderRadius: 10, border: '1px solid var(--border)' }}>
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
      <Modal open={meetingModal} onClose={() => setMeetingModal(false)} title="Schedule Team Meeting">
          <form onSubmit={handleCreateMeeting} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Meeting Title *</label>
                  <input className="input" placeholder="e.g. Project Review" value={meetingForm.title} onChange={e => setMeetingForm({...meetingForm, title: e.target.value})} required />
              </div>
              <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Description</label>
                  <textarea className="input" value={meetingForm.description} onChange={e => setMeetingForm({...meetingForm, description: e.target.value})} rows={2} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Date & Time *</label>
                      <input type="datetime-local" className="input" value={meetingForm.scheduled_at} onChange={e => setMeetingForm({...meetingForm, scheduled_at: e.target.value})} required />
                  </div>
                  <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Team *</label>
                      <select className="input" value={meetingForm.team} onChange={e => setMeetingForm({...meetingForm, team: e.target.value})} required>
                          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                  </div>
              </div>
              <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Link (Zoom/Meet)</label>
                  <input className="input" placeholder="https://meet.google.com/..." value={meetingForm.meeting_link} onChange={e => setMeetingForm({...meetingForm, meeting_link: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                  <button type="button" className="btn btn-ghost w-full" onClick={() => setMeetingModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary w-full" disabled={acting}>
                      {acting ? 'Scheduling...' : 'Schedule Meeting →'}
                  </button>
              </div>
          </form>
      </Modal>

      {/* Assign Task Modal */}
      <Modal open={assignModal} onClose={() => { setAssignModal(false); setTaskForm({ title: '', description: '', deadline: '', assigned_to_id: '', team: '', project: '' }) }} title="Assign Task to Team Member" size="lg">
        <form onSubmit={createTask} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Assign To *</label>
            <select className="input" value={taskForm.assigned_to_id} onChange={e => setTaskForm(f => ({ ...f, assigned_to_id: e.target.value }))} required>
              <option value="">Select team member...</option>
              {members.filter(m => ['team_member', 'mentor', 'team_head', 'intern'].includes(m.profile?.role)).map(m => (
                <option key={m.id} value={m.id}>
                  {m.first_name} {m.last_name} ({m.profile?.role?.replace(/_/g, ' ')})
                </option>
              ))}
            </select>
            {myTeam?.members?.length > 0 && (
              <p style={{ margin: '4px 0 0', fontSize: 11, color: '#60a5fa' }}>
                Quick select: {myTeam.members.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setTaskForm(f => ({ ...f, assigned_to_id: String(m.id), team: String(myTeam.id) }))}
                    style={{ background: taskForm.assigned_to_id === String(m.id) ? '#1d4ed8' : 'rgba(59,130,246,0.15)', color: '#60a5fa', border: 'none', borderRadius: 4, padding: '2px 8px', marginLeft: 4, cursor: 'pointer', fontSize: 11 }}
                  >{m.full_name?.split(' ')[0]}</button>
                ))}
              </p>
            )}
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Task Title *</label>
            <input className="input" placeholder="e.g. Build login UI" value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Description *</label>
            <textarea className="input" rows={3} placeholder="What should they do? Be specific." value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} required style={{ resize: 'vertical' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Deadline *</label>
              <input className="input" type="datetime-local" value={taskForm.deadline} onChange={e => setTaskForm(f => ({ ...f, deadline: e.target.value }))} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Project</label>
              <select className="input" value={taskForm.project} onChange={e => setTaskForm(f => ({ ...f, project: e.target.value }))}>
                <option value="">No project</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Team</label>
            <select className="input" value={taskForm.team} onChange={e => setTaskForm(f => ({ ...f, team: e.target.value }))}>
              <option value="">No team</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <FileUpload label="Attachment (optional)" accept=".pdf,.docx,.zip,.png,.jpg" onChange={setTaskFile} />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setAssignModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={acting}>
              {acting ? 'Assigning...' : 'Assign Task & Send Email'}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  )
}
