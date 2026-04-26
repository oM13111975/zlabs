import { useState, useEffect } from 'react'
import { Layout, TopBar } from '../../components/Layout'
import { RoleBadge } from '../../components/StatusBadge'
import { logApi } from '../../api'

export const ActivityLogsPage = () => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    logApi.list().then(r => setLogs(r.data.results || r.data)).finally(() => setLoading(false))
  }, [])

  const icons = {
    task_created: '📋', task_updated: '✏️', task_submitted: '📤',
    feedback_given: '💬', role_converted: '🔁', application_submitted: '📩',
    application_accepted: '✅', application_rejected: '❌', intern_ready: '🌟',
    team_created: '👥', project_created: '🗂', mentor_assigned: '👨‍🏫',
  }

  return (
    <Layout>
      <TopBar title="Activity Logs" subtitle="Platform-wide activity trail" />
      <div className="page">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#64748b', padding: 40 }}>Loading...</div>
          ) : logs.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#64748b', padding: 40 }}>No activity yet</div>
          ) : logs.map(log => (
            <div key={log.id} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '12px 16px', background: '#1e293b',
              borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)',
            }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{icons[log.action_type] || '📌'}</span>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 14, color: '#f1f5f9' }}>{log.description}</span>
                {log.team && <span style={{ marginLeft: 8, fontSize: 12, color: '#a78bfa' }}>· {log.team}</span>}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                {log.user && (
                  <div style={{ fontSize: 12, color: '#60a5fa' }}>{log.user.first_name} {log.user.last_name}</div>
                )}
                <div style={{ fontSize: 11, color: '#475569' }}>{new Date(log.timestamp).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}
