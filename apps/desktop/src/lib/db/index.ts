import Database from "@tauri-apps/plugin-sql";

let db: Database | null = null;

export async function getDb() {
  if (db) return db;
  db = await Database.load("sqlite:workspace.db");

  // Initialize tables
  await db.execute(`
    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      imageUrl TEXT,
      metadata JSON
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      avatarUrl TEXT,
      status TEXT
    );
  `);

  return db;
}

export async function cacheWorkspaces(workspaces: any[]) {
  const database = await getDb();
  for (const workspace of workspaces) {
    await database.execute(
      "INSERT OR REPLACE INTO workspaces (id, name, slug, imageUrl, metadata) VALUES ($1, $2, $3, $4, $5)",
      [workspace.id, workspace.name, workspace.slug, workspace.imageUrl, JSON.stringify(workspace.metadata || {})]
    );
  }
}

export async function getCachedWorkspaces() {
  const database = await getDb();
  return await database.select<any[]>("SELECT * FROM workspaces");
}

export async function cacheContacts(contacts: any[]) {
  const database = await getDb();
  for (const contact of contacts) {
    await database.execute(
      "INSERT OR REPLACE INTO contacts (id, name, email, avatarUrl, status) VALUES ($1, $2, $3, $4, $5)",
      [contact.id, contact.name, contact.email, contact.avatarUrl, contact.status]
    );
  }
}

export async function getCachedContacts() {
  const database = await getDb();
  return await database.select<any[]>("SELECT * FROM contacts");
}
