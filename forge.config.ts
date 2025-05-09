import { MakerSquirrel } from "@electron-forge/maker-squirrel"
import { MakerZIP } from "@electron-forge/maker-zip"
import { MakerDeb } from "@electron-forge/maker-deb"
import { MakerRpm } from "@electron-forge/maker-rpm"

export default {
  packagerConfig: {
    asar: true,
    icon: "./electron/icons/icon",
    extraResource: ["./electron/icons"],
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      setupIcon: "./electron/icons/icon.ico",
      iconUrl: "./electron/icons/icon.ico",
    }),
    new MakerZIP({}, ["darwin"]),
    new MakerRpm({}),
    new MakerDeb({}),
  ],
  plugins: [],
  hooks: {},
}
