import type { ProfileId, ProfileRules } from './types'

export const PROFILES: Record<ProfileId, ProfileRules> = {
  riichi: {
    id: 'riichi',
    nameKey: 'profile.riichi.name',
    shortKey: 'profile.riichi.short',
    scoringBoundaryKey: 'profile.riichi.boundary',
    callNames: { chi: 'chii', pon: 'pon', kan: 'kan' },
    allowsChi: true,
    allowsPon: true,
    allowsKan: true,
    sevenPairsMode: 'distinct-pairs',
    supportsExactAdvancedScoring: false,
  },
  mcr: {
    id: 'mcr',
    nameKey: 'profile.mcr.name',
    shortKey: 'profile.mcr.short',
    scoringBoundaryKey: 'profile.mcr.boundary',
    callNames: { chi: 'chow', pon: 'pung', kan: 'kong' },
    allowsChi: true,
    allowsPon: true,
    allowsKan: true,
    sevenPairsMode: 'quad-as-two-pairs',
    supportsExactAdvancedScoring: false,
  },
  'hong-kong': {
    id: 'hong-kong',
    nameKey: 'profile.hk.name',
    shortKey: 'profile.hk.short',
    scoringBoundaryKey: 'profile.hk.boundary',
    callNames: { chi: 'chow', pon: 'pung', kan: 'kong' },
    allowsChi: true,
    allowsPon: true,
    allowsKan: true,
    // This teaching profile deliberately chooses the common distinct-pairs
    // interpretation. House rules that count a quad twice remain unsupported.
    sevenPairsMode: 'distinct-pairs',
    supportsExactAdvancedScoring: false,
  },
}
