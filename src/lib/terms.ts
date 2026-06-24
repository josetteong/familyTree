export interface TermRecord {
  zh: string;
  pinyin: string;
  en: string;
  side: 'direct' | 'paternal' | 'maternal' | 'affinal';
  alt?: string;
}

export const TERMS: Record<string, TermRecord> = {
  self:                       { zh: '我',      pinyin: 'wǒ',            en: 'me',                              side: 'direct' },
  father:                     { zh: '爸爸',    pinyin: 'bàba',          en: 'father',                          side: 'direct',   alt: '父亲 fùqīn' },
  mother:                     { zh: '妈妈',    pinyin: 'māma',          en: 'mother',                          side: 'direct',   alt: '母亲 mǔqīn' },
  paternal_grandfather:       { zh: '爷爷',    pinyin: 'yéye',          en: "father's father",                 side: 'paternal', alt: '祖父 zǔfù' },
  paternal_grandmother:       { zh: '奶奶',    pinyin: 'nǎinai',        en: "father's mother",                 side: 'paternal', alt: '祖母 zǔmǔ' },
  maternal_grandfather:       { zh: '外公',    pinyin: 'wàigōng',       en: "mother's father",                 side: 'maternal', alt: '姥爷 lǎoye' },
  maternal_grandmother:       { zh: '外婆',    pinyin: 'wàipó',         en: "mother's mother",                 side: 'maternal', alt: '姥姥 lǎolao' },
  paternal_great_grandfather:      { zh: '曾祖父',   pinyin: 'zēngzǔfù',       en: "father's father's father",             side: 'paternal', alt: '太爷爷 tàiyéye' },
  paternal_great_grandmother:      { zh: '曾祖母',   pinyin: 'zēngzǔmǔ',       en: "father's father's mother",             side: 'paternal', alt: '太奶奶 tàinǎinai' },
  maternal_great_grandfather:      { zh: '外曾祖父', pinyin: 'wàizēngzǔfù',    en: "mother's grandfather",                 side: 'maternal', alt: '太姥爷' },
  maternal_great_grandmother:      { zh: '外曾祖母', pinyin: 'wàizēngzǔmǔ',    en: "mother's grandmother",                 side: 'maternal', alt: '太姥姥' },
  paternal_great_great_grandfather:{ zh: '高祖父',   pinyin: 'gāozǔfù',        en: "great-great-grandfather (paternal)",   side: 'paternal', alt: '太太爷爷' },
  paternal_great_great_grandmother:{ zh: '高祖母',   pinyin: 'gāozǔmǔ',        en: "great-great-grandmother (paternal)",   side: 'paternal', alt: '太太奶奶' },
  maternal_great_great_grandfather:{ zh: '外高祖父', pinyin: 'wàigāozǔfù',     en: "great-great-grandfather (maternal)",   side: 'maternal' },
  maternal_great_great_grandmother:{ zh: '外高祖母', pinyin: 'wàigāozǔmǔ',     en: "great-great-grandmother (maternal)",   side: 'maternal' },
  // ── grandparents' siblings ────────────────────────────
  paternal_grandfather_older_brother:  { zh: '伯祖父', pinyin: 'bózǔfù',  en: "father's father's elder brother",  side: 'paternal', alt: '伯公 bógōng' },
  paternal_grandfather_younger_brother:{ zh: '叔祖父', pinyin: 'shūzǔfù', en: "father's father's younger brother", side: 'paternal', alt: '叔公 shūgōng' },
  paternal_grandfather_sister:         { zh: '姑祖母', pinyin: 'gūzǔmǔ',  en: "father's father's sister",         side: 'paternal', alt: '姑婆 gūpó' },
  paternal_grandmother_brother:        { zh: '舅祖父', pinyin: 'jiùzǔfù', en: "father's mother's brother",        side: 'paternal', alt: '舅公 jiùgōng' },
  paternal_grandmother_sister:         { zh: '姨祖母', pinyin: 'yízǔmǔ',  en: "father's mother's sister",         side: 'paternal', alt: '姨婆 yípó' },
  maternal_grandfather_brother:        { zh: '舅公',   pinyin: 'jiùgōng', en: "mother's father's brother",        side: 'maternal', alt: '外叔祖父' },
  maternal_grandfather_sister:         { zh: '姑婆',   pinyin: 'gūpó',    en: "mother's father's sister",         side: 'maternal', alt: '外姑祖母' },
  maternal_grandmother_brother:        { zh: '舅公',   pinyin: 'jiùgōng', en: "mother's mother's brother",        side: 'maternal', alt: '外舅祖父' },
  maternal_grandmother_sister:         { zh: '姨婆',   pinyin: 'yípó',    en: "mother's mother's sister",         side: 'maternal', alt: '外姨婆' },

  father_older_brother:       { zh: '伯父',    pinyin: 'bófù',          en: "father's elder brother",          side: 'paternal', alt: '伯伯 bóbo' },
  father_younger_brother:     { zh: '叔叔',    pinyin: 'shūshu',        en: "father's younger brother",        side: 'paternal', alt: '叔父 shūfù' },
  father_sister:              { zh: '姑姑',    pinyin: 'gūgu',          en: "father's sister",                 side: 'paternal', alt: '姑母 gūmǔ' },
  mother_brother:             { zh: '舅舅',    pinyin: 'jiùjiu',        en: "mother's brother",                side: 'maternal', alt: '舅父 jiùfù' },
  mother_sister:              { zh: '姨',      pinyin: 'yí',            en: "mother's sister",                 side: 'maternal', alt: '阿姨 āyí' },
  father_older_brother_wife:  { zh: '伯母',    pinyin: 'bómǔ',          en: "father's elder brother's wife",   side: 'affinal',  alt: '大妈 dàmā' },
  father_younger_brother_wife:{ zh: '婶婶',    pinyin: 'shěnshen',      en: "father's younger brother's wife", side: 'affinal',  alt: '婶母 shěnmǔ' },
  father_sister_husband:      { zh: '姑父',    pinyin: 'gūfù',          en: "father's sister's husband",       side: 'affinal',  alt: '姑丈 gūzhàng' },
  mother_brother_wife:        { zh: '舅妈',    pinyin: 'jiùmā',         en: "mother's brother's wife",         side: 'affinal',  alt: '舅母 jiùmǔ' },
  mother_sister_husband:      { zh: '姨父',    pinyin: 'yífù',          en: "mother's sister's husband",       side: 'affinal',  alt: '姨丈 yízhàng' },
  older_brother:              { zh: '哥哥',    pinyin: 'gēge',          en: 'elder brother',                   side: 'direct' },
  younger_brother:            { zh: '弟弟',    pinyin: 'dìdi',          en: 'younger brother',                 side: 'direct' },
  older_sister:               { zh: '姐姐',    pinyin: 'jiějie',        en: 'elder sister',                    side: 'direct' },
  younger_sister:             { zh: '妹妹',    pinyin: 'mèimei',        en: 'younger sister',                  side: 'direct' },
  older_brother_wife:         { zh: '嫂子',    pinyin: 'sǎozi',         en: "elder brother's wife",            side: 'affinal', alt: '嫂嫂' },
  younger_brother_wife:       { zh: '弟妹',    pinyin: 'dìmèi',         en: "younger brother's wife",          side: 'affinal', alt: '弟媳 dìxí' },
  older_sister_husband:       { zh: '姐夫',    pinyin: 'jiěfu',         en: "elder sister's husband",          side: 'affinal' },
  younger_sister_husband:     { zh: '妹夫',    pinyin: 'mèifu',         en: "younger sister's husband",        side: 'affinal', alt: '妹婿 mèixù' },
  tang_older_male:            { zh: '堂哥',    pinyin: 'tánggē',        en: "father's brother's son (elder)",  side: 'paternal' },
  tang_younger_male:          { zh: '堂弟',    pinyin: 'tángdì',        en: "father's brother's son (younger)",side: 'paternal' },
  tang_older_female:          { zh: '堂姐',    pinyin: 'tángjiě',       en: "father's brother's daughter (elder)",   side: 'paternal' },
  tang_younger_female:        { zh: '堂妹',    pinyin: 'tángmèi',       en: "father's brother's daughter (younger)", side: 'paternal' },
  biao_older_male:            { zh: '表哥',    pinyin: 'biǎogē',        en: 'cousin (elder male)',             side: 'maternal' },
  biao_younger_male:          { zh: '表弟',    pinyin: 'biǎodì',        en: 'cousin (younger male)',           side: 'maternal' },
  biao_older_female:          { zh: '表姐',    pinyin: 'biǎojiě',       en: 'cousin (elder female)',           side: 'maternal' },
  biao_younger_female:        { zh: '表妹',    pinyin: 'biǎomèi',       en: 'cousin (younger female)',         side: 'maternal' },
  son:                        { zh: '儿子',    pinyin: 'érzi',          en: 'son',                             side: 'direct' },
  daughter:                   { zh: '女儿',    pinyin: "nǚ'ér",         en: 'daughter',                        side: 'direct' },
  grandson_via_son:           { zh: '孙子',    pinyin: 'sūnzi',         en: "son's son",                       side: 'paternal' },
  granddaughter_via_son:      { zh: '孙女',    pinyin: 'sūnnǚ',         en: "son's daughter",                  side: 'paternal' },
  grandson_via_daughter:      { zh: '外孙',    pinyin: 'wàisūn',        en: "daughter's son",                  side: 'maternal' },
  granddaughter_via_daughter: { zh: '外孙女',  pinyin: 'wàisūnnǚ',      en: "daughter's daughter",             side: 'maternal' },
  brother_son:                { zh: '侄子',    pinyin: 'zhízi',         en: "brother's son",                   side: 'paternal' },
  brother_daughter:           { zh: '侄女',    pinyin: 'zhínǚ',         en: "brother's daughter",              side: 'paternal' },
  sister_son:                 { zh: '外甥',    pinyin: 'wàishēng',      en: "sister's son",                    side: 'maternal' },
  sister_daughter:            { zh: '外甥女',  pinyin: 'wàishēngnǚ',    en: "sister's daughter",               side: 'maternal' },
  son_wife:                   { zh: '儿媳',    pinyin: 'érxí',          en: "son's wife",                      side: 'affinal', alt: '媳妇 xífù' },
  daughter_husband:           { zh: '女婿',    pinyin: 'nǚxù',          en: "daughter's husband",              side: 'affinal' },
  husband:                    { zh: '丈夫',    pinyin: 'zhàngfu',       en: 'husband',                         side: 'affinal', alt: '老公 lǎogōng' },
  wife:                       { zh: '妻子',    pinyin: 'qīzi',          en: 'wife',                            side: 'affinal', alt: '老婆 lǎopó' },
  wife_father:                { zh: '岳父',    pinyin: 'yuèfù',         en: "wife's father",                   side: 'affinal', alt: '丈人 zhàngren' },
  wife_mother:                { zh: '岳母',    pinyin: 'yuèmǔ',         en: "wife's mother",                   side: 'affinal', alt: '丈母娘 zhàngmuniáng' },
  husband_father:             { zh: '公公',    pinyin: 'gōnggong',      en: "husband's father",                side: 'affinal' },
  husband_mother:             { zh: '婆婆',    pinyin: 'pópo',          en: "husband's mother",                side: 'affinal' },
};

export const SPOUSE_OF: Record<string, string> = {
  father:                  'mother',
  mother:                  'father',
  father_older_brother:    'father_older_brother_wife',
  father_younger_brother:  'father_younger_brother_wife',
  father_sister:           'father_sister_husband',
  mother_brother:          'mother_brother_wife',
  mother_sister:           'mother_sister_husband',
  older_brother:           'older_brother_wife',
  younger_brother:         'younger_brother_wife',
  older_sister:            'older_sister_husband',
  younger_sister:          'younger_sister_husband',
  son:                     'son_wife',
  daughter:                'daughter_husband',
};

export function lookup(key: string): TermRecord & { key: string } {
  const rec = TERMS[key];
  if (!rec) throw new Error(`No term for key "${key}"`);
  return { key, ...rec };
}
