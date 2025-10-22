export const API_BASE = '/api/sneakers'

export const getAllSneakers = async () => {
  const res = await fetch(API_BASE)
  if (!res.ok) throw new Error('Failed to load sneakers')
  return res.json()
}

export const getSneaker = async (id) => {
  const res = await fetch(`${API_BASE}/${id}`)
  if (!res.ok) throw new Error('Failed to load sneaker')
  return res.json()
}

export const createSneaker = async (payload) => {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) {
    const err = await res.json().catch(()=>({error:'create failed'}))
    throw new Error(err.error || 'Create failed')
  }
  return res.json()
}

export const updateSneaker = async (id, payload) => {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) {
    const err = await res.json().catch(()=>({error:'update failed'}))
    throw new Error(err.error || 'Update failed')
  }
  return res.json()
}

export const deleteSneaker = async (id) => {
  const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Delete failed')
  return res.json()
}

export const getCreatedIds = async () => {
  const res = await fetch(`${API_BASE}/created`)
  if (!res.ok) {
    const err = await res.json().catch(()=>({error:'failed'}))
    throw new Error(err.error || 'Failed to load created ids')
  }
  return res.json()
}
