// terms.js
// Chinese (Mandarin / Putonghua) kinship term dictionary.
//
// Each record is the ADDRESS term — what *you* call that person — together with
// pinyin, a plain-English gloss, and which side of the family it belongs to:
//
//   'direct'   直系  — your own line: parents, children
//   'paternal' 父系  — father's side (家);   carries 内 / no 外
//   'maternal' 外家  — mother's side;        usually marked with 外 / 表
//   'affinal'  姻亲  — relatives by marriage (spouses, in-laws)
//
// `alt` holds common regional / colloquial alternatives (e.g. northern 姥爷 for 外公).

export const TERMS = {
  // ── self ───────────────────────────────────────────────
  self:                     { zh: '我',     pinyin: 'wǒ',          en: 'me',                          side: 'direct' },

  // ── direct ascendants ─────────────────────────────────
  father:                   { zh: '爸爸',   pinyin: 'bàba',        en: 'father',                      side: 'direct',   alt: '父亲 fùqīn' },
  mother:                   { zh: '妈妈',   pinyin: 'māma',        en: 'mother',                      side: 'direct',   alt: '母亲 mǔqīn' },

  paternal_grandfather:     { zh: '爷爷',   pinyin: 'yéye',        en: "father's father",             side: 'paternal', alt: '祖父 zǔfù' },
  paternal_grandmother:     { zh: '奶奶',   pinyin: 'nǎinai',      en: "father's mother",             side: 'paternal', alt: '祖母 zǔmǔ' },
  maternal_grandfather:     { zh: '外公',   pinyin: 'wàigōng',     en: "mother's father",             side: 'maternal', alt: '姥爷 lǎoye / 外祖父' },
  maternal_grandmother:     { zh: '外婆',   pinyin: 'wàipó',       en: "mother's mother",             side: 'maternal', alt: '姥姥 lǎolao / 外祖母' },

  paternal_great_grandfather: { zh: '曾祖父', pinyin: 'zēngzǔfù',  en: "father's father's father",    side: 'paternal', alt: '太爷爷 tàiyéye' },
  paternal_great_grandmother: { zh: '曾祖母', pinyin: 'zēngzǔmǔ',  en: "father's father's mother",    side: 'paternal', alt: '太奶奶 tàinǎinai' },
  maternal_great_grandfather: { zh: '外曾祖父', pinyin: 'wàizēngzǔfù', en: "mother's grandfather",    side: 'maternal', alt: '太姥爷' },
  maternal_great_grandmother: { zh: '外曾祖母', pinyin: 'wàizēngzǔmǔ', en: "mother's grandmother",    side: 'maternal', alt: '太姥姥' },

  // ── parents' siblings ─────────────────────────────────
  father_older_brother:     { zh: '伯父',   pinyin: 'bófù',        en: "father's elder brother",      side: 'paternal', alt: '伯伯 bóbo' },
  father_younger_brother:   { zh: '叔叔',   pinyin: 'shūshu',      en: "father's younger brother",    side: 'paternal', alt: '叔父 shūfù' },
  father_sister:            { zh: '姑姑',   pinyin: 'gūgu',        en: "father's sister",             side: 'paternal', alt: '姑母 gūmǔ' },
  mother_brother:           { zh: '舅舅',   pinyin: 'jiùjiu',      en: "mother's brother",            side: 'maternal', alt: '舅父 jiùfù' },
  mother_sister:            { zh: '姨',     pinyin: 'yí',          en: "mother's sister",             side: 'maternal', alt: '阿姨 āyí / 姨妈 yímā' },

  // ── parents' siblings' spouses ────────────────────────
  father_older_brother_wife:   { zh: '伯母', pinyin: 'bómǔ',       en: "father's elder brother's wife",   side: 'affinal', alt: '大妈 dàmā' },
  father_younger_brother_wife: { zh: '婶婶', pinyin: 'shěnshen',   en: "father's younger brother's wife", side: 'affinal', alt: '婶母 shěnmǔ' },
  father_sister_husband:       { zh: '姑父', pinyin: 'gūfù',       en: "father's sister's husband",       side: 'affinal', alt: '姑丈 gūzhàng' },
  mother_brother_wife:         { zh: '舅妈', pinyin: 'jiùmā',      en: "mother's brother's wife",         side: 'affinal', alt: '舅母 jiùmǔ' },
  mother_sister_husband:       { zh: '姨父', pinyin: 'yífù',       en: "mother's sister's husband",       side: 'affinal', alt: '姨丈 yízhàng' },

  // ── own siblings ──────────────────────────────────────
  older_brother:            { zh: '哥哥',   pinyin: 'gēge',        en: 'elder brother',               side: 'direct' },
  younger_brother:          { zh: '弟弟',   pinyin: 'dìdi',        en: 'younger brother',             side: 'direct' },
  older_sister:             { zh: '姐姐',   pinyin: 'jiějie',      en: 'elder sister',                side: 'direct' },
  younger_sister:           { zh: '妹妹',   pinyin: 'mèimei',      en: 'younger sister',              side: 'direct' },

  // ── siblings' spouses ─────────────────────────────────
  older_brother_wife:       { zh: '嫂子',   pinyin: 'sǎozi',       en: "elder brother's wife",        side: 'affinal', alt: '嫂嫂' },
  younger_brother_wife:     { zh: '弟妹',   pinyin: 'dìmèi',       en: "younger brother's wife",      side: 'affinal', alt: '弟媳 dìxí' },
  older_sister_husband:     { zh: '姐夫',   pinyin: 'jiěfu',       en: "elder sister's husband",      side: 'affinal' },
  younger_sister_husband:   { zh: '妹夫',   pinyin: 'mèifu',       en: "younger sister's husband",    side: 'affinal', alt: '妹婿 mèixù' },

  // ── cousins (堂 = paternal same-surname line; 表 = all others) ──
  tang_older_male:          { zh: '堂哥',   pinyin: 'tánggē',      en: "father's brother's son (elder)",   side: 'paternal' },
  tang_younger_male:        { zh: '堂弟',   pinyin: 'tángdì',      en: "father's brother's son (younger)", side: 'paternal' },
  tang_older_female:        { zh: '堂姐',   pinyin: 'tángjiě',     en: "father's brother's daughter (elder)",   side: 'paternal' },
  tang_younger_female:      { zh: '堂妹',   pinyin: 'tángmèi',     en: "father's brother's daughter (younger)", side: 'paternal' },
  biao_older_male:          { zh: '表哥',   pinyin: 'biǎogē',      en: 'cousin (elder male, cross-line)',  side: 'maternal' },
  biao_younger_male:        { zh: '表弟',   pinyin: 'biǎodì',      en: 'cousin (younger male, cross-line)',side: 'maternal' },
  biao_older_female:        { zh: '表姐',   pinyin: 'biǎojiě',     en: 'cousin (elder female, cross-line)',side: 'maternal' },
  biao_younger_female:      { zh: '表妹',   pinyin: 'biǎomèi',     en: 'cousin (younger female, cross-line)', side: 'maternal' },

  // ── descendants ───────────────────────────────────────
  son:                      { zh: '儿子',   pinyin: 'érzi',        en: 'son',                         side: 'direct' },
  daughter:                 { zh: '女儿',   pinyin: "nǚ'ér",       en: 'daughter',                    side: 'direct' },
  grandson_via_son:         { zh: '孙子',   pinyin: 'sūnzi',       en: "son's son",                   side: 'paternal' },
  granddaughter_via_son:    { zh: '孙女',   pinyin: 'sūnnǚ',       en: "son's daughter",              side: 'paternal' },
  grandson_via_daughter:    { zh: '外孙',   pinyin: 'wàisūn',      en: "daughter's son",              side: 'maternal' },
  granddaughter_via_daughter:{ zh: '外孙女', pinyin: 'wàisūnnǚ',   en: "daughter's daughter",         side: 'maternal' },

  // ── siblings' children ────────────────────────────────
  brother_son:              { zh: '侄子',   pinyin: 'zhízi',       en: "brother's son",               side: 'paternal' },
  brother_daughter:         { zh: '侄女',   pinyin: 'zhínǚ',       en: "brother's daughter",          side: 'paternal' },
  sister_son:               { zh: '外甥',   pinyin: 'wàishēng',    en: "sister's son",                side: 'maternal' },
  sister_daughter:          { zh: '外甥女', pinyin: 'wàishēngnǚ',  en: "sister's daughter",           side: 'maternal' },

  // ── children's spouses ────────────────────────────────
  son_wife:                 { zh: '儿媳',   pinyin: 'érxí',        en: "son's wife",                  side: 'affinal', alt: '媳妇 xífù' },
  daughter_husband:         { zh: '女婿',   pinyin: 'nǚxù',        en: "daughter's husband",          side: 'affinal' },

  // ── spouse & their parents ────────────────────────────
  husband:                  { zh: '丈夫',   pinyin: 'zhàngfu',     en: 'husband',                     side: 'affinal', alt: '老公 lǎogōng' },
  wife:                     { zh: '妻子',   pinyin: 'qīzi',        en: 'wife',                        side: 'affinal', alt: '老婆 lǎopó' },
  wife_father:              { zh: '岳父',   pinyin: 'yuèfù',       en: "wife's father",               side: 'affinal', alt: '丈人 zhàngren' },
  wife_mother:              { zh: '岳母',   pinyin: 'yuèmǔ',       en: "wife's mother",               side: 'affinal', alt: '丈母娘 zhàngmuniáng' },
  husband_father:           { zh: '公公',   pinyin: 'gōnggong',    en: "husband's father",            side: 'affinal' },
  husband_mother:           { zh: '婆婆',   pinyin: 'pópo',        en: "husband's mother",            side: 'affinal' },
};

// Maps a blood-relative's term-key → the term-key for that relative's SPOUSE.
export const SPOUSE_OF = {
  father_older_brother:   'father_older_brother_wife',
  father_younger_brother: 'father_younger_brother_wife',
  father_sister:          'father_sister_husband',
  mother_brother:         'mother_brother_wife',
  mother_sister:          'mother_sister_husband',
  older_brother:          'older_brother_wife',
  younger_brother:        'younger_brother_wife',
  older_sister:           'older_sister_husband',
  younger_sister:         'younger_sister_husband',
  son:                    'son_wife',
  daughter:               'daughter_husband',
};

// Returns a fresh copy of a term record, tagged with its key. Throws on unknown key.
export function lookup(key) {
  const rec = TERMS[key];
  if (!rec) throw new Error(`No term for key "${key}"`);
  return { key, ...rec };
}
