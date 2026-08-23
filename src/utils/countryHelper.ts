import { Movie } from '../types';

export interface CountryInfo {
  code: string;
  name: string;
  englishName: string;
  flag: string;
  aliases: string[];
}

export const COUNTRIES_LIST: CountryInfo[] = [
  {
    code: 'ID',
    name: 'Indonesia',
    englishName: 'Indonesia',
    flag: '🇮🇩',
    aliases: ['indonesia', 'id', 'indo', 'indonesian'],
  },
  {
    code: 'US',
    name: 'Amerika Serikat',
    englishName: 'United States',
    flag: '🇺🇸',
    aliases: ['us', 'usa', 'united states', 'united states of america', 'amerika', 'amerika serikat', 'hollywood', 'barat', 'en'],
  },
  {
    code: 'KR',
    name: 'Korea Selatan',
    englishName: 'South Korea',
    flag: '🇰🇷',
    aliases: ['kr', 'korea', 'south korea', 'korea selatan', 'drakor', 'k-drama', 'ko'],
  },
  {
    code: 'JP',
    name: 'Jepang',
    englishName: 'Japan',
    flag: '🇯🇵',
    aliases: ['jp', 'japan', 'jepang', 'anime', 'ja'],
  },
  {
    code: 'TH',
    name: 'Thailand',
    englishName: 'Thailand',
    flag: '🇹🇭',
    aliases: ['th', 'thailand', 'thai'],
  },
  {
    code: 'IN',
    name: 'India',
    englishName: 'India',
    flag: '🇮🇳',
    aliases: ['in', 'india', 'bollywood', 'tamil', 'telugu', 'hindi', 'hi', 'ta', 'te'],
  },
  {
    code: 'CN',
    name: 'China',
    englishName: 'China',
    flag: '🇨🇳',
    aliases: ['cn', 'china', 'tiongkok', 'mandarin', 'chinese', 'zh'],
  },
  {
    code: 'HK',
    name: 'Hong Kong',
    englishName: 'Hong Kong',
    flag: '🇭🇰',
    aliases: ['hk', 'hong kong', 'hongkong', 'cantonese'],
  },
  {
    code: 'GB',
    name: 'Inggris',
    englishName: 'United Kingdom',
    flag: '🇬🇧',
    aliases: ['gb', 'uk', 'united kingdom', 'great britain', 'inggris', 'british'],
  },
  {
    code: 'ES',
    name: 'Spanyol',
    englishName: 'Spain',
    flag: '🇪🇸',
    aliases: ['es', 'spain', 'spanyol', 'spanish'],
  },
  {
    code: 'FR',
    name: 'Prancis',
    englishName: 'France',
    flag: '🇫🇷',
    aliases: ['fr', 'france', 'prancis', 'french'],
  },
  {
    code: 'DE',
    name: 'Jerman',
    englishName: 'Germany',
    flag: '🇩🇪',
    aliases: ['de', 'germany', 'jerman', 'german'],
  },
  {
    code: 'PH',
    name: 'Filipina',
    englishName: 'Philippines',
    flag: '🇵🇭',
    aliases: ['ph', 'philippines', 'filipina', 'tagalog'],
  },
  {
    code: 'TR',
    name: 'Turki',
    englishName: 'Turkey',
    flag: '🇹🇷',
    aliases: ['tr', 'turkey', 'turki', 'turkish'],
  },
  {
    code: 'IT',
    name: 'Italia',
    englishName: 'Italy',
    flag: '🇮🇹',
    aliases: ['it', 'italy', 'italia', 'italian'],
  },
  {
    code: 'MY',
    name: 'Malaysia',
    englishName: 'Malaysia',
    flag: '🇲🇾',
    aliases: ['my', 'malaysia', 'malay'],
  },
  {
    code: 'TW',
    name: 'Taiwan',
    englishName: 'Taiwan',
    flag: '🇹🇼',
    aliases: ['tw', 'taiwan', 'taiwanese'],
  },
  {
    code: 'AU',
    name: 'Australia',
    englishName: 'Australia',
    flag: '🇦🇺',
    aliases: ['au', 'australia'],
  },
  {
    code: 'CA',
    name: 'Kanada',
    englishName: 'Canada',
    flag: '🇨🇦',
    aliases: ['ca', 'canada', 'kanada'],
  },
];

// Fallback for unknown country
export const DEFAULT_UNKNOWN_COUNTRY: CountryInfo = {
  code: 'OTHER',
  name: 'Lainnya',
  englishName: 'Other',
  flag: '🌐',
  aliases: ['other', 'lainnya'],
};

/**
 * Find country info by code, name, or alias
 */
export function findCountryInfo(countryQuery?: string | null): CountryInfo {
  if (!countryQuery) return COUNTRIES_LIST.find((c) => c.code === 'US')!;
  const q = countryQuery.toLowerCase().trim();

  // Match code directly
  const matchCode = COUNTRIES_LIST.find((c) => c.code.toLowerCase() === q);
  if (matchCode) return matchCode;

  // Match name directly
  const matchName = COUNTRIES_LIST.find((c) => c.name.toLowerCase() === q || c.englishName.toLowerCase() === q);
  if (matchName) return matchName;

  // Match aliases
  const matchAlias = COUNTRIES_LIST.find((c) => c.aliases.includes(q));
  if (matchAlias) return matchAlias;

  return {
    code: q.toUpperCase().slice(0, 4),
    name: countryQuery,
    englishName: countryQuery,
    flag: '🌐',
    aliases: [q],
  };
}

