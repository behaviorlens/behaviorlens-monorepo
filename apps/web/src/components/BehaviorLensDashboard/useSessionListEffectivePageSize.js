import { useCallback, useState } from 'react';
import { normalizeSessionPageSize } from './behaviorLensSessionListPaging';
import {
  readSessionListCustomPageSize,
  writeSessionListCustomPageSize
} from './behaviorLensLayoutPreferences';

// The playlist Show dropdown: 10 / 25 / 50 / 100. Stored as a layout
// preference, never URL state. Anything else (including a leftover auto-fit
// integer) falls back to 25.
const useSessionListEffectivePageSize = () => {
  const [pageSize, setPageSizeState] = useState(() => (
    normalizeSessionPageSize(readSessionListCustomPageSize())
  ));

  const setPageSize = useCallback(nextSize => {
    const normalized = normalizeSessionPageSize(nextSize);
    setPageSizeState(normalized);
    writeSessionListCustomPageSize(normalized);
  }, []);

  return {
    pageSize,
    setPageSize
  };
};

export default useSessionListEffectivePageSize;
