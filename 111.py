// ==UserScript==
// @name         添加记录
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  选择表并向 Airtable 添加记录
// @author       [思钱想厚]
// @match        ://erp2.cnfth.com/
// @match        ://.1688.com*
// @exclude      ://airtable.com/  // 排除页面
// @grant        none
// @updateURL    https://locoydata.github.io/TmScripts/添加记录脚本.js
// @downloadURL  https://locoydata.github.io/TmScripts/添加记录脚本.js
// ==/UserScript==

(async function() {
'use strict';

// Airtable 配置
const ACCESS_TOKEN = 'patbkrCcuDhqSEPik.f9945b399f40ab7dbeff15e8b436b8fa47de166bab355e6209c51c86106b4549'; // Airtable API 访问令牌
const BASE_ID_1 = 'appWNNByUsenTcJML'; // 第一数据库 Base ID
const BASE_ID_2 = 'appXYZ1234567890'; // 第二数据库 Base ID

// 所有表格的名称
const TABLES = {
    base1: {
        name: 'Base 1',
        tables: ['ae订单', '供应商备注', 'SKU供应商', 'SKU采购链接', 'SKU备注', '1688订单物流', '临时'],
        fields: {
            'ae订单': ['匹配文本', '注释内容', '来源', '记录时间'],
            '供应商备注': ['匹配文本', '注释内容'],
            // 其他表格的字段
        }
    },
    base2: {
        name: 'Base 2',
        tables: ['table1', 'table2'],
        fields: {
            'table1': ['字段1', '字段2'],
            'table2': ['字段1', '字段2'],
        }
    }
};

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
    <label>选择数据库:</label>
    <select id="baseSelect">
        <option value="base1">Base 1</option>
        <option value="base2">Base 2</option>
    </select>
    <br/><br/>
    <label>选择表格:</label>
    <select id="tableSelect">
        ${TABLES.base1.tables.map(name => `<option value="${name}">${name}</option>`).join('')}
    </select>
    <br/><br/>
    <div id="dynamicFields">
        <label>匹配文本:</label>
        <input type="text" id="matchText" required />
        <br/><br/>
        <label>注释内容:</label>
        <textarea id="noteText" required></textarea>
        <br/><br/>
    </div>
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

// 动态更新表格和字段
document.getElementById('baseSelect').addEventListener('change', updateTables);
document.getElementById('tableSelect').addEventListener('change', updateFields);

function updateTables() {
    const baseSelect = document.getElementById('baseSelect').value;
    const tableSelect = document.getElementById('tableSelect');
    tableSelect.innerHTML = TABLES[baseSelect].tables.map(name => `<option value="${name}">${name}</option>`).join('');
    updateFields(); // 更新字段
}

function updateFields() {
    const baseSelect = document.getElementById('baseSelect').value;
    const tableSelect = document.getElementById('tableSelect').value;
    const dynamicFields = document.getElementById('dynamicFields');
    const fields = TABLES[baseSelect].fields[tableSelect];

    // 清空动态字段
    dynamicFields.innerHTML = '';
    fields.forEach(field => {
        if (field === '匹配文本') {
            dynamicFields.innerHTML += `
                <label>${field}:</label>
                <input type="text" id="matchText" required />
                <br/><br/>
            `;
        } else if (field === '注释内容') {
            dynamicFields.innerHTML += `
                <label>${field}:</label>
                <textarea id="noteText" required></textarea>
                <br/><br/>
            `;
        } else {
            dynamicFields.innerHTML += `
                <label>${field}:</label>
                <input type="text" id="${field}" required />
                <br/><br/>
            `;
        }
    });
}

// 处理表单提交
form.addEventListener('submit', async (event) => {
    event.preventDefault();

    // 获取表单数据
    const baseSelect = document.getElementById('baseSelect').value;
    const tableName = document.getElementById('tableSelect').value;
    const matchText = document.getElementById('matchText').value;
    const noteText = document.getElementById('noteText').value;
    const sourceUrl = window.location.href; // 获取当前页面的网址
    const now = new Date()
    const recordTime = now.toISOString(); // 将当前时间转换为 ISO 字符串, 包含时间, 这是airtable中对应列类型为日期并需要include time

    // 确定目标数据库和表
    const BASE_ID = baseSelect === 'base1' ? BASE_ID_1 : BASE_ID_2;

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
                    '记录时间': recordTime
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
