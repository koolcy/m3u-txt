# M3U ↔ TXT Cloudflare Worker

## 本地运行
```bash
npm install
npx wrangler dev
```

## 部署
```bash
npx wrangler login
npx wrangler deploy
```

部署后会得到 `*.workers.dev` 地址，也可以再绑定自定义域名。

## API
POST `/api/convert`

请求：
```json
{"mode":"m3u2txt","text":"#EXTM3U\\n#EXTINF:-1,频道1\\nhttps://example.com/a.m3u8"}
```

`mode` 可选：`m3u2txt`、`txt2m3u`。

## TXT 输入格式
推荐：
```text
频道1,https://example.com/1.m3u8
频道2,https://example.com/2.m3u8
```
也支持 `频道|地址`、`频道=地址` 和一行一个 URL。
