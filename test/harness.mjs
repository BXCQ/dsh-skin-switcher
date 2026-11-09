/**
 * Headless integration harness for the Skin Switcher client bundle.
 *
 * Loads client.js the way the Client runtime does (window.__ModuleLoader__) and
 * then exercises apply(), the panel's click handlers and the module's
 * persistence paths against fakes — everything except pixels.
 *
 * Run: node test/harness.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const root = path.resolve(here, '..');
const source = fs.readFileSync(path.join(root, 'client.js'), 'utf8');

const failures = [];
function check(label, condition, detail) {
  if (condition) {
    console.log('PASS  ' + label);
  } else {
    failures.push(label + (detail ? ' — ' + detail : ''));
    console.log('FAIL  ' + label + (detail ? ' — ' + detail : ''));
  }
}

function cookieJar(initial) {
  const jar = new Map();
  if (initial) {
    for (const part of initial.split(';')) {
      const [rawKey, ...rest] = part.trim().split('=');
      if (rawKey) jar.set(rawKey, rest.join('='));
    }
  }
  return {
    get cookie() {
      return [...jar].map(([key, value]) => `${key}=${value}`).join('; ');
    },
    set cookie(text) {
      const [pair] = String(text).split(';');
      const [key, ...rest] = pair.split('=');
      if (key) jar.set(key.trim(), rest.join('='));
    },
  };
}

/** Evaluate the bundle in a fresh closure scope, like a page load does. */
function bootstrap({ storage = {}, cookie = '' } = {}) {
  const state = {
    inserted: [],
    removed: [],
    overrides: [],
    overrideDisposers: [],
    registered: [],
    disposers: [],
    exports: undefined,
    storage: new Map(Object.entries(storage)),
  };
  const fakeReact = {
    createElement(type, props, ...children) {
      return { type, props: props || {}, children };
    },
    useState(initial) {
      return [typeof initial === 'function' ? initial() : initial, () => {}];
    },
    useEffect() {},
  };
  const fakeRequire = (name) => {
    if (name === 'react') return fakeReact;
    if (name === 'styles') {
      return {
        insert(css) {
          const token = { css };
          state.inserted.push(token);
          return () => state.removed.push(token);
        },
      };
    }
    if (name === 'console') return console;
    throw new Error('unexpected require: ' + name);
  };
  const documentObject = Object.assign(
    {
      createElement: () => ({ setAttribute() {}, appendChild() {}, textContent: '' }),
      head: { appendChild() {} },
    },
    { cookie: cookieJar(cookie).cookie },
  );
  // Keep the cookie jar live by routing reads/writes through it.
  const jar = cookieJar(cookie);
  Object.defineProperty(documentObject, 'cookie', {
    get: () => jar.cookie,
    set: (value) => {
      jar.cookie = value;
    },
  });
  const windowObject = {
    localStorage: {
      getItem: (key) => (state.storage.has(key) ? state.storage.get(key) : null),
      setItem: (key, value) => state.storage.set(key, value),
    },
    __ModuleLoader__: {
      load(definition) {
        if (definition.id !== '@local/dsh-skin-switcher') throw new Error('unexpected module id');
        state.exports = definition.factory(fakeRequire);
      },
    },
  };
  new Function('window', 'document', source)(windowObject, documentObject);
  state.window = windowObject;
  state.document = documentObject;
  return state;
}

function themeSnapshot(scheme) {
  return {
    preference: 'system',
    active: { id: scheme, colorScheme: scheme, tokens: {} },
    themes: [],
    fontSizes: {},
    fontFamilies: {},
    revision: 1,
  };
}

