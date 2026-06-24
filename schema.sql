-- Family Tree Schema — MySQL 8+ / MariaDB 10.3+
--
-- Run this once against your database to create and seed the table:
--   mysql -u <user> -p <dbname> < schema.sql
--
-- spouse_id is a self-referencing FK. All rows are inserted with
-- spouse_id = NULL, then a second UPDATE pass sets the links.

CREATE TABLE IF NOT EXISTS persons (
  id          VARCHAR(100)  NOT NULL,
  name        VARCHAR(255)  NOT NULL,
  gender      CHAR(1)       NOT NULL,
  birth_year  INT           DEFAULT NULL,
  birth_order INT           DEFAULT NULL,
  father_id   VARCHAR(100)  DEFAULT NULL,
  mother_id   VARCHAR(100)  DEFAULT NULL,
  spouse_id   VARCHAR(100)  DEFAULT NULL,

  PRIMARY KEY (id),
  CONSTRAINT chk_gender CHECK (gender IN ('M','F')),
  CONSTRAINT fk_father  FOREIGN KEY (father_id) REFERENCES persons (id),
  CONSTRAINT fk_mother  FOREIGN KEY (mother_id) REFERENCES persons (id),
  CONSTRAINT fk_spouse  FOREIGN KEY (spouse_id) REFERENCES persons (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Inserts (parents before children; spouse_id filled in below) ─────────────

-- Generation 0 — paternal grandparents
INSERT INTO persons (id, name, gender, birth_year) VALUES
  ('PGF', 'PGF', 'M', 1930),
  ('PGM', 'PGM', 'F', 1933);

-- Generation 0 — maternal grandparents
INSERT INTO persons (id, name, gender, birth_year) VALUES
  ('MGF', 'MGF', 'M', 1928),
  ('MGM', 'MGM', 'F', 1931);

-- Generation 0 — wife's parents
INSERT INTO persons (id, name, gender) VALUES
  ('WifeDad', 'WifeDad', 'M'),
  ('WifeMom', 'WifeMom', 'F');

-- Generation 0 — married-in spouses (no parents recorded)
INSERT INTO persons (id, name, gender) VALUES
  ('BoWife',   'BoWife',   'F'),
  ('ShuWife',  'ShuWife',  'F'),
  ('GuHus',    'GuHus',    'M'),
  ('JiuWife',  'JiuWife',  'F'),
  ('YiHus',    'YiHus',    'M'),
  ('OBroWife', 'OBroWife', 'F'),
  ('YSisHus',  'YSisHus',  'M');

-- Generation 1 — Dad's siblings
INSERT INTO persons (id, name, gender, birth_year, birth_order, father_id, mother_id) VALUES
  ('Bo',  'Bo',  'M', 1958, 1, 'PGF', 'PGM'),
  ('Dad', 'Dad', 'M', 1962, 2, 'PGF', 'PGM'),
  ('Shu', 'Shu', 'M', 1966, 3, 'PGF', 'PGM'),
  ('Gu',  'Gu',  'F', 1969, 4, 'PGF', 'PGM');

-- Generation 1 — Mom's siblings
INSERT INTO persons (id, name, gender, birth_year, father_id, mother_id) VALUES
  ('Jiu', 'Jiu', 'M', 1960, 'MGF', 'MGM'),
  ('Mom', 'Mom', 'F', 1964, 'MGF', 'MGM'),
  ('Yi',  'Yi',  'F', 1968, 'MGF', 'MGM');

-- Generation 1 — Wife (has recorded parents)
INSERT INTO persons (id, name, gender, father_id, mother_id) VALUES
  ('Wife', 'Wife', 'F', 'WifeDad', 'WifeMom');

-- Generation 2 — Me and siblings
INSERT INTO persons (id, name, gender, birth_year, father_id, mother_id) VALUES
  ('OBro', 'OBro', 'M', 1988, 'Dad', 'Mom'),
  ('Me',   'Me',   'M', 1990, 'Dad', 'Mom'),
  ('YSis', 'YSis', 'F', 1994, 'Dad', 'Mom');

-- Generation 2 — cousins
INSERT INTO persons (id, name, gender, birth_year, father_id, mother_id) VALUES
  ('TangGe', 'TangGe', 'M', 1985, 'Bo',    'BoWife'),
  ('JiuDau', 'JiuDau', 'F', 1989, 'Jiu',   'JiuWife'),
  ('GuSon',  'GuSon',  'M', 1992, 'GuHus', 'Gu');

-- Generation 3 — Me's children
INSERT INTO persons (id, name, gender, father_id, mother_id) VALUES
  ('Son', 'Son', 'M', 'Me', 'Wife'),
  ('Dau', 'Dau', 'F', 'Me', 'Wife');

-- Generation 3 — siblings' children
INSERT INTO persons (id, name, gender, father_id, mother_id) VALUES
  ('OBroSon', 'OBroSon', 'M', 'OBro',    'OBroWife'),
  ('YSisSon', 'YSisSon', 'M', 'YSisHus', 'YSis');

-- Generation 4 — grandchildren
INSERT INTO persons (id, name, gender, father_id) VALUES
  ('SonSon', 'SonSon', 'M', 'Son');

INSERT INTO persons (id, name, gender, mother_id) VALUES
  ('DauSon', 'DauSon', 'M', 'Dau');

-- ── Spouse links ──────────────────────────────────────────────────────────────

UPDATE persons SET spouse_id = 'PGM'      WHERE id = 'PGF';
UPDATE persons SET spouse_id = 'PGF'      WHERE id = 'PGM';
UPDATE persons SET spouse_id = 'MGM'      WHERE id = 'MGF';
UPDATE persons SET spouse_id = 'MGF'      WHERE id = 'MGM';
UPDATE persons SET spouse_id = 'WifeMom'  WHERE id = 'WifeDad';
UPDATE persons SET spouse_id = 'WifeDad'  WHERE id = 'WifeMom';
UPDATE persons SET spouse_id = 'BoWife'   WHERE id = 'Bo';
UPDATE persons SET spouse_id = 'Bo'       WHERE id = 'BoWife';
UPDATE persons SET spouse_id = 'ShuWife'  WHERE id = 'Shu';
UPDATE persons SET spouse_id = 'Shu'      WHERE id = 'ShuWife';
UPDATE persons SET spouse_id = 'GuHus'    WHERE id = 'Gu';
UPDATE persons SET spouse_id = 'Gu'       WHERE id = 'GuHus';
UPDATE persons SET spouse_id = 'Mom'      WHERE id = 'Dad';
UPDATE persons SET spouse_id = 'Dad'      WHERE id = 'Mom';
UPDATE persons SET spouse_id = 'JiuWife'  WHERE id = 'Jiu';
UPDATE persons SET spouse_id = 'Jiu'      WHERE id = 'JiuWife';
UPDATE persons SET spouse_id = 'YiHus'    WHERE id = 'Yi';
UPDATE persons SET spouse_id = 'Yi'       WHERE id = 'YiHus';
UPDATE persons SET spouse_id = 'Wife'     WHERE id = 'Me';
UPDATE persons SET spouse_id = 'Me'       WHERE id = 'Wife';
UPDATE persons SET spouse_id = 'OBroWife' WHERE id = 'OBro';
UPDATE persons SET spouse_id = 'OBro'     WHERE id = 'OBroWife';
UPDATE persons SET spouse_id = 'YSisHus'  WHERE id = 'YSis';
UPDATE persons SET spouse_id = 'YSis'     WHERE id = 'YSisHus';
