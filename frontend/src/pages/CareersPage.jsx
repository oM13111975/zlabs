import { useState, useRef, useEffect } from 'react'
import { internshipApi } from '../api'
import { toast, ToastContainer } from '../components/Toast'
import { 
  ArrowRight, CheckCircle2, ChevronRight, Briefcase, Code, Palette, 
  Terminal, BarChart, FileText, Users, Award, Rocket, GraduationCap,
  ChevronLeft, Upload, Send, MapPin, Clock, Camera, Phone, Mail, Globe, Menu, X
} from 'lucide-react'
import './LandingPage.css'

const ROLE_ICONS = {
  aiml_intern: Terminal,
  bde_intern: Briefcase,
  dev_intern: Code,
  design_intern: Palette,
  marketing_intern: Rocket,
  data_intern: BarChart,
  content_intern: FileText,
  hr_intern: Users,
}

export const CareersPage = () => {
  const [positions, setPositions] = useState([])
  const [selectedRole, setSelectedRole] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', skills: '', cover_letter: '' })
  const [resume, setResume] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [posLoading, setPosLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const fileRef = useRef()
  const formRef = useRef()

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', h)
    return () => window.removeEventListener('scroll', h)
  }, [])

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

  const theme = {
    navy: '#101c44',
    accent: '#2563eb',
    slate: '#475569',
    bg: '#f8fafc',
    border: '#e2e8f0',
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#fff', 
      color: theme.navy, 
      fontFamily: "'Inter', sans-serif",
      WebkitFontSmoothing: 'antialiased'
    }}>
      <ToastContainer />

      {/* ────────── NAV ────────── */}
      <header className={`lp-nav${scrolled ? ' lp-nav--solid' : ''}`} style={{ position: 'sticky' }}>
        <div className="lp-nav__inner">
          <a href="/" className="lp-logo">
            <img src="/logo.png" alt="ZPortal" className="lp-logo__img" />
            <span className="lp-logo__text">ZPortal</span>
          </a>
          <nav className={`lp-nav__links${menuOpen ? ' open' : ''}`}>
            <a href="/#how-it-works" onClick={() => setMenuOpen(false)}>How it Works</a>
            <a href="/#benefits" onClick={() => setMenuOpen(false)}>Benefits</a>
            <a href="/careers" onClick={() => setMenuOpen(false)} style={{ fontWeight: 800, color: '#101c44' }}>Careers</a>
            <a href="/#testimonials" onClick={() => setMenuOpen(false)}>Stories</a>
          </nav>
          <div className="lp-nav__actions">
            <a href="/login" className="lp-btn lp-btn--ghost">Sign In</a>
            <a href="#positions" className="lp-btn lp-btn--dark">View Openings</a>
          </div>
          <button className="lp-nav__burger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      <div className="careers-container" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px' }}>
        
        {/* ────────── HERO ────────── */}
        <section style={{ textAlign: 'center', padding: '100px 0 80px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: 100, fontSize: 12, fontWeight: 700, color: theme.accent, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 24 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
            {positions.length} Open Internship Roles
          </div>
          <h1 className="careers-h1" style={{ fontSize: 64, fontWeight: 900, letterSpacing: '-0.05em', marginBottom: 24, lineHeight: 1.0 }}>
            Start your professional <br/> <em style={{ fontStyle: 'normal', color: theme.accent }}>chapter at ZLabs.</em>
          </h1>
          <p style={{ fontSize: 18, color: theme.slate, maxWidth: 600, margin: '0 auto 40px', lineHeight: 1.7 }}>
            Join a structured ecosystem designed for high-potential talent. No coffee runs — just real projects, real impact, and a clear path to conversion.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
            <a href="#positions" style={{ 
              background: theme.navy, 
              color: '#fff', 
              padding: '16px 32px', 
              borderRadius: 14, 
              fontWeight: 700, 
              fontSize: 16, 
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10
            }}>
              Browse Positions <ArrowRight size={20} />
            </a>
          </div>
        </section>

        {/* ────────── PERKS (No Emojis) ────────── */}
        <div className="perks-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 100 }}>
          {[
            { icon: Users, t: '1-on-1 Mentorship', d: 'Paired with a senior from day one' },
            { icon: Rocket, t: 'Real Impact', d: 'Work on live products, not exercises' },
            { icon: Award, t: 'Verified Credentials', d: 'Official recognition for your career' },
            { icon: GraduationCap, t: 'Clear Path to Hire', d: 'Direct conversion based on data' },
          ].map((p, i) => (
            <div key={i} style={{ 
              background: '#fff', 
              border: `1px solid ${theme.border}`, 
              borderRadius: 24, 
              padding: 32, 
              textAlign: 'center',
              transition: 'transform 0.3s ease',
            }}>
              <div style={{ 
                width: 52, height: 52, background: theme.bg, borderRadius: 14, 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                margin: '0 auto 20px', color: theme.navy, border: `1px solid ${theme.border}`
              }}>
                <p.icon size={24} style={{ margin: 'auto' }} />
              </div>
              <h4 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>{p.t}</h4>
              <p style={{ fontSize: 13, color: theme.slate, lineHeight: 1.5 }}>{p.d}</p>
            </div>
          ))}
        </div>

        {/* ────────── POSITIONS GRID ────────── */}
        <section id="positions" style={{ marginBottom: 120 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
            <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em' }}>Open Positions</h2>
            <div style={{ fontSize: 14, color: theme.slate, fontWeight: 500 }}>Showing {positions.length} active roles</div>
          </div>

          <div className="careers-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {posLoading ? (
              [1, 2, 3].map(n => <div key={n} style={{ height: 200, background: theme.bg, borderRadius: 20 }} />)
            ) : positions.length > 0 ? (
              positions.map((pos, i) => {
                const Icon = ROLE_ICONS[pos.role] || Briefcase
                return (
                  <div key={i} style={{ 
                    background: '#fff', 
                    border: `1px solid ${theme.border}`, 
                    borderRadius: 24, 
                    padding: 32,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = theme.accent
                    e.currentTarget.style.boxShadow = '0 12px 30px rgba(16, 28, 68, 0.05)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = theme.border
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                  onClick={() => handleApplyClick(pos)}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                        <div style={{ width: 44, height: 44, background: theme.bg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.navy }}>
                          <Icon size={20} style={{ margin: 'auto' }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: theme.slate, letterSpacing: '0.04em' }}>{pos.department || 'Technology'}</span>
                      </div>
                      <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12, lineHeight: 1.2 }}>{pos.title}</h3>
                      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: theme.slate }}>
                          <MapPin size={14} /> Remote / Hybrid
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: theme.slate }}>
                          <Clock size={14} /> Full-time
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: theme.accent, fontWeight: 700, fontSize: 14 }}>
                      Apply to Role <ChevronRight size={16} />
                    </div>
                  </div>
                )
              })
            ) : (
              <div style={{ gridColumn: '1/-1', padding: 80, textAlign: 'center', background: theme.bg, borderRadius: 24 }}>
                <p style={{ color: theme.slate }}>No active positions at the moment. Check back soon!</p>
              </div>
            )}
          </div>
        </section>

        {/* ────────── APPLICATION FORM ────────── */}
        <section id="apply" ref={formRef} style={{ maxWidth: 800, margin: '0 auto 120px' }}>
          <div style={{ background: theme.navy, borderRadius: 32, padding: 60, color: '#fff', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            {/* Background pattern */}
            <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: 'radial-gradient(circle at center, rgba(37, 99, 235, 0.1) 0%, transparent 60%)', pointerEvents: 'none' }} />

            {!submitted ? (
              <>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <h2 style={{ fontSize: 36, fontWeight: 900, marginBottom: 12, letterSpacing: '-0.04em' }}>
                    {selectedRole ? `Join us as a ${selectedRole.title}` : 'Ready to start?'}
                  </h2>
                  <p style={{ color: '#94a3b8', fontSize: 16, marginBottom: 40, maxWidth: 500, margin: '0 auto 40px' }}>
                    Complete the form below to submit your profile for consideration.
                  </p>

                  <form onSubmit={handleSubmit} style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, color: '#fff' }}>Full Name</label>
                        <input style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', outline: 'none' }} placeholder="John Doe" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} required />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, color: '#fff' }}>Email Address</label>
                        <input style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', outline: 'none' }} type="email" placeholder="john@example.com" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} required />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, color: '#fff' }}>Phone Number</label>
                      <input style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', outline: 'none' }} type="tel" placeholder="+91 12345 67890" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} required />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, color: '#fff' }}>Core Skills</label>
                      <input style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', outline: 'none' }} placeholder="e.g. React, Python, UI Design" value={form.skills} onChange={e => setForm(f => ({...f, skills: e.target.value}))} required />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, color: '#fff' }}>Resume (PDF Only)</label>
                      <div 
                        onClick={() => fileRef.current.click()}
                        style={{ width: '100%', padding: '14px', borderRadius: 12, border: '2px dashed rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.02)', color: '#fff', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}
                      >
                        <Upload size={20} style={{ marginBottom: 8 }} />
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{resume ? resume.name : 'Click to upload resume'}</div>
                        <input type="file" hidden ref={fileRef} accept=".pdf" onChange={e => setResume(e.target.files[0])} />
                      </div>
                    </div>
                    <button 
                      type="submit" 
                      disabled={loading}
                      style={{ 
                        width: '100%', padding: '16px', borderRadius: 14, 
                        background: theme.accent, color: '#fff', fontWeight: 800, 
                        fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer',
                        border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 10
                      }}
                    >
                      {loading ? 'Submitting Application...' : 'Submit Application'}
                      {!loading && <Send size={18} />}
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div style={{ position: 'relative', zIndex: 1, padding: '40px 0' }}>
                <div style={{ width: 64, height: 64, background: '#22c55e', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                  <CheckCircle2 size={32} color="#fff" />
                </div>
                <h2 style={{ fontSize: 36, fontWeight: 900, marginBottom: 12 }}>Application Sent!</h2>
                <p style={{ color: '#94a3b8', fontSize: 16, marginBottom: 32 }}>
                  Thank you for applying to ZLabs. Our team will review your profile and get back to you soon.
                </p>
                <a href="/" style={{ color: '#fff', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <ChevronLeft size={18} /> Return to Home
                </a>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ────────── FOOTER ────────── */}
      {/* ────────── FOOTER ────────── */}
      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer__main">
            <div className="lp-footer__brand">
              <a href="/" className="lp-logo lp-logo--light">
                <img src="/logo.png" alt="ZeexAI" className="lp-logo__img" />
                <span className="lp-logo__text" style={{ color: '#fff' }}>ZeexAI</span>
              </a>
              <p className="lp-footer__desc">
                Harnessing the power of data and artificial intelligence, Zeex AI empowers organizations to predict risks, ensure safety, and optimize Daily operations—before issues escalate.
              </p>
              <div className="lp-footer__socials">
                <a href="#"><Globe size={20} /></a>
                <a href="#"><Globe size={20} /></a>
                <a href="#"><Globe size={20} /></a>
                <a href="#"><Camera size={20} /></a>
              </div>
            </div>

            <div className="lp-footer__col">
              <h6>Quick Links</h6>
              <ul>
                <li><a href="/">Home</a></li>
                <li><a href="/#how-it-works">How it Works</a></li>
                <li><a href="/#benefits">Benefits</a></li>
                <li><a href="/#testimonials">Stories</a></li>
                <li><a href="/careers">Careers</a></li>
                <li><a href="/login">Staff Portal</a></li>
              </ul>
            </div>

            <div className="lp-footer__col">
              <h6>Our Services</h6>
              <ul>
                <li><a href="#">Retail & High-Risk Shop Security</a></li>
                <li><a href="#">Bank & ATM Security Solutions</a></li>
                <li><a href="#">Industrial Safety Monitoring</a></li>
                <li><a href="#">Smart City Surveillance</a></li>
              </ul>
            </div>

            <div className="lp-footer__col">
              <h6>Contact Us</h6>
              <ul className="lp-footer__contact">
                <li><Phone size={18} /> <span>+91 8709221636</span></li>
                <li><Mail size={18} /> <span>admin@zeexai.com</span></li>
                <li><MapPin size={18} /> <span>Nirmaan, CFI, IIT Madras</span></li>
              </ul>
            </div>
          </div>

          <div className="lp-footer__bottom">
            <span>© 2026 ZeexAI. All rights reserved.</span>
            <div className="lp-footer__legal">
              <a href="#" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', marginLeft: 24 }}>Privacy Policy</a>
              <a href="#" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', marginLeft: 24 }}>Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default CareersPage
