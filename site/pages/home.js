import { useState, useRef, useEffect } from "react";
import SocialStartScreen from "../components/SocialStartScreen";

export default function Home({ games, gamesError }) {
  return (
    <div>
      <SocialStartScreen games={games} gamesError={gamesError} />
    </div>
  );
}

export async function getStaticProps() {
  try {
    // Use localhost for development, production URL for build
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://shiba.hackclub.com' 
      : 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/GetAllGames?build=true&full=true`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch games');
    }

    const games = await response.json();

    return {
      props: {
        games,
        gamesError: null
      },
      // Cache for 1 hour (3600 seconds)
      revalidate: 3600
    };
  } catch (error) {
    console.error('Error fetching games:', error);
    return {
      props: {
        games: null,
        gamesError: error.message || 'Failed to load games'
      }
    };
  }
}
