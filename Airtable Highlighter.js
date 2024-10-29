// ==UserScript==
// @name         Airtable Highlighter
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Highlights text on pages matching Airtable data
// @match        *://*/*
// @grant        none
// ==/UserScript==

(async function() {
    'use strict';

    const ACCESS_TOKEN = 'patbkrCcuDhqSEPik.f9945b399f40ab7dbeff15e8b436b8fa47de166bab355e6209c51c86106b4549'; // Replace with your personal access token
    const BASE_ID = 'appWNNByUsenTcJML'; // 在此替换为你的Base ID
    const TABLE_NAME = '高亮'; // 替换为你的 Airtable 表名

    const highlights = [];

    // 加载高亮文本
    async function loadHighlights() {
        try {
            const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`, {
                headers: {
                    Authorization: `Bearer ${ACCESS_TOKEN}`, // 使用个人访问令牌
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`网络响应失败，表格：${TABLE_NAME}`);
            }

            const data = await response.json();
            data.records.forEach(record => {
                const highlightText = record.fields['高亮文本']; // 假设字段名为“高亮文本”
                if (highlightText) {
                    highlights.push(highlightText.trim()); // 存储高亮文本
                }
            });

            console.log(`高亮文本加载成功`, highlights);
        } catch (error) {
            console.error(`加载高亮文本失败:`, error);
        }
    }

    // 创建高亮
    function highlightText(node) {
        if (node.nodeType === Node.TEXT_NODE && node.nodeValue.trim()) {
            const text = node.nodeValue;
            const parentNode = node.parentNode;

            highlights.forEach(highlight => {
                const regex = new RegExp(`(${highlight})`, 'gi'); // 忽略大小写匹配
                if (regex.test(text)) {
                    // 使用 Range 对象进行安全替换
                    let match = regex.exec(text);
                    while (match) {
                        const range = document.createRange();
                        range.setStart(node, match.index);
                        range.setEnd(node, match.index + match[0].length);

                        const span = document.createElement('span');
                        span.style.backgroundColor = 'yellow'; // 高亮样式
                        span.style.fontWeight = 'bold'; // 可选：加粗高亮文本
                        span.textContent = match[0];

                        range.surroundContents(span);

                        match = regex.exec(text);
                    }
                }
            });
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            // 遍历所有子节点
            for (const child of node.childNodes) {
                highlightText(child);
            }

            // 如果当前节点是 `<span>` 元素，并且包含高亮文本，则设置背景色
            if (node.tagName === 'SPAN') {
                const text = node.textContent;
                highlights.forEach(highlight => {
                    if (text.includes(highlight)) {
                        node.style.backgroundColor = 'yellow';
                    }
                });
            }
        }
    }

    // 观察 DOM 的变化并高亮新内容
    function observeDOMChanges() {
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList' && mutation.addedNodes.length) {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE) {
                            highlightText(node);
                        }
                    });
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // 页面加载时高亮并观察动态内容
    window.addEventListener('load', async () => {
        await loadHighlights();
        highlightText(document.body);
        observeDOMChanges();
    });
})();