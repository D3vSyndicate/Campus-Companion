// Finds text written straight into the code, which would stay English when the language is changed.
//
//   node scripts/find-untranslated.js          list them, file by file
//   node scripts/find-untranslated.js --count  only the totals
//
// Text should go through t('some.key') (or i18n.t outside a component) and live in src/i18n/locales. This
// reads every source file and lists any user-facing English it finds. Some files are left out on purpose
// (see SKIP below): the staff tools are English only, and long content is written in English in its data file.
// After adding a text, run `node scripts/check-translations.js` to make sure all three languages have it.

const ts = require('typescript');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..', 'src');

// English on purpose: the staff tools, and content that belongs to the people who publish it.
const SKIP = [
  /^app\/\((admin|coordinator|hod)\)\//,
  /^components\/(manage|StaffDashboard|StaffProfile)/,
  /^data\/(staffSections|digitalLessons|timetable-data|arcade-rewards|ai-tools|campus|societies)/,
  /^lib\/searchDocs/,
  /^i18n\//,
];

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => (entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]));

const SKIP_ATTR = new Set(['style', 'name', 'testID', 'key', 'href', 'route', 'icon', 'color', 'type', 'size', 'resizeMode', 'contentFit', 'keyboardType', 'autoCapitalize', 'autoComplete', 'textContentType', 'accessibilityRole', 'role', 'behavior', 'animation', 'mode', 'variant', 'id', 'source', 'uri', 'value', 'defaultValue', 'area', 'scope', 'position', 'field', 'table', 'slug', 'kind', 'category', 'collection', 'component']);

const looksLikeText = (text) => {
  const t = text.trim();
  if (t.length < 3 || !/[A-Za-z]{2}/.test(t)) return false;
  if (/^(https?:|\/|\.\/|\.\.\/|@|#[0-9a-f]{3,8}$|rgba?\(|[a-z]+-[a-z-]+$|[a-z]+_[a-z_]+$|[a-z][A-Za-z0-9]*$)/.test(t)) return false;
  return /\s/.test(t) || /^[A-Z][a-z]{2,}/.test(t);
};

const found = {};
for (const file of walk(root)) {
  const rel = path.relative(root, file).split(path.sep).join('/');
  if (!/\.(tsx|ts)$/.test(file) || SKIP.some((pattern) => pattern.test(rel))) continue;
  const source = fs.readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const list = [];

  const ignored = (node) => {
    for (let p = node.parent; p; p = p.parent) {
      if (ts.isCallExpression(p) && /^(t|i18n\.t|console\.\w+|require|StyleSheet\.\w+)$/.test(p.expression.getText(sf))) return true;
      if (ts.isImportDeclaration(p) || ts.isExportDeclaration(p) || ts.isTypeNode(p)) return true;
      if (ts.isJsxAttribute(p) && SKIP_ATTR.has(p.name.getText(sf))) return true;
    }
    const parent = node.parent;
    if (ts.isElementAccessExpression(parent) || ts.isCaseClause(parent) || ts.isLiteralTypeNode(parent)) return true;
    if (ts.isBinaryExpression(parent) && ['===', '!==', '==', '!='].includes(parent.operatorToken.getText(sf))) return true;
    if (ts.isPropertyAssignment(parent) && parent.name === node) return true;
    return false;
  };

  const add = (node, text) => {
    if (!looksLikeText(text)) return;
    list.push([sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1, text.trim().replace(/\s+/g, ' ')]);
  };

  const visit = (node) => {
    if (ts.isJsxText(node)) {
      if (/\S/.test(node.getText(sf)) && !ignored(node)) add(node, node.getText(sf));
    } else if ((ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) && !ignored(node)) {
      add(node, node.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  if (list.length) found[rel] = list;
}

const files = Object.entries(found).sort((a, b) => b[1].length - a[1].length);
const total = files.reduce((sum, [, list]) => sum + list.length, 0);
if (!process.argv.includes('--count')) {
  for (const [file, list] of files) {
    console.log(`\n${file}`);
    for (const [line, text] of list) console.log(`  ${line}: ${text.slice(0, 110)}`);
  }
}
console.log(`\n${total} piece(s) of possibly untranslated text in ${files.length} file(s).`);
console.log('Some are data (database column names, sample content). Anything a student reads should use t().');
