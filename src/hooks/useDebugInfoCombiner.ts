export const useDebugInfoCombiner = (
  authDebugInfo: Record<string, unknown>,
  loadDebugInfo: Record<string, unknown>,
  submissionDebugInfo: Record<string, unknown>,
) => {
  return {
    ...authDebugInfo,
    ...loadDebugInfo,
    ...submissionDebugInfo,
  };
};
