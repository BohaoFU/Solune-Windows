# Solune Windows · 岁时万年历

**简体中文** | [English](README.en.md)

[项目入口](https://github.com/BohaoFU/Solune) · [Android](https://github.com/BohaoFU/Solune-Android) · [Web](https://github.com/BohaoFU/Solune-Web)

Windows 10/11 x64 桌面客户端。复用 Solune-Web 的离线历法、界面及记事功能，增加独立 App、托盘日历面板和可关闭的系统时钟点击接管。

## 使用

- 打开主窗口：完整月历、公农历转换、节日节气、日期记事。
- 点击托盘“岁时”图标，或按 **Ctrl+Alt+D**：打开/收起农历小面板。
- 接管组件识别到系统时钟后，左键点击 Windows 日期时间区域会打开岁时面板。只拦截该区域的左键；右键和 Win+N 保留原行为。
- 关闭主窗口会驻留托盘；托盘菜单的“退出”会退出程序并恢复系统时钟点击。
- “桌面设置”可关闭时钟接管、选择开机启动、导出/合并导入记事。首次运行新版时默认开启开机启动，登录后仅驻留托盘；手动关闭后会保留选择。主窗口左下角也提供开机启动开关。
- 日期按中国标准时间（Asia/Shanghai）计算，查询范围为公历 1901—2100 年，支持农历闰月。

系统时钟入口属于可选适配：Windows 版本、任务栏替代软件和可访问性树可能影响识别。状态会显示“已接管”或“未识别”；未识别时托盘和快捷键仍可使用。退出后无系统残留改动。

## 干支日期与八字

选中日期后，主窗口和托盘面板都会突出显示“丙午年 ××月 ××日”的干支日期。四柱面板提供年柱、月柱、日柱、时柱、日主和五行；展开可查看纳音、藏干、十神、地势、旬空。

参考时刻默认北京时间 12:00:00，可修改到秒或点“此刻”。年柱按立春、月柱按节气中的节交接时刻计算；日柱可选择 00:00 或 23:00 换日。两种规则的晚子时时柱均按次日子时计算。时间与换日偏好本地保存，并在两个窗口间同步。未校正真太阳时。

Windows 安装包、快捷方式、托盘和 App 内均使用梅花图标。

## 本机数据和离线行为

记事保存在 Electron 的本机应用数据目录，不是浏览器网站的数据目录。主窗口与小面板共享记事。应用升级保留同一目录；移到其他电脑需导出/导入 JSON 备份，导入时保留本机已有的同 ID 记事。

日历与农历算法全部打包在本地。Windows 版移除了 Web 的 Google 字体导入和 PWA Service Worker 注册，使用系统字体；渲染进程拒绝网络连接。无广告、资讯推荐、账号或遥测。

节日/节气标注不等于官方放假或补班安排。此版没有接入假日联网更新，也不预测调休。

## 开发与构建

需要 Windows x64、Node.js 24+ 和 Windows 自带 .NET Framework 4.x 编译器。

```powershell
npm ci
npm run build:native
npm start
npm test
npm run test:app
npm run test:startup # 验证临时当前用户启动项的写入与清理
npm run test:clock # 在有任务栏的交互桌面上测试
npm run dist
```

`npm run dist` 在 `release/` 生成当前用户安装版和免安装版；构建依赖下载需要网络，日历运行无需联网。当前构建不做代码签名。

## 工程结构

- `renderer/`：由 Solune-Web `3a0041a6786738e1c542e99411dd4f0ab2c13fc8` 的 dist 复制，离线历法资源和 MIT 许可均保留。
- `src/`：Electron 主进程、受限 IPC 预加载、面板定位。
- `renderer/desktop.*`：Windows 设置、面板样式和本机窗口联动。
- `native/ClockBridge.cs`：普通用户进程中的 Win32 鼠标钩子和 UI Automation 时钟区域发现。
- `scripts/build-native.cjs`：编译时钟组件并使用工程内的梅花 ICO。
- `tests/`：农历交叉校验、边界/闰月、面板定位、Electron 持久化与离线检查。

时钟组件不注入 Explorer，不修改系统文件/注册表，不申请管理员或 SYSTEM 权限。只有通过任务栏可访问性信息识别出的时钟矩形会被接管；未识别时不猜测屏幕坐标。父 App 退出时钩子随进程释放。

图标源文件为 `assets/plum.svg`，修改后运行 `npm run build:icons` 可重新生成多尺寸 Windows ICO 和 PNG。

## 许可

农历算法 `lunar-javascript` 1.7.7：MIT，见 `renderer/vendor/LICENSE-lunar.txt`。Electron 的许可随安装包保留。主工程尚未指定开源许可证。
