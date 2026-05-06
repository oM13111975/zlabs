import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, TopBar } from '../../components/Layout'
import { authApi } from '../../api'
import { toast } from '../../components/Toast'
import { 
  UserPlus, 
  ArrowLeft, 
  ArrowRight, 
  Mail, 
  Phone, 
  Shield, 
  FileText,
  CheckCircle,
  Copy,
  Layers,
  User,
  Trash2,
  Play,
  Loader2,
  History,
  Download,
  Eye,
  ExternalLink,
  Search
} from 'lucide-react'

export const EnrollPage = () => {
  const navigate = useNavigate()
  const [mode, setMode] = useState('single') // 'single' or 'bulk'
  
  // History State
  const [recentUsers, setRecentUsers] = useState([])
  const [fetchingHistory, setFetchingHistory] = useState(false)

  // Single Mode State
  const [formData, setFormData] = useState({ 
    first_name: '', last_name: '', email: '', phone: '', role: 'intern', domain: '', resume: null,
    skills: ''
  })
  
  // Bulk Mode State
  const [bulkRows, setBulkRows] = useState([])
  const [globalRole, setGlobalRole] = useState('intern')
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })

  const [loading, setLoading] = useState(false)
  const [successData, setSuccessData] = useState(null)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    setFetchingHistory(true)
    try {
      const res = await authApi.users({ 
        ordering: '-created_at', 
        limit: 10,
        is_direct_enroll: 'true' 
      })
      setRecentUsers(res.data.results || res.data)
    } catch (err) {
      console.error('Failed to fetch history', err)
    } finally {
      setFetchingHistory(false)
    }
  }

  const handleSingleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData()
    Object.entries(formData).forEach(([k, v]) => {
      if (v) fd.append(k, v)
    })
    
    try {
      const res = await authApi.enroll(fd)
      setSuccessData(res.data)
      toast.success('Member enrolled successfully!')
      fetchHistory() 
    } catch (err) {
      toast.error(err.response?.data?.error || 'Enrollment failed')
    } finally {
      setLoading(false)
    }
  }

  const handleBulkFiles = async (files) => {
    const fileArray = Array.from(files)
    
    // Add rows first
    const newRows = fileArray.map(file => {
      const nameParts = file.name.split(/[._\-\s]/)
      return {
        id: Math.random().toString(36).substr(2, 9),
        first_name: nameParts[0] || '',
        last_name: nameParts[1] || '',
        email: '',
        phone: '',
        role: globalRole,
        resume: file,
        status: 'pending',
        scanning: file.name.toLowerCase().endsWith('.pdf'),
        error: null
      }
    })
    
    setBulkRows(prev => [...prev, ...newRows])

    // Scan PDF files
    for (const row of newRows) {
      if (!row.resume.name.toLowerCase().endsWith('.pdf')) continue

      const fd = new FormData()
      fd.append('resume', row.resume)
      try {
        const res = await authApi.enrollScan(fd)
        setBulkRows(prev => prev.map(r => r.id === row.id ? { 
          ...r, 
          email: res.data.email || r.email, 
          phone: res.data.phone || r.phone,
          scanning: false 
        } : r))
      } catch (err) {
        setBulkRows(prev => prev.map(r => r.id === row.id ? { ...r, scanning: false } : r))
      }
    }
  }

  const processBulk = async () => {
    const pending = bulkRows.filter(r => r.status === 'pending' || r.status === 'error')
    if (pending.length === 0) return
    
    setProcessing(true)
    setProgress({ current: 0, total: pending.length })
    
    for (let i = 0; i < pending.length; i++) {
      const row = pending[i]
      setBulkRows(prev => prev.map(r => r.id === row.id ? { ...r, status: 'processing' } : r))
      setProgress(prev => ({ ...prev, current: i + 1 }))

      const fd = new FormData()
      fd.append('first_name', row.first_name)
      fd.append('last_name', row.last_name)
      fd.append('email', row.email)
      fd.append('phone', row.phone)
      fd.append('role', row.role)
      fd.append('resume', row.resume)

      try {
        await authApi.enroll(fd)
        setBulkRows(prev => prev.map(r => r.id === row.id ? { ...r, status: 'success' } : r))
      } catch (err) {
        const errMsg = err.response?.data?.error || 'Failed'
        setBulkRows(prev => prev.map(r => r.id === row.id ? { ...r, status: 'error', error: errMsg } : r))
      }
    }
    
    setProcessing(false)
    toast.success('Bulk enrollment completed!')
    fetchHistory()
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  return (
    <Layout>
      <TopBar 
        title="Enrollment Center" 
        subtitle="Onboard new members individually or in bulk"
        actions={
          <button onClick={() => navigate('/admin/dashboard')} className="btn btn-ghost btn-sm">
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
        }
      />

      <div className="page slide-up">
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ maxWidth: mode === 'single' ? 800 : 'none', margin: mode === 'single' ? '0 auto' : '0' }}>
            
            {/* Mode Switcher */}
            <div style={{ display: 'flex', gap: 4, background: 'var(--bg-raised)', padding: 4, borderRadius: 12, marginBottom: 24, width: 'fit-content' }}>
              <button 
                onClick={() => setMode('single')}
                className={`btn btn-sm ${mode === 'single' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ borderRadius: 10, padding: '8px 20px' }}
              >
                <User size={14} style={{ marginRight: 8 }} /> Single Entry
              </button>
              <button 
                onClick={() => setMode('bulk')}
                className={`btn btn-sm ${mode === 'bulk' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ borderRadius: 10, padding: '8px 20px' }}
              >
                <Layers size={14} style={{ marginRight: 8 }} /> Bulk Resumes
              </button>
            </div>

            {mode === 'single' ? (
              <form onSubmit={handleSingleSubmit} className="card" style={{ padding: 40, marginBottom: 40 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--blue-muted)', color: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UserPlus size={24} />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Account Details</h2>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13 }}>Enter the information for the new member</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                  <div>
                    <label className="section-label">First Name</label>
                    <input className="input" placeholder="John" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} required />
                  </div>
                  <div>
                    <label className="section-label">Last Name</label>
                    <input className="input" placeholder="Doe" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} />
                  </div>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label className="section-label">Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="email" className="input" style={{ paddingLeft: 40 }} placeholder="john.doe@company.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                  <div>
                    <label className="section-label">Role Assignment</label>
                    <select className="input" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} required>
                      <option value="intern">Intern</option>
                      <option value="team_member">Team Member</option>
                      <option value="team_head">Team Head</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="section-label">Phone Number</label>
                    <div style={{ position: 'relative' }}>
                      <Phone size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input className="input" style={{ paddingLeft: 40 }} placeholder="+1 (555) 000-0000" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    </div>
                  </div>
                </div>

                {formData.role === 'intern' && (
                  <div style={{ marginBottom: 24 }} className="animate-in">
                    <label className="section-label">Core Skills</label>
                    <input className="input" placeholder="e.g. React, Python, UI/UX" value={formData.skills} onChange={e => setFormData({...formData, skills: e.target.value})} />
                  </div>
                )}

                <div style={{ marginBottom: 32 }}>
                  <label className="section-label">Resume / CV Upload</label>
                  <div style={{ padding: 24, border: '2px dashed var(--border)', borderRadius: 12, background: 'var(--bg-elevated)', textAlign: 'center' }}>
                    <FileText size={32} style={{ marginBottom: 12, color: 'var(--text-muted)', opacity: 0.5 }} />
                    <input type="file" accept=".pdf,.doc,.docx" onChange={e => setFormData({...formData, resume: e.target.files[0]})} />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                  {loading ? 'Processing...' : 'Complete Enrollment'}
                </button>
              </form>
            ) : (
              <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 40 }}>
                <div style={{ padding: 32, borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--purple-muted)', color: 'var(--purple)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Layers size={24} />
                      </div>
                      <div>
                        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Bulk Resume Enrollment</h2>
                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13 }}>Drop multiple resumes to onboard an entire cohort at once</p>
                      </div>
                    </div>
                    {bulkRows.length > 0 && !processing && (
                      <button className="btn btn-primary" onClick={processBulk} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Play size={16} /> Process {bulkRows.filter(r => r.status === 'pending').length} Resumes
                      </button>
                    )}
                  </div>

                  <div 
                    style={{ 
                      padding: 40, border: '2px dashed var(--border)', borderRadius: 16, background: 'var(--bg-elevated)', 
                      textAlign: 'center', cursor: 'pointer' 
                    }}
                    onClick={() => document.getElementById('bulk-file-input').click()}
                  >
                    <input id="bulk-file-input" type="file" multiple accept=".pdf,.doc,.docx" hidden onChange={e => handleBulkFiles(e.target.files)} />
                    <FileText size={48} style={{ margin: '0 auto 16px', color: 'var(--blue)', opacity: 0.6 }} />
                    <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>Drag & Drop Resumes Here</h3>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 14 }}>Or click to select multiple files from your computer</p>
                  </div>
                </div>

                {processing && (
                  <div style={{ padding: '20px 32px', background: 'var(--blue-muted)', display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Loader2 className="spin" size={20} color="var(--blue)" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, fontWeight: 700, color: 'var(--blue)' }}>
                        <span>Enrolling Member {progress.current} of {progress.total}</span>
                        <span>{Math.round((progress.current / progress.total) * 100)}%</span>
                      </div>
                      <div style={{ height: 8, background: 'rgba(0,0,0,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${(progress.current / progress.total) * 100}%`, height: '100%', background: 'var(--blue)', borderRadius: 4, transition: 'width 0.3s ease' }} />
                      </div>
                    </div>
                  </div>
                )}

                {bulkRows.length > 0 ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg-raised)', borderBottom: '1px solid var(--border)' }}>
                          <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>File / Resume</th>
                          <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>First Name</th>
                          <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Email Address</th>
                          <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Phone</th>
                          <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Role</th>
                          <th style={{ padding: '12px 24px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulkRows.map(row => (
                          <tr key={row.id} style={{ borderBottom: '1px solid var(--border)', background: row.status === 'processing' ? 'var(--bg-elevated)' : 'transparent' }}>
                            <td style={{ padding: '16px 24px' }}>
                              <div 
                                style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                                onClick={() => window.open(URL.createObjectURL(row.resume), '_blank')}
                                title="Click to view resume locally"
                              >
                                <FileText size={16} color="var(--blue)" />
                                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--blue)', textDecoration: 'underline' }}>{row.resume.name}</span>
                              </div>
                            </td>
                            <td style={{ padding: '16px 24px' }}>
                              <input className="input-sm" value={row.first_name} onChange={e => setBulkRows(prev => prev.map(r => r.id === row.id ? { ...r, first_name: e.target.value } : r))} disabled={processing || row.status === 'success'} />
                            </td>
                            <td style={{ padding: '16px 24px' }}>
                              <div style={{ position: 'relative' }}>
                                <input 
                                  className="input-sm" 
                                  type="email" 
                                  placeholder={row.scanning ? "Scanning..." : "Email required..."}
                                  value={row.email} 
                                  onChange={e => setBulkRows(prev => prev.map(r => r.id === row.id ? { ...r, email: e.target.value } : r))} 
                                  disabled={processing || row.status === 'success' || row.scanning}
                                />
                                {row.scanning && <Loader2 className="spin" size={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />}
                              </div>
                            </td>
                            <td style={{ padding: '16px 24px' }}>
                              <input 
                                className="input-sm" 
                                placeholder={row.scanning ? "Scanning..." : "Optional..."}
                                value={row.phone} 
                                onChange={e => setBulkRows(prev => prev.map(r => r.id === row.id ? { ...r, phone: e.target.value } : r))} 
                                disabled={processing || row.status === 'success' || row.scanning}
                              />
                            </td>
                            <td style={{ padding: '16px 24px' }}>
                              <select className="input-sm" value={row.role} onChange={e => setBulkRows(prev => prev.map(r => r.id === row.id ? { ...r, role: e.target.value } : r))} disabled={processing || row.status === 'success'}>
                                <option value="intern">Intern</option>
                                <option value="team_member">Member</option>
                                <option value="team_head">Head</option>
                              </select>
                            </td>
                            <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                              {row.status === 'pending' && !row.scanning && <button onClick={() => setBulkRows(prev => prev.filter(r => r.id !== row.id))} style={{ color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>}
                              {row.status === 'processing' && <Loader2 className="spin" size={16} color="var(--blue)" />}
                              {row.status === 'success' && <CheckCircle size={18} color="var(--green)" />}
                              {row.status === 'error' && <div style={{ color: 'var(--red)', fontSize: 11, fontWeight: 700 }} title={row.error}>Error</div>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Layers size={40} style={{ margin: '0 auto 16px', opacity: 0.1 }} />
                    <p>No files selected for bulk enrollment yet.</p>
                  </div>
                )}
              </div>
            )}

            {/* Enrollment History Section */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <History size={20} color="var(--text-secondary)" />
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Recent Enrollments</h2>
                </div>
                {fetchingHistory && <Loader2 className="spin" size={16} color="var(--text-muted)" />}
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-raised)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '12px 32px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Member Name</th>
                      <th style={{ padding: '12px 32px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Email</th>
                      <th style={{ padding: '12px 32px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Role</th>
                      <th style={{ padding: '12px 32px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Joined</th>
                      <th style={{ padding: '12px 32px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Resume</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentUsers.length > 0 ? recentUsers.map(user => (
                      <tr key={user.id} style={{ borderBottom: '1px solid var(--border-sub)' }}>
                        <td style={{ padding: '16px 32px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-raised)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                              {user.first_name[0]}
                            </div>
                            <span style={{ fontWeight: 600 }}>{user.full_name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '16px 32px', color: 'var(--text-secondary)', fontSize: 13 }}>{user.email}</td>
                        <td style={{ padding: '16px 32px' }}>
                          <span className={`role-badge role-${user.profile?.role}`}>{user.profile?.role?.replace('_', ' ')}</span>
                        </td>
                        <td style={{ padding: '16px 32px', color: 'var(--text-muted)', fontSize: 12 }}>
                          {new Date(user.profile?.created_at).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '16px 32px', textAlign: 'right' }}>
                          {user.profile?.resume ? (
                            <a 
                              href={user.profile.resume} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="btn btn-ghost btn-sm"
                              style={{ padding: '6px 12px', color: 'var(--blue)' }}
                            >
                              <FileText size={14} style={{ marginRight: 6 }} /> View Resume
                            </a>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>No Resume</span>
                          )}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="5" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                          No recent enrollments found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Success Modal */}
      {successData && (
        <div className="modal-overlay">
          <div className="modal-content animate-in" style={{ maxWidth: 450, textAlign: 'center', padding: 40 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--green-muted)', color: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <CheckCircle size={32} />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Enrollment Successful!</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 32 }}>
              Account created. Credentials sent to <strong>{formData.email}</strong>.
            </p>

            <div style={{ background: 'var(--bg-raised)', padding: 20, borderRadius: 12, textAlign: 'left', marginBottom: 32 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>Username</label>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <code>{successData.username}</code>
                  <button onClick={() => copyToClipboard(successData.username)} className="btn btn-ghost btn-sm"><Copy size={14} /></button>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>Temporary Password</label>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <code style={{ color: 'var(--blue)' }}>{successData.password}</code>
                  <button onClick={() => copyToClipboard(successData.password)} className="btn btn-ghost btn-sm"><Copy size={14} /></button>
                </div>
              </div>
            </div>

            <button className="btn btn-primary w-full" onClick={() => setSuccessData(null)}>Enroll Another</button>
          </div>
        </div>
      )}
    </Layout>
  )
}
