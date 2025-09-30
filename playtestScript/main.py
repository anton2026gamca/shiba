import os
from dotenv import load_dotenv
import requests
import random
import time
import uuid
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

def createPlaytest(gameToTest, userToPlayGame):
    """
    Create a new playtest ticket record
    
    Args:
        gameToTest (str): The record ID of the game to test
        userToPlayGame (str): The record ID of the user who will play the game
    
    Returns:
        dict: The created record
    """
    # Generate a unique PlaytestId
    playtest_id = str(uuid.uuid4())
    
    # Prepare the record data
    record_data = {
        "fields": {
            "PlaytestId": playtest_id,
            "GameToTest": [gameToTest],  # Linked record to Game
            "Player": [userToPlayGame]   # Linked record to User
        }
    }
    
    print(f"  🎫 Creating playtest ticket...")
    print(f"    PlaytestId: {playtest_id}")
    print(f"    GameToTest: {gameToTest}")
    print(f"    Player: {userToPlayGame}")
    
    try:
        # Create the record
        response = airtable_request(PLAYTEST_TICKETS_TABLE, {
            'method': 'POST',
            'json': record_data
        })
        
        created_record = response.get('records', [{}])[0]
        print(f"    ✅ Playtest ticket created successfully!")
        print(f"    Record ID: {created_record.get('id')}")
        
        return created_record
        
    except Exception as e:
        print(f"    ❌ Error creating playtest ticket: {e}")
        raise

def fetch_all_ysws_records():
    """Fetch all records from the Active YSWS Record table"""
    all_records = []
    offset = None
    
    while True:
        params = {'pageSize': 100}
        if offset:
            params['offset'] = offset
        
        try:
            page = airtable_request(f"Active YSWS Record?{requests.compat.urlencode(params)}", {
                'method': 'GET'
            })
            
            page_records = page.get('records', [])
            all_records.extend(page_records)
            offset = page.get('offset')
            
            if not offset:
                break
                
        except Exception as e:
            print(f"Error fetching records: {e}")
            break
    
    return all_records

