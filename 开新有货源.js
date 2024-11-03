// ==UserScript==
// @name         采集开新有商品信息并上传到 Airtable (通用版)
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  一键采集商品信息（标题和拿货价）并上传到 Airtable（通用版）
// @author       [你的名字]
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    // 获取 Airtable API 密钥和表格 ID
    const ACCESS_TOKEN = 'patbkrCcuDhqSEPik.f9945b399f40ab7dbeff15e8b436b8fa47de166bab355e6209c51c86106b4549'; // Airtable API 访问令牌
    const BASE_ID = 'appuciOCDpoyVJCHB'; // Base ID
    const TABLE_NAME = '开新有'; // Airtable 表格名称
    const IMGBB_API_KEY = '871a92f8b305b46b8fc884b518dbf717'; //  替换为你的 imgbb API key

    // 创建悬浮按钮
    const button = document.createElement('button');
    button.innerText = '采集商品并上传图片';
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

    button.addEventListener('click', async () => {
        // 获取商品信息
        let title = '';
        let price = 0;
        let sourceUrl = '';
        let seller = '';
        let pickupPoint = '';
        let imageUrls = [];

        // 尝试从常见的元素中获取信息
        const titleElement = document.querySelector('.product_title .huohao');
        if (titleElement) {
            title = titleElement.textContent.trim().replace('货号：', '');
        }

        // 获取价格
        const priceElement = document.querySelector('.price_box .sku-price');
        if (priceElement) {
            price = parseFloat(priceElement.textContent.replace(/[^0-9\.]/g, ''));
        }

        // 获取商家名称
        const sellerElement = document.querySelector('.name_left .name');
        if (sellerElement) {
            seller = sellerElement.textContent.trim();
        }

        // 获取拿货点信息 - 修改为遍历查找
        const siteRightDivs = document.querySelectorAll('.site_right div');
        siteRightDivs.forEach(div => {
            if (div.textContent.includes("拿货点")) {
                pickupPoint = div.textContent.trim().replace('拿货点：', '');
            }
        });

        // 提取图片 URL
        const productImages = document.querySelectorAll('.tb-thumb img');
        imageUrls = Array.from(productImages).map(img => img.src);

        sourceUrl = window.location.href;

        // 检查是否成功获取数据
        if (!title || isNaN(price) || !sourceUrl || !seller || !pickupPoint || imageUrls.length === 0) {
            alert('未能成功获取商品信息，请检查页面结构。');
            return;
        }

        // 上传图片到 sm.ms 并获取链接
        const uploadedImageUrls = await uploadImagesToImgbb(imageUrls);

        // 构建数据对象
        const productData = {
            '商品标题': title,
            '拿货价': price,
            '来源': sourceUrl,
            '商家': seller,
            '拿货点': pickupPoint,
            '商品图片': uploadedImageUrls.map(url => ({ url })) // 将 URL 转换为 Attachment 对象数组
        };

        // 上传数据到 Airtable
        const uploadSuccess = await uploadDataToAirtable(productData);
        if (uploadSuccess) {
            alert('商品信息成功上传到 Airtable！');
        } else {
            alert('上传到 Airtable 失败，请查看控制台了解更多信息。');
        }
    });

    // 使用 Promise.all 并行上传图片到 imgbb
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
                        const uploadedImageUrl = data.data.url;
                        console.log('Imgbb 图片 URL:', uploadedImageUrl);
                        return uploadedImageUrl;
                    } else {
                        console.error('上传失败:', data.error.message); //  imgbb 返回的错误信息在 error 对象中
                        return null; // 返回 null 表示上传失败
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

        return uploadedImageUrls.filter(url => !!url); // 过滤掉空值 (null)
    }

    // 上传数据到 Airtable
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
                return true; // 上传成功
            } else {
                console.error('Error uploading data to Airtable:', response.status);
                return false; // 上传失败
            }
        } catch (error) {
            console.error('Error uploading data to Airtable:', error);
            return false;
        }
    }
})();