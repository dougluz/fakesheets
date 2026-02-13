import { ColumnDefinition } from "./types";

export const AVAILABLE_COLUMNS: ColumnDefinition[] = [
  { key: "firstName", label: "First Name", icon: "person" },
  { key: "lastName", label: "Last Name", icon: "people" },
  { key: "fullName", label: "Full Name", icon: "badge" },
  { key: "email", label: "Email", icon: "email" },
  { key: "phone", label: "Phone", icon: "phone" },
  { key: "company", label: "Company", icon: "business" },
  { key: "jobTitle", label: "Job Title", icon: "work" },
  { key: "address", label: "Address", icon: "place" },
  { key: "city", label: "City", icon: "location_city" },
  { key: "country", label: "Country", icon: "flag" },
  { key: "website", label: "Website", icon: "language" },
  { key: "avatarUrl", label: "Avatar URL", icon: "account_circle" },
];
