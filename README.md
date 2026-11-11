# Shafakat Md Golam Shobhani Sayeedi

**Live site: [shafakat12.github.io/shafakat](https://shafakat12.github.io/shafakat/)**

Personal portfolio of Shafakat Md Golam Shobhani Sayeedi, a self-taught IT practitioner and former branch manager.

## Pages

| Page | File | What's on it |
| --- | --- | --- |
| [Home](https://shafakat12.github.io/shafakat/) | `index.html` | Introduction and links to each page |
| [About](https://shafakat12.github.io/shafakat/about.html) | `about.html` | Profile and key facts |
| [Experience](https://shafakat12.github.io/shafakat/experience.html) | `experience.html` | Branch Manager at Global Trade Link, 2023 to 2026 |
| [Work](https://shafakat12.github.io/shafakat/work.html) | `work.html` | Websites and home-lab projects |
| [Lab](https://shafakat12.github.io/shafakat/lab.html) | `lab.html` and `posts/` | Write-ups of projects, papers, benchmarks and experiments |
| [Skills](https://shafakat12.github.io/shafakat/skills.html) | `skills.html` | IT infrastructure and systems, web design, creative work and business |
| [Education](https://shafakat12.github.io/shafakat/education.html) | `education.html` | Honours, Kamil, Fazil, Alim and Dakhil |
| [Contact](https://shafakat12.github.io/shafakat/contact.html) | `contact.html` | Email, phone, GitHub and a message form |

## Publishing a post

Lab posts are plain HTML pages in the `posts/` folder. To publish one:

1. **Copy the template.** Copy `posts/_template.html` to `posts/YYYY-MM-DD-slug.html`, using the publish date and a few lowercase words joined by hyphens, for example `posts/2026-11-20-local-llm-benchmark.html`.
2. **Fill in the content.** Replace everything the comments mark "REPLACE": the title, description, link-preview details, type badge, date, reading time (about 220 words per minute, rounded up), summary and tags. Write the body, and delete the example parts you don't need. Delete the `noindex` line and the comment at the top.
3. **Add attachments.** Put PDFs, datasets and images in `posts/files/`, and link to them from the post as `files/your-file.pdf`.
4. **Add a card to the Lab page.** In `lab.html`, copy the example card from the comment above the list, paste it at the top of `<ol class="post-list">`, and fill it in with the same title, date, summary, tags and reading time. Set `data-type` to `project`, `paper`, `benchmark` or `experiment`, and use the matching badge.
5. **Link the neighbouring posts.** At the bottom of the new post, point Previous at the post before it. In that older post, point Next at the new one. Delete a Previous or Next link when there is no post on that side.
6. **Remove the empty-state panel.** If `lab.html` still has the "First posts are on the way." panel, delete it.

Then commit and push. Filtered views can be shared as links, like `lab.html#papers` or `lab.html#benchmarks`.

## Contact form

The form on the Contact page sends messages to my email through [Web3Forms](https://web3forms.com/), because GitHub Pages can't send email by itself.

1. Create an access key at [web3forms.com](https://web3forms.com/#start) using the email address that should receive messages. The key arrives by email.
2. In `contact.html`, put the key in the `access_key` field. It is safe to keep in public HTML.
3. Publish the site and send a test message from the live Contact page.

After a message is sent, visitors land on `message-sent.html`. Replying to a message in your inbox goes to the address the visitor entered.

## CV

The Download CV buttons use `cv/Shafakat-Sayeedi-CV.pdf`. To update it, save the new PDF over the old one with the same file name.

## Built with

Plain HTML and CSS, with no framework or build step. It adapts to phones, tablets, PCs and TVs, and uses a dark green theme. `styles.css` holds the styling for every page and `favicon.svg` is the browser tab icon. A little JavaScript adds extras that the site works without: `nav.js` runs the phone menu, `lab.js` runs the Lab filters and the Copy buttons on code, `swarm-rebuild.js` plays the page intro, and `glass-tilt.js` tilts the home page panels on desktop. See [images/README.md](images/README.md) for changing the profile photo and background picture.

## Run it locally

Open `index.html` in any browser.
