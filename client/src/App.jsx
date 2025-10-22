import React, { useEffect, useState } from 'react'
import './styles/streetwear.css'
import SneakerCustomizer from './components/SneakerCustomizer.jsx'
import SneakerCard from './components/SneakerCard.jsx'
import { getAllSneakers, updateSneaker, deleteSneaker, getCreatedIds } from './services/sneakersAPI.js'
import { formatPrice } from './utilities/format.js'

export default function App() {
  const [sneakers, setSneakers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showMyCreations, setShowMyCreations] = useState(false)
  const [createdIds, setCreatedIds] = useState([])

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/sneakers')
      if (res.ok) {
        const data = await res.json()
        setSneakers(data)
      } else {
        // try to extract JSON error body, fall back to text
        let body = ''
        try { body = JSON.stringify(await res.json()) } catch (e) {
          try { body = await res.text() } catch (e2) { body = '(no response body)' }
        }
        setError(`Server ${res.status} ${res.statusText}: ${body}`)
      }
    } catch (err) {
      setError(err.message || 'Failed to load (network error)')
    } finally {
      setLoading(false)
    }
  }

  const loadCreated = async () => {
    try {
      const ids = await getCreatedIds()
      setCreatedIds((ids || []).map(Number))
    } catch (e) {
      setCreatedIds([])
    }
  }

  useEffect(()=>{ load() }, [])

  useEffect(()=>{ loadCreated() }, [])

  const handleCreated = (created) => {
    setSneakers(prev => [created, ...prev])
    loadCreated().catch(()=>{})
  }

  const handleEdit = async (sneaker) => {
    const newName = window.prompt('Edit sneaker name', sneaker.name)
    if (!newName || newName === sneaker.name) return
    try {
      const updated = await updateSneaker(sneaker.id, { name: newName })
      setSneakers(prev => prev.map(s => s.id === updated.id ? updated : s))
    } catch (err) {
      alert(err.message || 'Update failed')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this sneaker?')) return
    try {
      await deleteSneaker(id)
      setSneakers(prev => prev.filter(s => s.id !== id))
      loadCreated().catch(()=>{})
    } catch (err) {
      alert(err.message || 'Delete failed')
    }
  }

  const displayedSneakers = showMyCreations
    ? sneakers.filter(s => createdIds.includes(Number(s.id)))
    : sneakers

  return (
    <div className="app-container">
      <header className="header">
        <div className="brand">
          <div className="brand-logo">DS</div>
          <div>
            <div className="brand-title">DIY Delight — Streetwear Studio</div>
            <div className="small">Customize sneakers with a streetwear aesthetic</div>
          </div>
        </div>
        <div style={{textAlign:'right'}}>
          <div className="small">Collection: {sneakers.length} items</div>
          <div style={{display:'flex',gap:8,alignItems:'center',justifyContent:'flex-end'}}>
            <button
              className={`button ${showMyCreations ? 'primary' : 'ghost'}`}
              onClick={() => setShowMyCreations(prev => !prev)}
              aria-pressed={showMyCreations}
            >
              My Creations ({createdIds.length})
            </button>
            <div style={{fontWeight:800,fontSize:14}}>
              {sneakers.length ? formatPrice(sneakers.reduce((acc, s) => acc + ((s.total_price ?? s.base_price) || 0), 0)) : ''}
            </div>
          </div>
        </div>

      </header>

      <SneakerCustomizer onCreated={handleCreated} />

      {loading ? <div className="small">Loading...</div> : null}
      {error ? <div style={{color:'#ff6b6b'}} className="small">{error}</div> : null}

      <div className="grid" style={{marginTop:12}}>
        {displayedSneakers.map(s => (
          <SneakerCard key={s.id} sneaker={s} onEdit={handleEdit} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  )
}