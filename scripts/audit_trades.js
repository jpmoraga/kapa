const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");

dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });

const prisma = new PrismaClient();

function toBigInt(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "bigint") return value;
  if (typeof value === "number" && Number.isFinite(value)) {
    return BigInt(Math.trunc(value));
  }
  if (typeof value === "string" && value.trim() !== "") return BigInt(value);
  return null;
}

function toIso(ms) {
  if (!ms) return null;
  const num = Number(ms);
  if (!Number.isFinite(num)) return null;
  return new Date(num).toISOString();
}

async function main() {
  const marketId = (process.argv[2] ?? "btc-clp").toLowerCase();
  const checkTicker = process.argv.includes("--ticker");

  const total = await prisma.marketTrade.count({ where: { marketId } });

  const agg = await prisma.marketTrade.aggregate({
    where: { marketId },
    _min: { timeMs: true },
    _max: { timeMs: true },
  });

  const minMs = toBigInt(agg._min.timeMs ?? null);
  const maxMs = toBigInt(agg._max.timeMs ?? null);
  const spanMs = minMs && maxMs ? Number(maxMs - minMs) : 0;
  const spanHours = spanMs / 1000 / 3600;
  const spanDays = spanHours / 24;

  const last500 = await prisma.marketTrade.findMany({
    where: { marketId },
    orderBy: { timeMs: "desc" },
    take: 500,
    select: { timeMs: true, price: true },
  });

  const last500Newest = last500[0]?.timeMs ? toBigInt(last500[0].timeMs) : null;
  const last500Oldest = last500[last500.length - 1]?.timeMs
    ? toBigInt(last500[last500.length - 1].timeMs)
    : null;
  const last500SpanMs =
    last500Newest && last500Oldest ? Number(last500Newest - last500Oldest) : 0;
  const last500SpanHours = last500SpanMs / 1000 / 3600;

  const perDay = await prisma.$queryRaw`
    SELECT DATE(to_timestamp(("timeMs"::double precision) / 1000.0)) AS day,
           COUNT(*)::bigint AS count
    FROM "MarketTrade"
    WHERE "marketId" = ${marketId}
    GROUP BY day
    ORDER BY day;
  `;

  const dup = await prisma.$queryRaw`
    SELECT COALESCE(SUM(c - 1), 0)::bigint AS duplicates
    FROM (
      SELECT COUNT(*) AS c
      FROM "MarketTrade"
      WHERE "marketId" = ${marketId}
      GROUP BY "marketId", "timeMs", "price", "amount", "direction"
      HAVING COUNT(*) > 1
    ) t;
  `;

  const duplicates = dup?.[0]?.duplicates ?? 0n;

  console.log("=== Trade audit ===");
  console.log("Market:", marketId);
  console.log("Total trades stored:", total);
  console.log("Oldest trade:", toIso(minMs));
  console.log("Newest trade:", toIso(maxMs));
  console.log("History span:", `${spanDays.toFixed(2)} days (${spanHours.toFixed(2)}h)`);
  console.log("Last 500 span:", `${last500SpanHours.toFixed(2)}h`);
  console.log("Duplicates:", String(duplicates));

  if (Array.isArray(perDay) && perDay.length) {
    console.log("Trades per day:");
    for (const row of perDay) {
      console.log(`- ${row.day}: ${row.count}`);
    }
  } else {
    console.log("Trades per day: none");
  }

  if (checkTicker && last500.length) {
    const latestPrice = Number(last500[0]?.price ?? 0);
    try {
      const tickerRes = await fetch(
        `https://www.buda.com/api/v2/markets/${marketId}/ticker`,
        { headers: { accept: "application/json" } }
      );
      const tickerJson = await tickerRes.json();
      const last = Number(tickerJson?.ticker?.last_price?.[0] ?? 0);
      const diffPct = last ? ((latestPrice - last) / last) * 100 : 0;

      console.log("Ticker compare:");
      console.log("Latest trade price:", latestPrice);
      console.log("Buda last_price:", last);
      console.log("Diff %:", diffPct.toFixed(4));
    } catch (e) {
      console.warn("Ticker compare failed:", e?.message ?? String(e));
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
