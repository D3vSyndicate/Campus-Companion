import { isRecent, postedAtOf } from '../../lib/announcements';
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

export const EVENT_CATEGORIES = ['Sport', 'Social', 'Culture', 'Academic', 'Wellness', 'Other'];

export const CAMPUS_OPTIONS = ['North Campus', 'South Campus', 'Both campuses'];

export const SPORT_KINDS = [
  { value: 'club', label: 'Sport / club' },
  { value: 'facility', label: 'Facility' },
  { value: 'gym', label: 'Gym' },
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
      omitWhenEmpty: true,
      placeholder: '-34.0091',
      help: 'Puts this venue on the campus map. In Google Maps, press and hold the spot, then copy the two numbers shown (latitude first).',
    },
    { key: 'longitude', label: 'Map longitude', type: 'decimal', omitWhenEmpty: true, placeholder: '25.6672', help: 'The second number. Leave both empty to keep the venue off the map.' },
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
  // Newest first, like students see them.
  orderBy: [{ column: 'posted_by', ascending: false, nullsFirst: false }],
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
  // posted_by is a timestamp column, so it records when the announcement went out.
  onCreate: () => ({ posted_by: new Date().toISOString() }),
  listTitle: (row) => text(row, 'title'),
  listSubtitle: (row) =>
    [isRecent(postedAtOf(row)) ? 'New' : '', text(row, 'priority_level'), text(row, 'posted_by').slice(0, 10)].filter(Boolean).join(' · '),
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
  setupFile: 'supabase/campus_features.sql',
  pk: 'shuttle_id',
  title: 'Shuttle times',
  description: 'Shuttle departures for each stop, shown on the student home screen. Students choose their own stop.',
  itemNoun: 'Shuttle',
  orderBy: [{ column: 'departure_time' }],
  fields: [
    { key: 'shift', label: 'Shift', type: 'select', required: true, default: 'morning', options: SHUTTLE_SHIFTS },
    { key: 'departure_time', label: 'Departure time (HH:MM)', type: 'time', required: true, placeholder: '07:15' },
    { key: 'route_name', label: 'Stop or route', type: 'text', required: true, placeholder: 'Korsten (PSA 163 Durban Rd)', help: 'Students choose their stop from these names, so spell one stop the same way every time.' },
    { key: 'pickup_point', label: 'Pick-up point', type: 'text' },
    { key: 'dropoff_point', label: 'Drop-off point', type: 'text' },
    { key: 'days', label: 'Days', type: 'text', placeholder: 'Mon - Fri', help: 'Optional.' },
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
  title: 'Digital readiness guides',
  description:
    'The guides students follow on the Digital screen, such as computer basics, Funda, printing and Wi-Fi.',
  itemNoun: 'Guide',
  orderBy: [{ column: 'sort_order' }],
  fields: [
    { key: 'name', label: 'Guide name', type: 'text', required: true, placeholder: 'Printing on campus' },
    { key: 'description', label: 'Short description', type: 'multiline', placeholder: 'Learn how to print your assignments on campus.' },
    {
      key: 'steps',
      label: 'Steps',
      type: 'list',
      help: 'One step per line, in the order a student should follow them.',
      placeholder: 'Log in at the printer with your student card\nChoose your document\nCollect your pages',
    },
    { key: 'sort_order', label: 'Order (1 shows first)', type: 'number', default: 0 },
    { key: 'reference_url', label: 'Reference link', type: 'text', placeholder: 'https://...' },
    { key: 'video_url', label: 'Video link', type: 'text', placeholder: 'https://...' },
    {
      key: 'image_urls',
      label: 'Pictures',
      type: 'imageList',
      help: 'One picture per line, as "link | caption". The caption is optional. Students see them under the steps.',
      placeholder: 'https://...supabase.co/storage/v1/object/public/readiness-media/printer.png | The printer in Building 12',
    },
  ],
  listTitle: (row) => text(row, 'name'),
  listSubtitle: (row) => {
    const steps = Array.isArray(row.steps) ? row.steps.length : 0;
    return [steps ? `${steps} steps` : 'No steps yet', text(row, 'description')].filter(Boolean).join(' · ');
  },
};

