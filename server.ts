import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host:     process.env.DB_HOST     ?? 'localhost',
  port:     Number(process.env.DB_PORT ?? 3306),
  user:     process.env.DB_USER     ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME     ?? 'family_tree',
  waitForConnections: true,
  connectionLimit: 10,
});

// Verify connection on startup
try {
  await pool.query('SELECT 1');
  console.log(`Connected to MySQL  →  ${process.env.DB_NAME ?? 'family_tree'}`);
} catch (e) {
  console.error('\n❌ Cannot connect to MySQL:', (e as Error).message);
  console.error('   Check your .env file (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME)\n');
  process.exit(1);
}

interface PersonRow {
  id: string; name: string; gender: string;
  birth_year: number | null; birth_order: number | null;
  father_id: string | null; mother_id: string | null; spouse_id: string | null;
}

const app = express();
app.use(cors());
app.use(express.json());

// GET all persons
app.get('/api/persons', async (_req, res) => {
  const [rows] = await pool.query<mysql.RowDataPacket[]>('SELECT * FROM persons');
  res.json(rows);
});

// POST new person
app.post('/api/persons', async (req, res) => {
  const { name, gender, birth_year, rel_type, rel_id } = req.body as {
    name: string; gender: 'M' | 'F'; birth_year?: number;
    rel_type: 'child_of' | 'parent_of' | 'spouse_of' | 'sibling_of';
    rel_id: string;
  };

  if (!name?.trim())
    return void res.status(400).json({ error: 'Enter a name.' });

  const [[existing]] = await pool.query<mysql.RowDataPacket[]>(
    'SELECT id FROM persons WHERE id = ?', [name]
  );
  if (existing)
    return void res.status(409).json({ error: `"${name}" already exists.` });

  // rel_id is required only when there are already people in the table
  const [[{ count }]] = await pool.query<mysql.RowDataPacket[]>('SELECT COUNT(*) AS count FROM persons');
  if (count > 0 && !rel_id)
    return void res.status(400).json({ error: 'Choose a person to link to.' });

  let ref: PersonRow | undefined;
  if (rel_id) {
    const [[row]] = await pool.query<mysql.RowDataPacket[]>(
      'SELECT * FROM persons WHERE id = ?', [rel_id]
    );
    if (!row) return void res.status(404).json({ error: `Person "${rel_id}" not found.` });
    ref = row as PersonRow;
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      'INSERT INTO persons (id, name, gender, birth_year) VALUES (?, ?, ?, ?)',
      [name, name, gender, birth_year ?? null]
    );

    if (ref && rel_type) {
      if (rel_type === 'child_of') {
        // Set both parents if the reference person has a spouse
        if (ref.gender === 'M') {
          await conn.query('UPDATE persons SET father_id = ? WHERE id = ?', [rel_id, name]);
          if (ref.spouse_id) await conn.query('UPDATE persons SET mother_id = ? WHERE id = ?', [ref.spouse_id, name]);
        } else {
          await conn.query('UPDATE persons SET mother_id = ? WHERE id = ?', [rel_id, name]);
          if (ref.spouse_id) await conn.query('UPDATE persons SET father_id = ? WHERE id = ?', [ref.spouse_id, name]);
        }
      } else if (rel_type === 'parent_of') {
        const col = gender === 'M' ? 'father_id' : 'mother_id';
        await conn.query(`UPDATE persons SET ${col} = ? WHERE id = ?`, [name, rel_id]);
      } else if (rel_type === 'spouse_of') {
        await conn.query('UPDATE persons SET spouse_id = ? WHERE id = ?', [rel_id, name]);
        await conn.query('UPDATE persons SET spouse_id = ? WHERE id = ?', [name, rel_id]);
      } else if (rel_type === 'sibling_of') {
        let fatherId = ref.father_id;
        let motherId = ref.mother_id;
        if (!fatherId && !motherId) {
          // No shared parent exists — create a hidden virtual connector node
          const vpId = `__vp__${rel_id}`;
          const [[vp]] = await conn.query<mysql.RowDataPacket[]>('SELECT id FROM persons WHERE id = ?', [vpId]);
          if (!vp) {
            await conn.query('INSERT INTO persons (id, name, gender) VALUES (?, ?, ?)', [vpId, vpId, 'M']);
            await conn.query('UPDATE persons SET father_id = ? WHERE id = ?', [vpId, rel_id]);
          } else {
            // Virtual parent already exists (another sibling was added before)
            const [[existingRef]] = await conn.query<mysql.RowDataPacket[]>('SELECT father_id FROM persons WHERE id = ?', [rel_id]);
            if (!(existingRef as PersonRow).father_id) {
              await conn.query('UPDATE persons SET father_id = ? WHERE id = ?', [vpId, rel_id]);
            }
          }
          fatherId = vpId;
        }
        await conn.query('UPDATE persons SET father_id = ?, mother_id = ? WHERE id = ?', [fatherId, motherId, name]);
      }
    }

    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
});

