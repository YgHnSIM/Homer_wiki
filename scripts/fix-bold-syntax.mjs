import fs from "node:fs"
import path from "node:path"

const ROOT = process.cwd()

function walkMarkdown(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    return entry.isDirectory() ? walkMarkdown(full) : full.endsWith(".md") ? [full] : []
  })
}

export function fixBoldSyntaxInText(content) {
  const lines = content.split(/\r?\n/)
  let inFence = false
  let modifiedCount = 0

  const fixedLines = lines.map((line) => {
    if (/^\s*```/.test(line)) {
      inFence = !inFence
      return line
    }
    if (inFence) return line

    let updated = line

    // Compound patterns with possible inner italics
    updated = updated.replaceAll(
      /\*\*['‘]((?:[^*]|\*(?!\*))+?)['’]인가,\s*아니면\s*['‘]((?:[^*]|\*(?!\*))+?)['’]인가\*\*/g,
      "‘**$1**’인가, 아니면 ‘**$2**’인가",
    )
    updated = updated.replaceAll(/\*\*([^*]+?):\s*「([^」]+)」\*\*/g, "**$1**: 「**$2**」")
    updated = updated.replaceAll(/\*\*([^*]+?):\s*『([^』]+)』\*\*/g, "**$1**: 『**$2**』")
    updated = updated.replaceAll(/\*\*([^*]+?):\s*["“]([^"”]+)["”]\*\*/g, "**$1**: “**$2**”")
    updated = updated.replaceAll(/\*\*([^*]+?):\s*['‘]([^'‘]+)['’]\*\*/g, "**$1**: ‘**$2**’")

    // 1. **'text'** -> '**text**' (handling quotes, curly quotes, double quotes, guillemets, brackets)
    updated = updated.replaceAll(/\*\*['‘]((?:[^*]|\*(?!\*))+?)['’]\*\*/g, "‘**$1**’")
    updated = updated.replaceAll(/\*\*["“]((?:[^*]|\*(?!\*))+?)["”]\*\*/g, "“**$1**”")
    updated = updated.replaceAll(/\*\*『((?:[^*]|\*(?!\*))+?)』\*\*/g, "『**$1**』")
    updated = updated.replaceAll(/\*\*「((?:[^*]|\*(?!\*))+?)」\*\*/g, "「**$1**」")

    // Handle **『서명』 나머지텍스트** -> 『**서명**』 **나머지텍스트**
    updated = updated.replaceAll(/\*\*『([^』]+)』\s*((?:[^*]|\*(?!\*))+?)\*\*/g, "『**$1**』 **$2**")
    updated = updated.replaceAll(/\*\*「([^」]+)」\s*((?:[^*]|\*(?!\*))+?)\*\*/g, "「**$1**」 **$2**")

    // Handle **앞텍스트 '인용구'** -> **앞텍스트** '**인용구**'
    updated = updated.replaceAll(/\*\*([^*]+?)\s*['‘]([^*'‘]+?)['’]\*\*/g, "**$1** ‘**$2**’")
    updated = updated.replaceAll(/\*\*([^*]+?)\s*["“]([^*"“]+?)["”]\*\*/g, "**$1** “**$2**”")

    // 2. **표제어(원어)**조사 -> **표제어**(원어)조사
    updated = updated.replaceAll(
      /\*\*([^*()\r\n]+)\(([^)\r\n]+)\)\*\*([가-힣])/g,
      "**$1**($2)$3",
    )

    // 3. Trailing/leading single quotes/brackets inside bold if still present
    updated = updated.replaceAll(/\*\*['‘]((?:[^*]|\*(?!\*))+?)\*\*/g, "‘**$1**’")
    updated = updated.replaceAll(/\*\*([^*]+?)['’]\*\*/g, "‘**$1**’")
    updated = updated.replaceAll(/\*\*["“]((?:[^*]|\*(?!\*))+?)\*\*/g, "“**$1**”")
    updated = updated.replaceAll(/\*\*([^*]+?)["”]\*\*/g, "“**$1**”")
    updated = updated.replaceAll(/\*\*『((?:[^*]|\*(?!\*))+?)\*\*/g, "『**$1**』")
    updated = updated.replaceAll(/\*\*([^*]+?)』\*\*/g, "『**$1**』")

    if (updated !== line) {
      modifiedCount += 1
    }
    return updated
  })

  return { fixedContent: fixedLines.join("\n"), modifiedCount }
}

export function runFixer({ write = false } = {}) {
  const targetFiles = [
    path.join(ROOT, "index.md"),
    ...walkMarkdown(path.join(ROOT, "wiki")),
    ...walkMarkdown(path.join(ROOT, "words")),
  ]

  let totalModifiedFiles = 0
  let totalModifications = 0

  for (const file of targetFiles) {
    const relativePath = path.relative(ROOT, file).replace(/\\/g, "/")
    const originalContent = fs.readFileSync(file, "utf8")
    const { fixedContent, modifiedCount } = fixBoldSyntaxInText(originalContent)

    if (modifiedCount > 0) {
      totalModifiedFiles += 1
      totalModifications += modifiedCount
      console.log(`[FIX] ${relativePath}: ${modifiedCount} line(s) modified`)
      if (write) {
        fs.writeFileSync(file, fixedContent, "utf8")
      }
    }
  }

  console.log(
    `\nTotal: ${totalModifications} line(s) modified across ${totalModifiedFiles} file(s) (write: ${write}).`,
  )
  return { totalModifiedFiles, totalModifications }
}

if (process.argv[1] && process.argv[1].endsWith("fix-bold-syntax.mjs")) {
  const write = process.argv.includes("--write")
  runFixer({ write })
}
