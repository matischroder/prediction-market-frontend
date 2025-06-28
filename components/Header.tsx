import { FC } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { PlusCircle, Sun, Moon } from "lucide-react";
import clsx from "clsx";

interface HeaderProps {
  onCreateMarket: () => void;
  dark: boolean;
  toggleDark: () => void;
}

export const Header: FC<HeaderProps> = ({
  onCreateMarket,
  dark,
  toggleDark,
}) => {
  return (
    <header
      className={clsx(
        "shadow-sm border-b transition-colors duration-300",
        dark
          ? "bg-palette-bg-dark border-palette-border-dark"
          : "bg-palette-bg-light border-palette-border-light"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-palette-primary-light dark:text-palette-primary-dark">
              Prediction Markets
            </h1>
            <span className="ml-2 text-sm text-palette-text-light dark:text-palette-text-dark bg-palette-card-light dark:bg-palette-card-dark px-2 py-1 rounded">
              Powered by Chainlink
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleDark}
              className="btn btn-secondary flex items-center justify-center p-2"
              aria-label="Toggle dark mode"
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button
              onClick={onCreateMarket}
              className="btn btn-primary flex items-center space-x-2"
            >
              <PlusCircle size={20} />
              <span className="hidden sm:inline">Create Market</span>
            </button>

            <ConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
};
