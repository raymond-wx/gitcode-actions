type RequestObject = Record<string, unknown>;
type RequestValue = string | RequestObject | Array<string | RequestObject> | undefined;

export function getSingleValue(value: RequestValue): string | undefined {
  if (Array.isArray(value)) {
    const first = value[0];
    return typeof first === 'string' ? first : undefined;
  }

  return typeof value === 'string' ? value : undefined;
}
