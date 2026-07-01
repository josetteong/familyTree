# 家谱 — Chinese Family Tree

An interactive family tree application that computes precise **Chinese kinship terms** (汉字, pīnyīn, and English gloss) for any two people in the tree. Built with React, TypeScript, Express, and MySQL.

## Features

- **Kinship engine** — resolves blood, affinal, and in-law relationships up to great-great-grandparents, cousins, grandparents' siblings, and their spouses
- **Interactive canvas** — pan-and-zoom tree view with color-coded nodes (pink = female, green = male) and distinct line styles (solid = direct, dashed = married)
- **CRUD sidebar** — add a person by declaring their relationship to an existing member (child of, parent of, spouse of, sibling of); edit or delete any node
- **Result bar** — click any two people to see the Chinese term, pinyin, English translation, relationship path, and any assumptions made
- **Legend** — always-visible key for line types and node colors

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS v4, DaisyUI v5 (`jiapu` theme) |
| Backend | Express 5, Node.js (tsx / ESM) |
| Database | MySQL 8+ / MariaDB 10.3+ |

## Getting Started

### Prerequisites

- Node.js 18+
- MySQL 8+ or MariaDB 10.3+

### 1. Create the database

```bash
mysql -u <user> -p -e "CREATE DATABASE family_tree CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u <user> -p family_tree < schema.sql
```

`schema.sql` creates the `persons` table and seeds it with a sample multi-generation family.

### 2. Configure environment

```bash
cp .env.example .env   # or create .env manually
```

`.env` variables:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=family_tree
```

### 3. Install dependencies

```bash
npm install
```

### 4. Run in development

```bash
npm run dev
```

This starts the Express API on **port 3001** and the Vite dev server concurrently. Open the URL printed by Vite (usually `http://localhost:5173`).

### Build for production

```bash
npm run build
npm run preview
```

## Database Schema

```sql
persons (
  id          VARCHAR(100)  PRIMARY KEY,
  name        VARCHAR(255)  NOT NULL,
  gender      CHAR(1)       NOT NULL,   -- 'M' or 'F'
  birth_year  INT,
  birth_order INT,
  father_id   VARCHAR(100)  REFERENCES persons(id),
  mother_id   VARCHAR(100)  REFERENCES persons(id),
  spouse_id   VARCHAR(100)  REFERENCES persons(id)
)
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/persons` | Fetch all people |
| `POST` | `/api/persons` | Add a person with a relationship anchor |
| `PUT` | `/api/persons/:id` | Update name, gender, birth year, or links |
| `DELETE` | `/api/persons/:id` | Remove a person and clear all references |

## Kinship Engine

The relationship resolver lives in [src/lib/kinship.ts](src/lib/kinship.ts) and [src/lib/terms.ts](src/lib/terms.ts).

**Algorithm:**
1. Find the **lowest common ancestor (LCA)** between ego and target by BFS up both parent chains.
2. Classify by `(a, b)` — steps up from ego to LCA, steps down from LCA to target.
3. Apply Chinese-specific rules: paternal vs. maternal side, elder vs. younger sibling, 堂 (tang, paternal-uncle's children) vs. 表 (biao, cross-cousins).
4. If no blood LCA exists, try spouse-of-relative and in-law paths.

**Supported relationship categories:**

- Direct line: parents, grandparents, great-grandparents, great-great-grandparents, children, grandchildren
- Siblings: 哥哥/姐姐/弟弟/妹妹 (elder/younger brother/sister) with birth-year/order inference
- Aunts & uncles: 伯父/叔叔/姑姑/舅舅/姨 with spouse terms
- Cousins: 堂哥/堂弟/表哥/表弟 etc.
- Grandparents' siblings and their children
- Affinal (in-law) terms for all of the above
- Spouse's siblings and their children

When birth order is unknown, the engine makes a reasonable assumption and surfaces it in the UI.

## Project Structure

```
├── server.ts          # Express API
├── schema.sql         # DB schema + seed data
├── src/
│   ├── App.tsx
│   ├── hooks/
│   │   └── useFamilyTree.ts   # data fetching & state
│   ├── lib/
│   │   ├── kinship.ts         # FamilyTree class & resolver
│   │   ├── terms.ts           # Chinese term dictionary
│   │   ├── layout.ts          # tree layout algorithm
│   │   └── seed.ts            # client-side seed helper
│   └── components/
│       ├── Sidebar.tsx
│       ├── TreeCanvas.tsx
│       └── ResultBar.tsx
└── files/             # standalone JS prototypes (terms, kinship)
```
