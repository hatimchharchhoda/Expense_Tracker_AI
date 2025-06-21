export default function ProfileLoading() {
  return (
    <div className="min-h-screen py-8 bg-background">
      <div className="max-w-4xl mx-auto px-4">
        <div className="animate-pulse">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-full w-32"></div>
            <div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <div className="lg:col-span-2">
              <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            </div>

            {/* Stats Card */}
            <div className="space-y-6">
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}