function makeCtx(state, { withTheme = true, scheme = 'light' } = {}) {
  const themeListeners = new Set();
  let currentScheme = scheme;
  const ctx = {
    locale: {
      register: () => () => {},
      bind: (ns) => (key) => ns + ':' + key,
      subscribe: () => () => {},
    },
    slots: {
      inject: (_key, register) => register(),
      register: (registration, component) => {
        state.registered.push({ registration, component });
        return () => {};
      },
    },
    on(name, listener) {
      if (name !== 'theme/change') throw new Error('unexpected event: ' + name);
      themeListeners.add(listener);
      return () => themeListeners.delete(listener);
    },
    /** Test-only: flip the color scheme and emit the theme event. */
    emitThemeChange(next) {
      currentScheme = next;
      for (const listener of Array.from(themeListeners)) listener(themeSnapshot(next));
    },
    effect(fn) {
      const dispose = fn();
      if (typeof dispose === 'function') state.disposers.push(dispose);
    },
  };
  if (withTheme) {
    ctx.theme = {
      getTheme: () => themeSnapshot(currentScheme),
      overrideTokens(source, tokens) {
        state.overrides.push({ source, tokens });
        return () => state.overrideDisposers.push(source);
      },
    };
  }
  return ctx;
}

function walkRendered(element, visit) {
  if (!element || typeof element !== 'object') return;
  visit(element);
  if (typeof element.type === 'function') {
    walkRendered(element.type(element.props || {}), visit);
    return;
  }
  for (const child of element.children || []) walkRendered(child, visit);
}

function findOccurrences(state, predicate) {
  const found = [];
  const entry = state.registered.find((item) => item.registration.name === 'main');
  walkRendered(entry.component({}), (node) => {
    if (predicate(node)) found.push(node);
  });
  return found;
}

const findCards = (state) => findOccurrences(state, (node) => node.props && node.props.skin);
const findReset = (state) =>
  findOccurrences(state, (node) => node.type === 'button' && node.props && node.props.className === 'dshsw-reset');

// ------------------------------------------------------------------------- //
// Scenario 1 — fresh install, then select, switch and reset                 //
// ------------------------------------------------------------------------- //

console.log('\n— scenario: first run, then switch and reset —');
const a = bootstrap();
check('bundle exported a plugin object', a.exports && typeof a.exports.apply === 'function');
check(
  'plugin declares slots, theme and locale as dependencies',
  JSON.stringify(a.exports.inject) === JSON.stringify(['slots', 'theme', 'locale']),
  JSON.stringify(a.exports.inject),
);

a.exports.apply(makeCtx(a));
check('two slots registered (sidebar entry + panel)', a.registered.length === 2, 'got ' + a.registered.length);

const sidebar = a.registered.find((entry) => entry.registration.name === 'sidebar.panellist');
const panelEntry = a.registered.find((entry) => entry.registration.name === 'main');
check('sidebar entry id is skin-switcher', sidebar && sidebar.registration.id === 'skin-switcher');
check('sidebar entry is a function icon component', sidebar && typeof sidebar.component === 'function');
check(
  'sidebar label resolves through the dictionary',
  sidebar &&
    typeof sidebar.registration.label === 'function' &&
    sidebar.registration.label() === 'skin-switcher:panel.label',
);
check('panel key matches the sidebar id', panelEntry && panelEntry.registration.key === 'skin-switcher');

const cards = findCards(a);
check('panel renders one card per skin', cards.length === 11, 'got ' + cards.length);
check('default state marks the stock look (no skin active)', cards.every((card) => card.props.active === false));
check('no theme override applied while the stock look is active', a.overrides.length === 0, 'got ' + a.overrides.length);

const pixel = cards.find((card) => card.props.skin.id === 'pixel');
check('pixel card exists', Boolean(pixel));
pixel.props.onSelect('pixel');
check('selecting a skin calls theme.overrideTokens exactly once', a.overrides.length === 1, 'got ' + a.overrides.length);
const applied = a.overrides[0] || { source: '', tokens: {} };
check('override layer is identified by the package id', applied.source === '@local/dsh-skin-switcher', applied.source);
check('override layer carries all 14 alias tokens', Object.keys(applied.tokens).length === 14, 'got ' + Object.keys(applied.tokens).length);
check(
  'every token provides light and dark',
  Object.values(applied.tokens).every((value) => value && typeof value.light === 'string' && typeof value.dark === 'string'),
);
check(
  'token keys are real CSS variables',
  Object.keys(applied.tokens).every((key) => key.startsWith('--dsw-')),
);
check(
  'pixel palette is used for the base background',
  applied.tokens['--dsw-alias-bg-base'].light === '#ece0c8' && applied.tokens['--dsw-alias-bg-base'].dark === '#14110c',
);
const skinCss = a.inserted[a.inserted.length - 1];
check('pixel stylesheet is inserted last', Boolean(skinCss) && skinCss.css.includes('border-radius: 0 !important'));
check('the choice is persisted', a.storage.get('dsh-skin-switcher:style') === 'pixel');
check('the choice is also written to a cookie', a.document.cookie.includes('dsh_skin=pixel'), a.document.cookie);

