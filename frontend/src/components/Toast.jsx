import { useState, useEffect } from 'react'

let toastId = 0
let listeners = []

const notify = (type, message, duration = 4000) => {
  const id = ++toastId
  listeners.forEach(fn => fn({ id, type, message }))
  setTimeout(() => listeners.forEach(fn => fn({ id, remove: true })), duration)
}

export const toast = {
  success: (msg) => notify('success', msg),
  error: (msg) => notify('error', msg),
  info: (msg) => notify('info', msg),
}

export const ToastContainer = () => {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    const handler = (t) => {
      if (t.remove) {
        setToasts(prev => prev.filter(x => x.id !== t.id))
      } else {
        setToasts(prev => [...prev, t])
      }
    }
    listeners.push(handler)
    return () => { listeners = listeners.filter(fn => fn !== handler) }
  }, [])

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span>{t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'i'}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}
