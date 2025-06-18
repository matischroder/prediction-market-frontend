export interface Market {
  address: string;
  question: string;
  resolutionTime: number;
  totalYesBets: string;
  totalNoBets: string;
  isResolved: boolean;
  outcome?: boolean;
  creator: string;
}

export interface MarketOdds {
  yesOdds: number;
  noOdds: number;
}

export interface UserBet {
  market: string;
  position: boolean;
  amount: string;
  claimed: boolean;
}

export interface ContractAddresses {
  marketFactory: string;
  usdc: string;
  proofOfReserves?: string;
  ccipBridge?: string;
  chainlinkFunctions?: string;
}
