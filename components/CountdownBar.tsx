import { FC } from "react";

interface CountdownBarProps {
  totalSeconds: number;
  isUrgent: boolean;
}

export const CountdownBar: FC<CountdownBarProps> = ({
  totalSeconds,
  isUrgent,
}) => {
  if (!isUrgent || totalSeconds > 60) return null;

  const percentage = (totalSeconds / 60) * 100;

  return (
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2 overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all duration-1000 ease-linear animate-pulse"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};
