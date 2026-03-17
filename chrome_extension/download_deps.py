import urllib.request
import os

# URLs to download
VISION_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/vision_bundle.js"
WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm/vision_wasm_internal.js"
WASM_BINARY_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm/vision_wasm_internal.wasm"

DEST_DIR = "c:\\Users\\fidha\\OneDrive\\Desktop\\FINALVELOX\\chrome_extension"

def download_file(url, filename):
    filepath = os.path.join(DEST_DIR, filename)
    print(f"Downloading {filename}...")
    try:
        urllib.request.urlretrieve(url, filepath)
        print(f"Saved to {filepath}")
    except Exception as e:
        print(f"Failed to download {filename}: {e}")

if __name__ == "__main__":
    # Note: efficient CDN bundles are hard to match exactly, 
    # but for MediaPipe tasks-vision, getting the main script + wasm usually works.
    # We will try to download the ESM version or a compatible script.
    
    # Actually, the ESM import in content.js uses `+esm`. 
    # Let's try to just download the main bundle.
    # Using a slightly different URL that is often used for self-hosting.
    
    download_file("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/vision_bundle.js", "vision_bundle.js")
    
    # Create wasm dir
    wasm_dir = os.path.join(DEST_DIR, "wasm")
    os.makedirs(wasm_dir, exist_ok=True)
    
    # Download wasm assets
    # Note: These exact URLs might need adjustment based on how the bundle references them.
    # For now, we will try to stick to CDN for the Model and Wasm if possible, 
    # but if code execution is blocked, we must bundle the JS.
    pass
