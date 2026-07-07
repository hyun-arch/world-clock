/*
 * timezones.js — City dataset for the World Clock gadget.
 * Each entry: { id, city, country, flag, tz }
 *   - id:      stable unique key (used for persistence / dedup)
 *   - city:    display name (English)
 *   - cityKo:  display name (Korean)
 *   - country: country name (English)
 *   - countryKo: country name (Korean)
 *   - flag:    emoji flag
 *   - tz:      IANA timezone id (drives Intl.DateTimeFormat -> automatic DST)
 *
 * No manual UTC offsets are stored on purpose: offsets change with DST, so we
 * always derive them at runtime from the IANA id via Intl. See clock-core.js.
 */
(function (root) {
  const CITIES = [
    // ── East Asia ───────────────────────────────────────────────
    { id: 'seoul',        city: 'Seoul',        cityKo: '서울',       country: 'South Korea',  countryKo: '대한민국',   flag: '🇰🇷', tz: 'Asia/Seoul' },
    { id: 'tokyo',        city: 'Tokyo',        cityKo: '도쿄',       country: 'Japan',        countryKo: '일본',       flag: '🇯🇵', tz: 'Asia/Tokyo' },
    { id: 'beijing',      city: 'Beijing',      cityKo: '베이징',     country: 'China',        countryKo: '중국',       flag: '🇨🇳', tz: 'Asia/Shanghai' },
    { id: 'shanghai',     city: 'Shanghai',     cityKo: '상하이',     country: 'China',        countryKo: '중국',       flag: '🇨🇳', tz: 'Asia/Shanghai' },
    { id: 'hongkong',     city: 'Hong Kong',    cityKo: '홍콩',       country: 'Hong Kong',    countryKo: '홍콩',       flag: '🇭🇰', tz: 'Asia/Hong_Kong' },
    { id: 'taipei',       city: 'Taipei',       cityKo: '타이베이',   country: 'Taiwan',       countryKo: '대만',       flag: '🇹🇼', tz: 'Asia/Taipei' },
    { id: 'singapore',    city: 'Singapore',    cityKo: '싱가포르',   country: 'Singapore',    countryKo: '싱가포르',   flag: '🇸🇬', tz: 'Asia/Singapore' },
    { id: 'kualalumpur',  city: 'Kuala Lumpur', cityKo: '쿠알라룸푸르', country: 'Malaysia',   countryKo: '말레이시아', flag: '🇲🇾', tz: 'Asia/Kuala_Lumpur' },
    { id: 'bangkok',      city: 'Bangkok',      cityKo: '방콕',       country: 'Thailand',     countryKo: '태국',       flag: '🇹🇭', tz: 'Asia/Bangkok' },
    { id: 'jakarta',      city: 'Jakarta',      cityKo: '자카르타',   country: 'Indonesia',    countryKo: '인도네시아', flag: '🇮🇩', tz: 'Asia/Jakarta' },
    { id: 'manila',       city: 'Manila',       cityKo: '마닐라',     country: 'Philippines',  countryKo: '필리핀',     flag: '🇵🇭', tz: 'Asia/Manila' },
    { id: 'hanoi',        city: 'Hanoi',        cityKo: '하노이',     country: 'Vietnam',      countryKo: '베트남',     flag: '🇻🇳', tz: 'Asia/Ho_Chi_Minh' },
    { id: 'hochiminh',    city: 'Ho Chi Minh',  cityKo: '호치민',     country: 'Vietnam',      countryKo: '베트남',     flag: '🇻🇳', tz: 'Asia/Ho_Chi_Minh' },

    // ── South & Central Asia ────────────────────────────────────
    { id: 'delhi',        city: 'New Delhi',    cityKo: '뉴델리',     country: 'India',        countryKo: '인도',       flag: '🇮🇳', tz: 'Asia/Kolkata' },
    { id: 'mumbai',       city: 'Mumbai',       cityKo: '뭄바이',     country: 'India',        countryKo: '인도',       flag: '🇮🇳', tz: 'Asia/Kolkata' },
    { id: 'karachi',      city: 'Karachi',      cityKo: '카라치',     country: 'Pakistan',     countryKo: '파키스탄',   flag: '🇵🇰', tz: 'Asia/Karachi' },
    { id: 'dhaka',        city: 'Dhaka',        cityKo: '다카',       country: 'Bangladesh',   countryKo: '방글라데시', flag: '🇧🇩', tz: 'Asia/Dhaka' },
    { id: 'almaty',       city: 'Almaty',       cityKo: '알마티',     country: 'Kazakhstan',   countryKo: '카자흐스탄', flag: '🇰🇿', tz: 'Asia/Almaty' },

    // ── Middle East ─────────────────────────────────────────────
    { id: 'dubai',        city: 'Dubai',        cityKo: '두바이',     country: 'UAE',          countryKo: '아랍에미리트', flag: '🇦🇪', tz: 'Asia/Dubai' },
    { id: 'riyadh',       city: 'Riyadh',       cityKo: '리야드',     country: 'Saudi Arabia', countryKo: '사우디아라비아', flag: '🇸🇦', tz: 'Asia/Riyadh' },
    { id: 'tehran',       city: 'Tehran',       cityKo: '테헤란',     country: 'Iran',         countryKo: '이란',       flag: '🇮🇷', tz: 'Asia/Tehran' },
    { id: 'jerusalem',    city: 'Jerusalem',    cityKo: '예루살렘',   country: 'Israel',       countryKo: '이스라엘',   flag: '🇮🇱', tz: 'Asia/Jerusalem' },
    { id: 'istanbul',     city: 'Istanbul',     cityKo: '이스탄불',   country: 'Turkey',       countryKo: '튀르키예',   flag: '🇹🇷', tz: 'Europe/Istanbul' },

    // ── Europe ──────────────────────────────────────────────────
    { id: 'paris',        city: 'Paris',        cityKo: '파리',       country: 'France',       countryKo: '프랑스',     flag: '🇫🇷', tz: 'Europe/Paris' },
    { id: 'london',       city: 'London',       cityKo: '런던',       country: 'United Kingdom', countryKo: '영국',     flag: '🇬🇧', tz: 'Europe/London' },
    { id: 'berlin',       city: 'Berlin',       cityKo: '베를린',     country: 'Germany',      countryKo: '독일',       flag: '🇩🇪', tz: 'Europe/Berlin' },
    { id: 'frankfurt',    city: 'Frankfurt',    cityKo: '프랑크푸르트', country: 'Germany',    countryKo: '독일',       flag: '🇩🇪', tz: 'Europe/Berlin' },
    { id: 'madrid',       city: 'Madrid',       cityKo: '마드리드',   country: 'Spain',        countryKo: '스페인',     flag: '🇪🇸', tz: 'Europe/Madrid' },
    { id: 'rome',         city: 'Rome',         cityKo: '로마',       country: 'Italy',        countryKo: '이탈리아',   flag: '🇮🇹', tz: 'Europe/Rome' },
    { id: 'amsterdam',    city: 'Amsterdam',    cityKo: '암스테르담', country: 'Netherlands',  countryKo: '네덜란드',   flag: '🇳🇱', tz: 'Europe/Amsterdam' },
    { id: 'zurich',       city: 'Zurich',       cityKo: '취리히',     country: 'Switzerland',  countryKo: '스위스',     flag: '🇨🇭', tz: 'Europe/Zurich' },
    { id: 'brussels',     city: 'Brussels',     cityKo: '브뤼셀',     country: 'Belgium',      countryKo: '벨기에',     flag: '🇧🇪', tz: 'Europe/Brussels' },
    { id: 'vienna',       city: 'Vienna',       cityKo: '비엔나',     country: 'Austria',      countryKo: '오스트리아', flag: '🇦🇹', tz: 'Europe/Vienna' },
    { id: 'stockholm',    city: 'Stockholm',    cityKo: '스톡홀름',   country: 'Sweden',       countryKo: '스웨덴',     flag: '🇸🇪', tz: 'Europe/Stockholm' },
    { id: 'oslo',         city: 'Oslo',         cityKo: '오슬로',     country: 'Norway',       countryKo: '노르웨이',   flag: '🇳🇴', tz: 'Europe/Oslo' },
    { id: 'copenhagen',   city: 'Copenhagen',   cityKo: '코펜하겐',   country: 'Denmark',      countryKo: '덴마크',     flag: '🇩🇰', tz: 'Europe/Copenhagen' },
    { id: 'helsinki',     city: 'Helsinki',     cityKo: '헬싱키',     country: 'Finland',      countryKo: '핀란드',     flag: '🇫🇮', tz: 'Europe/Helsinki' },
    { id: 'warsaw',       city: 'Warsaw',       cityKo: '바르샤바',   country: 'Poland',       countryKo: '폴란드',     flag: '🇵🇱', tz: 'Europe/Warsaw' },
    { id: 'prague',       city: 'Prague',       cityKo: '프라하',     country: 'Czechia',      countryKo: '체코',       flag: '🇨🇿', tz: 'Europe/Prague' },
    { id: 'lisbon',       city: 'Lisbon',       cityKo: '리스본',     country: 'Portugal',     countryKo: '포르투갈',   flag: '🇵🇹', tz: 'Europe/Lisbon' },
    { id: 'dublin',       city: 'Dublin',       cityKo: '더블린',     country: 'Ireland',      countryKo: '아일랜드',   flag: '🇮🇪', tz: 'Europe/Dublin' },
    { id: 'athens',       city: 'Athens',       cityKo: '아테네',     country: 'Greece',       countryKo: '그리스',     flag: '🇬🇷', tz: 'Europe/Athens' },
    { id: 'moscow',       city: 'Moscow',       cityKo: '모스크바',   country: 'Russia',       countryKo: '러시아',     flag: '🇷🇺', tz: 'Europe/Moscow' },

    // ── Africa ──────────────────────────────────────────────────
    { id: 'cairo',        city: 'Cairo',        cityKo: '카이로',     country: 'Egypt',        countryKo: '이집트',     flag: '🇪🇬', tz: 'Africa/Cairo' },
    { id: 'johannesburg', city: 'Johannesburg', cityKo: '요하네스버그', country: 'South Africa', countryKo: '남아프리카공화국', flag: '🇿🇦', tz: 'Africa/Johannesburg' },
    { id: 'lagos',        city: 'Lagos',        cityKo: '라고스',     country: 'Nigeria',      countryKo: '나이지리아', flag: '🇳🇬', tz: 'Africa/Lagos' },
    { id: 'nairobi',      city: 'Nairobi',      cityKo: '나이로비',   country: 'Kenya',        countryKo: '케냐',       flag: '🇰🇪', tz: 'Africa/Nairobi' },
    { id: 'casablanca',   city: 'Casablanca',   cityKo: '카사블랑카', country: 'Morocco',      countryKo: '모로코',     flag: '🇲🇦', tz: 'Africa/Casablanca' },

    // ── North America ───────────────────────────────────────────
    { id: 'newyork',      city: 'New York',     cityKo: '뉴욕',       country: 'USA',          countryKo: '미국',       flag: '🇺🇸', tz: 'America/New_York' },
    { id: 'washington',   city: 'Washington',   cityKo: '워싱턴',     country: 'USA',          countryKo: '미국',       flag: '🇺🇸', tz: 'America/New_York' },
    { id: 'boston',       city: 'Boston',       cityKo: '보스턴',     country: 'USA',          countryKo: '미국',       flag: '🇺🇸', tz: 'America/New_York' },
    { id: 'miami',        city: 'Miami',        cityKo: '마이애미',   country: 'USA',          countryKo: '미국',       flag: '🇺🇸', tz: 'America/New_York' },
    { id: 'chicago',      city: 'Chicago',      cityKo: '시카고',     country: 'USA',          countryKo: '미국',       flag: '🇺🇸', tz: 'America/Chicago' },
    { id: 'dallas',       city: 'Dallas',       cityKo: '댈러스',     country: 'USA',          countryKo: '미국',       flag: '🇺🇸', tz: 'America/Chicago' },
    { id: 'denver',       city: 'Denver',       cityKo: '덴버',       country: 'USA',          countryKo: '미국',       flag: '🇺🇸', tz: 'America/Denver' },
    { id: 'phoenix',      city: 'Phoenix',      cityKo: '피닉스',     country: 'USA',          countryKo: '미국',       flag: '🇺🇸', tz: 'America/Phoenix' },
    { id: 'losangeles',   city: 'Los Angeles',  cityKo: '로스앤젤레스', country: 'USA',        countryKo: '미국',       flag: '🇺🇸', tz: 'America/Los_Angeles' },
    { id: 'sanfrancisco', city: 'San Francisco', cityKo: '샌프란시스코', country: 'USA',       countryKo: '미국',       flag: '🇺🇸', tz: 'America/Los_Angeles' },
    { id: 'seattle',      city: 'Seattle',      cityKo: '시애틀',     country: 'USA',          countryKo: '미국',       flag: '🇺🇸', tz: 'America/Los_Angeles' },
    { id: 'lasvegas',     city: 'Las Vegas',    cityKo: '라스베이거스', country: 'USA',        countryKo: '미국',       flag: '🇺🇸', tz: 'America/Los_Angeles' },
    { id: 'honolulu',     city: 'Honolulu',     cityKo: '호놀룰루',   country: 'USA',          countryKo: '미국',       flag: '🇺🇸', tz: 'Pacific/Honolulu' },
    { id: 'anchorage',    city: 'Anchorage',    cityKo: '앵커리지',   country: 'USA',          countryKo: '미국',       flag: '🇺🇸', tz: 'America/Anchorage' },
    { id: 'toronto',      city: 'Toronto',      cityKo: '토론토',     country: 'Canada',       countryKo: '캐나다',     flag: '🇨🇦', tz: 'America/Toronto' },
    { id: 'vancouver',    city: 'Vancouver',    cityKo: '밴쿠버',     country: 'Canada',       countryKo: '캐나다',     flag: '🇨🇦', tz: 'America/Vancouver' },
    { id: 'montreal',     city: 'Montreal',     cityKo: '몬트리올',   country: 'Canada',       countryKo: '캐나다',     flag: '🇨🇦', tz: 'America/Toronto' },
    { id: 'mexicocity',   city: 'Mexico City',  cityKo: '멕시코시티', country: 'Mexico',       countryKo: '멕시코',     flag: '🇲🇽', tz: 'America/Mexico_City' },

    // ── South America ───────────────────────────────────────────
    { id: 'saopaulo',     city: 'São Paulo',    cityKo: '상파울루',   country: 'Brazil',       countryKo: '브라질',     flag: '🇧🇷', tz: 'America/Sao_Paulo' },
    { id: 'riodejaneiro', city: 'Rio de Janeiro', cityKo: '리우데자네이루', country: 'Brazil', countryKo: '브라질',     flag: '🇧🇷', tz: 'America/Sao_Paulo' },
    { id: 'buenosaires',  city: 'Buenos Aires', cityKo: '부에노스아이레스', country: 'Argentina', countryKo: '아르헨티나', flag: '🇦🇷', tz: 'America/Argentina/Buenos_Aires' },
    { id: 'santiago',     city: 'Santiago',     cityKo: '산티아고',   country: 'Chile',        countryKo: '칠레',       flag: '🇨🇱', tz: 'America/Santiago' },
    { id: 'lima',         city: 'Lima',         cityKo: '리마',       country: 'Peru',         countryKo: '페루',       flag: '🇵🇪', tz: 'America/Lima' },
    { id: 'bogota',       city: 'Bogotá',       cityKo: '보고타',     country: 'Colombia',     countryKo: '콜롬비아',   flag: '🇨🇴', tz: 'America/Bogota' },

    // ── Oceania ─────────────────────────────────────────────────
    { id: 'sydney',       city: 'Sydney',       cityKo: '시드니',     country: 'Australia',    countryKo: '호주',       flag: '🇦🇺', tz: 'Australia/Sydney' },
    { id: 'melbourne',    city: 'Melbourne',    cityKo: '멜버른',     country: 'Australia',    countryKo: '호주',       flag: '🇦🇺', tz: 'Australia/Melbourne' },
    { id: 'brisbane',     city: 'Brisbane',     cityKo: '브리즈번',   country: 'Australia',    countryKo: '호주',       flag: '🇦🇺', tz: 'Australia/Brisbane' },
    { id: 'perth',        city: 'Perth',        cityKo: '퍼스',       country: 'Australia',    countryKo: '호주',       flag: '🇦🇺', tz: 'Australia/Perth' },
    { id: 'auckland',     city: 'Auckland',     cityKo: '오클랜드',   country: 'New Zealand',  countryKo: '뉴질랜드',   flag: '🇳🇿', tz: 'Pacific/Auckland' },

    // ── Reference ───────────────────────────────────────────────
    { id: 'utc',          city: 'UTC',          cityKo: '협정세계시', country: 'Coordinated',  countryKo: '세계표준',   flag: '🌐', tz: 'UTC' },
  ];

  // Fast lookup by id.
  const BY_ID = {};
  CITIES.forEach((c) => { BY_ID[c.id] = c; });

  const api = {
    CITIES,
    getById: (id) => BY_ID[id] || null,
    /** Case-insensitive search across city/country in EN + KO. */
    search: (query) => {
      const q = (query || '').trim().toLowerCase();
      if (!q) return CITIES;
      return CITIES.filter((c) =>
        c.city.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q) ||
        (c.cityKo && c.cityKo.includes(q)) ||
        (c.countryKo && c.countryKo.includes(q)) ||
        c.tz.toLowerCase().includes(q)
      );
    },
  };

  // Export for both browser (window) and Node (tests / build).
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TZ = api;
})(typeof window !== 'undefined' ? window : globalThis);
