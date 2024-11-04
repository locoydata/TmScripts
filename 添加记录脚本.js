// ==UserScript==
// @name         添加记录
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  选择数据库和表并向 Airtable 添加记录
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
    const BASES = {
        'Annotations': 'appWNNByUsenTcJML', // Base ID 1
        'WebReminder': 'appe3cvzz8IDpyNRq', // Base ID 2（请替换为你的第二个 Base ID）
    };

    // 动态获取表名和字段名
    let currentTables = [];
    let currentBaseId = Object.values(BASES)[0]; // 默认选择第一个数据库

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
    form.style.width = '500px';
    form.style.height = '600px'; // 固定高度
    form.style.overflowY = 'auto'; // 允许内容溢出时滚动
    form.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)'; // 添加阴影
    form.style.display = 'flex';
    form.style.flexDirection = 'column'; // 垂直方向布局
    form.style.position = 'relative'; // 允许子元素绝对定位

    form.innerHTML = `
    <h3>添加记录</h3>
    <label>选择数据库:</label>
    <select id="baseSelect">${createBaseOptions()}</select>
    <br/>
    <label>选择表格:</label>
    <select id="tableSelect">${createTableOptions([])}</select>
    <br/>
    <div id="fieldsContainer" style="flex-grow: 1;"></div> <!-- 允许字段容器占据剩余空间 -->
    <div style="display: flex; justify-content: space-between; margin-top: 10px;">
        <button type="submit">提交</button>
        <button type="button" id="cancelButton">取消</button>
    </div>
`;
    modal.appendChild(form);
    document.body.appendChild(modal);


    // 监听表格选择的变化
    document.getElementById('tableSelect').addEventListener('change', updateFields);

    // 显示表单模态框
    button.addEventListener('click', () => {
        modal.style.display = 'flex';
        updateTables(); // 更新表格列表
    });

    // 关闭模态框
    document.getElementById('cancelButton').addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // 处理表单提交
    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const tableName = document.getElementById('tableSelect').value;
        const fields = currentTables.find(table => table.name === tableName).fields;

        const recordData = {};
        fields.forEach(field => {
            const input = document.getElementById(field.name);
            if (input) {
                recordData[field.name] = input.value;
            }
        });

        const sourceUrl = window.location.href; // 获取当前页面的网址
        recordData['来源'] = sourceUrl; // 自动填入当前页面的网址
        recordData['记录时间'] = new Date().toISOString(); // 如果只需要日期部分; new Date().toISOString(); // 将当前时间转换为 ISO 字符串, 包含时间, 这是airtable中对应列类型为日期并需要include time

        // 调用 Airtable API 添加记录
        try {
            const response = await fetch(`https://api.airtable.com/v0/${currentBaseId}/${tableName}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fields: recordData })
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

    // 从 Airtable 获取表和字段
    async function fetchTables(baseId) {
        const response = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
            headers: {
                Authorization: `Bearer ${ACCESS_TOKEN}`
            }
        });

        if (!response.ok) {
            throw new Error('无法获取表格信息');
        }

        const data = await response.json();
        return data.tables; // 返回表信息
    }

    // 生成数据库选择框选项
    function createBaseOptions() {
        return Object.keys(BASES).map(baseName => `<option value="${BASES[baseName]}">${baseName}</option>`).join('');
    }

    // 生成表格选择框选项
    function createTableOptions(tables) {
        return tables.map(table => `<option value="${table.name}">${table.name}</option>`).join('');
    }

    // 更新表格动态显示
    async function updateTables() {
        const baseId = document.getElementById('baseSelect').value;
        currentBaseId = baseId; // 更新当前 Base ID
        currentTables = await fetchTables(baseId); // 获取新的表格
        document.getElementById('tableSelect').innerHTML = createTableOptions(currentTables);
        updateFields(); // 更新字段显示
    }

    // 更新字段动态显示
    function updateFields() {
        const tableName = document.getElementById('tableSelect').value;
        const fieldsContainer = document.getElementById('fieldsContainer');
        const fields = currentTables.find(table => table.name === tableName).fields;

        // 获取当前页面的网址和当前时间
        const sourceUrl = window.location.href;
        const currentTime =new Date().toISOString(); // 如果只需要日期部分; new Date().toISOString(); // 将当前时间转换为 ISO 字符串, 包含时间, 这是airtable中对应列类型为日期并需要include time

        // 生成字段的 HTML，包括 来源 和 记录时间 字段
        fieldsContainer.innerHTML = fields.map(field => {
            // 检查字段名是否是 来源 或 记录时间
            let inputValue = '';
            if (field.name === '来源') {
                inputValue = sourceUrl; // 设置 来源 的默认值
            } else if (field.name === '记录时间') {
                inputValue = currentTime; // 设置 记录时间 的默认值
            }

            return `
            <div style="display: flex; align-items: center; margin-bottom: 10px;">
                <label style="flex: 0 0 100px;">${field.name}:</label>
                <input type="${field.type === 'multilineText' ? 'textarea' : 'text'}" id="${field.name}" value="${inputValue}" required style="flex: 1; margin-left: 10px;" />
            </div>
        `;
        }).join('');
    }

    // 监听数据库选择的变化
    document.getElementById('baseSelect').addEventListener('change', updateTables);
})();
