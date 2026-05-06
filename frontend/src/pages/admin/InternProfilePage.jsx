import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Layout, TopBar } from '../../components/Layout'
import { StatusBadge } from '../../components/StatusBadge'
import { FileUpload } from '../../components/FileUpload'
import { Modal } from '../../components/Modal'
import { toast } from '../../components/Toast'
import { authApi, internshipApi, taskApi, projectApi, teamApi } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import { ArrowLeft, RefreshCw, Mail, FileText, Award, Briefcase, Info, Star, ArrowRight, Folder, CheckCircle2, MapPin, User as UserIcon } from 'lucide-react'

const TEMPLATES = [
  { id: 'custom', label: 'Custom (Write your own)', subject: '', body: '' },
  { 
    id: 'onboarding', 
    label: 'Onboarding Task', 
    subject: 'Welcome to ZLabs! Your First Task', 
    body: 'Hi [[NAME]],\n\nWelcome to the team! To get started, please complete the following onboarding task:\n\n[[DESCRIPTION]]\n\nPlease submit your progress via the portal link.\n\nBest,\n[[SENDER]]' 
  },
  { 
    id: 'weekly', 
    label: 'Weekly Evaluation', 
    subject: 'Evaluation Task for Week [[WEEK]]', 
    body: 'Hi [[NAME]],\n\nHere is your task for this week:\n\n[[DESCRIPTION]]\n\nDeadline: [[DEADLINE]]\n\nGood luck!\n[[SENDER]]' 
  },
  { 
    id: 'bugfix', 
    label: 'Bug Fix Assignment', 
    subject: 'Priority: Fix assigned bug', 
    body: 'Hi [[NAME]],\n\nWe have a priority bug that needs your attention:\n\n[[DESCRIPTION]]\n\nPlease look into this and submit your fix.\n\nThanks,\n[[SENDER]]' 
  }
]