const aurora = cards.find((card) => card.props.skin.id === 'aurora');
aurora.props.onSelect('aurora');
check('switching disposes the previous token layer', a.overrideDisposers.length === 1);
check('switching disposes the previous stylesheet', a.removed.length === 1);
check('switching applies a new token layer', a.overrides.length === 2);
check(
  'aurora uses translucent surfaces',
  String(a.overrides[1].tokens['--dsw-alias-bg-layer-1'].light).startsWith('rgba'),
  String(a.overrides[1].tokens['--dsw-alias-bg-layer-1'].light),
);
const activeAfterSwitch = findCards(a)
  .filter((card) => card.props.active)
  .map((card) => card.props.skin.id);
check('panel reflects the selected skin', JSON.stringify(activeAfterSwitch) === JSON.stringify(['aurora']), JSON.stringify(activeAfterSwitch));

const reset = findReset(a);
check('reset control exists', reset.length === 1, 'got ' + reset.length);
if (reset.length === 1) {
  reset[0].props.onClick();
  check('reset disposes the skin token layer', a.overrideDisposers.length === 2);
  check('reset applies no further token layer', a.overrides.length === 2, 'got ' + a.overrides.length);
  check('reset stores the default id', a.storage.get('dsh-skin-switcher:style') === 'default');
}

a.disposers.forEach((dispose) => dispose());
check(
  'every inserted stylesheet is removed on dispose',
  a.inserted.length === 3 && a.removed.length === a.inserted.length,
  'inserted ' + a.inserted.length + ', removed ' + a.removed.length,
);

// ------------------------------------------------------------------------- //
// Scenario 2 — the port changed, so only the cookie survived                //
// ------------------------------------------------------------------------- //

console.log('\n— scenario: preference restored from the cookie after a port change —');
const b = bootstrap({ storage: {}, cookie: 'dsh_skin=terminal' });
b.exports.apply(makeCtx(b));
check('a skin is re-applied on load', b.overrides.length === 1, 'got ' + b.overrides.length);
check('the cookie skin is the one re-applied', b.overrides[0] && b.overrides[0].tokens['--dsw-alias-bg-base'].dark === '#06100a');
check('one skin stylesheet is inserted after the panel stylesheet', b.inserted.length === 2, 'got ' + b.inserted.length);
check('the terminal skin marks the sidebar entry active', findCards(b).filter((card) => card.props.active).length === 1);

// ------------------------------------------------------------------------- //
// Scenario 3 — no theme service: geometry still applies, nothing throws     //
// ------------------------------------------------------------------------- //

console.log('\n— scenario: theme service missing —');
const c = bootstrap();
let threw = null;
try {
  c.exports.apply(makeCtx(c, { withTheme: false }));
} catch (error) {
  threw = error;
}
check('apply survives a missing theme service', threw === null, threw && threw.message);
const cCards = findCards(c);
check('panel still renders', cCards.length === 11, 'got ' + cCards.length);
let clickThrew = null;
try {
  cCards.find((card) => card.props.skin.id === 'paper').props.onSelect('paper');
} catch (error) {
  clickThrew = error;
}
check('selecting a skin still works without theme tokens', clickThrew === null, clickThrew && clickThrew.message);
check('geometry/type stylesheet is applied anyway', c.inserted.length === 2, 'got ' + c.inserted.length);
check('no token layer is attempted', c.overrides.length === 0);

// ------------------------------------------------------------------------- //
// Scenario 4 — corrupted stored value falls back to the stock look          //
// ------------------------------------------------------------------------- //

console.log('\n— scenario: unknown stored id —');
const d = bootstrap({ storage: { 'dsh-skin-switcher:style': 'neon-doom' }, cookie: 'dsh_skin=nope' });
d.exports.apply(makeCtx(d));
check('an unknown stored id is ignored', d.overrides.length === 0, 'got ' + d.overrides.length);
check('the panel renders with no active skin', findCards(d).every((card) => card.props.active === false));

