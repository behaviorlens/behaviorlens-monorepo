export const behaviorLensPlaybackSpeedStyles = `
  .rr-controller__btns .behaviorlens-playback-speed-button {
    display: none !important;
  }

  .behaviorlens-playback-speed {
    position: relative !important;
    display: inline-flex !important;
    align-items: center !important;
    width: 76px !important;
    height: 40px !important;
    margin-left: 4px !important;
    color: #374151 !important;
  }

  .behaviorlens-playback-speed::after {
    content: '' !important;
    position: absolute !important;
    right: 13px !important;
    top: 50% !important;
    width: 6px !important;
    height: 6px !important;
    border-right: 1.5px solid currentColor !important;
    border-bottom: 1.5px solid currentColor !important;
    transform: translateY(-70%) rotate(45deg) !important;
    pointer-events: none !important;
  }

  .behaviorlens-playback-speed select {
    width: 100% !important;
    height: 100% !important;
    appearance: none !important;
    border: none !important;
    border-radius: 8px !important;
    background: transparent !important;
    color: inherit !important;
    padding: 0 30px 0 12px !important;
    font: inherit !important;
    font-size: 13px !important;
    font-weight: 600 !important;
    cursor: pointer !important;
    transition: background-color 120ms ease, color 120ms ease !important;
  }

  .behaviorlens-playback-speed select:hover {
    background: #f1f3f5 !important;
  }

  .behaviorlens-playback-speed select:focus-visible {
    outline: 2px solid #1463ff !important;
    outline-offset: 2px !important;
  }
`;
