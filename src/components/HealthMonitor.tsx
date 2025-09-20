import { CheckCircle } from "lucide-react";

interface HealthMonitorProps {
  refreshInterval?: number;
  showDetails?: boolean;
  className?: string;
}

export default function HealthMonitor({
  showDetails = false,
  className = "",
}: Readonly<HealthMonitorProps>) {
  if (!showDetails) {
    return null;
  }

  return (
    <div className={`bg-white rounded-lg shadow-md border ${className}`}>
      <div className="p-4 rounded-t-lg border border-green-200 bg-green-50">
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <div>
            <h3 className="font-medium text-green-800">System Healthy</h3>
            <p className="text-sm text-green-600">Form processing available</p>
          </div>
        </div>
      </div>
    </div>
  );
}
