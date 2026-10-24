# Solune Windows

[简体中文](README.md) | **English**

Windows 10/11 x64 desktop lunar calendar, reusing the local assets from [Solune-Web](https://github.com/BohaoFU/Solune-Web). Includes Gregorian/lunar month views, leap-month conversion, solar terms, festivals, local notes, a tray flyout, JSON backup/merge import, and optional native clock-click routing.

Click the tray icon or press **Ctrl+Alt+D** to toggle the panel. Closing the main window keeps the app in the tray; choose Exit from the tray menu to quit. Clock routing only runs while Solune is running, never changes Windows files or registry settings, and falls back to the tray when a clock cannot be identified. Windows notification center remains available via Win+N. Startup is enabled on the first packaged launch and can be disabled in desktop settings or the sidebar; a saved opt-out is preserved.

The date card aligns Gregorian date, lunar date and GanZhi year/month/day to the left. The compact panel contains only the month grid and date card; the note action is an icon beside Open App. Detailed four-pillar and time controls have been removed. Three pillars use noon Beijing time on the selected date and ignore legacy time preferences. Calendar rows preserve full CJK line boxes at larger zoom levels. The app and tray retain the plum blossom icon.

All calendar assets are bundled. No Google fonts, remote scripts, accounts, advertisements or telemetry are loaded. Dates use Asia/Shanghai, with a Gregorian range of 1901–2100. Festival markers are not official public-holiday or makeup-workday schedules. Local notes survive restarts and app updates; export JSON before migrating to another computer.

On Windows x64 with Node.js 24+ and the .NET Framework compiler:

```powershell
npm ci
npm run build:native
npm start
npm test
npm run test:app
npm run dist
```

Unsigned per-user NSIS and portable executable packages are produced in `release/`. The native helper source is included and compiled locally. No Explorer injection or administrator access is required. Clock integration must be checked on the target Windows/taskbar version; it is not a documented Windows plug-in interface.

Renderer assets originate from Solune-Web commit `3a0041a6786738e1c542e99411dd4f0ab2c13fc8`. The lunar-javascript MIT license is retained under `renderer/vendor/`. No license has been selected for the main project.
