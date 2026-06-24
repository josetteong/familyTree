import { FamilyTree } from './kinship';

export function seedTree(tree: FamilyTree): void {
  const P = (id: string, g: 'M' | 'F', o: Record<string, unknown> = {}) =>
    tree.addPerson({ id, name: id, gender: g, ...o } as Parameters<FamilyTree['addPerson']>[0]);

  P('PGF', 'M', { birthYear: 1930 }); P('PGM', 'F', { birthYear: 1933 }); tree.setSpouse('PGF', 'PGM');
  P('Bo',  'M', { birthOrder: 1, birthYear: 1958 });
  P('Dad', 'M', { birthOrder: 2, birthYear: 1962 });
  P('Shu', 'M', { birthOrder: 3, birthYear: 1966 });
  P('Gu',  'F', { birthOrder: 4, birthYear: 1969 });
  for (const c of ['Bo', 'Dad', 'Shu', 'Gu']) tree.setParents(c, { fatherId: 'PGF', motherId: 'PGM' });
  P('BoWife',  'F'); tree.setSpouse('Bo', 'BoWife');
  P('ShuWife', 'F'); tree.setSpouse('Shu', 'ShuWife');
  P('GuHus',   'M'); tree.setSpouse('Gu', 'GuHus');

  P('MGF', 'M', { birthYear: 1928 }); P('MGM', 'F', { birthYear: 1931 }); tree.setSpouse('MGF', 'MGM');
  P('Mom', 'F', { birthYear: 1964 });
  P('Jiu', 'M', { birthYear: 1960 });
  P('Yi',  'F', { birthYear: 1968 });
  for (const c of ['Mom', 'Jiu', 'Yi']) tree.setParents(c, { fatherId: 'MGF', motherId: 'MGM' });
  P('JiuWife', 'F'); tree.setSpouse('Jiu', 'JiuWife');
  P('YiHus',   'M'); tree.setSpouse('Yi', 'YiHus');

  P('Me',   'M', { birthYear: 1990 });
  P('OBro', 'M', { birthYear: 1988 });
  P('YSis', 'F', { birthYear: 1994 });
  for (const c of ['Me', 'OBro', 'YSis']) tree.setParents(c, { fatherId: 'Dad', motherId: 'Mom' });
  P('OBroWife', 'F'); tree.setSpouse('OBro', 'OBroWife');
  P('YSisHus',  'M'); tree.setSpouse('YSis', 'YSisHus');

  P('TangGe', 'M', { birthYear: 1985 }); tree.setParents('TangGe', { fatherId: 'Bo', motherId: 'BoWife' });
  P('GuSon',  'M', { birthYear: 1992 }); tree.setParents('GuSon',  { fatherId: 'GuHus', motherId: 'Gu' });
  P('JiuDau', 'F', { birthYear: 1989 }); tree.setParents('JiuDau', { fatherId: 'Jiu', motherId: 'JiuWife' });

  P('Wife', 'F'); tree.setSpouse('Me', 'Wife');
  P('WifeDad', 'M'); P('WifeMom', 'F'); tree.setSpouse('WifeDad', 'WifeMom');
  tree.setParents('Wife', { fatherId: 'WifeDad', motherId: 'WifeMom' });

  P('Son', 'M'); P('Dau', 'F');
  for (const c of ['Son', 'Dau']) tree.setParents(c, { fatherId: 'Me', motherId: 'Wife' });
  P('SonSon', 'M'); tree.setParents('SonSon', { fatherId: 'Son' });
  P('DauSon', 'M'); tree.setParents('DauSon', { motherId: 'Dau' });
  P('OBroSon', 'M'); tree.setParents('OBroSon', { fatherId: 'OBro', motherId: 'OBroWife' });
  P('YSisSon', 'M'); tree.setParents('YSisSon', { fatherId: 'YSisHus', motherId: 'YSis' });
}
