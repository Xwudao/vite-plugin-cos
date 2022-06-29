import fs from 'fs-extra';
import COS from 'cos-nodejs-sdk-v5';
import { BuildOptions, PluginOption } from 'vite';
import color from 'picocolors';
import fastGlob from 'fast-glob';
import { URL } from 'url';

type UploadToCosOptions = {
  secretId: string;
  secretKey: string;
  bucket: string;
  region: string;
  replaceHtml?: boolean;
  ignore?: string[];
};

const vitePluginUploadToCos = (options: UploadToCosOptions): PluginOption => {
  let baseConfig = '/';
  let buildConfig: BuildOptions = {};
  options = {
    replaceHtml: true,
    ...options,
  };

  //   if (options.enabled !== void 0 && !options.enabled) {
  //     return
  //   }

  return {
    name: 'vite-plugin-upload-to-cos',
    enforce: 'post',
    apply: 'build',

    configResolved(config) {
      baseConfig = config.base;
      buildConfig = config.build;
    },
    closeBundle: async () => {
      // const outDirPath = normalizePath(
      //     path.resolve(normalizePath(buildConfig.outDir || "")),
      // )
      const outDirPath = buildConfig.outDir || '';
      //
      const { pathname: ossBasePath, origin: ossOrigin } = new URL(baseConfig);

      const cos = new COS({
        SecretId: options.secretId,
        SecretKey: options.secretKey,
      });

      const files = await fastGlob(outDirPath + '/**/*', {
        dot: true,
        ignore: options.ignore || ['**/node_modules/**'],
      });

      console.log('');
      console.log('tencent cos upload start');
      console.log('');

      const startTime = new Date().getTime();
      for (const fileFullPath of files) {
        const filePath = fileFullPath.split(outDirPath)[1]; // eg: '/assets/vendor.bfb92b77.js'

        const ossFilePath = ossBasePath.replace(/\/$/, '') + filePath; // eg: '/base/assets/vendor.bfb92b77.js'

        const completePath = ossOrigin + ossFilePath; // eg: 'https://foo.com/base/assets/vendor.bfb92b77.js'

        const output = `${buildConfig.outDir + filePath} => ${color.green(completePath)}`;


        await cos.putObject({
          Bucket: options.bucket,
          Region: options.region,
          Key: ossFilePath,
          Body: fs.readFileSync(fileFullPath),
          StorageClass: 'STANDARD',
          ContentLength: fs.statSync(fileFullPath).size,
        });
        console.log(output);
      }

      const duration = (new Date().getTime() - startTime) / 1000;

      console.log('cost time: ' + duration + 's');
    },
  };
};

export default vitePluginUploadToCos;
