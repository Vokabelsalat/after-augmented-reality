# Poster reference images

The runtime catalog contains 16 works with target indices `0` through `15`, following the row order in `public/exhibition.csv`. Compile the final poster images in exactly that order into `public/targets/exhibition.mind`.

The current `posterImageSrc` values in `src/data/artifacts.ts` deliberately reuse three placeholder images for the reveal UI. They are independent of MindAR's compiled reference images and can be replaced with artwork-specific paths when the final poster files are available.
