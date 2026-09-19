#!/usr/bin/env python3
"""
Give a deck the floating presenter panel (Document Picture-in-Picture).

    python3 tools/add-presenter-pip.py decks/marketing/Week-3-*.html
    python3 tools/add-presenter-pip.py --all          # every deck
    python3 tools/add-presenter-pip.py --all --dry    # report, change nothing

WHY THIS EXISTS
Speaker notes cannot live inside the deck page: whatever surface the coach
shares — tab, window or screen — reaches the founders, notes and all. The decks
shipped with a pop-up presenter window, which is correct in principle but on a
single laptop screen it lands ON TOP of the deck. That is what a coach
experienced as the notes "replacing" the presentation, and why they closed it.

Document PiP is a separate always-on-top window that is NOT captured when
sharing a tab. Where the browser lacks it (Safari, older Chrome) the original
pop-up remains the fallback, so nothing regresses.

The patch is IDEMPOTENT — a deck that already has the panel is skipped, so this
can be re-run safely after decks are re-synced from source.
"""
import sys, os, re, glob

HERE  = os.path.dirname(os.path.abspath(__file__))
BLOCK = os.path.join(HERE, '_presenter_pip_block.js')

# The one-line openPresenter the decks ship with. Matched loosely on its two
# distinctive parts so trivial whitespace differences between decks don't cause
# a silent no-match — a silent no-match is the failure mode that matters here.
# Decks come in two shapes: minified one-liners and pretty-printed blocks. Same
# logic either way, so the pattern tolerates whitespace rather than assuming one.
OLD_RE = re.compile(
    r'[ \t]*function openPresenter\(\)\s*\{'
    r'.*?presenterWin\s*=\s*window\.open'
    r'.*?setTimeout\(\s*presSync\s*,\s*350\s*\)\s*;\s*\}[ \t]*\n',
    re.S)

SYNC_OLD = "  function presSync(){"
SYNC_NEW = "  function presSync(){ try{ pipSync(); }catch(e){}\n    "


def patch(path, dry=False):
    src = open(path, encoding='utf-8').read()

    if 'documentPictureInPicture' in src:
        return 'already has the panel'
    if 'function openPresenter' not in src:
        return 'SKIP — no presenter view in this deck'

    block = open(BLOCK, encoding='utf-8').read()

    new, n = OLD_RE.subn(lambda _m: block, src, count=1)
    if n != 1:
        # Refuse rather than guess. A deck whose shape differs needs a human.
        return 'FAILED — openPresenter did not match the expected shape'

    if SYNC_OLD in new and 'pipSync()' not in new.split('function presSync')[1][:80]:
        new = new.replace(SYNC_OLD, SYNC_NEW, 1)

    if dry:
        return 'would patch'
    open(path, 'w', encoding='utf-8').write(new)
    return 'patched'


def main(argv):
    dry = '--dry' in argv
    args = [a for a in argv if not a.startswith('--')]
    if '--all' in argv:
        files = sorted(glob.glob('decks/**/*.html', recursive=True))
    else:
        files = []
        for a in args:
            files.extend(sorted(glob.glob(a)))
    if not files:
        print('No decks matched.'); return 1

    counts = {}
    for f in files:
        r = patch(f, dry)
        counts[r] = counts.get(r, 0) + 1
        mark = '  ' if r in ('patched', 'would patch', 'already has the panel') else '! '
        print(f'{mark}{r:<46} {f}')
    print('\n' + '  '.join(f'{k}: {v}' for k, v in sorted(counts.items())))
    return 0 if not any(k.startswith(('FAILED', 'SKIP')) for k in counts) else 2


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
