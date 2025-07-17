[English](README.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | [Français](README.fr.md)

# ServiceNow 快速语言切换插件 (QLS)

一个浏览器扩展，它在 ServiceNow Polaris UI 的头部添加一个按钮，让用户可以快速切换已安装的语言。

> **兼容性说明**：本扩展目前只支持 **Next Experience UI**，不支持 Classic UI (UI16)。

---

### 功能特性

-   **无缝集成**: 直接在 ServiceNow 头部导航栏注入一个语言切换图标，方便访问。
-   **智能切换**:
    -   如果实例中配置了**两种语言**，点击按钮可一键切换到另一种语言。
    -   如果可用语言**超过两种**，则会弹出一个简洁的模态框，供您选择目标语言。
-   **自动语言检测**: 扩展会自动从您的 ServiceNow 偏好设置面板中抓取所有可用的语言。
-   **错误处理**: 如果 ServiceNow 实例未启用多语言环境，扩展会提供清晰的用户提示。

### 工作原理

此扩展由一个负责注入界面的内容脚本 (Content Script) 和一个负责处理核心逻辑的背景脚本 (Background Script) 组成，以此绕过浏览器沙箱限制。

1.  **UI 注入 (`content-script.js`)**:
    -   使用 `MutationObserver` 监听 ServiceNow Polaris 头部的加载。
    -   当头部加载完成后，脚本会将一个新的语言切换图标 (`<now-icon icon="translated-text-fill">`) 注入到头部的控件区域。
    -   脚本监听此图标的点击事件。点击后，它会向背景脚本发送消息，请求获取可用的语言列表。
    -   如果返回的语言超过两种，它会使用 `custom-modal.css` 的样式动态创建并显示一个语言选择模态框。

2.  **核心逻辑 (`background.js`)**:
    -   背景脚本负责监听来自内容脚本的消息。
    -   **获取语言**: 收到 `getLanguages` 请求后，它使用 `chrome.scripting.executeScript` API 在页面的主执行环境 (`MAIN` world) 中运行一个函数 (`getAvailableLanguages`)，此函数通过模拟用户操作UI来抓取语言列表。
    -   **设置语言**: 当收到 `setLanguage` 请求（包含目标语言ID）时，它会注入另一个函数 (`switchLanguageTo`)，该函数向 ServiceNow 的内部 API (`/api/now/ui/concoursepicker/language`) 发送一个 `PUT` 请求来更改会话语言，然后重新加载页面。

### 安装方法

1.  下载或克隆此代码仓库。
2.  打开 Google Chrome 浏览器，访问 `chrome://extensions/`。
3.  打开右上角的“**开发者模式**”开关。
4.  点击左上角的“**加载已解压的扩展程序**”按钮。
5.  选择您保存这些文件的文件夹 (`SN-QLS` 或您的项目文件夹)。
6.  扩展程序现已安装完成，并将在 ServiceNow 页面上自动生效。
