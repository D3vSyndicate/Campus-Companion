import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PageHeader } from '../../components/PageHeader';
import { ShameResilientBanner } from '../../components/ShameResilientBanner';
import { MOCK_SCHEDULE } from '../../mockData';
import { ScheduleItem } from '../../types';
import { supabase } from '../lib/superbase';

export default function ScheduleScreen() {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSchedule = async () => {
      const { data, error } = await supabase.from('schedule_items').select('*');

      if (!error && data?.length) {
        setSchedule(data.map((row, index) => {
          const item = row as Record<string, unknown>;
          return {
            id: String(item.id ?? item.schedule_id ?? index + 1),
            title: String(item.title ?? ''),
            date: String(item.date ?? ''),
            startTime: String(item.start_time ?? item.startTime ?? ''),
            endTime: String(item.end_time ?? item.endTime ?? ''),
            venue: String(item.venue ?? item.location ?? ''),
            description: String(item.description ?? ''),
            category: (item.category ?? 'academic') as ScheduleItem['category'],
            isPast: Boolean(item.is_past ?? item.isPast),
          };
        }));
      } else {
        setSchedule(MOCK_SCHEDULE);
      }

      setLoading(false);
    };

    void loadSchedule();
  }, []);

  const renderItem = ({ item }: { item: ScheduleItem }) => (
    <View style={[styles.card, item.isPast && styles.pastCard]}>
      <View style={styles.timeBadge}>
        <Text style={styles.timeText}>{item.startTime} - {item.endTime}</Text>
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.venue}>📍 Venue: {item.venue}</Text>
      <Text style={styles.desc}>{item.description}</Text>

      {item.isPast ? (
        <View style={styles.recoveryBox}>
          <Text style={styles.recoveryText}>
            This session has passed. Don't worry—you can review materials on Funda or ask a How2buddy mentor for a quick recap!
          </Text>
        </View>
      ) : (
        <TouchableOpacity 
          style={styles.directionBtn}
          onPress={() => Alert.alert("Directions", `Start at main entrance and follow signs to ${item.venue}.`)}
        >
          <Text style={styles.directionText}>Show me where to go</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <PageHeader
        eyebrow="ORIENTATION"
        title="Your schedule"
        subtitle="See what is happening today and find your way to each session."
      />
      <ShameResilientBanner 
        message="If you miss a session, don't worry. Every session has catch-up pathways listed below."
        type="recovery"
      />
      {loading ? (
        <ActivityIndicator size="large" color="#0B1F3A" />
      ) : (
        <FlatList
          data={schedule}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F9', padding: 16 },
  list: { paddingBottom: 20 },
  card: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginBottom: 12 },
  pastCard: { opacity: 0.85, borderColor: '#E2E8F0', borderWidth: 1 },
  timeBadge: { backgroundColor: '#FFF8D9', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginBottom: 8 },
  timeText: { color: '#806414', fontSize: 12, fontWeight: '600' },
  title: { fontSize: 16, fontWeight: 'bold', color: '#0F172A' },
  venue: { fontSize: 13, color: '#0B1F3A', marginVertical: 4 },
  desc: { fontSize: 13, color: '#475569', marginBottom: 10 },
  recoveryBox: { backgroundColor: '#F1F5F9', padding: 10, borderRadius: 6, marginTop: 4 },
  recoveryText: { fontSize: 12, color: '#475569', fontStyle: 'italic' },
  directionBtn: { backgroundColor: '#0B1F3A', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, alignSelf: 'flex-start' },
  directionText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
});