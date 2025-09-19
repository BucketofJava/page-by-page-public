import React, { useState } from 'react';

// This is the main component for our application.
// It sets up the overall layout and renders the HighlightableText component.
export default function HighlightTextBox(props) {
  return (
    // A subtle gradient background adds depth and a more premium feel.
    <div className="bg-gradient-to-br from-slate-50 to-gray-200 font-sans flex items-center justify-center min-h-screen">
      <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 md:p-8">
        <HighlightableText text={props.text} />
      </div>
    </div>
  );
}

// This component displays a paragraph of text that can be highlighted.
// When the user selects text, it sends the selection to a backend for analysis and displays the result.
function HighlightableText(props) {
  // 'highlightedText' state stores the currently selected text.
  const [highlightedText, setHighlightedText] = useState('');
  // 'apiResponse' stores the analysis from the backend.
  const [apiResponse, setApiResponse] = useState('');
  // 'isLoading' tracks the state of the backend request.
  const [isLoading, setIsLoading] = useState(false);
  const backendURL = "backend_url";

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

    // This logic works best for selections within a single text node.
    // It ignores complex selections across multiple HTML elements.
    if (startContainer !== endContainer || startContainer.nodeType !== Node.TEXT_NODE) {
      // Clear previous selection if the new one is invalid
      setHighlightedText('');
      setApiResponse('');
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

  return (
    // Increased padding and a more pronounced shadow give the card a floating effect.
    <div className="bg-white rounded-2xl shadow-2xl p-8 sm:p-12 space-y-8">
      {/* Larger, bolder text with a thicker, light gray underline for a strong title. */}
      <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-800 border-b-2 border-slate-200 pb-5">
        Highlight for Analysis
      </h1>
      <p
        onMouseUp={handleTextHighlight}
        // Serif font for readability, larger text size, and increased line spacing.
        className="font-serif text-slate-700 text-xl sm:text-2xl leading-loose selection:bg-sky-200 selection:text-sky-900 cursor-pointer"
       >
       {`${`${props.text}`.substring(3, props.text.length-4)}`}
      </p>

      {/* This section will only appear if there is highlighted text. */}
      {highlightedText && (
        <div className="pt-8 border-t border-slate-200">
          <h2 className="text-2xl font-bold text-slate-700 mb-4">You Selected:</h2>
          <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
            {/* Added a stylish, wavy underline for a decorative touch. */}
            <p className="text-slate-800 text-lg italic underline decoration-wavy decoration-sky-300 underline-offset-4">
              "{highlightedText}"
            </p>
          </div>
        </div>
      )}

      {/* This section shows a loading spinner during the API call and then displays the response. */}
      {(isLoading || apiResponse) && (
        <div className="pt-8 border-t border-slate-200">
          <h2 className="text-2xl font-bold text-slate-700 mb-4">
            {isLoading ? 'Analyzing Text...' : 'Definition:'}
          </h2>
          {/* A soft blue background matches the highlight color, creating a cohesive theme. */}
          <div className="bg-sky-50 p-8 rounded-lg min-h-[12rem] flex items-center justify-center transition-all duration-300 border border-sky-100">
            {isLoading ? (
              // A larger spinner for better visibility.
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600" role="status">
                <span className="sr-only">Loading...</span>
              </div>
            ) : (
              <p className="text-lg text-slate-800">{apiResponse}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}