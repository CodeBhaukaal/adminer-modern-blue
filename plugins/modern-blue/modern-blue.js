// Adminer Modern Blue – progressive enhancements and Motion animations
// ES2015 only, the page stays fully usable without this file
'use strict';

(function () {
	const doc = document;
	const body = doc.body;
	const root = doc.documentElement;
	const strings = window.mbStrings || {};
	const reduced = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
	const Motion = (!reduced && window.Motion && window.Motion.animate ? window.Motion : null);
	const ease = [0.22, 1, 0.36, 1];

	if (!body || !body.classList.contains('mb')) {
		root.classList.remove('mb-preload');
		return;
	}

	/** Get translated string
	* @param {string} key
	* @return {string}
	*/
	function t(key) {
		return strings[key] || key;
	}

	/** Get direct children of an element matching a selector
	* @param {HTMLElement} el
	* @param {string} selector
	* @return {HTMLElement[]}
	*/
	function children(el, selector) {
		return Array.prototype.filter.call(el ? el.children : [], child => child.matches(selector));
	}

	/** Create an element
	* @param {string} tag
	* @param {Object} [attrs]
	* @param {string} [text]
	* @return {HTMLElement}
	*/
	function el(tag, attrs, text) {
		const node = doc.createElement(tag);
		for (const key in attrs || {}) {
			node.setAttribute(key, attrs[key]);
		}
		if (text != null) {
			node.textContent = text;
		}
		return node;
	}

	/** Run Motion animate() if available
	* @return {?Object} animation controls
	*/
	function animate(target, keyframes, options) {
		if (!Motion || !target || (target.length === 0)) {
			return null;
		}
		try {
			return Motion.animate(target, keyframes, options);
		} catch (e) {
			return null;
		}
	}

	/** Get Motion stagger() delay or a fixed delay without Motion */
	function stagger(step, options) {
		return (Motion && Motion.stagger ? Motion.stagger(step, options) : 0);
	}

	const content = doc.getElementById('content');
	const menu = doc.getElementById('menu');
	const breadcrumb = doc.getElementById('breadcrumb');
	const heading = content && children(content, 'h2')[0];
	const isLogin = body.classList.contains('mb-login');

	/** Find the links printed right below the heading */
	function leadingLinks() {
		for (let node = heading && heading.nextElementSibling; node; node = node.nextElementSibling) {
			if (node.matches('p.links')) {
				return node;
			}
			if (!node.matches('#ajaxstatus, script, .message, .error')) {
				return null;
			}
		}
		return null;
	}

	/** Build the top bar: breadcrumb on the left, actions on the right */
	function setupTopbar() {
		if (!breadcrumb) {
			return;
		}
		// wrap the last part of the breadcrumb (plain text) to highlight it
		const last = breadcrumb.lastChild;
		if (last && last.nodeType === 3 && last.textContent.trim() !== '') {
			const span = el('span', {'class': 'mb-crumb-current'}, last.textContent.trim());
			breadcrumb.replaceChild(span, last);
		}
		// the crumbs shrink with an ellipsis so that the actions always fit
		const crumbs = el('span', {'class': 'mb-crumbs'});
		while (breadcrumb.firstChild) {
			crumbs.appendChild(breadcrumb.firstChild);
		}
		breadcrumb.appendChild(crumbs);
		const actions = el('span', {'class': 'mb-actions'});
		const links = leadingLinks();
		if (links && links.querySelector('a[href*="select="]') && links.querySelector('a[href*="table="]')) {
			// table pages: Select data, Show structure, Alter table, New item
			children(links, 'a').forEach(a => actions.appendChild(a));
			links.remove();
		} else {
			children(qsMenuLinks(), 'a').forEach(a => {
				const clone = a.cloneNode(true);
				clone.removeAttribute('id');
				actions.appendChild(clone);
			});
			body.classList.toggle('mb-menu-in-topbar', actions.children.length > 0 && body.classList.contains('mb-in-db'));
		}
		if (actions.children.length) {
			breadcrumb.appendChild(actions);
		}
	}

	/** Get the links of the menu (SQL command, Import, Export, Create table) */
	function qsMenuLinks() {
		return menu ? children(menu, 'p.links')[0] : null;
	}

	/** Promote the main create action next to the heading */
	function setupCta() {
		if (!heading) {
			return;
		}
		let source = null;
		if (body.classList.contains('mb-page-server')) {
			const links = leadingLinks();
			source = links && links.querySelector('a[href$="&database="]');
		} else if (body.classList.contains('mb-page-db')) {
			source = content.querySelector('p.links a[href$="&create="]') || doc.querySelector('#menu p.links a[href$="&create="]');
		}
		if (source) {
			const cta = el('a', {'href': source.getAttribute('href'), 'class': 'mb-btn mb-cta'}, source.textContent);
			heading.appendChild(cta);
		}
	}

	/** Filter rows of a list by text
	* @param {HTMLInputElement} input
	* @param {HTMLElement[]} rows
	* @param {function(HTMLElement): string} getText
	* @param {?HTMLElement} counter
	*/
	function bindFilter(input, rows, getText, counter) {
		const texts = rows.map(row => getText(row).toLowerCase());
		const update = () => {
			const needle = input.value.trim().toLowerCase();
			let shown = 0;
			rows.forEach((row, i) => {
				const match = (needle === '' || texts[i].indexOf(needle) !== -1);
				row.hidden = !match;
				shown += match;
			});
			if (counter) {
				counter.textContent = (needle === '' ? '' : shown + ' / ' + rows.length);
			}
		};
		input.addEventListener('input', update);
		input.addEventListener('keydown', event => {
			if (event.key === 'Escape' && input.value !== '') {
				input.value = '';
				update();
				event.stopPropagation();
			}
		});
		if (input.value !== '') {
			update();
		}
	}

	/** Filter of the table list in the sidebar */
	function setupSidebarFilter() {
		const input = doc.getElementById('mb-table-filter');
		const list = doc.getElementById('tables');
		if (input && list) {
			bindFilter(input, children(list, 'li'), li => (li.querySelector('a:not(.select), span') || li).textContent, null);
		}
	}

	/** Search box above the list of databases or tables */
	function setupListFilter() {
		let table = null;
		let placeholder = '';
		if (body.classList.contains('mb-page-server')) {
			table = content.querySelector('form table.checkable');
			placeholder = t('Search databases…');
		} else if (body.classList.contains('mb-page-db')) {
			table = content.querySelector('#tables-views ~ form table.checkable');
			placeholder = t('Search tables…');
		}
		const tbody = table && table.tBodies[0];
		if (!tbody) {
			return;
		}
		const rows = Array.prototype.filter.call(tbody.rows, row => !!row.querySelector('input[type="checkbox"]'));
		if (rows.length < 2) {
			return;
		}
		const toolbar = el('div', {'class': 'mb-toolbar'});
		const wrap = el('span', {'class': 'mb-search'});
		const input = el('input', {'type': 'search', 'placeholder': placeholder, 'aria-label': placeholder, 'autocomplete': 'off'});
		const counter = el('span', {'class': 'mb-count', 'aria-live': 'polite'});
		wrap.appendChild(input);
		toolbar.appendChild(wrap);
		toolbar.appendChild(counter);
		const form = table.closest('form');
		form.parentNode.insertBefore(toolbar, form);
		bindFilter(input, rows, row => {
			const name = row.querySelector('th');
			return (name ? name.textContent : row.textContent);
		}, counter);
	}

	/** Create an icon button
	* @param {string} kind edit, copy, delete, browse, structure, insert, alter, empty, drop
	* @param {string} label
	* @param {string} [href]
	* @return {HTMLElement}
	*/
	function tool(kind, label, href) {
		const node = el(href ? 'a' : 'button', {'class': 'mb-tool mb-tool-' + kind, 'title': label, 'aria-label': label});
		if (href) {
			node.setAttribute('href', href);
		} else {
			node.type = 'button';
			// the click on a row would toggle its checkbox
			node.addEventListener('click', event => event.stopPropagation());
		}
		node.appendChild(el('span', {}, label));
		return node;
	}

	/** Check only one row of a checkable table and press a submit button of its form, Adminer asks for confirmation itself
	* @param {HTMLTableRowElement} row
	* @param {HTMLInputElement} button
	*/
	function actOnRow(row, button) {
		const table = row.closest('table');
		Array.prototype.forEach.call(table.querySelectorAll('tbody input[type="checkbox"]'), input => {
			const want = (input.closest('tr') === row);
			if (input.checked !== want) {
				input.click(); // updates the highlighting and the counters
			}
		});
		const all = button.form.querySelector('input[name="all"][type="checkbox"]');
		if (all && all.checked) {
			all.click();
		}
		button.click();
	}

	/** Browse, Structure, Insert, Alter, Empty and Drop on every row of the table list */
	function setupRowActions() {
		if (!body.classList.contains('mb-page-db')) {
			return;
		}
		const table = content.querySelector('#tables-views ~ form table.checkable');
		if (!table || !table.tHead || !table.tBodies[0]) {
			return;
		}
		const form = table.closest('form');
		const truncate = form.querySelector('input[name="truncate"]');
		const drop = form.querySelector('input[name="drop"]');
		table.tHead.rows[0].appendChild(el('th', {'class': 'mb-tools-head'}, t('Action')));
		Array.prototype.forEach.call(table.tBodies[0].rows, row => {
			const cell = el('td', {'class': 'mb-row-tools'});
			const structure = row.querySelector('th a[href*="table="], th a[href*="view="]');
			const checkbox = row.querySelector('input[type="checkbox"]');
			if (structure && checkbox) {
				const href = structure.getAttribute('href');
				const isView = /[?&]view=/.test(href) || checkbox.name === 'views[]';
				const base = href.replace(/([?&])(table|view)=/, '$1table=');
				cell.appendChild(tool('browse', t('Browse'), base.replace(/([?&])table=/, '$1select=')));
				cell.appendChild(tool('structure', t('Structure'), base));
				if (!isView) {
					cell.appendChild(tool('insert', t('Insert'), base.replace(/([?&])table=/, '$1edit=')));
					cell.appendChild(tool('alter', t('Alter'), base.replace(/([?&])table=/, '$1create=')));
					cell.appendChild(tool('export', t('Export'), base.replace(/([?&])table=/, '$1dump=')));
					if (truncate) {
						const empty = tool('empty', t('Empty'));
						empty.addEventListener('click', () => actOnRow(row, truncate));
						cell.appendChild(empty);
					}
				}
				if (drop) {
					const remove = tool('drop', t('Drop'));
					remove.addEventListener('click', () => actOnRow(row, drop));
					cell.appendChild(remove);
				}
			}
			row.appendChild(cell);
		});
	}

	/** Edit, Copy and Delete buttons on every row of the select page and editing a cell by double click */
	function setupSelectRowTools() {
		const table = content && content.querySelector('table#table');
		if (!table || !table.tHead || !table.tBodies[0]) {
			return;
		}
		const form = table.closest('form');
		const clone = form.querySelector('input[name="clone"]');
		const remove = form.querySelector('input[name="delete"]');
		const editable = !!form.querySelector('#save');
		table.tHead.rows[0].appendChild(el('th', {'class': 'mb-tools-head'}, t('Action')));
		Array.prototype.forEach.call(table.tBodies[0].rows, row => {
			const cell = el('td', {'class': 'mb-row-tools'});
			const edit = row.querySelector('a.edit');
			if (edit) {
				edit.classList.add('mb-tool', 'mb-tool-edit');
				edit.title = t('Edit');
				cell.appendChild(tool('edit', t('Edit'), edit.getAttribute('href')));
				if (clone) {
					const copy = tool('copy', t('Copy'));
					copy.addEventListener('click', () => actOnRow(row, clone));
					cell.appendChild(copy);
				}
				if (remove) {
					const del = tool('delete', t('Delete'));
					del.addEventListener('click', () => actOnRow(row, remove));
					cell.appendChild(del);
				}
			}
			row.appendChild(cell);
		});
		if (editable) {
			// Adminer edits a cell by Ctrl+click, a double click is easier to discover
			table.addEventListener('dblclick', event => {
				const td = event.target.closest('td[id^="val["]');
				if (td && !td.querySelector('input, textarea') && !event.target.closest('a')) {
					getSelection().removeAllRanges();
					td.dispatchEvent(new MouseEvent('click', {bubbles: true, cancelable: true, ctrlKey: true, metaKey: true}));
				}
			});
			const hint = el('p', {'class': 'mb-hint'}, t('Tip: double-click a cell to edit it, then press Save.'));
			const scrollable = table.closest('.scrollable') || table;
			scrollable.parentNode.insertBefore(hint, scrollable);
		}
	}

	/** Turn the sections of the table structure page into tabs */
	function setupTabs() {
		if (!body.classList.contains('mb-page-table') || !heading) {
			return;
		}
		const firstTable = children(content, '.scrollable, table')[0];
		const sections = children(content, 'div').filter(div => div.firstElementChild && div.firstElementChild.matches('h3[id]'));
		if (!firstTable || !sections.length) {
			return;
		}
		const panels = [];
		const columns = el('div', {'class': 'mb-tabpanel', 'id': 'mb-columns'});
		firstTable.parentNode.insertBefore(columns, firstTable);
		// move the column table and everything up to the first section into the first panel
		while (columns.nextSibling && columns.nextSibling !== sections[0]) {
			columns.appendChild(columns.nextSibling);
		}
		const columnCount = (columns.querySelector('tbody') ? columns.querySelector('tbody').rows.length : 0);
		panels.push({panel: columns, label: t('Columns'), count: columnCount, id: 'mb-columns'});
		sections.forEach(section => {
			const h3 = section.firstElementChild;
			const rows = section.querySelectorAll('table tr');
			const count = Array.prototype.filter.call(rows, row => !row.parentNode.matches('thead')).length;
			section.classList.add('mb-tabpanel');
			panels.push({panel: section, label: h3.textContent, count: count, id: h3.id});
		});
		const tabs = el('div', {'class': 'mb-tabs', 'role': 'tablist'});
		const indicator = el('span', {'class': 'mb-tab-indicator', 'aria-hidden': 'true'});
		panels.forEach(item => {
			const a = el('a', {'href': '#' + item.id, 'role': 'tab', 'aria-controls': item.panel.id || item.id});
			a.appendChild(doc.createTextNode(item.label));
			if (item.count) {
				a.appendChild(el('span', {'class': 'mb-tab-count'}, String(item.count)));
			}
			item.panel.setAttribute('role', 'tabpanel');
			item.tab = a;
			tabs.appendChild(a);
		});
		tabs.appendChild(indicator);
		columns.parentNode.insertBefore(tabs, columns);

		let current = null;
		const select = (item, animated) => {
			if (current === item) {
				return;
			}
			current = item;
			panels.forEach(other => {
				const selected = (other === item);
				other.panel.hidden = !selected;
				other.tab.setAttribute('aria-selected', selected);
				other.tab.tabIndex = (selected ? 0 : -1);
			});
			const left = item.tab.offsetLeft;
			const width = item.tab.offsetWidth;
			if (animated && Motion) {
				animate(indicator, {left: left + 'px', width: width + 'px'}, {type: 'spring', stiffness: 420, damping: 34});
				animate(item.panel, {opacity: [0, 1], y: [8, 0]}, {duration: 0.3, ease: ease});
				animateRows(item.panel);
			} else {
				indicator.style.left = left + 'px';
				indicator.style.width = width + 'px';
			}
		};
		tabs.addEventListener('click', event => {
			const a = event.target.closest('a[role="tab"]');
			if (a) {
				event.preventDefault();
				panels.forEach(item => item.tab === a && select(item, true));
				history.replaceState(null, '', a.getAttribute('href'));
			}
		});
		tabs.addEventListener('keydown', event => {
			const index = panels.indexOf(current);
			const step = (event.key === 'ArrowRight' ? 1 : (event.key === 'ArrowLeft' ? -1 : 0));
			if (step) {
				const next = panels[(index + step + panels.length) % panels.length];
				select(next, true);
				next.tab.focus();
				event.preventDefault();
			}
		});
		const hash = location.hash.slice(1);
		select(panels.filter(item => item.id === hash)[0] || panels[0], false);
		addEventListener('resize', () => {
			indicator.style.left = current.tab.offsetLeft + 'px';
			indicator.style.width = current.tab.offsetWidth + 'px';
		});
	}

	/** Style the page numbers of the select page */
	function setupPagination() {
		Array.prototype.forEach.call(content.querySelectorAll('.footer fieldset'), fieldset => {
			const items = children(fieldset, 'a, b');
			const numeric = items.filter(item => /^\d+$/.test(item.textContent.trim()));
			if (!numeric.length || numeric.length < items.length - 1) {
				return;
			}
			fieldset.classList.add('mb-pages');
			// the first page is printed as a plain number when it is the current one
			Array.prototype.slice.call(fieldset.childNodes).forEach(node => {
				if (node.nodeType === 3 && /^\s*1\s/.test(node.textContent)) {
					fieldset.insertBefore(el('span', {'class': 'mb-page-current'}, '1'), node);
					node.textContent = node.textContent.replace(/^\s*1/, '');
				}
			});
		});
	}

	/** Show the search and sort inputs of the select page directly in its toolbar */
	function setupSelectForm() {
		if (!body.classList.contains('mb-page-select')) {
			return;
		}
		['fieldset-search', 'fieldset-sort'].forEach(id => {
			const div = doc.getElementById(id);
			if (div) {
				div.classList.remove('hidden');
			}
		});
	}

	/** Line numbers next to the SQL editor, the textarea (or the editor of jush replacing it) stays untouched */
	function setupSqlGutter() {
		const textarea = content.querySelector('textarea.sqlarea');
		if (!textarea || textarea.closest('.mb-editor')) {
			return;
		}
		const editor = el('div', {'class': 'mb-editor'});
		const gutter = el('div', {'class': 'mb-gutter', 'aria-hidden': 'true'});
		textarea.parentNode.insertBefore(editor, textarea);
		editor.appendChild(gutter);
		editor.appendChild(textarea);
		let count = 0;
		const source = () => {
			const pre = editor.querySelector('pre.sqlarea, pre[contenteditable]'); // jush-textarea hides the textarea and edits a <pre>
			return (pre && pre.offsetParent ? pre : textarea);
		};
		const update = () => {
			const area = source();
			const text = (area === textarea ? textarea.value : area.innerText.replace(/\n$/, ''));
			const lines = Math.max(text.split('\n').length, 1);
			if (lines !== count) {
				count = lines;
				const numbers = [];
				for (let i = 1; i <= lines; i++) {
					numbers.push(i);
				}
				gutter.textContent = numbers.join('\n');
			}
			gutter.scrollTop = area.scrollTop;
		};
		editor.addEventListener('input', update);
		editor.addEventListener('keyup', update);
		editor.addEventListener('scroll', update, true);
		addEventListener('load', update);
		update();
	}

	/** Make failed queries obvious: red statement, red editor, error count and a shake */
	function setupErrors() {
		const errors = Array.prototype.slice.call(content.querySelectorAll('.error:not(.hidden)'));
		errors.forEach(error => {
			const prev = error.previousElementSibling;
			if (prev && prev.matches('pre')) {
				prev.classList.add('mb-failed'); // for browsers without :has()
			}
		});
		if (body.classList.contains('mb-page-sql')) {
			const editor = content.querySelector('.mb-editor');
			const failed = errors.filter(error => !error.closest('#ajaxstatus'));
			if (editor && failed.length) {
				editor.classList.add('mb-editor-error');
				editor.addEventListener('input', () => editor.classList.remove('mb-editor-error'), {once: true});
			}
			const executed = content.querySelectorAll('pre[id^="sql-"], #content > pre').length;
			// the summary listing the numbers of the failed statements is not another error
			const count = (content.querySelectorAll('pre.mb-failed').length || failed.length);
			if (heading && (count || executed)) {
				const chip = el('span', {'class': (count ? 'mb-error-count' : 'mb-ok-count')},
					(count ? '✕ ' + count + ' ' + t(count > 1 ? 'errors' : 'error') : '✓ ' + t('OK')));
				heading.appendChild(chip);
				animate(chip, {scale: [0.6, 1], opacity: [0, 1]}, {type: 'spring', stiffness: 400, damping: 15, delay: 0.25});
			}
		}
		animate(errors, {x: [0, -8, 8, -5, 5, -2, 0]}, {duration: 0.5, delay: 0.35, ease: 'easeInOut'});
		// red fields where the server reported an error of a single value
		Array.prototype.forEach.call(content.querySelectorAll('td .error'), error => {
			const cell = error.closest('td');
			const input = cell && cell.querySelector('input, select, textarea');
			if (input) {
				input.classList.add('mb-invalid');
			}
		});
	}

	/** A pill following the hovered table in the sidebar */
	function setupHoverPill() {
		const list = doc.getElementById('tables');
		if (!Motion || !list || !window.matchMedia || !matchMedia('(hover: hover)').matches) {
			return;
		}
		const pill = el('span', {'class': 'mb-hover-pill', 'aria-hidden': 'true'});
		list.insertBefore(pill, list.firstChild);
		let visible = false;
		list.addEventListener('mouseover', event => {
			const li = event.target.closest('li');
			if (!li || li.hidden) {
				return;
			}
			const keyframes = {y: li.offsetTop, height: li.offsetHeight};
			if (!visible) {
				animate(pill, keyframes, {duration: 0});
				keyframes.opacity = 1;
			}
			animate(pill, keyframes, {type: 'spring', stiffness: 500, damping: 38});
			visible = true;
		});
		list.addEventListener('mouseleave', () => {
			visible = false;
			animate(pill, {opacity: 0}, {duration: 0.15});
		});
	}

	/** Thin progress bar while the next page loads */
	function setupProgress() {
		if (!Motion) {
			return;
		}
		const bar = el('div', {'class': 'mb-progress', 'aria-hidden': 'true'});
		body.appendChild(bar);
		const start = () => {
			animate(bar, {scaleX: [0, 0.3, 0.7, 0.9]}, {duration: 3, ease: 'easeOut', times: [0, 0.1, 0.4, 1]});
		};
		doc.addEventListener('click', event => {
			const a = event.target.closest && event.target.closest('a[href]');
			if (a && !event.defaultPrevented && !event.ctrlKey && !event.metaKey && !event.shiftKey && event.button === 0
				&& !a.target && a.host === location.host && !/^#/.test(a.getAttribute('href')) && !a.matches('.toggle, [data-onclick], .jsonly')
			) {
				start();
			}
		});
		doc.addEventListener('submit', event => {
			// downloads and AJAX submissions never leave the page
			const form = event.target;
			if (!event.defaultPrevented && !(form.output && form.output.value === 'file') && !form.querySelector('[name="output"][value="file"]:checked, [name="output"][value="gz"]:checked')) {
				start();
			}
		});
		addEventListener('pageshow', () => animate(bar, {scaleX: 0}, {duration: 0}));
	}

	/** Ripple from the click point on buttons */
	function setupRipple() {
		if (!Motion) {
			return;
		}
		doc.addEventListener('pointerdown', event => {
			const target = event.target.closest && event.target.closest('.mb-btn, #content p.links a, .mb-actions a');
			if (!target) {
				return;
			}
			const rect = target.getBoundingClientRect();
			const size = Math.max(rect.width, rect.height) * 2;
			const ripple = el('span', {'class': 'mb-ripple'});
			ripple.style.width = ripple.style.height = size + 'px';
			ripple.style.left = (event.clientX - rect.left - size / 2) + 'px';
			ripple.style.top = (event.clientY - rect.top - size / 2) + 'px';
			if (!target.matches('.mb-btn')) {
				ripple.style.background = 'rgba(23, 105, 232, .18)';
			}
			target.appendChild(ripple);
			const animation = animate(ripple, {scale: [0, 1], opacity: [1, 0]}, {duration: 0.55, ease: 'easeOut'});
			if (animation) {
				animation.finished.then(() => ripple.remove(), () => ripple.remove());
			}
		});
	}

	/** Count numbers up from zero */
	function countUp(elements) {
		if (!Motion) {
			return;
		}
		Array.prototype.forEach.call(elements, node => {
			const target = parseInt(node.textContent, 10);
			if (!(target > 1) || target > 100000) {
				return;
			}
			animate(0, target, {duration: 0.8, ease: ease, delay: 0.2, onUpdate: value => {
				node.textContent = Math.round(value);
			}});
		});
	}

	/** Reveal sections lower on the page while scrolling */
	function setupScrollReveal() {
		if (!Motion || !Motion.inView) {
			return;
		}
		const sections = children(content, 'div:not(.mb-tabpanel):not(#ajaxstatus):not(#help):not(.mb-toolbar)').slice(1);
		sections.forEach(section => {
			if (section.getBoundingClientRect().top > innerHeight) {
				section.style.opacity = 0;
				Motion.inView(section, () => {
					const reveal = animate(section, {opacity: [0, 1], y: [16, 0]}, {duration: 0.45, ease: ease});
					if (reveal) {
						reveal.finished.then(() => section.style.transform = '');
					} else {
						section.style.opacity = '';
					}
				});
			}
		});
	}

	/** Let wide tables scroll inside their own box instead of widening the page */
	function wrapTables() {
		Array.prototype.forEach.call(content.querySelectorAll('table:not(.layout)'), table => {
			if (!table.closest('.scrollable, table.layout, #schema, .message, .error, td') && table.offsetParent) {
				const wrap = el('div', {'class': 'scrollable mb-wrap'});
				table.parentNode.insertBefore(wrap, table);
				wrap.appendChild(table);
			}
		});
	}

	/** Quick action cards on the server and database pages */
	function setupCards() {
		if (!body.classList.contains('mb-page-server') && !body.classList.contains('mb-page-db')) {
			return;
		}
		const links = leadingLinks();
		if (links) {
			links.classList.add('mb-cards');
			children(links, 'a').forEach(a => {
				const label = a.textContent;
				a.textContent = '';
				a.appendChild(el('span', {'class': 'mb-card-icon', 'aria-hidden': 'true'}));
				a.appendChild(el('span', {'class': 'mb-card-label'}, label));
			});
			animate(children(links, 'a'), {opacity: [0, 1], y: [12, 0], scale: [0.96, 1]}, {duration: 0.4, delay: stagger(0.05, {startDelay: 0.15}), ease: ease});
		}
	}

	/** Copy buttons on the executed SQL statements */
	function setupCopySql() {
		if (!navigator.clipboard) {
			return;
		}
		Array.prototype.forEach.call(content.querySelectorAll('#content > pre, #content > .message pre'), pre => {
			const code = pre.querySelector('code') || pre;
			const button = tool('copy', t('Copy'));
			button.classList.add('mb-copy-sql');
			button.addEventListener('click', () => {
				navigator.clipboard.writeText(code.textContent).then(() => {
					button.lastChild.textContent = '✓';
					setTimeout(() => button.lastChild.textContent = t('Copy'), 1200);
				}, () => {});
			});
			pre.classList.add('mb-has-copy');
			pre.appendChild(button);
		});
	}

	/** Read or write a value in localStorage, which may be unavailable */
	function store(key, value) {
		try {
			if (value === undefined) {
				return localStorage.getItem(key);
			}
			if (value === null) {
				localStorage.removeItem(key);
			} else {
				localStorage.setItem(key, value);
			}
		} catch (e) {
			// private mode or blocked storage, the choice lasts only for this page
		}
		return null;
	}

	// [id, name, sidebar, page, brand, line]
	const themes = [
		['ocean', 'Ocean Blue', '#132d50', '#f5f8fd', '#1769e8', '#dbe5f1'],
		['emerald', 'Emerald', '#0f2e26', '#f4faf7', '#059669', '#d3e7dd'],
		['violet', 'Violet', '#241a45', '#f7f5fd', '#7c3aed', '#e2dcf3'],
		['sunset', 'Sunset', '#3a1d10', '#fdf8f4', '#ea580c', '#f1e1d4'],
		['rose', 'Rose', '#3b1220', '#fdf6f8', '#e11d48', '#f1dbe1'],
		['graphite', 'Graphite', '#111827', '#f6f7f9', '#475569', '#e2e6ec'],
		['daylight', 'Daylight', '#ffffff', '#f5f8fd', '#1769e8', '#dbe5f1'],
		['midnight', 'Midnight (dark)', '#0a1120', '#0b1220', '#3b82f6', '#24324a'],
	];

	/** Apply a colour template */
	function applyTheme(id) {
		if (id && id !== 'ocean') {
			root.setAttribute('data-mb-theme', id);
		} else {
			root.removeAttribute('data-mb-theme');
		}
		const meta = doc.querySelector('meta[name="theme-color"]');
		const theme = themes.filter(item => item[0] === (id || 'ocean'))[0];
		if (meta && theme) {
			meta.content = theme[2];
		}
	}

	/** The palette button with the colour templates */
	function setupThemePicker() {
		const wrap = el('span', {'class': 'mb-theme-wrap'});
		const button = el('button', {'type': 'button', 'class': 'mb-theme-btn', 'title': t('Color theme'), 'aria-label': t('Color theme'), 'aria-haspopup': 'true', 'aria-expanded': 'false'});
		const menu = el('div', {'class': 'mb-theme-menu', 'role': 'dialog', 'aria-label': t('Color theme')});
		menu.hidden = true;
		menu.appendChild(el('p', {'class': 'mb-theme-title'}, t('Color theme')));
		const grid = el('div', {'class': 'mb-theme-grid', 'role': 'radiogroup'});
		const current = store('mb-theme') || 'ocean';
		themes.forEach(theme => {
			const option = el('button', {'type': 'button', 'class': 'mb-theme-option', 'role': 'radio', 'aria-checked': String(theme[0] === current), 'data-theme': theme[0]});
			option.style.setProperty('--sw-brand', theme[4]);
			option.style.setProperty('--sw-line', theme[5]);
			const swatch = el('span', {'class': 'mb-swatch'});
			const side = el('i');
			const page = el('i');
			side.style.background = theme[2];
			page.style.background = theme[3];
			swatch.appendChild(side);
			swatch.appendChild(page);
			option.appendChild(swatch);
			option.appendChild(doc.createTextNode(t(theme[1])));
			if (theme[0] === current) {
				option.appendChild(el('span', {'class': 'mb-theme-check'}));
			}
			grid.appendChild(option);
		});
		menu.appendChild(grid);
		menu.appendChild(el('p', {'class': 'mb-theme-note'}, t('Saved in this browser.')));
		wrap.appendChild(button);
		wrap.appendChild(menu);

		const toggle = open => {
			menu.hidden = !open;
			button.setAttribute('aria-expanded', open);
			if (open) {
				animate(menu, {opacity: [0, 1], scale: [0.94, 1], y: [-6, 0]}, {type: 'spring', stiffness: 420, damping: 30});
				animate(menu.querySelectorAll('.mb-theme-option'), {opacity: [0, 1], y: [6, 0]}, {duration: 0.25, delay: stagger(0.025)});
			}
		};
		button.addEventListener('click', event => {
			event.stopPropagation();
			toggle(menu.hidden);
		});
		menu.addEventListener('click', event => {
			event.stopPropagation();
			const option = event.target.closest('.mb-theme-option');
			if (!option) {
				return;
			}
			const id = option.getAttribute('data-theme');
			store('mb-theme', id === 'ocean' ? null : id);
			Array.prototype.forEach.call(grid.children, item => {
				const checked = (item === option);
				item.setAttribute('aria-checked', checked);
				const check = item.querySelector('.mb-theme-check');
				if (check && !checked) {
					check.remove();
				} else if (!check && checked) {
					item.appendChild(el('span', {'class': 'mb-theme-check'}));
				}
			});
			applyTheme(id);
			animate(body, {opacity: [0.85, 1]}, {duration: 0.35});
			animate(option.querySelector('.mb-theme-check'), {scale: [0, 1]}, {type: 'spring', stiffness: 500, damping: 18});
		});
		doc.addEventListener('click', () => !menu.hidden && toggle(false));
		doc.addEventListener('keydown', event => {
			if (event.key === 'Escape' && !menu.hidden) {
				toggle(false);
				button.focus();
			}
		});
		if (breadcrumb) {
			breadcrumb.appendChild(wrap);
		} else {
			body.appendChild(wrap);
		}
	}

	/** Section labels, recently opened tables, collapsing and the / shortcut in the sidebar */
	function setupSidebar() {
		if (!menu || isLogin) {
			return;
		}
		const label = (cls, text, count) => {
			const node = el('div', {'class': 'mb-sb-label ' + cls});
			node.appendChild(el('span', {}, text));
			if (count != null) {
				node.appendChild(el('span', {'class': 'mb-sb-count'}, String(count)));
			}
			return node;
		};
		const dbs = doc.getElementById('dbs');
		if (dbs) {
			menu.insertBefore(label('mb-sb-label-db', t(doc.querySelector('#dbs select[name="ns"]') ? 'Database & schema' : 'Database')), dbs.closest('form') || dbs);
		}
		const tools = children(menu, 'p.links')[0];
		if (tools) {
			menu.insertBefore(label('mb-sb-label-tools', t('Tools')), tools);
		}
		const list = doc.getElementById('tables');
		const filter = menu.querySelector('.mb-table-filter');
		if (list) {
			const items = children(list, 'li');
			const tablesLabel = label('mb-sb-label-tables', t('Tables'), items.length);
			menu.insertBefore(tablesLabel, filter || list);

			// recently opened tables of this database
			const key = 'mb-recent:' + location.pathname + ':' + (location.search.match(/[?&](server|pgsql|sqlite|mssql|oracle|elastic|mongo|clickhouse)=[^&]*/) || [''])[0] + ':' + dbName();
			let recent = [];
			try {
				recent = JSON.parse(store(key) || '[]');
			} catch (e) {
				recent = [];
			}
			const names = {};
			items.forEach(li => {
				const a = li.querySelector('a:not(.select)');
				if (a) {
					names[a.textContent] = li;
				}
			});
			const active = list.querySelector('a.active:not(.select)') || (list.querySelector('a.select.active') && list.querySelector('a.select.active').nextElementSibling);
			if (active && !body.classList.contains('mb-page-db')) {
				recent = [active.textContent].concat(recent.filter(name => name !== active.textContent)).slice(0, 5);
				store(key, JSON.stringify(recent));
			}
			const shown = recent.filter(name => names[name] && (!active || name !== active.textContent)).slice(0, 4);
			if (shown.length && items.length > 6) {
				const ul = el('ul', {'class': 'mb-recent'});
				shown.forEach(name => {
					const a = names[name].querySelector('a.select') || names[name].querySelector('a');
					const li = el('li');
					const link = el('a', {'href': a.getAttribute('href'), 'title': name});
					link.appendChild(doc.createTextNode(name));
					li.appendChild(link);
					ul.appendChild(li);
				});
				menu.insertBefore(label('mb-sb-label-recent', t('Recent')), tablesLabel);
				menu.insertBefore(ul, tablesLabel);
			}
			if (filter) {
				const hint = el('div', {'class': 'mb-sb-shortcut'});
				hint.appendChild(doc.createTextNode(t('Press') + ' '));
				hint.appendChild(el('kbd', {}, '/'));
				hint.appendChild(doc.createTextNode(' ' + t('to search tables')));
				menu.insertBefore(hint, list);
			}
		}
		// / focuses the table search
		doc.addEventListener('keydown', event => {
			const input = doc.getElementById('mb-table-filter');
			if (event.key === '/' && input && !event.ctrlKey && !event.metaKey && !event.altKey && !event.target.closest('input, textarea, select, [contenteditable]')) {
				event.preventDefault();
				if (innerWidth <= 800 && doc.getElementById('foot').classList.contains('foot')) {
					menuToggle();
				}
				root.classList.remove('mb-collapsed');
				input.focus();
				input.select();
			}
		});
		// collapse to an icon rail
		const h1 = menu.querySelector('h1');
		if (h1) {
			const collapse = el('button', {'type': 'button', 'class': 'mb-collapse-btn'});
			const sync = () => {
				const collapsed = root.classList.contains('mb-collapsed');
				const text = t(collapsed ? 'Expand sidebar' : 'Collapse sidebar');
				collapse.title = text;
				collapse.setAttribute('aria-label', text);
				collapse.setAttribute('aria-pressed', collapsed);
			};
			collapse.addEventListener('click', () => {
				const collapsed = root.classList.toggle('mb-collapsed');
				store('mb-collapsed', collapsed ? '1' : null);
				sync();
				if (!collapsed) {
					animate(menu.querySelectorAll('.mb-sb-label, #dbs, .mb-table-filter, #tables li, .mb-recent li'), {opacity: [0, 1], x: [-10, 0]}, {duration: 0.3, delay: stagger(0.02, {startDelay: 0.12})});
				}
			});
			sync();
			h1.appendChild(collapse);
		}
		// links in the icon rail need a tooltip
		Array.prototype.forEach.call(menu.querySelectorAll('.mb-nav a, p.links a'), a => {
			if (!a.title) {
				a.title = a.textContent.trim();
			}
		});
	}

	/** Name of the current database from the URL */
	function dbName() {
		const match = /[?&]db=([^&]*)/.exec(location.search);
		return (match ? decodeURIComponent(match[1].replace(/\+/g, ' ')) : '');
	}

	/** Animate the first rows of the tables in an element */
	function animateRows(scope) {
		if (!Motion || !scope) {
			return;
		}
		Array.prototype.forEach.call(scope.querySelectorAll('table'), table => {
			const rows = Array.prototype.slice.call(table.tBodies[0] ? table.tBodies[0].rows : [], 0, 24);
			if (rows.length > 1) {
				animate(rows, {opacity: [0, 1], y: [6, 0]}, {duration: 0.32, delay: stagger(0.018, {startDelay: 0.08}), ease: ease});
			}
		});
	}

	/** Entrance animations of the page */
	function animatePage() {
		if (!Motion) {
			root.classList.remove('mb-preload');
			return;
		}
		if (isLogin) {
			const card = content;
			const fields = Array.prototype.slice.call(content.querySelectorAll('.mb-login-head, table.layout tr, form > p, .error, .message'));
			const logo = content.querySelector('.mb-logo-mark');
			fields.forEach(field => field.style.opacity = 0);
			root.classList.remove('mb-preload');
			animate(card, {opacity: [0, 1], y: [24, 0], scale: [0.97, 1]}, {type: 'spring', stiffness: 260, damping: 26});
			animate(fields, {opacity: [0, 1], y: [10, 0]}, {duration: 0.45, delay: stagger(0.05, {startDelay: 0.12}), ease: ease});
			animate(logo, {scale: [0.4, 1], rotate: [-25, 0]}, {type: 'spring', stiffness: 320, damping: 14, delay: 0.15});
			return;
		}
		const blocks = children(content, ':not(#breadcrumb):not(#menuopen):not(script):not(#ajaxstatus):not(#help)').slice(0, 12);
		blocks.forEach(block => block.style.opacity = 0);
		root.classList.remove('mb-preload');
		const entrance = animate(blocks, {opacity: [0, 1], y: [10, 0]}, {duration: 0.4, delay: stagger(0.045), ease: ease});
		const cleanup = () => blocks.forEach(block => {
			// a transform would make the block a containing block of the sticky table headers
			block.style.opacity = '';
			block.style.transform = '';
		});
		if (entrance) {
			entrance.finished.then(cleanup, cleanup);
		} else {
			cleanup();
		}
		animateRows(content.querySelector('.mb-tabpanel:not([hidden])') || content);
		animate(content.querySelectorAll('.mb-actions a'), {opacity: [0, 1], y: [-6, 0]}, {duration: 0.3, delay: stagger(0.04, {startDelay: 0.1}), ease: ease});
		const cta = content.querySelector('.mb-cta');
		animate(cta, {scale: [0.85, 1], opacity: [0, 1]}, {type: 'spring', stiffness: 380, damping: 18, delay: 0.2});

		// the sidebar animates only once per browser session to not distract while navigating
		let seen = false;
		try {
			seen = !!sessionStorage.getItem('mb-sidebar');
			sessionStorage.setItem('mb-sidebar', 1);
		} catch (e) {
			seen = true;
		}
		if (!seen && menu && innerWidth > 800) {
			const items = menu.querySelectorAll('h1, .mb-nav a, p.links a, #dbs, .mb-table-filter, #tables li');
			animate(Array.prototype.slice.call(items, 0, 30), {opacity: [0, 1], x: [-14, 0]}, {duration: 0.4, delay: stagger(0.03), ease: ease});
		}
	}

	/** Animate messages added later by AJAX */
	function watchMessages() {
		const status = doc.getElementById('ajaxstatus');
		if (!Motion || !status || !window.MutationObserver) {
			return;
		}
		new MutationObserver(() => {
			if (status.firstElementChild && !status.classList.contains('hidden')) {
				animate(status.firstElementChild, {opacity: [0, 1], y: [-8, 0]}, {duration: 0.3, ease: ease});
			}
		}).observe(status, {childList: true});
	}

	/** Spring feedback of buttons and staggered items when opening the menu on small screens */
	function setupInteractions() {
		if (!Motion) {
			return;
		}
		doc.addEventListener('pointerdown', event => {
			const button = event.target.closest && event.target.closest('input[type="submit"], input[type="button"], .mb-btn, .mb-actions a, #content p.links a');
			if (button && !button.disabled) {
				animate(button, {scale: 0.96}, {duration: 0.08});
				const release = () => {
					animate(button, {scale: 1}, {type: 'spring', stiffness: 500, damping: 15});
					doc.removeEventListener('pointerup', release);
					doc.removeEventListener('pointercancel', release);
				};
				doc.addEventListener('pointerup', release);
				doc.addEventListener('pointercancel', release);
			}
		});
		const foot = doc.getElementById('foot');
		if (foot && window.MutationObserver) {
			new MutationObserver(() => {
				if (!foot.classList.contains('foot') && innerWidth <= 800) {
					const items = foot.querySelectorAll('h1, .mb-nav a, #menu p.links a, #dbs, .mb-table-filter, #tables li');
					animate(Array.prototype.slice.call(items, 0, 20), {opacity: [0, 1], x: [-16, 0]}, {duration: 0.3, delay: stagger(0.025, {startDelay: 0.08}), ease: ease});
				}
			}).observe(foot, {attributes: true, attributeFilter: ['class']});
		}
	}

	try {
		if (!isLogin && content) {
			wrapTables();
			setupTopbar();
			setupSidebar();
			setupCta();
			setupSidebarFilter();
			setupListFilter();
			setupRowActions();
			setupSelectRowTools();
			setupTabs();
			setupPagination();
			setupSelectForm();
			setupSqlGutter();
			setupCards();
			setupCopySql();
		}
		if (content) {
			if (!isLogin) {
				setupErrors();
				setupHoverPill();
				setupScrollReveal();
				countUp(content.querySelectorAll('.mb-tab-count'));
			}
			animatePage();
		}
		if (isLogin) {
			setupErrors();
		}
		setupThemePicker();
		setupProgress();
		setupRipple();
		watchMessages();
		setupInteractions();
	} finally {
		root.classList.remove('mb-preload');
	}
})();
