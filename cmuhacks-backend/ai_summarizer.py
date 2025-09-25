import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.messages import HumanMessage, SystemMessage
import re
import time

# --- Configuration ---
# Make sure to set your GOOGLE_API_KEY environment variable.
# You can get an API key from Google AI Studio: https://aistudio.google.com/app/apikey


# --- LLM Definition ---
# Note: The requested 'gemini-2.5-flash' is not yet available.
# This script uses 'gemini-1.5-flash', the latest available flash model from Google.
llm = ChatGoogleGenerativeAI(temperature=0.7, model="gemini-2.0-flash")
# A model with zero temperature is used for deterministic verification checks.
fast_llm = ChatGoogleGenerativeAI(temperature=0, model="gemini-2.0-flash")


# --- Agent 1: The Summarizer ---
TOKEN_LIMIT = 30000
# A smaller limit for individual chunks to ensure the map-reduce process is efficient.
CHUNK_TOKEN_LIMIT = 7000

def count_tokens(text: str, llm_instance: ChatGoogleGenerativeAI) -> int:
    """Counts the number of tokens in a string for a given Gemini model."""
    return llm_instance.get_num_tokens(text)

def chunk_text(text: str, token_limit: int, llm_instance: ChatGoogleGenerativeAI) -> list[str]:
    """Splits text into chunks that are under the token limit."""
    print(f"  -> Text is long. Chunking into pieces smaller than {token_limit} tokens...")
    paragraphs = text.split('\n\n')
    chunks = []
    current_chunk = ""
    for para in paragraphs:
        if count_tokens(current_chunk + para + "\n\n", llm_instance) <= token_limit:
            current_chunk += para + "\n\n"
        else:
            chunks.append(current_chunk.strip())
            current_chunk = para + "\n\n"
    if current_chunk:
        chunks.append(current_chunk.strip())
    print(f"  -> Split text into {len(chunks)} chunks.")
    return chunks

def map_reduce_summary(text_chunks: list[str], llm_instance: ChatGoogleGenerativeAI) -> str:
    """
    Summarizes a list of text chunks (map step) and then combines those
    summaries into a final summary (reduce step).
    """
    # MAP step: Summarize each chunk individually
    map_prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an expert academic summarizer. Summarize the following section of a research paper, extracting all key points, methods, and findings."),
        ("human", "Here is the section:\n---\n{chunk}\n---")
    ])
    map_chain = map_prompt | llm_instance | StrOutputParser()
    print("  -> Summarizing individual chunks (Map step)...")
    chunk_summaries = map_chain.batch([{"chunk": chunk} for chunk in text_chunks])
    print("  -> Finished summarizing chunks.")

    # REDUCE step: Combine the summaries into one
    combined_summary_text = "\n\n---\n\n".join(chunk_summaries)
    reduce_prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an expert academic editor. You have been given several summaries from different sections of the same research paper. Your task is to synthesize these into a single, comprehensive, and coherent summary of the entire paper. Ensure the final summary flows logically and captures the overarching narrative and key results of the research."),
        ("human", "Here are the summaries of the paper's sections:\n---\n{combined_summaries}\n---")
    ])
    reduce_chain = reduce_prompt | llm_instance | StrOutputParser()
    print("  -> Combining chunk summaries (Reduce step)...")
    final_summary = reduce_chain.invoke({"combined_summaries": combined_summary_text})
    print("  -> Finished combining summaries.")
    return final_summary


# --- Agent 1: The Summarizer ---
def generate_summary(paper_text: str, feedback: str = "") -> str:
    """
    Generates a four-paragraph summary of the paper.
    Optionally includes feedback from verifier agents to improve the summary.
    """
    try:
        feedback_instruction = (
            "Please regenerate the summary based on the following feedback:\n"
            f"--- FEEDBACK ---\n{feedback}\n--- END FEEDBACK ---"
            if feedback
            else "You are generating the first draft."
        )

        prompt = ChatPromptTemplate.from_messages([
            ("system",
             "You are an expert academic summarizer. Your task is to create a four-paragraph summary of a research paper. "
             "The summary must focus on the key points and most interesting results. "
             "Crucially, it must be written in a way that is clear and engaging for an average person with a slight interest in the topic. "
             "Avoid jargon where possible, and explain necessary technical terms simply."
            ),
            ("human",
             f"{feedback_instruction}\n\n"
             "Here is the paper text:\n"
             "--- PAPER TEXT ---\n{paper_text}\n--- END PAPER TEXT ---"
            )
        ])

        summarizer_chain = prompt | llm | StrOutputParser()
        print("✍️  Generating summary...")
        summary = summarizer_chain.invoke({"paper_text": paper_text})
    except Exception as e:
        print(f'An error occurred: {e}. Extending time and retrying...')
        time.sleep(40)
        summary = generate_summary(paper_text, feedback)

    return summary
