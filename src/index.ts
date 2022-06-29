const color = require("picocolors")
const glob = require("glob")
const path = require("path")
import COS from "cos-js-sdk-v5"

const {URL} = require("url")

import {BuildOptions, normalizePath, Plugin} from "vite"

type UploadToCosOptions = {
    SecretId: string
    SecretKey: string
    Bucket: string
    ignore?: string
}

const vitePluginUploadToCos = (options: UploadToCosOptions): Plugin => {
    let baseConfig = "/"
    let buildConfig: BuildOptions = {}

    //   if (options.enabled !== void 0 && !options.enabled) {
    //     return
    //   }

    return {
        name: "vite-plugin-upload-to-cos",
        enforce: "post",
        apply: "build",
        configResolved(config) {
            baseConfig = config.base
            buildConfig = config.build
        },
        closeBundle: async () => {
            const outDirPath = normalizePath(
                path.resolve(normalizePath(buildConfig.outDir || "")),
            )

            const {pathname: ossBasePath, origin: ossOrigin} = new URL(baseConfig)

            var cos = new COS({
                SecretId: options.SecretId,
                SecretKey: options.SecretKey,
            })
            console.log(cos)
            const files = await glob.sync(outDirPath + "/**/*", {
                strict: true,
                nodir: true,
                dot: true,
                ignore: options.ignore ? options.ignore : "**/*.html",
            })

            console.log("")
            console.log("tencent cos upload start")
            console.log("")

            const startTime = new Date().getTime()
            for (const fileFullPath of files) {
                const filePath = fileFullPath.split(outDirPath)[1] // eg: '/assets/vendor.bfb92b77.js'

                const ossFilePath = ossBasePath.replace(/\/$/, "") + filePath // eg: '/base/assets/vendor.bfb92b77.js'

                const completePath = ossOrigin + ossFilePath // eg: 'https://foo.com/base/assets/vendor.bfb92b77.js'

                const output = `${buildConfig.outDir + filePath} => ${color.green(
                    completePath,
                )}`
                console.log(output)
            }

            const duration = (new Date().getTime() - startTime) / 1000

            console.log("cost time: " + duration + "s")
        },
    }
}

export default vitePluginUploadToCos