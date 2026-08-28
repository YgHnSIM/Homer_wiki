import { spawnSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const VALIDATOR = path.join(PROJECT_ROOT, "scripts", "validate-wiki.mjs")
const MATRIX_BUILDER = path.join(PROJECT_ROOT, "scripts", "build-concept-source-matrix.mjs")
const TEMP_BASE = path.resolve(os.tmpdir())
const sandbox = fs.mkdtempSync(path.join(TEMP_BASE, "homer-wiki-tooling-"))

if (!sandbox.startsWith(`${TEMP_BASE}${path.sep}`)) {
  throw new Error("Test sandbox escaped the operating-system temporary directory.")
}

function run(script, args = []) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd: sandbox,
    encoding: "utf8",
  })
}

function assertFailure(result, expectedMessage) {
  const output = `${result.stdout}\n${result.stderr}`
  if (result.status === 0 || !output.includes(expectedMessage)) {
    throw new Error(
      `Expected tooling failure containing '${expectedMessage}', got status ${result.status}.\n${output}`,
    )
  }
}

function assertSuccess(result, context) {
  if (result.status !== 0) {
    throw new Error(`${context}\n${result.stdout}\n${result.stderr}`)
  }
}

try {
  fs.copyFileSync(path.join(PROJECT_ROOT, "index.md"), path.join(sandbox, "index.md"))
  for (const directory of ["wiki", "words", "raw"]) {
    fs.cpSync(path.join(PROJECT_ROOT, directory), path.join(sandbox, directory), {
      recursive: true,
    })
  }
  fs.mkdirSync(path.join(sandbox, "scripts"))
  fs.copyFileSync(
    path.join(PROJECT_ROOT, "scripts", "allowed-red-links.json"),
    path.join(sandbox, "scripts", "allowed-red-links.json"),
  )

  const conceptPath = path.join(sandbox, "wiki", "concepts", "concept-menis.md")
  const originalConcept = fs.readFileSync(conceptPath, "utf8")
  fs.writeFileSync(conceptPath, `${originalConcept}\n[[concept-aidso]]\n`)
  assertFailure(run(VALIDATOR), "등록되지 않은 빨간 링크입니다: concept-aidso")

  fs.writeFileSync(conceptPath, originalConcept.replace(/^title:.*$/m, 'title: ["unterminated'))
  assertFailure(run(VALIDATOR), "YAML 파싱 오류")
  fs.writeFileSync(conceptPath, originalConcept)

  const sourceName = fs
    .readdirSync(path.join(sandbox, "wiki", "sources"))
    .find((name) => name.endsWith(".md"))
  if (sourceName === undefined) throw new Error("Source-integrity test requires one source page.")
  const sourcePath = path.join(sandbox, "wiki", "sources", sourceName)
  const originalSource = fs.readFileSync(sourcePath, "utf8")

  // Given: a source page points to neither an HTTP(S) URL nor a file under raw/.
  fs.writeFileSync(
    sourcePath,
    originalSource.replace(/^sources:.*$/m, "sources: [not-a-real-source]"),
  )
  // When: the repository validator checks the source page.
  const invalidSourceResult = run(VALIDATOR)
  // Then: the unresolvable value is rejected instead of bypassing existence checks.
  assertFailure(invalidSourceResult, "raw 원본을 찾을 수 없습니다: not-a-real-source")
  fs.writeFileSync(sourcePath, originalSource)

  fs.writeFileSync(
    sourcePath,
    originalSource.replace(/^sources:.*$/m, "sources: [HTTPS://example.com/source]"),
  )
  assertFailure(
    run(VALIDATOR),
    "소스 페이지의 쉼표 포함 값·PDF명·URL은 항목별로 인용해야 합니다.",
  )

  fs.writeFileSync(
    sourcePath,
    originalSource.replace(/^sources:.*$/m, 'sources: ["https://example.com/source"]'),
  )
  assertSuccess(run(VALIDATOR), "A quoted HTTPS source should pass validation.")

  fs.writeFileSync(
    sourcePath,
    originalSource.replace(
      /^sources:.*$/m,
      'sources: ["https://a.example/source", HTTPS://b.example/source, "https://c.example/source"]',
    ),
  )
  assertFailure(
    run(VALIDATOR),
    "소스 페이지의 쉼표 포함 값·PDF명·URL은 항목별로 인용해야 합니다.",
  )

  fs.writeFileSync(
    sourcePath,
    originalSource.replace(/^sources:.*$/m, 'sources: ["README.md"]'),
  )
  assertSuccess(run(VALIDATOR), "An existing file under raw/ should pass validation.")

  fs.writeFileSync(
    sourcePath,
    originalSource.replace(/^sources:.*$/m, 'sources: ["../wiki/log.md"]'),
  )
  assertFailure(run(VALIDATOR), "raw 원본을 찾을 수 없습니다: ../wiki/log.md")

  fs.writeFileSync(
    sourcePath,
    originalSource.replace(/^sources:.*$/m, "sources: [assets]"),
  )
  assertFailure(run(VALIDATOR), "raw 원본을 찾을 수 없습니다: assets")

  const externalRawDirectory = path.join(sandbox, "outside-raw")
  fs.mkdirSync(externalRawDirectory)
  fs.writeFileSync(path.join(externalRawDirectory, "external.pdf"), "not actually under raw")
  fs.symlinkSync(
    externalRawDirectory,
    path.join(sandbox, "raw", "external-assets"),
    process.platform === "win32" ? "junction" : "dir",
  )
  fs.writeFileSync(
    sourcePath,
    originalSource.replace(/^sources:.*$/m, 'sources: ["external-assets/external.pdf"]'),
  )
  assertFailure(
    run(VALIDATOR),
    "raw 원본을 찾을 수 없습니다: external-assets/external.pdf",
  )
  fs.writeFileSync(sourcePath, originalSource)

  const entityName = fs
    .readdirSync(path.join(sandbox, "wiki", "entities"))
    .find((name) => name.startsWith("entity-") && name.endsWith(".md"))
  if (entityName === undefined) throw new Error("Source-reference test requires one entity page.")
  const entityPath = path.join(sandbox, "wiki", "entities", entityName)
  const originalEntity = fs.readFileSync(entityPath, "utf8")
  fs.writeFileSync(
    entityPath,
    originalEntity.replace(/^sources:.*$/m, "sources: [../log.md]"),
  )
  assertFailure(run(VALIDATOR), "wiki/sources 문서를 찾을 수 없습니다: ../log.md")

  fs.writeFileSync(entityPath, originalEntity.replace(/^sources:.*$/m, 'sources: [""]'))
  assertFailure(run(VALIDATOR), "wiki/sources 문서를 찾을 수 없습니다:")

  const nestedSourceDirectory = path.join(sandbox, "wiki", "sources", "nested")
  fs.mkdirSync(nestedSourceDirectory)
  fs.copyFileSync(sourcePath, path.join(nestedSourceDirectory, sourceName))
  const backslashSource = `nested\\${sourceName}`
  fs.writeFileSync(
    entityPath,
    originalEntity.replace(/^sources:.*$/m, `sources: [${backslashSource}]`),
  )
  assertFailure(
    run(VALIDATOR),
    `wiki/sources 문서를 찾을 수 없습니다: ${backslashSource}`,
  )
  fs.rmSync(nestedSourceDirectory, { recursive: true })
  fs.writeFileSync(entityPath, originalEntity)

  const indexPath = path.join(sandbox, "wiki", "index.md")
  const originalIndex = fs.readFileSync(indexPath, "utf8")

  const unlistedEntityId = "entity-tooling-person"
  fs.writeFileSync(
    path.join(sandbox, "wiki", "entities", `${unlistedEntityId}.md`),
    [
      "---",
      "title: 도구 인물",
      "aliases: [Tooling Person]",
      "tags: [type/entity, domain/mythology, status/active]",
      "created: 2026-08-25",
      "updated: 2026-08-25",
      "sources: []",
      "status: active",
      "---",
      "",
      "# 도구 인물",
      "",
      "## 관련 항목",
    ].join("\n"),
  )
  fs.writeFileSync(
    indexPath,
    originalIndex.replace(
      /^## 인물\s*$/m,
      `## 인물\n\n- [[${unlistedEntityId}|도구 인물]]`,
    ),
  )
  assertFailure(
    run(VALIDATOR),
    `공개 입구 문서의 인물 목록에서 엔티티가 누락되었습니다: ${unlistedEntityId}`,
  )
  fs.rmSync(path.join(sandbox, "wiki", "entities", `${unlistedEntityId}.md`))
  fs.writeFileSync(indexPath, originalIndex)

  fs.writeFileSync(
    indexPath,
    originalIndex.replace(
      /^## 개념\s*$/m,
      "## 개념\n\n- [[concept-new|신규 개념 (New)]]",
    ),
  )
  fs.writeFileSync(
    path.join(sandbox, "wiki", "concepts", "concept-new.md"),
    "---\nsources: []\n---\n",
  )
  const matrixResult = run(MATRIX_BUILDER)
  if (matrixResult.status !== 0 || !matrixResult.stdout.includes("[[concept-new\\|신규 개념]]")) {
    throw new Error(`Matrix builder omitted a newly indexed concept.\n${matrixResult.stderr}`)
  }

  const relatedOnlySourceId = "tooling-2000-related-only"
  fs.writeFileSync(
    path.join(sandbox, "wiki", "sources", `${relatedOnlySourceId}.md`),
    '---\naliases: [concept-menis]\nkey_concepts: ["[[concept-aidos|Aidos]]"]\nsources: []\n---\n\n## 관련 항목\n\n- [[concept-menis|메니스]]\n',
  )
  fs.writeFileSync(
    indexPath,
    fs.readFileSync(indexPath, "utf8").replace(
      /^## 소스 문서\s*$/m,
      `## 소스 문서\n\n- [[${relatedOnlySourceId}|도구 2000]]`,
    ),
  )
  const relatedOnlyResult = run(MATRIX_BUILDER)
  const relatedOnlyRow = relatedOnlyResult.stdout
    .split(/\r?\n/)
    .find((line) => line.includes(`[[${relatedOnlySourceId}\\|`))
  if (
    relatedOnlyResult.status !== 0 ||
    !relatedOnlyRow?.match(/\]\] \| — \| — \| 언급 \|/)
  ) {
    throw new Error(
      `Matrix builder treated a related-item link as evidence.\n${relatedOnlyResult.stdout}\n${relatedOnlyResult.stderr}`,
    )
  }

  // Bold markdown syntax tests
  const boldTestFile = path.join(sandbox, "wiki", "concepts", "concept-menis.md")
  const boldOriginal = fs.readFileSync(boldTestFile, "utf8")

  // Case 1: Inner opening quote
  fs.writeFileSync(boldTestFile, `${boldOriginal}\n**'잘못된 강조'**\n`)
  assertFailure(run(VALIDATOR), "볼드 마커 안쪽에 인접한 여는 문장부호가 있습니다")

  // Case 2: Inner closing quote
  fs.writeFileSync(boldTestFile, `${boldOriginal}\n**잘못된 강조'**\n`)
  assertFailure(run(VALIDATOR), "볼드 마커 안쪽에 인접한 닫는 문장부호가 있습니다")

  // Case 3: Parentheses inside bold with adjacent Korean particle
  fs.writeFileSync(boldTestFile, `${boldOriginal}\n**표제어(원어)**는\n`)
  assertFailure(run(VALIDATOR), "볼드 내부에 괄호가 포함된 상태로 조사가 직결되었습니다")

  // Case 4: Spaces at bold boundaries
  fs.writeFileSync(boldTestFile, `${boldOriginal}\n** 공백 포함 **\n`)
  assertFailure(run(VALIDATOR), "볼드 마커 안쪽 경계에 불필요한 공백이 있습니다")

  // Case 5: Unbalanced bold marker on a single line
  fs.writeFileSync(boldTestFile, `${boldOriginal}\n**닫히지 않은 볼드\n`)
  assertFailure(run(VALIDATOR), "단일 행에 닫히지 않은 볼드 마커(**)가 있습니다")

  fs.writeFileSync(boldTestFile, boldOriginal)

  // Deprecated terminology test (서사시환 -> 에픽 사이클)
  fs.writeFileSync(boldTestFile, `${boldOriginal}\n후대 서사시환 전승에 따르면\n`)
  assertFailure(run(VALIDATOR), "폐기된 구 한자어 표기 '서사시환'이 포함되어 있습니다")

  fs.writeFileSync(boldTestFile, boldOriginal)

  console.log(
    "Wiki tooling regression tests passed: red-link policy, YAML parsing, source integrity, dynamic concepts, evidence boundaries, bold syntax rules, deprecated terminology.",
  )
} finally {
  fs.rmSync(sandbox, { recursive: true, force: true })
}