def define_unclear_terms(term_text: str) -> str:
    """
    Identifies the most significant technical term in a given text snippet
    and generates a simple, easy-to-understand definition for it.

    Args:
        term_text: A snippet of text containing jargon or a technical term.

    Returns:
        A string containing a simple definition of the identified term.
    """
    print(f"🤔 Identifying and defining unclear term(s) in snippet: '{term_text[:70]}...'")
    try:
        # This prompt asks the LLM to both find the key term and define it.
        prompt = ChatPromptTemplate.from_messages([
            ("system",
             "You are an expert science communicator who specializes in making complex topics easy to understand. "
             "Your task is to analyze a short piece of text, identify the single most important technical term or piece of jargon that a non-expert would likely not understand, and then provide a very clear and simple definition for that term. "
             "Directly provide the definition without mentioning the term itself, as if you are seamlessly explaining it."),
            ("human",
             "Please identify the main technical term or phrase in the following text and provide an easy-to-understand definition for it.\n\n"
             "--- TEXT ---\n{text}\n--- END TEXT ---")
        ])

        # Create and invoke the LangChain chain
        define_chain = prompt | llm | StrOutputParser()
        definition = define_chain.invoke({"text": term_text})
        print(" -> Definition generated.")
        return definition

    except Exception as e:
        # Handle potential API errors and retry after a delay
        print(f'An error occurred while defining the term: {e}. Retrying after a delay...')
        time.sleep(30)
        return define_unclear_terms(term_text)
 

# --- Agent 2a: Content Reflection Verifier ---
def verify_reflection(paper_text: str, summary: str) -> str:
    """
    Verifies that the summary accurately reflects the paper's content.
    Returns 'OK' or a string with feedback for improvement.
    """
    try:
        prompt = ChatPromptTemplate.from_messages([
            ("system",
             "You are a verification agent. Your task is to determine if a given summary accurately reflects the key points, findings, and conclusions of the original research paper. "
             "If the summary is accurate and covers the essential aspects, respond with 'OK'. "
             "If the summary is inaccurate, misses key points, or misrepresents the findings, provide specific, constructive feedback on what needs to be changed to improve its accuracy. "
             "Do not be overly critical of minor omissions; focus on major discrepancies or missing core concepts."
            ),
            ("human",
             "--- ORIGINAL PAPER ---\n{paper_text}\n\n"
             "--- SUMMARY ---\n{summary}\n\n"
             "Does the summary accurately reflect the paper's content? If yes, say 'OK'. Otherwise, provide feedback."
            )
        ])
        verifier_chain = prompt | fast_llm | StrOutputParser()
        print("🔍  Verifying content reflection...")
        result = verifier_chain.invoke({"paper_text": paper_text, "summary": summary})
    except Exception as e:
        print(f'An error occurred: {e}. Extending time and retrying...')
        time.sleep(40)
        result = verify_reflection(paper_text, summary)
    return result


# --- Agent 2b: Readability Verifier ---
def verify_readability(summary: str) -> str:
    """
    Verifies that the summary is readable for a layperson.
    Returns 'OK' or a string with feedback for improvement.
    """
    try:
        prompt = ChatPromptTemplate.from_messages([
            ("system",
             "You are a verification agent focused on readability. Your task is to assess if a summary is easily understandable for an average person with a slight interest in the topic. "
             "The language should be clear, engaging, and largely free of unexplained jargon. "
             "If the summary meets this standard, respond with 'OK'. "
             "If the summary is too technical, uses dense jargon without explanation, or is otherwise difficult to read for a non-expert, provide specific feedback on how to make it more accessible."
            ),
            ("human",
             "--- SUMMARY ---\n{summary}\n\n"
             "Is this summary written in a way that an average person with a slight interest in the topic can understand it? If yes, say 'OK'. Otherwise, provide feedback."
            )
        ])
        verifier_chain = prompt | fast_llm | StrOutputParser()
        print("🧐  Verifying readability...")
        result = verifier_chain.invoke({"summary": summary})
    except Exception as e:
        print(f'An error occurred: {e}. Extending time and retrying...')
        time.sleep(40)
        result = verify_readability(summary)
    return result


# --- Main Application Logic (UPDATED) ---
def summarize_and_verify_paper(paper_text: str, max_retries: int = 3):
    """
    Orchestrates the summarization and verification process,
    handling long papers by pre-summarizing them.
    """
    # Pre-process the text if it's too long
    paper_text_for_summary = paper_text
    total_tokens = count_tokens(paper_text, llm)
    print(f"Total tokens in original paper: {total_tokens}")

    if total_tokens > TOKEN_LIMIT:
        print("Paper exceeds token limit. Starting map-reduce pre-summarization process...")
        chunks = chunk_text(paper_text, CHUNK_TOKEN_LIMIT, llm)
        paper_text_for_summary = map_reduce_summary(chunks, llm)
        print("\n✅ Pre-summarization complete. Starting main summarization and verification loop.")
    else:
        print("Paper is within token limit. Proceeding directly to summarization.")

    current_summary = ""
    feedback = ""
    attempts = 0

    while attempts < max_retries:
        attempts += 1
        print(f"\n--- Attempt {attempts} of {max_retries} ---")

        # 1. Generate summary using the (potentially pre-summarized) text
        current_summary = generate_summary(paper_text_for_summary, feedback)

        # 2. Verify summary against the ORIGINAL, full paper text
        reflection_result = verify_reflection(paper_text, current_summary)
        readability_result = verify_readability(current_summary)

        print(f"   - Reflection Check: {'OK' if 'OK' in reflection_result else 'Feedback Received'}")
        print(f"   - Readability Check: {'OK' if 'OK' in readability_result else 'Feedback Received'}")

        # 3. Check verification results
        if "OK" in reflection_result and "OK" in readability_result:
            print("\n✅ Summary approved by all verifiers!")

            # Final check for paragraph count
            paragraphs = [p for p in current_summary.split('\n') if p.strip()]
            if len(paragraphs) == 4:
                print("📄 Final check passed: Summary has four paragraphs.")
                return current_summary
            else:
                feedback = f"The content is good, but the summary must have exactly four paragraphs. The last version had {len(paragraphs)}."
                print("⚠️  Final check failed: Incorrect paragraph count. Regenerating.")
                continue  # Skip to next attempt

        # 4. Collect feedback for regeneration
        feedback_parts = []
        if "OK" not in reflection_result:
            feedback_parts.append(f"Content Reflection Feedback: {reflection_result}")
        if "OK" not in readability_result:
            feedback_parts.append(f"Readability Feedback: {readability_result}")
        feedback = "\n".join(feedback_parts)
        print("🔄 Verification failed. Regenerating summary with new feedback...")

    print(f"\n❌ Failed to generate a satisfactory summary after {max_retries} attempts.")
    return "Could not generate a verified summary. Please try again."


# if __name__ == '__main__':
#     # Example usage with a placeholder paper text.
#     # Replace this with the actual plaintext of a paper.
#     sample_paper_text = """
#     Abstract
#     The Transformer architecture has become the dominant model in Natural Language Processing. Its core innovation is the self-attention mechanism, which allows the model to weigh the importance of different words in the input sequence when processing a given word. This contrasts with previous recurrent models (RNNs) that processed words sequentially. We introduce a new variant, the "Reversible Transformer," which reduces memory usage during training by allowing activations to be recomputed from the next layer's activations, rather than being stored. This is achieved by designing each layer to be invertible. Our experiments show that the Reversible Transformer achieves comparable performance to the standard Transformer on machine translation tasks (WMT 2014 English-to-German) while significantly reducing memory consumption, enabling the training of deeper models on limited hardware.

#     Introduction
#     Scaling neural network models has been a consistent path to improved performance. However, model depth is often constrained by the memory available on hardware accelerators like GPUs. In standard architectures, the activations of each layer must be stored in memory to compute gradients during the backward pass (backpropagation). This memory cost scales linearly with the number of layers. For a model with N layers, we must store N sets of activations. This paper addresses this memory bottleneck.

#     Methods
#     The core idea is to make each layer of the Transformer invertible. A function f is invertible if there exists a function g such that g(f(x)) = x for all x. In our architecture, each block of layers is composed of two sub-layers, F and G. Given an input pair of activations (X1, X2), the output (Y1, Y2) is computed as Y1 = X1 + F(X2) and Y2 = X2 + G(Y1). This structure, known as a residual network, can be easily inverted. To recover the inputs (X1, X2) from the outputs (Y1, Y2), we can compute X2 = Y2 - G(Y1) and X1 = Y1 - F(X2). This means we don't need to store X1 and X2 during the forward pass; we can simply recompute them during the backward pass. We apply this principle to both the self-attention and feed-forward sub-layers of the Transformer.

#     Results and Conclusion
#     We evaluated our Reversible Transformer on the WMT 2014 English-to-German and English-to-French translation benchmarks. Our model achieved BLEU scores that were statistically indistinguishable from a baseline standard Transformer. However, the memory required to store activations was nearly constant with respect to the number of layers, whereas the baseline's memory usage grew linearly. This allowed us to train models up to twice as deep on a single GPU compared to the standard Transformer. In conclusion, the Reversible Transformer is an effective, memory-efficient alternative that can help democratize the training of very deep neural networks.
#     """

#     final_summary = summarize_and_verify_paper(sample_paper_text)

#     print("\n\n--- FINAL SUMMARY ---")
#     print(final_summary)