import type { Ionicons } from '@expo/vector-icons';

// Built-in lessons for the Digital screen, grouped into sections. They are written here, not stored in
// the database, so they are always available, even offline and even before a coordinator adds any
// guides. Each lesson opens in the same guide window as the guides that come from the database.

export type Lesson = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  // One line shown on the lesson card.
  summary: string;
  // Shown at the top of the lesson.
  desc: string;
  steps: string[];
  tip: string;
};

export type LessonSection = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  lessons: Lesson[];
};

const FILE_MANAGEMENT: LessonSection = {
  id: 'file-management',
  icon: 'folder-open-outline',
  title: 'Basic file management',
  subtitle: 'New to files and folders? Work through these short lessons in order.',
  lessons: [
    {
      id: 'files-1-files-and-folders',
      icon: 'folder-open-outline',
      title: 'Files and folders',
      summary: 'What they are and how to open, browse and create them.',
      desc: 'A file is one piece of work, like an essay or a photo. A folder holds files together, the way a paper folder holds pages.',
      steps: [
        'On a Windows computer, press the Windows key and E together to open File Explorer. On a phone, open the Files app.',
        'Look at the list on the left. Documents, Downloads and Desktop are places where your files can live.',
        'Double-click a folder to open it. Click the back arrow at the top to go up one level.',
        'To make your own folder, right-click an empty space, choose New, then Folder.',
        'Type a name for the folder and press Enter. Your folder is ready to use.',
      ],
      tip: 'Most things you download end up in Downloads. Move the ones you want to keep into your own folders.',
    },
    {
      id: 'files-2-naming-and-organising',
      icon: 'create-outline',
      title: 'Naming and organising',
      summary: 'A simple folder plan so you can find your work fast.',
      desc: 'Clear names and a simple folder plan mean you can find your work in seconds, even the night before a deadline.',
      steps: [
        "Make one main folder for the year, for example '2027 First Year'.",
        "Inside it, make one folder for each module, such as 'Programming' or 'Networks'.",
        "Inside each module folder, add 'Assignments', 'Notes' and 'Study material'.",
        "Give files names that explain themselves, like 'Programming - Assignment 1 - Draft.docx'.",
        "Avoid names like 'final', 'final2' or 'new'. Add a date or a version number instead, like 'v2'.",
        'To rename a file, click it once, press F2, type the new name and press Enter.',
      ],
      tip: 'Windows does not allow these characters in a file name: / \\ : * ? " < > |',
    },
    {
      id: 'files-3-save-copy-move',
      icon: 'copy-outline',
      title: 'Saving, copying and moving',
      summary: 'Keep your work, make a second version, or put it somewhere else.',
      desc: 'Saving keeps your work. Copying makes a second version. Moving puts the original in a different place.',
      steps: [
        'Save as you work. In most programs, press Ctrl and S together, and do it every few minutes.',
        'The first time you save, choose the folder and type a clear name. Use Save As to keep another version under a new name.',
        'To copy a file, click it, press Ctrl and C, open the folder you want, then press Ctrl and V.',
        'To move a file, click it, press Ctrl and X, open the folder you want, then press Ctrl and V.',
        'You can also drag a file into a folder to move it. Hold Ctrl while you drag to copy it instead.',
      ],
      tip: 'A cut file stays where it is until you paste it, so nothing is lost if you get interrupted halfway.',
    },
    {
      id: 'files-4-find-and-recover',
      icon: 'search-outline',
      title: 'Finding and recovering files',
      summary: 'Search for a file, and get back one you deleted by mistake.',
      desc: 'Everyone loses a file at some point. These steps help you find it again, or bring it back.',
      steps: [
        'In File Explorer, click the search box at the top right and type part of the file name.',
        "Open 'Quick access' (called 'Home' in Windows 11) to see the files you opened recently.",
        "Click the 'Date modified' heading to put your newest work at the top of a folder.",
        'If you deleted a file by mistake, open the Recycle Bin on your desktop.',
        'Right-click the file and choose Restore. It goes back to the folder it came from.',
      ],
      tip: 'Once you empty the Recycle Bin, files are very hard to get back. Look through it before you empty it.',
    },
    {
      id: 'files-5-back-up',
      icon: 'cloud-upload-outline',
      title: 'Backing up your work',
      summary: 'Keep every assignment in at least two places.',
      desc: 'Laptops get lost, broken and stolen. Keep your assignments in at least two places, so one problem never costs you your work.',
      steps: [
        'Sign in to OneDrive with your university email address. Your files copy to the cloud whenever you are online.',
        'Save your assignments in your OneDrive folder, or drag your module folders into it.',
        'Wait for the green tick on a file. It means the file has finished copying to the cloud.',
        'Keep a second copy on a USB drive for big deadlines.',
        'Back up before you submit, and before you update or reset your computer.',
      ],
      tip: 'Lab computers are shared. Save to OneDrive or a USB drive, and do not leave the only copy on the computer.',
    },
    {
      id: 'files-6-types-and-sharing',
      icon: 'attach-outline',
      title: 'File types and sharing',
      summary: 'What .docx and .pdf mean, and how to send files safely.',
      desc: 'The letters after the dot in a file name show what kind of file it is and which program opens it.',
      steps: [
        '.docx is a Word document, .xlsx is an Excel sheet, .pptx is a PowerPoint and .pdf looks the same on every device.',
        "To see these letters, open the View tab in File Explorer and tick 'File name extensions'.",
        'Submit the type of file your lecturer asks for. For a PDF, choose File, then Save As or Export, and pick PDF.',
        "To send several files at once, select them, right-click, choose 'Compress to ZIP file' and attach the ZIP.",
        'For large files, share a OneDrive link instead of attaching the file to an email.',
        'Only open attachments from people you know. Unknown .exe and .zip files can carry viruses.',
      ],
      tip: 'Check the name of the file before you submit it. A lecturer marks what you upload, so make sure it is the latest version.',
    },
  ],
};

