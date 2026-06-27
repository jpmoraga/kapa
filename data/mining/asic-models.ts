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

export type MiningMonetaryField = {
  amount: number | null;
  currency: "USD" | null;
  state: VerificationState;
};

export type AsicModel = {
  availability: MiningAvailabilityField;
  category: AsicCategory;
  cooling: MiningField<CoolingType>;
  displayOrder: number;
  efficiency: MiningField<number>;
  hashrate: MiningField<number>;
  hosting: MiningMonetaryField;
  image: MiningAssetField;
  manufacturer: string;
  model: string;
  power: MiningField<number>;
  referencePrice: MiningMonetaryField;
  slug: string;
  technicalSheetUrl: MiningLinkField;
  warranty: MiningMonetaryField;
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

const unknownMonetaryField: MiningMonetaryField = {
  amount: null,
  currency: null,
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
  availability?: string;
  category: AsicCategory;
  cooling?: CoolingType;
  displayOrder: number;
  efficiency?: number;
  hashrate: number;
  hostingUsd?: number;
  manufacturer: string;
  model: string;
  power?: number;
  priceUsd?: number;
  slug: string;
  warrantyUsd?: number;
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
    cooling:
      input.cooling !== undefined
        ? {
            value: input.cooling,
            state: "verified",
          }
        : unknownCooling,
    power:
      input.power !== undefined
        ? {
            value: input.power,
            state: "verified",
          }
        : unknownPower,
    efficiency:
      input.efficiency !== undefined
        ? {
            value: input.efficiency,
            state: "verified",
          }
        : unknownEfficiency,
    image: unknownAsset,
    availability:
      input.availability !== undefined
        ? {
            label: input.availability,
            state: "verified",
          }
        : unknownAvailability,
    referencePrice:
      input.priceUsd !== undefined
        ? {
            amount: input.priceUsd,
            currency: "USD",
            state: "verified",
          }
        : unknownMonetaryField,
    hosting:
      input.hostingUsd !== undefined
        ? {
            amount: input.hostingUsd,
            currency: "USD",
            state: "verified",
          }
        : unknownMonetaryField,
    technicalSheetUrl: unknownLink,
    warranty:
      input.warrantyUsd !== undefined
        ? {
            amount: input.warrantyUsd,
            currency: "USD",
            state: "verified",
          }
        : unknownMonetaryField,
    verification: {
      commercial:
        input.priceUsd !== undefined &&
        input.hostingUsd !== undefined &&
        input.warrantyUsd !== undefined &&
        input.availability !== undefined
          ? "verified"
          : "provided",
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
    efficiency: 23.3,
    power: 140,
    cooling: "air",
    priceUsd: 1250,
    warrantyUsd: 18,
    hostingUsd: 9,
    availability: "Minero doméstico disponible",
    displayOrder: 1,
  }),
  createAsicModel({
    manufacturer: "FLU Miner",
    model: "BTC T3",
    slug: "flu-miner-btc-t3",
    category: "Entrada",
    hashrate: 110,
    efficiency: 15.7,
    power: 1727,
    cooling: "air",
    priceUsd: 3230,
    warrantyUsd: 206,
    hostingUsd: 103,
    availability: "Minero doméstico disponible",
    displayOrder: 2,
  }),
  createAsicModel({
    manufacturer: "Bitmain",
    model: "Antminer S19K Pro",
    slug: "bitmain-antminer-s19k-pro",
    category: "Operación profesional",
    hashrate: 120,
    efficiency: 23,
    power: 2760,
    cooling: "air",
    priceUsd: 1496,
    warrantyUsd: 330,
    hostingUsd: 165,
    availability: "Stock disponible",
    displayOrder: 3,
  }),
  createAsicModel({
    manufacturer: "MicroBT",
    model: "WhatsMiner M60S+",
    slug: "microbt-whatsminer-m60s-plus",
    category: "Operación profesional",
    hashrate: 208,
    efficiency: 17,
    power: 3536,
    cooling: "hydro",
    priceUsd: 3890,
    warrantyUsd: 422,
    hostingUsd: 211,
    availability: "Stock disponible",
    displayOrder: 4,
  }),
  createAsicModel({
    manufacturer: "Bitmain",
    model: "Antminer S21+",
    slug: "bitmain-antminer-s21-plus",
    category: "Operación profesional",
    hashrate: 235,
    efficiency: 16.5,
    power: 3878,
    cooling: "air",
    priceUsd: 3482,
    warrantyUsd: 462,
    hostingUsd: 231,
    availability: "Stock disponible",
    displayOrder: 5,
  }),
  createAsicModel({
    manufacturer: "Bitmain",
    model: "Antminer S21 Pro",
    slug: "bitmain-antminer-s21-pro",
    category: "Operación profesional",
    hashrate: 245,
    efficiency: 15,
    power: 3675,
    cooling: "air",
    priceUsd: 4425,
    warrantyUsd: 438,
    hostingUsd: 219,
    availability: "Stock disponible",
    displayOrder: 6,
  }),
  createAsicModel({
    manufacturer: "Bitmain",
    model: "Antminer S21 XP",
    slug: "bitmain-antminer-s21-xp",
    category: "Alto rendimiento",
    hashrate: 270,
    efficiency: 13.5,
    power: 3645,
    cooling: "air",
    priceUsd: 6759,
    warrantyUsd: 434,
    hostingUsd: 217,
    availability: "Stock disponible",
    displayOrder: 7,
  }),
  createAsicModel({
    manufacturer: "Canaan",
    model: "Avalon A1566HA",
    slug: "canaan-avalon-a1566ha",
    category: "Alto rendimiento",
    hashrate: 480,
    efficiency: 16.8,
    power: 8064,
    cooling: "hydro",
    priceUsd: 7494,
    warrantyUsd: 962,
    hostingUsd: 481,
    availability: "Stock disponible",
    displayOrder: 8,
  }),
  createAsicModel({
    manufacturer: "Bitmain",
    model: "Antminer S21+ Hydro",
    slug: "bitmain-antminer-s21-plus-hydro",
    category: "Hydro",
    hashrate: 395,
    efficiency: 15,
    power: 5925,
    cooling: "hydro",
    priceUsd: 5250,
    warrantyUsd: 706,
    hostingUsd: 353,
    availability: "Stock disponible",
    displayOrder: 9,
  }),
  createAsicModel({
    manufacturer: "Bitmain",
    model: "Antminer S21 XP Hydro",
    slug: "bitmain-antminer-s21-xp-hydro",
    category: "Hydro",
    hashrate: 473,
    efficiency: 12,
    power: 5676,
    cooling: "hydro",
    priceUsd: 11417,
    warrantyUsd: 676,
    hostingUsd: 338,
    availability: "Stock disponible",
    displayOrder: 10,
  }),
  createAsicModel({
    manufacturer: "MicroBT",
    model: "WhatsMiner M63S+",
    slug: "microbt-whatsminer-m63s-plus",
    category: "Hydro",
    hashrate: 440,
    efficiency: 17,
    power: 7480,
    cooling: "hydro",
    priceUsd: 6594,
    warrantyUsd: 892,
    hostingUsd: 446,
    availability: "Stock disponible",
    displayOrder: 11,
  }),
  createAsicModel({
    manufacturer: "Bitmain",
    model: "Antminer S23 Hydro",
    slug: "bitmain-antminer-s23-hydro",
    category: "Hydro",
    hashrate: 580,
    efficiency: 9.5,
    power: 5510,
    cooling: "hydro",
    priceUsd: 24055,
    warrantyUsd: 658,
    hostingUsd: 329,
    availability: "Julio 2026",
    displayOrder: 12,
  }),
].sort((left, right) => left.displayOrder - right.displayOrder);
