// filter out undefined keys
export type GetDefinedKeys<Tobj extends Record<string, any>> = {
  [key in keyof Tobj]: Tobj[key] extends undefined ? never : key;
}[keyof Tobj];

export type FilterOutNeverProperties<Tobj extends Record<string, any>> = {
  [key in GetDefinedKeys<Tobj>]: Tobj[key];
};

// expands object types recursively
export type ExpandRecursively<T> = T extends object
  ? T extends infer O ? { [K in keyof O]: ExpandRecursively<O[K]> } : never
  : T;
