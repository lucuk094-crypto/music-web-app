import httpx
from http.server import BaseHTTPRequestHandler
import json
import os
from urllib.parse import urlparse, parse_qs

INNERTUBE_API_KEY = "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8"
INNERTUBE_CLIENT_VERSION = "2.20250304.03.00"
INNERTUBE_BASE_URL = "https://music.youtube.com/youtubei/v1/"

def get_innertube_context():
    return {
        "client": {
            "clientName": "WEB_REMIX",
            "clientVersion": INNERTUBE_CLIENT_VERSION,
            "hl": "en",
            "gl": "US",
            "osName": "Windows",
            "osVersion": "10.0",
            "userAgent": "Mozilla/5.0 (Windows NT 10.0; rv:91.0) Gecko/20100101 Firefox/91.0",
            "platform": "DESKTOP",
            "clientFormFactor": "UNKNOWN_FORM_FACTOR",
            "screenDensityFloat": 1.0,
            "screenWidthPoints": 1920,
            "screenHeightPoints": 1080
        },
        "user": {"lockedSafetyMode": False},
        "request": {"useSsl": True}
    }

async def make_innertube_request(endpoint, payload):
    url = f"{INNERTUBE_BASE_URL}{endpoint}?key={INNERTUBE_API_KEY}&prettyPrint=false"
    headers = {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; rv:91.0) Gecko/20100101 Firefox/91.0",
        "X-Goog-Api-Key": INNERTUBE_API_KEY,
        "X-YouTube-Client-Name": "67",
        "X-YouTube-Client-Version": INNERTUBE_CLIENT_VERSION
    }
    payload["context"] = get_innertube_context()
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=payload, headers=headers)
        response.raise_for_status()
        return response.json()

def extract_audio_url(player_response):
    if not player_response or "streamingData" not in player_response:
        return None, "No streaming data found."
    streaming_data = player_response["streamingData"]
    formats = streaming_data.get("adaptiveFormats", []) + streaming_data.get("formats", [])
    audio_formats = sorted([
        f for f in formats
        if f.get("mimeType", "").startswith("audio/") and "url" in f
    ], key=lambda x: x.get("bitrate", 0), reverse=True)
    if audio_formats:
        return audio_formats[0]["url"], None
    return None, "No suitable audio format found."

def extract_video_metadata(player_response):
    if not player_response or "videoDetails" not in player_response:
        return None
    details = player_response["videoDetails"]
    thumbnails = details.get("thumbnail", {}).get("thumbnails", [])
    return {
        "videoId": details.get("videoId"),
        "title": details.get("title"),
        "author": details.get("author"),
        "lengthSeconds": details.get("lengthSeconds"),
        "thumbnailUrl": thumbnails[-1]["url"] if thumbnails else None
    }

def extract_search_results(search_response):
    results = []
    try:
        sections = search_response.get("contents", {}).get("twoColumnSearchResultsRenderer", {}).get("primaryContents", {}).get("sectionListRenderer", {}).get("contents", [])
        for section in sections:
            items = []
            if "itemSectionRenderer" in section:
                items = section["itemSectionRenderer"].get("contents", [])
            elif "musicShelfRenderer" in section:
                items = section["musicShelfRenderer"].get("contents", [])
            else:
                continue
            for item in items:
                if "videoRenderer" in item:
                    v = item["videoRenderer"]
                    thumbs = v.get("thumbnail", {}).get("thumbnails", [])
                    results.append({
                        "videoId": v.get("videoId"),
                        "title": v.get("title", {}).get("runs", [{}])[0].get("text"),
                        "author": v.get("ownerText", {}).get("runs", [{}])[0].get("text"),
                        "lengthSeconds": v.get("lengthSeconds"),
                        "lengthText": v.get("lengthText", {}).get("simpleText"),
                        "thumbnailUrl": thumbs[-1]["url"] if thumbs else None,
                        "type": "video"
                    })
                elif "musicResponsiveListItemRenderer" in item:
                    m = item["musicResponsiveListItemRenderer"]
                    title_runs = m.get("flexColumns", [{},{}])[0].get("musicResponsiveListItemFlexColumnRenderer", {}).get("text", {}).get("runs", [])
                    title = "".join([r.get("text", "") for r in title_runs])
                    secondary = m.get("flexColumns", [{},{}])[1].get("musicResponsiveListItemFlexColumnRenderer", {}).get("text", {}).get("runs", [])
                    videoId = None
                    artist_parts = []
                    for r in secondary:
                        if r.get("navigationEndpoint", {}).get("watchEndpoint", {}).get("videoId"):
                            videoId = r["navigationEndpoint"]["watchEndpoint"]["videoId"]
                        if r.get("text") and not r.get("navigationEndpoint", {}).get("watchEndpoint", {}).get("videoId"):
                            artist_parts.append(r["text"])
                    thumbs = m.get("thumbnail", {}).get("musicThumbnailRenderer", {}).get("thumbnail", {}).get("thumbnails", [])
                    if videoId and title:
                        results.append({
                            "videoId": videoId,
                            "title": title,
                            "author": "".join(artist_parts).strip() or "Unknown Artist",
                            "thumbnailUrl": thumbs[-1]["url"] if thumbs else None,
                            "type": "music_song"
                        })
    except Exception as e:
        print(f"Search parse error: {e}")
    return results

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path.rstrip("/")
        params = parse_qs(parsed.query)

        headers = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Content-Type": "application/json"
        }

        if self.path == "/":
            self._send_response(200, {"status": "ok", "message": "Music Web API is running!"}, headers)
            return

        if path == "/api/search":
            query = params.get("q", [None])[0] or params.get("query", [None])[0]
            if not query:
                self._send_response(400, {"error": "Query parameter is required"}, headers)
                return
            import asyncio
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                data = loop.run_until_complete(make_innertube_request("search", {"query": query}))
                results = extract_search_results(data)
                self._send_response(200, results, headers)
            except Exception as e:
                self._send_response(500, {"error": str(e)}, headers)
            return

        parts = path.split("/")
        if len(parts) == 4 and parts[1] == "api" and parts[2] == "stream":
            video_id = parts[3]
            import asyncio
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                data = loop.run_until_complete(make_innertube_request("player", {
                    "videoId": video_id,
                    "playbackContext": {"contentPlaybackContext": {"vis": 0, "referer": "https://music.youtube.com/"}}
                }))
                audio_url, error = extract_audio_url(data)
                metadata = extract_video_metadata(data)
                if not audio_url:
                    self._send_response(500, {"error": error}, headers)
                    return
                self._send_response(200, {"audioUrl": audio_url, "metadata": metadata}, headers)
            except Exception as e:
                self._send_response(500, {"error": str(e)}, headers)
            return

        self._send_response(404, {"error": "Not found"}, headers)

    def do_OPTIONS(self):
        headers = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "GET, OPTIONS"
        }
        self._send_response(204, None, headers)

    def _send_response(self, status, data, headers):
        self.send_response(status)
        for k, v in headers.items():
            self.send_header(k, v)
        self.end_headers()
        if data is not None:
            self.wfile.write(json.dumps(data).encode("utf-8"))