export const tribeConfig: ManageConfig = {
  table: 'community_groups',
  setupFile: 'supabase/campus_features.sql',
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
  setupFile: 'supabase/campus_features.sql',
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

export const eventConfig: ManageConfig = {
  table: 'event',
  setupFile: 'supabase/migrations/20260919130000_event_schedule.sql',
  pk: 'id',
  title: 'Campus events',
  description: 'What is happening around campus, shown to students under Schedule > Campus events. Past events drop off the student list by themselves.',
  itemNoun: 'Event',
  orderBy: [{ column: 'event_date', ascending: false }, { column: 'start_time' }],
  lookups: [{ fieldKey: 'venue_id', table: 'Venue', valueColumn: 'venue_id', labelColumn: 'venue_name' }],
  fields: [
    { key: 'title', label: 'Event name', type: 'text', required: true },
    { key: 'category', label: 'Category', type: 'select', default: 'Social', options: asOptions(EVENT_CATEGORIES), allowCustom: true },
    { key: 'event_date', label: 'Date (YYYY-MM-DD)', type: 'date', required: true, placeholder: '2027-02-04' },
    { key: 'start_time', label: 'Starts (HH:MM)', type: 'time', placeholder: '10:00' },
    { key: 'end_time', label: 'Ends (HH:MM)', type: 'time', placeholder: '14:00' },
    { key: 'venue_id', label: 'Venue', type: 'select', lookupOptions: true, help: 'Pick a venue so students can tap "Show me where". Add new venues on the Venues screen.' },
    { key: 'organizer', label: 'Organised by', type: 'text' },
    { key: 'description', label: 'Details', type: 'multiline' },
    { key: 'cost', label: 'Cost', type: 'text', placeholder: 'Free' },
    { key: 'signup_url', label: 'Sign-up or info link', type: 'text', placeholder: 'https://...' },
    { key: 'image_url', label: 'Picture link', type: 'text', placeholder: 'https://...' },
    { key: 'is_active', label: 'Visible to students', type: 'boolean', default: true },
  ],
  listTitle: (row) => text(row, 'title'),
  listSubtitle: (row) =>
    [text(row, 'event_date') || 'No date yet', text(row, 'start_time').slice(0, 5), text(row, 'category'), row.is_active === false ? 'Hidden' : '']
      .filter(Boolean)
      .join(' · '),
};

export const sportConfig: ManageConfig = {
  table: 'sport_recreation',
  setupFile: 'supabase/migrations/20260919140000_sport_gym_madibaz.sql',
  pk: 'item_id',
  title: 'Sport & gym',
  description: 'Sports, clubs, facilities and the gym, including how a student signs up.',
  itemNoun: 'Entry',
  orderBy: [{ column: 'sort_order' }, { column: 'name' }],
  fields: [
    { key: 'kind', label: 'Type', type: 'select', required: true, default: 'club', options: SPORT_KINDS },
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'campus', label: 'Campus', type: 'select', options: asOptions(CAMPUS_OPTIONS), allowCustom: true },
    { key: 'venue', label: 'Venue', type: 'text', help: 'Building or field name, so students can find it on the map.' },
    { key: 'description', label: 'About', type: 'multiline' },
    { key: 'schedule', label: 'Training times or opening hours', type: 'multiline' },
    { key: 'cost', label: 'Cost', type: 'text' },
    { key: 'how_to_join', label: 'How to sign up', type: 'multiline', help: 'Write one step per line. Students see them as numbered steps.' },
    { key: 'what_to_bring', label: 'What to bring', type: 'multiline' },
    { key: 'contact_name', label: 'Contact person', type: 'text' },
    { key: 'contact_email', label: 'Contact email', type: 'text' },
    { key: 'contact_phone', label: 'Contact phone', type: 'text' },
    { key: 'link_url', label: 'Link (sign-up form or info page)', type: 'text', placeholder: 'https://...' },
    { key: 'sort_order', label: 'Order in the list', type: 'number', default: 10 },
    { key: 'is_active', label: 'Visible to students', type: 'boolean', default: true },
  ],
  listTitle: (row) => text(row, 'name'),
  listSubtitle: (row) =>
    [text(row, 'kind'), text(row, 'campus'), row.is_active === false ? 'Hidden' : ''].filter(Boolean).join(' · '),
};

