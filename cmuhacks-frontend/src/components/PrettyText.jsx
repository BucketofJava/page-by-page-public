import React, { useState } from 'react';
import '../index.css'

// This is the main component for our application.
// It sets up the overall layout and renders the HighlightableText component.
export default function HighlightTextBox(props) {
  
  return (
    <div className="font-sans">
      <div className="w-full mx-auto">
        <HighlightableText text={props.text} />
      </div>
    </div>
  );
}

// This component displays a paragraph of text that can be highlighted.
// When the user selects text, it sends the selection to a backend for analysis and displays the result.
function HighlightableText(props) {
  require('dotenv').config()
  // 'highlightedText' state stores the currently selected text.
  const [highlightedText, setHighlightedText] = useState('');
  // 'apiResponse' stores the analysis from the backend.
  const [apiResponse, setApiResponse] = useState('');
  // 'isLoading' tracks the state of the backend request.
  const [isLoading, setIsLoading] = useState(false);
  // Controls mobile bottom drawer visibility
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  // Mobile drawer snap state and drag tracking
  const [drawerSnap, setDrawerSnap] = useState('half'); // 'half' | 'full'
  const [dragStartY, setDragStartY] = useState(null);
  const [dragCurrentY, setDragCurrentY] = useState(null);
  // Touch selection state (mobile)
  const [isTouchSelecting, setIsTouchSelecting] = useState(false);
  const [touchStartIdx, setTouchStartIdx] = useState(null);
  const [touchEndIdx, setTouchEndIdx] = useState(null);
  const backendURL = process.env.BACKEND_URL;

  /**
   * This function is triggered when the user releases the mouse button
   * over the paragraph. It expands the selection to full words and sends it to a backend API.
   */
  const handleTextHighlight = async () => {
    const selection = window.getSelection();

    // Exit if there's no selection or it's an empty click.
    if (!selection || selection.isCollapsed) {
      return;
    }
    
    // Get the range of the selection.
    const range = selection.getRangeAt(0);
    const { startContainer, startOffset, endContainer, endOffset } = range;

    // If selection spans multiple nodes (common now that words are wrapped),
    // use the browser's selection text directly.
    if (startContainer !== endContainer || startContainer.nodeType !== Node.TEXT_NODE) {
      const selectedTextMulti = selection.toString().trim();
      if (!selectedTextMulti) {
        return;
      }
      setHighlightedText(selectedTextMulti);
      setIsLoading(true);
      setApiResponse('');
      try {
        const response = await fetch(`${backendURL}/prompt_about_text`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: selectedTextMulti }),
        });
        if (!response.ok) {
          throw new Error(`Network response was not ok, status: ${response.status}`);
        }
        const data = await response.json();
        setApiResponse(data.explanation || 'The backend did not provide an analysis.');
      } catch (error) {
        console.error('Failed to fetch analysis:', error);
        setApiResponse('Sorry, an error occurred while trying to get the analysis.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    const fullText = startContainer.textContent;
    let newStartOffset = startOffset;
    let newEndOffset = endOffset;

    // Expand the selection to the left to find the start of the word.
    // It moves backwards from the start of the highlight until it hits a non-word character.
    while (newStartOffset > 0 && /\w/.test(fullText[newStartOffset - 1])) {
      newStartOffset--;
    }

    // Expand the selection to the right to find the end of the word.
    // It moves forwards from the end of the highlight until it hits a non-word character.
    while (newEndOffset < fullText.length && /\w/.test(fullText[newEndOffset])) {
      newEndOffset++;
    }

    // Create a new range that covers the full words.
    const newRange = document.createRange();
    newRange.setStart(startContainer, newStartOffset);
    newRange.setEnd(endContainer, newEndOffset);

    // Replace the user's partial selection with our new full-word selection.
    selection.removeAllRanges();
    selection.addRange(newRange);
    
    const selectedText = selection.toString().trim();

    // We only proceed if the user has actually selected some text.
    if (selectedText) {
      setHighlightedText(selectedText);
      setIsLoading(true);
      setApiResponse(''); // Clear any previous response
      setIsDrawerOpen(true); // Open drawer on mobile when new selection happens
      setDrawerSnap('half'); // default snap when opening

      try {
        // NOTE: Replace '/api/prompt_about_text' with your actual backend endpoint.
        const response = await fetch(`${backendURL}/prompt_about_text`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: selectedText }),
        });

        if (!response.ok) {
          throw new Error(`Network response was not ok, status: ${response.status}`);
        }

        const data = await response.json();
        setApiResponse(data.explanation || 'The backend did not provide an analysis.');

      } catch (error) {
        console.error("Failed to fetch analysis:", error);
        setApiResponse('Sorry, an error occurred while trying to get the analysis.');
      } finally {
        setIsLoading(false); // Stop loading regardless of outcome
      }
    }
  };

  const hasDefinitionContent = Boolean(highlightedText || isLoading || apiResponse);

  // Drag helpers for mobile drawer
  const startDrag = (clientY) => {
    setDragStartY(clientY);
    setDragCurrentY(clientY);
  };
  const updateDrag = (clientY) => {
    if (dragStartY !== null) {
      setDragCurrentY(clientY);
    }
  };
  const endDrag = () => {
    if (dragStartY === null || dragCurrentY === null) {
      setDragStartY(null);
      setDragCurrentY(null);
      return;
    }
    const delta = dragCurrentY - dragStartY; // positive = drag down
    if (delta < -50) {
      // drag up -> expand to full
      setDrawerSnap('full');
      setIsDrawerOpen(true);
    } else if (delta > 120) {
      // drag down
      if (drawerSnap === 'full') {
        setDrawerSnap('half');
        setIsDrawerOpen(true);
      } else {
        setIsDrawerOpen(false);
      }
    }
    setDragStartY(null);
    setDragCurrentY(null);
  };

  const handleHandleClick = () => {
    if (!isDrawerOpen) {
      setIsDrawerOpen(true);
      setDrawerSnap('half');
      return;
    }
    setDrawerSnap(prev => (prev === 'half' ? 'full' : 'half'));
  };

  // Utility: get display text without <p> tags used by source
  const displayText = `${`${props.text}`.substring(3, props.text.length-4)}`;
  // Tokenize by preserving spaces
  const tokens = displayText.split(/(\s+)/);

  // Helper to fetch and display definition for a given selected text
  const fetchDefinitionFor = async (selected) => {
    if (!selected) return;
    setHighlightedText(selected);
    setApiResponse('');
    setIsLoading(true);
    setIsDrawerOpen(true);
    setDrawerSnap('half');
    try {
      const response = await fetch(`${backendURL}/prompt_about_text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: selected })
      });
      if (!response.ok) throw new Error(`Network response was not ok, status: ${response.status}`);
      const data = await response.json();
      setApiResponse(data.explanation || 'The backend did not provide an analysis.');
    } catch (error) {
      console.error('Failed to fetch analysis:', error);
      setApiResponse('Sorry, an error occurred while trying to get the analysis.');
    } finally {
      setIsLoading(false);
    }
  };

  // Touch selection handlers (mobile tap-drag)
  const findWordIdxAtPoint = (clientX, clientY) => {
    const el = document.elementFromPoint(clientX, clientY);
    if (!el) return null;
    const span = el.closest ? el.closest('.selectable-word') : null;
    if (!span) return null;
    const idxAttr = span.getAttribute('data-idx');
    return idxAttr ? parseInt(idxAttr, 10) : null;
  };

  const onTouchStartSelect = (e) => {
    if (!e.touches || e.touches.length === 0) return;
    const t = e.touches[0];
    const idx = findWordIdxAtPoint(t.clientX, t.clientY);
    if (idx !== null) {
      e.preventDefault();
      setIsTouchSelecting(true);
      setTouchStartIdx(idx);
      setTouchEndIdx(idx);
    }
  };

  const onTouchMoveSelect = (e) => {
    if (!isTouchSelecting) return;
    const t = e.touches && e.touches[0];
    if (!t) return;
    const idx = findWordIdxAtPoint(t.clientX, t.clientY);
    if (idx !== null) {
      e.preventDefault();
      setTouchEndIdx(idx);
    }
  };

  const onTouchEndSelect = () => {
    if (!isTouchSelecting) return;
    setIsTouchSelecting(false);
    if (touchStartIdx === null || touchEndIdx === null) return;
    const start = Math.min(touchStartIdx, touchEndIdx);
    const end = Math.max(touchStartIdx, touchEndIdx);
    const selected = tokens.slice(start, end + 1).join('').trim();
    if (selected) {
      fetchDefinitionFor(selected);
    }
  };

  // Alternative mobile selection using browser selection API
  const handleMobileSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;
    
    const selectedText = selection.toString().trim();
    if (selectedText) {
      fetchDefinitionFor(selectedText);
    }
  };

  return (
    <div className="lg:grid lg:grid-cols-12 lg:gap-8 space-y-6 lg:space-y-0">
      {/* Left: Summary / Reader */}
      <div className="lg:col-span-7 xl:col-span-7 2xl:col-span-7">
        <div className="px-1 sm:px-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-sky-700 via-sky-600 to-orange-500 bg-clip-text text-transparent mb-3">
            Summary
          </h1>
          <div className="prose max-w-none">
            <div
              onMouseUp={handleTextHighlight}
              onTouchStart={onTouchStartSelect}
              onTouchMove={onTouchMoveSelect}
              onTouchEnd={onTouchEndSelect}
              onTouchEndCapture={handleMobileSelection}
              className="font-serif text-slate-800 text-lg sm:text-xl leading-relaxed selection:bg-sky-200 selection:text-sky-900 cursor-text max-h-[60vh] lg:max-h-[72vh] overflow-auto pr-1 tracking-wide"
            >
              {tokens.map((tok, i) => {
                const isSpace = /^\s+$/.test(tok);
                const inTouchRange = isTouchSelecting && touchStartIdx !== null && touchEndIdx !== null && i >= Math.min(touchStartIdx, touchEndIdx) && i <= Math.max(touchStartIdx, touchEndIdx);
                if (isSpace) {
                  return tok;
                }
                return (
                  <span
                    key={i}
                    data-idx={i}
                    className={`selectable-word ${inTouchRange ? 'bg-sky-200 text-sky-900 rounded-sm' : ''}`}
                    style={{ padding: '0 1px' }}
                  >
                    {tok}
                  </span>
                );
              })}
            </div>
          </div>
          <div className="mt-3 text-sm text-slate-500">
            Tip: Select any term to see a definition on the right.
          </div>
        </div>
      </div>

      {/* Right: Definition panel (sticky on large screens) */}
      <div className="lg:col-span-5 xl:col-span-5 2xl:col-span-5 lg:col-start-8 xl:col-start-8 2xl:col-start-8">
        <div className="hidden lg:block lg:sticky lg:top-6">
          <div className="border-l border-slate-200 pl-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-slate-700">Definition</h2>
              {(highlightedText || isLoading || apiResponse) ? (
                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">Contextual</span>
              ) : null}
            </div>
            <div className="max-h-[72vh] overflow-auto pr-1">
              {highlightedText ? (
                <p className="text-slate-600 text-base italic mb-3">"{highlightedText}"</p>
              ) : (
                <p className="text-slate-400 text-base mb-3">Highlight a term to view its definition.</p>
              )}
              {isLoading ? (
                <div className="flex items-center gap-2 text-sky-800">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sky-600" role="status">
                    <span className="sr-only">Loading...</span>
                  </div>
                  <span className="text-base font-medium">Analyzing…</span>
                </div>
              ) : (
                <p className="text-slate-800 text-base whitespace-pre-line">
                  {apiResponse || ''}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: Bottom drawer for definition panel */}
      {/* Backdrop */}
      <div
        className={`lg:hidden fixed inset-0 bg-black/30 z-30 transition-opacity ${hasDefinitionContent && isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsDrawerOpen(false)}
      ></div>

      {/* Drawer */}
      <div
        className={`lg:hidden fixed inset-x-0 bottom-0 z-40 transform transition-transform duration-300`}
        style={{
          transform: (hasDefinitionContent && isDrawerOpen)
            ? `translateY(${Math.max(0, (dragStartY !== null && dragCurrentY !== null) ? (dragCurrentY - dragStartY) : 0)}px)`
            : 'translateY(100%)'
        }}
      >
        <div
          className="bg-white border-t border-slate-200 rounded-t-2xl shadow-2xl"
          style={{ height: drawerSnap === 'full' ? '90vh' : '50vh' }}
        >
          <div
            className="px-6 pt-3 pb-4 border-b border-slate-200"
            onMouseDown={(e) => startDrag(e.clientY)}
            onMouseMove={(e) => { if (dragStartY !== null) { e.preventDefault(); updateDrag(e.clientY); } }}
            onMouseUp={endDrag}
            onMouseLeave={endDrag}
            onTouchStart={(e) => startDrag(e.touches[0].clientY)}
            onTouchMove={(e) => { e.preventDefault(); updateDrag(e.touches[0].clientY); }}
            onTouchEnd={endDrag}
          >
            <button
              type="button"
              className="mx-auto block h-1 w-10 rounded-full bg-slate-300 mb-3"
              onClick={handleHandleClick}
            ></button>
            <div className="flex items-center justify-between select-none">
              <h2 className="text-base font-semibold text-slate-800">Definition</h2>
              <button
                className="text-slate-600 hover:text-slate-800 text-sm"
                onClick={() => setIsDrawerOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
          <div className="px-6 py-5 overflow-auto" style={{ maxHeight: drawerSnap === 'full' ? 'calc(90vh - 64px)' : 'calc(50vh - 64px)' }}>
            {highlightedText ? (
              <div className="mb-4">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <p className="text-slate-800 text-base italic">"{highlightedText}"</p>
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <p className="text-slate-500 text-sm">Highlight a word or phrase to view its definition here.</p>
                </div>
              </div>
            )}

            <div className="rounded-xl p-5 border"
                 style={{
                   background: "linear-gradient(180deg, #F0F9FF 0%, #FFF7ED 100%)",
                   borderColor: "#dbeafe"}}
            >
              {isLoading ? (
                <div className="flex items-center gap-3 text-sky-800">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sky-600" role="status">
                    <span className="sr-only">Loading...</span>
                  </div>
                  <span className="font-medium">Analyzing text…</span>
                </div>
              ) : (
                <p className="text-slate-800 text-base whitespace-pre-line">
                  {apiResponse || 'No definition yet.'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating open button when content exists and drawer closed */}
      {hasDefinitionContent && !isDrawerOpen && (
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="lg:hidden fixed bottom-4 right-4 z-40 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-full shadow-lg border border-sky-700"
        >
          Definition
        </button>
      )}
    </div>
  );
}