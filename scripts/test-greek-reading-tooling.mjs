import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { collectInventory, extractGreekMatches, extractGreekRuns, parseMarkdown } from "./greek-reading-inventory.mjs"
import { validateRepository } from "./greek-reading-validation.mjs"

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const INVENTORY_CLI = path.join(PROJECT_ROOT, "scripts", "greek-reading-inventory.mjs")
const VALIDATION_CLI = path.join(PROJECT_ROOT, "scripts", "greek-reading-validation.mjs")
const TEMP_ROOT = fs.mkdtempSync(path.join(os.tmpdir(), "homer-greek-reading-"))

const concept = `---
title: 메니스 (Menis)
aliases: [Menis, μῆνις, Mênis, mē̂nis, Menis-old]
tags: [type/concept, status/active]
created: 2026-08-26
updated: 2026-08-26
sources: []
status: active
korean_name: 메니스
conventional_latin: Menis
greek: "μῆνις"
transliteration: "mē\u0302nis"
transliteration_system: homeric-oriented-v1
cssclasses: [greek-reading-page]
---

# 메니스 (Menis)
**[[greek-reading-guide|읽는 법]]**: 메니스 · **원어**: μῆνις · **학술 전사**: *mē\u0302nis*

- **번역**: 노래하라, 여신이여
- **원문**: *μῆνιν ἄειδε θεὰ Πηληϊάδεω Ἀχιλῆος*
- **학술 전사**: *mē\u0302nin áeide theà Pēlēïádeō Akhilēos*

| 그리스어 실제형 | 학술 전사 | 한국어 풀이 |
|:---|:---|:---|
| μῆνιν | mē\u0302nin | 분노를 |
`

const word = `---
title: Odyssey (오뒷세이아)
word: Odyssey
aliases: [Odyssey, Ὀδύσσεια, Odússeia]
tags: [type/word, status/active]
created: 2026-08-26
updated: 2026-08-26
sources: []
status: active
korean_name: 오뒷세이아
conventional_latin: Odyssey
greek: "Ὀδύσσεια"
transliteration: "Odússeia"
transliteration_system: homeric-oriented-v1
cssclasses: [greek-reading-page]
---

# Odyssey (오뒷세이아)
**[[greek-reading-guide|읽는 법]]**: 오뒷세이아 · **원어**: Ὀδύσσεια · **학술 전사**: *Odússeia*
`

