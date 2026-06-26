import os
import httpx
import asyncio
from flask import Flask, jsonify, request
from dotenv import load_dotenv
from flask_cors import CORS # Import CORS

load_dotenv() # Load environment variables from .env file

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

# Innertube API configuration (inspired by existing clients)
# These values might need to be updated periodically as YouTube changes them.
INNERTUBE_API_KEY = os.getenv("INNERTUBE_API_KEY", "") # Can be empty if not explicitly needed
INNERTUBE_CLIENT_VERSION = os.getenv("INNERTUBE_CLIENT_VERSION", "2.20231215.01.00") # Example version, can vary
INNERTUBE_BASE_URL = "https://www.youtube.com/youtubei/v1/"

# Basic route for testing
@app.route('/')
def home():
    return "Backend is running!"

# Helper to build common Innertube request context
def get_innertube_context():
    return {
        "client": {
            "clientName": "WEB_REMIX", # Or "WEB", "ANDROID", "IOS" depending on desired data/format
            "clientVersion": INNERTUBE_CLIENT_VERSION,
            "hl": "en", # Host language
            "gl": "US", # Geographic region
            "deviceMake": "",
            "deviceModel": "",
            "osName": "Windows", # Or "Android", etc.
            "osVersion": "10.0",
            "userAgent": "Mozilla/5.0 (Windows NT 10.0; rv:91.0) Gecko/20100101 Firefox/91.0",
            "screenWidthPoints": 1920,
            "screenHeightPoints": 1080,
            "utcOffsetMinutes": 0
        },
        "user": {
            "lockedSafetyMode": False
        },
        "request": {
            "useSsl": True,
            "internalExperimentFlags": [],
            "consistencyTokenJars": []
        }
    }

# Function to make a generic Innertube request
async def make_innertube_request(endpoint, payload):
    url = f"{INNERTUBE_BASE_URL}{endpoint}"
    if INNERTUBE_API_KEY:
        url += f"?key={INNERTUBE_API_KEY}"

    headers = {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; rv:91.0) Gecko/20100101 Firefox/91.0"
    }
    payload["context"] = get_innertube_context()

    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=payload, headers=headers)
        response.raise_for_status() # Raise an exception for HTTP errors
        return response.json()

# --- Innertube Parsing Logic ---
def extract_audio_url(player_response):
    """
    Extracts the highest quality audio URL from the Innertube player response.
    """
    if not player_response or "streamingData" not in player_response:
        return None, "No streaming data found."

    streaming_data = player_response["streamingData"]
    formats = streaming_data.get("adaptiveFormats", []) + streaming_data.get("formats", [])

    # Filter for audio-only formats and sort by bitrate descending
    audio_formats = sorted([
        f for f in formats
        if f.get("mimeType", "").startswith("audio/") and "url" in f
    ], key=lambda x: x.get("bitrate", 0), reverse=True)

    if audio_formats:
        return audio_formats[0]["url"], None
    else:
        return None, "No suitable audio format found."

def extract_video_metadata(player_response):
    """
    Extracts relevant video metadata from the Innertube player response.
    """
    if not player_response or "videoDetails" not in player_response:
        return None

    details = player_response["videoDetails"]
    thumbnails = details.get("thumbnail", {}).get("thumbnails", [])

    # Get highest quality thumbnail
    thumbnail_url = thumbnails[-1]["url"] if thumbnails else None

    return {
        "videoId": details.get("videoId"),
        "title": details.get("title"),
        "author": details.get("author"),
        "lengthSeconds": details.get("lengthSeconds"),
        "thumbnailUrl": thumbnail_url
    }

