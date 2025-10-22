import React, { useState, useEffect } from 'react'
import { createSneaker } from '../services/sneakersAPI.js'
import { formatPrice } from '../utilities/format.js'

const COLOR_OPTIONS = [
  { id: 'black', name: 'Jet Black', price: 0, sw:'#0b0b0b', image: 'https://i.imgur.com/9M6Kq1K.png' },
  { id: 'white', name: 'White/Neutral', price: 5, sw:'#f5f5f4', image: 'https://i.imgur.com/3Qz6h0B.png' },
  { id: 'neon', name: 'Neon', price: 15, sw:'#ff3b30', image: 'https://i.imgur.com/7q3cXzM.png' },
  { id: 'olive', name: 'Olive', price: 8, sw:'#6b8e23', image: 'https://i.imgur.com/4bQ7Y8z.png' }
]

const MATERIAL_OPTIONS = [
  { id: 'canvas', name: 'Canvas', price: 0 },
  { id: 'suede', name: 'Suede', price: 12 },
  { id: 'leather', name: 'Leather', price: 22 }
]

const SOLE_OPTIONS = [
  { id: 'standard', name: 'Standard', price: 0 },
  { id: 'platform', name: 'Platform', price: 18 },
  { id: 'vintage', name: 'Vintage', price: 10 }
]

export default function SneakerCustomizer({ onCreated }) {
  const [name, setName] = useState('Custom Street Sneaker')
  const [color, setColor] = useState(COLOR_OPTIONS[0])
  const [material, setMaterial] = useState(MATERIAL_OPTIONS[0])
  const [sole, setSole] = useState(SOLE_OPTIONS[0])
  const [basePrice, setBasePrice] = useState(80)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(()=>{ setError(null) }, [color, material, sole, name])

  const total = Number(basePrice || 0) + (color.price||0) + (material.price||0) + (sole.price||0)

  const handleSubmit = async (e) => {
    e?.preventDefault()
    setLoading(true)
    setError(null)
    const features = {
      color: { id: color.id, name: color.name, price: color.price, image: color.image },
      material: { id: material.id, name: material.name, price: material.price },
      sole: { id: sole.id, name: sole.name, price: sole.price },
    }
    try {
      const created = await createSneaker({ name, base_price: basePrice, features })
      onCreated && onCreated(created)
      setName('Custom Street Sneaker')
      setColor(COLOR_OPTIONS[0])
      setMaterial(MATERIAL_OPTIONS[0])
      setSole(SOLE_OPTIONS[0])
    } catch (err) {
      setError(err.message || 'Create failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="customizer" onSubmit={handleSubmit}>
      <div style={{flex:'1 1 320px'}}>
        <div style={{marginBottom:8}}>
          <label className="small">Name</label>
          <input value={name} onChange={e=>setName(e.target.value)} style={{width:'100%',padding:8,borderRadius:8,background:'transparent',border:'1px solid rgba(255,255,255,0.04)',color:'inherit'}}/>
        </div>

        <div className="option-group">
          <label className="small">Color</label>
          <div className="option-list">
            {COLOR_OPTIONS.map(c => (
              <div key={c.id}
                title={`${c.name} (+$${c.price})`}
                className={`color-swatch ${c.id===color.id ? 'selected':''}`}
                style={{background:c.sw}}
                onClick={()=>setColor(c)}
              />
            ))}
          </div>
        </div>

        <div className="option-group">
          <label className="small">Material</label>
          <div className="option-list">
            {MATERIAL_OPTIONS.map(m => (
              <button key={m.id} type="button" className={`button ${m.id===material.id ? 'primary':'ghost'}`} onClick={()=>setMaterial(m)}>
                {m.name} {m.price>0?`+${m.price}`:''}
              </button>
            ))}
          </div>
        </div>

        <div className="option-group">
          <label className="small">Sole</label>
          <div className="option-list">
            {SOLE_OPTIONS.map(s => (
              <button key={s.id} type="button" className={`button ${s.id===sole.id ? 'primary':'ghost'}`} onClick={()=>setSole(s)}>
                {s.name} {s.price>0?`+${s.price}`:''}
              </button>
            ))}
          </div>
        </div>

        <div style={{marginTop:10, display:'flex',gap:8,alignItems:'center'}}>
          <div style={{fontWeight:800,fontSize:18}}>{formatPrice(total)}</div>
          <button className="button primary" type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Sneaker'}</button>
        </div>

        {error && <div style={{color:'#ff6b6b',marginTop:8}} className="small">{error}</div>}
      </div>

      <div style={{width:260,display:'flex',flexDirection:'column',alignItems:'center',gap:8}}>
        <div style={{fontSize:13,color:'var(--muted)'}}>Preview</div>
        <div className="sneaker-preview" style={{width:220,height:180}}>
          <img className="sneaker-img" src={color.image} alt={`${color.name} preview`} />
        </div>
        <div style={{textAlign:'center'}} className="small">Color: {color.name} • Material: {material.name}</div>
      </div>
    </form>
  )
}
