# Windows 0.1.0 验证记录

验证日期：2026-10-24（Asia/Shanghai）。本机 Windows 11 25H2，构建号 26200。

- `npm test`：5 项通过。包括已知农历新年、2023 年闰二月、公农历边界往返、独立 Intl 中国历交叉验证、多屏定位及离线资源检查。
- `npm run test:app`：通过。真实 Electron 窗口内验证农历、闰月转换、记事的主窗口/面板同步、重启保存、设置保存、上下文隔离、网络请求拒绝及 1024×640 窗口底部设置可达性。
- `npm run build:native`：时钟桥接组件编译及分类/矩形自检通过。
- `npm run test:clock`：在本机真实任务栏上通过。成功安装时钟区域鼠标钩子并识别当前系统时钟；关闭接管选项后组件停止。
- `ClockBridge.exe --inspect`：识别到 `SystemTray.OmniButton`，AutomationId 为 `SystemTrayIcon`，时钟区域为 2475,1392,69,48（本次屏幕物理坐标，运行时动态识别，不在代码中硬编码）。
- 浅色主窗口、深色主窗口、农历面板均有测试截图，位于本机构建的 `test-results/`。

当前用户 NSIS 安装版和免安装版已成功生成。对 `release/win-unpacked/Solune.exe` 复用 `test:app` 和 `test:clock`，两项均通过；确认图标/版本资源已写入，安装包未做代码签名。CI 独立验证可重建性与桌面烟雾测试。

尚未覆盖：真实人工点击/拖动、多显示器硬件、第三方任务栏、其他 Windows 版本及签名分发。时钟不可识别时保持系统点击行为，继续提供托盘和 Ctrl+Alt+D。此版本为未签名测试版。
