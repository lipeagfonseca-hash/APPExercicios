export function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export const exerciseThumbUrl = (id: string) => `/exercises/thumb/${id}.jpg`;
export const exerciseGifUrl = (id: string) => `/exercises/gif/${id}.gif`;
