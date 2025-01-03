'use client';
import './globals.css';
import { useSession } from 'next-auth/react';

function Page() {
  const { data: session, status } = useSession();
  const storedSession = localStorage.getItem('session');
    if (!storedSession) {
        console.log("Sesson error");
        return;
    }
    const { user } = JSON.parse(storedSession);
  // if (status === 'loading') {
  //   // Display a loading state while session data is being fetched
  //   return (
  //     <div className="flex flex-col items-center justify-center h-screen">
  //       <p className="text-gray-500">Loading...</p>
  //     </div>
  //   );
  // }

  return (
    <div className="flex flex-col items-center py-8 h-screen">
      {session ? (
        <div className="py-4 px-8 bg-green-200 rounded-lg">
          <p className="text-green-800 font-semibold">Welcome, {user?.username || 'User'}!</p>
          <p>You are logged in.</p>
        </div>
      ) : (
        <div className="py-4 px-8 bg-red-200 rounded-lg">
          <p className="text-red-800 font-semibold">You are not logged in.</p>
          <p>Please sign in to access more features.</p>
        </div>
      )}
    </div>
  );
}

export default Page;
