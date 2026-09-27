// Maps the AI-detected surrounding context to the authority the platform
// would notify. This is mock configuration — in production this would be
// editable from Settings > Authority Configuration and backed by a real
// directory / API.

export const AUTHORITIES = [
  {
    context: "Hospital",
    authority: "Hospital Superintendent",
    email: "superintendent@citygeneral-health.gov.in",
    department: "Health & Sanitation",
  },
  {
    context: "School",
    authority: "School Administration",
    email: "admin@schooleducation.gov.in",
    department: "Education Authority",
  },
  {
    context: "College",
    authority: "College Administration",
    email: "registrar@collegeboard.gov.in",
    department: "Higher Education Authority",
  },
  {
    context: "Roadside",
    authority: "PWD / Municipal Authority",
    email: "control-room@pwd.gov.in",
    department: "Public Works Department",
  },
  {
    context: "Public Area",
    authority: "Civic Authority",
    email: "helpdesk@civicbody.gov.in",
    department: "Municipal Corporation",
  },
  {
    context: "Residential Area",
    authority: "Ward Sanitation Office",
    email: "ward-office@municipal.gov.in",
    department: "Solid Waste Management",
  },
];

export function getAuthorityForContext(context) {
  return (
    AUTHORITIES.find((a) => a.context.toLowerCase() === String(context).toLowerCase()) ||
    AUTHORITIES[4]
  );
}
