import { createCatalog } from './catalog.js';

const sectionLabels = new Map([
  ['foundations', 'Foundations'],
  ['books', 'Books'],
  ['youtube', 'YouTube'],
  ['podcasts', 'Podcasts'],
  ['open-lectures', 'Open lectures'],
  ['courses', 'Courses'],
  ['blogs', 'Blogs & essays'],
  ['creators', 'Creators to follow'],
  ['communities', 'Communities'],
  ['screen', 'Movies & TV'],
]);

const form = document.querySelector('#topic-search');
const searchInput = document.querySelector('#topic-query');
const topicList = document.querySelector('#topic-list');
const topicChoices = document.querySelector('#topic-choices');
const topicView = document.querySelector('#topic-view');
const messagePanel = document.querySelector('#search-message');
const loadError = document.querySelector('#load-error');
const announcement = document.querySelector('#announcement');
const loadingMessage = document.querySelector('#loading-message');
const searchButton = form.querySelector('button[type="submit"]');

let catalog;

const element = (tagName, className, text) => {
  const node = document.createElement(tagName);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

const setAnnouncement = (text) => {
  announcement.textContent = text;
};

const makeTopicButton = (topic) => {
  const button = element('button', 'topic-card');
  button.type = 'button';
  button.setAttribute('aria-label', `Explore ${topic.title}`);
  button.append(
    element('span', 'topic-card-index', topic.id.slice(0, 2).toUpperCase()),
    element('span', 'topic-card-title', topic.title),
    element('span', 'topic-card-summary', topic.summary),
    element('span', 'topic-card-arrow', 'Explore topic →'),
  );
  button.addEventListener('click', () => showTopic(topic));
  return button;
};

const renderTopicChoices = (topics) => {
  topicList.replaceChildren(...topics.map(makeTopicButton));
  topicChoices.hidden = topics.length === 0;
};

const renderSearchMessage = (title, description, actions) => {
  messagePanel.replaceChildren(
    element('h2', '', title),
    element('p', '', description),
    ...actions,
  );
  messagePanel.hidden = false;
};

const makeTextList = (items, className) => {
  const list = element('ul', className);
  list.append(
    ...items.map((item) => {
      const listItem = element('li');
      listItem.textContent = item;
      return listItem;
    }),
  );
  return list;
};

const makeResourceCard = (resource) => {
  const card = element('article', 'resource-card');
  card.id = `resource-${resource.id}`;

  const source = element('p', 'resource-source', resource.source);
  const link = element('a', 'resource-title', resource.title);
  link.href = resource.url;
  const note = element('p', 'resource-note', resource.why);
  const verified = element(
    'p',
    'resource-verified',
    `Editorial review ${new Intl.DateTimeFormat('en', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(`${resource.verified}T00:00:00Z`))}`,
  );
  card.append(source, link, note, verified);
  return card;
};

const makeTopicHeader = (topic) => {
  const header = element('header', 'topic-header');
  const backButton = element('button', 'text-button', '← All topics');
  backButton.type = 'button';
  backButton.addEventListener('click', showAllTopics);

  const title = element('h2', 'topic-title', topic.title);
  title.tabIndex = -1;
  const summary = element('p', 'topic-summary', topic.summary);
  header.append(backButton, title, summary);
  return header;
};

const makeFoundations = (topic) => {
  const section = element('section', 'foundation-panel');
  section.setAttribute('aria-labelledby', 'foundation-title');
  section.append(
    element('p', 'eyebrow', 'Start with the underlying idea'),
    element('h3', '', 'First principles'),
  );
  section.lastElementChild.id = 'foundation-title';
  section.append(element('p', 'foundation-copy', topic.overview));

  const concepts = element('div', 'concept-panel');
  concepts.append(
    element('h4', '', 'A few ideas to carry with you'),
    makeTextList(topic.concepts, 'concept-list'),
  );
  section.append(concepts);

  const sources = element('div', 'source-references');
  sources.append(element('h4', '', 'Sources for the primer'));
  const sourceList = element('ul');
  sourceList.append(
    ...topic.sources.map((source) => {
      const item = element('li');
      const link = element('a', '', source.title);
      link.href = source.url;
      item.append(link);
      return item;
    }),
  );
  sources.append(sourceList);
  section.append(sources);
  return section;
};

const makeStartingPath = (topic, resources) => {
  const section = element('section', 'starting-path');
  section.setAttribute('aria-labelledby', 'path-title');
  section.append(
    element('p', 'eyebrow', 'A suggested first pass'),
    element('h3', '', 'Start here'),
  );
  section.lastElementChild.id = 'path-title';

  const list = element('ol', 'path-list');
  list.append(
    ...topic.startHere.map((step, index) => {
      const resource = resources.get(step.resourceId);
      const item = element('li', 'path-step');
      item.append(element('span', 'path-number', `0${index + 1}`));
      const copy = element('div');
      const link = element('a', 'path-resource', resource.title);
      link.href = `#resource-${resource.id}`;
      copy.append(link, element('p', '', step.reason));
      item.append(copy);
      return item;
    }),
  );
  section.append(list);
  return section;
};

const makeCategoryNavigation = (sections) => {
  const nav = element('nav', 'category-nav');
  nav.setAttribute('aria-label', 'In this guide');
  nav.append(element('p', 'eyebrow', 'Explore by format'));
  const links = element('div', 'category-links');
  links.append(
    ...sections
      .filter(({ resources }) => resources.length > 0)
      .map((section) => {
        const link = element(
          'a',
          'category-link',
          sectionLabels.get(section.id),
        );
        link.href = `#section-${section.id}`;
        return link;
      }),
  );
  nav.append(links);
  return nav;
};

const makeResourceSections = (sections) => {
  const collection = element('div', 'resource-sections');
  const omissions = [];

  for (const section of sections) {
    if (section.resources.length === 0) {
      omissions.push(section);
      continue;
    }

    const group = element('section', 'resource-section');
    group.id = `section-${section.id}`;
    group.setAttribute('aria-labelledby', `heading-${section.id}`);
    const heading = element('div', 'section-heading');
    heading.append(
      element('p', 'eyebrow', 'Curated resources'),
      element('h3', '', sectionLabels.get(section.id)),
    );
    heading.lastElementChild.id = `heading-${section.id}`;
    const cards = element('div', 'resource-grid');
    cards.append(...section.resources.map(makeResourceCard));
    group.append(heading, cards);
    collection.append(group);
  }

  if (omissions.length > 0) {
    const note = element('details', 'coverage-note');
    note.append(element('summary', '', 'Why some formats are not included'));
    const reasons = element('ul');
    reasons.append(
      ...omissions.map((section) => {
        const item = element('li');
        item.append(
          element('strong', '', `${sectionLabels.get(section.id)}: `),
        );
        item.append(document.createTextNode(section.omissionReason));
        return item;
      }),
    );
    note.append(reasons);
    collection.append(note);
  }

  return collection;
};

function showAllTopics() {
  searchInput.value = '';
  topicView.replaceChildren();
  messagePanel.hidden = true;
  renderTopicChoices(catalog.search(''));
  setAnnouncement('Showing all curated topics.');
  searchInput.focus();
}

function showTopic(topic) {
  const resources = new Map(
    topic.sections.flatMap((section) =>
      section.resources.map((resource) => [resource.id, resource]),
    ),
  );

  topicChoices.hidden = true;
  messagePanel.hidden = true;
  topicView.replaceChildren(
    makeTopicHeader(topic),
    makeFoundations(topic),
    makeStartingPath(topic, resources),
    makeCategoryNavigation(topic.sections),
    makeResourceSections(topic.sections),
  );
  setAnnouncement(`${topic.title} guide loaded.`);
  topicView.querySelector('.topic-title').focus();
}

const handleSearch = (event) => {
  event.preventDefault();
  if (!catalog) return;

  const query = searchInput.value;
  if (!query.trim()) {
    topicView.replaceChildren();
    messagePanel.hidden = true;
    renderTopicChoices(catalog.search(''));
    setAnnouncement('Showing all curated topics.');
    return;
  }

  const matches = catalog.search(query);
  topicView.replaceChildren();
  if (matches.length === 1) {
    showTopic(matches[0]);
    return;
  }
  if (matches.length > 1) {
    messagePanel.hidden = true;
    renderTopicChoices(matches);
    setAnnouncement(`${matches.length} topics match. Choose one to continue.`);
    return;
  }

  topicChoices.hidden = true;
  const reset = element('button', 'text-button', 'Browse all five topics');
  reset.type = 'button';
  reset.addEventListener('click', showAllTopics);
  renderSearchMessage(
    'That topic is not in this collection yet.',
    'Try one of the five subjects we have carefully curated, or browse the collection.',
    [reset],
  );
  setAnnouncement('No curated topic matched that search.');
};

const makeRetryButton = () => {
  const button = element('button', 'button-primary', 'Try again');
  button.type = 'button';
  button.addEventListener('click', loadTopics);
  return button;
};

async function loadTopics() {
  if (loadingMessage.dataset.pending === 'true') return;
  loadingMessage.dataset.pending = 'true';
  loadingMessage.hidden = false;
  loadError.hidden = true;
  searchInput.disabled = true;
  searchButton.disabled = true;
  setAnnouncement('Loading curated topics.');

  try {
    const response = await fetch(
      new URL('./data/topics.json', import.meta.url),
      { signal: AbortSignal.timeout(30_000) },
    );
    if (!response.ok) {
      throw new Error(`Catalog request failed with status ${response.status}.`);
    }
    const raw = await response.json();
    const loadedCatalog = createCatalog(raw);
    catalog = loadedCatalog;
    loadError.hidden = true;
    searchInput.disabled = false;
    searchButton.disabled = false;
    renderTopicChoices(catalog.search(''));
    setAnnouncement('Five curated topics are ready.');
  } catch (error) {
    console.error('Unable to load the topic catalog:', error);
    loadError.replaceChildren(
      element('h2', '', 'The collection could not be loaded.'),
      element(
        'p',
        '',
        'Check your connection and try again. If this persists, the catalog may need a correction from the project maintainer.',
      ),
      makeRetryButton(),
    );
    loadError.hidden = false;
    setAnnouncement('The topic collection failed to load. Retry is available.');
  } finally {
    loadingMessage.hidden = true;
    loadingMessage.dataset.pending = 'false';
  }
}

form.addEventListener('submit', handleSearch);
loadTopics();
