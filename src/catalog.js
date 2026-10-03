export const CATEGORY_IDS = Object.freeze([
  'foundations',
  'books',
  'youtube',
  'podcasts',
  'open-lectures',
  'courses',
  'blogs',
  'creators',
  'communities',
  'screen',
]);

const isRecord = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const isNonemptyString = (value) =>
  typeof value === 'string' && value.trim().length > 0;

const normalized = (value) =>
  value
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .replace(/\s+/gu, ' ')
    .toLocaleLowerCase('en');

const validateUrl = (value, context) => {
  if (!isNonemptyString(value)) {
    throw new TypeError(`${context} must be a nonempty HTTPS URL.`);
  }

  let url;
  try {
    url = new URL(value);
  } catch {
    throw new TypeError(`${context} must be a valid HTTPS URL.`);
  }

  if (
    url.protocol !== 'https:' ||
    !url.hostname ||
    url.username ||
    url.password
  ) {
    throw new TypeError(`${context} must use HTTPS.`);
  }
};

const validateDate = (value, context) => {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) {
    throw new TypeError(`${context} must be a real date in YYYY-MM-DD format.`);
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw new TypeError(`${context} must be a real date in YYYY-MM-DD format.`);
  }
};

const validateTopic = (topic, index, exactTerms) => {
  const context = `Topic at index ${index}`;
  if (!isRecord(topic)) throw new TypeError(`${context} must be an object.`);

  for (const field of ['id', 'title', 'summary', 'overview']) {
    if (!isNonemptyString(topic[field])) {
      throw new TypeError(`${context} requires a nonempty ${field}.`);
    }
  }

  if (!Array.isArray(topic.aliases) || !topic.aliases.every(isNonemptyString)) {
    throw new TypeError(
      `${context} aliases must be an array of nonempty strings.`,
    );
  }
  if (
    !Array.isArray(topic.concepts) ||
    !topic.concepts.every(isNonemptyString)
  ) {
    throw new TypeError(
      `${context} concepts must be an array of nonempty strings.`,
    );
  }
  if (!Array.isArray(topic.sources) || topic.sources.length === 0) {
    throw new TypeError(`${context} requires at least one source reference.`);
  }
  topic.sources.forEach((source, sourceIndex) => {
    if (!isRecord(source) || !isNonemptyString(source.title)) {
      throw new TypeError(`${context} source ${sourceIndex} requires a title.`);
    }
    validateUrl(source.url, `${context} source ${sourceIndex} URL`);
  });

  if (
    !Array.isArray(topic.sections) ||
    topic.sections.length !== CATEGORY_IDS.length
  ) {
    throw new TypeError(
      `${context} must define all ${CATEGORY_IDS.length} categories.`,
    );
  }

  const resourceIds = new Set();
  const resourceUrls = new Set();
  topic.sections.forEach((section, sectionIndex) => {
    const categoryId = CATEGORY_IDS[sectionIndex];
    if (!isRecord(section) || section.id !== categoryId) {
      throw new TypeError(
        `${context} section ${sectionIndex} must be "${categoryId}" in canonical order.`,
      );
    }
    if (!Array.isArray(section.resources)) {
      throw new TypeError(
        `${context} section "${categoryId}" resources must be an array.`,
      );
    }
    if (section.resources.length !== 0 && section.resources.length !== 3) {
      throw new TypeError(
        `${context} section "${categoryId}" must contain exactly three resources or be omitted.`,
      );
    }
    if (
      section.resources.length === 0 &&
      !isNonemptyString(section.omissionReason)
    ) {
      throw new TypeError(
        `${context} section "${categoryId}" needs an editorial omissionReason.`,
      );
    }
    if (
      section.resources.length === 3 &&
      section.omissionReason !== undefined
    ) {
      throw new TypeError(
        `${context} section "${categoryId}" cannot have an omissionReason when populated.`,
      );
    }

    section.resources.forEach((resource, resourceIndex) => {
      const resourceContext = `${context} section "${categoryId}" resource ${resourceIndex}`;
      if (!isRecord(resource))
        throw new TypeError(`${resourceContext} must be an object.`);
      for (const field of ['id', 'title', 'source', 'why']) {
        if (!isNonemptyString(resource[field])) {
          throw new TypeError(
            `${resourceContext} requires a nonempty ${field}.`,
          );
        }
      }
      if (resourceIds.has(resource.id)) {
        throw new TypeError(
          `${context} contains duplicate resource ID "${resource.id}".`,
        );
      }
      resourceIds.add(resource.id);
      validateUrl(resource.url, `${resourceContext} URL`);
      const resourceUrl = new URL(resource.url).href;
      if (resourceUrls.has(resourceUrl)) {
        throw new TypeError(
          `${context} contains duplicate resource URL "${resourceUrl}".`,
        );
      }
      resourceUrls.add(resourceUrl);
      if (!isNonemptyString(resource.verified)) {
        throw new TypeError(`${resourceContext} requires a verification date.`);
      }
      validateDate(resource.verified, `${resourceContext} verification date`);
    });
  });

  if (!Array.isArray(topic.startHere) || topic.startHere.length !== 3) {
    throw new TypeError(
      `${context} must have exactly three starting-path steps.`,
    );
  }
  const startIds = new Set();
  topic.startHere.forEach((step, stepIndex) => {
    if (
      !isRecord(step) ||
      !isNonemptyString(step.resourceId) ||
      !isNonemptyString(step.reason)
    ) {
      throw new TypeError(
        `${context} starting-path step ${stepIndex} is incomplete.`,
      );
    }
    if (!resourceIds.has(step.resourceId)) {
      throw new TypeError(
        `${context} starting-path step ${stepIndex} references missing resource "${step.resourceId}".`,
      );
    }
    if (startIds.has(step.resourceId)) {
      throw new TypeError(
        `${context} starting path must use three distinct resources.`,
      );
    }
    startIds.add(step.resourceId);
  });

  for (const term of [topic.title, ...topic.aliases]) {
    const key = normalized(term);
    const owner = exactTerms.get(key);
    if (owner && owner !== topic.id) {
      throw new TypeError(
        `Topic "${topic.id}" has an ambiguous title or alias "${term}" shared with "${owner}".`,
      );
    }
    exactTerms.set(key, topic.id);
  }
};

export function createCatalog(raw) {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new TypeError('Catalog must be a nonempty array of topics.');
  }

  const topicIds = new Set();
  const exactTerms = new Map();
  raw.forEach((topic, index) => {
    validateTopic(topic, index, exactTerms);
    if (topicIds.has(topic.id)) {
      throw new TypeError(`Catalog contains duplicate topic ID "${topic.id}".`);
    }
    topicIds.add(topic.id);
  });

  return Object.freeze({
    search(query) {
      if (typeof query !== 'string') {
        throw new TypeError('Topic search query must be a string.');
      }
      const term = normalized(query);
      if (!term) return raw;

      const exactId = exactTerms.get(term);
      if (exactId) return raw.filter(({ id }) => id === exactId);

      const matches = raw.filter(({ title, aliases }) =>
        [title, ...aliases].some((label) => normalized(label).includes(term)),
      );
      return matches;
    },
  });
}
