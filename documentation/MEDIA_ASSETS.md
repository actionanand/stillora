# Finding audio and video for Stillora

This guide lists useful media libraries, the checks to make before adding an asset, and the
recommended conversion settings for Stillora.

> "Free" and "royalty-free" do not mean public domain. Check the licence shown on the individual
> asset when you download it. Site terms and asset licences can change.

## Audio sources

| Source                                                        | Useful for                                                | Licence notes                                                                                                                     |
| ------------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| [Freesound](https://freesound.org/)                           | Field recordings, rain, water, wind, birds and room tones | Each file has its own Creative Commons licence. Check whether attribution and commercial use are allowed.                         |
| [Pixabay Sound Effects](https://pixabay.com/sound-effects/)   | Short ambient effects and loop ingredients                | Covered by the Pixabay Content Licence. Do not redistribute an unmodified asset as a standalone download.                         |
| [Pixabay Music](https://pixabay.com/music/)                   | Longer music and meditation tracks                        | Check the asset page and keep its download record. Some music can trigger automated Content ID claims even when use is permitted. |
| [Mixkit Sound Effects](https://mixkit.co/free-sound-effects/) | Polished ambience and effects                             | Check the licence for the item type before use; Mixkit publishes separate licences for stock media categories.                    |
| [Mixkit Music](https://mixkit.co/free-stock-music/)           | Background music and instrument tracks                    | Confirm the current Mixkit music licence and any distribution restrictions.                                                       |
| [ZapSplat](https://www.zapsplat.com/)                         | A large sound-effects catalogue                           | The free/basic licence generally requires attribution. Premium terms differ, and a smaller CC0 collection is also available.      |

Good search terms include `seamless rain loop`, `forest ambience`, `gentle lake waves`, `soft wind`,
`water dripping`, `night crickets`, `acoustic guitar ambience`, and `meditation drone`.

## Video and animation sources

| Source                                                    | Useful for                                                | Licence notes                                                                                                                                                         |
| --------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Pexels Videos](https://www.pexels.com/videos/)           | Nature, rain, forest, ocean and sky footage               | Review the Pexels licence. Do not sell or redistribute an unaltered clip as a stock asset.                                                                            |
| [Pixabay Videos](https://pixabay.com/videos/)             | Nature loops and general stock footage                    | Covered by the Pixabay Content Licence; check the asset page and prohibited uses.                                                                                     |
| [Mixkit Stock Video](https://mixkit.co/free-stock-video/) | Short cinematic backgrounds                               | Verify whether the clip uses Mixkit's Free or Restricted licence before including it.                                                                                 |
| [LottieFiles](https://lottiefiles.com/)                   | Lightweight vector animations and loading/ambient accents | Lottie assets are normally JSON or `.lottie` animations, not MP4 background video. Check the specific asset licence and use a Lottie runtime or an authorised export. |

Search for footage with limited camera movement and no visible cut at the loop point. Stillora uses
`object-fit: cover`, so important subjects should remain near the centre in both portrait and
landscape crops.

## Keep a licence record

For every downloaded asset, record:

- the original asset URL, title or ID, creator, and download date;
- the exact licence shown on that date, including a saved copy or screenshot when practical;
- the required attribution text and any purchase or subscription receipt;
- edits made by Stillora, such as trimming, looping, cropping, colour grading, or conversion; and
- whether commercial distribution and redistribution inside an app are permitted.

Keep this information in a project credits file even when attribution is not mandatory. Do not use
audio containing recognisable copyrighted music, private conversations, or unclear performer
rights.

## Audio to OGG

Stillora's bundled audio uses OGG Vorbis. The preferred offline converter is
[FFmpeg](https://ffmpeg.org/download.html), because source files do not leave the computer and the
conversion is repeatable.

Install FFmpeg in Ubuntu under WSL:

```bash
sudo apt update
sudo apt install ffmpeg
```

Convert WAV, MP3, FLAC, or another FFmpeg-supported input:

```bash
ffmpeg -i input.wav -vn -map_metadata -1 -c:a libvorbis -q:a 5 output.ogg
```

For a mono ambience where stereo positioning is unnecessary:

```bash
ffmpeg -i input.wav -vn -map_metadata -1 -ac 1 -c:a libvorbis -q:a 5 output.ogg
```

Listen to the complete result with headphones. Check for clipping and confirm the end joins the
beginning without a click or sudden level change. Do not manufacture a loop from a licensed clip
when the licence forbids modification.

[CloudConvert's OGG converter](https://cloudconvert.com/ogg-converter) is a convenient online
alternative. Do not upload confidential, unpublished, or licence-restricted source recordings to
an online converter without reviewing its privacy and retention terms.

## Video preparation

Stillora uses muted MP4 backgrounds. H.264 video without an audio track is a broadly compatible
choice:

```bash
ffmpeg -i input.mp4 -an -c:v libx264 -preset slow -crf 24 -pix_fmt yuv420p output.mp4
```

Trim first if only part of a source clip is needed. Test the loop on a real phone and avoid large
4K files when a smaller resolution still looks clean on the target display.

## Adding media to Stillora

1. Put OGG audio under `public/audio/` and MP4 video under `public/video/`.
2. Use lowercase, descriptive, hyphen-separated filenames.
3. Add or update the typed entry in `src/app/core/data/sounds.ts`.
4. Set `mixable` only when the isolated audio works as an additional layer.
5. Add incompatibility rules when the primary sound already contains the same recording.
6. Run `npm run lint`, `npm test -- --watch=false`, and `npm run build`.
7. Test play, pause, switching, mixing, looping, video synchronisation, and Android media controls
   on a physical device.
