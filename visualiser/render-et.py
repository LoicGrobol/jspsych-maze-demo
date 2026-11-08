import json
import pathlib

from typing import TextIO

import click
import matplotlib.pyplot as plt
import numpy as np


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
    trials = [t for t in data if t["trial_type"] == "maze"]
    for t in trials:
        trial_dir = target / str(t["trial_index"])
        trial_dir.mkdir(exist_ok=True)
        for i, e in enumerate(t["events"]):
            print(e)
            # Or `[::2*(e["side"]=="left")-1]` ;)
            left_text, right_text = (
                [e["word"], e["foil"]]
                if e["side"] == "left"
                else [e["foil"], e["word"]]
            )
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
            target_right = t["saccade_targets"]["#jspsych-maze-right_display"]

            ax = plt.figure().add_subplot()

            ax.add_patch(
                plt.Rectangle(
                    (target_left["left"], target_left["bottom"]),
                    target_left["width"],
                    target_left["height"],
                    fill=False,
                )
            )

            ax.add_patch(
                plt.Rectangle(
                    (target_right["left"], target_right["bottom"]),
                    target_right["width"],
                    target_right["height"],
                    fill=False,
                )
            )

            ax.scatter(x, y)
            ax.set(title=f"{left_text} vs {right_text}")
            ax.yaxis.set_inverted(True)
            ax.figure.savefig(trial_dir / f"{i}.png")


if __name__ == "__main__":
    main()
