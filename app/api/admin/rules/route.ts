import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { reloadRules } from '../../../../agents/compliance'

export async function GET(): Promise<NextResponse> {
  const rulesDir = path.join(process.cwd(), 'data', 'rules')
  try {
    const sebi = JSON.parse(fs.readFileSync(path.join(rulesDir, 'sebi.json'), 'utf-8')) as unknown[]
    const brand = JSON.parse(fs.readFileSync(path.join(rulesDir, 'brand.json'), 'utf-8')) as unknown[]
    const legal = JSON.parse(fs.readFileSync(path.join(rulesDir, 'legal.json'), 'utf-8')) as unknown[]
    return NextResponse.json({ sebi, brand, legal })
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to read rules: ${(err as Error).message}` },
      { status: 500 },
    )
  }
}

const ALLOWED_FILES = ['sebi', 'brand', 'legal']

interface RulesRequestBody {
  filename: string
  rules: unknown[]
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: RulesRequestBody
  try {
    body = await req.json() as RulesRequestBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { filename, rules } = body

  if (!filename || !Array.isArray(rules)) {
    return NextResponse.json({ error: 'Missing required fields: filename, rules (array)' }, { status: 400 })
  }

  // Strip .json extension if provided, then validate
  const baseName = filename.replace(/\.json$/, '')
  if (!ALLOWED_FILES.includes(baseName)) {
    return NextResponse.json(
      { error: `Invalid filename. Allowed: ${ALLOWED_FILES.join(', ')}` },
      { status: 400 },
    )
  }

  const filePath = path.join(process.cwd(), 'data', 'rules', `${baseName}.json`)

  try {
    fs.writeFileSync(filePath, JSON.stringify(rules, null, 2), 'utf-8')
  } catch (err) {
    return NextResponse.json({ error: `Failed to write rules file: ${(err as Error).message}` }, { status: 500 })
  }

  reloadRules()

  return NextResponse.json({ success: true })
}
