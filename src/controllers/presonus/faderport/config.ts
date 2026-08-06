import type { ChannelSelector } from "@featherbear/presonus-studiolive-api";

type Tuple<
  T,
  N extends number,
  R extends readonly T[] = []
> = R["length"] extends N ? R : Tuple<T, N, readonly [T, ...R]>;

interface ChannelAssignment {
  channel: ChannelSelector;
  override?: Partial<{
    name: string;
  }>;
}

type FaderPortConfigNChannel<N extends number> = {
  model: N;
  pages: Tuple<ChannelAssignment | undefined, N>[];
  options?: Partial<{
    pagesLoop: boolean
  }>
};

export type FaderPortConfig =
  | FaderPortConfigNChannel<8>
  | FaderPortConfigNChannel<16>;
