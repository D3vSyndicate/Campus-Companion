import type { ManageConfig } from './types';

export const FAQ_CATEGORIES = [
  'Registration',
  'Timetables',
  'Venues',
  'Modules',
  'Student cards',
  'Computer labs',
  'Wi-Fi',
  'Funda',
  'Assessments',
  'Support services',
  'Who to contact',
];

export const SHUTTLE_SHIFTS = [
  { value: 'morning', label: 'Morning' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'night', label: 'Night' },
];

const asOptions = (values: string[]) => values.map((value) => ({ value, label: value }));

const text = (row: Record<string, unknown>, key: string) => String(row[key] ?? '').trim();

export const faqConfig: ManageConfig = {
  table: 'FAQ',
  pk: 'faq_id',
  title: 'FAQs',
  description: 'Answers to common questions. Students see them grouped by category.',
  itemNoun: 'FAQ',
  orderBy: [{ column: 'category' }],
  fields: [
    { key: 'question', label: 'Question', type: 'multiline', required: true, placeholder: 'What should I do if I cannot access Funda?' },
    { key: 'answer', label: 'Answer', type: 'multiline', required: true, placeholder: 'Write it kindly and simply. Many new students ask this.' },
    { key: 'category', label: 'Category', type: 'select', required: true, options: asOptions(FAQ_CATEGORIES), allowCustom: true },
  ],
  listTitle: (row) => text(row, 'question'),
  listSubtitle: (row) => text(row, 'category'),
};

export const venueConfig: ManageConfig = {
  table: 'Venue',
  pk: 'venue_id',
  title: 'Venue information',
  description: 'Rooms, directions and accessibility notes. Venues can be chosen when you add a schedule item.',
  itemNoun: 'Venue',
  orderBy: [{ column: 'venue_name' }],
  fields: [
    { key: 'venue_name', label: 'Venue name', type: 'text', required: true, placeholder: 'North Auditorium' },
    { key: 'building', label: 'Building', type: 'text' },
    { key: 'room_number', label: 'Room number', type: 'text' },
    { key: 'directions', label: 'Directions', type: 'multiline', placeholder: 'Start at the main entrance and follow the signs to...' },
    { key: 'map_link', label: 'Online map link', type: 'text', placeholder: 'https://maps.google.com/...' },
    { key: 'accessibilty_notes', label: 'Accessibility notes', type: 'multiline', placeholder: 'Step-free entrance on the east side' },
    {
      key: 'latitude',
      label: 'Map latitude',
      type: 'decimal',
      placeholder: '-34.0091',
      help: 'Puts this venue on the campus map. In Google Maps, press and hold the spot, then copy the two numbers shown (latitude first).',
    },
    { key: 'longitude', label: 'Map longitude', type: 'decimal', placeholder: '25.6672', help: 'The second number. Leave both empty to keep the venue off the map.' },
  ],
  listTitle: (row) => text(row, 'venue_name'),
  listSubtitle: (row) => [text(row, 'building'), text(row, 'room_number')].filter(Boolean).join(' · '),
};

export const checklistConfig: ManageConfig = {
  table: 'checklist_item',
  pk: 'checklist_item_id',
  title: 'New student checklist',
  description: 'Tasks students tick off during orientation.',
  itemNoun: 'Task',
  orderBy: [{ column: 'created_at' }],
  fields: [
    { key: 'task_description', label: 'Task', type: 'multiline', required: true, placeholder: 'Activate your student email' },
    {
      key: 'category',
      label: 'Category',
      type: 'select',
      allowCustom: true,
      options: asOptions(['Registration', 'Orientation', 'Administration', 'Digital', 'Support']),
    },
  ],
  onCreate: () => ({ completion_status: 'false' }),
  listTitle: (row) => text(row, 'task_description'),
  listSubtitle: (row) => text(row, 'category'),
};

