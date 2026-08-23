# Poster reference images

The reveal uses the same zero-based source images as the compiled MindAR target bundle:

- target index `0` → `poster-0.jpeg`
- target index `1` → `poster-1.jpeg`
- target index `2` → `poster-2.jpeg`

Each path is explicitly connected to its target in `src/data/artifacts.ts` through `posterImageSrc`. Keep these files visually identical to the images used to compile `public/targets/exhibition.mind`.
