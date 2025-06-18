import { FC, useState } from 'react';
import { X, Calendar, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface CreateMarketModalProps {
  onClose: () => void;
  onCreate: (question: string, resolutionTime: number) => Promise<string | null>;
}

export const CreateMarketModal: FC<CreateMarketModalProps> = ({ onClose, onCreate }) => {
  const [question, setQuestion] = useState('');
  const [resolutionDate, setResolutionDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question || !resolutionDate) return;

    const resolutionTimestamp = new Date(resolutionDate).getTime() / 1000;
    
    // Validation
    if (resolutionTimestamp <= Date.now() / 1000) {
      toast.error('Resolution date must be in the future');
      return;
    }

    setLoading(true);
    try {
      const txHash = await onCreate(question, resolutionTimestamp);
      
      if (txHash) {
        toast.success('Market created successfully!');
        onClose();
      } else {
        toast.error('Failed to create market');
      }
    } catch (error) {
      console.error('Error creating market:', error);
      toast.error('Error creating market');
    } finally {
      setLoading(false);
    }
  };

  const minDateTime = new Date(Date.now() + 3600000).toISOString().slice(0, 16); // 1 hour from now

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-90vh overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Create New Market</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <HelpCircle size={16} className="inline mr-1" />
              Market Question
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="input"
              rows={3}
              placeholder="Will Bitcoin reach $100k by end of year?"
              required
              maxLength={200}
            />
            <p className="text-xs text-gray-500 mt-1">
              {question.length}/200 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
            <p className="text-xs text-gray-500 mt-1">
              When should this market be resolved?
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Market Rules</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Markets are resolved automatically at the specified time</li>
              <li>• Resolution uses Chainlink price feeds when applicable</li>
              <li>• Winners share the total pool proportionally</li>
              <li>• A random bonus winner is selected among correct predictors</li>
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
              disabled={loading || !question.trim() || !resolutionDate}
              className="btn btn-primary flex-1"
            >
              {loading ? 'Creating...' : 'Create Market'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
