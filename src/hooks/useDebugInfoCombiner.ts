
export const useDebugInfoCombiner = (
  authDebugInfo: any,
  loadDebugInfo: any,
  submissionDebugInfo: any
) => {
  return {
    ...authDebugInfo,
    ...loadDebugInfo,
    ...submissionDebugInfo
  };
};
