import { spawnSync } from "node:child_process"

process.env.HOMER_REQUIRE_RAW = "1"
const result = spawnSync("npm", ["run", "check"], {
  stdio: "inherit",
  env: process.env,
  shell: true,
})
process.exit(result.status ?? 1)
