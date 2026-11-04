# Site pictures

The site uses these two pictures. To replace one, save the new picture here with the same file name, all in lowercase.

| File name | Where it appears | Good size |
| --- | --- | --- |
| `profile_picture.jpeg` | Round profile photo on the Home, About and Contact pages, and the picture shown when the site link is shared | At least 600 x 600 pixels |
| `background.jpg` | Background behind every page. It covers the whole page and scrolls with it. | Tall, at least 2400 pixels wide, ideally around 1 MB or less |

File names must match exactly once the site is on GitHub Pages. For example, `profile_picture.JPEG` or `profile_picture.jpg` won't work.

A new profile photo may need its crop adjusted so the face sits in the circle. That setting is in the `.portrait::after` rule in `styles.css`: `180%` is the zoom and `50% 14%` is the position.

To make the background photo stronger or fainter, change the last number in the `--veil` line at the top of `styles.css`, currently `0.75`. Lower numbers show more of the photo, but make the text harder to read.

The current `background.jpg` is a fern photo from [Unsplash](https://unsplash.com/).
