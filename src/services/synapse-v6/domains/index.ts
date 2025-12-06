/**
 * Domains Module Index
 */

export { B2C_DOMAINS, getB2CDomain, areB2CSourcesCrossDomain, type B2CDomain } from './b2c-domains';
export { B2B_DOMAINS, getB2BDomain, areB2BSourcesCrossDomain, type B2BDomain } from './b2b-domains';
export {
  type ProfileType,
  type Domain,
  isB2BProfile,
  getDomain,
  areCrossDomain,
  calculateUnexpectednessScore,
  getUniqueDomains,
  hasThreeWayPotential,
} from './domain-mapper';
