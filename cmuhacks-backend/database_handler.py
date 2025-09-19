import psycopg2
from pgvector.psycopg2 import register_vector
import numpy as np
from sentence_transformers import SentenceTransformer
model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
print("Model loaded.")

def get_db_connection():
    try:
        conn = psycopg2.connect(
            dbname="postgres",
            user="<username>",
            password="<password>",
            host="paper-database.c5wk0s4e80wd.us-east-2.rds.amazonaws.com",
            port="5432" # Default port
        )
        return conn
    except Exception as e:
        print(f"Error connecting to the database: {e}")
        # Gradio can't handle exceptions well during app startup, so we raise it
        # to make it clear in the logs that the connection failed.
def add_user_to_db(username, password, email):
    """
    Adds a new user to the 'users' table with a hashed password.

    Args:
        username: The username for the new user. Also used as the user_id.
        password: The user's password (will be hashed before storing).
        email: The user's email address.

    Returns:
        The user_id of the newly created user, or None if an error occurred.
    """
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # It's crucial to hash passwords before storing them for security.
       # hashed_password = hashlib.sha256(password.encode()).hexdigest()

        # Assuming user_id is the same as the username for simplicity.
        # The embedding is not set upon creation and will be NULL by default if the column allows it.
        cur.execute(
            "INSERT INTO users (username, password, email) VALUES (%s, %s, %s, %s)",
            (username, password, email)
        )

        conn.commit()
        cur.close()
        print(f"User '{username}' added successfully.")
        return username
    except Exception as e:
        if conn:
            conn.rollback()  # Roll back the transaction on error
        print(f"An error occurred in add_user_to_db: {e}")
        return None
    finally:
        if conn is not None:
            conn.close()
def get_user_vector(user_id):
    """
    Retrieves the embedding vector for a specific user from the 'users' table.

    Args:
        user_id: The ID of the user whose vector is to be retrieved.

    Returns:
        A numpy array representing the user's embedding vector, or None if the user is not found.
    """
    conn = None
    try:
        conn = get_db_connection()
        register_vector(conn)
        cur = conn.cursor()
        cur.execute("SELECT embedding FROM users WHERE id = %s", (user_id,))
        result = cur.fetchone()
        print(result)
        cur.close()
        if result:
            print(result[0])
            return result[0]
        else:
            print(f"No user found with user_id: {user_id}")
            return None
    except Exception as e:
        print(f"An error occurred in get_user_vector: {e}")
        return None
    finally:
        print('did the finally lol')
        if conn is not None:
            conn.close()

def get_article_vector(article_id):
    """
    Retrieves the embedding vector for a specific article from the 'papers' table.

    Args:
        article_id: The ID of the article whose vector is to be retrieved.

    Returns:
        A numpy array representing the article's embedding vector, or None if the article is not found.
    """
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        register_vector(conn)
        cur.execute("SELECT embedding FROM papers WHERE id = %s", (article_id,))
        result = cur.fetchone()
        print(type(result[0]))
        cur.close()
        if result:
            return result[0]
        else:
            print(f"No article found with article_id: {article_id}")
            return None
    except Exception as e:
        print(f"An error occurred in get_article_vector: {e}")
        return None
    finally:
        if conn is not None:
            conn.close()

def get_paper_body(article_id):
    """
    Retrieves the HTML content for a specific article from the 'papers' table.

    Args:
        article_id: The ID of the article whose HTML body is to be retrieved.

    Returns:
        A string containing the HTML content of the paper, or None if the article is not found.
    """
    conn = None
    print('running')
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT html_string, arxiv_link FROM papers WHERE id = %s", (article_id,))
        result = cur.fetchone()
        print(result)
        cur.close()
        if result:
            return result
        else:
            print(f"No paper body found with article_id: {article_id}")
            return None
    except Exception as e:
        print(f"An error occurred in get_paper_body: {e}")
        return None
    finally:
        if conn is not None:
            conn.close()
