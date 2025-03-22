"use client";
import React from "react";

interface TableLoadingSkeletonProps {
  rows?: number;
  columns?: number;
}

const TableLoadingSkeleton: React.FC<TableLoadingSkeletonProps> = ({
  rows = 5,
  columns = 7,
}) => {
  return (
    <div className="animate-pulse">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {Array(columns)
                .fill(0)
                .map((_, index) => (
                  <th
                    key={index}
                    scope="col"
                    className="px-6 py-3 text-left"
                  >
                    <div className="h-2.5 bg-gray-200 rounded-full w-24 mb-2.5"></div>
                  </th>
                ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Array(rows)
              .fill(0)
              .map((_, rowIndex) => (
                <tr key={rowIndex}>
                  {Array(columns)
                    .fill(0)
                    .map((_, colIndex) => (
                      <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                        <div className="h-2.5 bg-gray-200 rounded-full w-24 mb-2.5"></div>
                        {colIndex === 1 && (
                          <div className="h-2 bg-gray-200 rounded-full w-12"></div>
                        )}
                      </td>
                    ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableLoadingSkeleton;