import arxiv
import datetime
import math
import time
import fitz
import requests
import os
from ai_summarizer import summarize_and_verify_paper
RECENT_DAYS=3
ALPHA=1
BETA=2
PAPERS_PER_CAT=15
pdf_dir = "arxiv_pdfs"
if not os.path.exists(pdf_dir):
    os.makedirs(pdf_dir)
def get_recent_top(subject):
    recent_papers=fetch_recent(subject)
    filtered_papers, texts=get_top_papers_from_authors(recent_papers)
    summaries=[summarize_and_verify_paper(paper) for paper in texts]
    
    return [paper.title+" "+paper.summary for paper in filtered_papers], [paper.title for paper in filtered_papers], [paper.pdf_url for paper in filtered_papers], summaries
def fetch_recent(subject):
    client = arxiv.Client()
    # 2. Calculate the start date and format it for the API query.
    start_date = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=RECENT_DAYS)
    start_date_str = start_date.strftime('%Y%m%d000000') # Format: YYYYMMDDHHMMSS
    end_date_str=datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%d000000')
    print(f"Running a direct query for papers in '{subject}' submitted since {start_date.date()}...\n")
    # 3. Construct a Search object with the category and date range.
    # The query itself remains the same.
    query = f"cat:{subject} AND submittedDate:[{start_date_str} TO {end_date_str}]"
    print(query)

    search = arxiv.Search(
    query=query,
    max_results=PAPERS_PER_CAT,
    sort_by=arxiv.SortCriterion.SubmittedDate,
    sort_order=arxiv.SortOrder.Descending
    )

    # 4. Use the client to execute the search and get the results.
    # This is the corrected line: client.results(search)
    papers_found = False
    papers=list(client.results(search))
    for result in papers:
        papers_found = True
        print(f"📄 Title: {result.title}")

        author_names = ', '.join([author.name for author in result.authors])
        print(f"👥 Authors: {author_names}")
        print(f"🔗 Link: {result.pdf_url}")
        print("-" * 20) # Separator for readability

    if not papers_found:
        print(f"No new papers found matching the query.")
    return papers
def compute_author_prestige(h_index, citation_total):
    return ALPHA*h_index+BETA*math.log(citation_total+1)
def get_top_papers_from_authors(recent_articles):
     stats=[]
     print(len(list(recent_articles)))
     for paper in recent_articles:
        h_indices=[]
        citationses=[]
        authors=list(paper.authors)
        for i in range(len(authors)):
            if(i>0 and i<len(authors)-1):
                continue
            author=authors[i]
            author_name = author.name
            print(f"   👤 Querying for author: {author_name}")

            try:
                # --- Construct the API Request ---
                # We will use the author search endpoint.
                # API Docs: https://www.semanticscholar.org/product/api
                api_url = 'https://api.semanticscholar.org/graph/v1/author/search'
                
                # Define the query parameters
                params = {
                    'query': author_name,
                    # Request the fields we care about
                    'fields': 'name,hIndex,citationCount,url'
                }
                
                # Make the GET request
                response = requests.get(api_url, params=params)
                response.raise_for_status() # Raise an exception for bad status codes (4xx or 5xx)

                data = response.json()
                # --- Process the Response ---
                # The API returns a list of potential authors. We'll take the first one.
                # This is a "best guess" as names can be ambiguous.
                if data.get('data') and len(data['data']) > 0:
                    author_profile = data['data'][0]
                    
                    # Safely get the values, providing 'N/A' as a default
                    s2_name = author_profile.get('name', 'N/A')
                    h_index = author_profile.get('hIndex', 'N/A')
                    citations = author_profile.get('citationCount', 'N/A')
                    profile_url = author_profile.get('url', 'N/A')
                    h_indices.append(h_index)
                    citationses.append(citations)
                    
                    print(f"     ✅ Found Profile: {s2_name}")
                    print(f"        H-Index: {h_index}")
                    print(f"        Total Citations: {citations}")
                    print(f"        Profile URL: {profile_url}\n")
                else:
                    print(f"     ❌ Could not find a Semantic Scholar profile for {author_name}.\n")
            except requests.exceptions.RequestException as e:
                print(f"     ❗️ An error occurred while calling the API for {author_name}: {e}\n")
            except Exception as e:
                print(f"     ❗️ An unexpected error occurred for {author_name}: {e}\n")
            time.sleep(1) 
        if(len(h_indices)==0 or len(citationses)==0):
                stats.append((0, 0))
                continue;
        stats.append((max(h_indices), max(citationses)))
     print(stats)
     computed_stats=[compute_author_prestige(s[0], s[1]) for s in stats]
     computed_stats.sort()
     print(max(-50, (-1*len(computed_stats))+1))
     cutoff=computed_stats[max(-50, (-1*len(computed_stats))+1)]
     filtered_papers=[]
     texts=[]
     for i in range(len(recent_articles)):
         if(computed_stats[i]>=cutoff):
             paper=recent_articles[i]
             try:
                # --- Print Paper Metadata ---
                print(f"📄 Title: {paper.title}")
                print(f"   ID: {paper.entry_id}")
                # Get the first author
                first_author = paper.authors[0]
                print(f"   Author: {first_author}")
                
                # --- Download the PDF ---
                # The download function saves the file and returns the path.
                pdf_path = paper.download_pdf(dirpath=pdf_dir)
                print(f"   ✅ PDF downloaded to: {pdf_path}")

                # --- 3. Extract Full Text from the PDF ---
                doc = fitz.open(pdf_path) # Open the PDF file.
                
                # Join the text from all pages into a single string.
                full_paper_text = "".join(page.get_text("text") for page in doc)
                
                # Append the extracted full text to the 'texts' list.
                texts.append(full_paper_text)
                filtered_papers.append(paper)
                
                print(f"   ✔️ Full text extracted ({len(full_paper_text)} chars) and appended.")
                
                doc.close() # Close the document.
             except Exception as e:
                print(f"   ❌ An error occurred for paper {paper.entry_id}: {e}")
     return filtered_papers, texts

            # Be a good API citizen: add a small delay between requests