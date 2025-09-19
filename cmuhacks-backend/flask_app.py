from flask import Flask, request, jsonify, redirect, url_for, render_template, session, flash
import numpy as np
import requests
import os
from ai_summarizer import define_unclear_terms
from database_handler import recommend_random, get_article_vector, get_db_connection, get_user_vector, add_user_to_db, add_paper, get_paper_body, recommend, update_user, get_paper_title, recommend_page, get_early_paper_summary, get_complete_paper_summary
import psycopg2
from flask_apscheduler import APScheduler
from daily_update_papers import get_recent_top
# from psycopg.rows import dict_row
from flask_cors import CORS
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
class Config:
    SCHEDULER_API_ENABLED = True
    SECRET_KEY = 'dev'
app = Flask(__name__)
CORS(app)
scheduler = APScheduler()
app.config.from_object(Config())
# --- CONFIGURATION ---
# IMPORTANT: Set this environment variable to your Hugging Face Space's URL.
# For example: "https://your-username-your-space-name.hf.space"
HF_SPACE_URL = "https://BucketofJava-Paper-Rec-System.hf.space"

def hash_password(password):
    return pwd_context.hash(password)
def verify_password(password, hashed_password):
    return pwd_context.verify(password, hashed_password)
if not HF_SPACE_URL:
    raise ValueError("HF_SPACE_URL environment variable not set. Please set it to your Hugging Face Space URL.")
def log_message(message):
    """
    Appends a given message to the end of 'logs.txt'.
    Each message is placed on a new line.
    """
    # 'a' opens the file in append mode
    with open('logs.txt', 'a') as log_file:
        log_file.write(f"{message}\n")
# Helper function to call the Gradio API
def call_gradio_api(endpoint: str, payload: dict):
    """
    Calls a specific endpoint on the Gradio API and returns the JSON response.
    """
    api_url = f"{HF_SPACE_URL}/run/{endpoint}"
    try:
        response = requests.post(api_url, json=payload)
        response.raise_for_status()  # Raises an HTTPError for bad responses (4xx or 5xx)
        print(response.json())
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Failed to call Gradio API: {e}")
        return {"error": f"Failed to call Gradio API: {e}"}, 500
@scheduler.task('interval', id='my_job', seconds=30)
def my_job():
    log_message("attempting to run scheduled task")
    papers, titles, summaries=get_recent_top('cs.AI')
    for i in range(papers):
        add_paper_raw(papers[i], titles[i], '<p>'+summaries[i]+'</p>')
    log_message('This job is executed every 10 seconds.')
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']

        if not username or not password:
       #     flash('All fields are required.')
            return redirect(url_for('login'))

        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT password FROM users WHERE username = %s", (username,))
                result = cur.fetchone()

        if result:
            hashed_password = result[0]
            if verify_password(password, hashed_password):
                session['username'] = username
             #   flash('Logged in successfully!')
                return redirect(url_for('index'))
            else:
                pass
              #  flash('Invalid password.')
        else:
            pass
            #flash('User not found.')

    return jsonify({'status': "SUCCESS"})
@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        data=request.get_json()
        username =data['username']
        email = data['email']
        password = data['password']

        if not username or not email or not password:
           # flash('All fields are required.')
            return redirect(url_for('/register'))

        try:
            hashed_password = hash_password(password)
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("INSERT INTO users (username, email, password, embedding) VALUES (%s, %s, %s, %s)",(username, email, hashed_password, np.random.rand(384).tolist()))
          #  flash('Registration successful! Please log in.')
            return redirect(url_for('login'))
        # except psycopg.errors.UniqueViolation:
        # #    flash('Username or email already exists.')
        #     return redirect(url_for('auth.register'))
        except Exception as e:
         #   flash(f'An error occurred: {e}')
            return redirect(url_for('register'))

    return jsonify({'status': "SUCCESS"})


@app.route('/register_new', methods=['GET', 'POST'])
def register_new():
    if request.method == 'POST':
        data = request.get_json()
        username = data['username']
        email = data['email']
        password = data['password']
        if not username or not email or not password:
            #flash('All fields are required.')
            return jsonify({ "status": "FAILURE", "message": 'All fields are required.' })

        try:
            hashed_password = hash_password(password)
            user_id = -1
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("INSERT INTO users (username, email, password, embedding) VALUES (%s, %s, %s, %s)",(username, email, hashed_password, np.random.rand(384).tolist()))
                    cur.execute("SELECT id FROM users WHERE email=%s",(email,))
                    user_id = cur.fetchone()[0]
            #flash('Registration successful! Please log in.')
            return jsonify({ "status": "SUCCESS", "message": 'Successful! Logging you in...', "id": user_id })
        except psycopg2.errors.UniqueViolation:
            #flash('Username or email already exists.')
            return jsonify({ "status": "FAILURE", "message": 'Username or email already exists.' })
        except Exception as e:
            #flash(f'An error occurred: {e}')
            return jsonify({ "status": "FAILURE", "message": f'An error occurred: {e}' })

    return render_template('register.html',logged_in=('username' in session))
