import { Project } from "@/lib/types";

// ============================================================
// Demo Project: Blackstone @ Union Square — Mixed-Use Development
// 4-Story Mixed-Use (Retail Ground Floor + 3 Floors Office)
// Nashville, TN — $18.5M — 14 months
// ============================================================

export const DEMO_PROJECT: Project = {
  id: "proj-union-square",
  name: "Blackstone @ Union Square",
  address: "400 Union Square Blvd, Nashville, TN 37201",
  client: "Meridian Development Group",
  contractValue: 18500000,
  startDate: "2025-09-01",
  endDate: "2026-11-01",
  projectType: "Mixed-Use Commercial",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),

  // ---- Takt Zones: Floor → Zone ----
  taktZones: [
    // Level 1 — Retail
    { id: "L1-A", floor: "Level 1 (Retail)", zoneName: "North Storefront", zoneCode: "L1-A" },
    { id: "L1-B", floor: "Level 1 (Retail)", zoneName: "South Storefront", zoneCode: "L1-B" },
    { id: "L1-C", floor: "Level 1 (Retail)", zoneName: "Lobby / Common", zoneCode: "L1-C" },
    { id: "L1-D", floor: "Level 1 (Retail)", zoneName: "Loading / BOH", zoneCode: "L1-D" },
    { id: "L1-E", floor: "Level 1 (Retail)", zoneName: "Mech Room", zoneCode: "L1-E" },
    { id: "L1-F", floor: "Level 1 (Retail)", zoneName: "Elevator / Stair", zoneCode: "L1-F" },

    // Level 2 — Office
    { id: "L2-A", floor: "Level 2 (Office)", zoneName: "NW Quadrant", zoneCode: "L2-A" },
    { id: "L2-B", floor: "Level 2 (Office)", zoneName: "NE Quadrant", zoneCode: "L2-B" },
    { id: "L2-C", floor: "Level 2 (Office)", zoneName: "SW Quadrant", zoneCode: "L2-C" },
    { id: "L2-D", floor: "Level 2 (Office)", zoneName: "SE Quadrant", zoneCode: "L2-D" },
    { id: "L2-E", floor: "Level 2 (Office)", zoneName: "Core / Restrooms", zoneCode: "L2-E" },
    { id: "L2-F", floor: "Level 2 (Office)", zoneName: "Elevator / Stair", zoneCode: "L2-F" },

    // Level 3 — Office
    { id: "L3-A", floor: "Level 3 (Office)", zoneName: "NW Quadrant", zoneCode: "L3-A" },
    { id: "L3-B", floor: "Level 3 (Office)", zoneName: "NE Quadrant", zoneCode: "L3-B" },
    { id: "L3-C", floor: "Level 3 (Office)", zoneName: "SW Quadrant", zoneCode: "L3-C" },
    { id: "L3-D", floor: "Level 3 (Office)", zoneName: "SE Quadrant", zoneCode: "L3-D" },
    { id: "L3-E", floor: "Level 3 (Office)", zoneName: "Core / Restrooms", zoneCode: "L3-E" },
    { id: "L3-F", floor: "Level 3 (Office)", zoneName: "Elevator / Stair", zoneCode: "L3-F" },

    // Level 4 — Office
    { id: "L4-A", floor: "Level 4 (Office)", zoneName: "NW Quadrant", zoneCode: "L4-A" },
    { id: "L4-B", floor: "Level 4 (Office)", zoneName: "NE Quadrant", zoneCode: "L4-B" },
    { id: "L4-C", floor: "Level 4 (Office)", zoneName: "SW Quadrant", zoneCode: "L4-C" },
    { id: "L4-D", floor: "Level 4 (Office)", zoneName: "SE Quadrant", zoneCode: "L4-D" },
    { id: "L4-E", floor: "Level 4 (Office)", zoneName: "Core / Restrooms", zoneCode: "L4-E" },
    { id: "L4-F", floor: "Level 4 (Office)", zoneName: "Elevator / Stair", zoneCode: "L4-F" },

    // Roof
    { id: "RF-A", floor: "Roof", zoneName: "Mech Penthouse", zoneCode: "RF-A" },
    { id: "RF-B", floor: "Roof", zoneName: "Roof Area A", zoneCode: "RF-B" },
    { id: "RF-C", floor: "Roof", zoneName: "Roof Area B", zoneCode: "RF-C" },

    // Site
    { id: "ST-A", floor: "Site", zoneName: "Parking West", zoneCode: "ST-A" },
    { id: "ST-B", floor: "Site", zoneName: "Parking East", zoneCode: "ST-B" },
    { id: "ST-C", floor: "Site", zoneName: "Landscaping", zoneCode: "ST-C" },
    { id: "ST-D", floor: "Site", zoneName: "Utilities", zoneCode: "ST-D" },
  ],

  // ---- Subcontractors ----
  subcontractors: [
    {
      id: "sub-concrete",
      company: "River City Concrete",
      trade: "Concrete",
      csiDivisions: ["03"],
      primaryContact: { name: "Mike Torres", phone: "615-555-0101", email: "mtorres@rivercityconcrete.com" },
      contractStatus: "awarded",
    },
    {
      id: "sub-steel",
      company: "Music City Iron",
      trade: "Structural Steel",
      csiDivisions: ["05"],
      primaryContact: { name: "James Walker", phone: "615-555-0102", email: "jwalker@musiccityiron.com" },
      contractStatus: "awarded",
    },
    {
      id: "sub-mech",
      company: "TN Comfort Systems",
      trade: "HVAC",
      csiDivisions: ["23"],
      primaryContact: { name: "Sarah Chen", phone: "615-555-0103", email: "schen@tncomfort.com" },
      contractStatus: "awarded",
    },
    {
      id: "sub-elec",
      company: "Volunteer Electric",
      trade: "Electrical",
      csiDivisions: ["26", "27"],
      primaryContact: { name: "David Okafor", phone: "615-555-0104", email: "dokafor@volunteerelectric.com" },
      contractStatus: "awarded",
    },
    {
      id: "sub-plumb",
      company: "Nashville Plumbing Co.",
      trade: "Plumbing",
      csiDivisions: ["22"],
      primaryContact: { name: "Ray Hartman", phone: "615-555-0105", email: "rhartman@nashvilleplumbing.com" },
      contractStatus: "awarded",
    },
    {
      id: "sub-fire",
      company: "Blaze Shield Fire",
      trade: "Fire Protection",
      csiDivisions: ["21"],
      primaryContact: { name: "Lisa Nguyen", phone: "615-555-0106", email: "lnguyen@blazeshield.com" },
      contractStatus: "awarded",
    },
    {
      id: "sub-drywall",
      company: "Interior Specialists",
      trade: "Drywall / ACT",
      csiDivisions: ["09"],
      primaryContact: { name: "Carlos Reyes", phone: "615-555-0107", email: "creyes@interiorspec.com" },
      contractStatus: "awarded",
    },
    {
      id: "sub-roofing",
      company: "Summit Roofing",
      trade: "Roofing",
      csiDivisions: ["07"],
      primaryContact: { name: "Tom Bradley", phone: "615-555-0108", email: "tbradley@summitroofing.com" },
      contractStatus: "awarded",
    },
    {
      id: "sub-glazing",
      company: "ClearView Glass",
      trade: "Glazing / Curtain Wall",
      csiDivisions: ["08"],
      primaryContact: { name: "Amanda Foster", phone: "615-555-0109", email: "afoster@clearviewglass.com" },
      contractStatus: "awarded",
    },
    {
      id: "sub-earth",
      company: "Volunteer Excavation",
      trade: "Earthwork",
      csiDivisions: ["31", "32", "33"],
      primaryContact: { name: "Bill Chambers", phone: "615-555-0110", email: "bchambers@volexcavation.com" },
      contractStatus: "awarded",
    },
    {
      id: "sub-elevator",
      company: "Apex Elevator Co.",
      trade: "Elevator",
      csiDivisions: ["14"],
      primaryContact: { name: "Kevin Park", phone: "615-555-0111", email: "kpark@apexelevator.com" },
      contractStatus: "awarded",
    },
    {
      id: "sub-paint",
      company: "Pro Finish Coatings",
      trade: "Painting",
      csiDivisions: ["09"],
      primaryContact: { name: "Diana Webb", phone: "615-555-0112", email: "dwebb@profinish.com" },
      contractStatus: "awarded",
    },
  ],

  // ---- Blackstone Team ----
  teamMembers: [
    { id: "tm-john", name: "John Rutherford", role: "pm", email: "john@blackstone.build", phone: "205-994-8999" },
    { id: "tm-super", name: "Mark Sullivan", role: "superintendent", email: "mark@blackstone.build", phone: "205-555-0201" },
    { id: "tm-foreman", name: "Jake Mitchell", role: "foreman", email: "jake@blackstone.build", phone: "205-555-0202" },
    { id: "tm-safety", name: "Rachel Kim", role: "safety_officer", email: "rachel@blackstone.build", phone: "205-555-0203" },
  ],

  // ---- Equipment Library ----
  equipmentLibrary: [
    { id: "eq-crane", name: "Tower Crane (Liebherr 172)", category: "heavy", ownership: "rented", vendor: "Bigge Crane", rentalRate: 8500, ratePeriod: "weekly" },
    { id: "eq-excavator", name: "CAT 320 Excavator", category: "heavy", ownership: "rented", vendor: "United Rentals", rentalRate: 1800, ratePeriod: "weekly" },
    { id: "eq-loader", name: "CAT 950 Wheel Loader", category: "heavy", ownership: "owned" },
    { id: "eq-forklift", name: "CAT TL1055 Telehandler", category: "heavy", ownership: "rented", vendor: "Sunbelt Rentals", rentalRate: 1200, ratePeriod: "weekly" },
    { id: "eq-concrete-pump", name: "Concrete Pump Truck", category: "heavy", ownership: "rented", vendor: "River City Concrete", rentalRate: 2500, ratePeriod: "daily" },
    { id: "eq-scissor", name: "Scissor Lift (JLG 3246)", category: "light", ownership: "rented", vendor: "United Rentals", rentalRate: 350, ratePeriod: "weekly" },
    { id: "eq-boom", name: "Boom Lift (JLG 600S)", category: "light", ownership: "rented", vendor: "United Rentals", rentalRate: 900, ratePeriod: "weekly" },
    { id: "eq-compressor", name: "Air Compressor 185 CFM", category: "light", ownership: "owned" },
    { id: "eq-generator", name: "Generator 20kW", category: "light", ownership: "owned" },
    { id: "eq-saw", name: "Concrete Saw (14\")", category: "light", ownership: "owned" },
    { id: "eq-welder", name: "Lincoln Welder SA-200", category: "light", ownership: "owned" },
    { id: "eq-truck1", name: "F-250 Super Duty (Blackstone)", category: "vehicle", ownership: "owned" },
    { id: "eq-truck2", name: "F-350 Flatbed (Blackstone)", category: "vehicle", ownership: "owned" },
    { id: "eq-water", name: "Water Truck 2000 gal", category: "vehicle", ownership: "rented", vendor: "Volunteer Excavation", rentalRate: 600, ratePeriod: "daily" },
  ],

  // ---- Contracts (placeholder — user uploads later) ----
  contracts: {
    ownerContract: undefined,
    standardSubcontract: undefined,
    subAgreements: [],
  },

  // ---- Emergency Contacts ----
  emergencyContacts: [
    { name: "Nashville Fire Dept", role: "Fire / EMS", phone: "911" },
    { name: "Vanderbilt University Medical Center", role: "Nearest Hospital", phone: "615-322-5000" },
    { name: "John Rutherford", role: "Blackstone President", phone: "205-994-8999" },
    { name: "Mark Sullivan", role: "Project Superintendent", phone: "205-555-0201" },
    { name: "Rachel Kim", role: "Safety Officer", phone: "205-555-0203" },
  ],
};

// Helper: Get takt zones grouped by floor
export function getZonesByFloor(project: Project): Record<string, typeof project.taktZones> {
  return project.taktZones.reduce((acc, zone) => {
    if (!acc[zone.floor]) acc[zone.floor] = [];
    acc[zone.floor].push(zone);
    return acc;
  }, {} as Record<string, typeof project.taktZones>);
}

// Helper: Get subcontractors by CSI division
export function getSubsByDivision(project: Project, divisionCode: string) {
  return project.subcontractors.filter((sub) =>
    sub.csiDivisions.includes(divisionCode)
  );
}
