import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Layout, TopBar } from '../../components/Layout'
import { StatusBadge, RoleBadge } from '../../components/StatusBadge'
import { toast } from '../../components/Toast'
import { authApi } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Shield, 
  Users, 
  FolderKanban, 
  CheckSquare, 
  Clock,
  ExternalLink,
  Award,
  Briefcase
} from 'lucide-react'

export const MemberProfilePage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { role: currentUserRole } = useAuth()
  const [member, setMember] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadMember = async () => {
    setLoading(true)
    try {
      const response = await authApi.userDetail(id)
      setMember(response.data)
    } catch (err) {
      toast.error('Failed to load member profile')
      navigate('/admin/members')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMember()
  }, [id])

  if (loading) return (
    <Layout>
      <TopBar title="Loading Profile..." />
      <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
        <div className="spinner" />
      </div>
    </Layout>
  )

  if (!member) return null

  const initials = `${member.first_name?.[0] || ''}${member.last_name?.[0] || ''}`.toUpperCase() || member.username?.[0]?.toUpperCase()

  return (
    <Layout>
      <TopBar 
        title={`${member.first_name} ${member.last_name}`}
        subtitle={`${member.profile?.role?.replace(/_/g, ' ').toUpperCase()} Profile`}
        actions={
          <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm">
            <ArrowLeft size={16} /> Back
          </button>
        }
      />
      
      <div className="page slide-up" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
        
        {/* Left Column: Details & Projects */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Main Info Card */}
          <div className="card" style={{ padding: 32 }}>
            <div style={{ display: 'flex', gap: 32, alignItems: 'start' }}>
              <div>
                {member.profile?.avatar ? (
                  <img src={member.profile.avatar} alt="Avatar" style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--bg-surface)', boxShadow: 'var(--shadow-md)' }} />
                ) : (
                  <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'var(--blue)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 800 }}>
                    {initials}
                  </div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' }}>{member.first_name} {member.last_name}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}>@{member.username}</span>
                      <RoleBadge role={member.profile?.role} />
                    </div>
                  </div>
                </div>
                
                <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)', fontSize: 14 }}>
                    <Mail size={16} color="var(--text-muted)" />
                    {member.email}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)', fontSize: 14 }}>
                    <Phone size={16} color="var(--text-muted)" />
                    {member.profile?.phone || 'No phone set'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)', fontSize: 14 }}>
                    <MapPin size={16} color="var(--text-muted)" />
                    {member.profile?.location || 'Location unassigned'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)', fontSize: 14 }}>
                    <Clock size={16} color="var(--text-muted)" />
                    Joined {new Date(member.profile?.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
            
            {member.profile?.bio && (
              <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
                <h4 className="section-label" style={{ marginBottom: 12 }}>Professional Bio</h4>
                <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: 15 }}>
                  {member.profile.bio}
                </p>
              </div>
            )}
          </div>

          {/* Teams & Projects */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--blue-muted)', color: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={18} />
                </div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Assigned Teams</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {member.teams?.length > 0 ? member.teams.map(t => (
                  <div key={t.id} style={{ padding: 12, background: 'var(--bg-raised)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{t.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.domain}</div>
                    </div>
                  </div>
                )) : (
                  <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No active team memberships</div>
                )}
              </div>
            </div>

            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--purple-muted)', color: 'var(--purple)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FolderKanban size={18} />
                </div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Active Projects</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {member.projects?.length > 0 ? member.projects.map(p => (
                  <div key={p.id} style={{ padding: 12, background: 'var(--bg-raised)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                      <div style={{ fontSize: 11 }}>
                        <StatusBadge status={p.status} />
                      </div>
                    </div>
                  </div>
                )) : (
                  <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No projects currently assigned</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Stats & Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="card" style={{ padding: 24 }}>
            <h3 className="section-label" style={{ marginBottom: 20 }}>Performance Overview</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
              <div style={{ padding: 20, background: 'var(--bg-raised)', borderRadius: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Total Tasks</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)' }}>{member.task_stats?.total}</div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1, padding: 16, background: 'var(--bg-raised)', borderRadius: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Completed</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--green)' }}>{member.task_stats?.completed}</div>
                </div>
                <div style={{ flex: 1, padding: 16, background: 'var(--bg-raised)', borderRadius: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Pending</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--orange)' }}>{member.task_stats?.pending}</div>
                </div>
              </div>
            </div>
            
            <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
              <h4 style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>Quick Actions</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <a href={`mailto:${member.email}`} className="btn btn-ghost btn-sm" style={{ justifyContent: 'start', width: '100%' }}>
                  <Mail size={14} /> Send Email
                </a>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 24, background: 'var(--bg-raised)', border: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Shield size={20} color="var(--blue)" />
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Security & Role</h3>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 16px' }}>
              This user has <strong>{member.profile?.role?.replace(/_/g, ' ')}</strong> level access. They can manage tasks and projects assigned to their teams.
            </p>
            <button className="btn btn-primary btn-sm w-full" onClick={() => navigate('/admin/users')}>
              Manage Permissions
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