def get_paper_title(article_id):
    """
    Retrieves the HTML content for a specific article from the 'papers' table.

    Args:
        article_id: The ID of the article whose HTML body is to be retrieved.

    Returns:
        A string containing the HTML content of the paper, or None if the article is not found.
    """
    conn = None
    print('running')
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT title FROM papers WHERE id = %s", (article_id,))
        result = cur.fetchone()
        print(result)
        cur.close()
        if result:
            return result[0]
        else:
            print(f"No paper body found with article_id: {article_id}")
            return None
    except Exception as e:
        print(f"An error occurred in get_paper_body: {e}")
        return None
    finally:
        if conn is not None:
            conn.close()
def get_early_paper_summary(article_id):
    """
    Retrieves the HTML content for a specific article from the 'papers' table.

    Args:
        article_id: The ID of the article whose HTML body is to be retrieved.

    Returns:
        A string containing the HTML content of the paper, or None if the article is not found.
    """
    conn = None
    print('running')
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT html_string FROM papers WHERE id = %s", (article_id,))
        result = cur.fetchone()
        print(result)
        cur.close()
        if result:
            return result[0][3:120]+'...'
        else:
            print(f"No paper body found with article_id: {article_id}")
            return None
    except Exception as e:
        print(f"An error occurred in get_paper_body: {e}")
        return None
    finally:
        if conn is not None:
            conn.close()
def get_complete_paper_summary(article_id):
    """
    Retrieves the HTML content for a specific article from the 'papers' table.

    Args:
        article_id: The ID of the article whose HTML body is to be retrieved.

    Returns:
        A string containing the HTML content of the paper, or None if the article is not found.
    """
    conn = None
    print('running')
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT title, html_string FROM papers WHERE id = %s", (article_id,))
        result = cur.fetchone()
        print(result)
        cur.close()
        if result:
            print("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%RESULTPRINTING%%%%%%%%%%%%%%%%%%%%%%%%%%%")
            print(result)
            print("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%")
            return result
        else:
            print(f"No paper body found with article_id: {article_id}")
            return None
    except Exception as e:
        print(f"An error occurred in get_paper_body: {e}")
        return None
    finally:
        if conn is not None:
            conn.close()
def add_paper(title: str, title_real, paper_body: str):
    """
    Generates an embedding for a paper title and stores it in the database.
    """
    if not title:
        return "Error: Paper title cannot be empty."
    
    # Generate the embedding
    embedding = model.encode(title)
    print(embedding.shape)
    # For demo, generate a random category vector (e.g., for 10 categories)
    num_categories = 10
    categories = np.random.randint(0, 2, num_categories).tolist()

    # Store in the database
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO papers (title, html_string, arxiv_link, liked_count, embedding, categories) VALUES (%s, %s, %s, %s, %s, %s)",
                (title_real, paper_body, arxiv_link, 0, embedding.tolist(), categories)
            )
            conn.commit()
        conn.close()
        return f"Successfully added paper: '{title}'"
    except Exception as e:
        print(e)
        return f"Error adding paper to DB: {e}"

def update_user(id, current, new, gamma: float = 0.8):
    """
    Calculates a time-weighted average of a user's read history vectors.
    Input `history` is a list of vectors (as lists or np.arrays).
    The list is assumed to be ordered from OLDEST to NEWEST.
    """
    # if not history or not isinstance(history, list):
    #     return "Error: History must be a non-empty list of vectors."
        
    # Convert all vectors to numpy arrays
    # history_vectors = [np.array(vec) for vec, like_status in history]
    
    # if not history_vectors:
    #     return "Error: No valid vectors found in history."
        
    # Simple time-weighted average (exponential decay)
    # The most recent item has the highest weight.
    # current_vector = np.zeros_like(history_vectors[0], dtype=np.float32)
    # for vec in history_vectors:
    #     current_vector = (1 - gamma) * current_vector + gamma * vec
        

    try:
        finalv=(np.array(current)*0.8+np.array(new)).tolist()
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE users SET embedding = %s WHERE id = %s", (finalv, id)
            )
            conn.commit()
        conn.close()
    except Exception as e:
        print(e)
        return f"Error adding paper to DB: {e}"
    return finalv


