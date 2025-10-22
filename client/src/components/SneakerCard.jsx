import React from 'react'
import { formatPrice } from '../utilities/format.js'

const placeholder = 'https://via.placeholder.com/260x160?text=Sneaker'

export default function SneakerCard({ sneaker, onEdit, onDelete }) {
  // sneaker: { id, name, base_price, total_price, features }
  const img = (sneaker.features && sneaker.features.color && sneaker.features.color.image) || placeholder
  const color = sneaker.features?.color?.name || sneaker.features?.color || 'Unknown'
  const material = sneaker.features?.material?.name || sneaker.features?.material || 'Mix'
  const tags = [color, material]

  return (
    <div className="sneaker-card">
      <div className="sneaker-preview">
        <img className="sneaker-img" src={img} alt={sneaker.name} />
      </div>

      <div className="sneaker-meta">
        <div>
          <div className="sneaker-name">{sneaker.name}</div>
          <div className="small">{sneaker.id ? `#${sneaker.id}` : ''}</div>
        </div>
        <div className="sneaker-price">{formatPrice(sneaker.total_price ?? sneaker.base_price)}</div>
      </div>

      <div className="tags" style={{marginTop:6}}>
        {tags.map((t,i)=> <div className="tag" key={i}>{t}</div>)}
      </div>

      <div style={{display:'flex',gap:8,marginTop:10}}>
        <button className="button ghost" onClick={()=>onEdit && onEdit(sneaker)}>Edit</button>
        <button className="button primary" onClick={()=>onDelete && onDelete(sneaker.id)}>Delete</button>
      </div>
    </div>
  )
}
