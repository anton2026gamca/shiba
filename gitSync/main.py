import os
import requests
import json
import subprocess
import shutil
import tempfile
import signal
import psutil
from typing import List, Dict, Any
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Airtable configuration from environment variables
AIRTABLE_API_KEY = os.environ.get('AIRTABLE_API_KEY')
AIRTABLE_BASE_ID = os.environ.get('AIRTABLE_BASE_ID')
AIRTABLE_POSTS_TABLE = 'Posts'
AIRTABLE_API_BASE = 'https://api.airtable.com/v0'


def cleanup_git_processes():
    """Clean up any hanging git processes."""
    try:
        for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
            try:
                if proc.info['name'] == 'git' and proc.info['cmdline']:
                    # Check if it's a git process that's been running too long
                    if proc.create_time() < (datetime.now().timestamp() - 600):  # 10 minutes
                        print(f"  Terminating hanging git process: {proc.info['pid']}")
                        proc.terminate()
                        proc.wait(timeout=5)
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.TimeoutExpired):
                pass
    except Exception as e:
        print(f"  Warning: Could not cleanup git processes: {e}")


def airtable_request(path: str, method: str = 'GET', params: Dict = None) -> Dict[str, Any]:
    """Make a request to the Airtable API."""
    url = f"{AIRTABLE_API_BASE}/{AIRTABLE_BASE_ID}/{path}"
    headers = {
        'Authorization': f'Bearer {AIRTABLE_API_KEY}',
        'Content-Type': 'application/json',
    }
    
    response = requests.request(method, url, headers=headers, params=params)
    
    if not response.ok:
        raise Exception(f"Airtable error {response.status_code}: {response.text}")
    
    return response.json()


def fetch_all_posts() -> List[Dict[str, Any]]:
    """Fetch all posts from Airtable with pagination."""
    all_records = []
    offset = None
    
    # Specific fields to fetch
    fields_to_fetch = ['PostID', 'GitHubUrl', 'GitHubUsername', 'GitChanges', 'Created At', 'TimeSpentOnAsset']
    
    # Filter to only get records where:
    # - GitHubUrl and GitHubUsername are not empty
    # - TimeSpentOnAsset is empty/null (not yet processed)
    filter_formula = "AND({GitHubUrl}!='', {GitHubUsername}!='', OR({TimeSpentOnAsset}='', {TimeSpentOnAsset}=BLANK()))"
    
    while True:
        params = {
            'pageSize': '100',
            'fields[]': fields_to_fetch,
            'filterByFormula': filter_formula
        }
        if offset:
            params['offset'] = offset
        
        page = airtable_request(AIRTABLE_POSTS_TABLE, params=params)
        
        page_records = page.get('records', [])
        all_records.extend(page_records)
        
        offset = page.get('offset')
        if not offset:
            break
        
        print(f"Fetched {len(all_records)} records so far...")
    
    return all_records


def clone_repo(github_url: str, clone_dir: str) -> bool:
    """Clone a GitHub repository with minimal data (blobless clone for speed)."""
    try:
        print(f"  Cloning {github_url} (blobless for speed)...")
        # Use --filter=blob:none for blobless clone - gets commit history and tree structure
        # but not file contents, which are fetched on-demand. Much faster!
        # Add timeout to prevent hanging processes
        result = subprocess.run(
            ['git', 'clone', '--filter=blob:none', '--quiet', github_url, clone_dir],
            check=True,
            capture_output=True,
            text=True,
            timeout=300  # 5 minute timeout
        )
        return True
    except subprocess.TimeoutExpired:
        print(f"  Timeout cloning repository: {github_url}")
        return False
    except subprocess.CalledProcessError as e:
        print(f"  Error cloning repository: {e.stderr}")
        return False


def get_commits_in_timerange(repo_dir: str, start_time: str = None, end_time: str = None) -> List[Dict[str, Any]]:
    """Get commits within a time range."""
    try:
        # Build git log command
        cmd = ['git', 'log', '--all', '--pretty=format:%H|%an|%ae|%ai|%s']
        
        if start_time and end_time:
            cmd.append(f'--since={start_time}')
            cmd.append(f'--until={end_time}')
        elif end_time:
            cmd.append(f'--until={end_time}')
        
        result = subprocess.run(
            cmd,
            cwd=repo_dir,
            capture_output=True,
            text=True,
            check=True,
            timeout=120  # 2 minute timeout
        )
        
        commits = []
        for line in result.stdout.strip().split('\n'):
            if not line:
                continue
            parts = line.split('|', 4)
            if len(parts) == 5:
                commits.append({
                    'hash': parts[0],
                    'author': parts[1],
                    'email': parts[2],
                    'date': parts[3],
                    'message': parts[4]
                })
        
        return commits
    except subprocess.TimeoutExpired:
        print(f"  Timeout getting commits from {repo_dir}")
        return []
    except subprocess.CalledProcessError as e:
        print(f"  Error getting commits: {e.stderr}")
        return []


