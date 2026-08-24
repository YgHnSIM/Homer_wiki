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

  const indexPath = path.join(sandbox, "wiki", "index.md")
  const originalIndex = fs.readFileSync(indexPath, "utf8")
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

  console.log("Wiki tooling regression tests passed: red-link policy, YAML parsing, dynamic concepts.")
} finally {
  fs.rmSync(sandbox, { recursive: true, force: true })
}
