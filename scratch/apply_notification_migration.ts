import { createClient } from '@libsql/client'
import * as fs from 'fs'
import * as path from 'path'

// Function to parse .env file
function parseEnv(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const env: Record<string, string> = {}
  content.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return
    const index = trimmed.indexOf('=')
    if (index === -1) return
    const key = trimmed.slice(0, index).trim()
    let val = trimmed.slice(index + 1).trim()
    // Remove quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    env[key] = val
  })
  return env
}

const envPath = path.resolve('c:/Users/Adminvc/Downloads/BD Assigner/.env')
const envVars = parseEnv(envPath)

const url = envVars.TURSO_DATABASE_URL
const authToken = envVars.TURSO_AUTH_TOKEN

if (!url || !authToken) {
  console.error("❌ Turso credentials not found in .env")
  process.exit(1)
}

console.log(`Connecting to Turso Database: ${url}`)
const client = createClient({ url, authToken })

async function run() {
  try {
    const ddl = `
      CREATE TABLE IF NOT EXISTS "Notification" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "displayName" TEXT NOT NULL,
        "leadsCount" INTEGER NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
      );
    `
    console.log("Applying migration: CREATE TABLE Notification...")
    await client.execute(ddl)
    console.log("✅ Migration applied successfully on Turso remote database!")
  } catch (error: any) {
    console.error("❌ Error executing migration:", error)
  } finally {
    client.close()
  }
}

run()
