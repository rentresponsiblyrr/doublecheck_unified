
import { User, Clock } from "lucide-react";
import { NotesHistoryEntry } from "@/hooks/useNotesHistory";

interface NotesHistoryListProps {
  notesHistory: NotesHistoryEntry[];
  isLoading: boolean;
}

export const NotesHistoryList = ({ notesHistory, isLoading }: NotesHistoryListProps) => {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (notesHistory.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <User className="w-4 h-4" />
        <span>Inspector Notes ({notesHistory.length})</span>
      </div>
      
      {isLoading ? (
        <div className="animate-pulse">
          <div className="h-16 bg-gray-100 rounded-lg"></div>
        </div>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {notesHistory.map((entry, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-700">
                  {entry.user_name}
                </span>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>{formatTimestamp(entry.timestamp)}</span>
                </div>
              </div>
              <p className="text-sm text-gray-700">{entry.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
