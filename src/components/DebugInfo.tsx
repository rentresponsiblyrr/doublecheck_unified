
interface DebugInfoProps {
  debugInfo: any;
}

export const DebugInfo = ({ debugInfo }: DebugInfoProps) => {
  const showDebugInfo = process.env.NODE_ENV === 'development' && Object.keys(debugInfo).length > 0;

  if (!showDebugInfo) {
    return null;
  }

  return (
    <div className="mt-6 p-4 bg-gray-100 rounded-lg">
      <h3 className="text-sm font-semibold mb-2">Debug Information:</h3>
      <pre className="text-xs overflow-auto max-h-40">
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
    </div>
  );
};