def get_commit_changes(repo_dir: str, commit_hash: str, github_url: str) -> List[Dict[str, Any]]:
    """Get file changes for a specific commit with stats and GitHub links."""
    try:
        # Get diff stats for the commit
        stats_result = subprocess.run(
            ['git', 'show', '--numstat', '--pretty=format:', commit_hash],
            cwd=repo_dir,
            capture_output=True,
            text=True,
            check=True,
            timeout=60  # 1 minute timeout
        )
        
        # Parse the GitHub URL to get owner/repo
        # Format: https://github.com/owner/repo or https://github.com/owner/repo.git
        github_url = github_url.rstrip('.git')
        
        files_changed = []
        for line in stats_result.stdout.strip().split('\n'):
            if not line:
                continue
            parts = line.split('\t')
            if len(parts) >= 3:
                additions = parts[0]
                deletions = parts[1]
                filepath = parts[2]
                
                # Handle binary files (show as - -)
                if additions == '-':
                    additions = 0
                    deletions = 0
                    is_binary = True
                else:
                    additions = int(additions)
                    deletions = int(deletions)
                    is_binary = False
                
                # Generate GitHub link to this specific file change
                file_link = f"{github_url}/commit/{commit_hash}#diff-{hash(filepath) & 0xffffffff:08x}"
                
                files_changed.append({
                    'filepath': filepath,
                    'additions': additions,
                    'deletions': deletions,
                    'is_binary': is_binary,
                    'github_link': file_link
                })
        
        return files_changed
    except subprocess.TimeoutExpired:
        print(f"  Timeout getting commit changes for {commit_hash}")
        return []
    except subprocess.CalledProcessError as e:
        print(f"  Error getting commit changes: {e.stderr}")
        return []


