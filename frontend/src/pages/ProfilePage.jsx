import { useState, useEffect } from 'react'
import { Layout, TopBar } from '../components/Layout'
import { useAuth } from '../contexts/AuthContext'
import { authApi } from '../api'
import { toast } from '../components/Toast'
import { FileUpload } from '../components/FileUpload'
import { User, MapPin, Phone, Mail, Save, Camera, Shield } from 'lucide-react'

export const ProfilePage = () => {
  const { user: currentUser, setUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    bio: '',
    location: '',
  })
  const [avatar, setAvatar] = useState(null)
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    if (currentUser) {
      setFormData({
        first_name: currentUser.first_name || '',
        last_name: currentUser.last_name || '',
        email: currentUser.email || '',
        phone: currentUser.profile?.phone || '',
        bio: currentUser.profile?.bio || '',
        location: currentUser.profile?.location || '',
      })
      if (currentUser.profile?.avatar) {
        setPreview(currentUser.profile.avatar)
      }
    }
  }, [currentUser])

  const handleAvatarChange = (file) => {
    setAvatar(file)
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setPreview(reader.result)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData()
    Object.entries(formData).forEach(([k, v]) => fd.append(k, v))
    if (avatar) fd.append('avatar', avatar)

    try {
      const response = await authApi.updateMe(fd)
      setUser(response.data)
      toast.success('Profile updated successfully!')
    } catch (err) {
      const msg = err.response?.data?.email?.[0] || err.response?.data?.detail || 'Failed to update profile'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const initials = currentUser?.first_name
    ? `${currentUser.first_name[0]}${currentUser.last_name?.[0] || ''}`.toUpperCase()
    : currentUser?.username?.[0]?.toUpperCase() || 'U'

  return (
    <Layout>
      <TopBar title="My Profile" subtitle="Manage your personal information and preferences" />
      <div className="page slide-up">
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <form onSubmit={handleSubmit} className="card" style={{ padding: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 32, marginBottom: 40, paddingBottom: 32, borderBottom: '1px solid var(--border)' }}>
              <div style={{ position: 'relative' }}>
                {preview ? (
                  <img src={preview} alt="Avatar" style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--bg-surface)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                ) : (
                  <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'var(--blue)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 800, border: '4px solid var(--bg-surface)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    {initials}
                  </div>
                )}
                <label style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--bg-surface)', border: '1px solid var(--border)', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                  <Camera size={18} color="var(--text-secondary)" />
                  <input type="file" hidden accept="image/*" onChange={e => handleAvatarChange(e.target.files[0])} />
                </label>
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>{formData.first_name} {formData.last_name}</h2>
                <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontWeight: 500, fontSize: 14 }}>{currentUser?.profile?.role?.replace(/_/g, ' ').toUpperCase()}</p>
                <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                    <Shield size={14} /> ID: {currentUser?.id}
                  </div>
                  {formData.location && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                      <MapPin size={14} /> {formData.location}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div>
                <label className="section-label">Basic Information</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>First Name</label>
                    <input className="input" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Last Name</label>
                    <input className="input" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Email Address</label>
                    <input className="input" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                  </div>
                </div>
              </div>

              <div>
                <label className="section-label">Contact & Location</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Phone Number</label>
                    <input className="input" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+1 (555) 000-0000" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Location</label>
                    <input className="input" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="City, Country" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Professional Bio</label>
                    <textarea className="input" rows={3} value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} placeholder="Tell us a bit about yourself..." />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 24px' }}>
                {loading ? 'Saving Changes...' : <><Save size={18} /> Save Changes</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
}
