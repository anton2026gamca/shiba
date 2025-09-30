import os
from dotenv import load_dotenv
import requests
from collections import defaultdict

# Load environment variables from .env file
load_dotenv()

# Environment Variables
AIRTABLE_API_KEY = os.getenv("AIRTABLE_API_KEY")
AIRTABLE_BASE_ID = os.getenv("AIRTABLE_BASE_ID")

# Airtable configuration
AIRTABLE_API_BASE = 'https://api.airtable.com/v0'
PLAYTEST_TICKETS_TABLE = 'PlaytestTickets'

def airtable_request(path, options=None):
    """Make a request to the Airtable API"""
    if options is None:
        options = {}
    
    url = f"{AIRTABLE_API_BASE}/{AIRTABLE_BASE_ID}/{path}"
    
    headers = {
        'Authorization': f'Bearer {AIRTABLE_API_KEY}',
        'Content-Type': 'application/json'
    }
    
    # Add any additional headers from options
    if 'headers' in options:
        headers.update(options['headers'])
    
    response = requests.request(
        method=options.get('method', 'GET'),
        url=url,
        headers=headers,
        json=options.get('json'),
        params=options.get('params')
    )
    
    if not response.ok:
        raise Exception(f"Airtable error {response.status_code}: {response.text}")
    
    return response.json()

def fetch_all_playtest_tickets():
    """Fetch all records from the PlaytestTickets table with pagination"""
    all_records = []
    offset = None
    page_count = 0
    
    print("📄 Fetching all playtest tickets...")
    
    while True:
        page_count += 1
        params = {'pageSize': 100}
        if offset:
            params['offset'] = offset
        
        try:
            print(f"  Fetching page {page_count}...")
            page = airtable_request(f"{PLAYTEST_TICKETS_TABLE}?{requests.compat.urlencode(params)}", {
                'method': 'GET'
            })
            
            page_records = page.get('records', [])
            all_records.extend(page_records)
            offset = page.get('offset')
            
            print(f"    Got {len(page_records)} records (total so far: {len(all_records)})")
            
            if not offset:
                print(f"  ✅ Reached end of data after {page_count} pages")
                break
                
        except Exception as e:
            print(f"❌ Error fetching page {page_count}: {e}")
            break
    
    print(f"📊 Total records fetched: {len(all_records)}")
    return all_records

def analyze_duplicates():
    """Analyze playtest tickets for duplicates"""
    print("🔍 Analyzing PlaytestTickets for duplicates...")
    print("=" * 60)
    
    # Fetch all playtest tickets
    records = fetch_all_playtest_tickets()
    print(f"Found {len(records)} playtest tickets")
    
    # Group by player and game to find duplicates
    assignments = defaultdict(list)
    duplicates = []
    
    for record in records:
        fields = record.get('fields', {})
        player = fields.get('Player', [None])[0] if fields.get('Player') else None
        game = fields.get('GameToTest', [None])[0] if fields.get('GameToTest') else None
        playtest_id = fields.get('PlaytestId', 'Unknown')
        
        if player and game:
            key = f"{player}_{game}"
            assignments[key].append({
                'record_id': record.get('id'),
                'playtest_id': playtest_id,
                'player': player,
                'game': game,
                'created_time': record.get('createdTime', 'Unknown')
            })
    
    # Find duplicates
    for key, ticket_list in assignments.items():
        if len(ticket_list) > 1:
            duplicates.append({
                'key': key,
                'tickets': ticket_list,
                'count': len(ticket_list)
            })
    
    print(f"\n📊 Duplicate Analysis:")
    print(f"  Total unique assignments: {len(assignments)}")
    print(f"  Duplicate groups found: {len(duplicates)}")
    
    if duplicates:
        print(f"\n🚨 Duplicate Assignments Found:")
        print("-" * 60)
        for i, dup in enumerate(duplicates, 1):
            print(f"\n{i}. Player-Game Pair: {dup['key']}")
            print(f"   Count: {dup['count']} tickets")
            print(f"   Tickets:")
            for j, ticket in enumerate(dup['tickets'], 1):
                print(f"     {j}. PlaytestId: {ticket['playtest_id']}")
                print(f"        Record ID: {ticket['record_id']}")
                print(f"        Created: {ticket['created_time']}")
    else:
        print(f"\n✅ No duplicates found!")
    
    return duplicates

