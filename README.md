# 苍烬盟誓

一个可直接部署到 GitHub Pages 的原创战术 RPG 原型。游戏运行在浏览器中，无需后端或数据库。

## 运行

需要 Node.js 22.12+。

```sh
npm ci
npm run dev
```

## 发布到 GitHub Pages

将这个目录作为 GitHub 仓库根目录，推送到 `main`。在仓库的 Settings → Pages 中将 Source 设置为 GitHub Actions。随附的 `pages.yml` 会构建、检查并发布游戏。

```sh
npm run build
npm test
```

`dist/` 是完整的静态网站，可部署到任何静态托管服务。资源使用相对路径，同时兼容 `用户名.github.io/仓库名/` 和自定义域名。

## 操作

点击“举旗出阵”开始；选中小队后点击地图下达移动命令。先夺回白烽塔，再进攻黑棘堡。接敌自动交战，可暂停、集结全军及重新开始。
