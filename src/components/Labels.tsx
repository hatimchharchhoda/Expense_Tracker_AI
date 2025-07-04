// components/Labels.tsx - REPLACE ENTIRE FILE
import { useEffect, useState, useCallback, useMemo } from 'react';
import { getLabels } from '@/helper/graphData';

interface Transaction {
  _id: string;
  name: string;
  type: string;
  amount: number;
  date: Date;
  color: string;
}

interface LabelData {
  type: string;
  color: string;
  total: number;
  percent: number;
}

interface CachedLabelData {
  labels: LabelData[];
  timestamp: number;
}

export default function Label() {
  const [labelData, setLabelData] = useState<LabelData[]>([]);
  const [loading, setLoading] = useState(true);

  // Cache duration (2 minutes to match dashboard)
  const CACHE_DURATION = useMemo(() => 2 * 60 * 1000, []);

  const getLabelDataFromCache = useCallback((): LabelData[] | null => {
    try {
      const cachedData = localStorage.getItem('labelCache');
      if (!cachedData) return null;

      const { labels, timestamp }: CachedLabelData = JSON.parse(cachedData);
      if (Date.now() - timestamp > CACHE_DURATION) {
        localStorage.removeItem('labelCache');
        return null;
      }

      return labels;
    } catch (error) {
      console.error('Error reading from label cache:', error);
      localStorage.removeItem('labelCache');
      return null;
    }
  }, [CACHE_DURATION]);

  const saveLabelDataToCache = useCallback((labels: LabelData[]) => {
    const cacheData: CachedLabelData = {
      labels,
      timestamp: Date.now()
    };
    localStorage.setItem('labelCache', JSON.stringify(cacheData));
  }, []);

  const processTransactions = useCallback((transactions: Transaction[]) => {
    const labels = getLabels(transactions);
    setLabelData(labels);
    saveLabelDataToCache(labels);
  }, [saveLabelDataToCache]);

  useEffect(() => {
    const initializeLabels = () => {
      try {
        // First try to get data from labelCache
        const cachedLabels = getLabelDataFromCache();
        if (cachedLabels) {
          setLabelData(cachedLabels);
          setLoading(false);
          return; // Exit early if we have cached data
        }

        // Then try to get fresh data from dashboardCache
        const dashboardCache = localStorage.getItem('dashboardCache');
        if (dashboardCache) {
          const { transactions } = JSON.parse(dashboardCache);
          if (transactions && Array.isArray(transactions)) {
            processTransactions(transactions);
          }
        }
      } catch (error) {
        console.error('Error initializing labels:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeLabels();

    // Set up listener for dashboard cache updates
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'dashboardCache' && e.newValue) {
        try {
          const { transactions } = JSON.parse(e.newValue);
          if (transactions && Array.isArray(transactions)) {
            processTransactions(transactions);
          }
        } catch (error) {
          console.error('Error processing storage change:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [getLabelDataFromCache, processTransactions]); // Only include stable callback functions

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex justify-between items-center h-8">
            <div className="flex gap-2 items-center">
              <div className="w-3 h-3 rounded-full bg-gray-200 dark:bg-gray-700"></div>
              <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
            <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {labelData.length > 0 ? (
        labelData.map((label, index) => (
          <LabelComponent key={`${label.type}-${index}`} data={label} />
        ))
      ) : (
        <p className="text-muted-foreground text-center py-4">No transactions available</p>
      )}
    </div>
  );
}

interface LabelComponentProps {
  data: LabelData;
}

function LabelComponent({ data }: LabelComponentProps) {
  return (
    <div className="flex justify-between items-center p-2 hover:bg-accent/50 rounded-lg transition-colors duration-200">
      <div className="flex gap-3 items-center">
        <div
          className="w-4 h-4 rounded-full shadow-sm"
          style={{ background: data.color ?? '#f9c74f' }}
        ></div>
        <h3 className="text-sm font-medium text-foreground">
          {data.type ?? 'Unknown'}
        </h3>
      </div>
      <div className="flex items-center gap-2">
        <h3 className="font-bold text-sm text-foreground">
          {Math.round(data.percent)}%
        </h3>
        <span className="text-xs text-muted-foreground">
          (₹{data.total.toLocaleString()})
        </span>
      </div>
    </div>
  );
}