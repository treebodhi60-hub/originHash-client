import { useEffect, useRef } from 'react';
import api from '../api/axios';

export const rollBackScan = (scanId) =>
  api.patch(`/scans/${scanId}`, { result: 'ROLLED_BACK' }).catch(() => {
    // Best effort: an unanswered verification just stays PENDING.
  });

// Marks an open verification ROLLED_BACK when the page is left without an answer — the back
// button, the nav bar, anything that unmounts it. `openScanIdRef.current` holds the open scan's
// id; set it to null once the scan is answered or handed to another screen.
// The rollback waits a tick so React's development-only StrictMode remount doesn't trigger it.
const useRollbackOnLeave = (openScanIdRef) => {
  const timerRef = useRef(null);

  useEffect(() => {
    clearTimeout(timerRef.current);
    return () => {
      timerRef.current = setTimeout(() => {
        if (openScanIdRef.current) rollBackScan(openScanIdRef.current);
      }, 0);
    };
  }, [openScanIdRef]);
};

export default useRollbackOnLeave;