def remove_duplicates(simulation_mode=True):
    """Remove duplicate playtest tickets"""
    print("🧹 Removing Duplicate Playtest Tickets")
    print("=" * 60)
    
    # Analyze duplicates first
    duplicates = analyze_duplicates()
    
    if not duplicates:
        print("✅ No duplicates to remove!")
        return
    
    # Ask for confirmation
    if not simulation_mode:
        response = input(f"\nDo you want to remove {len(duplicates)} duplicate groups? (yes/no): ")
        if response.lower() != 'yes':
            print("❌ Duplicate removal cancelled.")
            return
    
    tickets_to_delete = []
    
    # For each duplicate group, keep the first ticket and mark others for deletion
    for dup in duplicates:
        # Sort by creation time to keep the oldest
        sorted_tickets = sorted(dup['tickets'], key=lambda x: x['created_time'])
        
        # Keep the first (oldest) ticket
        keep_ticket = sorted_tickets[0]
        delete_tickets = sorted_tickets[1:]
        
        print(f"\n📋 Duplicate Group: {dup['key']}")
        print(f"   Keeping: {keep_ticket['playtest_id']} (oldest)")
        print(f"   Deleting: {len(delete_tickets)} duplicates")
        
        for ticket in delete_tickets:
            tickets_to_delete.append({
                'record_id': ticket['record_id'],
                'playtest_id': ticket['playtest_id'],
                'reason': f"Duplicate of {keep_ticket['playtest_id']}"
            })
    
    print(f"\n🗑️  Summary:")
    print(f"  Tickets to delete: {len(tickets_to_delete)}")
    
    if simulation_mode:
        print(f"  🎭 SIMULATION MODE - No tickets will be deleted")
        print(f"\n📋 Would delete these tickets:")
        for i, ticket in enumerate(tickets_to_delete, 1):
            print(f"  {i}. {ticket['playtest_id']} - {ticket['reason']}")
    else:
        print(f"  ✅ LIVE MODE - Tickets will be deleted")
        
        # Actually delete the tickets
        deleted_count = 0
        failed_count = 0
        
        for ticket in tickets_to_delete:
            try:
                print(f"  🗑️  Deleting {ticket['playtest_id']}...")
                response = airtable_request(f"{PLAYTEST_TICKETS_TABLE}/{ticket['record_id']}", {
                    'method': 'DELETE'
                })
                print(f"    ✅ Deleted successfully")
                deleted_count += 1
            except Exception as e:
                print(f"    ❌ Failed to delete: {e}")
                failed_count += 1
        
        print(f"\n🎯 Deletion Results:")
        print(f"  Successfully deleted: {deleted_count}")
        print(f"  Failed to delete: {failed_count}")
    
    return tickets_to_delete

def main():
    """Main function to remove duplicates"""
    print("🚀 Starting Duplicate Removal Process")
    print("=" * 60)
    
    # Ask for mode
    response = input("Do you want to run in simulation mode? (yes/no): ")
    simulation_mode = response.lower() != 'no'
    
    if simulation_mode:
        print("🎭 Running in SIMULATION mode - no tickets will be deleted")
    else:
        print("✅ Running in LIVE mode - duplicates will be deleted")
    
    # Remove duplicates
    deleted_tickets = remove_duplicates(simulation_mode=simulation_mode)
    
    print(f"\n🎯 Summary:")
    if simulation_mode:
        print(f"  🎭 SIMULATION MODE - No tickets were actually deleted")
        print(f"  Would have deleted: {len(deleted_tickets)} tickets")
    else:
        print(f"  ✅ LIVE MODE - Duplicate removal completed")
        print(f"  Deleted: {len(deleted_tickets)} tickets")
    
    # Show final count
    try:
        response = airtable_request(PLAYTEST_TICKETS_TABLE, {'method': 'GET'})
        total_tickets = len(response.get('records', []))
        print(f"  Total tickets remaining: {total_tickets}")
    except Exception as e:
        print(f"  Could not fetch final ticket count: {e}")

if __name__ == "__main__":
    main()