def visualize_circular_assignment(simulation_mode=False):
    """Visualize the circular assignment algorithm step by step"""
    mode_text = "SIMULATION" if simulation_mode else "LIVE"
    print(f"🎯 Circular Assignment Algorithm Visualization ({mode_text})")
    print("=" * 60)
    
    # Fetch data
    records = fetch_all_ysws_records()
    
    # Filter records with TicketsNeeded > 0
    eligible_records = []
    for record in records:
        fields = record.get('fields', {})
        tickets_needed = fields.get('TicketsNeeded', 0)
        if tickets_needed > 0:
            eligible_records.append({
                'record_id': record.get('id'),
                'user_id': fields.get('User', [None])[0] if fields.get('User') else None,
                'game_id': fields.get('Game', [None])[0] if fields.get('Game') else None,
                'game_name': fields.get('Game Name', ['Unknown'])[0] if fields.get('Game Name') else 'Unknown',
                'email': fields.get('Email', 'Unknown'),
                'tickets_needed': tickets_needed
            })
    
    # Create circular lists
    games_needing_playtests = []
    players_available = []
    
    for record in eligible_records:
        # Add games to the pool
        for _ in range(record['tickets_needed']):
            games_needing_playtests.append({
                'game_id': record['game_id'],
                'game_name': record['game_name'],
                'owner_user_id': record['user_id'],
                'owner_email': record['email']
            })
        
        # Add players to the pool (each person should play tickets_needed games)
        for _ in range(record['tickets_needed']):
            players_available.append({
                'user_id': record['user_id'],
                'email': record['email']
            })
    
    print(f"📊 Setup:")
    print(f"  Games needing playtests: {len(games_needing_playtests)}")
    print(f"  Players available: {len(players_available)}")
    if simulation_mode:
        print(f"  🎭 Running in SIMULATION mode - no tickets will be created")
    print()
    
    # Shuffle both lists
    random.shuffle(games_needing_playtests)
    random.shuffle(players_available)
    
    # Create circular assignment visualization
    assignments = []
    game_index = 0
    player_index = 0
    attempts = 0
    max_attempts = len(players_available) * 2  # Prevent infinite loops
    
    print("🔄 Circular Assignment Process:")
    print("=" * 60)
    
    while game_index < len(games_needing_playtests) and attempts < max_attempts:
        current_game = games_needing_playtests[game_index]
        attempts += 1
        
        # Find next available player in circular fashion
        original_player_index = player_index
        found_player = False
        
        print(f"\n🎮 Game {game_index + 1}: {current_game['game_name']} (by {current_game['owner_email']})")
        print(f"   Looking for player...")
        
        # Try to find a suitable player by moving through the circle
        while player_index < len(players_available) and not found_player:
            current_player = players_available[player_index]
            
            # Check if this player is suitable
            if (current_player['user_id'] != current_game['owner_user_id'] and 
                current_player['user_id'] is not None):
                
                # Check if this player already has this game assigned
                already_assigned = any(
                    a['player_user_id'] == current_player['user_id'] and 
                    a['game_id'] == current_game['game_id'] 
                    for a in assignments
                )
                
                if not already_assigned:
                    # Found a suitable player!
                    assignments.append({
                        'game_id': current_game['game_id'],
                        'game_name': current_game['game_name'],
                        'owner_email': current_game['owner_email'],
                        'player_email': current_player['email'],
                        'player_user_id': current_player['user_id']
                    })
                    
                    print(f"   ✅ Found: {current_player['email']}")
                    print(f"   📍 Player index: {player_index}")
                    
                    # Actually create the playtest ticket (only if not in simulation mode)
                    if not simulation_mode:
                        try:
                            created_ticket = createPlaytest(current_game['game_id'], current_player['user_id'])
                            print(f"   🎫 Created ticket: {created_ticket.get('id')}")
                        except Exception as e:
                            print(f"   ❌ Failed to create ticket: {e}")
                    else:
                        print(f"   🎫 [SIMULATION] Would create ticket for {current_player['email']} → {current_game['game_name']}")
                    
                    found_player = True
                    game_index += 1
                    player_index += 1  # Move to next player for next game
                else:
                    print(f"   ⚠️  {current_player['email']} already has this game")
                    player_index += 1
            else:
                if current_player['user_id'] == current_game['owner_user_id']:
                    print(f"   ❌ {current_player['email']} is the owner (skip)")
                else:
                    print(f"   ❌ {current_player['email']} has no user_id (skip)")
                player_index += 1
        
        # If we went through all players and didn't find one, wrap around
        if not found_player:
            if player_index >= len(players_available):
                print(f"   🔄 Wrapping around to start of player list")
                player_index = 0
                
                # Try one more time through the list
                while player_index < original_player_index and not found_player:
                    current_player = players_available[player_index]
                    
                    if (current_player['user_id'] != current_game['owner_user_id'] and 
                        current_player['user_id'] is not None):
                        
                        already_assigned = any(
                            a['player_user_id'] == current_player['user_id'] and 
                            a['game_id'] == current_game['game_id'] 
                            for a in assignments
                        )
                        
                        if not already_assigned:
                            assignments.append({
                                'game_id': current_game['game_id'],
                                'game_name': current_game['game_name'],
                                'owner_email': current_game['owner_email'],
                                'player_email': current_player['email'],
                                'player_user_id': current_player['user_id']
                            })
                            
                            print(f"   ✅ Found on wrap-around: {current_player['email']}")
                            print(f"   📍 Player index: {player_index}")
                            
                            # Actually create the playtest ticket (only if not in simulation mode)
                            if not simulation_mode:
                                try:
                                    created_ticket = createPlaytest(current_game['game_id'], current_player['user_id'])
                                    print(f"   🎫 Created ticket: {created_ticket.get('id')}")
                                except Exception as e:
                                    print(f"   ❌ Failed to create ticket: {e}")
                            else:
                                print(f"   🎫 [SIMULATION] Would create ticket for {current_player['email']} → {current_game['game_name']}")
                            
                            found_player = True
                            game_index += 1
                            player_index += 1
                        else:
                            player_index += 1
                    else:
                        player_index += 1
                
                if not found_player:
                    print(f"   ❌ Could not find suitable player after full circle")
                    game_index += 1  # Skip this game
                    player_index = original_player_index + 1  # Try next player for next game
    
    print(f"\n🎯 Assignment Results:")
    print(f"  Successful assignments: {len(assignments)}")
    print(f"  Games processed: {game_index}")
    print(f"  Total attempts: {attempts}")
    if simulation_mode:
        print(f"  🎭 SIMULATION MODE - No actual tickets were created")
    
    # Show assignments in a nice format
    print(f"\n📋 Assignments Made:")
    print("-" * 60)
    for i, assignment in enumerate(assignments[:20]):  # Show first 20
        print(f"{i+1:2d}. {assignment['player_email'][:25]:<25} → {assignment['game_name']}")
    
    if len(assignments) > 20:
        print(f"    ... and {len(assignments) - 20} more assignments")
    
    # Analyze distribution
    print(f"\n⚖️  Distribution Analysis:")
    player_counts = defaultdict(int)
    game_counts = defaultdict(int)
    
    for assignment in assignments:
        player_counts[assignment['player_email']] += 1
        game_counts[assignment['game_name']] += 1
    
    print(f"  Top 10 players by assignments:")
    for email, count in sorted(player_counts.items(), key=lambda x: x[1], reverse=True)[:10]:
        print(f"    {email[:30]:<30}: {count} assignments")
    
    print(f"\n  Games and their playtest counts:")
    for game_name, count in sorted(game_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"    {game_name[:30]:<30}: {count} playtests")
    
    return assignments

def main():
    """Main function to run the visualization and create tickets"""
    print("🚀 Starting Circular Assignment with Real Ticket Creation")
    print("=" * 60)
    
    # Ask for confirmation before creating tickets
    response = input("Do you want to create actual playtest tickets? (yes/no): ")
    simulation_mode = response.lower() != 'yes'
    
    if simulation_mode:
        print("🎭 Running in SIMULATION mode - no tickets will be created")
    else:
        print("✅ Running in LIVE mode - tickets will be created")
    
    assignments = visualize_circular_assignment(simulation_mode=simulation_mode)
    
    print(f"\n🎯 Summary:")
    print(f"  Total assignments processed: {len(assignments)}")
    if simulation_mode:
        print(f"  🎭 SIMULATION MODE - No tickets were created")
    else:
        print(f"  ✅ LIVE MODE - Playtest tickets created in Airtable")
    print(f"  Algorithm is scalable to any number of participants")
    
    # Show final count of tickets (only in live mode)
    if not simulation_mode:
        try:
            response = airtable_request(PLAYTEST_TICKETS_TABLE, {'method': 'GET'})
            total_tickets = len(response.get('records', []))
            print(f"  Total tickets in PlaytestTickets table: {total_tickets}")
        except Exception as e:
            print(f"  Could not fetch final ticket count: {e}")
    else:
        print(f"  🎭 SIMULATION MODE - Skipping ticket count check")

if __name__ == "__main__":
    main()
