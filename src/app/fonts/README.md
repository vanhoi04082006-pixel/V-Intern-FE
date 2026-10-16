# Bundled fonts

Geist, Geist Mono and Caveat are served through `next/font/local`. The application keeps its existing CSS variables and typefaces; builds do not request Google Fonts CSS or font binaries. Geist is preloaded for the main UI. Mono and handwriting faces load when used.

Unmodified variable TTF files come from [google/fonts](https://github.com/google/fonts/tree/1d0e46c7933245c8180fe83e47917961c913bbdb/ofl), commit `1d0e46c7933245c8180fe83e47917961c913bbdb`. Their corresponding SIL Open Font License 1.1 and copyright notices are included beside each file. Full upstream files retain their available glyphs, including Vietnamese, rather than relying on a Latin-only subset.

| File | Upstream file | SHA-256 |
|---|---|---|
| geist.ttf | ofl/geist/Geist[wght].ttf | 73894e0448cae90a92b6c2f8732b7bb9acb7b94c418bff559dad4a18e1de9659 |
| geistmono.ttf | ofl/geistmono/GeistMono[wght].ttf | d00e590b8eb3a59acc329b2d044fd143ae935090b7da33199ebee27cc7de8196 |
| caveat.ttf | ofl/caveat/Caveat[wght].ttf | 0bdb6b660482d31531b3945849fba5916b3ef8695da7024a9e6b9ee3c4157988 |

This avoids the intermittent upstream Google-font URL parsing failure seen in CI ([Next.js issue 99114](https://github.com/vercel/next.js/issues/99114)). Loading follows the installed Next.js font guide and [official local-font API](https://nextjs.org/docs/app/getting-started/fonts#local-fonts). Updating assets requires preserving licenses, recording the new upstream revision/checksums, building and checking Vietnamese desktop/mobile rendering.
