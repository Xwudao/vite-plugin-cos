### vite-plugin-cos

#### Usage

Install

```bash
pnpm add vite-plugin-cos -D
```

Config

```ts
// in your vite.config.ts
const isProd = process.env.NODE_ENV === 'production';
const config = loadEnv('production', './');

{
    base: isProd ? config.VITE_COS_BASE : '/',
    plugins: [
        cos({
            bucket: config.VITE_COS_BUCKET,
            secretId: config.VITE_COS_SECRETID,
            secretKey: config.VITE_COS_SECRETKEY,
            region: config.VITE_COS_REGION,
        }),
    ];
}
```

```dotenv
# in your .env.production
VITE_COS_BASE=https://your-cos-cdn-domin.com/subdir/
VITE_COS_REGION=ap-xxx
VITE_COS_BUCKET=xxx-121212
VITE_COS_SECRETID=xxxxx
VITE_COS_SECRETKEY=xxxxx
```

Now, just coding....
