import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import type { ChatCompletion } from 'groq-sdk/resources/chat/completions'
import { callGroq } from '../lib/groq-client'
import { writeAuditEntry } from '../lib/db'
import type { ComplianceResult } from '../lib/types'

const MODEL = 'llama-3.3-70b-versatile'

export interface ComplianceInput {
  draft: string
  headline: string
  jobId: string
}

function loadRulesFromDisk(): string {
  const rulesDir = path.join(process.cwd(), 'data', 'rules')
  try {
    const sebi = JSON.parse(fs.readFileSync(path.join(rulesDir, 'sebi.json'), 'utf-8'))
    const brand = JSON.parse(fs.readFileSync(path.join(rulesDir, 'brand.json'), 'utf-8'))
    const legal = JSON.parse(fs.readFileSync(path.join(rulesDir, 'legal.json'), 'utf-8'))

    return `SEBI REGULATORY RULES:
${JSON.stringify(sebi, null, 2)}

ET BRAND VOICE RULES:
${JSON.stringify(brand, null, 2)}

LEGAL / DEFAMATION RULES:
${JSON.stringify(legal, null, 2)}`
  } catch (err) {
    throw new Error(`Compliance: Failed to load rules from disk — ${(err as Error).message}`)
  }
}

let cachedRules: string | null = null

function loadRules(): string {
  if (!cachedRules) {
    cachedRules = loadRulesFromDisk()
  }
  return cachedRules
}

export function reloadRules(): void {
  cachedRules = null
}

function buildSystemPrompt(rulesBlock: string): string {
  return `You are the compliance officer for Economic Times. Review articles against the rules below.

${rulesBlock}

Check the article for violations. For each violation:
- Quote the EXACT offending text from the article (verbatim)
- Identify which rule was broken by rule_id
- Provide a specific suggested rewrite

Respond ONLY with valid JSON — no markdown, no code fences — in this exact format:
{
  "status": "PASS",
  "overall_risk": "low",
  "flags": []
}

Or when violations exist:
{
  "status": "FLAG",
  "overall_risk": "high",
  "flags": [
    {
      "rule_id": "SEBI-001",
      "severity": "high",
      "quote": "exact text copied from article",
      "rule_description": "Forward-looking statements must include disclaimer",
      "suggested_fix": "Add '(Subject to market conditions and regulatory approvals)' after the statement"
    }
  ]
}

overall_risk must be "low" if no flags, "medium" if any medium flags, "high" if any high flags.`
}

export async function runCompliance(input: ComplianceInput): Promise<ComplianceResult> {
  const start = Date.now()

  const rulesBlock = loadRules()
  const systemPrompt = buildSystemPrompt(rulesBlock)

  const raw = await callGroq({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Headline: ${input.headline}\n\n${input.draft}` },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
  })

  if (!raw) throw new Error('Compliance: No response from Groq')
  const response = raw as ChatCompletion

  const content = response.choices[0]?.message?.content
  if (!content) throw new Error('Compliance: Empty response content')

  let result: ComplianceResult
  try {
    result = JSON.parse(content) as ComplianceResult
  } catch (err) {
    throw new Error(`Compliance: Failed to parse JSON response — ${(err as Error).message}. Raw: ${content.slice(0, 200)}`)
  }

  const durationMs = Date.now() - start
  const inputHash = crypto.createHash('sha256').update(input.draft).digest('hex').slice(0, 16)

  writeAuditEntry({
    jobId: input.jobId,
    agentName: 'compliance',
    modelUsed: MODEL,
    inputHash,
    outputSummary: `status=${result.status} risk=${result.overall_risk} flags=${result.flags.length}`,
    flags: result.flags,
    decision: result.status,
    durationMs,
  })

  return result
}
