# Maze JSPsych

Demo and documentation
[our maze jspych plugin](https://github.com/LoicGrobol/jspsych-contrib/tree/maze/packages/plugin-maze).

## How to use this

### Demos

You can test the plugin right with the hosted demos:

- [Raw plugin](https://loicgrobol.github.io/jspsych-maze-demo/examples/raw/), with all default
  settings. 
- [Standard setting](https://loicgrobol.github.io/jspsych-maze-demo/examples/base/) including group
  selection, subject instructions, and questions to check the comprehension.
- [w/ eye-tracking](https://loicgrobol.github.io/jspsych-maze-demo/examples/eye-tracking/)

All the demos are just building upon the raw one by adding functionalities with jsPsych itself. You
do not have to use jsPsych the way we do in these examples for the plugin to work, and indeed it
probably makes sense to edit the HTML files to make them fit your experiment better.

### Preparing data

TODO

### Processing output

For every sentence, the plugin outputs a report with the following shape. The interesting part is

```json
{
	"sentence": "At many banks today lending money is less lucrative than it was ten years ago",
	"events": [
		{
			"correct": true,
			"foil": "x-x-x",
			"rt": 992,
			"display_atime": 3755,
			"response_atime": 4747,
			"side": "left",
			"word": "At"
		},
		{
			"correct": true,
			"foil": "hurts",
			"rt": 707,
			"display_atime": 4848,
			"response_atime": 5555,
			"side": "left",
			"word": "many"
		},
		{
			"correct": true,
			"foil": "versa",
			"rt": 1585,
			"display_atime": 5657,
			"response_atime": 7242,
			"side": "right",
			"word": "banks"
		},
		{
			"correct": true,
			"foil": "marry",
			"rt": 619,
			"display_atime": 7344,
			"response_atime": 7963,
			"side": "left",
			"word": "today"
		},
		{
			"correct": true,
			"foil": "condone",
			"rt": 1137,
			"display_atime": 8064,
			"response_atime": 9201,
			"side": "right",
			"word": "lending"
		},
		{
			"correct": true,
			"foil": "lovely",
			"rt": 620,
			"display_atime": 9301,
			"response_atime": 9921,
			"side": "right",
			"word": "money"
		},
		{
			"correct": true,
			"foil": "me",
			"rt": 799,
			"display_atime": 10021,
			"response_atime": 10820,
			"side": "left",
			"word": "is"
		},
		{
			"correct": true,
			"foil": "fries",
			"rt": 755,
			"display_atime": 10921,
			"response_atime": 11676,
			"side": "right",
			"word": "less"
		},
		{
			"correct": true,
			"foil": "actresses",
			"rt": 663,
			"display_atime": 11777,
			"response_atime": 12440,
			"side": "right",
			"word": "lucrative"
		},
		{
			"correct": true,
			"foil": "gotta",
			"rt": 417,
			"display_atime": 12541,
			"response_atime": 12958,
			"side": "left",
			"word": "than"
		},
		{
			"correct": false,
			"foil": "my",
			"rt": 552,
			"display_atime": 13058,
			"response_atime": 13610,
			"side": "left",
			"word": "it"
		}
	],
	"trial_type": "maze",
	"trial_index": 1,
	"plugin_version": "0.0.1",
	"time_elapsed": 13326
},
```

See the documentation of the plugin for details on what is measured and how. See the documentation of jsPsych for more details on the general output format.

A complete example of output is available in the [standard setting example](https://github.com/LoicGrobol/jspsych-maze-demo/tree/main/examples/base/output-sample.json).

The
[eye-tracking example](https://github.com/LoicGrobol/jspsych-maze-demo/tree/main/examples/eye-tracking)
also has material on how to process its specific data.