// ------------------------------------------------------------------------- //
// Scenario 5 — gradient skins follow the active color scheme                //
// ------------------------------------------------------------------------- //

console.log('\n— scenario: gradient skins and the active color scheme —');
const e = bootstrap();
const eCtx = makeCtx(e, { scheme: 'light' });
e.exports.apply(eCtx);

const gradientCards = findCards(e);
check('eleven styles are offered', gradientCards.length === 11);
const sunsetCard = gradientCards.find((card) => card.props.skin.id === 'sunset');
check('gradient card previews carry their own gradient artwork', Boolean(sunsetCard) && typeof sunsetCard.props.skin.preview.bgImage === 'string');

sunsetCard.props.onSelect('sunset');
const lightCss = e.inserted[e.inserted.length - 1].css;
check('gradient skin paints the page canvas', lightCss.includes('background-image') && lightCss.includes('linear-gradient(158deg'));
check('light mode gets the light gradient', lightCss.includes('#fff7f0') && !lightCss.includes('#140b18'));
check('gradient skin makes the page base translucent', String(e.overrides[0].tokens['--dsw-alias-bg-base'].light).startsWith('rgba'));
check('gradient skin still supplies both schemes in its token layer', e.overrides[0].tokens['--dsw-alias-bg-base'].dark.startsWith('rgba'));
check('no OS fallback is needed once the scheme is known', !lightCss.includes('prefers-color-scheme'));

const beforeFlip = e.inserted.length;
eCtx.emitThemeChange('dark');
const darkCss = e.inserted[e.inserted.length - 1].css;
check('flipping the scheme rebuilds the gradient', e.inserted.length === beforeFlip + 1 && darkCss.includes('#140b18'));
check('the dark gradient is the one now live', !darkCss.includes('#fff7f0'));
check('flipping the scheme does not re-override tokens', e.overrides.length === 1, 'got ' + e.overrides.length);
check('flipping the scheme disposes the stale stylesheet', e.removed.length === beforeFlip - 1);

const sunBeforeRepeat = e.inserted.length;
eCtx.emitThemeChange('dark');
check('a same-scheme theme event is ignored', e.inserted.length === sunBeforeRepeat);

findCards(e)
  .find((card) => card.props.skin.id === 'mist')
  .props.onSelect('mist');
check('switching gradient skins keeps using the dark variant', e.inserted[e.inserted.length - 1].css.includes('#101216'));

// A classic skin ships one fixed stylesheet, so a scheme flip must not churn it.
findCards(e)
  .find((card) => card.props.skin.id === 'pixel')
  .props.onSelect('pixel');
const pixelInserted = e.inserted.length;
eCtx.emitThemeChange('light');
check('a classic skin ignores scheme flips', e.inserted.length === pixelInserted);

const insertedBeforeDispose = e.inserted.length;
e.disposers.forEach((dispose) => dispose());
check(
  'gradient layers are removed with the run',
  e.removed.length === e.inserted.length,
  'inserted ' + e.inserted.length + ', removed ' + e.removed.length,
);
eCtx.emitThemeChange('light');
check('the scheme watcher is detached on dispose', e.inserted.length === insertedBeforeDispose);

const f = bootstrap();
f.exports.apply(makeCtx(f, { withTheme: false }));
findCards(f)
  .find((card) => card.props.skin.id === 'mint')
  .props.onSelect('mint');
const fallbackCss = f.inserted[f.inserted.length - 1].css;
check(
  'without a theme snapshot the gradient follows the OS scheme',
  fallbackCss.includes('#f5fffa') &&
    fallbackCss.includes('@media (prefers-color-scheme: dark)') &&
    fallbackCss.includes('#05120e'),
);

// ------------------------------------------------------------------------- //
// Scenario 6 — QQ classic: retro geometry, per-scheme sky-blue canvas       //
// ------------------------------------------------------------------------- //

console.log('\n— scenario: QQ classic retro skin —');
const g = bootstrap();
const gCtx = makeCtx(g, { scheme: 'light' });
g.exports.apply(gCtx);

