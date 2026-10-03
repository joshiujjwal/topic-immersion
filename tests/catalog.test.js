import test from 'node:test';
import assert from 'node:assert/strict';
import topics from '../src/data/topics.json' with { type: 'json' };
import { createCatalog } from '../src/catalog.js';

const topic = {
  id: 'sales',
  title: 'Sales',
  aliases: ['selling'],
  summary: 'Learn how people exchange value.',
  overview: 'Sales begins with understanding a need.',
  concepts: ['Needs', 'Value'],
  sources: [{ title: 'Foundation', url: 'https://example.org/foundation' }],
  startHere: [
    { resourceId: 'one', reason: 'Start with a definition.' },
    { resourceId: 'two', reason: 'See the practice.' },
    { resourceId: 'three', reason: 'Connect the ideas.' },
  ],
  sections: [
    {
      id: 'foundations',
      resources: [
        {
          id: 'one',
          title: 'One',
          url: 'https://example.org/one',
          source: 'Example',
          why: 'Why one.',
          verified: '2026-10-02',
        },
        {
          id: 'two',
          title: 'Two',
          url: 'https://example.org/two',
          source: 'Example',
          why: 'Why two.',
          verified: '2026-10-02',
        },
        {
          id: 'three',
          title: 'Three',
          url: 'https://example.org/three',
          source: 'Example',
          why: 'Why three.',
          verified: '2026-10-02',
        },
      ],
    },
    ...[
      'books',
      'youtube',
      'podcasts',
      'open-lectures',
      'courses',
      'blogs',
      'creators',
      'communities',
      'screen',
    ].map((id) => ({
      id,
      resources: [],
      omissionReason: 'Not part of this focused test fixture.',
    })),
  ],
};

test('topic search matches titles and aliases without case or whitespace sensitivity', () => {
  const catalog = createCatalog([topic]);

  assert.deepEqual(
    catalog.search('  SELLING  ').map(({ id }) => id),
    ['sales'],
  );
  assert.deepEqual(
    catalog.search('  ').map(({ id }) => id),
    ['sales'],
  );
  assert.deepEqual(catalog.search('painting'), []);
});

test('partial search returns each matching topic once for the chooser', () => {
  const secondTopic = {
    ...structuredClone(topic),
    id: 'sales-strategy',
    title: 'Sales Strategy',
    aliases: ['sales planning'],
  };
  const catalog = createCatalog([topic, secondTopic]);

  assert.deepEqual(
    catalog.search(' sale ').map(({ id }) => id),
    ['sales', 'sales-strategy'],
  );
});

test('catalog rejects unsafe links, invalid dates, incomplete categories, and broken path references', () => {
  const unsafeLink = structuredClone(topic);
  unsafeLink.sections[0].resources[0].url = 'javascript:alert(1)';
  assert.throws(() => createCatalog([unsafeLink]), /must use HTTPS/u);

  const invalidDate = structuredClone(topic);
  invalidDate.sections[0].resources[0].verified = '2026-02-30';
  assert.throws(() => createCatalog([invalidDate]), /real date/u);

  const shortSection = structuredClone(topic);
  shortSection.sections[0].resources.pop();
  assert.throws(
    () => createCatalog([shortSection]),
    /exactly three resources/u,
  );

  const brokenPath = structuredClone(topic);
  brokenPath.startHere[0].resourceId = 'missing';
  assert.throws(
    () => createCatalog([brokenPath]),
    /references missing resource/u,
  );
});

test('catalog rejects title and alias collisions between topics', () => {
  const secondTopic = {
    ...structuredClone(topic),
    id: 'another-topic',
    title: 'Another Topic',
    aliases: [' SELLING '],
  };

  assert.throws(
    () => createCatalog([topic, secondTopic]),
    /ambiguous title or alias/u,
  );
});

test('catalog rejects the same linked resource being counted in multiple categories', () => {
  const duplicateUrl = structuredClone(topic);
  delete duplicateUrl.sections[1].omissionReason;
  duplicateUrl.sections[1].resources = topic.sections[0].resources.map(
    (resource, index) => ({ ...resource, id: `reused-${index}` }),
  );

  assert.throws(() => createCatalog([duplicateUrl]), /duplicate resource URL/u);
});

test('every launch topic has ten complete categories and three unique starting resources', () => {
  const catalog = createCatalog(topics);

  assert.equal(topics.length, 5);
  assert.deepEqual(
    catalog.search('LLM').map(({ id }) => id),
    ['large-language-models'],
  );

  for (const entry of topics) {
    assert.equal(entry.sections.length, 10, entry.title);
    for (const section of entry.sections) {
      assert.ok(
        section.resources.length === 3 ||
          (section.resources.length === 0 && section.omissionReason),
        `${entry.title}: ${section.id}`,
      );
    }
    assert.equal(
      new Set(entry.startHere.map(({ resourceId }) => resourceId)).size,
      3,
    );
  }
});
