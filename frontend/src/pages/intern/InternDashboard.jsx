import { useState, useEffect } from 'react'
import { Layout } from '../../components/Layout'
import { StatusBadge } from '../../components/StatusBadge'
import { Modal } from '../../components/Modal'
import { toast, ToastContainer } from '../../components/Toast'
import { taskApi } from '../../api'
import { FileUpload } from '../../components/FileUpload'
import { useAuth } from '../../contexts/AuthContext'
import { 
  ClipboardList, 
  CheckCircle2, 
  Clock, 
  Star, 
  FileText, 
  Calendar,
  AlertCircle,
  ChevronRight,
  History,
  Check,
  Rocket,
  Target,
  Zap,
  TrendingUp,
  Award,
  ArrowRight,
  Users
} from 'lucide-react'

export const InternDashboard = () => {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitModal, setSubmitModal] = useState(null)
  const [acting, setActing] = useState(false)
  const [submitForm, setSubmitForm] = useState({ text_response: '' })
  const [submitFile, setSubmitFile] = useState(null)
  const [viewFeedback, setViewFeedback] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await taskApi.list({ task_type: 'intern' })
      setTasks(res.data.results || res.data)
    } catch (err) {
      toast.error('Failed to load tasks.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setActing(true)
    const fd = new FormData()
    fd.append('text_response', submitForm.text_response)
    if (submitFile) fd.append('file_upload', submitFile)

    try {
      await taskApi.submitInternal(submitModal.id, fd)
      toast.success('Task submitted successfully!')
      setSubmitModal(null)
      load()
    } catch (err) {
      toast.error('Failed to submit task.')
    } finally {
      setActing(false)
    }
  }

  const pendingTasks = tasks.filter(t => t.status === 'pending')
  const completedTasks = tasks.filter(t => t.status === 'submitted' || t.status === 'reviewed')
  const latestReviewed = tasks.find(t => t.status === 'reviewed')

  return (
    <Layout>
      <ToastContainer />
      <div style={{ padding: '32px 32px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--blue)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              <Zap size={14} fill="currentColor" />
              Intern Evolution Portal
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              Welcome back, {user?.first_name || 'Innovator'}
            </h1>
            <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0', fontSize: 14 }}>
              You're currently in <strong>Phase {tasks[0]?.round_number || 1}</strong> of your journey to a permanent role.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
             <div style={{ background: '#fff', border: '1px solid var(--border)', padding: '12px 20px', borderRadius: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--blue)' }}>{pendingTasks.length}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Tasks</div>
             </div>
             <div style={{ background: '#fff', border: '1px solid var(--border)', padding: '12px 20px', borderRadius: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--green)' }}>{completedTasks.length}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Completed</div>
             </div>
          </div>
        </div>
      </div>

      <div className="page slide-up" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32, paddingTop: 0 }}>
        
        {/* Main Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          
          {/* Active Mission Section */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Target size={20} color="var(--blue)" />
              <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Current Missions</h2>
            </div>
            
            <div style={{ display: 'grid', gap: 20 }}>
              {loading ? (
                [1,2].map(i => <div key={i} className="card skeleton" style={{ height: 160 }} />)
              ) : pendingTasks.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '60px 24px', border: '2px dashed var(--border)' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--blue-muted)', color: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <Rocket size={32} />
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>All Missions Clear</h3>
                  <p style={{ color: 'var(--text-muted)', maxWidth: 360, margin: '0 auto', fontSize: 14 }}>
                    Excellent work! You've cleared your current queue. Your mentor will be assigning your next set of objectives soon.
                  </p>
                </div>
              ) : pendingTasks.map(task => (
                <div key={task.id} className="card" style={{ 
                  padding: 0, 
                  overflow: 'hidden', 
                  border: '1px solid var(--blue)', 
                  boxShadow: '0 10px 30px -10px rgba(37, 99, 235, 0.15)',
                  display: 'flex'
                }}>
                  <div style={{ width: 6, background: 'var(--blue)' }} />
                  <div style={{ padding: 24, flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', background: 'var(--blue)', padding: '4px 12px', borderRadius: 20, textTransform: 'uppercase' }}>
                          Round {task.round_number || 1}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--amber)', fontWeight: 700 }}>
                          <Clock size={14} />
                          Due {new Date(task.deadline).toLocaleDateString()}
                        </div>
                      </div>
                      <StatusBadge status={task.status} />
                    </div>
                    <h3 style={{ fontSize: 19, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 10 }}>{task.title}</h3>
                    <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24 }}>{task.description}</p>
                    
                    <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-sub)', paddingTop: 20 }}>
                      <button 
                        className="btn btn-primary"
                        style={{ height: 44, padding: '0 24px', borderRadius: 12, fontWeight: 700, gap: 10 }}
                        onClick={() => {
                          setSubmitModal(task)
                          setSubmitForm({ text_response: '' })
                          setSubmitFile(null)
                        }}
                      >
                        Submit Work <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* History Section */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <History size={20} color="var(--text-muted)" />
              <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--text-muted)' }}>Past Achievements</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
              {completedTasks.slice(0, 4).map(task => (
                <div key={task.id} className="card" style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-sub)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <StatusBadge status={task.status} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>{new Date(task.created_at).toLocaleDateString()}</span>
                  </div>
                  <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</h4>
                  <button 
                    className="btn btn-ghost btn-sm" 
                    style={{ padding: 0, height: 'auto', color: 'var(--blue)', fontSize: 13 }}
                    onClick={() => setViewFeedback(task)}
                  >
                    View Feedback
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          
          {/* Career Readiness */}
          <div className="card" style={{ background: 'var(--navy)', color: '#fff', border: 'none', padding: 28, position: 'relative', overflow: 'hidden' }}>
            <TrendingUp size={80} style={{ position: 'absolute', right: -20, bottom: -20, opacity: 0.1, color: '#fff' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Career Readiness</h3>
              <div style={{ fontSize: 32, fontWeight: 900, marginBottom: 4 }}>
                {Math.round((completedTasks.length / (tasks.length || 1)) * 100)}%
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 20 }}>Completion Score</div>
              
              <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 10, overflow: 'hidden', marginBottom: 24 }}>
                <div style={{ 
                  height: '100%', 
                  width: `${(completedTasks.length / (tasks.length || 1)) * 100}%`, 
                  background: 'var(--blue)',
                  boxShadow: '0 0 12px var(--blue)'
                }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 4 }}>Avg Rating</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{latestReviewed?.feedback?.rating || '0.0'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 4 }}>Milestones</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{completedTasks.length} / {tasks.length}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Latest Review */}
          <div className="card" style={{ background: '#fff', border: '1px solid var(--border)', padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <Award size={20} color="var(--amber)" />
              <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0, textTransform: 'uppercase' }}>Mentor Feedback</h3>
            </div>
            {latestReviewed ? (
              <div>
                <div style={{ display: 'flex', gap: 2, marginBottom: 12 }}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} fill={i < latestReviewed.feedback.rating ? 'var(--amber)' : 'transparent'} color={i < latestReviewed.feedback.rating ? 'var(--amber)' : 'var(--border)'} />
                  ))}
                </div>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, fontStyle: 'italic', marginBottom: 16 }}>
                  "{latestReviewed.feedback.feedback_text}"
                </p>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>— Your Senior Mentor</div>
              </div>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                No reviews yet. Complete your first mission to receive feedback from your mentor.
              </p>
            )}
          </div>

          {/* Mentorship Desk */}
          <div className="card" style={{ border: '1px solid var(--border)', padding: 24, background: 'var(--bg-surface)' }}>
             <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 16, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Mentorship Desk</h3>
             <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
               <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--blue-muted)', color: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <Users size={20} />
               </div>
               <div>
                 <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Senior Dev Team</div>
                 <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Primary Guidance</div>
               </div>
             </div>
             <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', border: '1px solid var(--border)', fontSize: 13 }}>
                Get Support
             </button>
          </div>
        </div>

      </div>

      {/* Submission Modal */}
      <Modal open={!!submitModal} onClose={() => setSubmitModal(null)} title="Submit Mission Deliverables">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '4px 0' }}>
          <div style={{ padding: 16, background: 'var(--bg-raised)', borderRadius: 12, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Mission</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{submitModal?.title}</div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8, textTransform: 'uppercase' }}>Work Summary</label>
            <textarea 
              className="input" 
              rows={5} 
              placeholder="Provide a brief overview of your implementation and any challenges faced..." 
              value={submitForm.text_response}
              onChange={e => setSubmitForm(f => ({ ...f, text_response: e.target.value }))} 
              required 
              style={{ fontSize: 14, lineHeight: 1.6, padding: 16 }}
            />
          </div>
          <FileUpload label="Attach Deliverables (PDF, ZIP, or Screenshots)" onChange={setSubmitFile} />
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setSubmitModal(null)} style={{ height: 44, padding: '0 24px' }}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={acting} style={{ height: 44, padding: '0 32px', borderRadius: 12 }}>
              {acting ? 'Uploading...' : 'Complete Mission'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Details/Feedback Modal */}
      <Modal open={!!viewFeedback} onClose={() => setViewFeedback(null)} title="Mission Intelligence">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '4px 0' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Mission Objective</div>
            <p style={{ fontSize: 15, color: 'var(--text-primary)', lineHeight: 1.7, margin: 0 }}>{viewFeedback?.description}</p>
          </div>

          <div style={{ padding: 20, background: 'var(--bg-raised)', borderRadius: 16, border: '1px solid var(--border-sub)' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>Your Submission</div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>{viewFeedback?.submission?.text_response || 'No summary provided.'}</p>
            {viewFeedback?.submission?.file_upload && (
              <a href={viewFeedback.submission.file_upload} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ background: '#fff', border: '1px solid var(--border)', width: '100%', justifyContent: 'center', height: 40, borderRadius: 10 }}>
                <FileText size={16} /> View Deliverable
              </a>
            )}
          </div>

          {viewFeedback?.feedback && (
            <div style={{ padding: 20, background: 'var(--green-muted)', border: '1px solid rgba(22,163,74,0.1)', borderRadius: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--green)', textTransform: 'uppercase' }}>Mentor Debrief</div>
                <div style={{ display: 'flex', gap: 2 }}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} fill={i < viewFeedback.feedback.rating ? 'var(--amber)' : 'transparent'} color={i < viewFeedback.feedback.rating ? 'var(--amber)' : 'rgba(0,0,0,0.1)'} />
                  ))}
                </div>
              </div>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6, fontStyle: 'italic' }}>
                "{viewFeedback.feedback.feedback_text}"
              </p>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={() => setViewFeedback(null)} style={{ padding: '0 32px' }}>Acknowledge</button>
          </div>
        </div>
      </Modal>
    </Layout>
  )
}

export default InternDashboard