const qqCard = findCards(g).find((card) => card.props.skin.id === 'qq');
check('qq classic card exists', Boolean(qqCard));
check('qq preview is square with its own sky gradient', qqCard.props.skin.preview.radius === 0 && typeof qqCard.props.skin.preview.bgImage === 'string');

qqCard.props.onSelect('qq');
const qqCss = g.inserted[g.inserted.length - 1].css;
check('qq skin is the square QQ look', qqCss.includes('border-radius: 0px !important'));
check('qq skin draws a sky-blue gradient canvas', qqCss.includes('#d9e8f5') && qqCss.includes('linear-gradient(158deg'));
check('qq skin carries the Windows-98 raised bevel', qqCss.includes('inset 1px 1px 0 rgba(255, 255, 255, 0.75)'));
check('qq skin uses the era type stack', qqCss.includes('SimSun') && qqCss.includes('Tahoma'));
check(
  'qq palette is the messenger blue',
  g.overrides[0].tokens['--dsw-alias-brand-primary'].light === '#1e7fd0' &&
    g.overrides[0].tokens['--dsw-alias-border-l2'].light === '#7e9cb8',
);
check('qq panels are nearly opaque over the gradient', String(g.overrides[0].tokens['--dsw-alias-bg-layer-1'].light).includes('0.92'));

gCtx.emitThemeChange('dark');
const qqDarkCss = g.inserted[g.inserted.length - 1].css;
check('qq follows the dark scheme with a navy canvas', qqDarkCss.includes('#0c1a28') && !qqDarkCss.includes('#d9e8f5'));
check('qq keeps its bevel in the dark scheme', qqDarkCss.includes('inset 1px 1px 0'));
check('qq token layer is not re-stacked on a scheme flip', g.overrides.length === 1);

// ------------------------------------------------------------------------- //
// Scenario 7 — overlays: detached shells must not let content show through   //
// ------------------------------------------------------------------------- //

console.log('\n— scenario: detached surfaces stay opaque —');
const h = bootstrap();
const hCtx = makeCtx(h, { scheme: 'light' });
h.exports.apply(hCtx);
const selectSkin = (state, id) =>
  findCards(state)
    .find((card) => card.props.skin.id === id)
    .props.onSelect(id);

selectSkin(h, 'ocean');
const oceanCss = h.inserted[h.inserted.length - 1].css;
const dockSelectors = [
  '[data-dockkit-host="dock"]',
  '[data-dockkit-pane]',
  '[data-dockkit-empty]',
  '[data-dockkit-divider]',
  '[data-dockkit-float]',
];
check(
  'gradient skins paint every dock shell that can cover content',
  dockSelectors.every((selector) => oceanCss.includes(selector)),
);
check(
  'the dock shell repeats the same fixed canvas as the page',
  oceanCss.split('background-attachment: fixed').length - 1 === 2 && oceanCss.includes('#f2fbff'),
  'fixed attachments: ' + (oceanCss.split('background-attachment: fixed').length - 1),
);
check(
  'the panel element itself is left alone (it keeps its box while closed)',
  !oceanCss.includes('[data-sidebar-right-panel]'),
);
check(
  'the dock shell stays opaque in the dark scheme too',
  (() => {
    hCtx.emitThemeChange('dark');
    const css = h.inserted[h.inserted.length - 1].css;
    return css.includes('#04121c') && css.split('background-attachment: fixed').length - 1 === 2;
  })(),
);

selectSkin(h, 'qq');
const hQqCss = h.inserted[h.inserted.length - 1].css;
check(
  'the QQ skin also paints its dock shells',
  dockSelectors.every((selector) => hQqCss.includes(selector)) && hQqCss.includes('#0c1a28'),
);

selectSkin(h, 'pixel');
const hPixelCss = h.inserted[h.inserted.length - 1].css;
check(
  'a classic skin needs no dock shell paint (its base is opaque)',
  !hPixelCss.includes('data-dockkit') && !hPixelCss.includes('[data-sidebar-right-panel]'),
);

console.log('\n' + (failures.length === 0 ? 'ALL CHECKS PASSED' : failures.length + ' CHECK(S) FAILED'));
if (failures.length > 0) {
  for (const failure of failures) console.log(' - ' + failure);
  process.exitCode = 1;
}
