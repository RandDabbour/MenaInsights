export function nowIso() {
  return new Date().toISOString();
}

export function toSqlDateTime(input = nowIso()) {
  if (input === null || input === undefined || input === "") {
    return null;
  }
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString().slice(0, 23).replace("T", " ");
}

export function sqlToIso(value) {
  if (!value) {
    return "";
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  const text = String(value).trim();
  if (!text) {
    return "";
  }
  if (text.includes("T")) {
    return text.endsWith("Z") ? text : `${text}Z`;
  }
  return `${text.replace(" ", "T")}Z`;
}
