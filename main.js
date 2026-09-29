// External Image Loader plugin
// Gives DataviewJS a safe way to load external images.

const { Plugin } = require("obsidian");
const fs = require("fs");

module.exports = class ExternalImageLoader extends Plugin {
  async onload() {
    console.log("External Image Loader: loading");

    // Keep track of created blob URLs so we can clean them up later
    this._blobUrls = new Set();

    // Expose a simple API for DataviewJS:
    // await app.plugins.plugins["external-image-loader"].api.getImageUrl("C:/full/path/to/image.jpg")
    this.api = {
      getImageUrl: async (fullPath) => {
        try {
          if (!fullPath || typeof fullPath !== "string") {
            console.warn("External Image Loader: invalid path", fullPath);
            return null;
          }

          // Normalize Windows-style paths (backslashes -> forward slashes)
          const normalizedPath = fullPath.replace(/\\/g, "/");

          // Read file as a Buffer
          const data = await fs.promises.readFile(normalizedPath);

          // Create a Blob from the Buffer
          const blob = new Blob([data]);

          // Create a blob URL and remember it so we can revoke later
          const url = URL.createObjectURL(blob);
          this._blobUrls.add(url);

          return url;
        } catch (err) {
          console.error("External Image Loader: failed to read", fullPath, err);
          return null;
        }
      },

      // Optional helper if you ever want to manually revoke a URL
      revokeUrl: (url) => {
        if (this._blobUrls.has(url)) {
          URL.revokeObjectURL(url);
          this._blobUrls.delete(url);
        }
      }
    };
  }

  onunload() {
    console.log("External Image Loader: unloading");

    // Revoke all blob URLs we created
    if (this._blobUrls) {
      for (const url of this._blobUrls) {
        try {
          URL.revokeObjectURL(url);
        } catch (e) {
          // ignore
        }
      }
      this._blobUrls.clear();
    }

    // Remove API reference
    this.api = null;
  }
};
