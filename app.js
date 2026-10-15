'use strict';
(() => {
  const reta = document.body.dataset.compound === 'retatrutide';
  const suppliers = reta ? globalThis.RETATRUTIDE_DATA : globalThis.PARAXANTHINE_DATA.suppliers;
  const byId = id => document.getElementById(id);
  const node = (tag, text, className) => {
    const element = document.createElement(tag);
    if (text !== undefined && text !== null) element.textContent = String(text);
    if (className) element.className = className;
    return element;
  };
  const icon = name => {
    const paths = {
      warning: '<path d="M8 2 14 13H2L8 2Z"/><path d="M8 6v3m0 2v.1"/>',
      download: '<path d="M8 2v8m-3-3 3 3 3-3M3 11v3h10v-3"/>'
    };
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    for (const [key, value] of Object.entries({viewBox:'0 0 16 16', width:'14', height:'14', fill:'none', stroke:'currentColor', 'stroke-width':'1.2', 'aria-hidden':'true'})) svg.setAttribute(key, value);
    svg.innerHTML = paths[name] || '';
    return svg;
  };
  let toastTimer;
  function toast(message) {
    byId('toast').textContent = message;
    byId('toast').classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => byId('toast').classList.remove('show'), 3500);
  }
  const statuses = {new:'Not contacted', contacted:'Responded', replied:'In conversation', ordered:'Shipped', dead:'Dead'};
  let notes = Object.create(null);
  if (reta) {
    try {
      const saved = JSON.parse(localStorage.getItem('reta_notes') || '{}');
      if (saved && typeof saved === 'object' && !Array.isArray(saved)) Object.assign(notes, saved);
      const updated = localStorage.getItem('reta_notes_updated');
      if (updated) byId('lastSaved').textContent = `Last saved: ${updated}`;
    } catch { toast('Saved notes could not be read in this browser. You can import a notes export.'); }
  }
  const entryFor = supplier => notes[supplier.domain] || {};
  const statusFor = supplier => entryFor(supplier).status || (['contacted', 'dead'].includes(supplier.outreach_status) ? supplier.outreach_status : 'new');
  function saveNotes() {
    try {
      const updated = new Date().toLocaleString();
      localStorage.setItem('reta_notes', JSON.stringify(notes));
      localStorage.setItem('reta_notes_updated', updated);
      byId('lastSaved').textContent = `Last saved: ${updated}`;
    } catch { toast('Your browser could not save these notes. Export a copy to keep them.'); }
  }
  function updateNote(supplier, key, value) {
    notes[supplier.domain] = {...entryFor(supplier), [key]:value, updated:new Date().toISOString()};
    saveNotes();
  }
  function badge(text, style = '') { return node('span', text, `badge ${style}`); }
  function pair(list, label, value, className = '') {
    if (value === undefined || value === null || value === '') return;
    const group = node('div');
    group.append(node('dt', label), node('dd', value, className));
    list.append(group);
  }
  function link(label, rawUrl) {
    try {
      const url = new URL(rawUrl);
      if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return null;
      const element = node('a', label);
      element.href = url.href;
      element.target = '_blank';
      element.rel = 'noopener noreferrer';
      element.title = url.href;
      return element;
    } catch { return null; }
  }
  function addLinks(parent, sources) {
    sources.forEach(source => {
      const element = link(source.label, source.url);
      if (element) parent.append(element);
    });
  }
  function disclosure(label, className) {
    const details = node('details', undefined, className);
    details.append(node('summary', label));
    return details;
  }
  function workingNotes(supplier, index) {
    const details = disclosure('Working notes', 'record-details');
    const editor = node('div', undefined, 'note-editor');
    const statusLabel = node('label', undefined, 'field');
    statusLabel.append(node('span', 'Contact status', 'field-label'));
    const select = node('select');
    select.id = `status-${index}`;
    select.dataset.status = supplier.domain;
    Object.entries(statuses).forEach(([value, text]) => {
      const option = node('option', text); option.value = value; select.append(option);
    });
    select.value = statusFor(supplier);
    select.addEventListener('change', () => { updateNote(supplier, 'status', select.value); render(); toast('Contact status saved.'); });
    statusLabel.append(select);
    const noteLabel = node('label', undefined, 'field');
    noteLabel.append(node('span', `Notes for ${supplier.domain}`, 'field-label'));
    const textarea = node('textarea');
    textarea.dataset.notes = supplier.domain;
    textarea.placeholder = 'Add a follow-up, conversation detail or reminder…';
    textarea.value = entryFor(supplier).notes || '';
    textarea.addEventListener('change', () => updateNote(supplier, 'notes', textarea.value));
    noteLabel.append(textarea);
    const shippingLabel = node('label', undefined, 'check');
    const checkbox = node('input'); checkbox.type = 'checkbox'; checkbox.checked = entryFor(supplier).noChinaShipping === true;
    checkbox.addEventListener('change', () => { updateNote(supplier, 'noChinaShipping', checkbox.checked); render(); toast('Shipping note saved.'); });
    shippingLabel.append(checkbox, document.createTextNode('Mark as not shipping to China'));
    editor.append(statusLabel, noteLabel, shippingLabel, node('p', 'Saved in this browser. Export notes to keep a backup or move them to another device.', 'note-help'));
    details.append(editor);
    return details;
  }
  function supplierCard(supplier, index) {
    const card = node('article', undefined, `record${reta && supplier.domain === 'aurobiopeptide.com' ? ' featured' : ''}`);
    card.dataset.supplier = reta ? supplier.domain : supplier.id;
    const top = node('div', undefined, 'record-top');
    const provenance = reta ? (supplier.source === 'janoshik' ? 'Janoshik registry' : supplier.source === 'discovery' ? 'Supplier discovery' : 'Research record') : (supplier.source_type === 'marketplace' ? 'Marketplace listing' : 'Supplier website');
    top.append(node('span', `NO. ${String(index + 1).padStart(2, '0')}`, 'record-number'), node('span', provenance, 'record-source'));
    card.append(top, node('h3', supplier.company || supplier.domain));
    const location = node('p', supplier.location || 'Location not recorded', `record-location${reta ? ' compact-text' : ''}`);
    location.title = supplier.location || '';
    card.append(location);
    if (reta) {
      const domain = link(supplier.domain, `https://${supplier.domain}`);
      if (domain) { domain.className = 'record-domain'; card.append(domain); }
    }
    const badges = node('div', undefined, 'badges');
    if (reta) {
      if (supplier.domain === 'aurobiopeptide.com') badges.append(badge('Featured record'));
      if (supplier.china_based) badges.append(badge(supplier.china_confirmed ? 'China-based · confirmed' : 'China-based · likely'));
      if (supplier.test_count > 0) badges.append(badge(`${supplier.test_count} Janoshik test${supplier.test_count === 1 ? '' : 's'}`, 'neutral'));
      const status = statusFor(supplier);
      if (status !== 'new') badges.append(badge(statuses[status] || status, status === 'dead' ? 'danger' : 'neutral'));
      if (supplier.outreach_status === 'scam') badges.append(badge('Scam flagged in research', 'danger'));
      if (entryFor(supplier).noChinaShipping) badges.append(badge('No China shipping · your note', 'danger'));
    } else {
      badges.append(badge(supplier.document_status, supplier.warning ? 'warning' : supplier.has_coa ? '' : 'neutral'));
      if (supplier.restriction_tags.includes('research')) badges.append(badge('Research / non-consumption', 'warning'));
    }
    if (badges.childElementCount) card.append(badges);
    const facts = node('dl', undefined, 'record-facts');
    if (reta) {
      pair(facts, 'Recorded purity / tests', supplier.purity ? `${supplier.purity}%` : supplier.test_count > 0 ? `${supplier.test_count} test records` : 'Not recorded');
      pair(facts, 'Listed price', supplier.prices && supplier.prices !== '—' ? supplier.prices : 'Request a quote / not listed', 'compact-text');
    } else {
      pair(facts, 'Specification · supplier claim', supplier.purity);
      pair(facts, 'MOQ / packaging', supplier.moq);
    }
    card.append(facts);
    if (reta) {
      const shipping = entryFor(supplier).noChinaShipping ? 'Marked as not shipping to China in your notes.' : supplier.ships_to_china === true ? 'Ships to China: recorded as available.' : supplier.ships_to_china === false ? 'Ships to China: recorded as unavailable.' : 'China shipping: not established.';
      const moq = supplier.moq && supplier.moq !== '—' ? ` MOQ: ${supplier.moq}` : '';
      card.append(node('p', shipping + moq, 'restriction'));
    } else {
      card.append(node('p', supplier.restriction, 'restriction'));
      if (supplier.warning) {
        const warning = node('p', undefined, 'record-warning'); warning.append(icon('warning'), node('span', supplier.warning)); card.append(warning);
      }
    }
    const details = disclosure(reta ? 'View full research record' : 'View research details', 'record-details');
    const list = node('dl');
    if (reta) {
      for (const [label, key] of [['Location', 'location'], ['Location evidence', 'location_evidence'], ['Listed prices', 'prices'], ['Price notes', 'price_notes'], ['MOQ / packaging', 'moq'], ['Certification claims', 'certs'], ['Shipping', 'shipping_notes'], ['Outreach', 'outreach_detail'], ['Payment', 'payment'], ['Other products', 'other_products'], ['Research notes', 'notes'], ['Shared test batch', 'batch_group'], ['Related domain', 'related_domain'], ['Relationship note', 'relationship_note'], ['Source classification', 'source']]) pair(list, label, supplier[key]);
      const contact = [supplier.email, supplier.whatsapp, supplier.wechat ? `WeChat: ${supplier.wechat}` : '', supplier.telegram].filter(Boolean).join('\n');
      pair(list, 'Contact', contact || 'Not recorded');
      if (supplier.source_urls?.length) {
        const group = node('div'); group.append(node('dt', 'Recorded sources'));
        const dd = node('dd', undefined, 'source-links');
        addLinks(dd, supplier.source_urls.map((url, n) => ({label:`Source ${String(n + 1).padStart(2, '0')}`, url})));
        group.append(dd); list.append(group);
      }
    } else {
      pair(list, 'Grade claim', supplier.grade);
      pair(list, 'Documentation', supplier.documentation);
      pair(list, 'Evidence limits', supplier.caveat);
    }
    details.append(list); card.append(details);
    if (reta) card.append(workingNotes(supplier, index));
    const footer = node('div', undefined, 'record-footer');
    const sources = node('div', undefined, 'source-links');
    addLinks(sources, reta ? [{label:'Supplier website', url:`https://${supplier.domain}`}] : supplier.sources);
    footer.append(sources, node('span', reta ? 'RESEARCH RECORD' : 'PUBLIC SOURCE'));
    card.append(footer);
    return card;
  }
  const searchCache = new Map(suppliers.map(s => [s, Object.values(s).filter(value => typeof value === 'string').join(' ').toLowerCase()]));
  function matches(supplier) {
    const query = byId('search').value.trim().toLowerCase();
    if (query && !(searchCache.get(supplier) + (reta ? ` ${entryFor(supplier).notes || ''}`.toLowerCase() : '')).includes(query)) return false;
    if (reta) {
      if (byId('chinaOnly').checked && !supplier.china_based) return false;
      if (byId('shipChinaOnly').checked && (!supplier.ships_to_china || entryFor(supplier).noChinaShipping)) return false;
      if (byId('statusFilter').value && statusFor(supplier) !== byId('statusFilter').value) return false;
      if (byId('sourceFilter').value === 'janoshik' && supplier.source !== 'janoshik') return false;
      if (byId('sourceFilter').value === 'other' && supplier.source === 'janoshik') return false;
    } else {
      if (byId('evidence').value !== 'all' && supplier.source_type !== byId('evidence').value) return false;
      if (byId('restriction').value !== 'all' && !supplier.restriction_tags.includes(byId('restriction').value)) return false;
      if (byId('documents').checked && !supplier.has_coa) return false;
    }
    return true;
  }
  let reverseSort = false;
  function updateSortDirection() {
    const sort = byId('sort').value;
    const descending = ['tests','china'].includes(sort) !== reverseSort;
    byId('sortDirection').textContent = descending ? '↓' : '↑';
    byId('sortDirection').disabled = sort === 'original';
    byId('sortDirection').setAttribute('aria-label', descending ? 'Sort ascending' : 'Sort descending');
    byId('sortDirection').setAttribute('aria-pressed', String(descending));
  }
  function render() {
    const sort = byId('sort').value;
    const filtered = suppliers.filter(matches);
    if (sort !== 'original') filtered.sort((a,b) => {
      if (sort === 'tests') return (b.test_count || 0) - (a.test_count || 0);
      if (sort === 'china') return Number(Boolean(b.china_based)) - Number(Boolean(a.china_based));
      const key = sort === 'company' && reta ? 'domain' : sort;
      return String(a[key] || '').localeCompare(String(b[key] || ''), 'en');
    });
    if (reverseSort && sort !== 'original') filtered.reverse();
    byId('records').replaceChildren(...filtered.map(s => supplierCard(s, suppliers.indexOf(s))));
    byId('count').textContent = `${filtered.length} of ${suppliers.length} records`;
    byId('empty').hidden = filtered.length !== 0;
  }
  const metrics = reta ? [
    ['Supplier records', suppliers.length], ['China-based suppliers', suppliers.filter(s => s.china_based).length],
    ['With Janoshik tests', suppliers.filter(s => s.test_count > 0).length], ['With listed prices', suppliers.filter(s => s.prices && !['—','RFQ',''].includes(s.prices)).length]
  ] : [
    ['Suppliers in China', suppliers.length], ['Public COA / result examples', suppliers.filter(s => s.has_coa).length],
    ['Research / non-consumption restrictions', suppliers.filter(s => s.restriction_tags.includes('research')).length], ['Independent batch tests', globalThis.PARAXANTHINE_DATA.independent_batch_tests]
  ];
  metrics.forEach(([label,value], index) => {
    const metric = node('div', undefined, 'metric');
    const top = node('div', undefined, 'metric-top');
    top.append(node('span', String(value).padStart(2,'0'), 'metric-value'), node('span', `/ 0${index + 1}`, 'metric-index'));
    metric.append(top, node('p', label, 'metric-label')); byId('stats').append(metric);
  });
  const filterIds = reta ? ['search','chinaOnly','shipChinaOnly','statusFilter','sourceFilter'] : ['search','evidence','restriction','documents'];
  filterIds.forEach(id => byId(id).addEventListener(id === 'search' ? 'input' : 'change', render));
  byId('sort').addEventListener('change', () => { reverseSort = false; updateSortDirection(); render(); });
  byId('sortDirection').addEventListener('click', () => { reverseSort = !reverseSort; updateSortDirection(); render(); });
  function resetFilters() {
    HTMLFormElement.prototype.reset.call(byId('filters'));
    byId('sort').value = reta ? 'original' : 'company';
    reverseSort = false;
    updateSortDirection();
    render();
  }
  byId('reset').addEventListener('click', resetFilters);
  byId('emptyReset').addEventListener('click', resetFilters);
  document.querySelectorAll('[data-view-button]').forEach(button => button.addEventListener('click', () => {
    byId('records').dataset.view = button.dataset.viewButton;
    document.querySelectorAll('[data-view-button]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  }));
  function download(content, filename, type = 'application/json') {
    const url = URL.createObjectURL(new Blob([content], {type}));
    const anchor = node('a'); anchor.href = url; anchor.download = filename;
    document.body.append(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }
  byId('export').addEventListener('click', () => {
    const data = reta ? notes : {...globalThis.PARAXANTHINE_DATA, suppliers:suppliers.filter(matches)};
    download(JSON.stringify(data,null,2) + '\n', reta ? 'reta-notes-export.json' : 'paraxanthine-public-reference.json');
    toast(reta ? 'Notes exported.' : 'Filtered reference exported.');
  });
  if (reta) {
    byId('import').addEventListener('click', () => byId('importFile').click());
    byId('importFile').addEventListener('change', async event => {
      const file = event.target.files[0]; if (!file) return;
      try {
        const imported = JSON.parse(await file.text());
        if (!imported || typeof imported !== 'object' || Array.isArray(imported)) throw new Error('Choose a notes JSON object.');
        let count = 0;
        for (const [domain,value] of Object.entries(imported)) {
          if (value && typeof value === 'object' && !Array.isArray(value)) { notes[domain] = value; count++; }
        }
        saveNotes(); render(); toast(`Imported ${count} note entries.`);
      } catch (error) { toast(`Import failed: ${error.message}`); }
      event.target.value = '';
    });
    byId('clearNotes').addEventListener('click', () => {
      if (!confirm('Delete all saved notes and statuses in this browser? Export a backup first. This cannot be undone.')) return;
      notes = Object.create(null); saveNotes(); render(); toast('Saved notes cleared.');
    });
    byId('downloadHtml').addEventListener('click', async () => {
      const button = byId('downloadHtml'); button.disabled = true;
      try {
        const copy = document.documentElement.cloneNode(true);
        copy.querySelector('#records').replaceChildren();
        copy.querySelector('#stats').replaceChildren();
        copy.querySelector('#toast').textContent = '';
        copy.querySelector('#lastSaved').textContent = '';
        copy.querySelector('#downloadHtml').removeAttribute('disabled');
        const assets = [...copy.querySelectorAll('link[rel="stylesheet"], script[src]')];
        const replacements = await Promise.all(assets.map(async asset => {
          const script = asset.tagName === 'SCRIPT';
          const response = await fetch(new URL(asset.getAttribute(script ? 'src' : 'href'), location.href));
          if (!response.ok) throw new Error(`Asset unavailable: ${response.status}`);
          const replacement = node(script ? 'script' : 'style');
          replacement.textContent = (await response.text()).replace(/<\/script/gi, '<\\/script');
          return {asset, replacement, script};
        }));
        replacements.forEach(({asset, replacement, script}) => {
          if (script) { asset.remove(); copy.querySelector('body').append(replacement); }
          else asset.replaceWith(replacement);
        });
        download('<!doctype html>\n' + copy.outerHTML, 'retatrutide-suppliers.html', 'text/html');
        toast('Standalone HTML downloaded. Export notes separately to keep your working notes.');
      } catch { toast('Download could not finish. Check your connection and try again.'); }
      finally { button.disabled = false; }
    });
  }
  updateSortDirection();
  render();
})();
