/**
 * Skin Switcher — Client half.
 *
 * Registers three things, all owned by this plugin's Client run:
 *   1. a sidebar panel icon (`sidebar.panellist`) whose id is also the key of
 *      the matching panel in `main`;
 *   2. the style gallery panel itself;
 *   3. the active skin, as a theme-token override layer plus one package-owned
 *      stylesheet. Both are swapped on every change, so switching to another
 *      style — or back to the default look — leaves nothing behind.
 *
 * The page only ever sees theme tokens (`--dsw-alias-*`) for frame colors; the
 * literal colors below belong to each skin's palette and its preview artwork.
 */

window.__ModuleLoader__.load({
  id: '@local/dsh-skin-switcher',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const PACKAGE_ID = '@local/dsh-skin-switcher';
    const NS = 'skin-switcher';
    const PANEL_ID = 'skin-switcher';
    const STORAGE_KEY = 'dsh-skin-switcher:style';
    const DEFAULT_ID = 'default';

    const TOKEN_NAMES = {
      bgBase: '--dsw-alias-bg-base',
      bgLayer1: '--dsw-alias-bg-layer-1',
      bgLayer2: '--dsw-alias-bg-layer-2',
      bgOverlay: '--dsw-alias-bg-overlay',
      borderL1: '--dsw-alias-border-l1',
      borderL2: '--dsw-alias-border-l2',
      brand: '--dsw-alias-brand-primary',
      label: '--dsw-alias-label-primary',
      secondary: '--dsw-alias-label-secondary',
      error: '--dsw-alias-state-error-primary',
      idle: '--dsw-alias-state-idle-primary',
      success: '--dsw-alias-state-success-primary',
      warn: '--dsw-alias-state-warn-primary',
      sidebar: '--dsw-specific-sidebar-fill',
    };

    /** Build the token layer the theme service expects from one palette pair. */
    function tokens(light, dark) {
      const layer = {};
      for (const key of Object.keys(TOKEN_NAMES)) {
        layer[TOKEN_NAMES[key]] = { light: light[key], dark: dark[key] };
      }
      return layer;
    }

    // --------------------------------------------------------------------- //
    // Palettes                                                              //
    // --------------------------------------------------------------------- //

    const PIXEL_LIGHT = {
      bgBase: '#ece0c8', bgLayer1: '#f7eeda', bgLayer2: '#e4d7bc', bgOverlay: '#fff8e8',
      borderL1: '#c9b691', borderL2: '#7b6742', brand: '#b8402a', label: '#221c12',
      secondary: '#6d5c41', error: '#a3271f', idle: '#93805f', success: '#2f6b34',
      warn: '#a86a12', sidebar: '#e3d5b8',
    };
    const PIXEL_DARK = {
      bgBase: '#14110c', bgLayer1: '#1e1a13', bgLayer2: '#28231a', bgOverlay: '#241f16',
      borderL1: '#3b3226', borderL2: '#6a5940', brand: '#e8734a', label: '#f2e7cd',
      secondary: '#b5a385', error: '#e2594c', idle: '#8a7a61', success: '#62c07a',
      warn: '#e0a44a', sidebar: '#1a160f',
    };

    const TERMINAL_LIGHT = {
      bgBase: '#eef6ef', bgLayer1: '#f7fbf6', bgLayer2: '#e2ece2', bgOverlay: '#fbfffa',
      borderL1: '#b9ccba', borderL2: '#456b4b', brand: '#1f7a3d', label: '#0f2410',
      secondary: '#4a6a4c', error: '#b3261e', idle: '#6f8a70', success: '#1f7a3d',
      warn: '#8a5a00', sidebar: '#e4efe1',
    };
    const TERMINAL_DARK = {
      bgBase: '#06100a', bgLayer1: '#0a1a0f', bgLayer2: '#0f2414', bgOverlay: '#08140d',
      borderL1: '#17351f', borderL2: '#2c6b3d', brand: '#4ade80', label: '#d5ffe0',
      secondary: '#7fbf94', error: '#ff6b6b', idle: '#3f6b4d', success: '#4ade80',
      warn: '#ffd166', sidebar: '#050d08',
    };

    const PAPER_LIGHT = {
      bgBase: '#f6f1e7', bgLayer1: '#fffdf8', bgLayer2: '#efe7d8', bgOverlay: '#fffdf9',
      borderL1: '#ddd2bd', borderL2: '#a89a80', brand: '#274b6d', label: '#2a2620',
      secondary: '#6b6255', error: '#9c2b21', idle: '#9c917e', success: '#3e6b3a',
      warn: '#8a6a12', sidebar: '#f1eadb',
    };
    const PAPER_DARK = {
      bgBase: '#171512', bgLayer1: '#1f1c18', bgLayer2: '#272420', bgOverlay: '#211e19',
      borderL1: '#35312a', borderL2: '#5c564b', brand: '#c79a6b', label: '#efe7d9',
      secondary: '#a99f8d', error: '#d96b5f', idle: '#7d7565', success: '#83ab7c',
      warn: '#d1a552', sidebar: '#131110',
    };

    const AURORA_LIGHT = {
      bgBase: '#eef1fb', bgLayer1: 'rgba(255, 255, 255, 0.72)', bgLayer2: 'rgba(255, 255, 255, 0.55)',
      bgOverlay: 'rgba(255, 255, 255, 0.88)', borderL1: 'rgba(108, 92, 231, 0.20)',
      borderL2: 'rgba(108, 92, 231, 0.36)', brand: '#6c5ce7', label: '#1b1b2f',
      secondary: '#5b5b78', error: '#d94f74', idle: '#9aa0c0', success: '#1f9e69',
      warn: '#c9861b', sidebar: 'rgba(255, 255, 255, 0.50)',
    };
    const AURORA_DARK = {
      bgBase: '#0a0a14', bgLayer1: 'rgba(34, 34, 60, 0.72)', bgLayer2: 'rgba(48, 48, 82, 0.60)',
      bgOverlay: 'rgba(26, 26, 48, 0.90)', borderL1: 'rgba(130, 120, 255, 0.18)',
      borderL2: 'rgba(130, 120, 255, 0.34)', brand: '#a89bff', label: '#ecebff',
      secondary: '#a5a3c8', error: '#ff7a9c', idle: '#6b6a90', success: '#3ddc97',
      warn: '#ffc46b', sidebar: 'rgba(18, 18, 36, 0.60)',
    };

    const CANDY_LIGHT = {
      bgBase: '#fdf2f8', bgLayer1: '#fff7fb', bgLayer2: '#fbe7f1', bgOverlay: '#fffafd',
      borderL1: '#f3d3e4', borderL2: '#d98cb8', brand: '#e04f9a', label: '#3a2231',
      secondary: '#7d5a6e', error: '#d6455f', idle: '#bb9bae', success: '#2f9a63',
      warn: '#c9861b', sidebar: '#f9e6f0',
    };
    const CANDY_DARK = {
      bgBase: '#150e14', bgLayer1: '#1f1520', bgLayer2: '#2a1c2b', bgOverlay: '#241826',
      borderL1: '#3d2a3e', borderL2: '#8a5a80', brand: '#ff7ab8', label: '#fbebf5',
      secondary: '#c7a4bb', error: '#ff6b81', idle: '#8b6d80', success: '#5cd68e',
      warn: '#ffc861', sidebar: '#120c13',
    };

    // Gradient palettes. The frame stays legible because the surfaces above the
    // gradient are translucent whites / darks, not the gradient's own midtones.
    const SUNSET_LIGHT = {
      bgBase: 'rgba(255, 255, 255, 0.16)', bgLayer1: 'rgba(255, 251, 247, 0.82)',
      bgLayer2: 'rgba(255, 255, 255, 0.97)', bgOverlay: 'rgba(255, 251, 248, 0.985)',
      borderL1: 'rgba(160, 86, 110, 0.22)', borderL2: 'rgba(160, 86, 110, 0.44)',
      brand: '#cf3f7d', label: '#2b1822', secondary: '#6f5162', error: '#c22c4b',
      idle: '#a98a99', success: '#2b8a5e', warn: '#b06d16', sidebar: 'rgba(255, 255, 255, 0.40)',
    };
    const SUNSET_DARK = {
      bgBase: 'rgba(16, 10, 20, 0.14)', bgLayer1: 'rgba(32, 20, 38, 0.86)',
      bgLayer2: 'rgba(44, 28, 52, 0.95)', bgOverlay: 'rgba(20, 13, 26, 0.98)',
      borderL1: 'rgba(255, 170, 200, 0.16)', borderL2: 'rgba(255, 170, 200, 0.32)',
      brand: '#ff7fae', label: '#fbeaf2', secondary: '#c8a9bb', error: '#ff6b81',
      idle: '#8d6f80', success: '#5ed49b', warn: '#ffc46b', sidebar: 'rgba(20, 12, 26, 0.50)',
    };

    const OCEAN_LIGHT = {
      bgBase: 'rgba(255, 255, 255, 0.16)', bgLayer1: 'rgba(248, 253, 255, 0.82)',
      bgLayer2: 'rgba(255, 255, 255, 0.97)', bgOverlay: 'rgba(248, 253, 255, 0.985)',
      borderL1: 'rgba(60, 120, 150, 0.22)', borderL2: 'rgba(60, 120, 150, 0.44)',
      brand: '#1d7fa0', label: '#0f2630', secondary: '#4f6d78', error: '#c02c47',
      idle: '#8aa3ac', success: '#1d8a6a', warn: '#a5741a', sidebar: 'rgba(255, 255, 255, 0.40)',
    };
    const OCEAN_DARK = {
      bgBase: 'rgba(6, 14, 22, 0.14)', bgLayer1: 'rgba(12, 26, 38, 0.86)',
      bgLayer2: 'rgba(18, 36, 50, 0.95)', bgOverlay: 'rgba(8, 18, 28, 0.98)',
      borderL1: 'rgba(150, 220, 255, 0.14)', borderL2: 'rgba(150, 220, 255, 0.30)',
      brand: '#4fd0e8', label: '#e6f6ff', secondary: '#9dc2d2', error: '#ff7183',
      idle: '#5f808f', success: '#4fd8a8', warn: '#ffc46b', sidebar: 'rgba(8, 18, 26, 0.50)',
    };

    const CYBER_LIGHT = {
      bgBase: 'rgba(255, 255, 255, 0.14)', bgLayer1: 'rgba(252, 251, 255, 0.84)',
      bgLayer2: 'rgba(255, 255, 255, 0.97)', bgOverlay: 'rgba(252, 251, 255, 0.985)',
      borderL1: 'rgba(120, 90, 220, 0.24)', borderL2: 'rgba(120, 90, 220, 0.48)',
      brand: '#7a3cf0', label: '#171430', secondary: '#5d5a7d', error: '#d62d6a',
      idle: '#9a97b4', success: '#1a9c78', warn: '#b57a12', sidebar: 'rgba(255, 255, 255, 0.38)',
    };
    const CYBER_DARK = {
      bgBase: 'rgba(4, 6, 16, 0.12)', bgLayer1: 'rgba(14, 14, 34, 0.86)',
      bgLayer2: 'rgba(22, 20, 48, 0.95)', bgOverlay: 'rgba(8, 8, 22, 0.98)',
      borderL1: 'rgba(120, 200, 255, 0.18)', borderL2: 'rgba(190, 120, 255, 0.38)',
      brand: '#b98bff', label: '#eaf4ff', secondary: '#a7a2cf', error: '#ff5c8a',
      idle: '#6b6790', success: '#3ddc97', warn: '#ffd166', sidebar: 'rgba(6, 8, 20, 0.52)',
    };

    const MINT_LIGHT = {
      bgBase: 'rgba(255, 255, 255, 0.16)', bgLayer1: 'rgba(250, 255, 252, 0.82)',
      bgLayer2: 'rgba(255, 255, 255, 0.97)', bgOverlay: 'rgba(250, 255, 252, 0.985)',
      borderL1: 'rgba(50, 130, 110, 0.20)', borderL2: 'rgba(50, 130, 110, 0.42)',
      brand: '#158f6f', label: '#0f2620', secondary: '#4c6d63', error: '#bf2f42',
      idle: '#8aa59c', success: '#12876a', warn: '#a87516', sidebar: 'rgba(255, 255, 255, 0.40)',
    };
    const MINT_DARK = {
      bgBase: 'rgba(4, 14, 12, 0.14)', bgLayer1: 'rgba(10, 28, 24, 0.86)',
      bgLayer2: 'rgba(16, 36, 32, 0.95)', bgOverlay: 'rgba(6, 18, 16, 0.98)',
      borderL1: 'rgba(140, 240, 200, 0.14)', borderL2: 'rgba(140, 240, 200, 0.30)',
      brand: '#4fd8a8', label: '#e6fff5', secondary: '#9cc9b8', error: '#ff7183',
      idle: '#5f8a7c', success: '#4fe0a0', warn: '#ffc46b', sidebar: 'rgba(6, 16, 14, 0.50)',
    };

    const MIST_LIGHT = {
      bgBase: 'rgba(255, 255, 255, 0.20)', bgLayer1: 'rgba(255, 255, 255, 0.80)',
      bgLayer2: 'rgba(255, 255, 255, 0.97)', bgOverlay: 'rgba(255, 255, 255, 0.985)',
      borderL1: 'rgba(90, 105, 130, 0.22)', borderL2: 'rgba(90, 105, 130, 0.44)',
      brand: '#4a6fa5', label: '#1b1f26', secondary: '#5a6472', error: '#b83a4a',
      idle: '#8b94a3', success: '#2f7d5c', warn: '#96701c', sidebar: 'rgba(255, 255, 255, 0.45)',
    };
    const MIST_DARK = {
      bgBase: 'rgba(14, 16, 20, 0.16)', bgLayer1: 'rgba(26, 30, 38, 0.84)',
      bgLayer2: 'rgba(36, 42, 52, 0.95)', bgOverlay: 'rgba(18, 21, 27, 0.98)',
      borderL1: 'rgba(200, 210, 230, 0.10)', borderL2: 'rgba(200, 210, 230, 0.22)',
      brand: '#7fa6dd', label: '#e8ecf3', secondary: '#a4adbd', error: '#ff7183',
      idle: '#6d7686', success: '#4fc08c', warn: '#e0b45c', sidebar: 'rgba(16, 18, 24, 0.50)',
    };

    // Early QQ (2000/2003 era): sky-blue gradient behind pale grey-blue panels,
    // thin 98-style bevels, square corners, small Chinese UI type.
    const QQ_LIGHT = {
      bgBase: 'rgba(222, 236, 248, 0.42)', bgLayer1: 'rgba(246, 250, 253, 0.92)',
      bgLayer2: 'rgba(255, 255, 255, 0.97)', bgOverlay: 'rgba(252, 254, 255, 0.99)',
      borderL1: '#b9cee0', borderL2: '#7e9cb8', brand: '#1e7fd0', label: '#1c1c1c',
      secondary: '#5b6b7a', error: '#c62828', idle: '#8fa3b5', success: '#2f9e44',
      warn: '#b06d16', sidebar: 'rgba(214, 230, 244, 0.88)',
    };
    const QQ_DARK = {
      bgBase: 'rgba(18, 32, 46, 0.40)', bgLayer1: 'rgba(28, 45, 61, 0.92)',
      bgLayer2: 'rgba(36, 56, 74, 0.96)', bgOverlay: 'rgba(22, 36, 50, 0.99)',
      borderL1: '#33506a', borderL2: '#4e7796', brand: '#5eb0f0', label: '#e6eef6',
      secondary: '#a2b6c8', error: '#ff6b6b', idle: '#6b8399', success: '#6ecf7a',
      warn: '#e0b04a', sidebar: 'rgba(22, 37, 51, 0.90)',
    };

    // --------------------------------------------------------------------- //
    // Gradient chrome                                                       //
    // --------------------------------------------------------------------- //

    /**
     * Build the stylesheet of a gradient skin.
     *
     * A gradient cannot travel through an alias token (tokens are single color
     * values), so the gradient is painted on the page canvas here and every
     * surface above it — panels, menus, sidebar — is the matching translucent
     * token. The stylesheet is therefore built per color scheme, from the theme
     * snapshot, and rebuilt when that scheme flips.
     */
    function gradientChrome(spec) {
      /** The three-layer canvas shared by the page and every detached surface. */
      const canvas = (colors) => `background-color: ${colors.base};
  background-image:
    radial-gradient(1100px 720px at 6% -12%, ${colors.glowA} 0%, transparent 66%),
    radial-gradient(900px 640px at 96% 2%, ${colors.glowB} 0%, transparent 62%),
    linear-gradient(158deg, ${colors.a} 0%, ${colors.b} 48%, ${colors.c} 100%);
  background-repeat: no-repeat;
  background-attachment: fixed;`;
      const build = (colors, dark) => `
html {
  ${canvas(colors)}
}
body { background-color: transparent !important; }
/*
 * Detached shells paint no surface of their own — the stock look leans on the
 * opaque page base behind them. With a translucent base the right dock and the
 * expanded document viewer would show the text underneath through themselves
 * (the "overlapping / ghosting type" bug). Repeat the same viewport-fixed
 * canvas on every surface that can cover content: opaque, and aligned with the
 * page gradient because the attachment is fixed.
 *
 * Only dock cells are painted, never the panel element itself: the panel keeps
 * its width while it is closed (its children are the ones hidden), so a
 * background there would cover content even with no document open.
 */
[data-dockkit-host="dock"],
[data-dockkit-pane],
[data-dockkit-empty],
[data-dockkit-divider],
[data-dockkit-float] {
  ${canvas(colors)}
}
*, *::before, *::after { border-radius: ${spec.radius}px !important; }
body, button, input, textarea, select { font-family: ${spec.font} !important; }
::selection { background: var(--dsw-alias-brand-primary); color: ${dark ? '#0b0818' : '#ffffff'}; }
:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px; }
${spec.extra || ''}`;
      return (scheme) => {
        const light = build(spec.light, false);
        const dark = build(spec.dark, true);
        if (scheme === 'dark') return dark;
        if (scheme === 'light') return light;
        // No readable snapshot: let the OS preference decide.
        return light + '\n@media (prefers-color-scheme: dark) {\n' + dark + '\n}\n';
      };
    }

    // --------------------------------------------------------------------- //
    // Skins                                                                 //
    // --------------------------------------------------------------------- //

    /**
     * `css` is the skin's stylesheet. It may only change geometry and type
     * (and add textures) — every color it shows comes from a token or from the
     * token layer above, so light/dark keep working in every skin.
     */
    const SKINS = [
      {
        id: 'pixel',
        css: `
*, *::before, *::after { border-radius: 0 !important; }
body, button, input, textarea, select { font-family: ui-monospace, "Cascadia Mono", Consolas, "Courier New", monospace !important; letter-spacing: 0.2px; }
body, div, span, p, li, h1, h2, h3, h4, button, input, textarea { text-rendering: geometricPrecision; }
button, [role="button"] { border: 1px solid var(--dsw-alias-border-l2) !important; box-shadow: 2px 2px 0 var(--dsw-alias-border-l2) !important; }
button:active, [role="button"]:active { transform: translate(1px, 1px); box-shadow: 1px 1px 0 var(--dsw-alias-border-l2) !important; }
input, textarea, select { border: 1px solid var(--dsw-alias-border-l2) !important; }
::selection { background: var(--dsw-alias-brand-primary); color: var(--dsw-alias-bg-layer-1); }
html::after {
  content: ""; position: fixed; inset: 0; pointer-events: none; z-index: 2147483000;
  background: repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.055) 0 1px, transparent 1px 3px);
}`,
        preview: { bg: '#f5ead4', side: '#e3d2ae', border: '#2a2318', line: '#c1ac82', accent: '#b8402a', radius: 0 },
        tokens: tokens(PIXEL_LIGHT, PIXEL_DARK),
      },
      {
        id: 'terminal',
        css: `
*, *::before, *::after { border-radius: 0 !important; }
body, button, input, textarea, select { font-family: ui-monospace, "Cascadia Mono", Consolas, monospace !important; }
:focus-visible { outline: 1px dashed var(--dsw-alias-brand-primary) !important; outline-offset: 2px; }
::selection { background: var(--dsw-alias-brand-primary); color: var(--dsw-alias-bg-base); }
html::after {
  content: ""; position: fixed; inset: 0; pointer-events: none; z-index: 2147483000;
  background: repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.10) 0 1px, transparent 1px 2px);
}`,
        preview: { bg: '#06100a', side: '#0b1c11', border: '#2c6b3d', line: '#1d4a2a', accent: '#4ade80', radius: 0 },
        tokens: tokens(TERMINAL_LIGHT, TERMINAL_DARK),
      },
      {
        id: 'paper',
        css: `
*, *::before, *::after { border-radius: 2px !important; box-shadow: none !important; }
body, button, input, textarea, select { font-family: Georgia, "Songti SC", "Noto Serif SC", Cambria, "Times New Roman", serif !important; }
h1, h2, h3, h4 { letter-spacing: 0.01em; }
blockquote { font-style: italic; }`,
        preview: { bg: '#faf5ea', side: '#f0e8d7', border: '#d8cbb2', line: '#e6dcc8', accent: '#274b6d', radius: 3 },
        tokens: tokens(PAPER_LIGHT, PAPER_DARK),
      },
      {
        id: 'aurora',
        css: `
*, *::before, *::after { border-radius: 14px !important; }
body, button, input, textarea, select { font-family: "Segoe UI Variable Text", "Segoe UI", system-ui, -apple-system, sans-serif !important; }
button, [role="button"], input, textarea { backdrop-filter: blur(3px); }`,
        preview: { bg: '#eef1fb', side: 'rgba(255, 255, 255, 0.66)', border: 'rgba(108, 92, 231, 0.35)', line: 'rgba(108, 92, 231, 0.18)', accent: '#6c5ce7', radius: 12 },
        tokens: tokens(AURORA_LIGHT, AURORA_DARK),
      },
      {
        id: 'candy',
        css: `
*, *::before, *::after { border-radius: 12px !important; }
button, [role="button"] { border-radius: 999px !important; }
body, button, input, textarea, select { font-family: "Segoe UI Variable Display", "Segoe UI", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif !important; }`,
        preview: { bg: '#fdf2f8', side: '#fbe4f0', border: '#f0c8dd', line: '#f6dcea', accent: '#e04f9a', radius: 10 },
        tokens: tokens(CANDY_LIGHT, CANDY_DARK),
      },
      {
        id: 'sunset',
        css: gradientChrome({
          light: {
            base: '#fff7f0', a: '#ffc396', b: '#ff9fc0', c: '#b991f0',
            glowA: 'rgba(255, 190, 120, 0.85)', glowB: 'rgba(255, 150, 210, 0.55)',
          },
          dark: {
            base: '#140b18', a: '#5a1740', b: '#8a2148', c: '#3a1258',
            glowA: 'rgba(255, 120, 90, 0.26)', glowB: 'rgba(255, 90, 170, 0.20)',
          },
          radius: 12,
          font: '"Segoe UI Variable Text", "Segoe UI", "PingFang SC", system-ui, sans-serif',
        }),
        preview: {
          bg: '#fff7f0', side: 'rgba(255, 255, 255, 0.55)', border: 'rgba(160, 86, 110, 0.30)',
          line: 'rgba(160, 86, 110, 0.22)', accent: '#cf3f7d', radius: 12,
          bgImage: 'linear-gradient(150deg, #ffc396 0%, #ff9fc0 50%, #b991f0 100%)',
        },
        tokens: tokens(SUNSET_LIGHT, SUNSET_DARK),
      },
      {
        id: 'ocean',
        css: gradientChrome({
          light: {
            base: '#f2fbff', a: '#8fe3f0', b: '#6fbcfa', c: '#7d8ff5',
            glowA: 'rgba(120, 220, 255, 0.75)', glowB: 'rgba(110, 140, 255, 0.45)',
          },
          dark: {
            base: '#04121c', a: '#0a3a52', b: '#0d3560', c: '#141a44',
            glowA: 'rgba(60, 200, 230, 0.22)', glowB: 'rgba(70, 110, 240, 0.22)',
          },
          radius: 16,
          font: '"Segoe UI Variable Text", "Segoe UI", "PingFang SC", system-ui, sans-serif',
        }),
        preview: {
          bg: '#f2fbff', side: 'rgba(255, 255, 255, 0.55)', border: 'rgba(60, 120, 150, 0.30)',
          line: 'rgba(60, 120, 150, 0.22)', accent: '#1d7fa0', radius: 14,
          bgImage: 'linear-gradient(150deg, #8fe3f0 0%, #6fbcfa 55%, #7d8ff5 100%)',
        },
        tokens: tokens(OCEAN_LIGHT, OCEAN_DARK),
      },
      {
        id: 'cyber',
        css: gradientChrome({
          light: {
            base: '#f7f8ff', a: '#cfe9ff', b: '#d9c8ff', c: '#ffc9ee',
            glowA: 'rgba(120, 200, 255, 0.70)', glowB: 'rgba(255, 120, 220, 0.55)',
          },
          dark: {
            base: '#04060f', a: '#1b0b3a', b: '#3d0b46', c: '#06243a',
            glowA: 'rgba(0, 220, 255, 0.20)', glowB: 'rgba(255, 40, 200, 0.22)',
          },
          radius: 6,
          font: 'ui-monospace, "Cascadia Mono", Consolas, "Courier New", monospace',
        }),
        preview: {
          bg: '#06060f', side: 'rgba(30, 18, 60, 0.75)', border: 'rgba(190, 120, 255, 0.45)',
          line: 'rgba(120, 200, 255, 0.35)', accent: '#b98bff', radius: 6,
          bgImage: 'linear-gradient(150deg, #1b0b3a 0%, #3d0b46 52%, #06243a 100%)',
        },
        tokens: tokens(CYBER_LIGHT, CYBER_DARK),
      },
      {
        id: 'mint',
        css: gradientChrome({
          light: {
            base: '#f5fffa', a: '#a8f2cd', b: '#96e8e2', c: '#b7e2ff',
            glowA: 'rgba(140, 240, 200, 0.75)', glowB: 'rgba(140, 210, 255, 0.55)',
          },
          dark: {
            base: '#05120e', a: '#0c3a2c', b: '#0b3d3f', c: '#0d2c46',
            glowA: 'rgba(70, 230, 180, 0.22)', glowB: 'rgba(80, 180, 255, 0.20)',
          },
          radius: 14,
          font: '"Segoe UI Variable Text", "Segoe UI", "PingFang SC", system-ui, sans-serif',
        }),
        preview: {
          bg: '#f5fffa', side: 'rgba(255, 255, 255, 0.55)', border: 'rgba(50, 130, 110, 0.28)',
          line: 'rgba(50, 130, 110, 0.20)', accent: '#158f6f', radius: 12,
          bgImage: 'linear-gradient(150deg, #a8f2cd 0%, #96e8e2 55%, #b7e2ff 100%)',
        },
        tokens: tokens(MINT_LIGHT, MINT_DARK),
      },
      {
        id: 'mist',
        css: gradientChrome({
          light: {
            base: '#f7f8fa', a: '#eef1f6', b: '#dfe5ee', c: '#e9e3f2',
            glowA: 'rgba(210, 225, 245, 0.85)', glowB: 'rgba(230, 215, 245, 0.55)',
          },
          dark: {
            base: '#101216', a: '#1a1e26', b: '#242a36', c: '#1b1a28',
            glowA: 'rgba(120, 150, 200, 0.12)', glowB: 'rgba(160, 130, 210, 0.10)',
          },
          radius: 10,
          font: '"Segoe UI Variable Text", "Segoe UI", "PingFang SC", system-ui, sans-serif',
        }),
        preview: {
          bg: '#f7f8fa', side: 'rgba(255, 255, 255, 0.60)', border: 'rgba(90, 105, 130, 0.30)',
          line: 'rgba(90, 105, 130, 0.22)', accent: '#4a6fa5', radius: 10,
          bgImage: 'linear-gradient(150deg, #eef1f6 0%, #dfe5ee 55%, #e9e3f2 100%)',
        },
        tokens: tokens(MIST_LIGHT, MIST_DARK),
      },
      {
        id: 'qq',
        css: gradientChrome({
          light: {
            base: '#d9e8f5', a: '#a9cfee', b: '#cfe4f6', c: '#eaf3fb',
            glowA: 'rgba(255, 255, 255, 0.55)', glowB: 'rgba(140, 195, 240, 0.55)',
          },
          dark: {
            base: '#0c1a28', a: '#12293d', b: '#1b3a55', c: '#0e2033',
            glowA: 'rgba(70, 150, 220, 0.14)', glowB: 'rgba(40, 90, 150, 0.16)',
          },
          radius: 0,
          font: 'Tahoma, "SimSun", "宋体", "MS Sans Serif", sans-serif',
          // Windows-98 style raised bevels: light top-left, shadow bottom-right,
          // inverted while pressed — the one geometry cue early QQ relied on.
          extra: `
button, [role="button"], input, textarea, select {
  box-shadow: inset 1px 1px 0 rgba(255, 255, 255, 0.75), inset -1px -1px 0 rgba(0, 0, 0, 0.28) !important;
}
button:active, [role="button"]:active {
  box-shadow: inset 1px 1px 0 rgba(0, 0, 0, 0.30), inset -1px -1px 0 rgba(255, 255, 255, 0.60) !important;
  transform: translate(1px, 1px);
}
h1, h2, h3, h4 { letter-spacing: 0.4px; }
`,
        }),
        preview: {
          bg: '#dceaf6', side: 'rgba(255, 255, 255, 0.60)', border: 'rgba(126, 156, 184, 0.45)',
          line: 'rgba(126, 156, 184, 0.35)', accent: '#1e7fd0', radius: 0,
          bgImage: 'linear-gradient(160deg, #a9cfee 0%, #cfe4f6 55%, #eaf3fb 100%)',
        },
        tokens: tokens(QQ_LIGHT, QQ_DARK),
      },
    ];

    const SKIN_BY_ID = new Map(SKINS.map((skin) => [skin.id, skin]));

    // --------------------------------------------------------------------- //
    // Panel stylesheet (package-owned, disposed with the run)                //
    // --------------------------------------------------------------------- //

    const PANEL_CSS = `
.dshsw-page {
  box-sizing: border-box; height: 100%; overflow-y: auto;
  padding: 28px 32px 56px; background: var(--dsw-alias-bg-base);
  color: var(--dsw-alias-label-primary);
}
.dshsw-inner { max-width: 940px; margin: 0 auto; }
.dshsw-eyebrow {
  margin: 0 0 8px; font-size: 11px; font-weight: 600; letter-spacing: 0.12em;
  text-transform: uppercase; color: var(--dsw-alias-label-secondary);
}
.dshsw-title { margin: 0 0 8px; font-size: 22px; font-weight: 600; line-height: 1.25; }
.dshsw-sub {
  margin: 0; max-width: 62ch; font-size: 13px; line-height: 1.65;
  color: var(--dsw-alias-label-secondary);
}
.dshsw-grid {
  display: grid; gap: 14px; margin-top: 24px;
  grid-template-columns: repeat(auto-fill, minmax(232px, 1fr));
}
.dshsw-card {
  position: relative; display: flex; flex-direction: column; gap: 10px;
  padding: 12px; margin: 0; cursor: pointer; font: inherit; text-align: left;
  color: var(--dsw-alias-label-primary); background: var(--dsw-alias-bg-layer-1);
  border: 1px solid var(--dsw-alias-border-l1); border-radius: 14px;
  transition: border-color 140ms ease, transform 140ms ease, background 140ms ease;
}
.dshsw-card:hover { border-color: var(--dsw-alias-border-l2); transform: translateY(-1px); }
.dshsw-card:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px; }
.dshsw-card[data-active="true"] {
  border-color: var(--dsw-alias-brand-primary);
  background: var(--dsw-alias-bg-layer-2);
}
.dshsw-preview {
  display: flex; height: 96px; overflow: hidden;
  border: 1px solid var(--dsw-alias-border-l1);
}
.dshsw-preview-side {
  display: flex; flex-direction: column; gap: 6px; width: 27%;
  padding: 9px 7px; border-right: 1px solid;
}
.dshsw-preview-dot { height: 5px; border-radius: 3px; }
.dshsw-preview-main { display: flex; flex: 1; flex-direction: column; gap: 7px; padding: 11px 10px; }
.dshsw-preview-line { height: 5px; border-radius: 3px; }
.dshsw-preview-accent { width: 44px; height: 13px; margin-top: auto; border-radius: 6px; }
.dshsw-meta { display: flex; align-items: center; gap: 8px; }
.dshsw-name { font-size: 14px; font-weight: 600; }
.dshsw-badge {
  margin-left: auto; padding: 2px 8px; font-size: 11px; font-weight: 600;
  color: var(--dsw-alias-bg-layer-1); background: var(--dsw-alias-brand-primary);
  border-radius: 999px;
}
.dshsw-desc { margin: 0; font-size: 12px; line-height: 1.55; color: var(--dsw-alias-label-secondary); }
.dshsw-foot {
  display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
  margin-top: 24px; padding-top: 18px; border-top: 1px solid var(--dsw-alias-border-l1);
}
.dshsw-reset {
  padding: 7px 14px; font: inherit; font-size: 13px; cursor: pointer;
  color: var(--dsw-alias-label-primary); background: transparent;
  border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px;
}
.dshsw-reset:hover:not(:disabled) { background: var(--dsw-alias-bg-layer-2); }
.dshsw-reset:disabled {
  cursor: default; opacity: 0.45;
  border-color: var(--dsw-alias-border-l1);
  color: var(--dsw-alias-label-secondary);
}
.dshsw-hint { font-size: 12px; line-height: 1.5; color: var(--dsw-alias-label-secondary); }
`;

    // --------------------------------------------------------------------- //
    // Dictionaries                                                          //
    // --------------------------------------------------------------------- //

    const DICT_EN = {
      'panel.label': 'Visual style',
      'panel.eyebrow': 'Appearance',
      'panel.title': 'Visual style',
      'panel.subtitle':
        'Pick a look for the whole Harness interface. The choice applies immediately — every panel, menu and composer included — and is remembered for this browser.',
      'panel.active': 'On',
      'panel.reset': 'Restore the default look',
      'panel.hint': 'The default look is the stock palette, corner radii and type of Harness.',
      'skin.pixel.name': 'Pixel',
      'skin.pixel.desc': 'Chunky retro pixels: hard corners, monospace type, cream paper and ink, faint scanlines.',
      'skin.terminal.name': 'Terminal',
      'skin.terminal.desc': 'Dark green phosphor on black, monospace everywhere, square edges and a CRT scanline.',
      'skin.paper.name': 'Paper',
      'skin.paper.desc': 'Warm ivory stock, serif type, hairline rules and no shadows — like a printed page.',
      'skin.aurora.name': 'Aurora',
      'skin.aurora.desc': 'Translucent violet glass, large soft corners and airy layered surfaces.',
      'skin.candy.name': 'Candy',
      'skin.candy.desc': 'Pastel pink and mint, pill-shaped controls and gently rounded panels.',
      'skin.sunset.name': 'Sunset',
      'skin.sunset.desc': 'A warm sunset wash — apricot, rose and violet behind frosted panels.',
      'skin.ocean.name': 'Ocean',
      'skin.ocean.desc': 'Cool currents — aqua, sky and indigo under glassy translucent surfaces.',
      'skin.cyber.name': 'Cyber Neon',
      'skin.cyber.desc': 'Neon night: cyan and magenta glow over a near-black violet gradient, crisp edges.',
      'skin.mint.name': 'Mint',
      'skin.mint.desc': 'Fresh mint wash — mint green, aqua and pale blue, light and airy.',
      'skin.mist.name': 'Mist',
      'skin.mist.desc': 'Neutral graphite fade — cool grey drifting into pale lavender, quiet and restrained.',
      'skin.qq.name': 'QQ Classic',
      'skin.qq.desc':
        'The early-2000s messenger look: sky-blue gradient, pale grey-blue panels, Windows-98 raised bevels, square corners and small Chinese UI type.',
    };

    const DICT_ZH = {
      'panel.label': '视觉风格',
      'panel.eyebrow': '外观',
      'panel.title': '视觉风格',
      'panel.subtitle':
        '选择整个 Harness 界面的观感。选择立即生效 —— 每个面板、菜单和输入框都会跟着变 —— 并在本浏览器中记住。',
      'panel.active': '使用中',
      'panel.reset': '恢复默认外观',
      'panel.hint': '默认外观即 Harness 原有的配色、圆角与字体。',
      'skin.pixel.name': '像素风',
      'skin.pixel.desc': '复古像素感：直角、等宽字体、米色纸底与墨色，带轻微扫描线。',
      'skin.terminal.name': '终端',
      'skin.terminal.desc': '黑底绿色荧光、全等宽字体、硬直角，附 CRT 扫描线。',
      'skin.paper.name': '纸墨',
      'skin.paper.desc': '暖象牙纸色、衬线字体、细线分隔、无阴影 —— 像一页印刷品。',
      'skin.aurora.name': '极光',
      'skin.aurora.desc': '半透明紫罗兰玻璃质感、大圆角、层层叠叠的通透表面。',
      'skin.candy.name': '糖果',
      'skin.candy.desc': '粉色与薄荷的柔和配色、胶囊状控件、圆润面板。',
      'skin.sunset.name': '日落',
      'skin.sunset.desc': '暖调日落渐变：杏橙、玫瑰粉到紫罗兰，面板像蒙了一层雾面玻璃。',
      'skin.ocean.name': '海洋',
      'skin.ocean.desc': '清凉海洋渐变：青碧、天蓝到靛蓝，半透明表面像水面一样通透。',
      'skin.cyber.name': '霓虹',
      'skin.cyber.desc': '霓虹夜色：近黑紫底上叠青光与洋红辉光，棱角清晰。',
      'skin.mint.name': '薄荷',
      'skin.mint.desc': '清新薄荷渐变：薄荷绿、水青到浅蓝，轻盈通透。',
      'skin.mist.name': '雾霭',
      'skin.mist.desc': '中性石墨渐变：冷灰缓缓过渡到淡紫，克制不抢眼。',
      'skin.qq.name': 'QQ 经典',
      'skin.qq.desc': '早期 QQ 的味道：天蓝渐变、浅灰蓝面板、98 式立体凸起边框、全直角、宋体小字。',
    };

    // --------------------------------------------------------------------- //
    // Stylesheet sink                                                       //
    // --------------------------------------------------------------------- //

    /** Insert a stylesheet; return its disposer. Prefers the `styles` builtin. */
    function makeCssSink() {
      let builtin;
      try {
        builtin = require('styles');
      } catch (_) {
        builtin = undefined;
      }
      if (builtin && typeof builtin.insert === 'function') {
        return (css) => {
          const dispose = builtin.insert(css);
          return typeof dispose === 'function' ? dispose : () => {};
        };
      }
      return (css) => {
        const el = document.createElement('style');
        el.setAttribute('data-dsh-skin-switcher', '');
        el.textContent = css;
        document.head.appendChild(el);
        return () => {
          if (el.parentNode) el.parentNode.removeChild(el);
        };
      };
    }

    /** Resolve the theme service, whether it arrives by injection or lookup. */
    function resolveTheme(ctx) {
      try {
        if (ctx.theme && typeof ctx.theme.overrideTokens === 'function') return ctx.theme;
      } catch (_) {
        /* not injected: fall through to the lookup */
      }
      try {
        const looked = typeof ctx.get === 'function' ? ctx.get('theme') : undefined;
        if (looked && typeof looked.overrideTokens === 'function') return looked;
      } catch (_) {
        /* lookup unavailable */
      }
      return undefined;
    }

    /**
     * Pick the stylesheet text for a skin. Gradient skins build theirs per
     * color scheme; every other skin ships one fixed stylesheet.
     */
    function chromeFor(skin, scheme) {
      if (!skin) return '';
      return typeof skin.css === 'function' ? skin.css(scheme) : skin.css;
    }

    function schemeOf(snapshot) {
      const scheme = snapshot && snapshot.active ? snapshot.active.colorScheme : undefined;
      return scheme === 'dark' || scheme === 'light' ? scheme : 'unknown';
    }

    /** Read the active color scheme; `unknown` when the theme cannot be read. */
    function readScheme(theme) {
      if (!theme || typeof theme.getTheme !== 'function') return 'unknown';
      try {
        return schemeOf(theme.getTheme());
      } catch (_) {
        return 'unknown';
      }
    }

    /**
     * Watch `theme/change` for color-scheme transitions. Token values already
     * adapt on their own; only the gradient canvas needs a rebuild.
     */
    function watchScheme(ctx, theme, handler) {
      if (!theme || typeof theme.getTheme !== 'function') return () => {};
      if (!ctx || typeof ctx.on !== 'function') return () => {};
      let dispose;
      try {
        dispose = ctx.on('theme/change', (snapshot) => {
          try {
            handler(schemeOf(snapshot));
          } catch (error) {
            logError('a theme change could not be applied', error);
          }
        });
      } catch (error) {
        logError('theme changes cannot be watched', error);
        return () => {};
      }
      return typeof dispose === 'function' ? dispose : () => {};
    }

    // --------------------------------------------------------------------- //
    // Module state                                                          //
    // --------------------------------------------------------------------- //

    const listeners = new Set();

    function logError(message, error) {
      try {
        require('console').error('[skin-switcher] ' + message, error);
      } catch (_) {
        /* the console builtin is unavailable */
      }
    }

    // The GUI's port can change between launches, and localStorage is scoped by
    // origin (host *and* port) while a cookie is scoped by host only — so the
    // choice is written to both and read from whichever survives.
    function readCookie() {
      try {
        const match = document.cookie.match(/(?:^|;\s*)dsh_skin=([^;]*)/);
        return match ? decodeURIComponent(match[1]) : null;
      } catch (_) {
        return null;
      }
    }

    function writeCookie(value) {
      try {
        document.cookie =
          'dsh_skin=' + encodeURIComponent(value) + '; path=/; max-age=31536000; SameSite=Lax';
      } catch (_) {
        /* cookies unavailable */
      }
    }

    function validId(value) {
      return value === DEFAULT_ID || SKIN_BY_ID.has(value) ? value : null;
    }

    function readStored() {
      try {
        const stored = validId(window.localStorage.getItem(STORAGE_KEY));
        if (stored) return stored;
      } catch (_) {
        /* storage unavailable: fall through to the cookie */
      }
      return validId(readCookie()) || DEFAULT_ID;
    }

    function writeStored(id) {
      try {
        window.localStorage.setItem(STORAGE_KEY, id);
      } catch (_) {
        /* storage unavailable: the cookie still carries the choice */
      }
      writeCookie(id);
    }

    let activeId = readStored();
    let activeTokens = null;
    let activeCss = null;
    let activeScheme = 'unknown';
    let applyLayer = () => {};

    function getActiveId() {
      return activeId;
    }

    function subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }

    function setActive(id) {
      const next = id === DEFAULT_ID || SKIN_BY_ID.has(id) ? id : DEFAULT_ID;
      if (next === activeId) return;
      activeId = next;
      writeStored(next);
      applyLayer();
      for (const listener of Array.from(listeners)) {
        try {
          listener(next);
        } catch (error) {
          logError('listener failed', error);
        }
      }
    }

    // --------------------------------------------------------------------- //
    // Hooks                                                                 //
    // --------------------------------------------------------------------- //

    function useActiveId() {
      const [id, setId] = React.useState(getActiveId);
      React.useEffect(() => subscribe(setId), []);
      return id;
    }

    function useLocale(ctx) {
      const [revision, setRevision] = React.useState(0);
      React.useEffect(
        () => ctx.locale.subscribe(() => setRevision((value) => value + 1)),
        [ctx],
      );
      // Reading the revision keeps the re-render tied to locale changes.
      void revision;
      return ctx.locale.bind(NS);
    }

    // --------------------------------------------------------------------- //
    // Sidebar panel icon                                                    //
    // --------------------------------------------------------------------- //

    function SkinIcon(props) {
      const size = typeof props?.size === 'number' ? props.size : 20;
      return h(
        'svg',
        {
          viewBox: '0 0 24 24',
          width: size,
          height: size,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.7,
          strokeLinejoin: 'round',
          'aria-hidden': true,
          style: { display: 'block' },
        },
        h('rect', { x: 3, y: 3, width: 8, height: 8, rx: 1.5 }),
        h('rect', { x: 13, y: 3, width: 8, height: 8, rx: 1.5 }),
        h('rect', { x: 3, y: 13, width: 8, height: 8, rx: 1.5 }),
        h('circle', { cx: 17, cy: 17, r: 4 }),
      );
    }

    // --------------------------------------------------------------------- //
    // Panel                                                                 //
    // --------------------------------------------------------------------- //

    function Preview(skin) {
      const art = skin.preview;
      const dot = (width) =>
        h('div', {
          className: 'dshsw-preview-dot',
          style: { width, background: art.line },
        });
      const line = (width) =>
        h('div', {
          className: 'dshsw-preview-line',
          style: { width, background: art.line },
        });
      return h(
        'div',
        {
          className: 'dshsw-preview',
          style: {
            backgroundColor: art.bg,
            backgroundImage: art.bgImage || undefined,
            borderRadius: art.radius,
            borderColor: art.border,
          },
        },
        h(
          'div',
          {
            className: 'dshsw-preview-side',
            style: {
              background: art.side,
              borderRightColor: art.border,
              borderRadius: art.radius,
            },
          },
          dot('78%'),
          dot('58%'),
          dot('66%'),
        ),
        h(
          'div',
          { className: 'dshsw-preview-main' },
          line('72%'),
          line('92%'),
          line('54%'),
          h('div', {
            className: 'dshsw-preview-accent',
            style: { background: art.accent, borderRadius: art.radius },
          }),
        ),
      );
    }

    function SkinCard(props) {
      const { skin, t, active, onSelect } = props;
      const name = t('skin.' + skin.id + '.name');
      return h(
        'button',
        {
          type: 'button',
          className: 'dshsw-card',
          'data-active': active ? 'true' : 'false',
          'aria-pressed': active,
          title: name,
          onClick: () => onSelect(skin.id),
        },
        Preview(skin),
        h(
          'div',
          { className: 'dshsw-meta' },
          h('span', { className: 'dshsw-name' }, name),
          active ? h('span', { className: 'dshsw-badge' }, t('panel.active')) : null,
        ),
        h('p', { className: 'dshsw-desc' }, t('skin.' + skin.id + '.desc')),
      );
    }

    function SkinPanel(props) {
      const ctx = props?.skinSwitcherContext;
      const active = useActiveId();
      const t = useLocale(ctx);
      const isDefault = active === DEFAULT_ID;
      return h(
        'div',
        { className: 'dshsw-page' },
        h(
          'div',
          { className: 'dshsw-inner' },
          h('p', { className: 'dshsw-eyebrow' }, t('panel.eyebrow')),
          h('h1', { className: 'dshsw-title' }, t('panel.title')),
          h('p', { className: 'dshsw-sub' }, t('panel.subtitle')),
          h(
            'div',
            { className: 'dshsw-grid', role: 'group', 'aria-label': t('panel.title') },
            ...SKINS.map((skin) =>
              h(SkinCard, {
                key: skin.id,
                skin,
                t,
                active: active === skin.id,
                onSelect: setActive,
              }),
            ),
          ),
          h(
            'div',
            { className: 'dshsw-foot' },
            h(
              'button',
              {
                type: 'button',
                className: 'dshsw-reset',
                disabled: isDefault,
                onClick: () => setActive(DEFAULT_ID),
              },
              t('panel.reset'),
            ),
            h('span', { className: 'dshsw-hint' }, t('panel.hint')),
          ),
        ),
      );
    }

    // --------------------------------------------------------------------- //
    // Plugin                                                                //
    // --------------------------------------------------------------------- //

    return {
      inject: ['slots', 'theme', 'locale'],
      apply(ctx) {
        const cssSink = makeCssSink();
        const disposePanelCss = cssSink(PANEL_CSS);
        const theme = resolveTheme(ctx);

        // Swaps the two live layers for the currently selected skin. Called on
        // activation and on every change; the previous layer is removed first,
        // so the default id truly restores the stock look.
        applyLayer = () => {
          if (activeTokens) {
            activeTokens();
            activeTokens = null;
          }
          if (activeCss) {
            activeCss();
            activeCss = null;
          }
          const skin = SKIN_BY_ID.get(activeId);
          if (!skin) return;
          activeScheme = readScheme(theme);
          activeCss = cssSink(chromeFor(skin, activeScheme));
          if (!theme) {
            logError('the theme service is unavailable, so only geometry and type change');
            return;
          }
          try {
            activeTokens = theme.overrideTokens(PACKAGE_ID, skin.tokens);
          } catch (error) {
            activeTokens = null;
            logError('theme tokens could not be overridden', error);
          }
        };
        applyLayer();

        ctx.effect(() => {
          // Gradient skins are built for one color scheme, so a scheme flip
          // swaps only their stylesheet; the token layer already carries both.
          const stopWatching = watchScheme(ctx, theme, (scheme) => {
            if (scheme === 'unknown' || scheme === activeScheme) return;
            const skin = SKIN_BY_ID.get(activeId);
            // Only skins whose stylesheet is built per scheme need a rebuild.
            if (!skin || typeof skin.css !== 'function') return;
            activeScheme = scheme;
            if (activeCss) {
              activeCss();
              activeCss = null;
            }
            activeCss = cssSink(chromeFor(skin, scheme));
          });
          return () => {
            stopWatching();
            if (activeTokens) activeTokens();
            if (activeCss) activeCss();
            activeTokens = null;
            activeCss = null;
            disposePanelCss();
          };
        }, 'skin-switcher layers');

        ctx.effect(() => ctx.locale.register(NS, 'en', DICT_EN), 'skin-switcher locale en');
        ctx.effect(() => ctx.locale.register(NS, 'zh', DICT_ZH), 'skin-switcher locale zh');

        const t = ctx.locale.bind(NS);

        // Sidebar entry: the id is the key of the matching `main` panel, and
        // the sidebar renders the button (label included) from this metadata.
        ctx.slots.inject('sidebar.panellist', () =>
          ctx.slots.register(
            {
              name: 'sidebar.panellist',
              id: PANEL_ID,
              order: 30,
              label: () => t('panel.label'),
            },
            SkinIcon,
          ),
        );

        ctx.slots.inject('main', () =>
          ctx.slots.register({ name: 'main', key: PANEL_ID }, (props) =>
            h(SkinPanel, { ...props, skinSwitcherContext: ctx }),
          ),
        );
      },
    };
  },
});