def recommend(user_embedding: list, category_preferences: list, top_n: int = 5):
    """
    Recommends papers by finding the nearest neighbors in the vector DB.
    """
    try:
        user_vec = np.array(user_embedding)
    except:
        return "ERRORROROR"
    try:
        conn = get_db_connection()
        register_vector(conn) # Register the vector type handler
        with conn.cursor() as cur:
            # Query for the closest papers using cosine distance (<=>)
            # This is the core pgvector operation.
            cur.execute(
                "SELECT id FROM papers ORDER BY embedding <=> %s LIMIT %s",
                (user_vec, top_n)
            )
            results = cur.fetchall()
        conn.close()
        
        # TODO: Add re-ranking based on category_preferences
        # For example, you could fetch more results (e.g., 50) and then
        # re-rank them based on how well their categories match the user's preferences.
        
        recommended_titles = [row[0] for row in results]
        return recommended_titles
    except Exception as e:
        return f"Error during recommendation: {e}"
def recommend_random(user_embedding: list, category_preferences: list, top_n: int = 10):
    """
    Recommends papers by finding the nearest neighbors in the vector DB.
    """
    try:
        user_vec = np.array(user_embedding)
    except:
        pass
    try:
        conn = get_db_connection()
        register_vector(conn) # Register the vector type handler
        print('safe')
        with conn.cursor() as cur:
            # Query for the closest papers using cosine distance (<=>)
            # This is the core pgvector operation.
            cur.execute(
                "SELECT id FROM papers ORDER BY RANDOM() LIMIT %s",
                (top_n,)
            )
            print('safe')
            results = cur.fetchall()
            print(results)
        conn.close()
        
        # TODO: Add re-ranking based on category_preferences
        # For example, you could fetch more results (e.g., 50) and then
        # re-rank them based on how well their categories match the user's preferences.
        
        recommended_titles = [row[0] for row in results]
        return recommended_titles
    except Exception as e:
        print(e)
        return f"Error during recommendation: {e}"
def recommend_page(user_embedding: list, category_preferences: list, start_index: int, end_index: int):
    """
    Recommends papers by finding the nearest neighbors in the vector DB,
    supporting pagination with a start and end index.
    
    Args:
        user_embedding: The vector embedding of the user's preferences.
        category_preferences: A list of preferred categories for future re-ranking.
        start_index: The starting index (offset) of the papers to retrieve.
        end_index: The ending index of the papers to retrieve.
        
    Returns:
        A list of recommended paper IDs or a dictionary with an error message.
    """
    # 1. Validate inputs and calculate pagination
    if not isinstance(start_index, int) or not isinstance(end_index, int) or start_index < 0 or end_index <= start_index:
        print('cringecringe')
        return {"error": "Invalid start or end index provided."}
        
    limit = end_index - start_index
    offset = start_index

    try:
        user_vec = np.array(user_embedding, dtype=np.float32)
    except Exception:
        print('oops')
        return {"error": "Invalid user embedding format."}

    try:
        conn = get_db_connection()
        register_vector(conn)
        with conn.cursor() as cur:
            # 2. Update the SQL query to include OFFSET for pagination
            sql_query = "SELECT id FROM papers ORDER BY embedding <=> %s LIMIT %s OFFSET %s"
            
            # 3. Pass the new limit and offset parameters to the query
            query_params = (user_vec, limit, offset)
            
            cur.execute(sql_query, query_params)
            results = cur.fetchall()
        conn.close()
        
        # The re-ranking logic based on category_preferences would go here
        
        recommended_ids = [row[0] for row in results]
        print(recommended_ids)
        return recommended_ids
        
    except Exception as e:
        # Return a structured error for easier handling on the frontend
        return {"error": f"Error during recommendation: {e}"}
