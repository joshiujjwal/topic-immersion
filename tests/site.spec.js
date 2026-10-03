import { expect, test } from '@playwright/test';

test('the home page offers a labeled search and the five curated topic choices', async ({
  page,
}) => {
  await page.goto('./');

  await expect(
    page.getByRole('heading', { name: 'Learn a subject from the ground up.' }),
  ).toBeVisible();
  await expect(
    page.getByRole('searchbox', { name: 'Search topics' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sales' })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Business Strategy' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Large Language Models' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Violin' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Painting' })).toBeVisible();
});

test('selecting Sales reveals its first-principles guide and a three-card resource section', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Explore Sales' }).click();

  await expect(
    page.getByRole('heading', { name: 'Sales', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'First principles' }),
  ).toBeVisible();
  await expect(
    page.getByText(
      'At its simplest, a sale is an agreement to exchange something of value.',
    ),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Start here' })).toBeVisible();
  await expect(
    page.getByRole('navigation', { name: 'In this guide' }).getByRole('link'),
  ).toHaveCount(9);
  await expect(page.locator('#section-foundations .resource-card')).toHaveCount(
    3,
  );
});

test('an unknown search clears the selected topic and offers a reset', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Explore Sales' }).click();
  await page
    .getByRole('searchbox', { name: 'Search topics' })
    .fill('brain-computer interfaces');
  await page.getByRole('button', { name: 'Explore', exact: true }).click();

  await expect(
    page.getByRole('heading', {
      name: 'That topic is not in this collection yet.',
    }),
  ).toBeVisible();
  await expect(page.locator('.resource-card')).toHaveCount(0);
  await page.getByRole('button', { name: 'Browse all five topics' }).click();
  await expect(
    page.getByRole('button', { name: 'Explore Painting' }),
  ).toBeVisible();
});

test('an LLM alias resolves to the curated topic and keeps navigation within the Pages prefix', async ({
  page,
}) => {
  const requestedPaths = [];
  page.on('request', (request) => {
    requestedPaths.push(new URL(request.url()).pathname);
  });

  await page.goto('./');
  await page.getByRole('searchbox', { name: 'Search topics' }).fill('  LLM  ');
  await page.getByRole('button', { name: 'Explore', exact: true }).click();

  await expect(
    page.getByRole('heading', { name: 'Large Language Models', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Open lectures' }),
  ).toBeVisible();
  expect(requestedPaths).toContain('/topic-immersion/styles.css');
  expect(requestedPaths).toContain('/topic-immersion/app.js');
  expect(requestedPaths).toContain('/topic-immersion/data/topics.json');
});

test('an ambiguous partial search presents distinct topic choices', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByRole('searchbox', { name: 'Search topics' }).fill('ing');
  await page.getByRole('button', { name: 'Explore', exact: true }).click();

  await expect(
    page.getByRole('button', { name: 'Explore Sales' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Explore Violin' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Explore Painting' }),
  ).toBeVisible();
  await expect(page.locator('.topic-card')).toHaveCount(3);
});

test('the failed catalog load shows an actionable retry', async ({ page }) => {
  await page.route('**/data/topics.json', (route) => route.abort());
  await page.goto('./');

  await expect(
    page
      .getByRole('alert')
      .getByRole('heading', { name: 'The collection could not be loaded.' }),
  ).toBeVisible();
  await page.unroute('**/data/topics.json');
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(
    page.getByRole('button', { name: 'Explore Sales' }),
  ).toBeVisible();
});

test('loading the catalog shows a visible status and disables search until topics are ready', async ({
  page,
}) => {
  let releaseRequest;
  const gate = new Promise((resolve) => {
    releaseRequest = resolve;
  });
  await page.route('**/data/topics.json', async (route) => {
    await gate;
    await route.continue();
  });
  await page.goto('./');

  try {
    await expect(
      page.getByText('Loading the curated collection…'),
    ).toBeVisible();
    await expect(
      page.getByRole('searchbox', { name: 'Search topics' }),
    ).toBeDisabled();
    await expect(
      page.getByRole('button', { name: 'Explore', exact: true }),
    ).toBeDisabled();
  } finally {
    releaseRequest();
  }
  await expect(
    page.getByRole('button', { name: 'Explore Sales' }),
  ).toBeVisible();
  await expect(
    page.getByRole('searchbox', { name: 'Search topics' }),
  ).toBeEnabled();
  await expect(page.getByText('Loading the curated collection…')).toBeHidden();
});

test('malformed catalog JSON is announced and can be retried', async ({
  page,
}) => {
  await page.route('**/data/topics.json', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '{',
    }),
  );
  await page.goto('./');

  await expect(
    page
      .getByRole('alert')
      .getByRole('heading', { name: 'The collection could not be loaded.' }),
  ).toBeVisible();
  await page.unroute('**/data/topics.json');
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(
    page.getByRole('button', { name: 'Explore Sales' }),
  ).toBeVisible();
});

for (const [name, response] of [
  ['a non-success catalog response', { status: 503, body: 'Unavailable' }],
  ['structurally invalid catalog data', { status: 200, body: '[]' }],
]) {
  test(`should show a retryable error when receiving ${name}`, async ({
    page,
  }) => {
    await page.route('**/data/topics.json', (route) =>
      route.fulfill({ ...response, contentType: 'application/json' }),
    );
    await page.goto('./');
    await expect(page.getByRole('alert')).toContainText(
      'The collection could not be loaded.',
    );
    await expect(
      page.getByRole('button', { name: 'Explore', exact: true }),
    ).toBeDisabled();
    await page.unroute('**/data/topics.json');
    await page.getByRole('button', { name: 'Try again' }).click();
    await expect(page.locator('.topic-card')).toHaveCount(5);
  });
}

test('should return to the full unselected collection when submitting an empty query', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Explore Sales' }).click();
  await page.getByRole('searchbox', { name: 'Search topics' }).fill('  ');
  await page.getByRole('button', { name: 'Explore', exact: true }).click();
  await expect(page.locator('.topic-card')).toHaveCount(5);
  await expect(page.locator('.resource-card')).toHaveCount(0);
});

