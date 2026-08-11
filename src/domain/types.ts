export const SEATS = ['east', 'south', 'west', 'north'] as const
export type Seat = (typeof SEATS)[number]

export const PROFILE_IDS = ['riichi', 'mcr', 'hong-kong'] as const
export type ProfileId = (typeof PROFILE_IDS)[number]
export type Locale = 'en' | 'ar' | 'es' | 'fr' | 'ja' | 'ko' | 'vi' | 'zh-Hans' | 'zh-Hant' | 'de' | 'ru'

export type EvidenceKind = 'exact' | 'calculated' | 'engine' | 'authored' | 'model' | 'analogy'

export const TILE_TYPES = [
  'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9',
  'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9',
  's1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9',
  'east', 'south', 'west', 'north', 'white', 'green', 'red',
] as const

export type TileType = (typeof TILE_TYPES)[number]

export interface TileInstance {
  id: string
  type: TileType
  copy: 0 | 1 | 2 | 3
}

export type MeldKind = 'chi' | 'pon' | 'kan'

export interface Meld {
  kind: MeldKind
  tiles: TileInstance[]
  calledTileId: string
  from: Seat
  open: true
}

export interface Discard {
  tile: TileInstance
  by: Seat
  turn: number
  claimed: boolean
}

export type Action =
  | { kind: 'draw' }
  | { kind: 'discard'; tileId: string }
  | { kind: 'pass' }
  | { kind: 'chi'; tileIds: [string, string] }
  | { kind: 'pon'; tileIds: [string, string] }
  | { kind: 'kan'; tileIds: [string, string, string] }
  | { kind: 'tsumo' }
  | { kind: 'ron' }

export interface ActionCandidate {
  id: string
  actorId: string
  seat: Seat
  action: Action
  labelKey: string
  evidence: 'exact'
}

export type GamePhase = 'draw' | 'discard' | 'claim' | 'finished'

export interface GameEvent {
  number: number
  kind: Action['kind'] | 'deal' | 'exhaustive-draw'
  seat: Seat
  tile: TileInstance | null
  messageKey: string
}

export interface GameResult {
  kind: 'tsumo' | 'ron' | 'exhaustive-draw'
  winner: Seat | null
  from: Seat | null
  exactShape: boolean
  scoringStatusKey: string
}

export interface MahjongState {
  schemaVersion: 1
  sessionId: string
  seed: string
  profile: ProfileId
  dealer: Seat
  roundWind: 'east'
  activeSeat: Seat
  phase: GamePhase
  wall: TileInstance[]
  hands: Record<Seat, TileInstance[]>
  melds: Record<Seat, Meld[]>
  rivers: Record<Seat, Discard[]>
  claimQueue: Seat[]
  lastDiscard: Discard | null
  turn: number
  events: GameEvent[]
  result: GameResult | null
}

export interface ProfileRules {
  id: ProfileId
  nameKey: string
  shortKey: string
  scoringBoundaryKey: string
  callNames: { chi: string; pon: string; kan: string }
  allowsChi: true
  allowsPon: true
  allowsKan: true
  supportsExactAdvancedScoring: false
}

export interface GameConfig {
  profile: ProfileId
  seed: string
}

export interface HiddenHand {
  hidden: true
  count: number
}

export interface PublicPlayerView {
  seat: Seat
  actorId: string
  hand: TileInstance[] | HiddenHand
  melds: Meld[]
  river: Discard[]
  isActive: boolean
}

export interface PublicGameView {
  sessionId: string
  profile: ProfileId
  dealer: Seat
  roundWind: 'east'
  activeSeat: Seat
  activeActorId: string
  phase: GamePhase
  wallCount: number
  turn: number
  players: PublicPlayerView[]
  lastDiscard: Discard | null
  events: GameEvent[]
  result: GameResult | null
  /** Viewer-safe display identity. It is never accepted as mutation authority. */
  viewToken: string
}

export interface TeachingFacet {
  id: 'shape' | 'ukeire' | 'safety' | 'value' | 'tempo'
  evidence: EvidenceKind
  titleKey: string
  bodyKey: string
  params: Record<string, string | number>
}

export interface HandAnalysis {
  complete: boolean
  tenpai: boolean
  waits: TileType[]
  ukeire: number
  improvingTiles: TileType[]
  shapeScore: number
  pairs: number
  connected: number
  isolated: number
}

export interface CandidatePreview {
  candidate: ActionCandidate
  legal: boolean
  hypothetical: true
  titleKey: string
  whyKey: string
  changesKey: string
  replyKey: string
  nextKey: string
  principleKey: string
  params: Record<string, string | number>
  facets: TeachingFacet[]
  handAfter: TileInstance[] | null
  analysisBefore: HandAnalysis | null
  analysisAfter: HandAnalysis | null
}

export interface ProcessedRequest {
  candidateId: string
  /** Canonical complete candidate envelope for exact idempotency matching. */
  requestFingerprint: string
  resultingRevision: number
}

export interface SessionRecord {
  id: string
  revision: number
  createdAt: string
  updatedAt: string
  viewerSeat: Seat
  state: MahjongState
  processedRequests: Record<string, ProcessedRequest>
}

export interface SessionSummary {
  id: string
  profile: ProfileId
  seedLabel: string
  viewerSeat: Seat
  revision: number
  turn: number
  phase: GamePhase
  updatedAt: string
}