@app.route('/prompt_about_text', methods=['POST'])
def prompt_about_text():
    data=request.get_json()
    if('text' not in data):
        return 'ts bad error'
    ai_explanation=define_unclear_terms(data['text'])
    return jsonify({'explanation': ai_explanation})
@app.route('/login_new', methods=['GET', 'POST'])
def login_new():
    if request.method == 'POST':
        data = request.get_json()
        email = data['email']
        password = data['password']

        if not email or not password:
            #flash('All fields are required.')
            return jsonify({ "status": "FAILURE", "message": 'All fields are required.' })

        user_id = -1
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT password FROM users WHERE email=%s", (email,))
                result = cur.fetchone()
                print(result)
                cur.execute("SELECT id FROM users WHERE email=%s",(email,))
                user_id = cur.fetchone()[0]
                print(user_id)

        if result:
            hashed_password = result[0]
            if verify_password(password, hashed_password):
                username=""
                with get_db_connection() as conn:
                    with conn.cursor() as cur:
                        cur.execute("SELECT username FROM users WHERE email=%s", (email,))
                        username = cur.fetchone()[0]
                session['username'] = username
                #flash('Logged in successfully!')
                return jsonify({ "status": "SUCCESS", "message": 'Successful! Logging you in...', "id": user_id })
            else:
                #flash('Invalid password.')
                return jsonify({ "status": "FAILURE", "message": 'Invalid password.' })
        else:
            #flash('User not found.')
            return jsonify({ "status": "FAILURE", "message": 'User not found.' })

    return render_template('login.html',logged_in=('username' in session))


@app.route('/profile')
def profile():
    if 'username' not in session:
        flash('Please log in first.')
        return redirect(url_for('login'))
    data={}
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id,username,email,articles_read,articles_liked,preferences FROM users WHERE username=%s",(session['username'],))
            data=cur.fetchone()
    data.logged_in=('username' in session)
    return data
#render_template('profile.html',logged_in=('username' in session),data=data)

@app.route('/profile_new/<id>')
def profile_new(id):
    data={}
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id,username,email,articles_read,articles_liked,preferences FROM users WHERE id=%s",(id,))
            data=cur.fetchone()
            print(data)
    return jsonify(data)

@app.route('/logout')
def logout():
    session.pop('username', None)
#    flash('You have been logged out.')
    return redirect(url_for('index'))
@app.route('/wow')
def my_job2():
    log_message("attempting to run scheduled task")
    papers, titles, summaries=get_recent_top('cs.AI')
    papers=list(papers)
    for i in range(len(papers)):
        print(i)
        add_paper_raw(papers[i],  titles[i], '<p>'+summaries[i]+'</p>')
    return "success" 
    log_message('This job is executed every 10 seconds.')
@app.route('/')
def index():
    print("AJH")
    return "Flask client for Hugging Face Recommender is running!"
@app.route('/get_paper_body', methods=['POST'])
def get_paper_body_():
    data=request.get_json()
    if not data or 'id' not in data:
        return jsonify({"error": "haha silly error"})
    result=get_paper_body(data['id'])
    if(result != None):
        return jsonify({'paper_body':result })
    else:
        return jsonify(result)
@app.route('/get_paper_title', methods=['POST'])
def get_paper_title_():
    data=request.get_json()
    if not data or 'id' not in data:
        return jsonify({"error": "haha silly error"})
    result=get_paper_title(data['id'])
    if(result != None):
        return jsonify({'paper_title':result, 'unique_id': data['id'] })
    else:
        return jsonify(result)
@app.route('/get_early_summary', methods=['POST'])
def get_early_summary_():
    data=request.get_json()
    if not data or 'id' not in data:
        return jsonify({"error": "haha silly error"})
    result=get_early_paper_summary(data['id'])
    if(result != None):
        return jsonify({'paper_title':result, 'unique_id': data['id'] })
    else:
        return jsonify(result)
@app.route('/get_complete_summary', methods=['POST'])
def get_complete_summary_():
    data=request.get_json()
    if not data or 'id' not in data:
        return jsonify({"error": "haha silly error"})
    result=get_complete_paper_summary(data['id'])
    if(result != None):
        return jsonify({'paper_title':result, 'unique_id': data['id'] })
    else:
        return jsonify(result)
