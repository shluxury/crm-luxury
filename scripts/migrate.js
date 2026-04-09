// Script d'exécution des migrations SQL sur Supabase
const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

// Définir DATABASE_URL dans .env.local avant d'exécuter
const DB_URL = process.env.DATABASE_URL
if (!DB_URL) { console.error('❌ DATABASE_URL manquant dans .env.local'); process.exit(1) }

async function run() {
  const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } })

  try {
    await client.connect()
    console.log('✓ Connecté à Supabase')

    const migrationsDir = path.join(__dirname, '../supabase/migrations')
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort()

    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
      console.log(`→ Exécution de ${file}...`)
      await client.query(sql)
      console.log(`✓ ${file} appliqué`)
    }

    console.log('\n✅ Toutes les migrations appliquées avec succès')
  } catch (err) {
    console.error('❌ Erreur :', err.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

run()
