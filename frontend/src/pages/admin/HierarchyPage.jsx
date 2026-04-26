import { useState, useEffect } from 'react'
import { Layout, TopBar } from '../../components/Layout'
import { projectApi, teamApi, internshipApi } from '../../api'
import { 
    Users, 
    GraduationCap, 
    ChevronRight, 
    Briefcase, 
    Search, 
    Network,
    ArrowDown,
    Zap,
    Map
} from 'lucide-react'

const ROLE_COLORS = {
    admin: { bg: '#ef4444', text: '#fff', label: 'Admin' },
    team_head: { bg: '#8b5cf6', text: '#fff', label: 'Team Head' },
    mentor: { bg: '#3b82f6', text: '#fff', label: 'Member' },
    team_member: { bg: '#3b82f6', text: '#fff', label: 'Member' },
    intern: { bg: '#f59e0b', text: '#fff', label: 'Intern' },
    unknown: { bg: '#64748b', text: '#fff', label: 'Staff' }
}

const ROLE_WEIGHTS = {
    admin: 100,
    team_head: 80,
    mentor: 50,
    team_member: 50,
    intern: 10,
    unknown: 0
}

const HierarchyPage = () => {
    const [projects, setProjects] = useState([])
    const [teams, setTeams] = useState([])
    const [interns, setInterns] = useState([])
    const [loading, setLoading] = useState(true)
    const [view, setView] = useState('projects') // 'projects' or 'mentorship'
    const [search, setSearch] = useState('')
    const [selectedTeam, setSelectedTeam] = useState(null)

    useEffect(() => {
        setLoading(true)
        Promise.all([
            projectApi.list(),
            teamApi.list(),
            internshipApi.interns()
        ]).then(([pr, tr, ir]) => {
            setProjects(pr.data.results || pr.data)
            const tData = tr.data.results || tr.data
            setTeams(tData)
            setInterns(ir.data.results || ir.data)
            if (tData.length > 0) setSelectedTeam(tData[0])
        }).finally(() => setLoading(false))
    }, [])

    const filteredTeams = teams.filter(t => {
        const matchesName = t.name.toLowerCase().includes(search.toLowerCase())
        const matchesMember = (t.members || []).some(m => 
            m.full_name?.toLowerCase().includes(search.toLowerCase())
        )
        return matchesName || matchesMember
    })
    const filteredInterns = interns.filter(i => {
        const name = i.user ? `${i.user.first_name} ${i.user.last_name}` : i.application?.name
        return name?.toLowerCase().includes(search.toLowerCase())
    })

    return (
        <Layout>
            <TopBar 
                title="Organizational Architecture" 
                subtitle="High-level visibility into company units and mentorship maps"
                actions={
                    <div style={{ display: 'flex', gap: 12 }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input 
                                className="input" 
                                placeholder="Find unit or person..." 
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{ width: 240, paddingLeft: 34, height: 36 }}
                            />
                        </div>
                        <div className="btn-group" style={{ background: 'var(--bg-raised)', padding: 3, borderRadius: 10, border: '1px solid var(--border)' }}>
                            <button 
                                className={`btn btn-sm ${view === 'projects' ? 'btn-primary' : 'btn-ghost'}`}
                                onClick={() => setView('projects')}
                                style={{ borderRadius: 8 }}
                            >
                                <Zap size={14} /> Projects
                            </button>
                            <button 
                                className={`btn btn-sm ${view === 'mentorship' ? 'btn-primary' : 'btn-ghost'}`}
                                onClick={() => setView('mentorship')}
                                style={{ borderRadius: 8 }}
                            >
                                <Map size={14} /> Mentorship
                            </button>
                        </div>
                    </div>
                }
            />
            
            <div className="page" style={{ padding: 0, height: 'calc(100vh - 64px)', overflow: 'hidden', display: 'flex' }}>
                {loading ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        Building architecture map...
                    </div>
                ) : view === 'projects' ? (
                    <>
                        {/* Project Sidebar */}
                        <div style={{ width: 300, borderRight: '1px solid var(--border)', background: 'var(--bg-surface)', overflowY: 'auto', padding: 20 }}>
                            <div className="section-label" style={{ marginBottom: 16 }}>Operational Teams</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {filteredTeams.map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => setSelectedTeam(t)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, border: '1px solid transparent',
                                            background: selectedTeam?.id === t.id ? 'var(--blue-muted)' : 'transparent',
                                            color: selectedTeam?.id === t.id ? 'var(--blue)' : 'var(--text-primary)',
                                            textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s',
                                            borderColor: selectedTeam?.id === t.id ? 'var(--blue)' : 'transparent'
                                        }}
                                    >
                                        <div style={{ width: 32, height: 32, borderRadius: 8, background: selectedTeam?.id === t.id ? 'var(--blue)' : 'var(--bg-raised)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: selectedTeam?.id === t.id ? '#fff' : 'var(--text-muted)' }}>
                                            <Network size={16} />
                                        </div>
                                        <div style={{ flex: 1, overflow: 'hidden' }}>
                                            <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.projects?.length || 0} projects</div>
                                        </div>
                                    </button>
                                ))}
                                {filteredTeams.length === 0 && (
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>No teams found</div>
                                )}
                            </div>
                        </div>

                        {/* Team & Project Detail View */}
                        <div style={{ flex: 1, background: 'var(--bg-base)', padding: 40, overflowY: 'auto' }}>
                            {selectedTeam ? (
                                <div style={{ maxWidth: 900, margin: '0 auto' }}>
                                    <div className="animate-in">
                                        <div style={{ textAlign: 'center', marginBottom: 40 }}>
                                            <div style={{ display: 'inline-flex', width: 64, height: 64, borderRadius: 20, background: 'var(--blue)', color: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 16, boxShadow: '0 10px 20px rgba(37, 99, 235, 0.2)' }}>
                                                <Network size={32} />
                                            </div>
                                            <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>{selectedTeam.name} Architecture</h2>
                                            <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
                                                <span className="badge badge-reviewed" style={{ padding: '4px 12px' }}>{selectedTeam.domain} Domain</span>
                                                <span className="badge badge-submitted" style={{ padding: '4px 12px' }}>{selectedTeam.projects?.length || 0} Active Projects</span>
                                            </div>
                                        </div>

                                        {/* Multilevel Tree Visualization */}
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, minWidth: 'fit-content' }}>
                                            
                                            {/* Level 0: Team Leadership (The Root) */}
                                            <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--purple)', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.1em' }}>Unit Command</div>
                                                <div style={{ display: 'flex', gap: 16, marginBottom: 40 }}>
                                                    {selectedTeam.head ? (
                                                        <div className="card glass" style={{ width: 240, padding: 14, border: '1px solid var(--purple)', boxShadow: 'var(--shadow-md)', textAlign: 'center' }}>
                                                            <div className="avatar" style={{ width: 40, height: 40, background: 'var(--purple)', color: '#fff', fontSize: 16, margin: '0 auto 10px' }}>{selectedTeam.head.full_name?.[0] || selectedTeam.head.first_name?.[0]}</div>
                                                            <div style={{ fontSize: 14, fontWeight: 800 }}>{selectedTeam.head.full_name || `${selectedTeam.head.first_name} ${selectedTeam.head.last_name}`}</div>
                                                            <div style={{ fontSize: 10, color: 'var(--purple)', fontWeight: 800, marginTop: 2 }}>UNIT HEAD</div>
                                                        </div>
                                                    ) : (
                                                        <div style={{ padding: '16px 32px', background: 'var(--bg-raised)', border: '1px dashed var(--border)', borderRadius: 12, fontSize: 13, color: 'var(--text-muted)' }}>
                                                            Position Vacant
                                                        </div>
                                                    )}
                                                </div>
                                                <div style={{ width: 2, height: 40, background: 'linear-gradient(to bottom, var(--purple), var(--border))' }} />
                                            </div>

                                            {/* Level 1: Projects & Their Assigned Teams */}
                                            <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', justifyContent: 'center', padding: '0 40px' }}>
                                                {(selectedTeam.projects || []).map(prj => (
                                                    <div key={prj.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 220 }}>
                                                        {/* Project Node */}
                                                        <div className="card" style={{ width: 220, padding: 16, border: '1px solid var(--blue)', background: 'var(--blue-muted)', textAlign: 'center', zIndex: 5 }}>
                                                            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--blue)', textTransform: 'uppercase', marginBottom: 4 }}>Mission</div>
                                                            <div style={{ fontSize: 15, fontWeight: 800 }}>{prj.name}</div>
                                                            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>Status: {prj.status}</div>
                                                        </div>
                                                        <div style={{ width: 2, height: 30, background: 'linear-gradient(to bottom, var(--blue), var(--border))' }} />
                                                        
                                                        {/* Members of this mission */}
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                                                            {(prj.members || []).map(m => {
                                                                const isHead = m.id === selectedTeam.head?.id
                                                                if (isHead) return null // Hide head in project sub-list as they're at the top
                                                                const roleCfg = ROLE_COLORS[m.role] || ROLE_COLORS.unknown
                                                                return (
                                                                    <div key={m.id} className="card-sm hover-lift" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#fff', border: '1px solid var(--border)' }}>
                                                                        <div className="avatar" style={{ width: 24, height: 24, background: roleCfg.bg, color: '#fff', fontSize: 10 }}>
                                                                            {m.full_name?.[0].toUpperCase()}
                                                                        </div>
                                                                        <div style={{ flex: 1 }}>
                                                                            <div style={{ fontSize: 12, fontWeight: 700 }}>{m.full_name}</div>
                                                                            <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700 }}>PROJECT ROLE</div>
                                                                        </div>
                                                                    </div>
                                                                )
                                                            })}
                                                            {(prj.members || []).length === 0 && (
                                                                <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', padding: 10, background: 'var(--bg-raised)', borderRadius: 8, border: '1px dashed var(--border)' }}>
                                                                    Resources Pending
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}

                                                {/* Global / Unassigned Unit Members */}
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 220 }}>
                                                    <div className="card" style={{ width: 220, padding: 16, border: '1px solid var(--green)', background: 'var(--green-muted)', textAlign: 'center', zIndex: 5 }}>
                                                        <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--green)', textTransform: 'uppercase', marginBottom: 4 }}>Shared Resources</div>
                                                        <div style={{ fontSize: 15, fontWeight: 800 }}>General Ops</div>
                                                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>Bench / Admin Support</div>
                                                    </div>
                                                    <div style={{ width: 2, height: 30, background: 'linear-gradient(to bottom, var(--green), var(--border))' }} />
                                                    
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                                                        {(selectedTeam.members || [])
                                                            .filter(m => m.id !== selectedTeam.head?.id) // Not head
                                                            .filter(m => !(selectedTeam.projects || []).some(p => (p.members || []).some(pm => pm.id === m.id))) // Not in any project
                                                            .map(m => {
                                                                const roleCfg = ROLE_COLORS[m.role] || ROLE_COLORS.unknown
                                                                return (
                                                                    <div key={m.id} className="card-sm hover-lift" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#fff', border: '1px solid var(--border)' }}>
                                                                        <div className="avatar" style={{ width: 24, height: 24, background: roleCfg.bg, color: '#fff', fontSize: 10 }}>
                                                                            {m.full_name?.[0].toUpperCase()}
                                                                        </div>
                                                                        <div style={{ flex: 1 }}>
                                                                            <div style={{ fontSize: 12, fontWeight: 700 }}>{m.full_name}</div>
                                                                            <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700 }}>UNIT MEMBER</div>
                                                                        </div>
                                                                    </div>
                                                                )
                                                            })
                                                        }
                                                        {!(selectedTeam.members || []).some(m => m.id !== selectedTeam.head?.id && !(selectedTeam.projects || []).some(p => (p.members || []).some(pm => pm.id === m.id))) && (
                                                             <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', padding: 10 }}>All units deployed</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                    Select an operational unit to visualize its architecture
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    /* Mentorship Map */
                    <div style={{ flex: 1, overflow: 'auto', padding: 40, background: 'var(--bg-base)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 32, maxWidth: 1400, margin: '0 auto' }}>
                             {Array.from(new Set(interns.map(i => i.mentor?.id).filter(Boolean))).map(mentorId => {
                                const mentor = interns.find(i => i.mentor?.id === mentorId).mentor
                                const mentorInterns = interns.filter(i => i.mentor?.id === mentorId)
                                const mentorRole = mentor.profile?.role || 'mentor'
                                const mentorCfg = ROLE_COLORS[mentorRole] || ROLE_COLORS.mentor
                                
                                return (
                                    <div key={mentorId} style={{ display: 'flex', flexDirection: 'column', gap: 16 }} className="animate-in">
                                        {/* Mentor Node */}
                                        <div className="card" style={{ padding: '16px 20px', border: `1px solid ${mentorCfg.bg}`, boxShadow: 'var(--shadow-md)', background: 'var(--bg-surface)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <div style={{ width: 44, height: 44, borderRadius: 12, background: mentorCfg.bg, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Users size={20} />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: 15, fontWeight: 800 }}>{mentor.first_name} {mentor.last_name}</div>
                                                    <div style={{ fontSize: 11, color: mentorCfg.bg, fontWeight: 800, textTransform: 'uppercase' }}>Architecture Lead & Mentor</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ paddingLeft: 40, display: 'flex', flexDirection: 'column', gap: 12, position: 'relative' }}>
                                            {/* Connecting lines */}
                                            <div style={{ position: 'absolute', left: 20, top: -16, bottom: 20, width: 2, background: 'linear-gradient(to bottom, var(--border), transparent)' }} />
                                            
                                            {mentorInterns.map(intern => (
                                                <div key={intern.id} style={{ position: 'relative' }}>
                                                    <div style={{ position: 'absolute', left: -20, top: 20, width: 20, height: 2, background: 'var(--border)' }} />
                                                    <a 
                                                        href={`/admin/interns/${intern.id}`}
                                                        className="card hover-lift"
                                                        style={{ 
                                                            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', textDecoration: 'none', 
                                                            borderLeft: `3px solid ${ROLE_COLORS.intern.bg}`, background: 'var(--bg-surface)' 
                                                        }}
                                                    >
                                                        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--bg-raised)', color: ROLE_COLORS.intern.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <GraduationCap size={16} />
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                                                                {intern.user ? `${intern.user.first_name} ${intern.user.last_name}` : intern.application?.name}
                                                            </div>
                                                            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>{intern.domain || 'Intern'}</div>
                                                        </div>
                                                        <ChevronRight size={14} color="var(--text-muted)" />
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}

                            {/* Unassigned Section */}
                            {interns.filter(i => !i.mentor).length > 0 && (
                                <div className="card" style={{ background: 'var(--bg-raised)', border: '1px dashed var(--border)', opacity: 0.8 }}>
                                    <div className="section-label" style={{ marginBottom: 12 }}>Unassigned Cadets</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                        {interns.filter(i => !i.mentor).map(intern => (
                                            <div key={intern.id} style={{ background: '#fff', padding: '6px 12px', borderRadius: 8, fontSize: 12, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--amber)' }} />
                                                {intern.user ? `${intern.user.first_name} ${intern.user.last_name}` : intern.application?.name}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    )
}

export default HierarchyPage
