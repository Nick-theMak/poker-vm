import * as React from "react";
import { Link } from "react-router-dom"; // Import Link for navigation

const Dashboard: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-r from-gray-800 via-gray-900 to-black">
      {/* Main Dashboard Container */}
      <div className="bg-gray-800 p-10 rounded-xl shadow-2xl w-full max-w-3xl">
        <h1 className="text-4xl font-extrabold text-center text-white mb-8">
          Welcome to the Dashboard
        </h1>

        {/* Navigation Links */}
        <div className="space-y-6">
          {/* Link to Deposit page */}
          <Link
            to="/deposit"
            className="block text-center text-white bg-pink-600 hover:bg-pink-700 rounded-xl py-3 px-6 text-lg transition duration-300 transform hover:scale-105 shadow-md"
          >
            Go to Deposit
          </Link>

          {/* Loop to generate Table Links (ID 1 to 4) */}
          <div className="grid grid-cols-2 gap-6 mt-6">
            {[1, 2, 3, 4].map((id) => (
              <Link
                key={id}
                to={`/table/${id}`}
                className="block text-center text-white bg-gray-600 hover:bg-gray-700 rounded-xl py-3 px-6 text-lg transition duration-300 transform hover:scale-105 shadow-md"
              >
                Table {id}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;