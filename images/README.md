# Site pictures

To replace a picture, save the new one here with the same file name, all in lowercase.

| File name | Where it appears | Good size |
| --- | --- | --- |
| `profile_picture.jpeg` | Round profile photo on the Home, About and Contact pages, and the picture shown when the site link is shared | At least 600 x 600 pixels |
| `background.jpg` | The original background photo. The site doesn't show it directly; the four tile files below are made from it. | At least 2400 pixels wide |
| `background-tile.webp` | Background on PCs, laptops and large tablets, in browsers that support WebP | 1920 pixels wide |
| `background-tile.jpg` | Same as above, for browsers without WebP | 1920 pixels wide |
| `background-tile-mobile.webp` | Background on phones and small tablets (screens up to 800 pixels wide), in browsers that support WebP | 1080 pixels wide |
| `background-tile-mobile.jpg` | Same as above, for browsers without WebP | 1080 pixels wide |

The background scrolls with the page. Each tile file is the photo with an upside-down copy underneath, and the site repeats the tile down the page at screen width, so the photo stays sharp on long pages and the joins blend in. The fog drifts over it, and the frosted glass panels blur it.

To change the background, make a new set of four tile files from your new photo: the photo on top and the same photo flipped upside down below it, saved at the widths above. Use the same file names. If you can't make the WebP files, delete them and remove the two `image-set(...)` lines for the background in `styles.css`; the site then uses the JPG files everywhere.

File names must match exactly once the site is on GitHub Pages. For example, `profile_picture.JPEG` or `background-tile.JPG` won't work.

A new profile photo may need its crop adjusted so the face sits in the circle. That setting is in the `.portrait::after` rule in `styles.css`: `180%` is the zoom and `50% 14%` is the position.

To make the background photo stronger or fainter, change the last number in the `--veil` line at the top of `styles.css`, currently `0.75`. Lower numbers show more of the photo, but make the text harder to read.

The current background is a fern photo from [Unsplash](https://unsplash.com/).
