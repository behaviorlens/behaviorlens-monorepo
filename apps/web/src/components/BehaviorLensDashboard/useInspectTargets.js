import { useCallback, useState } from 'react';

// Inspect Mode's reveal state, kept in one hook so the workspace component
// stays readable.
//
// `targets` is the plain, serialisable list the stage reports after it has
// enumerated the reconstructed page; DOM nodes never enter React state.
// `requestedNodeId` is the rail asking the stage to select an element and
// bring it into view.
export const useInspectTargets = () => {
  const [targets, setTargets] = useState([]);
  const [showTargets, setShowTargets] = useState(true);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [requestedNodeId, setRequestedNodeId] = useState(null);

  const handleTargetsChange = useCallback(next => setTargets(next), []);
  // The stage clears the request as soon as it has applied it, so a rail
  // selection never keeps overriding what the reviewer points at afterwards.
  const clearRequest = useCallback(() => setRequestedNodeId(null), []);
  const reset = useCallback(() => {
    setTargets([]);
    setHoveredNodeId(null);
    setRequestedNodeId(null);
  }, []);

  return {
    clearRequest,
    handleTargetsChange,
    hoveredNodeId,
    requestedNodeId,
    reset,
    selectTarget: setRequestedNodeId,
    setHoveredNodeId,
    setShowTargets,
    showTargets,
    targets
  };
};

export default useInspectTargets;