export const programmeConfig: ManageConfig = {
  table: 'it_programmes',
  setupFile: 'supabase/migrations/20260919120000_it_programmes.sql',
  pk: 'id',
  title: 'School of IT programmes',
  description: 'Programmes students can browse, with year structure, modules, careers and the academic advisor.',
  itemNoun: 'Programme',
  orderBy: [{ column: 'display_order' }, { column: 'programme_name' }],
  fields: [
    { key: 'programme_name', label: 'Programme name', type: 'text', required: true },
    { key: 'description', label: 'Description', type: 'multiline' },
    {
      key: 'year_structure',
      label: 'Year level structure',
      type: 'multiline',
      placeholder: 'Year 1: ...\nYear 2: ...\nYear 3: ...',
      help: 'One line per year level. Start a line with "Year 1:" to show the year in bold.',
    },
    { key: 'key_modules', label: 'Key modules', type: 'list', help: 'One module per line.' },
    { key: 'career_possibilities', label: 'Career possibilities', type: 'list', help: 'One career per line.' },
    { key: 'academic_expectations', label: 'Academic expectations', type: 'multiline' },
    { key: 'advisor_name', label: 'Advisor name', type: 'text' },
    { key: 'advisor_contact', label: 'Advisor contact', type: 'text', placeholder: 'name@mandela.ac.za or 041 000 0000', help: 'An email address, phone number or link. Students can tap it to get in touch.' },
    { key: 'advisor_availability', label: 'Advisor availability', type: 'text', placeholder: 'Mon - Thu, 09:00 - 15:00' },
    { key: 'display_order', label: 'Order in the list', type: 'number', default: 10, help: 'Lower numbers appear first.' },
  ],
  listTitle: (row) => text(row, 'programme_name'),
  listSubtitle: (row) => {
    const modules = Array.isArray(row.key_modules) ? row.key_modules.length : 0;
    return [modules ? `${modules} key modules` : '', text(row, 'advisor_name')].filter(Boolean).join(' · ');
  },
};

export const CONTACT_CATEGORIES = [
  'Orientation',
  'Academic',
  'Peer Mentoring',
  'Technical Support',
  'Financial Aid',
  'Wellness',
  'Disability Support',
  'Administration',
];

export const SCHEDULE_CATEGORIES = [
  { value: 'academic', label: 'Academic' },
  { value: 'support', label: 'Support' },
  { value: 'social', label: 'Social' },
  { value: 'digital', label: 'Digital' },
  { value: 'admin', label: 'Admin' },
];

export const contactConfig: ManageConfig = {
  table: 'Contact',
  pk: 'contact_id',
  title: 'Contacts',
  description: 'The people students can reach out to, shown on the Contacts screen.',
  itemNoun: 'Contact',
  orderBy: [{ column: 'name' }],
  fields: [
    { key: 'name', label: 'First name', type: 'text', required: true },
    { key: 'surname', label: 'Surname', type: 'text' },
    { key: 'role', label: 'Role', type: 'text', placeholder: 'Orientation Coordinator' },
    { key: 'email', label: 'Email', type: 'text', required: true, placeholder: 'name@mandela.ac.za' },
    { key: 'support_category', label: 'Support area', type: 'select', options: asOptions(CONTACT_CATEGORIES), allowCustom: true },
  ],
  listTitle: (row) => `${text(row, 'name')} ${text(row, 'surname')}`.trim(),
  listSubtitle: (row) => [text(row, 'role'), text(row, 'support_category')].filter(Boolean).join(' · '),
};

