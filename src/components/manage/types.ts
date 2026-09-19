import type { ChipOption } from '../ChipSelect';

export type Row = Record<string, unknown>;

// 'list' is one line per item. 'imageList' is one picture per line, written as
// "link | caption", because the pictures are stored as objects with a caption.
export type FieldType = 'text' | 'multiline' | 'select' | 'boolean' | 'number' | 'decimal' | 'time' | 'date' | 'list' | 'imageList';

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
  // Left out of the saved row when it is empty, for a column a database may not have yet.
  // Without this, saving would send null for a column that does not exist and fail the whole save.
  omitWhenEmpty?: boolean;
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
  // Which SQL file creates this table. It is named in the message when the table is missing, so
  // nobody has to guess which script still needs running.
  setupFile?: string;
  pk: string; // primary key column
  title: string;
  description: string;
  itemNoun: string; // "FAQ", "Venue", ...
  fields: FieldConfig[];
  orderBy?: { column: string; ascending?: boolean; nullsFirst?: boolean }[];
  // Only show rows where this column has this value. Two screens can share one table this way; set the
  // same value in onCreate so a new row lands on the screen that made it.
  filter?: { column: string; value: string };
  lookups?: LookupConfig[];
  listTitle: (row: Row, labels: LookupLabels) => string;
  listSubtitle?: (row: Row, labels: LookupLabels) => string;
  // Extra columns to set when a new row is created (not shown in the form).
  onCreate?: (user: { email: string }) => Row;
};
