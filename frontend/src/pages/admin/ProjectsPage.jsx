import { useState, useEffect } from 'react'
import { Layout, TopBar } from '../../components/Layout'
import { StatusBadge } from '../../components/StatusBadge'
import { Modal } from '../../components/Modal'
import { toast } from '../../components/Toast'
import { projectApi, teamApi } from '../../api'
import { useAuth } from '../../contexts/AuthContext'

const ROLE_COLORS = {
  admin: 'var(--red)', mentor: 'var(--amber)', team_head: 'var(--purple)',
  team_member: 'var(--green)', intern: 'var(--blue)',
}

const STATUS_PROGRESS = { planning: 15, active: 60, on_hold: 40, completed: 100 }

const STATUS_COLORS = {
    planning: 'var(--amber)', active: 'var(--green)', on_hold: 'var(--text-muted)', completed: 'var(--blue)'
}

export const ProjectsPage = () => {
  const { role } = useAuth()
  const [projects, setProjects] = useState([])
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', team: '', status: 'planning', member_ids: [] })
  const [acting, setActing] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [activeTab, setActiveTab] = useState({})

  const load = () => {
    setLoading(true)
    projectApi.list().then(r => setProjects(r.data.results || r.data)).finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    teamApi.list().then(r => setTeams(r.data.results || r.data))
  }, [])

  const create = async (e) => {
    e.preventDefault()
    setActing(true)
    try {
      await projectApi.create(form)
      toast.success('Project created!')
      setModal(false)
      setForm({ name: '', description: '', team: '', status: 'planning', member_ids: [] })
      load()
    } catch { toast.error('Failed to create project') } finally { setActing(false) }
  }

  const editMembers = (project) => {
    // 1. Try to get ID directly
    let teamId = typeof project.team === 'object' ? project.team?.id : project.team;
    
    // 2. Fallback: If teamId is missing but we have team_name, try to find it in our teams list
    if (!teamId && project.team_name && teams.length > 0) {
        const found = teams.find(t => t.name === project.team_name);
        if (found) teamId = found.id;
    }

    setForm({
        ...project,
        team: teamId || '',
        member_ids: (project.members || []).map(m => m.id)
    })
    setModal(true)
  }

  const updateProject = async (e) => {
    e.preventDefault()
    setActing(true)
    try {
        // Prepare data - ensure team is sent as ID or null
        const payload = { 
            ...form, 
            team: form.team || null 
        }
        await projectApi.update(form.id, payload)
        toast.success('Project updated')
        setModal(false)
        setForm({ name: '', description: '', team: '', status: 'planning', member_ids: [] })
        load()
    } catch { toast.error('Failed to update') }
    finally { setActing(false) }
  }

  const deleteProject = async (id) => {
    if (!confirm('Delete this project?')) return
    try { await projectApi.delete(id); toast.success('Project deleted'); load() }
    catch { toast.error('Failed to delete') }
  }

  const updateStatus = async (id, status) => {
    try {
      await projectApi.update(id, { status })
      toast.success('Status updated')
      load()
    } catch { toast.error('Failed') }
  }

  const toggleExpand = (projectId, tab = 'members') => {
    if (expanded === projectId) {
      setExpanded(null)
    } else {
      setExpanded(projectId)
      setActiveTab(t => ({ ...t, [projectId]: tab }))
    }
  }

  const canManage = ['super_admin', 'admin', 'team_head'].includes(role)

  return (
    <Layout>
      <TopBar
        title="Projects"
        subtitle={`${projects.length} working projects`}
        actions={canManage && <button className="btn btn-primary btn-sm" onClick={() => setModal(true)}>+ New Project</button>}
      />
      <div className="page slide-up">
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 60 }}>Loading projects...</div>
        ) : projects.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🗂</div>
            <p>No projects yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {projects.map(project => {
              const isExpanded = expanded === project.id
              const tab = activeTab[project.id] || 'members'
              const pct = STATUS_PROGRESS[project.status] || 0
              const statusColor = STATUS_COLORS[project.status] || 'var(--text-muted)'
              const taskCounts = project.task_counts || {}

              return (
                <div key={project.id} className="card" style={{ padding: 0, overflow: 'hidden', borderColor: isExpanded ? 'var(--blue)' : 'var(--border)' }}>
                  {/* Project header */}
                  <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }} onClick={() => toggleExpand(project.id)}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--bg-raised)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                      {project.status === 'completed' ? '✅' : '📁'}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{project.name}</h3>
                        <StatusBadge status={project.status} />
                        {project.team_name && <span className="tag">{project.team_name}</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ flex: 1, height: 6, background: 'var(--bg-raised)', borderRadius: 99, maxWidth: 120 }}>
                            <div style={{ height: '100%', background: statusColor, width: `${pct}%`, borderRadius: 99 }} />
                          </div>
                           <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{project.description || 'No description'}</span>
                      </div>
                    </div>

                    {/* Mini stats */}
                    <div style={{ display: 'flex', gap: 24, padding: '0 16px', borderRight: '1px solid var(--border)', borderLeft: '1px solid var(--border)' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 16, fontWeight: 700 }}>{taskCounts.total || 0}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tasks</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--green)' }}>{taskCounts.completed || 0}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Done</div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8, marginLeft: 16 }} onClick={e => e.stopPropagation()}>
                      {canManage && (
                        <>
                            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--blue)' }} onClick={() => editMembers(project)}>Manage</button>
                            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => deleteProject(project.id)}>Delete</button>
                        </>
                      )}
                      <div style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', color: 'var(--text-muted)', fontSize: 16 }}>▼</div>
                    </div>
                  </div>

                  {/* Expanded block */}
                  {isExpanded && (
                    <div style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-base)' }}>
                      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                        {[
                          { key: 'members', label: 'Team Members' },
                          { key: 'tasks', label: 'Tasks' },
                        ].map(t => (
                          <button
                            key={t.key}
                            onClick={() => setActiveTab(prev => ({ ...prev, [project.id]: t.key }))}
                            style={{
                              padding: '12px 24px', background: 'none', border: 'none',
                              borderBottom: `2px solid ${tab === t.key ? 'var(--blue)' : 'transparent'}`,
                              color: tab === t.key ? 'var(--blue)' : 'var(--text-secondary)',
                              fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                            }}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>

                      {tab === 'members' ? (
                        <div style={{ padding: '24px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                            {(project.members || []).map(member => (
                              <div key={member.id} className="card card-sm" style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-surface)' }}>
                                <div className="avatar avatar-md" style={{ background: 'var(--bg-raised)', color: 'var(--text-secondary)' }}>
                                  {member.full_name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: 14 }}>{member.full_name}</div>
                                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{member.role?.replace(/_/g, ' ')}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                          {(!project.members || project.members.length === 0) && (
                            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: 13, background: 'var(--bg-raised)', borderRadius: 12, border: '1px dashed var(--border)' }}>
                                No members assigned to this project yet. 
                                {canManage && <div style={{ marginTop: 4, color: 'var(--blue)', fontWeight: 600, cursor: 'pointer' }} onClick={() => editMembers(project)}>Click "Manage" to distribute team members.</div>}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ padding: '0' }}>
                          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
                            <table>
                              <thead>
                                <tr>
                                  <th>Task Title</th>
                                  <th>Assigned To</th>
                                  <th>Status</th>
                                  <th>Deadline</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(project.task_list || []).map(task => (
                                  <tr key={task.id}>
                                    <td style={{ fontWeight: 600 }}>{task.title}</td>
                                    <td>{task.assigned_to_name}</td>
                                    <td><StatusBadge status={task.status} /></td>
                                    <td style={{ fontSize: 13 }}>{task.deadline ? new Date(task.deadline).toLocaleDateString() : '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Modal open={modal} onClose={() => { setModal(false); setForm({ name: '', description: '', team: '', status: 'planning', member_ids: [] }) }} title={form.id ? "Edit Project" : "New Project"}>
        <form onSubmit={form.id ? updateProject : create} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Project Name *</label>
            <input className="input" placeholder="e.g. Design System" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Description</label>
            <textarea className="input" rows={2} placeholder="Brief description..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Team Assignment</label>
              <select 
                className="input" 
                value={form.team || ''} 
                onChange={e => setForm(f => ({ ...f, team: e.target.value, member_ids: [] }))}
                disabled={!!form.id && !!form.team}
              >
                <option value="">None</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Status</label>
              <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {['planning', 'active', 'on_hold', 'completed'].map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
          </div>

          {/* Member Distribution */}
          {form.team && (
            <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Distribute Members to this Project</label>
                <div style={{ padding: 12, border: '1px solid var(--border)', borderRadius: 10, maxHeight: 180, overflowY: 'auto', background: 'var(--bg-raised)' }}>
                    {(() => {
                        const selectedTeam = teams.find(t => String(t.id) === String(form.team));
                        if (!selectedTeam) return <div style={{ textAlign: 'center', padding: 8, color: 'var(--text-muted)', fontSize: 12 }}>Finding team data...</div>;
                        if (!selectedTeam.members || selectedTeam.members.length === 0) return <div style={{ textAlign: 'center', padding: 8, color: 'var(--text-muted)', fontSize: 12 }}>No members found in this team.</div>;
                        
                        return selectedTeam.members.map(m => (
                            <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', cursor: 'pointer', fontSize: 13 }}>
                                <input
                                    type="checkbox"
                                    style={{ width: 16, height: 16, accentColor: 'var(--blue)' }}
                                    checked={form.member_ids?.includes(m.id)}
                                    onChange={e => {
                                        const currentIds = Array.isArray(form.member_ids) ? form.member_ids : [];
                                        const ids = e.target.checked
                                            ? [...currentIds, m.id]
                                            : currentIds.filter(id => id !== m.id);
                                        setForm(prev => ({ ...prev, member_ids: ids }));
                                    }}
                                />
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: 500 }}>{m.full_name}</span>
                                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{m.role?.replace(/_/g, ' ')}</span>
                                </div>
                            </label>
                        ));
                    })()}
                </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={acting}>{form.id ? 'Save Changes' : 'Create Project'}</button>
          </div>
        </form>
      </Modal>
    </Layout>
  )
}
