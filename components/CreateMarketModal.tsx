import { FC, useState, useEffect } from "react";
import { X, Calendar, HelpCircle } from "lucide-react";
import toast from "react-hot-toast";

interface CreateMarketModalProps {
  onClose: () => void;
  onCreate: (
    question: string,
    resolutionTime: number
  ) => Promise<string | null>;
}

export const CreateMarketModal: FC<CreateMarketModalProps> = ({
  onClose,
  onCreate,
}) => {
  const [question, setQuestion] = useState("");
  const [resolutionDate, setResolutionDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [marketOptions, setMarketOptions] = useState<string[]>([]);
  const [pair, setPair] = useState("");
  const [pairPrice, setPairPrice] = useState<number | null>(null);
  const [feeds, setFeeds] = useState<{ symbol: string; price: number }[]>([]);
  const [targetPrice, setTargetPrice] = useState("");
  const [direction, setDirection] = useState<"above" | "below">("above");

  // Simula fetch a una API de Chainlink Functions o similar
  useEffect(() => {
    async function fetchMarketOptions() {
      try {
        // Reemplazar por fetch real a Chainlink Functions/API
        const response = await fetch("/api/markets"); // endpoint mock
        if (!response.ok) throw new Error("API error");
        const data = await response.json();
        setMarketOptions(data.options || []);
      } catch (e) {
        // fallback mock local
        setMarketOptions([
          "¿Ganará Argentina la Copa América 2024?",
          "¿BTC superará los $100k antes de 2026?",
          "¿Habrá halving de Bitcoin antes de 2028?",
        ]);
      }
    }
    fetchMarketOptions();
  }, []);

  // Fetch de feeds de Chainlink (mock API)
  useEffect(() => {
    async function fetchFeeds() {
      try {
        const response = await fetch("/api/chainlink-feeds");
        if (!response.ok) throw new Error("API error");
        const data = await response.json();
        setFeeds(data.feeds || []);
      } catch (e) {
        setFeeds([
          { symbol: "ETH/USD", price: 3500.12 },
          { symbol: "BTC/USD", price: 67000.45 },
        ]);
      }
    }
    fetchFeeds();
  }, []);

  // Actualiza el precio actual al cambiar el par
  useEffect(() => {
    const found = feeds.find((f) => f.symbol === pair);
    setPairPrice(found ? found.price : null);
  }, [pair, feeds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pair || !targetPrice || !direction || !resolutionDate) return;
    const resolutionTimestamp = new Date(resolutionDate).getTime() / 1000;
    if (resolutionTimestamp <= Date.now() / 1000) {
      toast.error("Resolution date must be in the future");
      return;
    }
    if (isNaN(Number(targetPrice)) || Number(targetPrice) <= 0) {
      toast.error("Enter a valid target price");
      return;
    }
    setLoading(true);
    try {
      // La pregunta se arma con los datos seleccionados
      const question = `¿${pair} estará ${
        direction === "above" ? "por encima" : "por debajo"
      } de ${targetPrice} USD el ${new Date(resolutionDate).toLocaleString()}?`;
      const txHash = await onCreate(question, resolutionTimestamp);
      if (txHash) {
        toast.success("Market created successfully!");
        onClose();
      } else {
        toast.error("Failed to create market");
      }
    } catch (error) {
      console.error("Error creating market:", error);
      toast.error("Error creating market");
    } finally {
      setLoading(false);
    }
  };

  const minDateTime = new Date(Date.now() + 3600000).toISOString().slice(0, 16); // 1 hour from now

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-palette-card-light dark:bg-palette-card-dark rounded-xl max-w-md w-full p-6 max-h-90vh overflow-y-auto text-palette-text-light dark:text-palette-text-dark border border-palette-border-light dark:border-palette-border-dark">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-palette-text-light dark:text-palette-text-dark">
            Create New Market
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-palette-text-light dark:text-palette-text-dark mb-2">
              <HelpCircle size={16} className="inline mr-1" />
              Select Asset Pair
            </label>
            <select
              value={pair}
              onChange={(e) => setPair(e.target.value)}
              className="input"
              required
            >
              <option value="" disabled>
                Select a pair...
              </option>
              {feeds.map((feed, i) => (
                <option key={i} value={feed.symbol}>
                  {feed.symbol} (Current: {feed.price} USD)
                </option>
              ))}
            </select>
            {pairPrice !== null && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Current price:{" "}
                <span className="font-semibold">{pairPrice} USD</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-palette-text-light dark:text-palette-text-dark mb-2">
              Target Price
            </label>
            <input
              type="number"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              className="input"
              placeholder="Enter target price (USD)"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-palette-text-light dark:text-palette-text-dark mb-2">
              Condition
            </label>
            <select
              value={direction}
              onChange={(e) =>
                setDirection(e.target.value as "above" | "below")
              }
              className="input"
              required
            >
              <option value="above">Above</option>
              <option value="below">Below</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-palette-text-light dark:text-palette-text-dark mb-2">
              <Calendar size={16} className="inline mr-1" />
              Resolution Date & Time
            </label>
            <input
              type="datetime-local"
              value={resolutionDate}
              onChange={(e) => setResolutionDate(e.target.value)}
              className="input"
              min={minDateTime}
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              When should this market be resolved?
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
              Market Rules
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
              <li>
                • Markets are resolved automatically at the specified time
              </li>
              <li>• Resolution uses Chainlink price feeds when applicable</li>
              <li>• Winners share the total pool proportionally</li>
              <li>
                • A random bonus winner is selected among correct predictors
              </li>
            </ul>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary flex-1"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                loading ||
                !pair ||
                !targetPrice ||
                !direction ||
                !resolutionDate
              }
              className="btn btn-primary flex-1"
            >
              {loading ? "Creating..." : "Create Market"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
