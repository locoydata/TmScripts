import requests

baseId = "appRUM56yVRGrEuin"
tableIdOrName = "Warn"

# Airtable API 基础 URL
base_url = f"https://api.airtable.com/v0/meta/bases/{baseId}/tables"
#base_url = f"https://api.airtable.com/v0/{baseId}/{tableIdOrName}"
# Airtable Base ID (替换成您的 Base ID)

# Airtable Access Token (替换成您的 Personal Access Token)
access_token = "patbkrCcuDhqSEPik.f9945b399f40ab7dbeff15e8b436b8fa47de166bab355e6209c51c86106b4549"


# 设置请求头，包括授权和内容类型
headers = {
    "Authorization": f"Bearer {access_token}",
    "Content-Type": "application/json"
}

# 发送请求并解析结果
response = requests.get(base_url, headers=headers)

# 检查请求是否成功
if response.status_code == 200:
    # 打印或使用表结构数据
    schema_data = response.json()
    print("表结构数据:", schema_data)
else:
    print("请求失败:", response.status_code, response.json())