const CYBER_SAFETY: LessonSection = {
  id: 'cyber-safety',
  icon: 'shield-checkmark-outline',
  title: 'Cyber safety',
  subtitle: 'Spot scams, browse safely, and protect your device and your privacy.',
  lessons: [
    {
      id: 'safety-1-scams',
      icon: 'warning-outline',
      title: 'Spotting scams and phishing',
      summary: 'Fake emails and messages that try to trick you.',
      desc: 'Phishing is a fake email, SMS or WhatsApp message that pretends to be someone you trust, like the university, a bank or a bursary. It tries to steal your details or your money.',
      steps: [
        "Slow down when a message feels urgent. Scammers say things like 'act now' or 'your account will be closed'.",
        'Check who really sent it. Look at the full email address, not just the name shown.',
        'Do not tap a link you did not expect. Type the website address yourself instead.',
        'Never share a password, PIN, one-time code or student number in reply to a message. Real organisations do not ask for these.',
        'Be suspicious of offers that sound too good to be true, like free data, easy jobs or a bursary you never applied for.',
        'If you are unsure, do not reply. Forward the message to IT Services and delete it.',
      ],
      tip: 'Check with the sender using a phone number or website you already trust, never one taken from the message.',
    },
    {
      id: 'safety-2-browsing',
      icon: 'globe-outline',
      title: 'Safe browsing and public Wi-Fi',
      summary: 'Habits that keep you safe on websites and networks.',
      desc: 'Almost everything you do online goes through a website or a Wi-Fi network. A few habits keep you safe on both.',
      steps: [
        'Look for the padlock and https at the start of a website address before you enter personal details.',
        'Download apps only from the Play Store or App Store, and programs only from the official website.',
        'Be careful on free public Wi-Fi. Do not bank or enter passwords on a network you do not trust.',
        'On campus, connect to the official eduroam network, not an open network with a similar name.',
        'Log out of shared and lab computers when you finish, and close the browser.',
        "Do not tick 'remember me' or 'save password' on a shared computer.",
      ],
      tip: 'A padlock only means the connection is private. It does not prove the website is honest, so still check the address.',
    },
    {
      id: 'safety-3-device',
      icon: 'phone-portrait-outline',
      title: 'Protecting your device',
      summary: 'Keep your phone and laptop safe, and your work with them.',
      desc: 'Your phone and laptop hold your assignments, photos and accounts. Protect them the way you would protect your wallet.',
      steps: [
        'Lock your phone and laptop with a PIN, password, fingerprint or face unlock.',
        'Install updates when they appear. Updates fix security holes that criminals use.',
        'Keep antivirus switched on. Windows Security does this for free on a Windows computer.',
        'Do not leave your laptop or phone alone in the library, a lab or a taxi.',
        'Turn on Find My Device on Android, or Find My iPhone, so you can locate or wipe a lost phone.',
        'Back up your work, so a lost or infected device does not cost you an assignment.',
      ],
      tip: 'Write down your laptop serial number and keep it somewhere safe. It helps if you ever need to report a theft.',
    },
    {
      id: 'safety-4-privacy',
      icon: 'eye-off-outline',
      title: 'Privacy, social media and getting help',
      summary: 'Think before you share, and know what to do if things go wrong.',
      desc: 'What you post can stay online for years. Think before you share, and know what to do if something goes wrong.',
      steps: [
        'Think before you post. Anything you share can be copied, even if you delete it later.',
        'Keep your student number, ID number, address and timetable private.',
        'Use privacy settings so only people you know can see your posts and photos.',
        'Never share private photos of yourself or of other people without permission.',
        'If someone bullies or threatens you online, do not reply. Take screenshots, block them and tell someone you trust.',
        'If your account is hacked or you fell for a scam, change your password straight away and contact IT Services.',
      ],
      tip: 'Being bullied online is never your fault. The Support section of this app can point you to people who can help.',
    },
  ],
};

