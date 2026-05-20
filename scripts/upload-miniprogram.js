const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index++) {
    const item = argv[index];
    if (!item.startsWith('--')) continue;

    const key = item.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
    } else {
      args[key] = next;
      index++;
    }
  }
  return args;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function resolvePath(projectRoot, value) {
  if (!value) return '';
  return path.isAbsolute(value) ? value : path.resolve(projectRoot, value);
}

function printHelp() {
  console.log(`
Usage:
  npm run upload:mp -- --version 1.0.0 --desc "release note"

Options:
  --version <version>       上传版本号，默认读取 package.json version
  --desc <description>     上传备注，默认使用版本号和当前时间
  --key <path>             小程序上传密钥路径，也可用 MP_PRIVATE_KEY_PATH
  --appid <appid>          小程序 AppID，默认读取 project.config.json
  --robot <number>         上传机器人编号，默认 1
  --verbose                输出 miniprogram-ci 详细进度日志
  --skip-prod-config       不自动把 config/index.js 的 useLocal 临时改为 false

Environment:
  MP_PRIVATE_KEY_PATH      小程序上传密钥路径
  MP_UPLOAD_VERSION        上传版本号
  MP_UPLOAD_DESC           上传备注
  MP_UPLOAD_ROBOT          上传机器人编号
`);
}

function setProductionBackendConfig(projectRoot) {
  const configPath = path.join(projectRoot, 'config/index.js');
  const original = fs.readFileSync(configPath, 'utf8');
  const next = original.replace(/useLocal:\s*(true|false)/, 'useLocal: false');

  // if (next === original) {
  //   throw new Error('没有在 config/index.js 中找到 backendConfig.useLocal 配置');
  // }

  fs.writeFileSync(configPath, next);
  return () => fs.writeFileSync(configPath, original);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args.h) {
    printHelp();
    return;
  }

  const projectRoot = path.resolve(__dirname, '..');
  const projectConfigPath = path.join(projectRoot, 'project.config.json');
  const packageJsonPath = path.join(projectRoot, 'package.json');
  const projectConfig = readJson(projectConfigPath);
  const packageJson = readJson(packageJsonPath);

  const appid = args.appid || process.env.MP_APPID || projectConfig.appid;
  const privateKeyPath = resolvePath(projectRoot, args.key || process.env.MP_PRIVATE_KEY_PATH);
  const version = args.version || process.env.MP_UPLOAD_VERSION || packageJson.version;
  const desc =
    args.desc ||
    process.env.MP_UPLOAD_DESC ||
    `upload ${version} at ${new Date().toLocaleString('zh-CN', { hour12: false })}`;
  const robot = Number(args.robot || process.env.MP_UPLOAD_ROBOT || 1);
  const verbose = !!args.verbose;

  if (!appid) {
    throw new Error('缺少 appid，请检查 project.config.json 或传入 --appid');
  }
  if (!privateKeyPath) {
    throw new Error('缺少上传密钥路径，请传入 --key 或设置 MP_PRIVATE_KEY_PATH');
  }
  if (!fs.existsSync(privateKeyPath)) {
    throw new Error(`上传密钥不存在：${privateKeyPath}`);
  }

  console.log('开始上传小程序代码...');
  console.log(`AppID: ${appid}`);
  console.log(`Version: ${version}`);
  console.log(`Robot: ${robot}`);
  console.log(`Desc: ${desc}`);

  const restoreConfig = args['skip-prod-config'] ? null : setProductionBackendConfig(projectRoot);
  if (restoreConfig) {
    console.log('已临时切换 config/index.js：backendConfig.useLocal = false');
  }

  try {
    const ci = require('miniprogram-ci');
    const project = new ci.Project({
      appid,
      type: 'miniProgram',
      projectPath: projectRoot,
      privateKeyPath,
      ignores: [
        'node_modules/**/*',
        '.git/**/*',
        'backend/node_modules/**/*',
        'backend/.env',
        'backend/certs/**/*',
        'scripts/**/*',
      ],
    });

    const uploadResult = await ci.upload({
      project,
      version,
      desc,
      robot,
      setting: {
        es6: projectConfig.setting?.es6 !== false,
        minify: projectConfig.setting?.minified !== false,
        minifyJS: true,
        minifyWXML: projectConfig.setting?.minifyWXML !== false,
        minifyWXSS: projectConfig.setting?.minifyWXSS !== false,
        autoPrefixWXSS: true,
      },
      onProgressUpdate: verbose ? console.log : undefined,
    });

    console.log('上传完成。');
    if (uploadResult) {
      console.log(JSON.stringify(uploadResult, null, 2));
    }
  } finally {
    if (restoreConfig) {
      restoreConfig();
      console.log('已恢复 config/index.js 本地配置。');
    }
  }
}

main().catch((error) => {
  console.error(`上传失败：${error.message}`);
  if (String(error.message).includes('invalid ip')) {
    console.error(
      [
        '当前公网 IP 未在微信小程序代码上传白名单中。',
        '请到微信公众平台 → 开发管理 → 开发设置 → 小程序代码上传，',
        '把报错里的 IP 加入白名单，或关闭代码上传 IP 白名单后重试。',
        '如果在公司/家用网络上传，公网 IP 变化后需要重新配置；CI/CD 建议使用固定出口 IP。',
      ].join(''),
    );
  }
  process.exit(1);
});