def extract_search_results(search_response):
    """
    Extracts relevant search results (e.g., videos) from the Innertube search response.
    This is highly dependent on the 'contents' structure.
    """
    results = []

    try:
        sections = search_response.get("contents", {}).get("twoColumnSearchResultsRenderer", {}).get("primaryContents", {}).get("sectionListRenderer", {}).get("contents", [])

        for section in sections:
            if "itemSectionRenderer" in section:
                items = section["itemSectionRenderer"].get("contents", [])
            elif "musicShelfRenderer" in section: # For YT Music specific searches
                items = section["musicShelfRenderer"].get("contents", [])
            else:
                continue

            for item in items:
                # Video result
                if "videoRenderer" in item:
                    video = item["videoRenderer"]
                    thumbnails = video.get("thumbnail", {}).get("thumbnails", [])
                    thumbnail_url = thumbnails[-1]["url"] if thumbnails else None

                    results.append({
                        "videoId": video.get("videoId"),
                        "title": video.get("title", {}).get("runs", [{}])[0].get("text"),
                        "author": video.get("ownerText", {}).get("runs", [{}])[0].get("text"),
                        "lengthSeconds": video.get("lengthSeconds"), # Use lengthSeconds if available
                        "lengthText": video.get("lengthText", {}).get("simpleText"),
                        "thumbnailUrl": thumbnail_url,
                        "type": "video"
                    })
                # Music song result (from musicShelfRenderer)
                elif "musicResponsiveListItemRenderer" in item:
                    music_item = item["musicResponsiveListItemRenderer"]
                    # Extracting title
                    title_runs = music_item.get("flexColumns", [{},{}])[0].get("musicResponsiveListItemFlexColumnRenderer", {}).get("text", {}).get("runs", [])
                    title = "".join([run.get("text", "") for run in title_runs])

                    # Extracting artists and videoId
                    secondary_info_runs = music_item.get("flexColumns", [{},{}])[1].get("musicResponsiveListItemFlexColumnRenderer", {}).get("text", {}).get("runs", [])
                    artist_name_parts = []
                    videoId = None
                    for run in secondary_info_runs:
                        if run.get("navigationEndpoint", {}).get("watchEndpoint", {}).get("videoId"):
                            videoId = run["navigationEndpoint"]["watchEndpoint"]["videoId"]
                        # Attempt to extract artist name - might be complex due to separators like " • "
                        if run.get("text") and not run.get("navigationEndpoint", {}).get("watchEndpoint", {}).get("videoId"):
                             artist_name_parts.append(run["text"])
                    artist_name = "".join(artist_name_parts).strip().split(" • ")[0] # Simple split for now

                    # Extracting length - usually from flexColumns[1] as well
                    length_text = None
                    # Attempt to find length text, it might be in different columns for music items
                    if len(music_item.get("flexColumns", [])) > 2:
                        length_text_runs = music_item["flexColumns"][2].get("musicResponsiveListItemFlexColumnRenderer", {}).get("text", {}).get("runs", [])
                        length_text = "".join([run.get("text", "") for run in length_text_runs])


                    # Extracting thumbnail
                    thumbnails = music_item.get("thumbnail", {}).get("musicThumbnailRenderer", {}).get("thumbnail", {}).get("thumbnails", [])
                    thumbnail_url = thumbnails[-1]["url"] if thumbnails else None

                    if videoId and title:
                        results.append({
                            "videoId": videoId,
                            "title": title,
                            "author": artist_name if artist_name else "Unknown Artist",
                            "lengthSeconds": None, # Innertube Music often doesn't directly provide seconds here
                            "lengthText": length_text,
                            "thumbnailUrl": thumbnail_url,
                            "type": "music_song"
                        })

    except Exception as e:
        print(f"Error parsing search results: {e}")
        # Fallback to returning empty list on parse error
        return []

    return results

# Endpoint for searching YouTube/YT Music
@app.route('/api/search', methods=['GET'])
async def search():
    query = request.args.get('query')
    if not query:
        return jsonify({"error": "Query parameter is required"}), 400

    try:
        # This payload is a simplified example, real Innertube search is more complex
        payload = {
            "query": query,
            # "params": "EgWKAQIQAVAA" # This param is for music search results. May need to be dynamic
            "client": {"hl": "en", "gl": "US"} # Can override context here if needed
        }
        data = await make_innertube_request("search", payload)

        # Parse search results
        parsed_results = extract_search_results(data)
        return jsonify(parsed_results)
    except httpx.HTTPStatusError as e:
        return jsonify({"error": f"HTTP error from Innertube: {e.response.status_code} - {e.response.text}"}), e.response.status_code
    except Exception as e:
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500

# Endpoint to get streaming URL and metadata for a videoId
@app.route('/api/stream/<string:video_id>', methods=['GET'])
async def get_stream_data(video_id):
    if not video_id:
        return jsonify({"error": "Video ID is required"}), 400

    try:
        payload = {
            "videoId": video_id,
            "playbackContext": {
                "contentPlaybackContext": {
                    "vis": 0,
                    "referer": "https://music.youtube.com/"
                }
            }
        }
        data = await make_innertube_request("player", payload)

        audio_url, audio_error = extract_audio_url(data)
        metadata = extract_video_metadata(data)

        if not audio_url:
            return jsonify({"error": audio_error}), 500

        return jsonify({
            "audioUrl": audio_url,
            "metadata": metadata
        })
    except httpx.HTTPStatusError as e:
        return jsonify({"error": f"HTTP error from Innertube: {e.response.status_code} - {e.response.text}"}), e.response.status_code
    except Exception as e:
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500

if __name__ == '__main__':
    # Flask is not inherently async, for development we can use asyncio.run
    # For production, consider an ASGI server like Gunicorn with Uvicorn worker
    app.run(debug=True, port=5000)
