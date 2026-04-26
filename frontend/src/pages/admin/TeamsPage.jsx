import { useState, useEffect } from 'react'
import { Layout, TopBar } from '../../components/Layout'
import { Modal } from '../../components/Modal'
import { toast } from '../../components/Toast'
import { teamApi, authApi } from '../../api'

export const TeamsPage = () => {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [createModal, setCreateModal] = useState(false)
  const [headModal, setHeadModal] = useState(null)
  const [memberModal, setMemberModal] = useState(null)
  const [users, setUsers] = useState([])
  const [form, setForm] = useState({ name: '', domain: '', description: '' })
  const [selectedUser, setSelectedUser] = useState('')
  const [expanded, setExpanded] = useState(null)
  const [acting, setActing] = useState(false)

  const load = () => {
    setLoading(true)
    teamApi.list().then(r => setTeams(r.data.results || r.data)).finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    authApi.users().then(r => setUsers(r.data.results || r.data))
  }, [])

  const createTeam = async (e) => {
    e.preventDefault()
    setActing(true)
    try {
      await teamApi.create(form)
      toast.success('Team created!')
      setCreateModal(false)
      setForm({ name: '', domain: '', description: '' })
      load()
    } catch { toast.error('Failed') } finally { setActing(false) }
  }

  const assignHead = async () => {
    if (!selectedUser) return
    setActing(true)
    try {
      await teamApi.assignHead(headModal.id, selectedUser)
      toast.success('Team Head assigned!')
      setHeadModal(null)
      load()
    } catch { toast.error('Failed') } finally { setActing(false) }
  }

  const addMember = async () => {
    if (!selectedUser) return
    setActing(true)
    try {
      await teamApi.addMember(memberModal.id, selectedUser)
      toast.success('Member added!')
      setMemberModal(null)
      load()
    } catch (e) { toast.error(e.response?.data?.message || 'Failed') } finally { setActing(false) }
  }

  const removeMember = async (teamId, userId) => {
    if (!confirm('Remove this member from the team?')) return
    try {
      await teamApi.removeMember(teamId, userId)
      toast.success('Member removed!')
      load()
    } catch { toast.error('Failed to remove member') }
  }

  const removeTeam = async (id) => {
    if (!confirm('Delete this team?')) return
    try { await teamApi.delete(id); toast.success('Team deleted'); load() }
    catch { toast.error('Failed') }
  }

  return (
    <Layout>
      <TopBar title="Teams" subtitle={`${teams.length} teams active`}
        actions={<button className="btn btn-primary btn-sm" onClick={() => setCreateModal(true)}>+ Create Team</button>} />
      <div className="page slide-up">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {loading ? <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 40 }}>Loading teams...</div> :
          teams.length === 0 ? <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 40 }}>No teams yet.</div> :
          teams.map(team => (
            <div key={team.id} className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--blue-muted)', color: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800 }}>
                    {team.name[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{team.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{team.domain} · {team.member_count} members</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  {team.head ? (
                    <span className="badge badge-reviewed" style={{ padding: '4px 12px' }}>
                      Head: {team.head.first_name} {team.head.last_name}
                    </span>
                  ) : (
                    <span className="badge badge-pending">No Head Assigned</span>
                  )}
                  <button className="btn btn-ghost btn-sm" onClick={() => { setHeadModal(team); setSelectedUser('') }}>Assign Head</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setMemberModal(team); setSelectedUser('') }}>+ Add Member</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setExpanded(expanded === team.id ? null : team.id)}>
                    {expanded === team.id ? 'Hide' : 'Show Members'}
                  </button>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)', borderColor: 'var(--red-muted)' }} onClick={() => removeTeam(team.id)}>Delete</button>
                </div>
              </div>

              {expanded === team.id && team.members?.length > 0 && (
                <div style={{ marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                  <div className="section-label">Team Members</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                    {team.members.map(m => (
                      <div key={m.id} className="card card-sm" style={{ padding: '12px 14px', background: 'var(--bg-raised)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{m.full_name}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.role?.replace(/_/g, ' ')}</div>
                        </div>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)', padding: '0 8px', height: 26, fontSize: 11 }} onClick={() => removeMember(team.id, m.id)}>Remove</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Create Team Modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Create Team">
        <form onSubmit={createTeam} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Team Name *</label>
            <input className="input" placeholder="e.g. Frontend Engineering" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Domain *</label>
            <input className="input" placeholder="e.g. Technology" value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value }))} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Description</label>
            <textarea className="input" rows={3} placeholder="What is this team's focus?" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setCreateModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={acting}>Create Team</button>
          </div>
        </form>
      </Modal>

      {/* Assign Head Modal */}
      <Modal open={!!headModal} onClose={() => setHeadModal(null)} title={`Assign Head to ${headModal?.name}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <label style={{ fontSize: 13, color: 'var(--text-muted)' }}>Any platform member can be assigned as a Team Head.</label>
          <select className="input" value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
            <option value="">Select member...</option>
            {users.filter(u => u.profile?.role !== 'intern').map(u => {
                const label = u.profile?.role === 'mentor' || u.profile?.role === 'team_member' ? 'Member' : u.profile?.role
                return <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({label})</option>
            })}
          </select>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => setHeadModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={assignHead} disabled={acting || !selectedUser}>Assign as Team Head</button>
          </div>
        </div>
      </Modal>

      {/* Add Member Modal */}
      <Modal open={!!memberModal} onClose={() => setMemberModal(null)} title={`Add Member to ${memberModal?.name}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <select className="input" value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
            <option value="">Select member...</option>
            {users.filter(u => u.profile?.role !== 'intern').map(u => {
                const label = u.profile?.role === 'mentor' || u.profile?.role === 'team_member' ? 'Member' : u.profile?.role
                return <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({label})</option>
            })}
          </select>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => setMemberModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={addMember} disabled={acting || !selectedUser}>Add to Team</button>
          </div>
        </div>
      </Modal>
    </Layout>
  )
}
