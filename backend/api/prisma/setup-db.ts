import { spawnSync } from "node:child_process"
import { resolve } from "node:path"

const projectDirectory = process.cwd()
const prismaDirectory = resolve(projectDirectory, "prisma")
const schemaFile = resolve(prismaDirectory, "schema.prisma")
const prismaCli = resolve(projectDirectory, "node_modules", "prisma", "build", "index.js")

const result = spawnSync(process.execPath, [prismaCli, "db", "push", "--schema", schemaFile], {
  cwd: projectDirectory,
  stdio: "inherit",
})

process.exit(result.status ?? 1)
