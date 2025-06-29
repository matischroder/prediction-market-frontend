export interface Market {
  address: string;
  assetName: string;
  baseAsset: string;
  targetPrice: string;
  resolutionTime: number;
  totalHigherBets: string;
  totalLowerBets: string;
  isResolved: boolean;
  outcome?: boolean; // true = HIGHER won, false = LOWER won
  creator: string;
  finalPrice?: string;
  randomWinner?: string;
  bonusAmount?: string;
  // New automation fields
  isAutomated?: boolean;
  automationRegistered?: boolean;
  vrfRequested?: boolean;
  vrfFulfilled?: boolean;
  // Backward compatibility
  totalYesBets?: string;
  totalNoBets?: string;
  question?: string;
}

export interface MarketOdds {
  higherOdds: number;
  lowerOdds: number;
  yesOdds?: number; // For backward compatibility
  noOdds?: number; // For backward compatibility
}

export interface UserBet {
  market: string;
  position: boolean; // true = HIGHER, false = LOWER
  amount: string;
  claimed: boolean;
  payout?: string;
  betIndex?: number;
}

export interface BetInfo {
  user: string;
  amount: string;
  isHigher: boolean;
  claimed: boolean;
  payout: string;
  betIndex: number;
}

export interface UserBets {
  higherBet: string;
  lowerBet: string;
  hasClaimed: boolean;
  betIndices: number[];
  calculatedPrize?: string;
  // Backward compatibility
  yesBet?: string;
  noBet?: string;
}

export interface ContractAddresses {
  marketFactory: string;
  nostronet: string;
  proofOfReserves?: string;
  ccipBridge?: string;
  chainlinkFunctions?: string;
}

export interface PayoutInfo {
  winningPayout: string;
  bonusPayout: string;
  totalPayout: string;
  hasWinnings: boolean;
  hasBonus: boolean;
  canClaim: boolean;
}