export const InternProfilePage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user: currentUser, role } = useAuth()
  const [intern, setIntern] = useState(null)
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [mentors, setMentors] = useState([])
  const [loading, setLoading] = useState(true)
  const [tasksLoading, setTasksLoading] = useState(false)
  const [acting, setActing] = useState(false)

  // Task Form
  const [taskForm, setTaskForm] = useState({ title: '', description: '', deadline: '', project: '', team: '', round_number: 1 })
  const [emailForm, setEmailForm] = useState({ subject: '', body: '', template: 'custom' })
  const [taskFile, setTaskFile] = useState(null)
  
  // Pipeline
  const ROUNDS = [1, 2, 3, 4, 5]
  
  // Conversion
  const [convertModal, setConvertModal] = useState(false)
  const [teams, setTeams] = useState([])
  const [conversionForm, setConversionForm] = useState({ 
    team_id: '', 
    role: 'team_member', 
    email_subject: '🚀 Welcome to the team! Your account for ZLabs is ready',
    email_body: 'Dear [[NAME]],\n\nCongratulations! Based on your excellent performance, you have been converted to a [[ROLE]].\n\nYour internal portal account has been created.\n\nYour login credentials:\nUsername: [[USERNAME]]\nPassword: [[PASSWORD]]\n\nLogin here: [[LOGIN_URL]]\n\nBest regards,\nZLabs Team'
  })
  const [conversionResult, setConversionResult] = useState(null)
  
  // Evaluation
  const [feedbackModal, setFeedbackModal] = useState(null)
  const [feedbackForm, setFeedbackForm] = useState({ feedback_text: '', rating: 5 })

  const loadIntern = async () => {
    try {
      setLoading(true)
      const res = await internshipApi.intern(id)
      const data = res.data
      setIntern(data)
      loadTasks(data.id)
    } catch { toast.error('Failed to load intern details') }
    finally { setLoading(false) }
  }

  const loadTasks = async (internProfileId) => {
    setTasksLoading(true)
    try {
      const res = await taskApi.list({ target_intern: internProfileId })
      setTasks(res.data.results || res.data)
    } catch { toast.error('Failed to load tasks') }
    finally { setTasksLoading(false) }
  }

  useEffect(() => {
    loadIntern()
    projectApi.list().then(r => setProjects(r.data.results || r.data))
    
    const canPromote = ['super_admin', 'admin', 'mentor', 'team_member', 'team_head'].includes(role)
    if (canPromote) {
        authApi.mentors().then(r => setMentors(r.data.results || r.data))
        teamApi.list().then(r => setTeams(r.data.results || r.data))
    }
  }, [id, role])

  useEffect(() => {
    if (searchParams.get('convert') === 'true' && intern && !intern.converted_at && intern.is_ready_for_team) {
        setConvertModal(true)
    }
  }, [searchParams, intern])

  const handleTemplateChange = (tid) => {
    const template = TEMPLATES.find(t => t.id === tid)
    if (!template) return
    
    let subject = template.subject
    let body = template.body

    if (tid !== 'custom') {
        const name = intern?.user?.first_name || 'Intern'
        const sender = currentUser?.first_name || 'Mentor'
        body = body.replace('[[NAME]]', name).replace('[[SENDER]]', sender)
        subject = subject.replace('[[NAME]]', name)
    }

    setEmailForm({ ...emailForm, template: tid, subject, body })
  }

  const handleAssignMentor = async (mentorId) => {
    if (!mentorId) return
    setActing(true)
    try {
      await internshipApi.assignMentor(id, mentorId)
      toast.success('Mentor assigned successfully')
      loadIntern()
    } catch {
      toast.error('Failed to assign mentor')
    } finally {
      setActing(false)
    }
  }

  const handleCreateTask = async (e) => {
    e.preventDefault()
    if (!emailForm.subject || !emailForm.body) {
        toast.error('Please complete the email details')
        return
    }

    setActing(true)
    const fd = new FormData()
    // General task data
    fd.append('title', taskForm.title)
    fd.append('description', taskForm.description)
    fd.append('deadline', taskForm.deadline)
    fd.append('round_number', taskForm.round_number)
    if (taskForm.project) fd.append('project', taskForm.project)
    
    if (intern.user) {
        fd.append('assigned_to_id', intern.user.id)
    } else {
        fd.append('assigned_intern_id', intern.id)
    }

    if (taskFile) fd.append('attachment', taskFile)

    // Email data (for the backend to send)
    fd.append('email_subject', emailForm.subject)
    fd.append('email_body', emailForm.body)

    try {
      await taskApi.create(fd)
      toast.success('Task assigned & email sent!')
      // Reset form
      setTaskForm({ title: '', description: '', deadline: '', project: '', team: '' })
      setEmailForm({ subject: '', body: '', template: 'custom' })
      setTaskFile(null)
      loadTasks(intern.id)
      // Refresh intern stats if possible
      loadIntern()
    } catch (err) {
      toast.error('Failed to assign task')
    } finally { setActing(false) }
  }

  const handleMarkReady = async () => {
    setActing(true)
    try {
      await internshipApi.markReady(id)
      toast.success('Intern marked as ready for team!')
      loadIntern()
    } catch {
      toast.error('Failed to mark as ready')
    } finally {
      setActing(false)
    }
  }

  const handleConvert = async (e) => {
    e.preventDefault()
    setActing(true)
    try {
      const res = await internshipApi.convert(id, conversionForm)
      setConversionResult(res.data)
      setConvertModal(false)
      loadIntern()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Conversion failed')
    } finally { setActing(false) }
  }

  const saveFeedback = async () => {
    setActing(true)
    try {
      await taskApi.feedback(feedbackModal.id, feedbackForm)
      toast.success('Feedback saved & intern notified!')
      setFeedbackModal(null)
      loadTasks(intern.id)
      loadIntern()
    } catch { toast.error('Failed to save feedback') } finally { setActing(false) }
  }

  const handleUpdateRound = async (newRound) => {
    setActing(true)
    try {
      await internshipApi.updateRound(id, newRound)
      toast.success(`Round updated to ${newRound}`)
      loadIntern()
    } catch {
      toast.error('Failed to update round')
    } finally {
      setActing(false)
    }
  }

  if (loading) return <Layout><div className="page" style={{ textAlign: 'center', padding: 100 }}>Loading profile...</div></Layout>
  if (!intern) return <Layout><div className="page" style={{ textAlign: 'center', padding: 100 }}>Intern not found.</div></Layout>

  return (
    <Layout>
      <TopBar 
        title={intern.user ? `${intern.user.first_name} ${intern.user.last_name}` : intern.application?.name} 
        subtitle={`Intern · ${intern.domain || 'Unassigned'} · Joined ${new Date(intern.joined_at).toLocaleDateString()}`}
        actions={<button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><ArrowLeft size={16} /> Back</button>}
      />
      <div className="page slide-up">
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 24, alignItems: 'start' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Round Pipeline Visualization */}
            <div className="card" style={{ padding: '20px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Internship Pipeline</h3>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue)', background: 'var(--blue-muted)', padding: '2px 8px', borderRadius: 6 }}>Round {intern.current_round} / 5</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', padding: '0 10px' }}>
                    {/* Background line */}
                    <div style={{ position: 'absolute', top: '12px', left: '40px', right: '40px', height: '2px', background: 'var(--border)', zIndex: 0 }} />
                    {/* Active progress line */}
                    <div style={{ 
                        position: 'absolute', 
                        top: '12px', 
                        left: '40px', 
                        width: `${(intern.current_round - 1) * 25}%`, 
                        height: '2px', 
                        background: 'var(--blue)', 
                        zIndex: 1,
                        transition: 'width 0.5s ease'
                    }} />
                    
                    {ROUNDS.map(r => {
                        const isDone = r < intern.current_round
                        const isCurrent = r === intern.current_round
                        const isLocked = r > intern.current_round
                        
                        return (
                            <div key={r} style={{ zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                                <div style={{ 
                                    width: 26, 
                                    height: 26, 
                                    borderRadius: '50%', 
                                    background: isDone ? 'var(--blue)' : isCurrent ? 'white' : 'var(--bg-surface)',
                                    border: isCurrent ? '2px solid var(--blue)' : isLocked ? '2px solid var(--border)' : 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: isDone ? 'white' : isCurrent ? 'var(--blue)' : 'var(--text-muted)',
                                    fontSize: 11,
                                    fontWeight: 800,
                                    boxShadow: isCurrent ? '0 0 0 4px var(--blue-muted)' : 'none'
                                }}>
                                    {isDone ? '✓' : r}
                                </div>
                                <span style={{ fontSize: 10, fontWeight: 700, color: isCurrent ? 'var(--text-primary)' : 'var(--text-muted)' }}>RD {r}</span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* 1. Assignment Card */}
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Assign New Task</h3>
                    <span className="badge badge-pending">portal write only</span>
                </div>
                
                <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div>
                            <label className="section-label">Task Info</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <input className="input" placeholder="Task Title *" value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} required />
                                <textarea className="input" rows={4} placeholder="General Description (for portal view) *" value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})} required />
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <input className="input" type="datetime-local" value={taskForm.deadline} onChange={e => setTaskForm({...taskForm, deadline: e.target.value})} required style={{ flex: 1.5 }} />
                                    <select className="input" value={taskForm.round_number} onChange={e => setTaskForm({...taskForm, round_number: e.target.value})} style={{ flex: 1 }}>
                                        {ROUNDS.map(r => <option key={r} value={r}>Round {r}</option>)}
                                    </select>
                                </div>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <select className="input" value={taskForm.project} onChange={e => setTaskForm({...taskForm, project: e.target.value})} style={{ width: '100%' }}>
                                        <option value="">Project (None)</option>
                                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <FileUpload label="Task Attachment" onChange={setTaskFile} />
                            </div>
                        </div>

                        <div>
                            <label className="section-label">Email Content (Inbuilt Templates)</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <select className="input" value={emailForm.template} onChange={e => handleTemplateChange(e.target.value)}>
                                    {TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                </select>
                                <input className="input" placeholder="Email Subject *" value={emailForm.subject} onChange={e => setEmailForm({...emailForm, subject: e.target.value})} />
                                <textarea className="input" rows={8} placeholder="Email Body *" value={emailForm.body} onChange={e => setEmailForm({...emailForm, body: e.target.value})} />
                                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>Tip: The email will contain the portal submission link automatically.</p>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 4 }}>
                        <button type="submit" className="btn btn-primary" disabled={acting}>
                            {acting ? 'Assigning...' : 'Assign Task & Send Email'}
                        </button>
                    </div>
                </form>
            </div>

            {/* 2. Task History List */}
            <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Task History</h3>
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Task Title</th>
                                <th>Assigned By</th>
                                <th>Assigned Date</th>
                                <th>Deadline</th>
                                <th>Status</th>
                                <th>Performance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tasksLoading ? <tr><td colSpan={6} style={{textAlign: 'center', padding: 20}}>Loading history...</td></tr> :
                             tasks.length === 0 ? <tr><td colSpan={6} style={{textAlign: 'center', padding: 20, color: 'var(--text-muted)'}}>No tasks yet</td></tr> :
                             tasks.map(t => (
                                <tr key={t.id}>
                                    <td style={{ fontWeight: 600 }}>{t.title}</td>
                                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t.assigned_by?.full_name || 'System'}</td>
                                    <td>{new Date(t.created_at).toLocaleDateString()}</td>
                                    <td>{t.deadline ? new Date(t.deadline).toLocaleDateString() : '—'}</td>
                                    <td><StatusBadge status={t.status} /></td>
                                    <td>
                                        {t.feedback ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--green)' }}>{'★'.repeat(t.feedback.rating)}</span>
                                                <button className="btn btn-ghost btn-sm" onClick={() => { setFeedbackModal(t); setFeedbackForm({ feedback_text: t.feedback.feedback_text, rating: t.feedback.rating }) }} style={{ padding: '0 4px', height: 22, fontSize: 10 }}>Edit</button>
                                            </div>
                                        ) : (
                                           t.status === 'submitted' ? (
                                               <button className="btn btn-primary btn-sm" onClick={() => { setFeedbackModal(t); setFeedbackForm({ feedback_text: '', rating: 5 }) }} style={{ height: 24, fontSize: 11, padding: '0 8px' }}>Review Task</button>
                                           ) : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Pending Submission</span>
                                        )}
                                    </td>
                                </tr>
                             ))}
                        </tbody>
                    </table>
                </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Profile Info Side */}
            <div className="card card-sm">
                <div className="section-label">Personal Profile</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 10 }}>
                    {intern.user?.profile?.avatar && (
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                            <img src={intern.user.profile.avatar} alt="Avatar" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }} />
                        </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                        <MapPin size={14} /> {intern.user?.profile?.location || 'No location set'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.4 }}>
                        {intern.user?.profile?.bio || 'No bio provided.'}
                    </div>
                </div>
            </div>

            <div className="card card-sm">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="section-label">Quick Stats</div>
                    <button className="btn btn-ghost btn-sm" onClick={loadIntern} style={{ padding: '0 4px', minWidth: 'unset', height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Refresh stats">
                        <RefreshCw size={12} className={acting ? 'spin' : ''} />
                    </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 10 }}>
                    <div style={{ background: 'var(--bg-raised)', padding: 12, borderRadius: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Pipeline</div>
                            <select 
                                value={intern.current_round} 
                                onChange={(e) => handleUpdateRound(e.target.value)}
                                style={{ fontSize: 10, background: 'white', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 4px' }}
                            >
                                {ROUNDS.map(r => <option key={r} value={r}>R{r}</option>)}
                            </select>
                        </div>
                        <div style={{ fontSize: 22, fontWeight: 800 }}>Round {intern.current_round}</div>
                        <div className="progress-bar" style={{ marginTop: 6 }}><div className="progress-fill" style={{ width: `${(intern.current_round/5)*100}%` }} /></div>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                         <div style={{ flex: 1, background: 'var(--bg-raised)', padding: 12, borderRadius: 8 }}>
                             <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Tasks</div>
                             <div style={{ fontSize: 18, fontWeight: 700 }}>{intern.tasks_count}</div>
                         </div>
                         <div style={{ flex: 1, background: 'var(--bg-raised)', padding: 12, borderRadius: 8 }}>
                             <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Done</div>
                             <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--green)' }}>{intern.completed_tasks}</div>
                         </div>
                    </div>
                </div>
            </div>

            <div className="card card-sm">
                <div className="section-label">Contact & Documents</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 10 }}>
                    <a href={`mailto:${intern.user ? intern.user.email : intern.application?.email}`} className="btn btn-ghost btn-sm" style={{ justifyContent: 'start', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Mail size={14} /> {intern.user ? intern.user.email : intern.application?.email}
                    </a>
                    {intern.application?.resume ? (
                        <a href={intern.application.resume} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm" style={{ justifyContent: 'start', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <FileText size={14} /> View Application Resume
                        </a>
                    ) : intern.user?.profile?.resume ? (
                        <a href={intern.user.profile.resume} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm" style={{ justifyContent: 'start', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <FileText size={14} /> View Enrollment Resume
                        </a>
                    ) : (
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>No resume uploaded</span>
                    )}
                </div>
            </div>

            <div className="card card-sm">
                <div className="section-label">Mentorship</div>
                <div style={{ marginTop: 10 }}>
                    {intern.mentor ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="avatar avatar-sm" style={{ background: 'var(--purple-muted)', color: 'var(--purple)' }}>{intern.mentor.first_name[0]}</div>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 600 }}>{intern.mentor.first_name} {intern.mentor.last_name}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{intern.mentor.email}</div>
                            </div>
                        </div>
                    ) : (['admin', 'super_admin'].includes(role) ? (
                         <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                             <select 
                                className="input input-sm" 
                                style={{ fontSize: 13 }}
                                onChange={(e) => handleAssignMentor(e.target.value)}
                                defaultValue=""
                                disabled={acting}
                             >
                                 <option value="" disabled>Select Mentor...</option>
                                 {mentors.map(m => (
                                     <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
                                 ))}
                             </select>
                             <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0 }}>Select a mentor to assign to this intern</p>
                         </div>
                    ) : (
                         <div style={{ color: 'var(--red)', fontSize: 13 }}>No mentor assigned</div>
                    ))}
                </div>
            </div>

            {/* INTEGRATED CONVERSION BLOCK (Moved here as requested) */}
            {['super_admin', 'admin', 'mentor', 'team_member', 'team_head'].includes(role) && !intern.converted_at && (
                <div style={{ marginTop: -8 }}>
                    <div className="card card-sm" style={{ 
                        border: intern.is_ready_for_team ? '2px solid var(--green)' : '1px solid var(--border)', 
                        background: intern.is_ready_for_team ? 'rgba(52, 211, 153, 0.08)' : 'var(--bg-surface)',
                        boxShadow: intern.is_ready_for_team ? '0 8px 30px rgba(52, 211, 153, 0.15)' : 'none',
                        transition: 'all 0.3s ease'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 10, background: intern.is_ready_for_team ? 'var(--green)' : 'var(--blue)', color: 'white' }}>
                                {intern.is_ready_for_team ? <Award size={20} /> : <Briefcase size={20} />}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div className="section-label" style={{ color: intern.is_ready_for_team ? 'var(--green)' : 'var(--text-muted)', marginBottom: 2 }}>
                                    {intern.is_ready_for_team ? 'RECRUITMENT READY' : 'OFFICIAL CONVERSION'}
                                </div>
                                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Promote to Employee</h4>
                            </div>
                        </div>
                        <div style={{ marginTop: 0 }}>
                            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 16px', lineHeight: 1.4 }}>
                                {intern.is_ready_for_team 
                                    ? 'Intern has completed training. Finalize promotion now.' 
                                    : 'Convert this candidate into a permanent team member.'}
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <button className={`btn w-full ${intern.is_ready_for_team ? 'btn-primary' : 'btn-ghost'}`} 
                                        style={{ height: 38, fontSize: 13, fontWeight: 600 }}
                                        onClick={() => setConvertModal(true)}>
                                    {intern.is_ready_for_team ? '✨ Convert Now →' : 'Promote Intern'}
                                </button>
                                {!intern.is_ready_for_team && (
                                    <button className="btn btn-ghost btn-sm w-full" 
                                            style={{ color: 'var(--green)', border: '1px solid var(--green-muted)' }}
                                            onClick={handleMarkReady} 
                                            disabled={acting}>
                                        {acting ? '...' : '✓ Mark as Ready'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {intern.converted_at && (
                <div className="card card-sm" style={{ background: 'var(--bg-raised)' }}>
                    <div className="section-label">✅ Converted to {intern.user?.profile?.role === 'team_head' ? 'Team Head' : 'Member'}</div>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '8px 0 0' }}>
                        Promoted on {new Date(intern.converted_at).toLocaleDateString()}
                    </p>
                </div>
            )}
          </div>
        </div>
      </div>

      <Modal open={convertModal} onClose={() => setConvertModal(false)} title="Promote Intern & Create Account">
          <form onSubmit={handleConvert} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>
                  Select the target role and team. This will create their official portal credentials and send them an email.
              </p>
              
              <div>
                  <label className="section-label">Target Role</label>
                  <select className="input" value={conversionForm.role} onChange={e => setConversionForm({...conversionForm, role: e.target.value})} required>
                      <option value="team_member">Team Member</option>
                      <option value="team_head">Team Head</option>
                  </select>
              </div>

              <div>
                  <label className="section-label">Assign to Team</label>
                  <select className="input" value={conversionForm.team_id} onChange={e => setConversionForm({...conversionForm, team_id: e.target.value})}>
                      <option value="">No team assignment</option>
                      {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
              </div>

              <div style={{ padding: '12px 14px', background: 'var(--bg-raised)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <label className="section-label" style={{ marginBottom: 10, display: 'block' }}>Email Preview & Confirmation</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <input 
                        className="input" 
                        placeholder="Email Subject" 
                        value={conversionForm.email_subject} 
                        onChange={e => setConversionForm({...conversionForm, email_subject: e.target.value})}
                      />
                      <textarea 
                        className="input" 
                        rows={8} 
                        placeholder="Email Body" 
                        value={conversionForm.email_body} 
                        onChange={e => setConversionForm({...conversionForm, email_body: e.target.value})}
                        style={{ fontSize: 13 }}
                      />
                      <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>
                        Placeholders: [[NAME]], [[ROLE]], [[USERNAME]], [[PASSWORD]], [[LOGIN_URL]]
                      </p>
                  </div>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setConvertModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={acting}>
                    {acting ? 'Processing...' : 'Promote & Create Login'}
                </button>
              </div>
          </form>
      </Modal>

      <Modal open={!!conversionResult} onClose={() => setConversionResult(null)} title="Conversion Successful! 🎉">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '10px 0' }}>
              <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 48, marginBottom: 10 }}>🎊</div>
                  <h3 style={{ margin: 0 }}>Intern Promoted Successfully</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>The official portal account has been created and credentials have been sent via email.</p>
              </div>

              <div style={{ background: 'var(--bg-raised)', padding: 20, borderRadius: 12, border: '1px dashed var(--border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Account Credentials</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div>
                          <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Username / ID</label>
                          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', family: 'monospace' }}>{conversionResult?.username}</div>
                      </div>
                      <div>
                          <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Temporary Password</label>
                          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--purple)', family: 'monospace' }}>{conversionResult?.password}</div>
                      </div>
                  </div>
              </div>

              <div style={{ background: 'rgba(59, 130, 246, 0.05)', padding: 12, borderRadius: 8, fontSize: 12, color: 'var(--blue)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                  ℹ️ The intern can now log in using these credentials at the main portal login page.
              </div>

              <button className="btn btn-primary w-full" onClick={() => setConversionResult(null)}>Got it, Close</button>
          </div>
      </Modal>

      <Modal open={!!feedbackModal} onClose={() => setFeedbackModal(null)} title="Task Evaluation">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ padding: 14, background: 'var(--bg-raised)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Submission Review</div>
              <div style={{ fontSize: 14, color: 'var(--text-primary)', marginBottom: 10 }}>{feedbackModal?.submission?.text_response || 'No text response provided.'}</div>
              {feedbackModal?.submission?.file_upload && (
                <a href={feedbackModal.submission.file_upload} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', width: '100%', justifyContent: 'start', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={14} /> View Attached Work (File)
                </a>
              )}
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Feedback</label>
            <textarea className="input" rows={4} placeholder="Mention what was good or needs improvement..." value={feedbackForm.feedback_text}
              onChange={e => setFeedbackForm(f => ({ ...f, feedback_text: e.target.value }))} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Rating</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {[1,2,3,4,5].map(n => (
                <button key={n} type="button" className={`btn ${feedbackForm.rating >= n ? 'btn-primary' : 'btn-ghost'} btn-sm`} style={{ flex: 1 }}
                  onClick={() => setFeedbackForm(f => ({ ...f, rating: n }))}>{'★'.repeat(n)}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button className="btn btn-ghost" onClick={() => setFeedbackModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveFeedback} disabled={acting}>Save Review</button>
          </div>
        </div>
      </Modal>
    </Layout>
  )
}
