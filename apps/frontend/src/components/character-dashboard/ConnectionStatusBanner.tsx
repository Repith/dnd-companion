"use client";

import React from "react";

interface ConnectionStatusBannerProps {
  sseDisabled: boolean;
  isPolling: boolean;
  onReconnect: () => void;
}

export const ConnectionStatusBanner: React.FC<ConnectionStatusBannerProps> = ({
  sseDisabled,
  isPolling,
  onReconnect,
}) => {
  if (!sseDisabled && !isPolling) return null;

  return (
    <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg
              className="w-5 h-5 text-yellow-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              {isPolling ? "Using Polling Mode" : "Real-time Updates Disabled"}
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                {isPolling
                  ? "Real-time updates are currently unavailable. The system is polling for updates every 10 seconds."
                  : "Failed to establish real-time connection after multiple attempts. Updates may be delayed."}
              </p>
            </div>
          </div>
        </div>
        <div className="ml-4">
          <button
            onClick={onReconnect}
            className="px-3 py-2 text-sm font-medium text-yellow-800 transition-colors bg-yellow-100 rounded-md hover:bg-yellow-200"
          >
            Try Reconnect
          </button>
        </div>
      </div>
    </div>
  );
};