def analyze_repo_for_posts(github_url: str, posts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Analyze repository and generate git changes for each post."""
    temp_dir = tempfile.mkdtemp()
    repo_dir = os.path.join(temp_dir, 'repo')
    
    try:
        # Clone the repository
        if not clone_repo(github_url, repo_dir):
            # Clean up temp dir if clone fails
            shutil.rmtree(temp_dir, ignore_errors=True)
            return posts
        
        # Process each post
        for i, post in enumerate(posts):
            print(f"  Processing post {i+1}/{len(posts)}: {post['post_id']}")
            
            # Determine time range
            end_time = post['created_at']
            start_time = posts[i-1]['created_at'] if i > 0 else None
            
            # Get commits in this time range
            commits = get_commits_in_timerange(repo_dir, start_time, end_time)
            
            if not commits:
                print(f"    No commits found in timerange")
                post['git_changes'] = json.dumps({
                    'commits': [],
                    'summary': 'No commits found in this timerange'
                })
                continue
            
            print(f"    Found {len(commits)} commits")
            
            # Get changes for each commit
            commit_changes = []
            for commit in commits:
                files_changed = get_commit_changes(repo_dir, commit['hash'], github_url)
                
                # Generate GitHub commit link
                commit_link = f"{github_url}/commit/{commit['hash']}"
                
                commit_changes.append({
                    'hash': commit['hash'][:7],  # Short hash
                    'author': commit['author'],
                    'date': commit['date'],
                    'message': commit['message'],
                    'github_link': commit_link,
                    'files': files_changed,
                    'stats': {
                        'files_changed': len(files_changed),
                        'total_additions': sum(f['additions'] for f in files_changed),
                        'total_deletions': sum(f['deletions'] for f in files_changed)
                    }
                })
            
            # Calculate totals
            total_files = sum(len(c['files']) for c in commit_changes)
            total_additions = sum(c['stats']['total_additions'] for c in commit_changes)
            total_deletions = sum(c['stats']['total_deletions'] for c in commit_changes)
            
            # Store as JSON string
            post['git_changes'] = json.dumps({
                'commits': commit_changes,
                'summary': {
                    'total_commits': len(commits),
                    'total_files_changed': total_files,
                    'total_additions': total_additions,
                    'total_deletions': total_deletions
                }
            }, indent=2)
        
        return posts
        
    finally:
        # Cleanup
        shutil.rmtree(temp_dir, ignore_errors=True)


def group_posts_by_github_url(posts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Group posts by GitHub URL."""
    grouped = {}
    
    for post in posts:
        fields = post.get('fields', {})
        
        # Extract GitHub URL (handle it being a list or string)
        github_url = fields.get('GitHubUrl')
        if isinstance(github_url, list):
            github_url = github_url[0] if github_url else None
        
        if not github_url:
            continue
        
        # Extract username (handle it being a list or string)
        username = fields.get('GitHubUsername')
        if isinstance(username, list):
            username = username[0] if username else None
        
        # Create post data
        post_data = {
            'record_id': post.get('id'),  # Store Airtable record ID
            'post_id': fields.get('PostID'),
            'created_at': fields.get('Created At'),
            'username': username,
            'git_changes': fields.get('GitChanges')
        }
        
        # Add to grouped dictionary
        if github_url not in grouped:
            grouped[github_url] = {
                'github_url': github_url,
                'posts': []
            }
        
        grouped[github_url]['posts'].append(post_data)
    
    # Convert to list and sort posts by created_at within each group
    result = list(grouped.values())
    for group in result:
        group['posts'].sort(key=lambda x: x.get('created_at', ''))
    
    return result


def update_post_git_changes(record_id: str, git_changes: str) -> bool:
    """Update a post record in Airtable with git changes."""
    try:
        url = f"{AIRTABLE_API_BASE}/{AIRTABLE_BASE_ID}/{AIRTABLE_POSTS_TABLE}/{record_id}"
        
        response = requests.patch(
            url,
            headers={
                'Authorization': f'Bearer {AIRTABLE_API_KEY}',
                'Content-Type': 'application/json',
            },
            json={
                'fields': {
                    'GitChanges': git_changes
                }
            }
        )
        
        if not response.ok:
            print(f"    Error updating Airtable: {response.status_code} - {response.text}")
            return False
        
        return True
    except Exception as e:
        print(f"    Error updating Airtable: {e}")
        return False


def main():
    """Main function to fetch and display all posts."""
    if not AIRTABLE_API_KEY:
        raise ValueError("AIRTABLE_API_KEY environment variable is not set")
    
    if not AIRTABLE_BASE_ID:
        raise ValueError("AIRTABLE_BASE_ID environment variable is not set")
    
    # Clean up any hanging git processes before starting
    cleanup_git_processes()
    
    print(f"Fetching all posts from Airtable...")
    print(f"Base ID: {AIRTABLE_BASE_ID}")
    print(f"Table: {AIRTABLE_POSTS_TABLE}")
    print()
    
    posts = fetch_all_posts()
    
    print(f"\nTotal posts fetched: {len(posts)}")
    
    # Group posts by GitHub URL
    grouped_data = group_posts_by_github_url(posts)
    
    print(f"\nGrouped into {len(grouped_data)} unique GitHub repositories")
    print("\n" + "="*80)
    print("Analyzing repositories and updating git changes...")
    print("="*80 + "\n")
    
    # Process each repository
    for i, repo in enumerate(grouped_data, 1):
        print(f"\nRepository {i}/{len(grouped_data)}: {repo['github_url']}")
        print(f"  Total posts: {len(repo['posts'])}")
        
        # Analyze repo and get git changes
        repo['posts'] = analyze_repo_for_posts(repo['github_url'], repo['posts'])
        
        # Update Airtable with git changes
        for post in repo['posts']:
            if post.get('git_changes'):
                print(f"  Updating Airtable for post {post['post_id']}...")
                update_post_git_changes(post['record_id'], post['git_changes'])
    
    # Save to JSON file
    output_file = 'posts_data.json'
    with open(output_file, 'w') as f:
        json.dump(grouped_data, f, indent=2)
    
    print(f"\n\n{'='*80}")
    print(f"Complete! Data saved to {output_file}")
    print(f"Processed {len(grouped_data)} repositories")
    print(f"{'='*80}")


if __name__ == "__main__":
    main()

