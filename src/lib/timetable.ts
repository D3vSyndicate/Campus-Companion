import AsyncStorage from '@react-native-async-storage/async-storage';

// The timetable itself is mock data that ships with the app (src/data/timetable-data.ts). This file
// only holds the one thing that is per-student: which class group they are in.

// A student picks their class group once and the calendar remembers it on this phone. Nothing about
// the student's registration is available to the app, so there is no way to infer it for them.
const STREAM_KEY = 'timetable:stream';

export async function readStreamPreference(userId: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(`${STREAM_KEY}:${userId}`);
  } catch {
    return null;
  }
}

export async function saveStreamPreference(userId: string, stream: string): Promise<void> {
  try {
    await AsyncStorage.setItem(`${STREAM_KEY}:${userId}`, stream);
  } catch {
    // They will be asked to pick again next time. Not worth an error.
  }
}
