import { FamilyTree } from './src/lib/kinship.js';

const t = new FamilyTree();
const P = (id, gender, opts = {}) => t.addPerson({ id, name: id, gender, ...opts });

// paternal grandparents
P('PGF', 'M'); P('PGM', 'F'); t.setSpouse('PGF', 'PGM');
// father's generation (birthOrder: lower = elder)
P('Bo', 'M', { birthOrder: 1, birthYear: 1958 });   // father's elder brother
P('Dad', 'M', { birthOrder: 2, birthYear: 1962 });
P('Shu', 'M', { birthOrder: 3, birthYear: 1966 });  // father's younger brother
P('Gu', 'F', { birthOrder: 4, birthYear: 1969 });   // father's sister
for (const c of ['Bo', 'Dad', 'Shu', 'Gu']) t.setParents(c, { fatherId: 'PGF', motherId: 'PGM' });
P('BoWife', 'F'); t.setSpouse('Bo', 'BoWife');
P('ShuWife', 'F'); t.setSpouse('Shu', 'ShuWife');
P('GuHus', 'M'); t.setSpouse('Gu', 'GuHus');

// maternal grandparents
P('MGF', 'M'); P('MGM', 'F'); t.setSpouse('MGF', 'MGM');
P('Mom', 'F', { birthYear: 1964 });
P('Jiu', 'M', { birthYear: 1960 });                 // mother's brother
P('Yi', 'F', { birthYear: 1968 });                  // mother's sister
for (const c of ['Mom', 'Jiu', 'Yi']) t.setParents(c, { fatherId: 'MGF', motherId: 'MGM' });
P('JiuWife', 'F'); t.setSpouse('Jiu', 'JiuWife');
P('YiHus', 'M'); t.setSpouse('Yi', 'YiHus');

// ego + siblings
P('Me', 'M', { birthYear: 1990 });
P('OBro', 'M', { birthYear: 1988 });
P('YSis', 'F', { birthYear: 1994 });
for (const c of ['Me', 'OBro', 'YSis']) t.setParents(c, { fatherId: 'Dad', motherId: 'Mom' });
P('OBroWife', 'F'); t.setSpouse('OBro', 'OBroWife');
P('YSisHus', 'M'); t.setSpouse('YSis', 'YSisHus');

// cousins
P('TangGe', 'M', { birthYear: 1985 }); t.setParents('TangGe', { fatherId: 'Bo', motherId: 'BoWife' }); // 堂哥
P('GuSon', 'M', { birthYear: 1992 }); t.setParents('GuSon', { fatherId: 'GuHus', motherId: 'Gu' });    // 表弟
P('JiuDau', 'F', { birthYear: 1989 }); t.setParents('JiuDau', { fatherId: 'Jiu', motherId: 'JiuWife' }); // 表姐

// ego's spouse, in-laws, children, grandchildren
P('Wife', 'F'); t.setSpouse('Me', 'Wife');
P('WifeDad', 'M'); P('WifeMom', 'F'); t.setSpouse('WifeDad', 'WifeMom');
t.setParents('Wife', { fatherId: 'WifeDad', motherId: 'WifeMom' });
P('Son', 'M'); P('Dau', 'F');
for (const c of ['Son', 'Dau']) t.setParents(c, { fatherId: 'Me', motherId: 'Wife' });
P('SonSon', 'M'); t.setParents('SonSon', { fatherId: 'Son' });     // 孙子
P('DauSon', 'M'); t.setParents('DauSon', { fatherId: null, motherId: 'Dau' }); // 外孙
// niece / nephew
P('OBroSon', 'M'); t.setParents('OBroSon', { fatherId: 'OBro', motherId: 'OBroWife' }); // 侄子
P('YSisSon', 'M'); t.setParents('YSisSon', { fatherId: 'YSisHus', motherId: 'YSis' });   // 外甥

const cases = [
  ['PGF', '爷爷'], ['PGM', '奶奶'], ['MGF', '外公'], ['MGM', '外婆'],
  ['Dad', '爸爸'], ['Mom', '妈妈'],
  ['Bo', '伯父'], ['Shu', '叔叔'], ['Gu', '姑姑'], ['Jiu', '舅舅'], ['Yi', '姨'],
  ['BoWife', '伯母'], ['ShuWife', '婶婶'], ['GuHus', '姑父'], ['JiuWife', '舅妈'], ['YiHus', '姨父'],
  ['OBro', '哥哥'], ['YSis', '妹妹'],
  ['OBroWife', '嫂子'], ['YSisHus', '妹夫'],
  ['TangGe', '堂哥'], ['GuSon', '表弟'], ['JiuDau', '表姐'],
  ['Wife', '妻子'], ['WifeDad', '岳父'], ['WifeMom', '岳母'],
  ['Son', '儿子'], ['Dau', '女儿'], ['SonSon', '孙子'], ['DauSon', '外孙'],
  ['OBroSon', '侄子'], ['YSisSon', '外甥'],
];

let pass = 0;
for (const [target, expect] of cases) {
  const r = t.getTerm('Me', target);
  const ok = r.zh === expect;
  if (ok) pass++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  Me → ${target.padEnd(9)} ${(r.zh ?? '—').padEnd(4)} ${(r.pinyin ?? '').padEnd(11)} ${r.path}${ok ? '' : `   ✗ expected ${expect}`}`);
}
console.log(`\n${pass}/${cases.length} passed`);
