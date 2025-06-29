import { memo } from "react";
import {
  Sun,
  Moon,
  Clock,
  Gift,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Search,
  Filter,
  PlusCircle,
  X,
  Calendar,
  Eye,
  ExternalLink,
  Copy,
  CheckCircle,
  XCircle,
  AlertCircle,
  Wallet,
  Bot,
  Zap,
  Settings,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  Activity,
  BarChart,
  type LucideProps,
} from "lucide-react";

// Memoize all icons to prevent unnecessary rerenders
export const MemoizedSun = memo(Sun);
export const MemoizedMoon = memo(Moon);
export const MemoizedClock = memo(Clock);
export const MemoizedGift = memo(Gift);
export const MemoizedTrendingUp = memo(TrendingUp);
export const MemoizedTrendingDown = memo(TrendingDown);
export const MemoizedUsers = memo(Users);
export const MemoizedDollarSign = memo(DollarSign);
export const MemoizedSearch = memo(Search);
export const MemoizedFilter = memo(Filter);
export const MemoizedPlusCircle = memo(PlusCircle);
export const MemoizedX = memo(X);
export const MemoizedCalendar = memo(Calendar);
export const MemoizedEye = memo(Eye);
export const MemoizedExternalLink = memo(ExternalLink);
export const MemoizedCopy = memo(Copy);
export const MemoizedCheckCircle = memo(CheckCircle);
export const MemoizedXCircle = memo(XCircle);
export const MemoizedAlertCircle = memo(AlertCircle);
export const MemoizedWallet = memo(Wallet);
export const MemoizedBot = memo(Bot);
export const MemoizedZap = memo(Zap);
export const MemoizedSettings = memo(Settings);
export const MemoizedChevronDown = memo(ChevronDown);
export const MemoizedChevronUp = memo(ChevronUp);
export const MemoizedArrowUp = memo(ArrowUp);
export const MemoizedArrowDown = memo(ArrowDown);
export const MemoizedActivity = memo(Activity);
export const MemoizedBarChart = memo(BarChart);

// También exportamos una versión genérica memoizada
export const MemoizedIcon = memo<
  LucideProps & { icon: React.ComponentType<LucideProps> }
>(({ icon: Icon, ...props }) => <Icon {...props} />);

// Helper para crear iconos memoizados on-demand
export const createMemoizedIcon = (
  IconComponent: React.ComponentType<LucideProps>
) => memo(IconComponent);
