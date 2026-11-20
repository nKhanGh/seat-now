const accents: Record<string, string> = {
  a: '[aàáảãạăằắẳẵặâầấẩẫậ]',
  e: '[eèéẻẽẹêềếểễệ]',
  i: '[iìíỉĩị]',
  o: '[oòóỏõọôồốổỗộơờớởỡợ]',
  u: '[uùúủũụưừứửữự]',
  y: '[yỳýỷỹỵ]',
  d: '[dđ]',
};

export function venueSearchPattern(query: string) {
  const normalized = query
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLocaleLowerCase('vi-VN')
    .trim()
    .replace(/\s+/g, ' ');
  const pattern = [...normalized]
    .map((character) => {
      if (character === ' ') return '\\s+';
      return accents[character] ?? character.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('');
  return new RegExp(pattern, 'i');
}
