import type { StateCreator, StoreMutatorIdentifier } from 'zustand';

export const logger =
  <T, Mps extends [StoreMutatorIdentifier, unknown][] = [], Mcs extends [StoreMutatorIdentifier, unknown][] = []>(
    config: StateCreator<T, Mps, Mcs>,
    name?: string,
  ): StateCreator<T, Mps, Mcs> =>
  (set, get, api) =>
    config(
      ((partial: T | Partial<T> | ((state: T) => T | Partial<T>), replace?: boolean) => {
        const prev = get();
        (set as (partial: T | Partial<T> | ((state: T) => T | Partial<T>), replace?: boolean) => void)(
          partial,
          replace,
        );
        if (process.env.NODE_ENV === 'development') {
          console.log(`[${name ?? 'store'}]`, { prev, next: get() });
        }
      }) as typeof set,
      get,
      api,
    );
