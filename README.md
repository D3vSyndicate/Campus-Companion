<div align="center">

# Campus Companion

**The School of IT orientation app that tells first-years what to do next.**

![Status](https://img.shields.io/badge/status-hackathon%20prototype-B5541C)
![React Native](https://img.shields.io/badge/React%20Native-Expo%20SDK%2057-0B2A4A)
![Supabase](https://img.shields.io/badge/backend-Supabase-3ECF8E)
![Languages](https://img.shields.io/badge/languages-English%20%7C%20isiXhosa%20%7C%20Afrikaans-5F6670)

Built by **Team D3vSyndicate** for the hackathon theme
*Improving the First-Year Student Orientation Experience through Technology*
School of Information Technology, Nelson Mandela University

</div>

---

## Why we built it

Orientation reaches first-years by email, printed programme, Telegram, websites and announcements from a stage. Nobody has the whole picture, and the students who are most lost are the least likely to say so.

Campus Companion puts the schedule, venues, contacts, digital guides and support routes in one place. It is written to be kind about it. Nothing in the app tells a student they are late, behind or wrong. It tells them what to do next.

## What is inside

| Section | What it does |
|---|---|
| **Home** | Greeting, reassurance banner, latest announcements, shuttle times, progress, quick access |
| **Schedule** | Sessions by day and category. When a session has passed, the card explains how to catch up |
| **Venues and map** | Written directions for people who have never been on campus, plus an interactive South and North campus map with building search and walking routes. No GPS |
| **Checklist** | Tick off first-week tasks. Progress is counted up, never a list of what is undone |
| **Digital readiness** | Step-by-step guides for Funda, email, printing and Wi-Fi, with screenshots and video. Includes a guide to using AI tools for study |
| **Programmes** | Description, year structure, key modules, careers, academic expectations, advisor |
| **FAQs** | Searchable, and every answer sits under "Many new students ask this question" |
| **Contacts and support** | "I need help with..." pathways that give a next step, who to ask and related FAQs |
| **Announcements** | Low, medium, high and urgent, written to reassure |
| **Search** | One box across the schedule, FAQs, contacts, venues and support. Forgives typos and understands everyday words |
| **Tribe** | A small chat with your mentor group, under a username you choose |
| **Extras** | Shuttle times, campus events, sport and gym, student societies, personal calendar, Madibaz Arcade |

Also in: offline copies of the key screens, dark mode, adjustable text size, and English, isiXhosa and Afrikaans.

## Five kinds of user

| Role | Gets |
|---|---|
| First-year student | The whole student app |
| Mentor (How2buddy) | FAQs as quick answers, a "say this, not that" guide, a referral lookup |
| Orientation coordinator | Editing screens for all content, FAQ suggestions, Tribe and mentor placement |
| Lecturer or HOD | Programme information, departmental contacts and assignments |
| Admin | Content screens and account roles |

Roles are assigned on the server and enforced with Postgres row-level security. Everyone signed in can read content. Only staff can change it.

## The wording is part of the design

The brief asked for courage, empathy, vulnerability and shame resilience. We treated that as a rule for the small text, not a slogan.

| A typical app says | Campus Companion says |
|---|---|
| You missed this session. | This session has passed. Don't worry, you can review materials on Funda or ask a How2buddy mentor for a quick recap! |
| Venue unknown. | Not sure where this is? Here are directions. |
| Incomplete tasks. | You are making progress. Take one step at a time. |
| No results. | No matching answers. Many new students ask this. You can also ask in the Support tab. |

Mentors get the same wording in their own guide, so what they say out loud matches what the app says.

## Built with

| | |
|---|---|
| App | React Native 0.86, React 19, TypeScript, Expo SDK 57, Expo Router, React Navigation |
| Backend | Supabase: Postgres, Auth, row-level security, Realtime, Storage |
| Offline and settings | AsyncStorage |
| Languages | i18next, react-i18next, expo-localization |
| Map | react-native-webview with OpenStreetMap-based tiles and routing |
| Media and feel | expo-video, expo-av, expo-image, Reanimated, Gesture Handler, expo-haptics |

## Project layout

```
src/
  app/          Expo Router screens, one route group per role
                (student), (mentor), (coordinator), (hod), (admin), plus login
  components/   Shared UI, map, calendar, Tribe chat, arcade, content editors
  context/      Auth, appearance and app-wide state
  data/         Campus buildings, societies, timetable and shuttle data
  i18n/         English, isiXhosa and Afrikaans strings
  lib/          Search, offline storage, Supabase client and helpers
supabase/       SQL for features, roles, timetable, shuttles and seed data
```

## Getting started

You need Node.js (current LTS), a Supabase project, and either a phone with Expo Go or an emulator.

```bash
git clone https://github.com/D3vSyndicate/Campus-Companion.git
cd Campus-Companion
npm install
```

Create a `.env` file in the project root with your own Supabase details:

```
EXPO_PUBLIC_SUPABASE_URL=<your project url>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your anon key>
```

Then set up the database. The SQL for the app's features, seed data and roles is in `supabase/`. Run the scripts in the Supabase SQL editor, the files in `supabase/migrations/` in timestamp order, and `set_roles.sql` last to give your staff accounts their roles.

Start the app:

```bash
npm start          # Expo dev server, then scan the QR code with Expo Go
npm run android    # Android emulator
npm run ios        # iOS simulator
npm run web        # in the browser
```

Never commit your `.env` file. It holds your project keys.

## Privacy

We used sample data throughout and ask for as little as we can.

- **Kept:** sign-in email, the Tribe username the student picks, their Tribe messages, and which guide steps they finished.
- **Never asked for:** ID numbers, medical details, financial information, marks. No location tracking.
- **On the device:** language, theme, text size, recent searches and the offline copy of key screens.
- **Outside services:** map tiles and routes from OpenStreetMap-based services, and an embedded third-party support chat that receives no account details.

A real deployment would use the university's single sign-on, delete Tribe messages and progress after orientation, let students delete their data, and run a POPIA impact assessment first.

## Known gaps

We would rather list these than have them found.

- Checklist progress is stored on a shared row, so one student's tick shows for everyone. A per-student table already exists, so moving over is the first fix.
- isiXhosa and Afrikaans cover about 57% of interface strings. The rest fall back to English and need review by first-language speakers.
- A few sign-in error messages still sound technical.
- No push notifications yet. Announcements show when the app is opened.
- Staff roles are set with a SQL script, not an admin screen.

## Team

**D3vSyndicate**

Naledi Mabuya, Tinyiko Mkhombo, Thapelo Sitoe, Sibusiso Nxumalo, Khanyisa Mbonya

## AI tools

AI tools were used in this project. Claude was used to help draft the submission documents, and the repository includes configuration for AI coding assistants (Claude Code and GitHub Copilot). The app also embeds a third-party AI chat assistant on its support screen.

## Ownership and use

This is a hackathon prototype for the School of Information Technology, Nelson Mandela University. It uses sample data only, is not affiliated with official university systems, and does not replace them. All rights reserved: please do not copy or reuse the code, design or content without written permission from the university and the student developers. See `LICENSE`.

<div align="center">

<sub>Asking for help early is a smart academic habit.</sub>

</div>