const PASSWORD_SAFETY: LessonSection = {
  id: 'password-safety',
  icon: 'key-outline',
  title: 'Password safety',
  subtitle: 'Make a strong password, keep it safe and add extra protection.',
  lessons: [
    {
      id: 'password-1-strong',
      icon: 'key-outline',
      title: 'Building a strong password',
      summary: 'Why length beats tricky symbols.',
      desc: 'The longer and more unusual a password is, the harder it is to guess. Length matters more than clever symbols.',
      steps: [
        'Aim for at least 12 characters. Longer is better.',
        "Use a passphrase: four or more random words, like 'purple-bicycle-river-toast'.",
        'Add numbers or symbols if you like, but do not rely on them to make a short password strong.',
        "Do not use your name, birthday, student number, cellphone number or 'password123'.",
        'Avoid common patterns such as 123456, qwerty or the name of your favourite team.',
      ],
      tip: 'A long phrase that only means something to you is easier to remember and harder to crack than a short jumble like P@ssw0rd.',
    },
    {
      id: 'password-2-keep-safe',
      icon: 'lock-closed-outline',
      title: 'Keeping your passwords safe',
      summary: 'One password per account, and never share it.',
      desc: 'A strong password only helps if nobody else gets it. Keep each one private, and different.',
      steps: [
        'Use a different password for every important account, especially your student email and your banking.',
        'Never share a password with a friend, a lecturer or anyone who messages you. Nobody real needs it.',
        'Use a password manager to remember them for you. Your phone or browser may already have one built in.',
        "Do not keep passwords on sticky notes, or in a plain file called 'passwords' on your computer.",
        'Never type a password after tapping a link in a message. Go to the website yourself.',
      ],
      tip: 'If one site is hacked and you used the same password everywhere, criminals will try it on all your other accounts.',
    },
    {
      id: 'password-3-two-step',
      icon: 'finger-print-outline',
      title: 'Extra protection, and what to do if it leaks',
      summary: 'Two-step checks and quick action after a leak.',
      desc: 'Two-step verification adds a second check, so a stolen password on its own is not enough to get into your account.',
      steps: [
        'Turn on two-step verification, also called multi-factor authentication, for your email and other important accounts.',
        'Use an authenticator app or a code sent to your phone as the second step.',
        'Keep your backup codes somewhere safe, in case you lose your phone.',
        'If you think a password has leaked, change it straight away, then change it anywhere else you used it.',
        'You can check whether your email address appeared in a known data breach at haveibeenpwned.com.',
        'If you cannot log in to a university account, contact IT Services to reset it.',
      ],
      tip: 'Never give a verification code to anyone, even someone who says they are from the university or your bank.',
    },
  ],
};

