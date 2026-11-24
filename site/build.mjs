import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cases, photo } from './catalog.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = join(root, 'dist');
const githubRepository = 'https://github.com/Shashwatshah02/patents';
const patentPortal = 'https://ipindia.gov.in/pages/patents/e-services/track-status';
const designPortal = 'https://search.ipindia.gov.in/DesignApplicationStatus/';
const esc = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));
const caseUrl = (id) => '/cases/' + id + '/';
const libraryUrl = '/documents/';
const allDocuments = cases.flatMap((record) => record.documents.map((doc) => ({ record, doc })));

function page(title, description, content, current = '') {
  const navigation = [
    ['Cases', '/#cases', 'cases'],
    ['Timeline', caseUrl(cases[0].id) + '#timeline', 'timeline'],
    ['Documents', libraryUrl, 'documents'],
  ];
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${esc(description)}">
  <meta name="theme-color" content="#101e2c">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <title>${esc(title)}</title>
  <link rel="stylesheet" href="/assets/styles.css">
</head>
<body>
  <a class="skip" href="#main">Skip to content</a>
  <header class="top"><div class="wrap top-inner">
    <a class="brand" href="/">Shashwat Shah <span>Patent archive</span></a>
    <nav aria-label="Main navigation">${navigation.map(([label, url, key]) => `<a href="${url}"${current === key ? ' aria-current="page"' : ''}>${label}</a>`).join('')}</nav>
  </div></header>
  <main id="main">${content}</main>
  <footer><div class="wrap footer-inner">
    <strong>Shashwat Shah · Patent archive</strong>
    <a href="${githubRepository}">Patent archive on GitHub</a>
  </div></footer>
</body>
</html>`;
}

function documents(entries, filtered = false) {
  return `<ul class="documents" id="document-list">${entries.map(({ record, doc: [slug, label, stage, note] }) => `
    <li data-document data-case="${record.id}" data-stage="${esc(stage)}">
      <div><strong id="${slug}">${esc(label)}</strong><div class="meta">
      ${filtered ? `<a href="${caseUrl(record.id)}">${record.id}</a> · ` : ''}${esc(stage)}${note ? ' · ' + esc(note) : ''}</div></div>
    </li>`).join('')}</ul>`;
}

async function write(relativePath, html) {
  const target = join(output, relativePath, 'index.html');
  await mkdir(join(target, '..'), { recursive: true });
  await writeFile(target, html);
}

const home = page('Patent Archive | Shashwat Shah', 'Explore patent applications, design documentation and examination records for robotics and pipeline inspection.', `
  <section class="hero"><div class="wrap hero-grid">
    <div class="hero-copy">
      <p class="eyebrow">Robotics · Pipeline inspection · Mechanical design</p>
      <h1>Patent<br>archive<span>.</span></h1>
      <p class="intro">Explore the inventions, drawings and filing history behind three pipeline robotics and mechanical design records.</p>
      <div class="actions"><a class="button primary" href="#cases">Browse cases</a><a class="button secondary" href="${libraryUrl}">Browse the document index</a></div>
    </div>
    <figure><img src="/assets/pipeline-robot.jpg" alt="Pipeline robot prototype with a wheeled chassis, sensors and exposed wiring" width="1280" height="960"><figcaption>Pipeline traversing robot prototype · 202521045231</figcaption></figure>
  </div></section>
  <section class="wrap section" id="cases" aria-labelledby="cases-title">
    <div class="section-heading"><h2 id="cases-title">Cases</h2><span>${cases.length} records</span></div>
    <div class="case-grid">${cases.map((record) => `<article class="case-card">
      <p class="eyebrow">${record.type} <span>·</span> ${record.id}</p>
      <h3><a href="${caseUrl(record.id)}">${esc(record.title)}</a></h3>
      <p>${esc(record.summary)}</p>
      ${record.hearingUpdate ? `<a class="hearing-link" href="${caseUrl(record.id)}#hearing-update">Second hearing · <time datetime="${record.hearingUpdate.date}">${record.hearingUpdate.label}</time></a>` : ''}
      <a class="case-link" href="${caseUrl(record.id)}" aria-label="View case ${record.id}">View case</a>
    </article>`).join('')}</div>
    <p class="archive-note">Use each case’s reference number on the official IP India portal to check the current status and find available filing documents.</p>
  </section>`);

await rm(output, { recursive: true, force: true });
await cp(join(root, 'site/assets'), join(output, 'assets'), { recursive: true });
await cp(join(root, photo), join(output, 'assets/pipeline-robot.jpg'));
await write('', home);

for (const record of cases) {
  const update = record.hearingUpdate;
  const isDesign = record.type === 'Design record';
  const portal = isDesign ? designPortal : patentPortal;
  const timeline = record.timeline ? `<section id="timeline" class="section wrap" aria-labelledby="timeline-title">
    <div class="section-heading"><h2 id="timeline-title">Filing timeline</h2></div>
    <ol class="timeline">${record.timeline.map(([date, label, title, description, slug]) => `<li>
      <time datetime="${date}">${label}</time><div><h3>${esc(title)}</h3><p>${esc(description)}</p>
      ${slug ? `<a href="#${slug}">${esc(record.documents.find(([id]) => id === slug)[1])}</a>` : ''}</div>
    </li>`).join('')}
    ${update ? `<li><time datetime="${update.date}">${update.label}</time><div><h3>${esc(update.title)}</h3><p>Scheduled date following the adjournment request.</p></div></li>` : ''}</ol>
  </section>` : '';
  await write('cases/' + record.id, page(record.title + ' | Patent Archive', record.summary, `
    <section class="subhero"><div class="wrap">
      <a class="back" href="/#cases">All cases</a><p class="eyebrow">${record.type} · ${record.id}</p>
      <h1>${esc(record.title)}</h1><p class="intro">${esc(record.summary)}</p>
      <div class="actions"><a class="button primary" href="#case-documents">Browse case documents</a>${timeline ? '<a class="button secondary" href="#timeline">Filing timeline</a>' : ''}</div>
    </div></section>
    ${update ? `<aside class="wrap hearing-note" id="hearing-update" aria-labelledby="hearing-title">
      <h2 id="hearing-title">${esc(update.title)}</h2>
      <p>${esc(update.description)}</p>
    </aside>` : ''}
    ${timeline}
    <section class="section wrap" id="case-documents" aria-labelledby="case-documents-title">
      <div class="section-heading"><h2 id="case-documents-title">Case documents</h2><span>${record.documents.length} listed</span></div>
      <p class="portal-note">This list summarizes selected submissions. To check the official record and download available documents, search IP India using ${isDesign ? 'design reference' : 'application number'} <strong>${record.id}</strong>. <a href="${portal}">${isDesign ? 'Open IP India Design Application Status' : 'Open IP India Patent Application Status'}</a></p>
      ${documents(record.documents.map((doc) => ({ record, doc })))}
    </section>`));
}

await write('documents', page('Document Index | Patent Archive', 'Search the index of selected patent and design submissions.', `
  <section class="subhero"><div class="wrap">
    <a class="back" href="/#cases">All cases</a>
    <h1>Document index</h1><p class="intro">Find abstracts, specifications, claims, drawings and hearing materials by title, case or filing stage.</p>
  </div></section>
  <section class="wrap section library" aria-label="Browse documents">
    <p class="portal-note">This index lists selected submissions. To download available documents, use the reference number shown for each entry on the official IP India portal. <a href="${patentPortal}">Patent application lookup</a> · <a href="${designPortal}">Design application lookup</a></p>
    <form id="filters" class="filters" role="search" hidden>
      <label for="query">Search documents<input type="search" id="query" placeholder="Try claims or 202521045231" autocomplete="off"></label>
      <label for="case-filter">Case<select id="case-filter"><option value="">All cases</option>${cases.map(({ id, title }) => `<option value="${id}">${id} · ${esc(title)}</option>`).join('')}</select></label>
      <label for="stage-filter">Stage<select id="stage-filter"><option value="">All stages</option>${[...new Set(allDocuments.map(({ doc }) => doc[2]))].sort().map((stage) => `<option>${esc(stage)}</option>`).join('')}</select></label>
    </form>
    <p class="results meta" id="results" role="status">${allDocuments.length} documents</p>
    ${documents(allDocuments, true)}
    <p id="empty" hidden>No documents match. Try a different search or clear a filter.</p>
  </section>
  <script src="/assets/library.js" defer></script>`, 'documents'));
