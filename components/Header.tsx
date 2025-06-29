import { FC } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { MemoizedSun, MemoizedMoon } from "./MemoizedIcons";
import clsx from "clsx";

interface HeaderProps {
  dark: boolean;
  toggleDark: () => void;
}

export const Header: FC<HeaderProps> = ({ dark, toggleDark }) => {
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
            <div className="flex items-center">
              <div className="w-10 h-10 mr-3 rounded-full overflow-hidden">
                <img
                  src="/icon1.png"
                  alt="Nostronet Logo"
                  className="w-full h-full object-cover object-center"
                  style={{ transform: "scale(1.3)" }}
                />
              </div>
              <h1 className="hidden sm:block text-2xl font-bold text-palette-primary-light dark:text-palette-primary-dark">
                Nostronet
              </h1>
            </div>
            <span className="hidden sm:inline ml-2 text-sm text-palette-text-light dark:text-palette-text-dark bg-palette-card-light dark:bg-palette-card-dark px-2 py-1 rounded">
              Powered by Chainlink
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <ConnectButton />
            <button
              onClick={toggleDark}
              className="btn btn-secondary flex items-center justify-center p-2"
              aria-label="Toggle dark mode"
            >
              {dark ? <MemoizedSun size={18} /> : <MemoizedMoon size={18} />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