const RESPONSIBLE_AI: LessonSection = {
  id: 'responsible-ai',
  icon: 'sparkles-outline',
  title: 'Responsible use of AI tools',
  subtitle: 'Use AI to learn, check what it tells you, and stay honest in your work.',
  lessons: [
    {
      id: 'ai-1-what-it-is',
      icon: 'sparkles-outline',
      title: 'What AI tools can and cannot do',
      summary: 'Helpful, fast, and not always right.',
      desc: 'AI tools such as chatbots can write, explain and summarise in seconds. They are useful helpers, but they are not always right.',
      steps: [
        'An AI tool predicts likely words. It does not know whether something is true.',
        'It can give answers that sound confident but are wrong, or make up facts, quotes and references.',
        'It can repeat unfair ideas from the material it learned from.',
        'It does not replace your own thinking, your lecturer or your textbook.',
        'Treat what it says as a first draft or a starting point, never as the final answer.',
      ],
      tip: 'If an answer really matters, check it against your notes, your textbook or a reliable website.',
    },
    {
      id: 'ai-2-learn-not-cheat',
      icon: 'school-outline',
      title: 'Using AI to learn, not to cheat',
      summary: 'What is a good use, and what breaks the rules.',
      desc: 'Handing in work an AI wrote and calling it yours is a form of cheating. Used well, AI can help you understand more.',
      steps: [
        'Read your module guide and assessment instructions. Each lecturer sets the rules for AI use in their module.',
        'If you are not sure whether a tool is allowed, ask your lecturer before you use it.',
        'Good uses: ask it to explain an idea in simpler words, quiz you before a test, or suggest how to plan an essay.',
        'Risky uses: having it write your assignment, code or answers, and then handing that in as your own work.',
        'If AI use is allowed, say how you used it, in the way your lecturer asks.',
        'Do the thinking and the writing yourself, so you can explain your work in a test or an oral.',
      ],
      tip: 'A good check: could you explain and defend every line of your work without the AI tool open?',
    },
    {
      id: 'ai-3-privacy',
      icon: 'hand-left-outline',
      title: 'Protecting your privacy with AI',
      summary: 'What never to type into an AI chat.',
      desc: 'What you type into an AI tool may be stored, and used by the company that runs it.',
      steps: [
        'Do not type your student number, ID number, passwords, address or bank details into an AI tool.',
        'Do not paste in private information about other people, such as their photos or messages.',
        "Do not paste in work that belongs to someone else, like a lecturer's test or a classmate's assignment, without permission.",
        'Check the tool\'s privacy settings, and turn off chat history or training on your data if you can.',
        'Be careful with free apps that ask for a lot of permissions.',
      ],
      tip: 'A simple rule: if you would not put it on a public noticeboard, do not put it in an AI chat.',
    },
    {
      id: 'ai-4-check-and-credit',
      icon: 'checkmark-done-outline',
      title: 'Checking and crediting AI output',
      summary: 'Verify it, put it in your own words, and be honest.',
      desc: 'Before you use anything an AI tool gives you, check it, and be honest about where it came from.',
      steps: [
        'Check every fact, date, number and name against a reliable source.',
        'Search for any book, article or quote it gives you. AI tools sometimes invent references that do not exist.',
        'For code, run it and test it. Make sure you understand each part before you use it.',
        'Put ideas in your own words. Copying AI text straight into your work can count as plagiarism.',
        'Use the referencing style your department asks for, and follow its rules on mentioning AI.',
        'When in doubt, be open about it and ask your lecturer.',
      ],
      tip: 'You are responsible for everything you hand in, including any mistakes an AI tool made for you.',
    },
  ],
};

export const LESSON_SECTIONS: LessonSection[] = [FILE_MANAGEMENT, CYBER_SAFETY, PASSWORD_SAFETY, RESPONSIBLE_AI];