export const scheduleConfig: ManageConfig = {
  table: 'schedule_items',
  pk: 'id',
  title: 'Orientation schedule',
  description: 'The timetable first-years follow. Campus events are managed separately under Campus Events.',
  itemNoun: 'Session',
  orderBy: [{ column: 'date' }, { column: 'start_time' }],
  lookups: [{ fieldKey: 'venue_id', table: 'Venue', valueColumn: 'venue_id', labelColumn: 'venue_name' }],
  fields: [
    { key: 'title', label: 'Session name', type: 'text', required: true, placeholder: 'Welcome to the School of IT' },
    { key: 'date', label: 'Date (YYYY-MM-DD)', type: 'date', required: true, placeholder: '2027-02-04' },
    { key: 'start_time', label: 'Starts (HH:MM)', type: 'time', placeholder: '09:00' },
    { key: 'end_time', label: 'Ends (HH:MM)', type: 'time', placeholder: '10:00' },
    { key: 'venue_id', label: 'Venue', type: 'select', lookupOptions: true, help: 'Pick a venue so students can tap "Show me where". Add new venues on the Venues screen.' },
    { key: 'category', label: 'Category', type: 'select', default: 'academic', options: SCHEDULE_CATEGORIES },
    { key: 'description', label: 'What happens in this session', type: 'multiline' },
    { key: 'responsible_person', label: 'Led by', type: 'text' },
  ],
  listTitle: (row) => text(row, 'title'),
  listSubtitle: (row, labels) =>
    [text(row, 'date'), text(row, 'start_time').slice(0, 5), labels.venue_id?.[text(row, 'venue_id')] ?? '']
      .filter(Boolean)
      .join(' · '),
};

// ---- Head of department -----------------------------------------------------------------------

export const hodProgrammeConfig: ManageConfig = {
  table: 'hod_programme_content',
  setupFile: 'supabase/hod.sql',
  pk: 'id',
  title: 'Programme information',
  description: 'What students should know about the programme, shown to them under From your department.',
  itemNoun: 'Note',
  orderBy: [{ column: 'created_at' }],
  // Programme information and departmental expectations share one table, told apart by category.
  filter: { column: 'category', value: 'programme' },
  onCreate: () => ({ category: 'programme' }),
  fields: [
    { key: 'title', label: 'Heading', type: 'text', required: true, placeholder: 'About the diploma' },
    { key: 'content', label: 'Message to students', type: 'multiline', required: true },
  ],
  listTitle: (row) => text(row, 'title'),
  listSubtitle: (row) => text(row, 'content'),
};

export const hodExpectationConfig: ManageConfig = {
  table: 'hod_programme_content',
  setupFile: 'supabase/hod.sql',
  pk: 'id',
  title: 'Departmental expectations',
  description: 'What the department expects of students, such as attendance, conduct and submissions.',
  itemNoun: 'Expectation',
  orderBy: [{ column: 'created_at' }],
  filter: { column: 'category', value: 'expectation' },
  onCreate: () => ({ category: 'expectation' }),
  fields: [
    { key: 'title', label: 'Heading', type: 'text', required: true, placeholder: 'Attendance' },
    { key: 'content', label: 'What is expected', type: 'multiline', required: true },
  ],
  listTitle: (row) => text(row, 'title'),
  listSubtitle: (row) => text(row, 'content'),
};

