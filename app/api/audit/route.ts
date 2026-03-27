import { NextResponse } from 'next/server'
import { getAuditLog } from '@/lib/db'

export async function GET(): Promise<NextResponse> {
  try {
    const rows = getAuditLog()
    return NextResponse.json(rows)
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to fetch audit log: ${(err as Error).message}` },
      { status: 500 },
    )
  }
}
