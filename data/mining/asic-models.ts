export type VerificationState = "unknown" | "provided" | "verified";

export type AsicCategory =
  | "Entrada"
  | "Operación profesional"
  | "Alto rendimiento"
  | "Hydro";

export type CoolingType = "air" | "hydro";

export type MiningField<T> = {
  state: VerificationState;
  value: T | null;
};

export type MiningAssetField = {
  alt: string | null;
  src: string | null;
  state: VerificationState;
};

export type MiningLinkField = {
  href: string | null;
  state: VerificationState;
};

export type MiningAvailabilityField = {
  label: string | null;
  state: VerificationState;
};

export type MiningReferencePriceField = {
  amount: number | null;
  currency: "CLP" | "USD" | null;
  state: VerificationState;
};

export type MiningHostingField = {
  label: string | null;
  state: VerificationState;
};

export type AsicModel = {
  availability: MiningAvailabilityField;
  category: AsicCategory;
  cooling: MiningField<CoolingType>;
  displayOrder: number;
  efficiency: MiningField<number>;
  hashrate: MiningField<number>;
  hosting: MiningHostingField;
  image: MiningAssetField;
  manufacturer: string;
  model: string;
  power: MiningField<number>;
  referencePrice: MiningReferencePriceField;
  slug: string;
  technicalSheetUrl: MiningLinkField;
  verification: {
    commercial: VerificationState;
    technicalSheet: VerificationState;
  };
};

export const ASIC_CATEGORY_ORDER: AsicCategory[] = [
  "Entrada",
  "Operación profesional",
  "Alto rendimiento",
  "Hydro",
];

const unknownAvailability: MiningAvailabilityField = {
  label: null,
  state: "unknown",
};

const unknownAsset: MiningAssetField = {
  alt: null,
  src: null,
  state: "unknown",
};

const unknownLink: MiningLinkField = {
  href: null,
  state: "unknown",
};

const unknownPrice: MiningReferencePriceField = {
  amount: null,
  currency: null,
  state: "unknown",
};

const unknownHosting: MiningHostingField = {
  label: null,
  state: "unknown",
};

const unknownCooling: MiningField<CoolingType> = {
  value: null,
  state: "unknown",
};

const unknownPower: MiningField<number> = {
  value: null,
  state: "unknown",
};

const unknownEfficiency: MiningField<number> = {
  value: null,
  state: "unknown",
};

function createAsicModel(input: {
  category: AsicCategory;
  displayOrder: number;
  hashrate: number;
  manufacturer: string;
  model: string;
  slug: string;
}): AsicModel {
  return {
    manufacturer: input.manufacturer,
    model: input.model,
    slug: input.slug,
    category: input.category,
    hashrate: {
      value: input.hashrate,
      state: "provided",
    },
    cooling: unknownCooling,
    power: unknownPower,
    efficiency: unknownEfficiency,
    image: unknownAsset,
    availability: unknownAvailability,
    referencePrice: unknownPrice,
    hosting: unknownHosting,
    technicalSheetUrl: unknownLink,
    verification: {
      commercial: "provided",
      technicalSheet: "unknown",
    },
    displayOrder: input.displayOrder,
  };
}

export const asicModels: AsicModel[] = [
  createAsicModel({
    manufacturer: "Canaan",
    model: "Avalon Nano 3S",
    slug: "canaan-avalon-nano-3s",
    category: "Entrada",
    hashrate: 6,
    displayOrder: 1,
  }),
  createAsicModel({
    manufacturer: "FLU Miner",
    model: "BTC T3",
    slug: "flu-miner-btc-t3",
    category: "Entrada",
    hashrate: 110,
    displayOrder: 2,
  }),
  createAsicModel({
    manufacturer: "Bitmain",
    model: "Antminer S19K Pro",
    slug: "bitmain-antminer-s19k-pro",
    category: "Operación profesional",
    hashrate: 120,
    displayOrder: 3,
  }),
  createAsicModel({
    manufacturer: "MicroBT",
    model: "WhatsMiner M60S+",
    slug: "microbt-whatsminer-m60s-plus",
    category: "Operación profesional",
    hashrate: 208,
    displayOrder: 4,
  }),
  createAsicModel({
    manufacturer: "Bitmain",
    model: "Antminer S21+",
    slug: "bitmain-antminer-s21-plus",
    category: "Operación profesional",
    hashrate: 235,
    displayOrder: 5,
  }),
  createAsicModel({
    manufacturer: "Bitmain",
    model: "Antminer S21 Pro",
    slug: "bitmain-antminer-s21-pro",
    category: "Operación profesional",
    hashrate: 245,
    displayOrder: 6,
  }),
  createAsicModel({
    manufacturer: "Bitmain",
    model: "Antminer S21 XP",
    slug: "bitmain-antminer-s21-xp",
    category: "Alto rendimiento",
    hashrate: 270,
    displayOrder: 7,
  }),
  createAsicModel({
    manufacturer: "Canaan",
    model: "Avalon A1566HA",
    slug: "canaan-avalon-a1566ha",
    category: "Alto rendimiento",
    hashrate: 480,
    displayOrder: 8,
  }),
  createAsicModel({
    manufacturer: "Bitmain",
    model: "Antminer S21+ Hydro",
    slug: "bitmain-antminer-s21-plus-hydro",
    category: "Hydro",
    hashrate: 395,
    displayOrder: 9,
  }),
  createAsicModel({
    manufacturer: "Bitmain",
    model: "Antminer S21 XP Hydro",
    slug: "bitmain-antminer-s21-xp-hydro",
    category: "Hydro",
    hashrate: 473,
    displayOrder: 10,
  }),
  createAsicModel({
    manufacturer: "MicroBT",
    model: "WhatsMiner M63S+",
    slug: "microbt-whatsminer-m63s-plus",
    category: "Hydro",
    hashrate: 440,
    displayOrder: 11,
  }),
  createAsicModel({
    manufacturer: "Bitmain",
    model: "Antminer S23 Hydro",
    slug: "bitmain-antminer-s23-hydro",
    category: "Hydro",
    hashrate: 580,
    displayOrder: 12,
  }),
].sort((left, right) => left.displayOrder - right.displayOrder);
