// ==UserScript==
// @name         开新有货源
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  采集商品信息并上传到 Airtable，防止重复上传, 支持北京聚源百成网络科技站点
// @author       [思钱想厚]
// @match        *://*.k3.cn/p/*
// @match        *://*.2tong.cn/p/*
// @match        *://*.yoduo.com/p/*
// @match        *://*.bao66.cn/p/*
// @match        *://*.xingfujie.cn/p/*
// @match        *://*.juyi5.cn/p/*
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    // 获取 Airtable API 密钥和表格 ID
    const ACCESS_TOKEN = 'patbkrCcuDhqSEPik.f9945b399f40ab7dbeff15e8b436b8fa47de166bab355e6209c51c86106b4549'; // Airtable API 访问令牌
    const BASE_ID = 'appuciOCDpoyVJCHB'; // Base ID
    const TABLE_NAME = '开新有选品'; // Airtable 表格名称
    const IMGBB_API_KEY = '871a92f8b305b46b8fc884b518dbf717'; //  替换为你的 imgbb API key

    // 创建悬浮按钮
    const button = document.createElement('button');
    button.innerText = '开新有';
    button.style.position = 'fixed';
    button.style.bottom = '60px';
    button.style.right = '20px';
    button.style.zIndex = '1000';
    button.style.padding = '10px';
    button.style.backgroundColor = '#007BFF';
    button.style.color = '#fff';
    button.style.border = 'none';
    button.style.borderRadius = '5px';
    button.style.cursor = 'pointer';

    document.body.appendChild(button);

    button.addEventListener('click', async () => {
        let title = '';
        let type = '';
        let price = 0;
        let sourceUrl = '';
        let seller = '';
        let pickupPoint = '';
        let imageUrls = [];


        const now = new Date()
        //const recordTime = now.toISOString(); // 将当前时间转换为 ISO 字符串, 包含时间, 这是airtable中对应列类型为日期并需要include time
        const recordTime = now.toISOString().split('T')[0]; // 如果只需要日期部分

        const titleElement = document.querySelector('.product_title .huohao');
        if (titleElement) {
            title = titleElement.textContent.trim().replace('货号：', '');
        }

        // 获取类型
        const typeElement = document.querySelector('.special-item span:first-child'); // 选择第一个 span
        if (typeElement) {
            type = typeElement.textContent.trim().replace('类型：', ''); // 去除 "类型：" 前缀
        }

        const priceElement = document.querySelector('.price_box .sku-price');
        if (priceElement) {
            price = parseFloat(priceElement.textContent.replace(/[^0-9\.]/g, ''));
        }

        const sellerElement = document.querySelector('.name_left .name');
        if (sellerElement) {
            seller = sellerElement.textContent.trim();
        }

        const siteRightDivs = document.querySelectorAll('.site_right div');
        siteRightDivs.forEach(div => {
            if (div.textContent.includes("拿货点")) {
                pickupPoint = div.textContent.trim().replace('拿货点：', '');
            }
        });

        const productImages = document.querySelectorAll('.tb-thumb img');
        imageUrls = Array.from(productImages)
            .map(img => {
            const url = img.getAttribute('big');
            return url ? url.replace(/^http:\/\//i, 'https://') : null; // 将 HTTP 转换为 HTTPS
        })
            .filter(url => url !== null); //访问一个 HTTPS 页面，但页面中的图片资源却使用的是 HTTP 协议。浏览器出于安全考虑，会阻止这种混合内容的加载


        sourceUrl = window.location.href;

        if (!title || isNaN(price) || !sourceUrl || !seller || !pickupPoint || imageUrls.length === 0) {
            alert('未能成功获取商品信息，请检查页面结构。');
            return;
        }

        const isDuplicate = await checkDuplicateTitle(title);
        if (isDuplicate) {
            alert('该商品已存在于 Airtable 中！');
            return;
        }

        const uploadedImageUrls = await uploadImagesToImgbb(imageUrls);
        const productData = {
            '商品标题': title,
            '类型': type,
            '拿货价': price,
            '来源': sourceUrl,
            '商家': seller,
            '拿货点': pickupPoint,
            '商品图片': uploadedImageUrls.map(url => ({ url })),
            '记录时间': recordTime
        };

        // 再次检查 isDuplicate，确保上传前的验证
        if (await checkDuplicateTitle(title)) {
            alert('该商品已存在于 Airtable 中！');
            return;
        }

        const uploadSuccess = await uploadDataToAirtable(productData);
        if (uploadSuccess) {
            alert('商品信息成功上传到 Airtable！');
        } else {
            alert('上传到 Airtable 失败，请查看控制台了解更多信息。');
        }
    });

    async function checkDuplicateTitle(title) {
        try {
            // 编码后的 Airtable 查询公式
            const formula = `({商品标题} = "${title.replace(/"/g, '\\"')}")`;
            const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}?filterByFormula=${encodeURIComponent(formula)}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                return data.records.length > 0; // 如果找到重复记录，返回 true
            } else {
                console.error('检查重复数据失败:', response.statusText);
                return false;
            }
        } catch (error) {
            console.error('检查重复数据失败:', error);
            return false;
        }
    }

    async function uploadImagesToImgbb(imageUrls) {
        const uploadedImageUrls = await Promise.all(imageUrls.map(async imageUrl => {
            try {
                const response = await new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url: imageUrl,
                        responseType: 'blob',
                        onload: resolve,
                        onerror: reject,
                    });
                });

                if (response.status === 200) {
                    const file = new File([response.response], 'image.png', { type: response.response.type || 'image/png' });
                    const formData = new FormData();
                    formData.append('image', file);
                    formData.append('key', IMGBB_API_KEY);

                    const uploadResponse = await new Promise((resolve, reject) => {
                        GM_xmlhttpRequest({
                            method: 'POST',
                            url: 'https://api.imgbb.com/1/upload',
                            data: formData,
                            onload: resolve,
                            onerror: reject,
                        });
                    });

                    const data = JSON.parse(uploadResponse.responseText);
                    if (data.success) {
                        return data.data.url;
                    } else {
                        console.error('上传失败:', data.error.message);
                        return null;
                    }
                } else {
                    console.error('获取图片失败:', response.statusText);
                    return null;
                }
            } catch (error) {
                console.error('处理图片时出错:', error);
                return null;
            }
        }));

        return uploadedImageUrls.filter(url => !!url);
    }

    async function uploadDataToAirtable(productData) {
        try {
            const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fields: productData
                })
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Data uploaded to Airtable:', data);
                return true;
            } else {
                console.error('Error uploading data to Airtable:', response.statusText);
                return false;
            }
        } catch (error) {
            console.error('Error uploading data to Airtable:', error);
            return false;
        }
    }
})();
