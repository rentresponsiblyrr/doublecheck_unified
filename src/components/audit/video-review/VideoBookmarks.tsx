import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Bookmark, Trash2, Plus } from 'lucide-react';
import { VideoBookmark } from './types';

interface VideoBookmarksProps {
  bookmarks: VideoBookmark[];
  currentTime: number;
  onAddBookmark: (time: number, description: string) => void;
  onDeleteBookmark: (bookmarkId: string) => void;
  onSeekToBookmark: (time: number) => void;
}

export const VideoBookmarks: React.FC<VideoBookmarksProps> = ({
  bookmarks,
  currentTime,
  onAddBookmark,
  onDeleteBookmark,
  onSeekToBookmark
}) => {
  const [newBookmarkDescription, setNewBookmarkDescription] = useState('');
  const [isAddingBookmark, setIsAddingBookmark] = useState(false);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAddBookmark = () => {
    if (newBookmarkDescription.trim()) {
      onAddBookmark(currentTime, newBookmarkDescription.trim());
      setNewBookmarkDescription('');
      setIsAddingBookmark(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddBookmark();
    }
  };

  return (
    <div id="video-bookmarks" className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">Bookmarks</h3>
        
        <Popover open={isAddingBookmark} onOpenChange={setIsAddingBookmark}>
          <PopoverTrigger asChild>
            <Button size="sm" className="flex items-center gap-1">
              <Plus className="w-4 h-4" />
              Add
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-3">
              <div>
                <h4 className="font-medium">Add Bookmark</h4>
                <p className="text-sm text-gray-500">
                  Current time: {formatTime(currentTime)}
                </p>
              </div>
              
              <Input
                placeholder="Bookmark description..."
                value={newBookmarkDescription}
                onChange={(e) => setNewBookmarkDescription(e.target.value)}
                onKeyPress={handleKeyPress}
                autoFocus
              />
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleAddBookmark}
                  disabled={!newBookmarkDescription.trim()}
                >
                  Add Bookmark
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsAddingBookmark(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <ScrollArea className="h-[200px]">
        <div className="space-y-2">
          {bookmarks.map((bookmark) => (
            <div
              key={bookmark.id}
              className="p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-blue-500" />
                  <Badge 
                    variant="outline" 
                    className="cursor-pointer hover:bg-blue-50"
                    onClick={() => onSeekToBookmark(bookmark.time)}
                  >
                    {formatTime(bookmark.time)}
                  </Badge>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteBookmark(bookmark.id)}
                  className="text-red-500 hover:text-red-700 h-6 w-6 p-0"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
              
              <p className="text-sm text-gray-700">{bookmark.description}</p>
            </div>
          ))}
        </div>
      </ScrollArea>

      {bookmarks.length === 0 && (
        <div className="text-center py-6 text-gray-500">
          <Bookmark className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No bookmarks yet</p>
          <p className="text-xs mt-1">Press 'B' to add bookmark at current time</p>
        </div>
      )}
    </div>
  );
};