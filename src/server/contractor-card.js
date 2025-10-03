const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

const coerceArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (error) {
      return [];
    }
  }
  return [];
};

const sanitizeText = (value) => {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim();
};

const normalizeServicesList = (value) => {
  const rawArray = coerceArray(value);
  return rawArray
    .map((item, index) => {
      if (!item) {
        return null;
      }
      if (typeof item === 'string') {
        const name = item.trim();
        if (!name) {
          return null;
        }
        return {
          id: `service-${index + 1}`,
          title: name,
          description: null
        };
      }
      if (typeof item === 'object') {
        const id = isNonEmptyString(item.id) ? item.id.trim() : `service-${index + 1}`;
        const title = isNonEmptyString(item.title)
          ? item.title.trim()
          : isNonEmptyString(item.name)
          ? item.name.trim()
          : '';
        if (!title) {
          return null;
        }
        const description = isNonEmptyString(item.description)
          ? item.description.trim()
          : null;
        return {
          id,
          title,
          description
        };
      }
      return null;
    })
    .filter(Boolean);
};

const normalizePortfolioItems = (value) => {
  const rawArray = coerceArray(value);
  return rawArray
    .map((item, index) => {
      if (!item) {
        return null;
      }
      if (typeof item === 'string') {
        const url = item.trim();
        if (!url) {
          return null;
        }
        return {
          id: `portfolio-${index + 1}`,
          title: `Работа ${index + 1}`,
          description: null,
          imageUrl: url,
          linkUrl: url
        };
      }
      if (typeof item === 'object') {
        const id = isNonEmptyString(item.id) ? item.id.trim() : `portfolio-${index + 1}`;
        const titleCandidate = isNonEmptyString(item.title)
          ? item.title.trim()
          : isNonEmptyString(item.name)
          ? item.name.trim()
          : '';
        const title = titleCandidate || `Работа ${index + 1}`;
        const description = isNonEmptyString(item.description) ? item.description.trim() : null;
        const imageUrl = isNonEmptyString(item.imageUrl)
          ? item.imageUrl.trim()
          : isNonEmptyString(item.coverImageUrl)
          ? item.coverImageUrl.trim()
          : null;
        const linkUrl = isNonEmptyString(item.linkUrl)
          ? item.linkUrl.trim()
          : isNonEmptyString(item.url)
          ? item.url.trim()
          : imageUrl;
        return {
          id,
          title,
          description,
          imageUrl,
          linkUrl
        };
      }
      return null;
    })
    .filter(Boolean);
};

const normalizePriceFrom = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  return Math.max(0, Math.round(numeric));
};

const normalizeCoverImageUrl = (value) => {
  if (!isNonEmptyString(value)) {
    return null;
  }
  return value.trim();
};

const normalizeCity = (value) => {
  if (!isNonEmptyString(value)) {
    return '';
  }
  return value.trim();
};

const normalizePublicationFlag = (value) => Boolean(value);

const buildContractorCard = (profile) => {
  if (!profile || typeof profile !== 'object') {
    return null;
  }
  const card = {
    id: isNonEmptyString(profile.id) ? profile.id.trim() : null,
    userId: isNonEmptyString(profile.userId) ? profile.userId.trim() : null,
    companyName: sanitizeText(profile.companyName || ''),
    description: isNonEmptyString(profile.description) ? profile.description.trim() : null,
    services: normalizeServicesList(profile.services),
    portfolio: normalizePortfolioItems(profile.portfolio),
    priceFrom: normalizePriceFrom(profile.priceFrom),
    coverImageUrl: normalizeCoverImageUrl(profile.coverImageUrl),
    isPublished: normalizePublicationFlag(profile.isPublished),
    city: normalizeCity(profile.city ?? profile.location ?? null)
  };
  return card;
};

const buildPublicContractorCard = (profile) => {
  const card = buildContractorCard(profile);
  if (!card || !card.isPublished) {
    return null;
  }
  return {
    id: card.id || card.userId || null,
    name: card.companyName || 'Подрядчик',
    services: card.services,
    priceFrom: card.priceFrom,
    coverImageUrl: card.coverImageUrl,
    city: card.city || '',
    description: card.description || null
  };
};

const parsePriceFromInput = (value) => {
  if (value === undefined) {
    return { provided: false };
  }
  if (value === null || value === '') {
    return { provided: true, value: null };
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return { provided: true, error: 'invalid' };
  }
  return { provided: true, value: Math.max(0, Math.round(numeric)) };
};

const parseCoverImageInput = (value) => {
  if (value === undefined) {
    return { provided: false };
  }
  if (value === null) {
    return { provided: true, value: null };
  }
  if (!isNonEmptyString(value)) {
    if (typeof value === 'string') {
      return { provided: true, value: null };
    }
    return { provided: true, error: 'invalid' };
  }
  return { provided: true, value: value.trim() };
};

const parsePublicationInput = (value) => {
  if (value === undefined) {
    return { provided: false };
  }
  if (typeof value === 'boolean') {
    return { provided: true, value };
  }
  if (typeof value === 'number') {
    if (value === 1) {
      return { provided: true, value: true };
    }
    if (value === 0) {
      return { provided: true, value: false };
    }
    return { provided: true, error: 'invalid' };
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (!normalized) {
      return { provided: true, value: false };
    }
    if (['true', '1', 'yes', 'да'].includes(normalized)) {
      return { provided: true, value: true };
    }
    if (['false', '0', 'no', 'нет'].includes(normalized)) {
      return { provided: true, value: false };
    }
  }
  return { provided: true, error: 'invalid' };
};

const parseCityInput = (value) => {
  if (value === undefined) {
    return { provided: false };
  }
  if (value === null) {
    return { provided: true, value: '' };
  }
  if (!isNonEmptyString(value)) {
    return { provided: true, value: '' };
  }
  return { provided: true, value: value.trim() };
};

module.exports = {
  coerceArray,
  normalizeServicesList,
  normalizePortfolioItems,
  normalizePriceFrom,
  normalizeCoverImageUrl,
  normalizeCity,
  normalizePublicationFlag,
  buildContractorCard,
  buildPublicContractorCard,
  parsePriceFromInput,
  parseCoverImageInput,
  parsePublicationInput,
  parseCityInput
};
