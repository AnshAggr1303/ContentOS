export type ContentType = 'news' | 'analysis' | 'explainer' | 'opinion'
export type Language = 'hi' | 'ta' | 'te' | 'bn'
export type Channel = 'et_web' | 'et_app' | 'whatsapp' | 'linkedin' | 'newsletter'
export type AgentName = 'drafter' | 'compliance' | 'localizer' | 'distributor'
export type RiskLevel = 'low' | 'medium' | 'high'
export type PipelineStatus =
  | 'idle' | 'running_a1' | 'awaiting_gate_1'
  | 'running_a2' | 'running_a3' | 'running_a4'
  | 'awaiting_gate_2' | 'complete' | 'failed'

export interface EtWebOutput {
  headline: string
  body: string
  tags: string[]
}

export interface EtAppOutput {
  push_title: string
  card_preview: string
}

export interface WhatsAppOutput {
  text: string
}

export interface LinkedInOutput {
  hook: string
  body: string
  cta: string
}

export interface NewsletterOutput {
  subject: string
  preview_text: string
}

export type ChannelOutputMap = {
  et_web: EtWebOutput
  et_app: EtAppOutput
  whatsapp: WhatsAppOutput
  linkedin: LinkedInOutput
  newsletter: NewsletterOutput
}

export interface ComplianceFlag {
  rule_id: string
  severity: RiskLevel
  quote: string
  rule_description: string
  suggested_fix: string
}

export interface ComplianceResult {
  status: 'PASS' | 'FLAG'
  overall_risk: RiskLevel
  flags: ComplianceFlag[]
}

export interface PipelineJob {
  id: string
  status: PipelineStatus
  input: string
  contentType: ContentType
  selectedLanguages: Language[]
  selectedChannels: Channel[]
  draft?: string
  headlines?: string[]
  selectedHeadline?: string
  complianceResult?: ComplianceResult
  localizations?: Record<Language, string>
  channelOutputs?: Partial<ChannelOutputMap>
  createdAt: Date
  updatedAt: Date
}

export interface AuditEntry {
  jobId: string
  agentName: AgentName
  modelUsed: string
  inputHash: string
  outputSummary: string
  flags: ComplianceFlag[]
  decision: string
  durationMs: number
}
