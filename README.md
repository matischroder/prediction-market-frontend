# Prediction Market Frontend

Frontend application for the decentralized cross-chain prediction market platform.

## Features

- 🎨 Modern UI with Tailwind CSS
- 🔗 Web3 wallet integration with RainbowKit
- ⚡ Real-time market data
- 📱 Responsive design
- 🔄 Cross-chain support (Mumbai, Sepolia)
- 🎲 Interactive betting interface
- 📊 Live odds and statistics
- 🏆 Prize claiming system

## Tech Stack

- Next.js 13
- TypeScript
- Tailwind CSS
- wagmi
- RainbowKit
- ethers.js
- React Hot Toast

## Installation

```bash
npm install
```

## Configuration

1. Copy `.env.example` to `.env.local`
2. Add your API keys and project IDs

```bash
cp .env.example .env.local
```

Required environment variables:

- `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` - Get from [WalletConnect Cloud](https://cloud.walletconnect.com)
- `NEXT_PUBLIC_ALCHEMY_ID` - Get from [Alchemy](https://www.alchemy.com)
- `NEXT_PUBLIC_MARKET_FACTORY_ADDRESS` - Deployed contract address
- `NEXT_PUBLIC_USDC_ADDRESS` - USDC token address

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Build

```bash
npm run build
npm start
```

## Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/prediction-market-frontend)

1. Connect your GitHub repository
2. Add environment variables
3. Deploy

### Manual Deployment

```bash
npm run build
npm run export
```

## Features Overview

### 🏠 Home Page

- Market discovery and filtering
- Real-time statistics
- Search functionality
- Market creation

### 📊 Market Details

- Detailed market information
- Live odds display
- Betting interface
- User position tracking
- Prize claiming

### 💰 Betting System

- Position selection (YES/NO)
- Amount input with validation
- USDC approval flow
- Potential payout calculation
- Transaction confirmation

### 🔗 Wallet Integration

- Multiple wallet support via RainbowKit
- Network switching
- Balance display
- Transaction history

## Supported Networks

- **Polygon Mumbai** (Testnet)
- **Ethereum Sepolia** (Testnet)

## Contract Integration

The frontend integrates with several smart contracts:

- **MarketFactory** - Creates and manages markets
- **PredictionMarket** - Individual market logic
- **MockUSDC** - Betting token (testnet)
- **ProofOfReservesGuard** - Solvency verification
- **CCIPBridge** - Cross-chain functionality

## Usage

### Creating a Market

1. Connect your wallet
2. Click "Create Market"
3. Enter question and resolution date
4. Confirm transaction

### Placing a Bet

1. Browse available markets
2. Click "Place Bet" on desired market
3. Choose YES or NO position
4. Enter bet amount
5. Approve USDC (if needed)
6. Confirm bet transaction

### Claiming Prizes

1. Wait for market resolution
2. Navigate to resolved market
3. Click "Claim Prize" if you won
4. Confirm transaction

## Development

### Project Structure

```
src/
├── components/          # React components
│   ├── Header.tsx      # Navigation header
│   ├── MarketCard.tsx  # Market display card
│   ├── BetModal.tsx    # Betting interface
│   └── CreateMarketModal.tsx
├── hooks/              # Custom React hooks
│   ├── useMarketContract.ts
│   └── useTokenApproval.ts
├── pages/              # Next.js pages
│   ├── index.tsx       # Home page
│   └── markets/[id].tsx # Market detail
├── types/              # TypeScript types
├── utils/              # Utility functions
└── styles/             # Global styles
```

### Adding New Features

1. **New Market Types**: Extend the `Market` interface in `types/contracts.ts`
2. **Additional Chains**: Update `wagmi` configuration in `_app.tsx`
3. **New Components**: Follow existing patterns in `components/`

### Testing

```bash
npm run lint
npm run type-check
```

## Troubleshooting

### Common Issues

1. **"Network not supported"**

   - Switch to Mumbai or Sepolia testnet
   - Check contract addresses in `contracts/addresses.json`

2. **"Insufficient allowance"**

   - Approve USDC spending before betting
   - Check USDC balance

3. **Transaction failed**
   - Ensure sufficient gas
   - Check network congestion
   - Verify contract addresses

### Getting Test Tokens

- **Mumbai MATIC**: [Polygon Faucet](https://faucet.polygon.technology/)
- **Sepolia ETH**: [Sepolia Faucet](https://sepoliafaucet.com/)
- **Test USDC**: Use the `mint` function on deployed MockUSDC contract

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions:

- Create an issue on GitHub
- Join our Discord community
- Check the documentation

---

Built with ❤️ using Next.js, Chainlink, and Web3 technologies.
