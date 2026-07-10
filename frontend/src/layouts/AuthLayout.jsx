import { FiHeart } from "react-icons/fi";

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen w-full bg-[#F6F9F9] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Brand mark */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 rounded-full bg-[#8FD3C7] flex items-center justify-center mb-3">
            <FiHeart className="text-[#3B7D7F] text-3xl" />
          </div>
          <h1 className="text-2xl font-bold text-[#3B7D7F]">Elder Ease</h1>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-lg border border-[#8FD3C7]/40 p-8">
          <h2 className="text-2xl font-bold text-[#3B7D7F] mb-2 text-center">
            {title}
          </h2>
          {subtitle && (
            <p className="text-base text-gray-500 mb-6 text-center">
              {subtitle}
            </p>
          )}

          {children}
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          Elder Ease — caring made simple
        </p>
      </div>
    </div>
  );
}
