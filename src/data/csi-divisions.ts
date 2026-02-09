import { CSIDivision } from "@/lib/types";

// ============================================================
// CSI MasterFormat Divisions — Construction Task Hierarchy
// Used for JHA task selection and Daily Log work tracking
// ============================================================

export const CSI_DIVISIONS: CSIDivision[] = [
  {
    code: "02",
    name: "Existing Conditions",
    icon: "Building",
    activities: [
      {
        id: "02-demo",
        name: "Demolition",
        tasks: [
          "Interior Demolition",
          "Structural Demolition",
          "Selective Demolition",
          "Saw Cutting",
        ],
      },
      {
        id: "02-abate",
        name: "Abatement",
        tasks: [
          "Asbestos Abatement",
          "Lead Paint Removal",
          "Mold Remediation",
        ],
      },
      {
        id: "02-assess",
        name: "Site Assessment",
        tasks: [
          "Environmental Survey",
          "Geotechnical Investigation",
          "Existing Conditions Survey",
        ],
      },
    ],
  },
  {
    code: "03",
    name: "Concrete",
    icon: "Box",
    activities: [
      {
        id: "03-form",
        name: "Forming",
        tasks: [
          "Wall Form Setup",
          "Column Forms",
          "Slab Edge Forms",
          "Foundation Forms",
          "Form Stripping",
        ],
      },
      {
        id: "03-rebar",
        name: "Rebar",
        tasks: [
          "Foundation Rebar",
          "Wall Rebar",
          "Column Rebar",
          "Slab Rebar / WWF",
          "Rebar Inspection Prep",
        ],
      },
      {
        id: "03-place",
        name: "Placement",
        tasks: [
          "Foundation Pour",
          "Slab on Grade Pour",
          "Elevated Slab Pour",
          "Wall Pour",
          "Column Pour",
          "Pump Truck Setup",
        ],
      },
      {
        id: "03-finish",
        name: "Finishing",
        tasks: [
          "Flatwork Finishing",
          "Broom Finish",
          "Polished Concrete",
          "Saw Cut Control Joints",
          "Curing & Sealing",
        ],
      },
      {
        id: "03-pt",
        name: "Post-Tension",
        tasks: [
          "PT Strand Layout",
          "PT Stressing",
          "PT Grouting",
        ],
      },
    ],
  },
  {
    code: "04",
    name: "Masonry",
    icon: "LayoutGrid",
    activities: [
      {
        id: "04-cmu",
        name: "CMU",
        tasks: [
          "CMU Wall Layout",
          "CMU Block Laying",
          "CMU Grouting",
          "CMU Reinforcement",
          "Bond Beam",
        ],
      },
      {
        id: "04-brick",
        name: "Brick Veneer",
        tasks: [
          "Brick Laying",
          "Brick Ties & Flashing",
          "Mortar Joints & Tooling",
        ],
      },
      {
        id: "04-stone",
        name: "Stone",
        tasks: [
          "Natural Stone Install",
          "Cultured Stone Install",
          "Stone Anchoring",
        ],
      },
    ],
  },
  {
    code: "05",
    name: "Metals",
    icon: "Columns3",
    activities: [
      {
        id: "05-struct",
        name: "Structural Steel",
        tasks: [
          "Column Erection",
          "Beam Setting",
          "Steel Decking",
          "Moment Frame Connections",
          "Steel Joists",
          "Bracing",
        ],
      },
      {
        id: "05-misc",
        name: "Misc. Metals",
        tasks: [
          "Lintels & Angles",
          "Embed Plates",
          "Steel Supports & Frames",
          "Metal Fabrication",
        ],
      },
      {
        id: "05-stairs",
        name: "Stairs & Rails",
        tasks: [
          "Steel Stair Install",
          "Handrail Install",
          "Guardrail Install",
        ],
      },
    ],
  },
  {
    code: "06",
    name: "Wood & Composites",
    icon: "TreePine",
    activities: [
      {
        id: "06-frame",
        name: "Framing",
        tasks: [
          "Wall Framing",
          "Floor Framing",
          "Roof Framing",
          "Sheathing",
        ],
      },
      {
        id: "06-block",
        name: "Blocking",
        tasks: [
          "Fire Blocking",
          "Backing & Support Blocking",
          "Equipment Support Blocking",
        ],
      },
      {
        id: "06-case",
        name: "Casework",
        tasks: [
          "Cabinet Installation",
          "Countertop Install",
          "Millwork Install",
        ],
      },
    ],
  },
  {
    code: "07",
    name: "Thermal & Moisture",
    icon: "Droplets",
    activities: [
      {
        id: "07-water",
        name: "Waterproofing",
        tasks: [
          "Below Grade Waterproofing",
          "Fluid Applied Membrane",
          "Sheet Membrane",
          "Plaza Deck Waterproofing",
        ],
      },
      {
        id: "07-insul",
        name: "Insulation",
        tasks: [
          "Batt Insulation",
          "Rigid Insulation",
          "Spray Foam Insulation",
          "Pipe & Duct Insulation",
        ],
      },
      {
        id: "07-roof",
        name: "Roofing",
        tasks: [
          "TPO/EPDM Membrane",
          "Built-Up Roofing",
          "Metal Roofing",
          "Flashing & Sheet Metal",
          "Roof Drain Install",
        ],
      },
      {
        id: "07-caulk",
        name: "Caulking & Sealants",
        tasks: [
          "Joint Sealants",
          "Firestopping",
          "Expansion Joint Covers",
        ],
      },
    ],
  },
  {
    code: "08",
    name: "Openings",
    icon: "DoorOpen",
    activities: [
      {
        id: "08-doors",
        name: "Doors",
        tasks: [
          "Hollow Metal Frames",
          "Wood Door Install",
          "Aluminum Storefront Doors",
          "Overhead / Rolling Doors",
        ],
      },
      {
        id: "08-windows",
        name: "Windows",
        tasks: [
          "Window Installation",
          "Window Flashing & Sealing",
        ],
      },
      {
        id: "08-curtain",
        name: "Curtain Wall",
        tasks: [
          "Curtain Wall Framing",
          "Curtain Wall Glazing",
          "Curtain Wall Sealant",
        ],
      },
      {
        id: "08-hardware",
        name: "Hardware",
        tasks: [
          "Door Hardware Install",
          "Access Control Hardware",
          "Closer & Panic Hardware",
        ],
      },
    ],
  },
  {
    code: "09",
    name: "Finishes",
    icon: "Paintbrush",
    activities: [
      {
        id: "09-drywall",
        name: "Drywall",
        tasks: [
          "Metal Stud Framing",
          "Drywall Hanging",
          "Drywall Taping & Finishing",
          "Drywall Sanding",
        ],
      },
      {
        id: "09-paint",
        name: "Paint",
        tasks: [
          "Interior Primer",
          "Interior Paint",
          "Exterior Paint",
          "Specialty Coatings",
        ],
      },
      {
        id: "09-tile",
        name: "Tile",
        tasks: [
          "Floor Tile",
          "Wall Tile",
          "Backsplash",
          "Tile Grouting",
        ],
      },
      {
        id: "09-floor",
        name: "Flooring",
        tasks: [
          "VCT / LVT Install",
          "Carpet Install",
          "Epoxy Flooring",
          "Hardwood Flooring",
          "Rubber Flooring",
        ],
      },
      {
        id: "09-ceiling",
        name: "ACT Ceilings",
        tasks: [
          "Ceiling Grid Install",
          "Ceiling Tile Install",
          "Specialty Ceilings",
        ],
      },
    ],
  },
  {
    code: "10",
    name: "Specialties",
    icon: "Package",
    activities: [
      {
        id: "10-access",
        name: "Toilet Accessories",
        tasks: [
          "Toilet Partitions",
          "Restroom Accessories",
          "Mirrors",
        ],
      },
      {
        id: "10-sign",
        name: "Signage",
        tasks: [
          "Interior Signage",
          "ADA Signage",
          "Exterior Signage",
        ],
      },
      {
        id: "10-lock",
        name: "Lockers",
        tasks: [
          "Locker Installation",
          "Mailbox Installation",
        ],
      },
    ],
  },
  {
    code: "14",
    name: "Conveying",
    icon: "ArrowUpDown",
    activities: [
      {
        id: "14-elev",
        name: "Elevators",
        tasks: [
          "Elevator Shaft Prep",
          "Elevator Equipment Install",
          "Elevator Cab Finish",
          "Elevator Testing & Inspection",
        ],
      },
      {
        id: "14-esc",
        name: "Escalators",
        tasks: [
          "Escalator Install",
          "Escalator Testing",
        ],
      },
    ],
  },
  {
    code: "21",
    name: "Fire Suppression",
    icon: "Flame",
    activities: [
      {
        id: "21-sprink",
        name: "Sprinkler",
        tasks: [
          "Sprinkler Main Install",
          "Sprinkler Branch Lines",
          "Sprinkler Head Trim",
          "Sprinkler Testing & Flush",
        ],
      },
      {
        id: "21-stand",
        name: "Standpipe",
        tasks: [
          "Standpipe Riser",
          "Fire Department Connection",
          "Hose Valve Install",
        ],
      },
    ],
  },
  {
    code: "22",
    name: "Plumbing",
    icon: "Wrench",
    activities: [
      {
        id: "22-pipe",
        name: "Piping",
        tasks: [
          "Underground Piping",
          "Above Grade Waste/Vent",
          "Domestic Water Piping",
          "Gas Piping",
          "Insulation",
        ],
      },
      {
        id: "22-fix",
        name: "Fixtures",
        tasks: [
          "Lavatory Install",
          "Water Closet Install",
          "Urinal Install",
          "Sink Install",
          "Drinking Fountain",
        ],
      },
      {
        id: "22-equip",
        name: "Equipment",
        tasks: [
          "Water Heater Install",
          "Pump Install",
          "Grease Interceptor",
          "Backflow Preventer",
        ],
      },
    ],
  },
  {
    code: "23",
    name: "HVAC",
    icon: "Wind",
    activities: [
      {
        id: "23-duct",
        name: "Ductwork",
        tasks: [
          "Main Trunk Duct",
          "Branch Ductwork",
          "Flex Duct Runs",
          "Duct Sealing & Insulation",
        ],
      },
      {
        id: "23-equip",
        name: "Equipment",
        tasks: [
          "RTU Installation",
          "AHU Installation",
          "Split System Install",
          "Exhaust Fan Install",
          "VRF System Install",
        ],
      },
      {
        id: "23-ctrl",
        name: "Controls",
        tasks: [
          "Thermostat Install",
          "BAS / DDC Controls",
          "Damper Install",
          "Control Wiring",
        ],
      },
      {
        id: "23-tab",
        name: "TAB",
        tasks: [
          "Testing & Balancing",
          "Airflow Verification",
          "Hydronic Balancing",
        ],
      },
    ],
  },
  {
    code: "26",
    name: "Electrical",
    icon: "Zap",
    activities: [
      {
        id: "26-power",
        name: "Power",
        tasks: [
          "Service Entrance / Main Switch",
          "Panel Installation",
          "Conduit Rough-In",
          "Wire Pull",
          "Receptacle Install",
          "Generator / Transfer Switch",
        ],
      },
      {
        id: "26-light",
        name: "Lighting",
        tasks: [
          "Light Fixture Rough-In",
          "Light Fixture Trim",
          "Emergency / Exit Lighting",
          "Site Lighting",
        ],
      },
      {
        id: "26-low",
        name: "Low Voltage",
        tasks: [
          "Data / Cat6 Rough-In",
          "AV Rough-In",
          "Conduit for Low Voltage",
        ],
      },
    ],
  },
  {
    code: "27",
    name: "Communications",
    icon: "Radio",
    activities: [
      {
        id: "27-data",
        name: "Data",
        tasks: [
          "Data Cabling",
          "MDF / IDF Rooms",
          "Cable Termination & Testing",
        ],
      },
      {
        id: "27-av",
        name: "AV",
        tasks: [
          "AV Infrastructure",
          "Display & Speaker Install",
        ],
      },
      {
        id: "27-sec",
        name: "Security Rough-In",
        tasks: [
          "Camera Conduit & Cable",
          "Card Reader Rough-In",
          "Intercom Wiring",
        ],
      },
    ],
  },
  {
    code: "28",
    name: "Electronic Safety",
    icon: "Bell",
    activities: [
      {
        id: "28-fa",
        name: "Fire Alarm",
        tasks: [
          "Fire Alarm Panel Install",
          "Device Wiring (Smokes, Pulls, Horns)",
          "Fire Alarm Testing & Acceptance",
        ],
      },
      {
        id: "28-access",
        name: "Access Control",
        tasks: [
          "Card Reader Install",
          "Electric Strike / Mag Lock",
          "Access Control Panel",
          "System Programming & Commissioning",
        ],
      },
    ],
  },
  {
    code: "31",
    name: "Earthwork",
    icon: "Mountain",
    activities: [
      {
        id: "31-exc",
        name: "Excavation",
        tasks: [
          "Mass Excavation",
          "Trench Excavation",
          "Rock Excavation",
          "Shoring & Bracing",
        ],
      },
      {
        id: "31-grade",
        name: "Grading",
        tasks: [
          "Rough Grading",
          "Fine Grading",
          "Compaction",
          "Erosion Control",
        ],
      },
      {
        id: "31-pile",
        name: "Piling",
        tasks: [
          "Driven Piles",
          "Drilled Shafts",
          "Micropiles",
          "Helical Piles",
        ],
      },
    ],
  },
  {
    code: "32",
    name: "Exterior Improvements",
    icon: "TreeDeciduous",
    activities: [
      {
        id: "32-pave",
        name: "Paving",
        tasks: [
          "Asphalt Paving",
          "Concrete Paving",
          "Pavers / Unit Paving",
          "Curb & Gutter",
          "Striping",
        ],
      },
      {
        id: "32-land",
        name: "Landscaping",
        tasks: [
          "Irrigation Install",
          "Planting",
          "Sod / Seeding",
          "Mulch & Stone",
        ],
      },
      {
        id: "32-fence",
        name: "Fencing",
        tasks: [
          "Chain Link Fence",
          "Ornamental Fence",
          "Gates & Operators",
        ],
      },
    ],
  },
  {
    code: "33",
    name: "Utilities",
    icon: "Pipette",
    activities: [
      {
        id: "33-storm",
        name: "Storm",
        tasks: [
          "Storm Pipe Install",
          "Catch Basins / Manholes",
          "Detention / Retention",
        ],
      },
      {
        id: "33-san",
        name: "Sanitary",
        tasks: [
          "Sanitary Sewer Pipe",
          "Sanitary Manholes",
          "Lift Station",
        ],
      },
      {
        id: "33-water",
        name: "Water",
        tasks: [
          "Water Main Install",
          "Fire Hydrant",
          "Water Service Connection",
        ],
      },
      {
        id: "33-gas",
        name: "Gas",
        tasks: [
          "Gas Main Install",
          "Gas Service Connection",
          "Gas Meter Set",
        ],
      },
    ],
  },
];

// Quick lookup by division code
export const CSI_BY_CODE = Object.fromEntries(
  CSI_DIVISIONS.map((d) => [d.code, d])
);
