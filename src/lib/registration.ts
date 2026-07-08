export const FIELD_ORDER = ["country", "region", "gender", "birth_year"] as const;
export type RegistrationField = (typeof FIELD_ORDER)[number];

export const GENDERS = ["男性", "女性", "その他", "回答しない"] as const;

export type MemberProfile = {
  country: string | null;
  region: string | null;
  gender: string | null;
  birth_year: number | null;
};

export function nextIncompleteField(member: MemberProfile): RegistrationField | null {
  return FIELD_ORDER.find((field) => member[field] === null) ?? null;
}

export function validateFieldValue(
  field: RegistrationField,
  value: unknown,
): string | number | null {
  if (field === "birth_year") {
    const year = Number(value);
    const currentYear = new Date().getFullYear();
    if (!Number.isInteger(year) || year < 1900 || year > currentYear) return null;
    return year;
  }
  if (field === "gender") {
    return typeof value === "string" && (GENDERS as readonly string[]).includes(value)
      ? value
      : null;
  }
  // country, region
  if (typeof value === "string" && value.trim().length > 0 && value.trim().length <= 100) {
    return value.trim();
  }
  return null;
}