/**
 * Infer movie country with high accuracy (uses explicit field, or intelligent metadata hints)
 */
export function getMovieCountry(movie: Partial<Movie>): CountryInfo {
  // 1. Check explicit country or country_code field
  if (movie.country_code) {
    return findCountryInfo(movie.country_code);
  }
  if (movie.country) {
    return findCountryInfo(movie.country);
  }

  const title = (movie.title || '').toLowerCase();
  const slug = (movie.slug || '').toLowerCase();
  const synopsis = (movie.synopsis || '').toLowerCase();
  const genres = (movie.genres || []).map((g) => g.toLowerCase());

  // 2. Clues for Indonesia
  const indonesianClues = [
    'terang boelan', 'pengabdi setan', 'agak laen', 'dilan', 'warkop', 'kkn di desa penari',
    'ancika', 'sewu dino', 'gundala', 'srimulat', 'habibie', 'laskar pelangi', 'marlina',
    'budi pekerti', 'jatuh cinta seperti di film-film', 'petualangan sherina', 'miracle in cell no. 7 indonesia',
    'pemandi jenazah', 'vina: sebelum 7 hari', 'ipar adalah maut', 'kereta berdarah', 'sekawan limo'
  ];
  if (indonesianClues.some((clue) => title.includes(clue) || slug.includes(clue))) {
    return findCountryInfo('ID');
  }

  // 3. Clues for Japan (Anime / Manga / Japanese text)
  if (
    /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(movie.title || '') ||
    title.includes('demon slayer') ||
    title.includes('kimetsu no yaiba') ||
    title.includes('jujutsu kaisen') ||
    title.includes('one piece') ||
    title.includes('naruto') ||
    title.includes('boruto') ||
    title.includes('attack on titan') ||
    title.includes('shingeki no kyojin') ||
    title.includes('studio ghibli') ||
    title.includes('dragon ball') ||
    title.includes('spy x family') ||
    title.includes('chainsaw man') ||
    title.includes('haikyuu') ||
    title.includes('detective conan') ||
    title.includes('my hero academia') ||
    genres.includes('anime')
  ) {
    return findCountryInfo('JP');
  }

  // 4. Clues for South Korea (Hangul / K-Movie / Drakor)
  if (
    /[\uac00-\ud7af]/.test(movie.title || '') ||
    title.includes('parasite') ||
    title.includes('train to busan') ||
    title.includes('exhuma') ||
    title.includes('squid game') ||
    title.includes('the roundup') ||
    title.includes('decision to leave') ||
    title.includes('drakor') ||
    genres.includes('k-drama') ||
    genres.includes('drakor')
  ) {
    return findCountryInfo('KR');
  }

  // 5. Clues for India (Tamil / Telugu / Hindi / Bollywood)
  if (
    /[\u0900-\u097f\u0b80-\u0bff\u0c00-\u0c7f]/.test(movie.title || '') ||
    title.includes('rrr') ||
    title.includes('jawan') ||
    title.includes('pathaan') ||
    title.includes('kalki') ||
    title.includes('salaar') ||
    title.includes('bahubali') ||
    title.includes('dangal') ||
    title.includes('pushpa') ||
    title.includes('bollywood') ||
    genres.includes('bollywood')
  ) {
    return findCountryInfo('IN');
  }

  // 6. Clues for Thailand
  if (
    /[\u0e00-\u0e7f]/.test(movie.title || '') ||
    title.includes('pee mak') ||
    title.includes('bad genius') ||
    title.includes('the medium') ||
    title.includes('ong bak') ||
    title.includes('how to make millions before grandma dies')
  ) {
    return findCountryInfo('TH');
  }

  // Default to Hollywood / USA for global movies
  return findCountryInfo('US');
}

/**
 * Filter movies by country code or 'All'
 */
export function filterMoviesByCountry(movies: Movie[], countryCode: string): Movie[] {
  if (!countryCode || countryCode === 'All') return movies;
  return movies.filter((m) => {
    const c = getMovieCountry(m);
    return c.code.toUpperCase() === countryCode.toUpperCase();
  });
}

/**
 * Get distinct countries with active movie count
 */
export function getAvailableCountries(movies: Movie[]): { info: CountryInfo; count: number }[] {
  const counts = new Map<string, number>();

  for (const m of movies) {
    const c = getMovieCountry(m);
    counts.set(c.code, (counts.get(c.code) || 0) + 1);
  }

  const result: { info: CountryInfo; count: number }[] = [];

  // Add standard ordered countries that have movies
  for (const c of COUNTRIES_LIST) {
    const count = counts.get(c.code) || 0;
    if (count > 0) {
      result.push({ info: c, count });
      counts.delete(c.code);
    }
  }

  // Add any remaining custom countries
  for (const [code, count] of counts.entries()) {
    result.push({
      info: findCountryInfo(code),
      count,
    });
  }

  return result;
}
