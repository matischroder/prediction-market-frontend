export const formatAddress = (address: string): string => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatAmount = (amount: string, decimals: number = 18): string => {
  const value = parseFloat(amount) / Math.pow(10, decimals);
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
};

export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

export const calculateTimeLeft = (timestamp: number): string => {
  const now = Date.now() / 1000;
  const diff = timestamp - now;

  if (diff <= 0) return "Ended";

  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = Math.floor(diff % 60);

  const parts = [];

  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 && days === 0 && hours === 0) parts.push(`${seconds}s`);

  return parts.join(" ");
};

export const calculateTimeLeftDetailed = (
  timestamp: number
): {
  text: string;
  isUrgent: boolean;
  totalSeconds: number;
} => {
  const now = Date.now() / 1000;
  const diff = timestamp - now;

  if (diff <= 0) return { text: "Ended", isUrgent: false, totalSeconds: 0 };

  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = Math.floor(diff % 60);

  const parts = [];

  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 && days === 0 && hours === 0) parts.push(`${seconds}s`);

  return {
    text: parts.join(" "),
    isUrgent: diff < 60,
    totalSeconds: Math.floor(diff),
  };
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
};