test('untrusted search text is not rendered as executable markup', async ({
  page,
}) => {
  await page.goto('./');
  await page
    .getByRole('searchbox', { name: 'Search topics' })
    .fill('<img src=x onerror=alert(1)>');
  await page.getByRole('button', { name: 'Explore', exact: true }).click();

  await expect(
    page.getByRole('heading', {
      name: 'That topic is not in this collection yet.',
    }),
  ).toBeVisible();
  await expect(page.locator('img')).toHaveCount(0);
});

test('all five topics have three valid starting steps and three picks per populated section', async ({
  page,
}) => {
  await page.goto('./');
  const titles = [
    'Sales',
    'Business Strategy',
    'Large Language Models',
    'Violin',
    'Painting',
  ];

  for (const title of titles) {
    await page.getByRole('button', { name: `Explore ${title}` }).click();
    await expect(
      page.getByRole('heading', { name: title, exact: true }),
    ).toBeVisible();
    await expect(page.locator('.path-step')).toHaveCount(3);
    await expect(page.locator('.path-resource')).toHaveCount(3);

    const resourceSections = page.locator('.resource-section');
    await expect(resourceSections).toHaveCount(
      title === 'Business Strategy' ? 10 : 9,
    );
    for (const section of await resourceSections.all()) {
      await expect(section.locator('.resource-card')).toHaveCount(3);
    }

    for (const link of await page.locator('.path-resource').all()) {
      const fragment = await link.getAttribute('href');
      await expect(page.locator(fragment)).toHaveCount(1);
    }

    await page.getByRole('button', { name: '← All topics' }).click();
  }
});

test('should preserve readable layout at double text size across the five topics', async ({
  page,
}) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto('./');
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });

  for (const title of [
    'Sales',
    'Business Strategy',
    'Large Language Models',
    'Violin',
    'Painting',
  ]) {
    await page.getByRole('button', { name: `Explore ${title}` }).click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.getByRole('button', { name: '← All topics' }).click();
  }
});

test('topic browsing remains keyboard accessible and does not overflow a narrow viewport', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('./');
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('link', { name: 'Skip to content' }),
  ).toBeFocused();
  await page.getByRole('button', { name: 'Explore Painting' }).click();

  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await expect(
    page.getByRole('heading', { name: 'Painting', exact: true }),
  ).toBeVisible();
});

test('resource review dates meet the normal-text contrast threshold', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Explore Sales' }).click();

  const contrast = await page
    .locator('.resource-verified')
    .first()
    .evaluate((note) => {
      const luminance = (color) => {
        const rgb = color
          .match(/[\d.]+/g)
          .slice(0, 3)
          .map(Number);
        return rgb.reduce((sum, channel, index) => {
          const value = channel / 255;
          const linear =
            value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
          return sum + linear * [0.2126, 0.7152, 0.0722][index];
        }, 0);
      };
      const foreground = luminance(getComputedStyle(note).color);
      const background = luminance(
        getComputedStyle(note.closest('article')).backgroundColor,
      );
      return (
        (Math.max(foreground, background) + 0.05) /
        (Math.min(foreground, background) + 0.05)
      );
    });
  expect(contrast).toBeGreaterThanOrEqual(4.5);
});