const entity = concept
  .replace("title: 메니스 (Menis)", "title: 아킬레우스 (Achilles)")
  .replace("aliases: [Menis, μῆνις, Mênis, mē̂nis, Menis-old]", "aliases: [Achilles, Ἀχιλλεύς, Akhilleús]")
  .replace("type/concept", "type/entity")
  .replace("korean_name: 메니스", "korean_name: 아킬레우스")
  .replace("conventional_latin: Menis", "conventional_latin: Achilles")
  .replace('greek: "μῆνις"', 'greek: "Ἀχιλλεύς"')
  .replace('transliteration: "mē̂nis"', 'transliteration: "Akhilleús"')
  .replace("# 메니스 (Menis)", "# 아킬레우스 (Achilles)")
  .replace("읽는 법]]**: 메니스 · **원어**: μῆνις · **학술 전사**: *mē̂nis*", "읽는 법]]**: 아킬레우스 · **원어**: Ἀχιλλεύς · **학술 전사**: *Akhilleús*")

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`)
}

function makeFixture() {
  const root = fs.mkdtempSync(path.join(TEMP_ROOT, "case-"))
  for (const directory of ["scripts", "wiki/concepts", "wiki/entities", "wiki/meta", "words"]) {
    fs.mkdirSync(path.join(root, directory), { recursive: true })
  }
  fs.writeFileSync(path.join(root, "index.md"), "# 표제 μῆνις\n\n[[concept-menis|μῆνις]]\n\n| 표기 | 예 |\n|:---|:---|\n| 원형 | μῆνις |\n\n```greek\nμῆνις ἄειδε θεὰ Ἀχιλῆος\n```\n")
  fs.writeFileSync(path.join(root, "wiki", "concepts", "concept-menis.md"), concept)
  fs.writeFileSync(path.join(root, "wiki", "entities", "entity-achilles.md"), entity)
  fs.writeFileSync(path.join(root, "words", "word-odyssey.md"), word)
  fs.writeFileSync(path.join(root, "wiki", "log.md"), "기록 μῆνις\n")
  fs.writeFileSync(path.join(root, "wiki", "meta", "internal.md"), "---\ntitle: 내부 (αἰδώς, Aidos)\n---\n내부 αἰδώς\n")
  fs.writeFileSync(path.join(root, "words", "_template.md"), "템플릿 ἔλεος\n")
  writeJson(path.join(root, "scripts", "legacy-greek-reading-pages.json"), {
    schemaVersion: 1,
    reason: "pre-homeric-oriented-v1 migration",
    pages: [],
  })
  writeJson(path.join(root, "scripts", "greek-transliteration-exceptions.json"), {
    schemaVersion: 1,
    transliterationSystem: "homeric-oriented-v1",
    entries: [],
  })
  return root
}

function mutateFile(root, relativePath, transform) {
  const file = path.join(root, ...relativePath.split("/"))
  fs.writeFileSync(file, transform(fs.readFileSync(file, "utf8")))
}

function setLegacy(root, pages) {
  writeJson(path.join(root, "scripts", "legacy-greek-reading-pages.json"), {
    schemaVersion: 1,
    reason: "pre-homeric-oriented-v1 migration",
    pages,
  })
}

function setExceptions(root, entries) {
  writeJson(path.join(root, "scripts", "greek-transliteration-exceptions.json"), {
    schemaVersion: 1,
    transliterationSystem: "homeric-oriented-v1",
    entries,
  })
}

function exception(overrides = {}) {
  return {
    greek: "μῆνιν",
    proposal: "mē\u0302nin",
    approvedTransliteration: "mē\u0302nin",
    reason: "fixture evidence",
    sources: ["Il. 1.1"],
    status: "approved",
    locations: ["wiki/concepts/concept-menis.md:quotation"],
    reviewedBy: "Fixture Reviewer",
    reviewedAt: "2026-08-26",
    ...overrides,
  }
}

function codes(root, baselineLegacyPages = []) {
  return validateRepository({ root, baselineLegacyPages }).errors.map(({ code }) => code)
}

function expectFailure(name, mutate, expectedCode, baselineLegacyPages = []) {
  // Given: an otherwise valid isolated repository fixture.
  const root = makeFixture()
  mutate(root)
  // When: strict structural validation runs once.
  const actualCodes = codes(root, baselineLegacyPages)
  // Then: the machine-consumed failure code identifies the violated contract.
  assert.ok(actualCodes.includes(expectedCode), `${name}: ${actualCodes.join(", ")}`)
}

try {
  // Given: precomposed Greek Extended and decomposed Greek plus a combining mark.
  // When: Greek runs are extracted and normalized.
  const runs = extractGreekRuns("ἀνήρ α\u0313")
  // Then: both Script_Extensions forms produce NFC comparison keys.
  assert.deepEqual(runs, ["ἀνήρ", "ἀ"])
  const matches = extractGreekMatches("α\u0313")
  assert.equal(matches[0].raw, "α\u0313")
  assert.equal(matches[0].normalized, "ἀ")

  const unpipedTable = parseMarkdown(
    "fixture.md",
    "표기 | 학술 전사\n:--- | :---\nμῆνις | mē\u0302nis\n",
  )
  assert.deepEqual(unpipedTable.lines.map(({ area }) => area), ["table", "table", "table", "prose"])

  const validRoot = makeFixture()
  // Given: public, log, internal, template, frontmatter, table, and fenced Greek fixtures.
  // When: the deterministic inventory is collected.
  const inventory = collectInventory(validRoot)
  // Then: scope and location counters expose each machine-relevant category.
  assert.deepEqual(inventory.summary.scopes, { internal: 1, log: 1, public: 4, template: 1 })
  for (const area of ["codeFence", "frontmatter", "heading", "prose", "table"]) {
    assert.ok(inventory.summary.areas[area] > 0, area)
  }
  assert.ok(inventory.summary.publicRuns > 0)
  assert.ok(inventory.summary.publicUniqueRuns > 0)
  assert.ok(inventory.summary.signals.frontmatterTitleRuns > 0)
  assert.ok(inventory.summary.signals.legacyTripleTitles > 0)
  assert.ok(inventory.summary.signals.linkAliasRuns > 0)
  assert.equal(inventory.summary.nfcViolations, 0)
  assert.deepEqual(codes(validRoot), [])

  const invalidYamlRoot = makeFixture()
  mutateFile(invalidYamlRoot, "wiki/concepts/concept-menis.md", (text) => text.replace("title: 메니스 (Menis)", "title: ["))
  assert.throws(() => collectInventory(invalidYamlRoot), TypeError)

  const approvedRoot = makeFixture()
  setExceptions(approvedRoot, [exception()])
  assert.deepEqual(codes(approvedRoot), [])

  const legacyRoot = makeFixture()
  fs.mkdirSync(path.join(legacyRoot, "wiki", "sources"))
  fs.writeFileSync(path.join(legacyRoot, "wiki", "sources", "legacy.md"), "구형 μῆνις (*mênis*)\n")
  setLegacy(legacyRoot, ["wiki/sources/legacy.md"])
  assert.deepEqual(codes(legacyRoot, ["wiki/sources/legacy.md"]), [])

  const cases = [
    ["Greek title", (root) => mutateFile(root, "wiki/concepts/concept-menis.md", (text) => text.replaceAll("메니스 (Menis)", "메니스 (μῆνις, Menis)")), "HEADWORD_TITLE"],
    ["H1 mismatch", (root) => mutateFile(root, "wiki/concepts/concept-menis.md", (text) => text.replace("# 메니스 (Menis)", "# 다른 제목")), "HEADWORD_H1"],
    ["reading row missing", (root) => mutateFile(root, "wiki/concepts/concept-menis.md", (text) => text.replace(/^\*\*\[\[greek-reading-guide.*$/m, "")), "READING_ROW"],
    ["reading row order", (root) => mutateFile(root, "wiki/concepts/concept-menis.md", (text) => text.replace("**원어**: μῆνις · **학술 전사**: *mē\u0302nis*", "**학술 전사**: *mē\u0302nis* · **원어**: μῆνις")), "READING_ROW"],
    ["reading row value", (root) => mutateFile(root, "wiki/concepts/concept-menis.md", (text) => text.replace("**원어**: μῆνις", "**원어**: μῆνιν")), "READING_ROW"],
    ["system", (root) => mutateFile(root, "wiki/concepts/concept-menis.md", (text) => text.replace("homeric-oriented-v1", "other-v1")), "TRANSLITERATION_SYSTEM"],
    ["NFD", (root) => mutateFile(root, "wiki/concepts/concept-menis.md", (text) => text.replaceAll("μῆνις", "α\u0313")), "GREEK_NFC"],
    ["Greek transliteration", (root) => mutateFile(root, "wiki/concepts/concept-menis.md", (text) => text.replaceAll("mē\u0302nis", "μῆνις")), "TRANSLITERATION_SCRIPT"],
    ["aliases", (root) => mutateFile(root, "wiki/concepts/concept-menis.md", (text) => text.replace("aliases: [Menis, μῆνις, Mênis, mē̂nis, Menis-old]", "aliases: [Menis-old]")), "ALIASES_SEARCH_FORMS"],
    ["review used", (root) => setExceptions(root, [exception({ approvedTransliteration: null, status: "review", reviewedBy: null, reviewedAt: null })]), "EXCEPTION_REVIEW_USED"],
    ["duplicate exception", (root) => setExceptions(root, [exception(), exception()]), "EXCEPTION_DUPLICATE"],
    ["stale exception", (root) => setExceptions(root, [exception({ greek: "βῆτα", proposal: "bêta", approvedTransliteration: "bêta" })]), "EXCEPTION_STALE"],
    ["legacy missing", (root) => setLegacy(root, ["wiki/sources/missing.md"]), "LEGACY_STALE"],
    ["legacy new", (root) => { fs.mkdirSync(path.join(root, "wiki", "sources")); fs.writeFileSync(path.join(root, "wiki", "sources", "new.md"), "νέος\n"); setLegacy(root, ["wiki/sources/new.md"]) }, "LEGACY_ADDITION"],
    ["legacy backslash", (root) => setLegacy(root, ["wiki\\sources\\old.md"]), "LEDGER_PATH"],
    ["legacy absolute", (root) => setLegacy(root, ["C:/wiki/old.md"]), "LEDGER_PATH"],
    ["legacy escape", (root) => setLegacy(root, ["../wiki/old.md"]), "LEDGER_PATH"],
    ["quote missing", (root) => mutateFile(root, "wiki/concepts/concept-menis.md", (text) => text.replace(/^- \*\*번역\*\*:.*\n/m, "")), "LONG_QUOTATION"],
    ["quote order", (root) => mutateFile(root, "wiki/concepts/concept-menis.md", (text) => text.replace(/(- \*\*번역\*\*:.*)\n(- \*\*원문\*\*:.*)/, "$2\n$1")), "LONG_QUOTATION"],
    ["table transliteration", (root) => mutateFile(root, "wiki/concepts/concept-menis.md", (text) => text.replace("| 그리스어 실제형 | 학술 전사 |", "| 그리스어 실제형 | 로마자 |")), "TABLE_TRANSLITERATION_COLUMN"],
  ]
  for (const [name, mutate, expectedCode] of cases) expectFailure(name, mutate, expectedCode)

  const reportResult = spawnSync(process.execPath, [INVENTORY_CLI, "--report"], { cwd: validRoot, encoding: "utf8" })
  const repeatedReport = spawnSync(process.execPath, [INVENTORY_CLI, "--report"], { cwd: validRoot, encoding: "utf8" })
  assert.equal(reportResult.status, 0)
  assert.equal(repeatedReport.stdout, reportResult.stdout)
  assert.equal(JSON.parse(reportResult.stdout).schemaVersion, 1)
  const strictResult = spawnSync(process.execPath, [VALIDATION_CLI, "--strict"], { cwd: validRoot, encoding: "utf8" })
  assert.equal(strictResult.status, 0, strictResult.stderr)

  console.log(`Greek reading tooling tests passed: ${cases.length + 8} structural cases.`)
} finally {
  fs.rmSync(TEMP_ROOT, { recursive: true, force: true })
}
