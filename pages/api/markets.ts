// Mock API para opciones de mercado
import type { NextApiRequest, NextApiResponse } from "next";

const marketOptions = [
  "¿Ganará Argentina la Copa América 2024?",
  "¿BTC superará los $100k antes de 2026?",
  "¿Habrá halving de Bitcoin antes de 2028?",
  "¿ETH superará los $5000 en 2025?",
  "¿Will Tesla stock reach $300 by end of year?",
  "¿Will Apple announce new VR headset this year?",
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ options: marketOptions });
}
