export const PH_REGIONS = [
  "NCR",
  "CAR",
  "Region I - Ilocos",
  "Region II - Cagayan Valley",
  "Region III - Central Luzon",
  "Region IV-A - CALABARZON",
  "Region IV-B - MIMAROPA",
  "Region V - Bicol",
  "Region VI - Western Visayas",
  "Region VII - Central Visayas",
  "Region VIII - Eastern Visayas",
  "Region IX - Zamboanga Peninsula",
  "Region X - Northern Mindanao",
  "Region XI - Davao",
  "Region XII - SOCCSKSARGEN",
  "Region XIII - Caraga",
  "BARMM"
] as const;

export type PhRegion = (typeof PH_REGIONS)[number];

export const PH_REGION_CITIES: Record<PhRegion, string[]> = {
  NCR: [
    "Manila",
    "Quezon City",
    "Makati",
    "Taguig",
    "Pasig",
    "Mandaluyong",
    "Caloocan",
    "Las Piñas",
    "Marikina",
    "Muntinlupa",
    "Navotas",
    "Parañaque",
    "Pasay",
    "San Juan",
    "Valenzuela",
    "Pateros"
  ],
  CAR: ["Baguio", "La Trinidad", "Tabuk", "Bontoc"],
  "Region I - Ilocos": [
    "Laoag",
    "San Fernando (La Union)",
    "Vigan",
    "Dagupan",
    "San Carlos",
    "Urdaneta",
    "Alaminos",
    "Batac"
  ],
  "Region II - Cagayan Valley": [
    "Tuguegarao",
    "Ilagan",
    "Santiago",
    "Cauayan",
    "Bayombong",
    "Solano"
  ],
  "Region III - Central Luzon": [
    "Angeles",
    "San Fernando (Pampanga)",
    "Olongapo",
    "Malolos",
    "San Jose del Monte",
    "Cabanatuan",
    "Tarlac City",
    "Balanga",
    "Mabalacat",
    "Palayan"
  ],
  "Region IV-A - CALABARZON": [
    "Antipolo",
    "Calamba",
    "Dasmarinas",
    "Lipa",
    "Bacoor",
    "Imus",
    "San Pedro",
    "Biñan",
    "Santa Rosa",
    "General Trias",
    "Lucena",
    "Tayabas",
    "Trece Martires"
  ],
  "Region IV-B - MIMAROPA": [
    "Puerto Princesa",
    "Calapan",
    "San Jose (Occidental Mindoro)",
    "Romblon",
    "Boac"
  ],
  "Region V - Bicol": [
    "Naga",
    "Legazpi",
    "Iriga",
    "Ligao",
    "Sorsogon City",
    "Tabaco",
    "Masbate City"
  ],
  "Region VI - Western Visayas": [
    "Iloilo City",
    "Bacolod",
    "Roxas City",
    "Kalibo",
    "San Carlos (Negros Occidental)",
    "Silay",
    "Escalante",
    "Kabankalan"
  ],
  "Region VII - Central Visayas": [
    "Cebu City",
    "Lapu-Lapu",
    "Mandaue",
    "Tagbilaran",
    "Dumaguete",
    "Talisay (Cebu)",
    "Toledo",
    "Carcar"
  ],
  "Region VIII - Eastern Visayas": [
    "Tacloban",
    "Ormoc",
    "Calbayog",
    "Catbalogan",
    "Borongan",
    "Baybay"
  ],
  "Region IX - Zamboanga Peninsula": [
    "Zamboanga City",
    "Pagadian",
    "Dipolog",
    "Dapitan",
    "Isabela City"
  ],
  "Region X - Northern Mindanao": [
    "Cagayan de Oro",
    "Iligan",
    "Malaybalay",
    "Valencia (Bukidnon)",
    "Ozamiz",
    "Oroquieta",
    "Tangub",
    "Gingoog"
  ],
  "Region XI - Davao": [
    "Davao City",
    "Digos",
    "Tagum",
    "Panabo",
    "Mati",
    "Samal"
  ],
  "Region XII - SOCCSKSARGEN": [
    "General Santos",
    "Koronadal",
    "Kidapawan",
    "Cotabato City",
    "Tacurong"
  ],
  "Region XIII - Caraga": ["Butuan", "Surigao City", "Bayugan", "Bislig", "Tandag", "Cabadbaran"],
  BARMM: ["Marawi", "Lamitan", "Cotabato City", "Jolo", "Bongao"]
};

export const PH_CITIES = Array.from(
  new Set(PH_REGIONS.flatMap((region) => PH_REGION_CITIES[region]))
).sort((a, b) => a.localeCompare(b));

import { PROVIDER_SPECIALIZATIONS } from "@/lib/constants";

export const PH_SPECIALIZATIONS = [...PROVIDER_SPECIALIZATIONS];

export function getCitiesForRegion(region: string): string[] {
  if (!region) return [];
  return PH_REGION_CITIES[region as PhRegion] ?? [];
}

export function isCityInRegion(city: string, region: string): boolean {
  if (!region || !city) return false;
  return getCitiesForRegion(region).includes(city);
}

export function findRegionForCity(city: string): PhRegion | "" {
  if (!city) return "";
  for (const region of PH_REGIONS) {
    if (PH_REGION_CITIES[region].includes(city)) {
      return region;
    }
  }
  return "";
}
