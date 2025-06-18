import { FC } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { PlusCircle } from 'lucide-react';

interface HeaderProps {
  onCreateMarket: () => void;
}

export const Header: FC<HeaderProps> = ({ onCreateMarket }) => {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Prediction Markets
            </h1>
            <span className="ml-2 text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
              Powered by Chainlink
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={onCreateMarket}
              className="btn btn-primary flex items-center space-x-2"
            >
              <PlusCircle size={20} />
              <span>Create Market</span>
            </button>
            
            <ConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
};
