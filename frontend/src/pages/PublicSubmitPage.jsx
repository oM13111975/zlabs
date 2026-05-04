import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { taskApi } from '../api'
import { toast, ToastContainer } from '../components/Toast'
import { 
  CheckCircle2, 
  Clock, 
  ClipboardList, 
  FileText, 
  History, 
  Star, 
  User, 
  Calendar, 
  Paperclip,
  Check,
  AlertCircle,
  ChevronRight,
  ShieldCheck
} from 'lucide-react'

export const PublicSubmitPage = () => {
  const { token } = useParams()
  const [task, setTask] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [form, setForm] = useState({ email: '', text_response: '' })
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const fileRef = useRef()

  const [isVerified, setIsVerified] = useState(false)

  useEffect(() => {
    taskApi.getByToken(token)
      .then(res => {
        setTask(res.data)
        if (res.data.already_submitted) setDone(true)
      })
      .catch(() => setError('Task not found or link is invalid.'))
      .finally(() => setLoading(false))
  }, [token])

  const verifyEmail = async () => {
    if (!form.email) { toast.error('Please enter your email first'); return }
    setSubmitting(true)
    try {
      const res = await taskApi.getByToken(token, { email: form.email })
      if (res.data.is_verified) {
        setTask(res.data)
        setIsVerified(true)
        toast.success('History unlocked successfully')
      } else {
        toast.error('Verification failed. Use your application email.')
      }
    } catch (err) {
      toast.error('Unable to verify at this time.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email) { toast.error('Please enter your email'); return }
    setSubmitting(true)
    const fd = new FormData()
    fd.append('email', form.email)
    fd.append('text_response', form.text_response)
    if (file) fd.append('file_upload', file)

    try {
      await taskApi.submitByToken(token, fd)
      setDone(true)
      toast.success('Task submitted successfully!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--blue)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <span style={{ fontWeight: 500 }}>Loading workspace...</span>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 400, width: '100%', textAlign: 'center', background: 'var(--bg-surface)', padding: 40, borderRadius: 24, boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)' }}>
        <AlertCircle size={64} color="var(--red)" style={{ marginBottom: 24 }} />
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12, color: 'var(--text-primary)' }}>Invalid Link</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{error}</p>
        <button onClick={() => window.location.reload()} style={{ marginTop: 24 }} className="btn btn-ghost">Try Again</button>
      </div>
    </div>
  )

  return (
    <div style={{ height: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <ToastContainer />
      
      {/* Header (Non-scrollable) */}
      <div style={{ padding: '24px 24px 0', textAlign: 'center', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 8 }}>
          <img src="/logo.png" alt="Logo" style={{ width: 36, height: 36, objectFit: 'contain' }} />
          <h1 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>ZLabs Portal</h1>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Internship Management</p>
      </div>

      <div style={{ flex: 1, overflow: 'hidden', padding: 24, maxWidth: 1400, width: '100%', margin: '0 auto' }}>
        <div style={{ 
          display: 'flex', 
          gap: 24, 
          height: '100%',
          flexDirection: window.innerWidth < 1024 ? 'column' : 'row' 
        }}>
          {/* Left Column: Form */}
          <div style={{ flex: 1.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="card" style={{ height: '100%', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', padding: 0, display: 'flex', flexDirection: 'column' }}>
              {done ? (
                <div style={{ textAlign: 'center', padding: '100px 40px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--green-muted)', color: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <CheckCircle2 size={32} />
                  </div>
                  <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12, color: 'var(--text-primary)' }}>Records Received</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 360, margin: '0 auto', lineHeight: 1.6 }}>
                    Submission successful. Your mentor has been notified.
                  </p>
                </div>
              ) : (
                <>
                  <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-sub)', background: 'linear-gradient(to bottom, #fff, var(--bg-base))', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--blue)', background: 'var(--blue-muted)', padding: '3px 10px', borderRadius: 6, textTransform: 'uppercase' }}>Active Mission</span>
                      {task?.deadline && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--amber)', fontWeight: 600 }}>
                          <Clock size={14} />
                          Due {new Date(task.deadline).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>{task?.title}</h2>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.5 }}>{task?.description}</p>
                  </div>

                  <form 
                    onSubmit={handleSubmit} 
                    style={{ 
                      padding: '24px 32px 32px', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: 20, 
                      flex: 1, 
                      overflow: 'hidden' 
                    }}
                  >
                    <div className="grid-2" style={{ flexShrink: 0 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.02em' }}>Verification</label>
                        <div style={{ position: 'relative', display: 'flex', gap: 8 }}>
                          <div style={{ position: 'relative', flex: 1 }}>
                            <input className="input" type="email" placeholder="Application email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required style={{ paddingLeft: 40, height: 40 }} />
                            <User size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                          </div>
                          {!isVerified && (
                             <button type="button" onClick={verifyEmail} className="btn" style={{ height: 40, padding: '0 16px', fontSize: 12, background: 'var(--bg-surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6 }}>
                               <Check size={14} /> Unlock History
                             </button>
                          )}
                        </div>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.02em' }}>Deliverable</label>
                        <div 
                          onClick={() => fileRef.current?.click()}
                          style={{ 
                            height: 40, 
                            border: '1px dashed var(--border)', 
                            borderRadius: 'var(--r-md)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            padding: '0 12px',
                            cursor: 'pointer',
                            gap: 10,
                            background: file ? 'var(--blue-muted)' : 'var(--bg-surface)',
                            transition: 'all 0.2s'
                          }}
                        >
                            <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={e => setFile(e.target.files[0])} />
                            <Paperclip size={14} color={file ? 'var(--blue)' : 'var(--text-muted)'} />
                            <span style={{ fontSize: 12, color: file ? 'var(--blue)' : 'var(--text-secondary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {file ? file.name : 'Choose file'}
                            </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.02em', flexShrink: 0 }}>Work Summary</label>
                      <textarea
                        className="input"
                        placeholder="Detail your implementation steps..."
                        value={form.text_response}
                        onChange={e => setForm(f => ({ ...f, text_response: e.target.value }))}
                        style={{ 
                          flex: 1, 
                          resize: 'none', 
                          lineHeight: 1.6, 
                          padding: 16,
                          minHeight: 100 
                        }}
                        required
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
                      <button type="submit" className="btn btn-primary" disabled={submitting} style={{ height: 44, padding: '0 28px', fontSize: 14, borderRadius: 10 }}>
                        {submitting ? 'Sending...' : 'Submit Work'}
                        {!submitting && <ChevronRight size={16} />}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>

          {/* Right Column: History */}
          <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexShrink: 0 }}>
              <History size={18} color={isVerified ? "var(--blue)" : "var(--text-muted)"} />
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: isVerified ? 'var(--text-primary)' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>History Log</h3>
            </div>

            <div 
              style={{ flex: 1, overflowY: 'auto', paddingRight: 8, display: 'flex', flexDirection: 'column', gap: 12 }}
              className="custom-scroll"
            >
              {!isVerified ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 32, background: 'var(--bg-surface)', border: '1px dashed var(--border)', borderRadius: 20 }}>
                   <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', marginBottom: 16 }}>
                     <ShieldCheck size={24} />
                   </div>
                   <h4 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>History Locked</h4>
                   <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                     Verify your email address in the left panel to unlock your performance history and mentor feedback.
                   </p>
                </div>
              ) : (
                task?.history?.length > 0 ? (
                  task.history.map(h => (
                    <div key={h.id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 16, boxShadow: 'var(--shadow-sm)', flexShrink: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                        <div>
                          <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>{h.task_type}</div>
                          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{h.title}</h4>
                        </div>
                        <span className={`badge badge-${h.status}`} style={{ padding: '3px 8px', borderRadius: 4, fontSize: 9, fontWeight: 800 }}>
                          {h.status.replace('_', ' ')}
                        </span>
                      </div>

                      {h.feedback ? (
                        <div style={{ marginTop: 10, padding: 12, background: 'var(--green-muted)', borderRadius: 10, border: '1px solid rgba(22,163,74,0.1)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--green)', textTransform: 'uppercase' }}>Reviewed</span>
                            <div style={{ display: 'flex', gap: 1 }}>
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} size={10} fill={i < h.feedback.rating ? 'var(--amber)' : 'transparent'} color={i < h.feedback.rating ? 'var(--amber)' : 'var(--text-muted)'} style={{ opacity: i < h.feedback.rating ? 1 : 0.2 }} />
                              ))}
                            </div>
                          </div>
                          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>"{h.feedback.feedback_text}"</p>
                        </div>
                      ) : (
                        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                          <Clock size={12} />
                          {new Date(h.created_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', border: '2px dashed var(--border-sub)', borderRadius: 16 }}>
                    <p style={{ margin: 0, fontSize: 12 }}>No prior activity recorded</p>
                  </div>
                )
              )}
        </div>
      </div>
    </div>
  </div>

  <style>{`
    .custom-scroll::-webkit-scrollbar { width: 4px; }
    .custom-scroll::-webkit-scrollbar-track { background: transparent; }
    .custom-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }
    .custom-scroll::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }
  `}</style>
</div>
)
}
