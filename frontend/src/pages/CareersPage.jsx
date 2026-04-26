import { useState, useRef, useEffect } from 'react'
import { internshipApi } from '../api'
import { toast, ToastContainer } from '../components/Toast'

const ROLE_ICONS = {
  aiml_intern: '🤖', bde_intern: '💼', dev_intern: '💻',
  design_intern: '🎨', marketing_intern: '📣', data_intern: '📊',
  content_intern: '✍️', hr_intern: '🤝',
}

export const CareersPage = () => {
  const [positions, setPositions] = useState([])
  const [selectedRole, setSelectedRole] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', skills: '', cover_letter: '' })
  const [resume, setResume] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [posLoading, setPosLoading] = useState(true)
  const fileRef = useRef()
  const formRef = useRef()

  useEffect(() => {
    internshipApi.positions({ open: 'true' })
      .then(r => setPositions(r.data.results || r.data))
      .catch(() => {})
      .finally(() => setPosLoading(false))
  }, [])

  const handleApplyClick = (pos) => {
    setSelectedRole(pos)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!resume) { toast.error('Please upload your resume (PDF)'); return }
    setLoading(true)
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, v))
    fd.append('resume', resume)
    fd.append('role_applied_for', selectedRole?.role || 'dev_intern')
    try {
      await internshipApi.apply(fd)
      setSubmitted(true)
    } catch (err) {
      const errors = err.response?.data
      if (typeof errors === 'object') Object.values(errors).forEach(e => toast.error(Array.isArray(e) ? e[0] : e))
      else toast.error('Submission failed.')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)', fontFamily: 'var(--font)' }}>
      <ToastContainer />

      {/* Nav */}
      <div style={{ borderBottom: '1px solid var(--border)', padding: '0 40px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-surface)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff' }}>Z</div>
          <span style={{ fontWeight: 700, fontSize: 15 }}>ZLabs</span>
          <span style={{ color: 'var(--border)', padding: '0 8px' }}>|</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Careers</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <a href="#positions" style={{ fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none' }}>Open Positions</a>
          <a href="/login" className="btn btn-primary btn-sm">Staff Login</a>
        </div>
      </div>

      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '40px 24px 80px' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', padding: '32px 0 52px', borderBottom: '1px solid var(--border)', marginBottom: 48 }}>
          <div style={{ display: 'inline-block', padding: '3px 12px', border: '1px solid var(--border)', borderRadius: 99, fontSize: 12, color: 'var(--text-muted)', marginBottom: 20, fontWeight: 500 }}>
            Now Hiring — {positions.length} Roles Open
          </div>
          <h1 style={{ fontSize: 40, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 14, lineHeight: 1.1 }}>
            Start your career at ZLabs
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, maxWidth: 520, margin: '0 auto 28px', lineHeight: 1.7 }}>
            We hire curious people. Work on real projects, get mentored by experienced engineers, and grow fast.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
            <a href="#positions" className="btn btn-primary">View Open Roles</a>
            <a href="#apply" className="btn btn-ghost">How to Apply</a>
          </div>
        </div>

        {/* Perks */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 52 }}>
          {[
            { icon: '🧑‍💼', t: '1-on-1 Mentorship', d: 'Paired with a senior from day one' },
            { icon: '🚀', t: 'Real Projects', d: 'Work on live products, not exercises' },
            { icon: '📜', t: 'Certificate + LOR', d: 'Official recognition for your CV' },
            { icon: '🌟', t: 'Full-Time Offer', d: 'Top performers get hired directly' },
          ].map(p => (
            <div key={p.t} className="card card-sm" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{p.icon}</div>
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', marginBottom: 3 }}>{p.t}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.d}</div>
            </div>
          ))}
        </div>

        {/* Open Positions */}
        <div id="positions">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Open Positions</h2>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{positions.length} roles</span>
          </div>

          {posLoading ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>Loading...</div>
          ) : positions.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              No open positions at the moment. Check back soon.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              {positions.map((pos, i) => {
                const isSelected = selectedRole?.role === pos.role
                return (
                  <div
                    key={pos.id}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '16px 20px',
                      background: isSelected ? 'var(--blue-muted)' : i % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-raised)',
                      borderLeft: isSelected ? '3px solid var(--blue)' : '3px solid transparent',
                      cursor: 'pointer',
                      transition: 'background 0.1s',
                    }}
                    onClick={() => handleApplyClick(pos)}
                    onMouseEnter={e => !isSelected && (e.currentTarget.style.background = 'var(--bg-raised)')}
                    onMouseLeave={e => !isSelected && (e.currentTarget.style.background = i % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-raised)')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <span style={{ fontSize: 20 }}>{ROLE_ICONS[pos.role] || '🎯'}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{pos.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
                          {pos.duration} · {pos.requirements?.split(',').slice(0, 3).join(', ')}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, padding: '2px 8px', border: '1px solid var(--green)', borderRadius: 99, color: 'var(--green)', fontWeight: 600 }}>Open</span>
                      <button
                        className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={e => { e.stopPropagation(); handleApplyClick(pos) }}
                      >
                        {isSelected ? '✓ Selected' : 'Apply'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Application Form */}
        <div ref={formRef} id="apply" style={{ marginTop: 52, maxWidth: 640, margin: '52px auto 0' }}>
          <div className="card" style={{ padding: 28 }}>
            {!selectedRole ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>☝️</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Select a position above</div>
                <div style={{ fontSize: 13 }}>Click on any open role to start your application.</div>
              </div>
            ) : submitted ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
                <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--text-primary)', marginBottom: 8 }}>Application Received</div>
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  We'll review your application for <strong style={{ color: 'var(--text-primary)' }}>{selectedRole.title}</strong> and get back to you within 3 business days.
                </p>
                <button
                  className="btn btn-ghost"
                  onClick={() => { setSubmitted(false); setSelectedRole(null); setForm({ name: '', email: '', phone: '', skills: '', cover_letter: '' }); setResume(null) }}
                  style={{ marginTop: 16 }}
                >
                  Apply for another role
                </button>
              </div>
            ) : (
              <>
                {/* Selected role strip */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 6, marginBottom: 22 }}>
                  <span>{ROLE_ICONS[selectedRole.role]}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{selectedRole.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Duration: {selectedRole.duration}</div>
                  </div>
                </div>

                <h2 style={{ margin: '0 0 18px', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Your Application</h2>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>Full Name *</label>
                      <input className="input" placeholder="Priya Sharma" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>Phone *</label>
                      <input className="input" placeholder="+91 9876543210" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>Email *</label>
                    <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>Skills * <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(comma-separated)</span></label>
                    <input className="input" placeholder="Python, TensorFlow, SQL..." value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>Why do you want this role? *</label>
                    <textarea className="input" rows={4} placeholder={`Tell us why you're a great fit for ${selectedRole.title}...`} value={form.cover_letter} onChange={e => setForm(f => ({ ...f, cover_letter: e.target.value }))} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>Resume * <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(PDF, max 5MB)</span></label>
                    <div
                      className={`file-drop ${resume ? 'active' : ''}`}
                      onClick={() => fileRef.current?.click()}
                    >
                      <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => setResume(e.target.files[0])} />
                      {resume ? (
                        <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                          📎 {resume.name} <span style={{ color: 'var(--text-muted)', marginLeft: 6, fontSize: 12 }}>Click to change</span>
                        </div>
                      ) : (
                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                          Drop PDF here or <span style={{ color: 'var(--blue)' }}>click to browse</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '10px', marginTop: 4 }}>
                    {loading ? 'Submitting...' : `Submit Application for ${selectedRole.title}`}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--border)', padding: '20px 40px', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
        © 2025 ZLabs. All rights reserved.
      </div>
    </div>
  )
}
