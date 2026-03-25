import "server-only";

import { prisma } from "@/lib/prisma";
import type { TreasuryReviewApplicationPayload } from "@/app/tesoreria-kapa21-biterva/_lib/treasuryReviewApplication";

function nullableText(value: string) {
  return value || null;
}

export async function insertTreasuryReviewApplication(
  payload: TreasuryReviewApplicationPayload
) {
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    insert into public.treasury_review_applications (
      name,
      company,
      role,
      email,
      country,
      annual_revenue,
      industry,
      has_real_operations,
      main_needs,
      context,
      interest_horizon,
      decision_role,
      bitcoin_relationship,
      conversation_goal,
      accepted_terms,
      raw_payload
    )
    values (
      ${payload.name},
      ${payload.company},
      ${payload.role},
      ${payload.email},
      ${payload.country},
      ${nullableText(payload.annualRevenue)},
      ${nullableText(payload.industry)},
      ${nullableText(payload.hasRealOperations)},
      cast(${JSON.stringify(payload.mainNeeds)} as jsonb),
      ${nullableText(payload.context)},
      ${nullableText(payload.interestHorizon)},
      ${nullableText(payload.decisionRole)},
      cast(${JSON.stringify(payload.bitcoinRelationship)} as jsonb),
      ${nullableText(payload.conversationGoal)},
      ${payload.acceptedTerms},
      cast(${JSON.stringify(payload)} as jsonb)
    )
    returning id
  `;

  return rows[0] ?? null;
}
