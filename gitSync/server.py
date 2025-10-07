import os
import time
import threading
from datetime import datetime
from flask import Flask, jsonify
from dotenv import load_dotenv

# Import the sync logic from main
from main import (
    fetch_all_posts,
    group_posts_by_github_url,
    analyze_repo_for_posts,
    update_post_git_changes,
    AIRTABLE_API_KEY,
    AIRTABLE_BASE_ID
)

load_dotenv()

app = Flask(__name__)
PORT = int(os.environ.get('PORT', 3002))

# Global sync state
is_sync_running = False
last_sync_time = None
last_sync_result = None
sync_error = None
sync_count = 0


def perform_full_sync():
    """Perform a full sync of posts and git changes."""
    global last_sync_result, sync_error
    
    if not AIRTABLE_API_KEY:
        raise ValueError("AIRTABLE_API_KEY environment variable is not set")
    
    if not AIRTABLE_BASE_ID:
        raise ValueError("AIRTABLE_BASE_ID environment variable is not set")
    
    print(f"\n{'='*80}")
    print(f"Starting sync #{sync_count + 1} at {datetime.now().isoformat()}")
    print(f"{'='*80}\n")
    
    # Fetch posts
    posts = fetch_all_posts()
    print(f"Total posts fetched: {len(posts)}")
    
    if len(posts) == 0:
        return {
            'success': True,
            'message': 'No posts to process',
            'total_posts': 0,
            'repos_processed': 0,
            'timestamp': datetime.now().isoformat()
        }
    
    # Group by GitHub URL
    grouped_data = group_posts_by_github_url(posts)
    print(f"Grouped into {len(grouped_data)} unique repositories\n")
    
    repos_processed = 0
    posts_updated = 0
    
    # Process each repository
    for i, repo in enumerate(grouped_data, 1):
        print(f"Repository {i}/{len(grouped_data)}: {repo['github_url']}")
        print(f"  Posts: {len(repo['posts'])}")
        
        try:
            # Analyze repo and get git changes
            repo['posts'] = analyze_repo_for_posts(repo['github_url'], repo['posts'])
            
            # Update Airtable with git changes
            for post in repo['posts']:
                if post.get('git_changes'):
                    print(f"  Updating Airtable for post {post['post_id']}...")
                    if update_post_git_changes(post['record_id'], post['git_changes']):
                        posts_updated += 1
            
            repos_processed += 1
            
        except Exception as e:
            print(f"  Error processing repo: {e}")
            continue
    
    result = {
        'success': True,
        'total_posts': len(posts),
        'repos_processed': repos_processed,
        'posts_updated': posts_updated,
        'timestamp': datetime.now().isoformat()
    }
    
    print(f"\n{'='*80}")
    print(f"Sync complete: {repos_processed} repos, {posts_updated} posts updated")
    print(f"{'='*80}\n")
    
    return result


def run_continuous_sync():
    """Run continuous sync loop."""
    global is_sync_running, last_sync_time, last_sync_result, sync_error, sync_count
    
    while True:
        if is_sync_running:
            time.sleep(1)
            continue
        
        is_sync_running = True
        sync_count += 1
        
        try:
            result = perform_full_sync()
            last_sync_result = result
            last_sync_time = datetime.now()
            sync_error = None
            
            # Wait before next sync
            print(f"Waiting 60 seconds before next sync...\n")
            time.sleep(60)
            
        except Exception as error:
            sync_error = str(error)
            print(f"❌ Sync #{sync_count} failed: {error}")
            print(f"Retrying in 30 seconds...\n")
            time.sleep(30)
        
        finally:
            is_sync_running = False


# Routes
@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat()
    })


@app.route('/api/sync-status', methods=['GET'])
def sync_status():
    """Get sync status."""
    return jsonify({
        'is_running': is_sync_running,
        'last_sync_time': last_sync_time.isoformat() if last_sync_time else None,
        'last_sync_result': last_sync_result,
        'last_error': sync_error,
        'sync_count': sync_count,
        'timestamp': datetime.now().isoformat()
    })


@app.route('/api/sync', methods=['POST'])
def trigger_sync():
    """Manually trigger a sync."""
    global is_sync_running
    
    if is_sync_running:
        return jsonify({
            'message': 'Sync already running',
            'last_sync_time': last_sync_time.isoformat() if last_sync_time else None
        }), 409
    
    try:
        result = perform_full_sync()
        return jsonify(result)
    except Exception as error:
        return jsonify({
            'success': False,
            'error': str(error),
            'timestamp': datetime.now().isoformat()
        }), 500


@app.route('/', methods=['GET'])
def root():
    """Root endpoint."""
    return jsonify({
        'service': 'gitSync',
        'status': 'running',
        'endpoints': {
            'health': '/health',
            'sync_status': '/api/sync-status',
            'trigger_sync': '/api/sync (POST)'
        }
    })


if __name__ == '__main__':
    # Start continuous sync in background thread
    sync_thread = threading.Thread(target=run_continuous_sync, daemon=True)
    sync_thread.start()
    
    print(f"Starting gitSync server on port {PORT}")
    print(f"Continuous sync enabled")
    
    # Start Flask server
    app.run(host='0.0.0.0', port=PORT)