export const announcementConfig: ManageConfig = {
  table: 'Announcement',
  pk: 'announcement_id',
  title: 'Announcements',
  description: 'Clear, calm updates for students. Urgent messages should reassure, not alarm.',
  itemNoun: 'Announcement',
  fields: [
    { key: 'title', label: 'Title', type: 'text', required: true, placeholder: 'Welcome session moved to 10:00' },
    { key: 'message', label: 'Message', type: 'multiline', required: true, placeholder: 'What happened and what students should do next.' },
    {
      key: 'priority_level',
      label: 'Priority',
      type: 'select',
      required: true,
      default: 'Medium',
      options: asOptions(['Low', 'Medium', 'High', 'Urgent']),
    },
  ],
  onCreate: (user) => ({ posted_by: user.email }),
  listTitle: (row) => text(row, 'title'),
  listSubtitle: (row) => [text(row, 'priority_level'), text(row, 'posted_by')].filter(Boolean).join(' · '),
};

export const supportConfig: ManageConfig = {
  table: 'Support_pathway',
  pk: 'support_pathway_Id',
  title: 'Support pathways',
  description: 'The "I need help with..." options students see in the Support tab. Say what to do next, and who can help.',
  itemNoun: 'Pathway',
  orderBy: [{ column: 'student_need' }],
  fields: [
    { key: 'student_need', label: 'Student need', type: 'text', required: true, placeholder: 'I need academic help' },
    { key: 'recommended_contact', label: 'Recommended contact', type: 'text', placeholder: 'Lecturer or Academic Advisor' },
    { key: 'recommended_action', label: 'Recommended next step', type: 'multiline', placeholder: 'Asking early is a smart academic habit. Start by...' },
    {
      key: 'related_faq',
      label: 'Related FAQ',
      type: 'text',
      placeholder: 'Funda',
      help: 'An FAQ category (like Funda) or the exact question. Students get a shortcut to those answers.',
    },
    {
      key: 'related_resource',
      label: 'Related resource',
      type: 'text',
      placeholder: 'Emthonjeni Student Wellness, or a link starting with https://',
      help: 'The office or service to visit. A link opens in the browser.',
    },
  ],
  listTitle: (row) => text(row, 'student_need'),
  listSubtitle: (row) => text(row, 'recommended_contact'),
};

export const shuttleConfig: ManageConfig = {
  table: 'shuttle_times',
  pk: 'shuttle_id',
  title: 'Shuttle times',
  description: 'Morning, afternoon and night shuttle departures shown on the student home screen.',
  itemNoun: 'Shuttle',
  orderBy: [{ column: 'departure_time' }],
  fields: [
    { key: 'shift', label: 'Shift', type: 'select', required: true, default: 'morning', options: SHUTTLE_SHIFTS },
    { key: 'departure_time', label: 'Departure time (HH:MM)', type: 'time', required: true, placeholder: '07:15' },
    { key: 'route_name', label: 'Route', type: 'text', required: true, placeholder: 'Residence to Campus' },
    { key: 'pickup_point', label: 'Pick-up point', type: 'text' },
    { key: 'dropoff_point', label: 'Drop-off point', type: 'text' },
    { key: 'days', label: 'Days', type: 'text', required: true, default: 'Mon - Fri' },
    { key: 'notes', label: 'Notes', type: 'multiline' },
    { key: 'is_active', label: 'Running', type: 'boolean', default: true, help: 'Turn off to hide a shuttle without deleting it.' },
  ],
  listTitle: (row) => `${text(row, 'departure_time').slice(0, 5)} · ${text(row, 'route_name')}`,
  listSubtitle: (row) =>
    [text(row, 'shift'), text(row, 'days'), row.is_active === false ? 'Not running' : ''].filter(Boolean).join(' · '),
};

export const readinessModuleConfig: ManageConfig = {
  table: 'digital_readiness',
  pk: 'id',
  title: 'Digital readiness modules',
  description:
    'Topics in the new-student tutorial, such as basic computer skills, Funda, printing and Wi-Fi.',
  itemNoun: 'Module',
  orderBy: [{ column: 'sort_order' }],
  fields: [
    {
      key: 'name',
      label: 'Module name',
      type: 'text',
      required: true,
      placeholder: 'Printing on campus',
    },
    {
      key: 'description',
      label: 'Short description',
      type: 'multiline',
      placeholder: 'Learn how to print your assignments on campus.',
    },
    {
      key: 'sort_order',
      label: 'Order (1 shows first)',
      type: 'number',
      default: 0,
    },
    {
      key: 'reference_url',
      label: 'Reference link',
      type: 'text',
      placeholder: 'https://...',
    },
    {
      key: 'video_url',
      label: 'Video link',
      type: 'text',
      placeholder: 'https://...',
    },
  ],
  listTitle: (row) => text(row, 'name'),
  listSubtitle: (row) => text(row, 'description'),
};

