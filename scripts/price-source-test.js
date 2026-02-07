/* eslint-disable no-console */

function selectPriceSource({ presetQuote, presetPrice, presetSource }) {
  const isManual = String(presetSource || "")
    .toLowerCase()
    .startsWith("manual:");
  if (!isManual && presetQuote != null && presetQuote > 0) return "preset_quote";
  if (!isManual && presetPrice != null && presetPrice > 0) return "preset_price";
  return "snapshot";
}

function resolvePrice({ presetPrice, presetSource, snapshotPrice }) {
  const used = selectPriceSource({ presetPrice, presetSource });
  return used === "snapshot" ? snapshotPrice : presetPrice;
}

function assertEqual(label, actual, expected) {
  if (actual !== expected) {
    console.error(`FAIL ${label}: expected ${expected}, got ${actual}`);
    process.exit(1);
  }
}

// Caso A: manual smoke debe ignorar preset y usar snapshot.
{
  const snapshotPrice = 60000000;
  const presetPrice = 50000000;
  const used = selectPriceSource({ presetPrice, presetSource: "manual:smoke_sell_btc" });
  const resolved = resolvePrice({ presetPrice, presetSource: "manual:smoke_sell_btc", snapshotPrice });
  assertEqual("case A source", used, "snapshot");
  assertEqual("case A price", resolved, snapshotPrice);
}

// Caso B: preset_price válido con source no manual.
{
  const snapshotPrice = 60000000;
  const presetPrice = 58000000;
  const used = selectPriceSource({ presetPrice, presetSource: "admin:override" });
  const resolved = resolvePrice({ presetPrice, presetSource: "admin:override", snapshotPrice });
  assertEqual("case B source", used, "preset_price");
  assertEqual("case B price", resolved, presetPrice);
}

// Caso C: preset_quote válido con source no manual.
{
  const used = selectPriceSource({
    presetQuote: 10000,
    presetPrice: 58000000,
    presetSource: "admin:quote",
  });
  assertEqual("case C source", used, "preset_quote");
}

console.log("OK price source tests");
