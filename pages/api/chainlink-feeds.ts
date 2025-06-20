// Mock API para simular un feed de Chainlink
import type { NextApiRequest, NextApiResponse } from "next";

const feeds = [
  { symbol: "ETH/USD", price: 3500.12 },
  { symbol: "BTC/USD", price: 67000.45 },
  { symbol: "LINK/USD", price: 18.23 },
  { symbol: "ARB/USD", price: 1.12 },
  { symbol: "SOL/USD", price: 145.67 },
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ feeds });
}
