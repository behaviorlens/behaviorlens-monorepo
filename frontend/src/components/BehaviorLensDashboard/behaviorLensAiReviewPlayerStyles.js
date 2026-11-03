// Scoped rrweb-player overrides for ?embed=1&source=ai-review-dashboard only.
export const behaviorLensAiReviewPlayerStyles = `
  .behaviorlens-ai-review-embed {
    background: #ffffff !important;
  }

  .behaviorlens-ai-review-embed .rr-player {
    position: relative !important;
    float: none !important;
    display: flex !important;
    flex-direction: column !important;
    width: 100% !important;
    height: 100% !important;
    min-height: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
    box-shadow: none !important;
    border-radius: 0 !important;
  }

  .behaviorlens-ai-review-embed .rr-player__frame {
    flex: 1 1 auto !important;
    min-height: 0 !important;
    width: 100% !important;
    overflow: hidden !important;
  }

  /* One row: play | timeline | speed — btns wrapper is display:contents so children join the row. */
  .behaviorlens-ai-review-embed .rr-controller {
    position: relative !important;
    flex: 0 0 44px !important;
    width: calc(100% - 56px) !important;
    height: 44px !important;
    min-height: 44px !important;
    margin: 0 28px !important;
    display: flex !important;
    flex-direction: row !important;
    align-items: center !important;
    gap: 6px !important;
    padding: 0 8px !important;
    box-sizing: border-box !important;
    background: #ffffff !important;
    border-top: 1px solid #eceef1 !important;
  }

  .behaviorlens-ai-review-embed .rr-timeline {
    order: 2 !important;
    flex: 1 1 auto !important;
    min-width: 0 !important;
    width: auto !important;
    height: auto !important;
    margin: 0 !important;
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
  }

  .behaviorlens-ai-review-embed .rr-timeline__time {
    position: static !important;
    flex: 0 0 auto !important;
    min-width: 38px !important;
    font-size: 11px !important;
    line-height: 1 !important;
  }

  .behaviorlens-ai-review-embed .rr-progress {
    flex: 1 1 auto !important;
    min-width: 0 !important;
    margin: 0 !important;
  }

  .behaviorlens-ai-review-embed .rr-controller__btns {
    display: contents !important;
    margin: 0 !important;
  }

  .behaviorlens-ai-review-embed .rr-controller__btns > button:first-of-type {
    order: 1 !important;
    position: static !important;
    transform: none !important;
    flex: 0 0 32px !important;
    width: 32px !important;
    min-width: 32px !important;
    height: 32px !important;
    padding: 0 !important;
    margin: 0 !important;
    pointer-events: auto !important;
  }

  .behaviorlens-ai-review-embed .rr-controller__btns > button:first-of-type svg {
    width: 18px !important;
    height: 18px !important;
  }

  .behaviorlens-ai-review-embed .rr-controller__btns > button:not(:first-of-type):not(:last-of-type) {
    order: 3 !important;
    flex: 0 0 32px !important;
    width: 32px !important;
    min-width: 32px !important;
    height: 32px !important;
    padding: 0 !important;
    margin: 0 !important;
    pointer-events: auto !important;
  }

  .behaviorlens-ai-review-embed .rr-controller__btns > .behaviorlens-playback-speed {
    order: 3 !important;
    flex: 0 0 70px !important;
    width: 70px !important;
    height: 32px !important;
    margin: 0 !important;
  }

  .behaviorlens-ai-review-embed .behaviorlens-playback-speed select {
    height: 32px !important;
  }

  .behaviorlens-ai-review-embed .rr-controller__btns > button:last-child {
    position: fixed !important;
    top: 12px !important;
    right: 12px !important;
    transform: none !important;
    z-index: 10 !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    width: 40px !important;
    min-width: 40px !important;
    height: 40px !important;
    padding: 0 !important;
    margin: 0 !important;
    color: #344054 !important;
    background: rgba(255, 255, 255, 0.94) !important;
    border: 1px solid #d8e2f2 !important;
    box-shadow: 0 4px 12px rgba(16, 24, 40, 0.12) !important;
    pointer-events: auto !important;
  }

  .behaviorlens-ai-review-embed .rr-controller__btns > button:last-child:hover {
    color: #1463ff !important;
    border-color: #bcd0ff !important;
    background: #ffffff !important;
  }

  .behaviorlens-ai-review-embed .rr-controller__btns .switch,
  .behaviorlens-ai-review-embed .rr-controller__btns label,
  .behaviorlens-ai-review-embed .rr-controller__btns .label {
    display: none !important;
  }

  .behaviorlens-ai-review-embed .rr-player:fullscreen,
  .behaviorlens-ai-review-embed .rr-player:-webkit-full-screen {
    width: 100vw !important;
    height: 100vh !important;
    float: none !important;
    max-width: none !important;
    display: flex !important;
    flex-direction: column !important;
  }

  .behaviorlens-ai-review-embed .rr-player:fullscreen .rr-player__frame,
  .behaviorlens-ai-review-embed .rr-player:-webkit-full-screen .rr-player__frame {
    flex: 1 1 auto !important;
    min-height: 0 !important;
    width: 100% !important;
  }

  .behaviorlens-ai-review-embed .rr-player:fullscreen .rr-controller,
  .behaviorlens-ai-review-embed .rr-player:-webkit-full-screen .rr-controller {
    flex: 0 0 44px !important;
    width: 100% !important;
    margin: 0 !important;
    display: flex !important;
    flex-direction: row !important;
    align-items: center !important;
    padding: 0 16px !important;
  }

  .behaviorlens-ai-review-embed .rr-player:fullscreen .rr-controller__btns > button:last-child,
  .behaviorlens-ai-review-embed .rr-player:-webkit-full-screen .rr-controller__btns > button:last-child {
    position: fixed !important;
    top: 12px !important;
    right: 12px !important;
    z-index: 100 !important;
  }
`;
