export {
  PH_REGIONS,
  PH_REGION_CITIES,
  getAllCities,
  getCitiesForRegion,
  findRegionForCity,
  isCityInRegion,
  type PhRegion
} from "@/lib/data/ph-locations";

import { getAllCities } from "@/lib/data/ph-locations";
import { PROVIDER_SPECIALIZATIONS } from "@/lib/constants";

export const PH_CITIES = getAllCities();
export const PH_SPECIALIZATIONS = [...PROVIDER_SPECIALIZATIONS];
