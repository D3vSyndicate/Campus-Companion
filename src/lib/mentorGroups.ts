import { supabase } from './superbase';

// Everything the mentor group screens ask the database. Names come from small database functions, because
// the sign-in table is not open to the app: each function hands back only what that person may see (see
// supabase/migrations/20260920130000_mentor_groups_live.sql).

export type GroupOverview = {
  id: string;
  name: string;
  programme: string;
  description: string;
  maxCapacity: number;
  memberCount: number;
  pendingCount: number;
  mentorName: string;
  isMine: boolean;
  // Only the group's own mentor is given this.
  qrToken: string | null;
};

export type GroupMember = { studentId: string; name: string; studentNumber: string; joinedAt: Date };
export type JoinRequest = { id: string; studentId: string; name: string; studentNumber: string; requestedAt: Date };
export type Priority = 'normal' | 'important' | 'urgent';
export type GroupNote = { id: string; title: string; message: string; priority: Priority; createdAt: Date };
export type MyGroupState = { groupId: string; groupName: string; state: 'member' | 'pending' | 'rejected' | 'removed' };

type Row = Record<string, unknown>;
const text = (value: unknown) => String(value ?? '').trim();
const when = (value: unknown) => {
  const date = new Date(text(value));
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

// True when the error means the database script has not been run yet, so a screen can say so kindly.
export const isMissingSetup = (error: { code?: string; message?: string } | null | undefined) =>
  Boolean(error && (error.code === 'PGRST202' || error.code === '42883' || /could not find the function|schema cache/i.test(error.message ?? '')));

export async function fetchOverview(groupId: string) {
  const { data, error } = await supabase.rpc('mentor_group_overview', { target_group: groupId });
  if (error) return { group: null, error };
  const row = (Array.isArray(data) ? data[0] : data) as Row | undefined;
  if (!row) return { group: null, error: null };
  const group: GroupOverview = {
    id: text(row.id),
    name: text(row.name),
    programme: text(row.programme),
    description: text(row.description),
    maxCapacity: Number(row.max_capacity ?? 0),
    memberCount: Number(row.member_count ?? 0),
    pendingCount: Number(row.pending_count ?? 0),
    mentorName: text(row.mentor_name),
    isMine: row.is_mine === true,
    qrToken: row.qr_token ? text(row.qr_token) : null,
  };
  return { group, error: null };
}

export async function fetchMembers(groupId: string) {
  const { data, error } = await supabase.rpc('list_mentor_group_members', { target_group: groupId });
  const members: GroupMember[] = ((data ?? []) as Row[]).map((row) => ({
    studentId: text(row.student_id),
    name: text(row.student_name) || 'Student',
    studentNumber: text(row.student_number),
    joinedAt: when(row.joined_at),
  }));
  return { members, error };
}

export async function fetchRequests(groupId: string) {
  const { data, error } = await supabase.rpc('list_mentor_group_requests', { target_group: groupId });
  const requests: JoinRequest[] = ((data ?? []) as Row[]).map((row) => ({
    id: text(row.id),
    studentId: text(row.student_id),
    name: text(row.student_name) || 'Student',
    studentNumber: text(row.student_number),
    requestedAt: when(row.requested_at),
  }));
  return { requests, error };
}

export const removeMember = (groupId: string, studentId: string) =>
  supabase.rpc('remove_mentor_group_member', { target_group: groupId, member: studentId });

export const reviewRequest = (requestId: string, decision: 'approved' | 'rejected') =>
  supabase.rpc('review_mentor_group_request', { request_id: requestId, decision });

export async function regenerateQr(groupId: string) {
  const { data, error } = await supabase.rpc('regenerate_mentor_group_qr', { target_group: groupId });
  return { token: data ? text(data) : null, error };
}

export async function fetchMyState() {
  const { data, error } = await supabase.rpc('my_mentor_group_state');
  const row = (Array.isArray(data) ? data[0] : data) as Row | undefined;
  if (error || !row) return { state: null as MyGroupState | null, error };
  return { state: { groupId: text(row.group_id), groupName: text(row.group_name), state: text(row.state) as MyGroupState['state'] }, error: null };
}

const asNote = (row: Row): GroupNote => ({
  id: text(row.id),
  title: text(row.title),
  message: text(row.message),
  priority: (['important', 'urgent'].includes(text(row.priority)) ? text(row.priority) : 'normal') as Priority,
  createdAt: when(row.created_at),
});

export async function fetchNotes(groupId: string) {
  const { data, error } = await supabase
    .from('mentor_group_announcements')
    .select('id, title, message, priority, created_at')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false });
  return { notes: ((data ?? []) as Row[]).map(asNote), error };
}

export const postNote = (groupId: string, title: string, message: string, priority: Priority) =>
  supabase.from('mentor_group_announcements').insert({ group_id: groupId, title, message, priority });

export const deleteNote = (noteId: string) => supabase.from('mentor_group_announcements').delete().eq('id', noteId);

// What a group's QR code holds. The token, not the group's id, so replacing the token really does stop an old code.
export const qrPayload = (token: string) => `mentor-group:${token}`;

// The groups a student can ask to join, with a true head count and the mentor's name.
export type OpenGroup = { id: string; name: string; programme: string; mentor: string; description: string; members: number; capacity: number };

export async function fetchOpenGroups() {
  const { data, error } = await supabase.rpc('list_open_mentor_groups');
  const groups: OpenGroup[] = ((data ?? []) as Row[]).map((row) => ({
    id: text(row.id),
    name: text(row.name),
    programme: text(row.programme),
    mentor: text(row.mentor_name),
    description: text(row.description),
    members: Number(row.member_count ?? 0),
    capacity: Number(row.max_capacity ?? 0),
  }));
  return { groups, error };
}
