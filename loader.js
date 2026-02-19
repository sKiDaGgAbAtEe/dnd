/**
 * ═══════════════════════════════════════════════════════════════
 *  DND PARTY LOADER  ·  loader.js
 *  Reads party.json and injects values into any character page
 *  using data-path attributes on HTML elements.
 * ═══════════════════════════════════════════════════════════════
 *
 *  USAGE:
 *  1. Add a <script> tag at the bottom of any character page:
 *       <script src="/dnd/party.json" data-character="sekhmet"></script>
 *       <script src="/dnd/loader.js"></script>
 *
 *     OR use the data-character attribute on <body>:
 *       <body data-character="sekhmet">
 *
 *  2. Tag any element with data-path to bind it to the JSON:
 *       <span data-path="combat.hp.current">17</span>
 *       <span data-path="abilities.STR.score">16</span>
 *       <span data-path="abilities.STR.mod">+3</span>
 *
 *  3. Special data attributes:
 *       data-path         = dot-notation path into character object
 *       data-path-class   = adds/removes "filled"/"proficient" class
 *                           based on boolean at that path
 *       data-path-list    = generates child elements from an array
 *       data-path-toggle  = toggles visibility based on truthiness
 *
 *  HOW IT WORKS:
 *  - On page load, fetches /dnd/party.json (relative to site root)
 *  - Detects which character to load from data-character attribute
 *  - Walks the DOM for all data-path* elements and injects values
 *  - Falls back gracefully: if JSON fails, hardcoded values remain
 *
 * ═══════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  // ── CONFIG ──────────────────────────────────────────────────
  // Adjust this path if party.json lives elsewhere in your repo.
  // For GitHub Pages at username.github.io/dnd/, use '/dnd/party.json'
  // For local dev, '../party.json' may work better.
  const JSON_PATH = (() => {
    // Auto-detect: if we're in a /dnd/ subpath, adjust accordingly
    const path = window.location.pathname;
    if (path.includes('/dnd/')) {
      // We're inside the /dnd/ directory structure
      // Go up to /dnd/ root to find party.json
      const dndRoot = path.substring(0, path.indexOf('/dnd/') + 5);
      return dndRoot + 'party.json';
    }
    // Fallback: assume party.json is in the same directory or one up
    return './party.json';
  })();

  // ── DETECT CHARACTER ────────────────────────────────────────
  function detectCharacter() {
    // Priority 1: <body data-character="sekhmet">
    const bodyAttr = document.body.getAttribute('data-character');
    if (bodyAttr) return bodyAttr.toLowerCase();

    // Priority 2: <script data-character="sekhmet">
    const scripts = document.querySelectorAll('script[data-character]');
    for (const s of scripts) {
      const val = s.getAttribute('data-character');
      if (val) return val.toLowerCase();
    }

    // Priority 3: Infer from URL  /characters/sekhmet.html → "sekhmet"
    const match = window.location.pathname.match(/\/([a-z_-]+?)(?:[_ ]?textsheet)?\.html$/i);
    if (match) return match[1].toLowerCase();

    console.warn('[Loader] Could not detect character name. Add data-character attribute.');
    return null;
  }

  // ── RESOLVE DOT PATH ────────────────────────────────────────
  function resolvePath(obj, path) {
    return path.split('.').reduce((acc, key) => {
      if (acc === undefined || acc === null) return undefined;
      return acc[key];
    }, obj);
  }

  // ── INJECT VALUES ───────────────────────────────────────────
  function inject(charData) {
    // data-path: Set text content
    document.querySelectorAll('[data-path]').forEach(el => {
      const path = el.getAttribute('data-path');
      const value = resolvePath(charData, path);
      if (value !== undefined && value !== null) {
        el.textContent = String(value);
      }
    });

    // data-path-html: Set innerHTML (for formatted content)
    document.querySelectorAll('[data-path-html]').forEach(el => {
      const path = el.getAttribute('data-path-html');
      const value = resolvePath(charData, path);
      if (value !== undefined && value !== null) {
        el.innerHTML = String(value);
      }
    });

    // data-path-class: Toggle CSS class based on boolean
    // Usage: <div data-path-class="skills.Athletics.proficient" data-class="filled">
    document.querySelectorAll('[data-path-class]').forEach(el => {
      const path = el.getAttribute('data-path-class');
      const className = el.getAttribute('data-class') || 'filled';
      const value = resolvePath(charData, path);
      if (value) {
        el.classList.add(className);
      } else {
        el.classList.remove(className);
      }
    });

    // data-path-attr: Set an attribute value from JSON
    // Usage: <div data-path-attr="combat.hp.current" data-attr-name="title">
    document.querySelectorAll('[data-path-attr]').forEach(el => {
      const path = el.getAttribute('data-path-attr');
      const attrName = el.getAttribute('data-attr-name');
      const value = resolvePath(charData, path);
      if (value !== undefined && attrName) {
        el.setAttribute(attrName, String(value));
      }
    });

    // data-path-toggle: Show/hide element based on truthiness
    document.querySelectorAll('[data-path-toggle]').forEach(el => {
      const path = el.getAttribute('data-path-toggle');
      const value = resolvePath(charData, path);
      el.style.display = value ? '' : 'none';
    });

    // data-path-list: Generate list items from an array
    // Usage: <div data-path-list="equipment" data-list-class="equip-item">
    document.querySelectorAll('[data-path-list]').forEach(el => {
      const path = el.getAttribute('data-path-list');
      const itemClass = el.getAttribute('data-list-class') || '';
      const arr = resolvePath(charData, path);
      if (Array.isArray(arr)) {
        el.innerHTML = '';
        arr.forEach(item => {
          const div = document.createElement('div');
          if (itemClass) div.className = itemClass;
          div.textContent = typeof item === 'string' ? item : JSON.stringify(item);
          el.appendChild(div);
        });
      }
    });

    console.log(`[Loader] ✓ Injected data for "${charData.name}"`);
  }

  // ── MAIN ────────────────────────────────────────────────────
  async function main() {
    const charKey = detectCharacter();
    if (!charKey) return;

    try {
      const resp = await fetch(JSON_PATH);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
      const data = await resp.json();

      const charData = data.characters?.[charKey];
      if (!charData) {
        console.warn(`[Loader] Character "${charKey}" not found in party.json`);
        return;
      }

      inject(charData);

    } catch (err) {
      // Graceful fallback: hardcoded values in HTML remain visible
      console.warn(`[Loader] Could not load party.json — using hardcoded values.`, err.message);
    }
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
  } else {
    main();
  }

})();
