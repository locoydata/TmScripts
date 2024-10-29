// ==UserScript==
// @name         Airtable 添加记录工具
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  选择表并向 Airtable 添加记录
// @match        *://*/*
// @exclude      *://work.1688.com/*  // 排除页面
// @grant        none
// ==/UserScript==

(async function() {
    'use strict';

    // Airtable 配置
    const ACCESS_TOKEN = 'patbkrCcuDhqSEPik.f9945b399f40ab7dbeff15e8b436b8fa47de166bab355e6209c51c86106b4549'; // Airtable API 访问令牌
    const BASE_ID = 'appWNNByUsenTcJML'; // Base ID
    const TABLE_NAMES = ['ae订单','供应商备注', 'SKU供应商', 'SKU采购链接', 'SKU备注', '1688订单物流', '临时']; // 所有表格的名称

    // 创建浮动按钮
    const button = document.createElement('button');
    button.innerText = '添加记录到 Airtable';
    button.style.position = 'fixed';
    button.style.bottom = '20px';
    button.style.right = '20px';
    button.style.zIndex = '1000';
    button.style.padding = '10px';
    button.style.backgroundColor = '#007BFF';
    button.style.color = '#fff';
    button.style.border = 'none';
    button.style.borderRadius = '5px';
    button.style.cursor = 'pointer';
    document.body.appendChild(button);

    // 创建表单模态框
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    modal.style.display = 'none';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '1001';

    const form = document.createElement('form');
    form.style.backgroundColor = '#fff';
    form.style.padding = '20px';
    form.style.borderRadius = '5px';
    form.style.width = '300px';
    form.innerHTML = `
        <h3>添加记录</h3>
        <label>选择表格:</label>
        <select id="tableSelect">
            ${TABLE_NAMES.map(name => `<option value="${name}">${name}</option>`).join('')}
        </select>
        <br/><br/>
        <label>匹配文本:</label>
        <input type="text" id="matchText" required />
        <br/><br/>
        <label>注释内容:</label>
        <textarea id="noteText" required></textarea>
        <br/><br/>
        <button type="submit">提交</button>
        <button type="button" id="cancelButton">取消</button>
    `;
    modal.appendChild(form);
    document.body.appendChild(modal);

    // 显示表单模态框
    button.addEventListener('click', () => {
        modal.style.display = 'flex';
    });

    // 关闭模态框
    document.getElementById('cancelButton').addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // 处理表单提交
    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        // 获取表单数据
        const tableName = document.getElementById('tableSelect').value;
        const matchText = document.getElementById('matchText').value;
        const noteText = document.getElementById('noteText').value;
        const sourceUrl = window.location.href; // 获取当前页面的网址
        const now = new Date()
        const recordTime = now.toISOString(); // 将当前时间转换为 ISO 字符串, 包含时间, 这是airtable中对应列类型为日期并需要include time
        //const recordTime = now.toISOString().split('T')[0]; // 如果只需要日期部分

        // 调用 Airtable API 添加记录
        try {
            const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${tableName}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fields: {
                        '匹配文本': matchText,
                        '注释内容': noteText,
                        '来源': sourceUrl, // 自动填入当前页面的网址
                        '记录时间': now

                    }
                })
            });

            if (!response.ok) {
                throw new Error(`提交到表 ${tableName} 失败`);
            }

            alert(`记录成功添加到表 ${tableName}`);
            modal.style.display = 'none';
            form.reset(); // 重置表单
        } catch (error) {
            console.error('提交记录失败:', error);
            alert('记录添加失败，请检查控制台错误信息');
        }
    });
})();
