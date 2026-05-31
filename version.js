const APP_VERSION = '1.3.0';
const CHANGELOG = [
    {
        version: '1.3.0',
        date: '2026-05-30',
        changes: ['Updated the UI, adding a bottom navbar for game, history, and settings.']
    },
    {
        version: '1.2.0',
        date: '2026-05-17',
        changes: [
            'Added a help section, displaying account deletion option, version number, and changelog'
        ]
    },
    {
        version: '1.1.0',
        date: '2026-05-07',
        changes: [
            'Added account deletion url, updated privacy policy, improved overall app appearance',
            'Made game saving optional: requires a button'
        ]
    },
    {
        version: '1.0.0',
        date: '2026-04-21',
        changes: [
            'Created basic app functionality with timer, goals, cards',
            'Features: add/subtract time during game, per-half timer, functioning timer on phone close, notes field, login option to save games with history screen'
        ],
    },
];

window.RefClockVersion = { APP_VERSION, CHANGELOG };