export const hodAssignmentConfig: ManageConfig = {
  table: 'hod_assignments',
  setupFile: 'supabase/hod.sql',
  pk: 'id',
  title: 'Assignments',
  description: 'Departmental tasks and deadlines students should know about.',
  itemNoun: 'Assignment',
  orderBy: [{ column: 'due_date' }],
  fields: [
    { key: 'title', label: 'Assignment title', type: 'text', required: true },
    { key: 'description', label: 'Description', type: 'multiline' },
    { key: 'due_date', label: 'Due date (YYYY-MM-DD)', type: 'date', placeholder: '2027-03-15' },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      default: 'Open',
      options: [
        { value: 'Open', label: 'Open' },
        { value: 'In progress', label: 'In progress' },
        { value: 'Closed', label: 'Closed' },
      ],
    },
  ],
  listTitle: (row) => text(row, 'title'),
  listSubtitle: (row) => [text(row, 'due_date') ? `Due ${text(row, 'due_date')}` : 'No due date', text(row, 'status')].filter(Boolean).join(' · '),
};

export const hodContactConfig: ManageConfig = {
  table: 'hod_contacts',
  setupFile: 'supabase/hod.sql',
  pk: 'id',
  title: 'Department contacts',
  description: 'Academic and support contacts for the department.',
  itemNoun: 'Contact',
  orderBy: [{ column: 'name' }],
  fields: [
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'role', label: 'Role', type: 'text', placeholder: 'Head of Department' },
    { key: 'email', label: 'Email', type: 'text', required: true, placeholder: 'name@mandela.ac.za' },
    { key: 'phone', label: 'Phone', type: 'text', placeholder: '041 504 0000' },
  ],
  listTitle: (row) => text(row, 'name'),
  listSubtitle: (row) => [text(row, 'role'), text(row, 'email')].filter(Boolean).join(' · '),
};

export const hodResourceConfig: ManageConfig = {
  table: 'hod_resources',
  setupFile: 'supabase/hod.sql',
  pk: 'id',
  title: 'Support resources',
  description: 'Guides, forms and links that help students succeed in the department.',
  itemNoun: 'Resource',
  orderBy: [{ column: 'title' }],
  fields: [
    { key: 'title', label: 'Resource name', type: 'text', required: true, placeholder: 'Academic support guide' },
    { key: 'description', label: 'What it helps with', type: 'multiline' },
    { key: 'url', label: 'Link', type: 'text', placeholder: 'https://...', help: 'Optional. Students can tap it to open the resource.' },
  ],
  listTitle: (row) => text(row, 'title'),
  listSubtitle: (row) => text(row, 'description') || text(row, 'url'),
};

// ---- Emergency contacts ------------------------------------------------------------------------

export const emergencyContactConfig: ManageConfig = {
  table: 'emergency_contacts',
  setupFile: 'supabase/migrations/20260920100000_emergency_contacts.sql',
  pk: 'id',
  title: 'Emergency contacts',
  description: 'Numbers students call when they need urgent help. Keep them current: someone may be relying on them.',
  itemNoun: 'Contact',
  orderBy: [{ column: 'sort_order' }, { column: 'name' }],
  fields: [
    {
      key: 'category',
      label: 'Group',
      type: 'select',
      required: true,
      default: 'Emergency services',
      options: asOptions(['Emergency services', 'Mental health', 'Abuse and violence', 'Campus']),
      allowCustom: true,
      help: 'Students see contacts listed under these headings.',
    },
    { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Campus Protection Services' },
    { key: 'description', label: 'When to call', type: 'multiline', placeholder: 'One short, kind line about what this number helps with.' },
    { key: 'phone', label: 'Phone number', type: 'text', required: true, placeholder: '041 504 0000' },
    { key: 'available', label: 'When they answer', type: 'text', placeholder: '24 hours' },
    { key: 'sort_order', label: 'Order in the list (1 shows first)', type: 'number', default: 100 },
    { key: 'is_active', label: 'Visible to students', type: 'boolean', default: true },
  ],
  listTitle: (row) => text(row, 'name'),
  listSubtitle: (row) => [text(row, 'phone'), text(row, 'category'), row.is_active === false ? 'Hidden' : ''].filter(Boolean).join(' · '),
};
