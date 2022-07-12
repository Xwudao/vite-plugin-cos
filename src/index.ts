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
  ignore?: string[];
  //remove previous assets in oss dir
  removePrevious?: boolean;
  // if existed in cos, don't upload again
  overwrite?: boolean;
};

const vitePluginUploadToCos = (options: UploadToCosOptions): PluginOption => {
  let baseConfig = '/';
  let buildConfig: BuildOptions = {};
  options = {
    removePrevious: false,
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
      const { pathname: cosBasePath, origin: cosOrigin } = new URL(baseConfig);

      const cos = new COS({
        SecretId: options.secretId,
        SecretKey: options.secretKey,
      });

      const files = await fastGlob(outDirPath + '/**/*', {
        dot: true,
        ignore: options.ignore || ['**/node_modules/**'],
      });

      if (options.removePrevious) {
        let list = await cos.getBucket({
          Bucket: options.bucket,
          Region: options.region,
          Prefix: cosBasePath.replace(/^\//, ''),
        });
        if (list.Contents.length > 0) {
          let data = await cos.deleteMultipleObject({
            Bucket: options.bucket,
            Region: options.region,
            Objects: list.Contents.map((item) => {
              return { Key: item.Key };
            }),
          });

          if (data.statusCode === 200) {
            console.log(
              color.green('[vite-plugin-upload-to-cos]'),
              'remove previous assets success',
            );
          } else {
            console.log(
              color.red('[vite-plugin-upload-to-cos]'),
              'remove previous assets failed',
            );
          }
        }
      }

      console.log('');
      console.log(color.green('[vite-plugin-upload-to-cos]'), 'upload start');
      console.log('');

      const startTime = new Date().getTime();
      for (const fileFullPath of files) {
        const filePath = fileFullPath.split(outDirPath)[1]; // eg: '/assets/vendor.bfb92b77.js'

        const cosFilePath = cosBasePath.replace(/\/$/, '') + filePath; // eg: '/base/assets/vendor.bfb92b77.js'

        const completePath = cosOrigin + cosFilePath; // eg: 'https://foo.com/base/assets/vendor.bfb92b77.js'

        const output = `${buildConfig.outDir + filePath} => ${color.green(completePath)}`;

        let canUpload = false;

        try {
          await cos.headObject({
            Bucket: options.bucket,
            Region: options.region,
            Key: cosFilePath,
          });
          console.log(
            color.gray('[vite-plugin-upload-to-cos] existed in cos: '),
            filePath,
          );
        } catch (e) {
          canUpload = true;
        }

        if (options.overwrite) {
          canUpload = true;
        }

        if (canUpload) {
          await cos.putObject({
            Bucket: options.bucket,
            Region: options.region,
            Key: cosFilePath,
            Body: fs.readFileSync(fileFullPath),
            StorageClass: 'STANDARD',
          });
          console.log(output);
        }
      }

      const duration = (new Date().getTime() - startTime) / 1000;

      console.log('cost time: ' + duration + 's');
    },
  };
};

export default vitePluginUploadToCos;
