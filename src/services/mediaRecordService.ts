import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { log } from "@/lib/logging/enterprise-logger";

export const useMediaRecordService = () => {
  const { user } = useAuth();

  const saveMediaRecordWithAttribution = async (
    checklistItemId: string,
    type: "photo" | "video",
    url: string,
    filePath?: string,
  ) => {
    try {
      log.info(
        "Saving media record with user attribution",
        {
          component: "useMediaRecordService",
          action: "saveMediaRecordWithAttribution",
          checklistItemId,
          type,
          url,
          filePath,
          userId: user?.id,
          userEmail: user?.email,
        },
        "MEDIA_RECORD_SAVE_STARTED",
      );

      // Get user name from auth metadata or email
      const userName =
        user?.user_metadata?.name ||
        user?.email?.split("@")[0] ||
        "Unknown Inspector";

      const { data, error } = await supabase
        .from("media")
        .insert({
          checklist_item_id: checklistItemId,
          type,
          url,
          file_path: filePath,
          user_id: user?.id,
          uploaded_by_name: userName,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        log.error(
          "Database insert error for media record",
          error,
          {
            component: "useMediaRecordService",
            action: "saveMediaRecordWithAttribution",
            checklistItemId,
            type,
            userId: user?.id,
          },
          "MEDIA_RECORD_INSERT_ERROR",
        );
        throw error;
      }

      log.info(
        "Media record saved with attribution",
        {
          component: "useMediaRecordService",
          action: "saveMediaRecordWithAttribution",
          checklistItemId,
          mediaId: data?.id,
          type,
          userId: user?.id,
          uploadedByName: data?.uploaded_by_name,
        },
        "MEDIA_RECORD_SAVED",
      );
      return data;
    } catch (error) {
      log.error(
        "Save media record error",
        error as Error,
        {
          component: "useMediaRecordService",
          action: "saveMediaRecordWithAttribution",
          checklistItemId,
          type,
          userId: user?.id,
        },
        "MEDIA_RECORD_SAVE_FAILED",
      );
      throw error;
    }
  };

  return { saveMediaRecordWithAttribution };
};
