import 'dotenv/config'
import { pool } from './database.js'

const createTablesSQL = `
  DROP TABLE IF EXISTS sneakers CASCADE;

  CREATE TABLE sneakers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    base_price DECIMAL(10, 2) DEFAULT 0,
    features JSONB DEFAULT '{}',
    total_price DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX idx_sneakers_name ON sneakers(name);
  CREATE INDEX idx_sneakers_created ON sneakers(created_at DESC);
`

const seed = async () => {
  try {
    console.log('🔄 Creating tables...')
    await pool.query(createTablesSQL)
    console.log('✅ Tables created successfully')

    console.log('🌱 Seeding sample data...')
    const sampleSneakers = [
      {
        name: 'Classic Street Runner',
        base_price: 85,
        features: JSON.stringify({
          color: { id: 'black', name: 'Jet Black', price: 0, image: 'https://i.imgur.com/9M6Kq1K.png' },
          material: { id: 'canvas', name: 'Canvas', price: 0 },
          sole: { id: 'standard', name: 'Standard', price: 0 }
        }),
        total_price: 85
      },
      {
        name: 'Premium Suede Edition',
        base_price: 120,
        features: JSON.stringify({
          color: { id: 'white', name: 'White/Neutral', price: 5, image: 'https://i.imgur.com/3Qz6h0B.png' },
          material: { id: 'suede', name: 'Suede', price: 12 },
          sole: { id: 'vintage', name: 'Vintage', price: 10 }
        }),
        total_price: 147
      }
    ]

    for (const sneaker of sampleSneakers) {
      await pool.query(
        'INSERT INTO sneakers (name, base_price, features, total_price) VALUES ($1, $2, $3, $4)',
        [sneaker.name, sneaker.base_price, sneaker.features, sneaker.total_price]
      )
    }

    console.log('✅ Sample data seeded successfully')
    await pool.end()
    process.exit(0)
  } catch (err) {
    console.error('❌ Error:', err.message)
    await pool.end()
    process.exit(1)
  }
}

seed()
