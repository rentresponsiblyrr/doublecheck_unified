
import { MediaUploader } from "@/components/MediaUploader";
import { UploadedEvidence } from "@/components/UploadedEvidence";
import { ChecklistItemType } from "@/types/inspection";

interface ChecklistItemUploadSectionProps {
  item: ChecklistItemType;
  hasUploadedMedia: boolean;
  isUploading: boolean;
  isDeleting: boolean;
  onMediaUpload: (file: File) => Promise<void>;
  onUploadComplete: () => Promise<void>;
  onDeleteMedia: () => Promise<void>;
}

export const ChecklistItemUploadSection = ({
  item,
  hasUploadedMedia,
  isUploading,
  isDeleting,
  onMediaUpload,
  onUploadComplete,
  onDeleteMedia
}: ChecklistItemUploadSectionProps) => {
  return (
    <>
      {/* Show existing uploaded evidence */}
      {hasUploadedMedia && (
        <UploadedEvidence checklistItemId={item.id} />
      )}

      {/* Media Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Evidence Upload
        </label>
        <MediaUploader
          evidenceType={item.evidence_type}
          onUpload={onMediaUpload}
          isUploading={isUploading}
          checklistItemId={item.id}
          inspectionId={item.inspection_id}
          onComplete={onUploadComplete}
          category={item.category}
          label={item.label}
          hasUploadedMedia={hasUploadedMedia}
          onDelete={onDeleteMedia}
        />
      </div>
    </>
  );
};
