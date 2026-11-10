export function optionalFormString(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

export function requiredFormString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}
