export default function HistoryLoading() {
  return (
    <div className="min-h-screen py-8 bg-background">
      <div className="max-w-6xl mx-auto px-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="h-16 bg-gray-200 rounded-xl mb-4"></div>
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-20 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    </div>
  );
}