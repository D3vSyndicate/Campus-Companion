// Checks the translations. Run it after adding or changing any text:
//
//   node scripts/check-translations.js            report problems
//   node scripts/check-translations.js --strict   also fail when isiXhosa is missing a key
//
// What it looks for:
//   - a text the code asks for that does not exist in English (the screen would show the raw key)
//   - a text missing in Afrikaans or isiXhosa (the student sees English instead)
//   - a translation that lost or changed a {{placeholder}} (the screen would show a gap or the wrong word)
//   - a translation that is identical to the English (possibly forgotten)
//
// isiXhosa and Afrikaans are written to be useful, but they should be reviewed by a fluent speaker or the
// University, especially the Tribe rules, the emergency numbers and the privacy notice.

const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const locales = { en: 'en.json', xh: 'xh.json', af: 'afri.json' };
const strict = process.argv.includes('--strict');

const flatten = (object, prefix = '') =>
  Object.entries(object).flatMap(([key, value]) =>
    value && typeof value === 'object' ? flatten(value, `${prefix}${key}.`) : [[`${prefix}${key}`, String(value)]],
  );
const load = (file) => Object.fromEntries(flatten(JSON.parse(fs.readFileSync(path.join(root, 'src/i18n/locales', file), 'utf8'))));
const strings = Object.fromEntries(Object.entries(locales).map(([lang, file]) => [lang, load(file)]));

const placeholders = (text) => (text.match(/\{\{\s*\w+\s*\}\}/g) ?? []).map((p) => p.replace(/\s/g, '')).sort().join(',');
// Brand names and the like that are the same in every language.
const SAME_IN_EVERY_LANGUAGE = /^(campus companion|home|wi-fi|funda|eduroam|onedrive|isixhosa|afrikaans|english|sadag|lifeline)/i;

let problems = 0;
const report = (title, lines) => {
  if (!lines.length) return;
  console.log(`\n${title} (${lines.length})`);
  lines.slice(0, 40).forEach((line) => console.log('  ' + line));
  if (lines.length > 40) console.log(`  ... and ${lines.length - 40} more`);
};

// 1. Keys the code asks for. Only plain string keys can be checked; keys built from variables cannot.
const walk = (dir, out = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(tsx?|jsx?)$/.test(entry.name)) out.push(full);
  }
  return out;
};
const used = new Map();
for (const file of walk(path.join(root, 'src'))) {
  const text = fs.readFileSync(file, 'utf8');
  for (const match of text.matchAll(/\bt\(\s*['"]([A-Za-z0-9_.-]+)['"]/g)) {
    if (!used.has(match[1])) used.set(match[1], path.relative(root, file).replace(/\\/g, '/'));
  }
}
const unknown = [...used].filter(([key]) => !(key in strings.en)).map(([key, file]) => `${key}   (asked for in ${file})`);
report('Texts the code asks for that do not exist', unknown);
problems += unknown.length;

// 2. Each language against English.
const enKeys = Object.keys(strings.en);
for (const lang of ['af', 'xh']) {
  const label = lang === 'af' ? 'Afrikaans' : 'isiXhosa';
  const text = strings[lang];

  const missing = enKeys.filter((key) => !(key in text));
  report(`Missing in ${label}, so English shows`, missing);
  if (lang === 'af' || strict) problems += missing.length;

  const extra = Object.keys(text).filter((key) => !(key in strings.en));
  report(`In ${label} but not in English`, extra);
  problems += extra.length;

  const broken = enKeys.filter((key) => key in text && placeholders(strings.en[key]) !== placeholders(text[key]));
  report(`${label} placeholders that do not match English`, broken.map((key) => `${key}: English has [${placeholders(strings.en[key])}], ${label} has [${placeholders(text[key])}]`));
  problems += broken.length;

  const same = enKeys.filter((key) => key in text && text[key] === strings.en[key] && !SAME_IN_EVERY_LANGUAGE.test(text[key]) && text[key].length > 12);
  report(`${label} identical to English, possibly forgotten`, same);
}

console.log(`\n${enKeys.length} texts in English, ${Object.keys(strings.af).length} in Afrikaans, ${Object.keys(strings.xh).length} in isiXhosa.`);
console.log(problems ? `${problems} problem(s) to fix.` : 'No problems found.');
process.exit(problems ? 1 : 0);
