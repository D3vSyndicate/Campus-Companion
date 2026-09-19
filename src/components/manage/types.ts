import type { ChipOption } from '../ChipSelect';

export type Row = Record<string, unknown>;

export type FieldType = 'text' | 'multiline' | 'select' | 'boolean' | 'number' | 'decimal' | 'time';

export type FieldConfig = {
  key: string; // column name
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  help?: string;
  default?: string | number | boolean;
  // select fields
  options?: ChipOption[];
  // Also let the user type a value that is not in the list (and offer values already in use).
  allowCustom?: boolean;
  // Choices come from the matching entry in `lookups` instead of `options`.
  lookupOptions?: boolean;
};

export type LookupConfig = {
  fieldKey: string; // the field whose choices / labels this fills
  table: string;
  valueColumn: string;
  labelColumn: string;
};

export type LookupLabels = Record<string, Record<string, string>>;

export type ManageConfig = {
  table: string;
  pk: string; // primary key column
  title: string;
  description: string;
  itemNoun: string; // "FAQ", "Venue", ...
  fields: FieldConfig[];
  orderBy?: { column: string; ascending?: boolean }[];
  lookups?: LookupConfig[];
  listTitle: (row: Row, labels: LookupLabels) => string;
  listSubtitle?: (row: Row, labels: LookupLabels) => string;
  // Extra columns to set when a new row is created (not shown in the form).
  onCreate?: (user: { email: string }) => Row;
};
