import os
import httpx
from flask import Flask, jsonify, request
from dotenv import load_dotenv

load_dotenv() # Load environment variables from .env file

app = Flask(__name__)

# Basic route for testing
@app.route('/')
def home():
    return "Backend is running!"

# TODO: Implement Innertube API interaction and proxy endpoints here

if __name__ == '__main__':
    app.run(debug=True, port=5000)