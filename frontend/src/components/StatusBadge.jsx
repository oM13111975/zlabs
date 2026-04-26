export const StatusBadge = ({ status }) => {
  const label = status?.replace(/_/g, ' ') || '—'
  return <span className={`badge badge-${status}`}>{label}</span>
}

export const RoleBadge = ({ role }) => {
  const labels = {
    super_admin: 'Super Admin',
    admin: 'Admin', 
    mentor: 'Member', 
    team_head: 'Team Head',
    team_member: 'Member', 
    intern: 'Intern',
  }
  return <span className={`role-badge role-${role}`}>{labels[role] || role}</span>
}
