// tabs/ComparisonTab.tsx
import React from "react";

interface ComparisonTabProps {
  comparedCharacters: string[];
  onAddToComparison: (id: string) => void;
  onCompare: (ids: string[]) => Promise<Record<string, any>>;
}

export const ComparisonTab: React.FC<ComparisonTabProps> = ({
  comparedCharacters,
  onCompare,
}) => {
  return (
    <div className="p-6 bg-white border rounded-lg">
      <h3 className="mb-4 text-lg font-semibold">Character Comparison</h3>
      <div className="p-4 rounded bg-purple-50">
        <p className="text-sm text-purple-800">
          Enter character IDs to compare (comma-separated):
        </p>
        <input
          className="w-full px-3 py-2 mt-2 border rounded"
          placeholder="Character IDs."
          onChange={async (e) => {
            const ids = e.target.value
              .split(",")
              .map((id) => id.trim())
              .filter(Boolean);

            if (ids.length > 0) {
              const comparisons = await onCompare(ids);
              console.log("Character comparisons:", comparisons);
            }
          }}
        />
        {comparedCharacters.length > 0 && (
          <div className="mt-2">
            <strong>Comparing with:</strong> {comparedCharacters.join(", ")}
          </div>
        )}
      </div>
    </div>
  );
};
