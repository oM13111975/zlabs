import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, TopBar } from '../../components/Layout'
import { authApi, internshipApi, taskApi, teamApi } from '../../api'
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid,
  AreaChart, Area, PieChart, Pie
} from 'recharts'
import { 
  Users, 
  UserPlus,
  GraduationCap, 
  CheckCircle2, 
  Users2, 
  ClipboardCheck, 
  FolderKanban,
  Calendar,
  ExternalLink,
  Plus,
  ArrowRight,
  UserCheck,
  Zap,
  Clock,
  FileText,
  Trash2,
  X
} from 'lucide-react'

export const AdminDashboard = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [taskChart, setTaskChart] = useState([])
  const [meetings, setMeetings] = useState([])
  const [teams, setTeams] = useState([])
  const [meetingModal, setMeetingModal] = useState(false)
  const [meetingForm, setMeetingForm] = useState({ title: '', scheduled_at: '', meeting_link: '', team: '' })
  const [acting, setActing] = useState(false)

  useEffect(() => {
    Promise.all([
      authApi.analytics(),
      taskApi.list(),
      internshipApi.applications({ status: 'pending' }),
      teamApi.listMeetings().catch(() => ({ data: [] })),
      teamApi.list().catch(() => ({ data: [] })),
    ]).then(([analyticsRes, taskRes, appRes, meetingsRes, teamsRes]) => {
      setStats(analyticsRes.data)
      const tasks = taskRes.data.results || taskRes.data
      const meetingsData = meetingsRes.data.results || meetingsRes.data || []
      setMeetings(meetingsData)
      const allTeams = teamsRes.data.results || teamsRes.data || []
      setTeams(allTeams)
      if (allTeams.length > 0 && !meetingForm.team) {
          setMeetingForm(prev => ({ ...prev, team: allTeams[0].id }))
      }

      const byStatus = {}
      tasks.forEach(t => { byStatus[t.status] = (byStatus[t.status] || 0) + 1 })
      setTaskChart(Object.entries(byStatus).map(([status, count]) => ({
        status: status.replace(/_/g, ' '),
        count,
      })))
    }).finally(() => setLoading(false))
  }, [])

  const handleDeleteMeeting = async (id) => {
    if (!confirm('Delete this meeting?')) return
    try {
        await teamApi.deleteMeeting(id)
        toast.success('Meeting deleted')
        window.location.reload() // Quick fix for reload logic
    } catch { toast.error('Failed to delete meeting') }
  }

  const handleCreateMeeting = async (e) => {
    e.preventDefault()
    setActing(true)
    try {
        await teamApi.createMeeting(meetingForm)
        setMeetingModal(false)
        setMeetingForm({ title: '', scheduled_at: '', meeting_link: '', team: meetingForm.team })
        const res = await teamApi.listMeetings()
        setMeetings(res.data.results || res.data || [])
    } catch { alert('Failed to schedule meeting') }
    finally { setActing(false) }
  }

  const s = stats || {}

  const summaryStats = [
    { label: 'Total Platform Users', value: s.total_users || 0, color: 'var(--blue)', icon: <Users size={24} />, sub: 'Registered accounts' },
    { label: 'Active Interns', value: s.total_interns || 0, color: 'var(--purple)', icon: <GraduationCap size={24} />, sub: 'Currently in program' },
    { label: 'Open Tasks', value: s.active_tasks || 0, color: 'var(--amber)', icon: <ClipboardCheck size={24} />, sub: 'Awaiting completion' },
    { label: 'Growth Teams', value: s.total_teams || 0, color: 'var(--green)', icon: <Users2 size={24} />, sub: 'Departments managed' },
  ]

  const BAR_COLORS = {
    'pending': 'var(--amber)',
    'in progress': 'var(--blue)',
    'submitted': 'var(--purple)',
    'reviewed': 'var(--green)',
    'completed': 'var(--green)',
  }

  return (
    <Layout>
      <TopBar
        title="Command Center"
        subtitle="Platform-wide oversight and management"
        actions={
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => navigate('/admin/enroll')} className="btn btn-outline btn-sm">
               <UserPlus size={14} style={{ marginRight: 6 }} /> Direct Enroll
            </button>
            <button onClick={() => navigate('/admin/applicants')} className="btn btn-primary btn-sm">
               Review Pending Applications ({s.pending_applications || 0}) <ArrowRight size={14} style={{ marginLeft: 6 }} />
            </button>
          </div>
        }
      />
      
      <div className="page animate-in">
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
            <div style={{ textAlign: 'center' }}>
                <Clock className="spin" size={32} style={{ marginBottom: 16, opacity: 0.5 }} />
                <div style={{ fontWeight: 600 }}>Loading system data...</div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* 1. Key Metrics */}
            <div className="grid-4">
              {summaryStats.map(stat => (
                <div key={stat.label} className="stat-card">
                  <div className="stat-card-icon" style={{ color: stat.color }}>{stat.icon}</div>
                  <div className="stat-card-title">{stat.label}</div>
                  <div className="stat-card-value">{stat.value}</div>
                  <div className="stat-card-sub">{stat.sub}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: 24 }}>
              
              {/* 2. Status Distribution (Horizontal Bar) */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title"><CheckCircle2 size={18} className="text-secondary" /> Status Distribution</div>
                  <div className="tag">{taskChart.reduce((a,b) => a + b.count, 0)} Total</div>
                </div>
                {taskChart.length === 0 ? (
                  <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13, background: 'var(--bg-raised)', borderRadius: 8 }}>
                    No data
                  </div>
                ) : (
                  <div style={{ height: 280, padding: '10px 0' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={taskChart} 
                        margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
                        barCategoryGap="30%"
                      >
                        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" opacity={0.4} />
                        <XAxis 
                          dataKey="status" 
                          tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--text-muted)' }} 
                          axisLine={false} 
                          tickLine={false}
                          dy={10}
                        />
                        <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                        <Tooltip
                          cursor={{ fill: 'var(--bg-raised)', opacity: 0.4 }}
                          contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: 'var(--shadow-lg)' }}
                        />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]} animationDuration={1500} background={{ fill: 'var(--bg-raised)', radius: 6 }}>
                          {taskChart.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={BAR_COLORS[entry.status] || 'var(--blue)'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* 3. Activity Trend (Area) */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title"><Zap size={18} className="text-secondary" /> Platform Activity Trend</div>
                  <div className="tag" style={{ background: 'var(--blue-muted)', color: 'var(--blue)' }}>6 Months</div>
                </div>
                {!s.monthly_tasks || s.monthly_tasks.length === 0 ? (
                  <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13, background: 'var(--bg-raised)', borderRadius: 8 }}>
                    Gathering trend data...
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={s.monthly_tasks} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--blue)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--blue)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" opacity={0.5} />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: 'var(--shadow-lg)' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="count" 
                        stroke="var(--blue)" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorCount)" 
                        animationDuration={2000}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

            </div>

            {/* 4. Workforce Distribution & Operations */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: 24 }}>
                {/* Workforce Breakdown */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title"><UserCheck size={18} className="text-secondary" /> Workforce Distribution</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {s.users_by_role && Object.entries(s.users_by_role).map(([role, count]) => {
                        const total = Object.values(s.users_by_role).reduce((a, b) => a + b, 0)
                        const pct = total > 0 ? Math.round((count / total) * 100) : 0
                        const colors = { super_admin: 'var(--blue)', admin: 'var(--red)', mentor: 'var(--blue)', team_member: 'var(--blue)', team_head: 'var(--purple)', intern: 'var(--amber)' }
                        const label = role === 'mentor' || role === 'team_member' ? 'Member' : role.replace(/_/g, ' ')
                        return (
                        <div key={role}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>{label}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>{count} ({pct}%)</span>
                            </div>
                            <div style={{ height: 8, background: 'var(--bg-raised)', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: colors[role] || 'var(--blue)', borderRadius: 4, transition: 'width 1s ease' }} />
                            </div>
                        </div>
                        )
                    })}
                    </div>
                </div>

            {/* 4. Quick Access Grid */}
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Zap size={16} /> Quick Operations
              </div>
              <div className="grid-3">
                {[
                  { label: 'Review Applications', href: '/admin/applicants', icon: <UserPlus className="text-blue" />, desc: 'Approve or reject new candidates' },
                  { label: 'Manage Interns', href: '/admin/interns', icon: <GraduationCap className="text-purple" />, desc: 'Lifecycle and mentor assignment' },
                  { label: 'Teams & Departments', href: '/admin/teams', icon: <Users2 className="text-green" />, desc: 'In-house team organization' },
                  { label: 'Task Oversight', href: '/admin/tasks/interns', icon: <ClipboardCheck className="text-amber" />, desc: 'Monitor progress & feedback' },
                  { label: 'Project Pipeline', href: '/admin/projects', icon: <FolderKanban className="text-blue" />, desc: 'High-level project tracking' },
                  { label: 'Audit Logs', href: '/admin/logs', icon: <FileText className="text-secondary" />, desc: 'System activity & security logs' },
                ].map(action => (
                  <div key={action.href} onClick={() => navigate(action.href)} className="card card-sm hover-lift" style={{ textDecoration: 'none', display: 'flex', gap: 16, alignItems: 'center', cursor: 'pointer' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--bg-base)', border: '1px solid var(--border-sub)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {action.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{action.label}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{action.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
                </div>
            </div>

            {/* 5. System Meetings */}
            <div className="card">
              <div className="card-header">
                <div className="card-title"><Calendar size={18} className="text-secondary" /> Scheduled System Meetings</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setMeetingModal(true)} style={{ color: 'var(--blue)' }}>
                    <Plus size={14} style={{ marginRight: 4 }} /> Schedule Meeting
                  </button>
                </div>
              </div>
              
              {meetings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', background: 'var(--bg-base)', borderRadius: 12, border: '1px dashed var(--border)' }}>
                    <Calendar size={32} style={{ marginBottom: 12, opacity: 0.2 }} />
                    <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No system-wide meetings scheduled</div>
                </div>
              ) : (
                <div className="grid-3">
                  {meetings.slice(0, 6).map(m => (
                    <div key={m.id} className="hover-lift" style={{ padding: 16, background: 'var(--bg-surface)', borderRadius: 12, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ background: 'var(--blue-muted)', color: 'var(--blue)', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase' }}>
                                {m.team_name}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Clock size={12} /> {new Date(m.scheduled_at).toLocaleDateString()}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{m.title}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                {new Date(m.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                        <div className="divider" style={{ margin: '8px 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div className="avatar avatar-sm" style={{ width: 20, height: 20, fontSize: 8 }}>{m.created_by?.username?.[0]?.toUpperCase()}</div>
                                {m.created_by?.full_name || m.created_by?.username}
                            </div>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                <button onClick={() => handleDeleteMeeting(m.id)} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--red)', cursor: 'pointer', opacity: 0.6, display: 'flex' }} title="Delete Meeting">
                                    <Trash2 size={14} />
                                </button>
                                {m.meeting_link && (
                                    new Date(m.scheduled_at) > new Date() ? (
                                        <a href={m.meeting_link} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ padding: '4px 6px', color: 'var(--blue)' }}>
                                            <ExternalLink size={12} />
                                        </a>
                                    ) : (
                                        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', background: 'var(--bg-raised)', padding: '2px 8px', borderRadius: 4 }}>ENDED</span>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                  ))}
                </div>
              )}
              {meetings.length > 6 && (
                  <div style={{ textAlign: 'center', marginTop: 16 }}>
                      <button className="btn btn-ghost btn-sm">View All Meetings ({meetings.length})</button>
                  </div>
              )}
            </div>

          </div>
        )}
      </div>

      {/* Admin Meeting Modal */}
      {meetingModal && (
          <div className="modal-overlay">
              <div className="modal-content animate-in" style={{ maxWidth: 450 }}>
                  <div className="card-header">
                      <div className="card-title">Schedule System Meeting</div>
                      <button className="btn btn-ghost btn-sm" onClick={() => setMeetingModal(false)}><X size={16} /></button>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>This meeting will be visible to all members of the selected team.</p>
                  <form onSubmit={handleCreateMeeting} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div>
                          <label className="section-label" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Meeting Title</label>
                          <input className="input" placeholder="e.g. Weekly Strategy Sync" value={meetingForm.title} onChange={e => setMeetingForm({...meetingForm, title: e.target.value})} required />
                      </div>
                      <div className="grid-2">
                          <div>
                              <label className="section-label" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Date & Time</label>
                              <input type="datetime-local" className="input" value={meetingForm.scheduled_at} onChange={e => setMeetingForm({...meetingForm, scheduled_at: e.target.value})} required />
                          </div>
                          <div>
                              <label className="section-label" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Target Team</label>
                              <select className="input" value={meetingForm.team} onChange={e => setMeetingForm({...meetingForm, team: e.target.value})} required>
                                  {teams.map(t => (
                                      <option key={t.id} value={t.id}>{t.name}</option>
                                  ))}
                              </select>
                          </div>
                      </div>
                      <div>
                          <label className="section-label" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Meeting Link (Zoom/Google Meet)</label>
                          <input className="input" placeholder="https://..." value={meetingForm.meeting_link} onChange={e => setMeetingForm({...meetingForm, meeting_link: e.target.value})} />
                      </div>
                      <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                          <button type="button" className="btn btn-ghost w-full" onClick={() => setMeetingModal(false)}>Cancel</button>
                          <button type="submit" className="btn btn-primary w-full" disabled={acting} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                              {acting ? 'Processing...' : <>Schedule Meeting <ArrowRight size={16} /></>}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </Layout>
  )
}