// PUT update person info + links
app.put('/api/persons/:id', async (req, res) => {
  const { id } = req.params;
  const { name, gender, birth_year, father_id, mother_id, spouse_id } = req.body as {
    name?: string; gender?: 'M' | 'F'; birth_year?: number | null;
    father_id?: string | null; mother_id?: string | null; spouse_id?: string | null;
  };

  const [[person]] = await pool.query<mysql.RowDataPacket[]>('SELECT * FROM persons WHERE id = ?', [id]);
  if (!person) return void res.status(404).json({ error: 'Person not found.' });
  const p = person as PersonRow;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    if (name !== undefined || gender !== undefined || birth_year !== undefined) {
      await conn.query(
        'UPDATE persons SET name = COALESCE(?, name), gender = COALESCE(?, gender), birth_year = ? WHERE id = ?',
        [name ?? null, gender ?? null, birth_year ?? null, id]
      );
    }

    if (father_id !== undefined)
      await conn.query('UPDATE persons SET father_id = ? WHERE id = ?', [father_id ?? null, id]);

    if (mother_id !== undefined)
      await conn.query('UPDATE persons SET mother_id = ? WHERE id = ?', [mother_id ?? null, id]);

    if (spouse_id !== undefined) {
      // Clear old spouse's back-link
      if (p.spouse_id && p.spouse_id !== spouse_id)
        await conn.query('UPDATE persons SET spouse_id = NULL WHERE id = ?', [p.spouse_id]);
      await conn.query('UPDATE persons SET spouse_id = ? WHERE id = ?', [spouse_id ?? null, id]);
      if (spouse_id) {
        // Clear the new spouse's current partner first
        const [[ns]] = await conn.query<mysql.RowDataPacket[]>('SELECT spouse_id FROM persons WHERE id = ?', [spouse_id]);
        const nsp = (ns as PersonRow | undefined)?.spouse_id;
        if (nsp && nsp !== id)
          await conn.query('UPDATE persons SET spouse_id = NULL WHERE id = ?', [nsp]);
        await conn.query('UPDATE persons SET spouse_id = ? WHERE id = ?', [id, spouse_id]);
      }
    }

    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
});

// DELETE person
app.delete('/api/persons/:id', async (req, res) => {
  const { id } = req.params;

  const [[person]] = await pool.query<mysql.RowDataPacket[]>('SELECT id FROM persons WHERE id = ?', [id]);
  if (!person) return void res.status(404).json({ error: `Person "${id}" not found.` });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('UPDATE persons SET father_id = NULL WHERE father_id = ?', [id]);
    await conn.query('UPDATE persons SET mother_id = NULL WHERE mother_id = ?', [id]);
    await conn.query('UPDATE persons SET spouse_id = NULL WHERE spouse_id = ?', [id]);
    await conn.query('DELETE FROM persons WHERE id = ?', [id]);
    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
});

app.listen(3001, () => console.log('API  →  http://localhost:3001'));
