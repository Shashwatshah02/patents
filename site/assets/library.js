const form = document.querySelector('#filters');
const query = document.querySelector('#query');
const caseFilter = document.querySelector('#case-filter');
const stageFilter = document.querySelector('#stage-filter');
const results = document.querySelector('#results');
const empty = document.querySelector('#empty');
const rows = [...document.querySelectorAll('[data-document]')].map((row) => ({
  row,
  terms: (row.firstElementChild.textContent + ' ' +
    caseFilter.querySelector('option[value="' + row.dataset.case + '"]').textContent).toLowerCase(),
}));

function updateDocuments() {
  const words = query.value.toLowerCase().trim().split(/\s+/);
  let count = 0;
  for (const { row, terms } of rows) {
    const matches = (!caseFilter.value || row.dataset.case === caseFilter.value)
      && (!stageFilter.value || row.dataset.stage === stageFilter.value)
      && words.every((word) => terms.includes(word));
    row.hidden = !matches;
    count += Number(matches);
  }
  results.textContent = count === 1 ? '1 document' : count + ' documents';
  empty.hidden = count > 0;
}

form.addEventListener('submit', (event) => event.preventDefault());
form.addEventListener('input', updateDocuments);
form.hidden = false;
updateDocuments();
