// Environmental Context to Responsible Authority Mapping
// Backed by the configured MongoDB authorities and rule engine.

export const AUTHORITIES = [
  {
    context: "HEALTHCARE",
    contextLabel: "Healthcare / Medical Facility",
    authority: "District Health & Medical Directorate",
    email: "health.authority@dumpsentry.gov.in",
    department: "Health & Sanitation",
  },
  {
    context: "ROADSIDE",
    contextLabel: "Roadside / Highway",
    authority: "Public Works Department (Roads & Highways)",
    email: "pwd.roads@dumpsentry.gov.in",
    department: "Public Works Department",
  },
  {
    context: "EDUCATIONAL",
    contextLabel: "Educational Institution",
    authority: "Department of Education (Campus Safety)",
    email: "education.safety@dumpsentry.gov.in",
    department: "Education Authority",
  },
  {
    context: "WATER_BODY",
    contextLabel: "Water Body / Wetland",
    authority: "Water Resources & Wetland Conservation Authority",
    email: "water.resources@dumpsentry.gov.in",
    department: "Water Resources & Environment",
  },
  {
    context: "ENVIRONMENTAL_PROTECTED",
    contextLabel: "Environmentally Protected / Forest",
    authority: "Forest & Wildlife Protection Directorate",
    email: "forest.environment@dumpsentry.gov.in",
    department: "Forest & Environment Department",
  },
  {
    context: "INDUSTRIAL",
    contextLabel: "Industrial Area",
    authority: "State Pollution Control Board (Industrial Division)",
    email: "pollution.control@dumpsentry.gov.in",
    department: "Pollution Control & Environment",
  },
  {
    context: "RESIDENTIAL",
    contextLabel: "Residential Neighborhood",
    authority: "City Municipal Corporation (Solid Waste Dept)",
    email: "municipal.waste@dumpsentry.gov.in",
    department: "Solid Waste Management",
  },
  {
    context: "COMMERCIAL",
    contextLabel: "Commercial / Market Area",
    authority: "City Municipal Corporation (Commercial Enforcement)",
    email: "municipal.waste@dumpsentry.gov.in",
    department: "Market & Commercial Regulation",
  },
  {
    context: "TRANSPORT",
    contextLabel: "Transport Hub / Terminal",
    authority: "Regional Transport & Transit Authority",
    email: "transport.authority@dumpsentry.gov.in",
    department: "Transport Department",
  },
  {
    context: "PUBLIC_AREA",
    contextLabel: "Public / Civic Facility",
    authority: "City Civic & Public Amenities Board",
    email: "civic.public@dumpsentry.gov.in",
    department: "Municipal Civic Body",
  },
  {
    context: "AGRICULTURAL",
    contextLabel: "Agricultural / Farmland",
    authority: "Department of Agriculture & Rural Development",
    email: "agriculture.dept@dumpsentry.gov.in",
    department: "Agriculture & Rural Development",
  },
  {
    context: "OTHER_UNKNOWN",
    contextLabel: "Unclassified Area",
    authority: "City Municipal Corporation (General Review)",
    email: "municipal.waste@dumpsentry.gov.in",
    department: "Municipal Vigilance / Manual Review",
  },
];

export function getAuthorityForContext(context) {
  const norm = String(context || "").toUpperCase().replace(/\s+/g, "_");
  return (
    AUTHORITIES.find(
      (a) =>
        a.context === norm ||
        a.contextLabel.toLowerCase() === String(context || "").toLowerCase()
    ) || AUTHORITIES[11] // default to OTHER_UNKNOWN
  );
}
