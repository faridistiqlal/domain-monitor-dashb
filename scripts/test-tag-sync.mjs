#!/usr/bin/env node

/**
 * Test Tag Sync to Firebase
 * Usage: node scripts/test-tag-sync.mjs
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDfqw-nxQzP_nDGPSqHEtYvKf3Y9nVN5zg',
  authDomain: 'kendal-monitor.firebaseapp.com',
  projectId: 'kendal-monitor',
  storageBucket: 'kendal-monitor.firebasestorage.app',
  messagingSenderId: '1033750859355',
  appId: '1:1033750859355:web:fc2e8d3a5f8f7b5d8a4f3e'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testTagSync() {
  console.log('🧪 Testing Tag Sync to Firebase...\n');
  
  try {
    // Step 1: Read current tags
    console.log('📖 Step 1: Reading current tags from Firebase...');
    const docRef = doc(db, 'tags', 'default-user');
    const docSnap = await getDoc(docRef);
    
    let currentTags = [];
    if (docSnap.exists()) {
      currentTags = docSnap.data().tags || [];
      console.log(`✅ Found ${currentTags.length} existing tags:`);
      currentTags.forEach((tag, i) => {
        console.log(`   ${i + 1}. ${tag.name} (${tag.id})`);
      });
    } else {
      console.log('⚠️  No tags document found, will create new one');
    }
    
    // Step 2: Add a test tag
    console.log('\n➕ Step 2: Adding a test tag...');
    const testTag = {
      id: `tag-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `Test Tag ${new Date().toLocaleTimeString()}`,
      color: 'oklch(0.70 0.22 145)',
      createdAt: Date.now()
    };
    
    const updatedTags = [...currentTags, testTag];
    console.log(`✅ Test tag created: "${testTag.name}"`);
    
    // Step 3: Sync to Firebase
    console.log('\n💾 Step 3: Syncing to Firebase...');
    await setDoc(docRef, {
      tags: updatedTags,
      updatedAt: Date.now()
    }, { merge: true });
    console.log('✅ Successfully synced to Firebase');
    
    // Step 4: Verify
    console.log('\n🔍 Step 4: Verifying sync...');
    const verifySnap = await getDoc(docRef);
    if (verifySnap.exists()) {
      const verifiedTags = verifySnap.data().tags || [];
      console.log(`✅ Verified: ${verifiedTags.length} tags in Firebase`);
      
      const foundTestTag = verifiedTags.find(t => t.id === testTag.id);
      if (foundTestTag) {
        console.log(`✅ Test tag found: "${foundTestTag.name}"`);
        console.log('\n✨ Tag sync is working correctly!');
      } else {
        console.log('❌ Test tag NOT found in Firebase!');
      }
    } else {
      console.log('❌ Could not verify - document not found');
    }
    
  } catch (error) {
    console.error('❌ Error during test:', error.message);
  }
  
  process.exit(0);
}

testTagSync();