@app.route('/add_user', methods=['POST'])
def add_user_endpoint():
    data = request.get_json()
    if not data or "username" not in data or "password" not in data or "email" not in data:
        return jsonify({"error": "Missing  data in request body"}), 400

@app.route('/add_paper', methods=['POST'])
def add_paper_endpoint():
    """
    Endpoint to add a new paper.
    Expects JSON: {"title": "The Title of the Paper"}
    """
    data = request.get_json()
    if not data or "title" not in data or "paper_body" not in data:
        return jsonify({"error": "Missing  data in request body"}), 400

    payload = {"data": [data["title"], data['paper_body']]}
    result, status_code = add_paper(data['title'], data['paper_body'])
    
    # Extract the actual data from the Gradio response format
    if "data" in result:
        return jsonify({"message": result["data"][0]})
    else:
        return jsonify(result), status_code
def add_paper_raw(title, title_real, paper_body):
    """
    Endpoint to add a new paper.
    Expects JSON: {"title": "The Title of the Paper"}
    """

    payload = {"data": [title, paper_body]}
    result = add_paper(title,  title_real,paper_body)
    print(result)
    # Extract the actual data from the Gradio response format
    if "data" in result:
        return jsonify({"message": result})
    else:
        return jsonify(result), 404

@app.route('/update_user_profile', methods=['POST'])
def update_user_endpoint():
    """
    Endpoint to update a user's profile vector.
    Expects JSON: {
        "history": [[[0.1, ...], 1], [[0.2, ...], 0]],
        "gamma": 0.8
    }
    """
    data = request.get_json()
    if not data or "user" not in data or 'article' not in data:
        return jsonify({"error": "Missing data in request body"}), 400
    
    # Gamma is optional, defaults to 0.8 on the Gradio side
    gamma = data.get("gamma", 0.8)
    
    payload = {"data": [get_user_vector(data['user']), get_article_vector(data['article']), gamma]}
    result = update_user(data['user'], get_user_vector(data['user']), get_article_vector(data['article']), gamma)

    if "data" in result:
        return jsonify({"user_vector": result})
    else:
        return jsonify(result)
@app.route('/get_random', methods=['POST'])
def get_random_endpoint():
    """
    Endpoint to get paper recommendations for a user.
    Expects JSON: {
        "embedding": [0.15, ...],
        "categories": [1, 0, 1, ...]
    }
    """
    data = request.get_json()
    if not data or "id" not in data:
        return jsonify({"error": "Request body must contain 'embedding' and 'categories'"}), 400
        
    payload = {"data": [data]} # The API wrapper expects the whole dict

    result = recommend_random(get_user_vector(data['id']), [])
    print(result)
    return jsonify({"recommendations": result})

@app.route('/get_recommendations', methods=['POST'])
def get_recommendations_endpoint():
    """
    Endpoint to get paper recommendations for a user.
    Expects JSON: {
        "embedding": [0.15, ...],
        "categories": [1, 0, 1, ...]
    }
    """
    data = request.get_json()
    if not data or "id" not in data:
        return jsonify({"error": "Request body must contain 'embedding' and 'categories'"}), 400
        
    payload = {"data": [data]} # The API wrapper expects the whole dict

    result = recommend(get_user_vector(data['id']), [])
    return jsonify({"recommendations": result})
    if "data" in result:
        print({"recommendations": result})
        return jsonify({"recommendations": result})
    else:
        return jsonify(result)
@app.route('/get_feed_papers', methods=['POST'])
def get_recommendations_page_endpoint():
    """
    Endpoint to get paper recommendations for a user.
    Expects JSON: {
        "embedding": [0.15, ...],
        "categories": [1, 0, 1, ...]
    }
    """
    data = request.get_json()
    print(data)
    print(data['id'])
    print(get_user_vector(data['id']))
    if not data or "id" not in data or 'page' not in data or 'batch_size' not in data:
        return jsonify({"error": "Request body must contain 'embedding' and 'categories'"}), 400
        
    payload = {"data": [data]} # The API wrapper expects the whole dict
    print(data['id'])
    print(get_user_vector(data['id']))
    result = recommend_page(get_user_vector(data['id']), [], data['page']*data['batch_size'], data['page']*data['batch_size']+data['batch_size'])
    return jsonify({"recommendations": result})

if __name__ == '__main__':
    # Use port 5001 to avoid conflicts with other apps
    scheduler.init_app(app)
    scheduler.start()
    app.run(host='0.0.0.0', port=5000, debug=True, use_reload=False)
