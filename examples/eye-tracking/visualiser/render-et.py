import json
import pathlib
from typing import TextIO

import click
import matplotlib.pyplot as plt
import numpy as np
import tol_colors as tc
from matplotlib.collections import PatchCollection


@click.command()
@click.argument("source", type=click.File("r"))
@click.argument(
    "target",
    default=pathlib.Path.cwd(),
    type=click.Path(file_okay=False, path_type=pathlib.Path, writable=True),
)
def main(source: TextIO, target: pathlib.Path):
    target.mkdir(exist_ok=True, parents=True)
    data = json.load(source)

    saccade_validate = next(t for t in data if t["trial_type"] == "saccade-validate")
    dp = saccade_validate["median_error_px"]
    trials = [t for t in data if t["trial_type"] == "maze"]
    for t in trials:
        trial_dir = target / str(t["trial_index"])
        trial_dir.mkdir(exist_ok=True)
        for i, e in enumerate(t["events"]):
            print(e)
            # Or `[::2*(e["side"]=="left")-1]` ;)
            if e["side"] == "left":
                left_text, right_text = e["word"], e["foil"]
                title = f"$\\bf{{{e['word']}}}$ vs {e['foil']}"
            else:
                left_text, right_text = e["word"], e["foil"]
                title = f"{e['foil']} vs $\\bf{{{e['word']}}}$"

            gazes = [
                g
                for g in t["saccade_data"]
                if e["display_saccade_time"] <= g["t"] <= e["response_saccade_time"]
            ]
            print(gazes)
            print()

            x = np.array([g["x"] for g in gazes])
            y = np.array([g["y"] for g in gazes])

            target_left = t["saccade_targets"]["#jspsych-maze-left_display"]

            # The plugin doesn't report its geometry right now but we know that the center of the
            # left display should be at (1/3, 1/2) of the global display
            x_max = (target_left["left"] + target_left["width"] / 2) * 3
            y_max = (target_left["top"] + target_left["height"] / 2) * 2

            ax = plt.figure().add_subplot()
            ax.set_title(title, y=-0.125)
            ax.set_xlim(0, x_max)
            # Pixel coordinates are top left to bottom right
            ax.set_ylim(y_max, 0)
            ax.xaxis.tick_top()
            ax.set_aspect("equal")

            # Can't scatter if we want an easy way to control the markers size according to the precision
            circles = [
                plt.Circle(
                    (xi, yi),
                    alpha=0.5,
                    fill=True,
                    radius=dp,
                    linewidth=None,
                )
                for xi, yi in zip(x, y)
            ]
            ax.add_collection(PatchCollection(circles, array=np.arange(len(circles))))
            ax.add_line(plt.Line2D(x, y, c="black", linewidth=0.5))

            # We don't measure the rect of each target for now, but we now their centers are at (1/3, 1/2) and (2/3, 1/2)
            ax.add_patch(
                plt.Circle((x_max / 3, y_max / 2), fill=False, linewidth=2, radius=dp)
            )
            ax.add_patch(
                plt.Circle(
                    (2 * x_max / 3, y_max / 2), fill=False, linewidth=2, radius=dp
                )
            )

            ax.figure.savefig(trial_dir / f"{i}.png", dpi=300)


if __name__ == "__main__":
    main()
