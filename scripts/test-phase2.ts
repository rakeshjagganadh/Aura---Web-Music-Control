/**
 * Phase 2.1 Runtime QA & Verification Automated Test Suite
 * Tests live API endpoints, search coordinator ranking, radio browser filters, and error isolation.
 */

import { jamendoProvider } from '../src/services/providers/jamendoProvider';
import { radioBrowserProvider } from '../src/services/providers/radioBrowserProvider';
import { audiusService } from '../src/services/audiusService';
import { UniversalSearchCoordinator } from '../src/services/sourceAdapters';

async function runPhase2QA() {
  console.log('=== AURA 2.0 — PHASE 2.1 AUTOMATED QA TEST SUITE ===\n');

  // Test 1: Jamendo Provider Health & Trending
  console.log('1. Testing Jamendo Provider...');
  try {
    const isJamendoAvailable = await jamendoProvider.isAvailable();
    console.log(`   Jamendo isAvailable(): ${isJamendoAvailable ? 'YES' : 'NO'}`);
    const trending = await jamendoProvider.getTrending({ limit: 3 });
    console.log(`   Jamendo getTrending(3): Received ${trending.length} tracks.`);
    if (trending.length > 0) {
      console.log(`   - Sample Track: "${trending[0].title}" by ${trending[0].artist} [Format: ${trending[0].fileFormat}]`);
      console.log(`   - Stream URL: ${trending[0].streamUrl ? 'Valid Direct URL' : 'Missing'}`);
    }
  } catch (err: any) {
    console.error('   Jamendo test error:', err?.message || err);
  }

  // Test 2: Audius Provider Health & Trending
  console.log('\n2. Testing Audius Provider...');
  try {
    const host = await audiusService.getHost();
    console.log(`   Audius Resolved Gateway Host: ${host}`);
    const trendingRes = await audiusService.getTrending(3);
    console.log(`   Audius getTrending(3): Received ${trendingRes.items?.length || 0} tracks. Status: ${trendingRes.error || 'OK'}`);
    if (trendingRes.items && trendingRes.items.length > 0) {
      console.log(`   - Sample Track: "${trendingRes.items[0].title}" by ${trendingRes.items[0].artist}`);
      console.log(`   - Stream URL: ${trendingRes.items[0].audioUrl}`);
    }
  } catch (err: any) {
    console.error('   Audius test error:', err?.message || err);
  }

  // Test 3: Radio Browser Filters & Discovery
  console.log('\n3. Testing Radio Browser Provider...');
  try {
    const isRadioAvailable = await radioBrowserProvider.isAvailable();
    console.log(`   Radio Browser isAvailable(): ${isRadioAvailable ? 'YES' : 'NO'}`);
    
    const topVoted = await radioBrowserProvider.getTopVotedStations(3);
    console.log(`   Radio Browser getTopVotedStations(3): Received ${topVoted.length} stations.`);
    if (topVoted.length > 0) {
      console.log(`   - Top Station: "${topVoted[0].name}" [Country: ${topVoted[0].country}, Codec: ${topVoted[0].codec}]`);
      console.log(`   - Stream URL: ${topVoted[0].streamUrl}`);
    }

    const jazzStations = await radioBrowserProvider.getStationsByTag('jazz', 2);
    console.log(`   Radio Browser getStationsByTag('jazz', 2): Received ${jazzStations.length} stations.`);

    const usStations = await radioBrowserProvider.getStationsByCountry('US', 2);
    console.log(`   Radio Browser getStationsByCountry('US', 2): Received ${usStations.length} stations.`);
  } catch (err: any) {
    console.error('   Radio Browser test error:', err?.message || err);
  }

  // Test 4: Universal Search Coordinator & Relevance Ranking
  console.log('\n4. Testing Universal Search Coordinator & Relevance Ranking...');
  try {
    const coordinator = new UniversalSearchCoordinator();
    const searchRes = await coordinator.search('rock', { tracks: [], playlists: [] }, {
      includeJamendo: true,
      includeAudius: true,
      includeRadio: true,
      includeYouTube: false
    });

    console.log(`   Universal Search for 'rock': Returned ${searchRes.songs.length} total songs across sources.`);
    console.log(`   Source Status:`, searchRes.sourceStatus);
    if (searchRes.songs.length > 0) {
      console.log(`   - Top Ranked Result: "${searchRes.songs[0].title}" by ${searchRes.songs[0].artist} [Source: ${searchRes.songs[0].source}]`);
    }
  } catch (err: any) {
    console.error('   Universal Search test error:', err?.message || err);
  }

  console.log('\n=== QA VERIFICATION SCRIPT EXECUTED ===');
}

runPhase2QA().catch(console.error);
