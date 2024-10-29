// ==UserScript==
// @name         读取OneDrive Excel表格
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  从OneDrive读取Excel表格内容并打印到控制台
// @match        *://*/*
// @grant        none
// @require     https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js
// ==/UserScript==

/* global XLSX */

(async function() {
    'use strict';

    const spreadsheetUrl = 'https://onedrive.live.com/download?cid=8f4281143288b892&resid=8F4281143288B892!147630&authkey=!APWj40hyiYMBQkA';

    // 使用 CORS 代理
    const corsProxy = 'https://cors-anywhere.herokuapp.com/';
    const proxiedUrl = corsProxy + spreadsheetUrl;

    try {
        const response = await fetch(proxiedUrl);
        if (!response.ok) {
            throw new Error('网络响应不是 OK');
        }

        const data = await response.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        console.log('Excel表格数据:', jsonData);

    } catch (error) {
        console.error('读取表格失败:', error);
        alert('读取表格失败，请检查网络连接或文件访问权限。');
    }
})();