export const readinessStepConfig: ManageConfig = {
  table: 'readiness_steps',
  pk: 'step_id',
  title: 'Digital readiness steps',
  description: 'One screen of the tutorial: a short explanation with an optional image or video.',
  itemNoun: 'Step',
  orderBy: [{ column: 'module_id' }, { column: 'sort_order' }],
  lookups: [{ fieldKey: 'module_id', table: 'digital_readiness', valueColumn: 'id', labelColumn: 'name' }],
  fields: [
    { key: 'module_id', label: 'Module', type: 'select', required: true, lookupOptions: true },
    { key: 'sort_order', label: 'Step number (1 shows first)', type: 'number', default: 1 },
    { key: 'title', label: 'Step title', type: 'text', required: true, placeholder: 'Choose the printer' },
    { key: 'body', label: 'Instructions', type: 'multiline', placeholder: 'Explain this step simply and kindly.' },
    {
      key: 'media_type',
      label: 'Media',
      type: 'select',
      default: 'none',
      options: [
        { value: 'none', label: 'None' },
        { value: 'image', label: 'Image' },
        { value: 'video', label: 'Video' },
      ],
    },
    {
      key: 'media_url',
      label: 'Image or video link',
      type: 'text',
      placeholder: 'https://...supabase.co/storage/v1/object/public/readiness-media/...',
      help: 'Upload the file in Supabase Storage (bucket: readiness-media), then paste its public link here.',
    },
    { key: 'link_url', label: 'Button link (optional)', type: 'text', placeholder: 'https://funda.mandela.ac.za' },
    { key: 'link_label', label: 'Button label (optional)', type: 'text', placeholder: 'Open Funda' },
  ],
  listTitle: (row) => text(row, 'title'),
  listSubtitle: (row, labels) =>
    `${labels.module_id?.[text(row, 'module_id')] ?? 'Module'} · step ${text(row, 'sort_order')}${
      text(row, 'media_type') && text(row, 'media_type') !== 'none' ? ` · ${text(row, 'media_type')}` : ''
    }`,
};

export const tribeConfig: ManageConfig = {
  table: 'community_groups',
  pk: 'id',
  title: 'Tribes',
  description: 'Mentor groups that first-years chat in. Students are placed in the tribe with the fewest members. Place buddies under Buddies.',
  itemNoun: 'Tribe',
  orderBy: [{ column: 'name' }],
  fields: [
    { key: 'name', label: 'Tribe name', type: 'text', required: true, placeholder: 'Tribe 1' },
    { key: 'mentor_name', label: 'Buddy or mentor name (shown to the tribe)', type: 'text', placeholder: 'Sipho' },
  ],
  listTitle: (row) => text(row, 'name'),
  listSubtitle: (row) =>
    [text(row, 'mentor_name'), `${text(row, 'member_count') || '0'} members`].filter(Boolean).join(' · '),
};

export const faqSuggestionConfig: ManageConfig = {
  table: 'faq_suggestions',
  pk: 'suggestion_id',
  title: 'FAQ suggestions',
  description: 'Questions buddies keep hearing. Add the real answer under FAQs, then mark the suggestion as added, or dismiss it.',
  itemNoun: 'Suggestion',
  orderBy: [{ column: 'created_at', ascending: false }],
  fields: [
    { key: 'question', label: 'Question', type: 'multiline', required: true },
    { key: 'note', label: 'Note from the buddy', type: 'multiline' },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      default: 'new',
      options: [
        { value: 'new', label: 'New' },
        { value: 'added', label: 'Added to FAQs' },
        { value: 'dismissed', label: 'Dismissed' },
      ],
    },
  ],
  listTitle: (row) => text(row, 'question'),
  listSubtitle: (row) => text(row, 'status') || 'new',
};
