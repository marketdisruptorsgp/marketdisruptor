declare module 'd3-sankey' {
  export interface SankeyNodeMinimal<N, L> {
    index?: number;
    x0?: number;
    x1?: number;
    y0?: number;
    y1?: number;
    value?: number;
    sourceLinks?: SankeyLink<N, L>[];
    targetLinks?: SankeyLink<N, L>[];
  }

  export interface SankeyLinkMinimal<N, L> {
    source?: number | N;
    target?: number | N;
    value?: number;
    width?: number;
    y0?: number;
    y1?: number;
  }

  export type SankeyNode<N, L> = N & SankeyNodeMinimal<N, L>;
  export type SankeyLink<N, L> = L & SankeyLinkMinimal<N, L>;

  export interface SankeyGraph<N, L> {
    nodes: SankeyNode<N, L>[];
    links: SankeyLink<N, L>[];
  }

  export interface SankeyLayout<N, L> {
    (data: { nodes: N[]; links: L[] }): SankeyGraph<N, L>;
    nodeWidth(): number;
    nodeWidth(width: number): this;
    nodePadding(): number;
    nodePadding(padding: number): this;
    nodeAlign(): (node: any, n: number) => number;
    nodeAlign(align: (node: any, n: number) => number): this;
    nodeId(): (node: N) => string | number;
    nodeId(id: (node: N) => string | number): this;
    extent(): [[number, number], [number, number]];
    extent(extent: [[number, number], [number, number]]): this;
    size(): [number, number];
    size(size: [number, number]): this;
    iterations(): number;
    iterations(iterations: number): this;
  }

  export function sankey<N = {}, L = {}>(): SankeyLayout<N, L>;
  export function sankeyLinkHorizontal(): (link: any) => string;
  export function sankeyLeft(node: any, n: number): number;
  export function sankeyRight(node: any, n: number): number;
  export function sankeyCenter(node: any, n: number): number;
  export function sankeyJustify(node: any, n: number): number;
}
