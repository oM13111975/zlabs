import { useState, useEffect } from 'react'
import { Layout, TopBar } from '../components/Layout'
import { StatusBadge } from '../components/StatusBadge'
import { useAuth } from '../contexts/AuthContext'
import { Modal } from '../components/Modal'
import { toast } from '../components/Toast'
import { taskApi, authApi, teamApi, projectApi } from '../api'
import { FileUpload } from '../components/FileUpload'

export const TasksPage = ({ role, taskType }) => {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ status: '', team: '', search: '' })
  const [teams, setTeams] = useState([])
  const [users, setUsers] = useState([])
  const [modal, setModal] = useState(null)
  const [feedbackModal, setFeedbackModal] = useState(null)
  const [logModal, setLogModal] = useState(null)
  const [submitModal, setSubmitModal] = useState(null)
  const [taskForm, setTaskForm] = useState({ title: '', description: '', deadline: '', assigned_to_id: '', team: '', project: '', round_number: 1 })
  const [taskFile, setTaskFile] = useState(null)
  const [feedbackForm, setFeedbackForm] = useState({ feedback_text: '', rating: 5 })
  const [logText, setLogText] = useState('')
  const [submitForm, setSubmitForm] = useState({ text_response: '' })
  const [submitFile, setSubmitFile] = useState(null)
  const [projects, setProjects] = useState([])
  const [acting, setActing] = useState(false)

  const load = () => {
    setLoading(true)
    taskApi.list({ 
      status: filters.status, 
      team: filters.team, 
      search: filters.search,
      task_type: taskType === 'intern' ? 'intern' : 'team' 
    })
      .then(r => setTasks(r.data.results || r.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [filters, taskType])
  useEffect(() => {
    teamApi.list().then(r => setTeams(r.data.results || r.data))
    authApi.users().then(r => setUsers(r.data.results || r.data))
    projectApi.list().then(r => setProjects(r.data.results || r.data))
  }, [])

  const createTask = async (e) => {
    e.preventDefault()
    setActing(true)
    const fd = new FormData()
    Object.entries(taskForm).forEach(([k, v]) => v && fd.append(k, v))
    if (taskFile) fd.append('attachment', taskFile)
    fd.append('task_type', taskType === 'intern' ? 'intern' : 'team')
    
    try {
      await taskApi.create(fd)
      toast.success('Task created successfully!')
      setModal(null)
      load()
    } catch (e) {
      const errs = e.response?.data
      if (errs) Object.values(errs).forEach(v => toast.error(Array.isArray(v) ? v[0] : v))
      else toast.error('Failed to create task')
    } finally { setActing(false) }
  }

  const saveFeedback = async () => {
    setActing(true)
    try {
      await taskApi.feedback(feedbackModal.id, feedbackForm)
      toast.success('Feedback saved!')
      setFeedbackModal(null)
      load()
    } catch { toast.error('Failed') } finally { setActing(false) }
  }

  const addLog = async () => {
    if (!logText.trim()) return
    setActing(true)
    try {
      await taskApi.addLog(logModal.id, { log_text: logText })
      toast.success('Log added')
      setLogText('')
      setLogModal(null)
      load()
    } catch { toast.error('Failed') } finally { setActing(false) }
  }

  const submitWork = async (e) => {
    e.preventDefault()
    setActing(true)
    const fd = new FormData()
    fd.append('text_response', submitForm.text_response)
    if (submitFile) fd.append('file_upload', submitFile)
    
    try {
      await taskApi.submitInternal(submitModal.id, fd)
      toast.success('Project work submitted successfully!')
      setSubmitModal(null)
      load()
    } catch { toast.error('Failed to submit work') } finally { setActing(false) }
  }

  const sendReminder = async (taskId) => {
    try { await taskApi.reminder(taskId); toast.success('Reminder sent!') }
    catch { toast.error('Failed') }
  }

  const updateStatus = async (taskId, status) => {
    try { await taskApi.updateStatus(taskId, status); toast.success('Status updated'); load() }
    catch { toast.error('Failed') }
  }

  const copyLink = (task) => {
    const url = `${window.location.origin}/submit/${task.submission_token}`
    navigator.clipboard.writeText(url)
    toast.success('Submission link copied!')
  }

  const { user } = useAuth()
  const canManage = ['super_admin', 'admin', 'team_head', 'team_member', 'mentor'].includes(role)
  const pageTitle = taskType === 'intern' ? 'Intern Tasks' : 'Project Tasks'

  return (
    <Layout>
      <TopBar
        title={pageTitle}
        subtitle={`${tasks.length} ${taskType === 'intern' ? 'internship' : 'project'} tasks active`}
        actions={canManage && (
          <button className="btn btn-primary btn-sm" onClick={() => { setModal('create'); setTaskForm({ title: '', description: '', deadline: '', assigned_to_id: '', team: '', project: '', round_number: 1 }) }}>
            + Create New Task
          </button>
        )}
      />
      <div className="page slide-up">
        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <input className="input" placeholder="Search tasks..." value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} style={{ maxWidth: 240 }} />
          <select className="input" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} style={{ maxWidth: 160 }}>
            <option value="">All Status</option>
            {['pending', 'in_progress', 'submitted', 'reviewed', 'completed'].map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
          <select className="input" value={filters.team} onChange={e => setFilters(f => ({ ...f, team: e.target.value }))} style={{ maxWidth: 180 }}>
            <option value="">All Teams</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ status: '', team: '', search: '' })}>Reset</button>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Task</th>
                <th>Assignee</th>
                <th>Project</th>
                <th>Deadline</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</td></tr>
              ) : tasks.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No tasks found</td></tr>
              ) : tasks.map(task => (
                <tr key={task.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={task.title}>{task.title}</div>
                    <div style={{ fontSize: 10, display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                        {taskType === 'intern' && task.round_number && <span style={{ background: 'var(--bg-raised)', padding: '2px 6px', borderRadius: 4, fontWeight: 700, color: 'var(--text-secondary)' }}>R{task.round_number}</span>}
                        {task.submission && <span style={{ color: 'var(--blue)', fontWeight: 600 }}>Submitted</span>}
                        {task.feedback && <span style={{ color: 'var(--green)', fontWeight: 600 }}>Reviewed</span>}
                    </div>
                  </td>
                  <td style={{ fontSize: 12 }}>
                    <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>{task.assignee_name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>{task.assignee_email}</div>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }}>{task.project_name || '—'}</div>
                  </td>
                  <td style={{ fontSize: 12, color: task.deadline && new Date(task.deadline) < new Date() && task.status === 'pending' ? 'var(--red)' : 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {task.deadline ? new Date(task.deadline).toLocaleDateString() : '—'}
                  </td>
                  <td>
                    {(canManage || String(task.assigned_to?.id) === String(user?.id)) ? (
                      <select
                        className="input"
                        value={task.status}
                        onChange={e => updateStatus(task.id, e.target.value)}
                        style={{ padding: '2px 4px', fontSize: 11, width: 'auto', height: '28px' }}
                      >
                        {['pending', 'in_progress', 'submitted', 'reviewed', 'completed'].map(s => (
                          <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                    ) : <StatusBadge status={task.status} />}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {taskType === 'intern' && canManage && <button className="btn btn-ghost btn-sm" onClick={() => copyLink(task)} title="Copy link" style={{ padding: '0 6px', height: 28 }}>🔗</button>}
                      
                      {/* Submit button: Only for the assignee and only if pending */}
                      {task.task_type === 'team' && task.status === 'pending' && String(task.assigned_to?.id) === String(user?.id) && (
                        <button className="btn btn-primary btn-sm" onClick={() => { setSubmitModal(task); setSubmitForm({ text_response: '' }); setSubmitFile(null) }} style={{ padding: '0 8px', fontSize: 11, height: 28 }}>↥ Submit</button>
                      )}

                      {canManage && (
                        <>
                          <button className="btn btn-ghost btn-sm" onClick={() => sendReminder(task.id)} title="Send Reminder" style={{ padding: '0 6px', height: 28 }}>⏰</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => { setFeedbackModal(task); setFeedbackForm({ feedback_text: task.feedback?.feedback_text || '', rating: task.feedback?.rating || 5 }) }} title="Review & Feedback" style={{ padding: '0 8px', fontSize: 11, height: 28 }}>💬 Review</button>
                        </>
                      )}
                      
                      {/* Members can view their own submission results */}
                      {!canManage && String(task.assigned_to?.id) === String(user?.id) && task.submission && (
                         <button className="btn btn-ghost btn-sm" onClick={() => setFeedbackModal(task)} style={{ padding: '0 8px', fontSize: 11, height: 28 }}>👁 View</button>
                      )}
                      
                      {/* Anyone assigned or managing can log work */}
                      {(canManage || String(task.assigned_to?.id) === String(user?.id)) && (
                        <button className="btn btn-ghost btn-sm" onClick={() => setLogModal(task)} style={{ padding: '0 8px', fontSize: 11, height: 28 }}>+ Log</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal === 'create'} onClose={() => setModal(null)} title="Create Task" size="lg">
        <form onSubmit={createTask} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Task Title *</label>
            <input className="input" placeholder="e.g. Implement authentication" value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Description *</label>
            <textarea className="input" rows={4} placeholder="Detailed instructions..." value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Assignee *</label>
              <select className="input" value={taskForm.assigned_to_id} onChange={e => setTaskForm(f => ({ ...f, assigned_to_id: e.target.value }))} required>
                <option value="">Select user...</option>
                {users
                  .filter(u => {
                     if (role === 'team_head') {
                        // If a specific team is selected in the form, only show its members
                        if (taskForm.team) {
                            const selectedTeam = teams.find(t => String(t.id) === String(taskForm.team))
                            return selectedTeam?.members?.some(m => m.id === u.id)
                        }
                        // Otherwise show members of ALL teams this head leads
                        return teams.some(t => t.members?.some(m => m.id === u.id))
                     }
                     return true
                  })
                  .map(u => <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.profile?.role})</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Deadline *</label>
              <input className="input" type="datetime-local" value={taskForm.deadline} onChange={e => setTaskForm(f => ({ ...f, deadline: e.target.value }))} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Team</label>
              <select className="input" value={taskForm.team} onChange={e => setTaskForm(f => ({ ...f, team: e.target.value }))}>
                <option value="">None</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            {taskType === 'intern' && (
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Round Number</label>
                <select className="input" value={taskForm.round_number} onChange={e => setTaskForm(f => ({ ...f, round_number: e.target.value }))}>
                  {[1,2,3,4,5].map(n => <option key={n} value={n}>Round {n}</option>)}
                </select>
              </div>
            )}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Project</label>
              <select className="input" value={taskForm.project} onChange={e => setTaskForm(f => ({ ...f, project: e.target.value }))}>
                <option value="">None</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <FileUpload label="Attachment (optional)" onChange={setTaskFile} />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={acting}>Assign & Send Email</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!feedbackModal} onClose={() => setFeedbackModal(null)} title={canManage ? "Task Evaluation" : "My Submission"}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ padding: 14, background: 'var(--bg-raised)', borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Submission Review</div>
              <div style={{ fontSize: 14, color: 'var(--text-primary)', marginBottom: 10 }}>{feedbackModal?.submission?.text_response || 'No text response provided.'}</div>
              {feedbackModal?.submission?.file_upload && (
                <a href={feedbackModal.submission.file_upload} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', width: '100%', justifyContent: 'start' }}>
                  📂 View Attached Work (File)
                </a>
              )}
          </div>
          {canManage && (
              <>
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
              </>
          )}

          {/* Shown to members if feedback exists */}
          {!canManage && feedbackModal?.feedback && (
              <div style={{ padding: 12, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--blue)', marginBottom: 4 }}>Mentor Feedback</div>
                  <div style={{ fontSize: 14 }}>{feedbackModal.feedback.feedback_text}</div>
                  <div style={{ marginTop: 8, color: 'var(--orange)' }}>{'★'.repeat(feedbackModal.feedback.rating)}</div>
              </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button className="btn btn-ghost" onClick={() => setFeedbackModal(null)}>{canManage ? 'Cancel' : 'Close'}</button>
            {canManage && <button className="btn btn-primary" onClick={saveFeedback} disabled={acting}>Save Review</button>}
          </div>
        </div>
      </Modal>

      <Modal open={!!logModal} onClose={() => setLogModal(null)} title="Work Log History">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {logModal?.work_logs?.length > 0 ? logModal.work_logs.map(l => (
                    <div key={l.id} style={{ padding: 10, background: 'var(--bg-raised)', borderRadius: 6, fontSize: 13 }}>
                        <div style={{ fontWeight: 600, marginBottom: 2 }}>{l.user?.first_name}</div>
                        <div>{l.log_text}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{new Date(l.created_at).toLocaleString()}</div>
                    </div>
                )) : <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: 13 }}>No logs recorded yet.</div>}
            </div>
            <div className="divider" style={{ margin: '8px 0' }} />
            <textarea className="input" rows={3} placeholder="Add your progress update..." value={logText} onChange={e => setLogText(e.target.value)} />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setLogModal(null)}>Close</button>
                <button className="btn btn-primary" onClick={addLog} disabled={acting}>Post Update</button>
            </div>
        </div>
      </Modal>
      <Modal open={!!submitModal} onClose={() => setSubmitModal(null)} title="Submit Project Work">
        <form onSubmit={submitWork} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ padding: 12, background: 'var(--bg-raised)', borderRadius: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
            <strong>Task:</strong> {submitModal?.title}
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Submission Notes</label>
            <textarea className="input" rows={4} placeholder="Describe the work you've completed..." value={submitForm.text_response}
              onChange={e => setSubmitForm(f => ({ ...f, text_response: e.target.value }))} required />
          </div>
          <FileUpload label="Attach Result File (ZIP, PDF, etc.)" onChange={setSubmitFile} />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setSubmitModal(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={acting}>Submit Work</button>
          </div>
        </form>
      </Modal>
    </Layout>
  )
}
