import { useState } from 'react'

export const FileUpload = ({ label, accept, maxMB = 5, onChange, error }) => {
  const [dragging, setDragging] = useState(false)
  const [fileName, setFileName] = useState('')

  const handleFile = (file) => {
    if (!file) return
    if (file.size > maxMB * 1024 * 1024) {
      alert(`File must be under ${maxMB}MB`)
      return
    }
    setFileName(file.name)
    onChange(file)
  }

  return (
    <div>
      {label && <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>{label}</label>}
      <div
        className={`file-drop ${dragging ? 'active' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
        onClick={() => document.getElementById('file-input-hidden').click()}
      >
        <input
          id="file-input-hidden"
          type="file"
          accept={accept}
          style={{ display: 'none' }}
          onChange={e => handleFile(e.target.files[0])}
        />
        {fileName ? (
          <div>
            <p style={{ color: '#60a5fa', fontWeight: 600, margin: 0 }}>📎 {fileName}</p>
            <p style={{ color: '#64748b', fontSize: 12, margin: '4px 0 0' }}>Click to change</p>
          </div>
        ) : (
          <div>
            <p style={{ color: '#64748b', margin: 0    }}>Drop file here or <span style={{ color: '#60a5fa' }}>browse</span></p>
            <p style={{ color: '#475569', fontSize: 12, margin: '4px 0 0' }}>Max {maxMB}MB · {accept}</p>
          </div>
        )}
      </div>
      {error && <p style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>{error}</p>}
    </div>
  )
}
